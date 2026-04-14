import { createClient } from '@/lib/supabase/server';
import { InviteForm } from '@/components/invite-form';
import { MemberList } from '@/components/member-list';

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id, role, workspaces(id, name, seat_limit)');

  if (!memberships || memberships.length === 0) return <p>No workspace yet.</p>;

  const ownerMembership = memberships.find((m: any) => m.role === 'owner');
  const workspace = (ownerMembership ?? memberships[0]).workspaces as any;

  const { data: members } = await supabase
    .from('workspace_members')
    .select('id, role, invited_email, joined_at, user_id, profiles(full_name)')
    .eq('workspace_id', workspace.id);

  const isOwner = !!ownerMembership;
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Team — {workspace.name}</h2>
      <MemberList members={members ?? []} canManage={isOwner} />
      {isOwner && <InviteForm workspaceId={workspace.id} seatLimit={workspace.seat_limit} currentCount={members?.length ?? 0} />}
    </div>
  );
}
