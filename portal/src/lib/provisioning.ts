import { createAdminClient } from '@/lib/supabase/admin';
import { PLAN_SEAT_LIMITS, type PlanId } from '@/lib/plans';
import type { ParsedCheckout } from '@/lib/webhook-parser';

export type ProvisionResult = {
  workspaceId: string;
  userId: string;
  isNewUser: boolean;
};

export async function provisionWorkspaceFromCheckout(
  parsed: ParsedCheckout,
  plan: PlanId
): Promise<ProvisionResult> {
  const admin = createAdminClient();
  const seatLimit = PLAN_SEAT_LIMITS[plan];

  let userId: string;
  let isNewUser = false;
  const { data: existing } = await admin.auth.admin.listUsers();
  const found = existing?.users.find((u) => u.email === parsed.email);
  if (found) {
    userId = found.id;
  } else {
    const { data, error } = await admin.auth.admin.createUser({
      email: parsed.email, email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error('createUser failed');
    userId = data.user.id;
    isNewUser = true;
  }

  await admin.from('profiles').upsert({
    user_id: userId,
    full_name: parsed.fullName,
  }, { onConflict: 'user_id' });

  const { data: workspace, error: wsErr } = await admin.from('workspaces').insert({
    name: parsed.companyName,
    plan,
    seat_limit: seatLimit,
    stripe_customer_id: parsed.stripeCustomerId,
    stripe_subscription_id: parsed.stripeSubscriptionId,
    status: 'active',
  }).select().single();
  if (wsErr || !workspace) throw wsErr ?? new Error('workspace insert failed');

  const { error: memErr } = await admin.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: userId,
    role: 'owner',
    joined_at: new Date().toISOString(),
  });
  if (memErr) throw memErr;

  await admin.from('audit_log').insert({
    workspace_id: workspace.id,
    actor_user_id: userId,
    action: 'workspace.provisioned',
    metadata: {
      plan,
      stripe_customer_id: parsed.stripeCustomerId,
      is_new_user: isNewUser,
    },
  });

  return { workspaceId: workspace.id, userId, isNewUser };
}

export async function applySubscriptionUpdate(
  stripeSubscriptionId: string,
  newPlan: PlanId
): Promise<void> {
  const admin = createAdminClient();
  const seatLimit = PLAN_SEAT_LIMITS[newPlan];
  await admin.from('workspaces').update({
    plan: newPlan, seat_limit: seatLimit,
  }).eq('stripe_subscription_id', stripeSubscriptionId);
}

export async function markSubscriptionCanceled(stripeSubscriptionId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from('workspaces').update({
    status: 'canceled',
  }).eq('stripe_subscription_id', stripeSubscriptionId);
}
