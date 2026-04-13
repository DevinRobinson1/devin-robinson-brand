import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export function serviceClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export function anonClient(accessToken?: string): SupabaseClient {
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false },
      global: accessToken ? { headers: { Authorization: `Bearer ${accessToken}` } } : undefined,
    }
  );
  return client;
}

export async function resetDb() {
  const svc = serviceClient();
  // Clean order: children first
  await svc.from('audit_log').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await svc.from('workspace_members').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await svc.from('webhook_events').delete().neq('stripe_event_id', '');
  await svc.from('workspaces').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  // Delete any auth users
  const { data: users } = await svc.auth.admin.listUsers();
  for (const u of users?.users ?? []) {
    await svc.auth.admin.deleteUser(u.id);
  }
}

export async function createAuthUser(email: string): Promise<string> {
  const svc = serviceClient();
  const { data, error } = await svc.auth.admin.createUser({
    email, email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error('no user');
  await svc.from('profiles').insert({ user_id: data.user.id, full_name: email });
  return data.user.id;
}

export async function signInAs(email: string): Promise<string> {
  const svc = serviceClient();
  const { data, error } = await svc.auth.admin.generateLink({
    type: 'magiclink', email,
  });
  if (error || !data.properties?.hashed_token) throw error ?? new Error('no token');
  const anon = anonClient();
  const { data: session, error: err2 } = await anon.auth.verifyOtp({
    email, token_hash: data.properties.hashed_token, type: 'magiclink',
  });
  if (err2 || !session.session) throw err2 ?? new Error('no session');
  return session.session.access_token;
}
