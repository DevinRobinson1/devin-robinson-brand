import { createClient } from '@/lib/supabase/server';
import { WelcomeBanner } from '@/components/welcome-banner';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces(id, name, plan, status, updated_at)')
    .order('created_at', { ascending: false });

  if (!memberships || memberships.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Your account is being set up</h1>
        <p className="text-gray-600 mt-2">Refresh in a few seconds. If you paid more than a minute ago and still see this, email devin@fchiefaio.com.</p>
      </div>
    );
  }

  const latest = memberships[0] as any;
  const workspace = latest.workspaces;

  return (
    <div>
      <WelcomeBanner planDisplayName={workspace.plan} />
      <h1 className="text-2xl font-semibold">{workspace.name}</h1>
      <p className="text-gray-600 mt-2">Status: {workspace.status}</p>
      <p className="text-gray-600 mt-6">The full client dashboard arrives in the next release. For now, this page confirms your account is set up.</p>
    </div>
  );
}
