import { createClient } from '@/lib/supabase/server';

export default async function WorkspaceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: workspace } = await supabase.from('workspaces').select('*').eq('id', id).single();
  const { data: members } = await supabase
    .from('workspace_members')
    .select('id, role, invited_email, joined_at, profiles(full_name)')
    .eq('workspace_id', id);
  const { data: audit } = await supabase
    .from('audit_log').select('*').eq('workspace_id', id).order('created_at', { ascending: false }).limit(50);

  if (!workspace) return <p>Not found</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{workspace.name}</h1>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-gray-500">Plan</dt><dd>{workspace.plan}</dd>
        <dt className="text-gray-500">Status</dt><dd>{workspace.status}</dd>
        <dt className="text-gray-500">Seat limit</dt><dd>{workspace.seat_limit}</dd>
        <dt className="text-gray-500">Stripe customer</dt><dd>{workspace.stripe_customer_id}</dd>
        <dt className="text-gray-500">Created</dt><dd>{new Date(workspace.created_at).toLocaleString()}</dd>
      </dl>

      <section>
        <h2 className="font-semibold mb-2">Members</h2>
        <ul className="divide-y border rounded">
          {members?.map((m: any) => (
            <li key={m.id} className="p-3 text-sm">
              {m.profiles?.full_name ?? m.invited_email ?? '—'} · {m.role}{!m.joined_at && ' · pending'}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold mb-2">Recent activity</h2>
        <ul className="text-xs font-mono space-y-1">
          {audit?.map((a) => (
            <li key={a.id}>{new Date(a.created_at).toISOString()} · {a.action}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
