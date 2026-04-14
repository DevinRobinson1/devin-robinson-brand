'use client';

type Member = {
  id: string; role: string; invited_email: string | null;
  joined_at: string | null; user_id: string | null;
  profiles: { full_name: string | null } | null;
};

export function MemberList({ members, canManage }: { members: Member[]; canManage: boolean }) {
  async function remove(id: string) {
    if (!confirm('Remove this member?')) return;
    await fetch(`/api/members/${id}`, { method: 'DELETE' });
    window.location.reload();
  }
  async function revoke(id: string) {
    await fetch(`/api/invites/${id}`, { method: 'DELETE' });
    window.location.reload();
  }

  return (
    <ul className="divide-y border rounded">
      {members.map((m) => (
        <li key={m.id} className="p-3 flex justify-between">
          <div>
            <div className="font-medium">{m.profiles?.full_name ?? m.invited_email ?? '—'}</div>
            <div className="text-xs text-gray-500">{m.role}{!m.user_id && ' · pending'}</div>
          </div>
          {canManage && m.role !== 'owner' && (
            m.user_id
              ? <button onClick={() => remove(m.id)} className="text-red-600 text-sm">Remove</button>
              : <button onClick={() => revoke(m.id)} className="text-gray-600 text-sm">Revoke</button>
          )}
        </li>
      ))}
    </ul>
  );
}
