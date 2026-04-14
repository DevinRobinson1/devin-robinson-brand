import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { canAddSeat } from '@/lib/seats';
import { sendInviteEmail } from '@/lib/resend';

export const runtime = 'nodejs';

const InviteBody = z.object({
  workspaceId: z.string().uuid(),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const parsed = InviteBody.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: 'invalid body' }, { status: 400 });
  const { workspaceId, email } = parsed.data;

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!membership || membership.role !== 'owner') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: workspace } = await admin.from('workspaces').select('seat_limit, name').eq('id', workspaceId).single();
  const { count: activeCount } = await admin.from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId).not('user_id', 'is', null);
  const { count: pendingCount } = await admin.from('workspace_members')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId).is('user_id', null);

  if (!canAddSeat({
    seatLimit: workspace!.seat_limit,
    activeCount: activeCount ?? 0,
    pendingCount: pendingCount ?? 0,
  })) {
    return NextResponse.json({ error: 'seat limit reached' }, { status: 403 });
  }

  const { error: insErr } = await admin.from('workspace_members').insert({
    workspace_id: workspaceId,
    invited_email: email,
    role: 'member',
    invited_at: new Date().toISOString(),
  });
  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });

  const { data: inviterProfile } = await admin.from('profiles').select('full_name').eq('user_id', user.id).single();
  const { data: link } = await admin.auth.admin.generateLink({
    type: 'magiclink', email,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard` },
  });
  if (link?.properties?.action_link) {
    await sendInviteEmail({
      to: email,
      magicLink: link.properties.action_link,
      workspaceName: workspace!.name,
      inviterName: inviterProfile?.full_name ?? null,
    });
  }

  await admin.from('audit_log').insert({
    workspace_id: workspaceId,
    actor_user_id: user.id,
    action: 'invite.created',
    metadata: { email },
  });

  return NextResponse.json({ ok: true });
}
