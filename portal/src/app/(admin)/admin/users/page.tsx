import { createClient } from '@/lib/supabase/server';

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Users</h1>
      <ul className="divide-y border rounded">
        {profiles?.map((p) => (
          <li key={p.user_id} className="p-4 flex justify-between">
            <div>
              <div className="font-medium">{p.full_name ?? '—'}</div>
              <div className="text-xs text-gray-500 font-mono">{p.user_id}</div>
            </div>
            <div className="text-sm">
              {p.is_admin ? <span className="text-red-700">admin</span> : <span className="text-gray-500">client</span>}
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-gray-500 mt-4">Promotion is API-only. POST to /api/admin/users/promote with {'{'}userId{'}'}.</p>
    </div>
  );
}
