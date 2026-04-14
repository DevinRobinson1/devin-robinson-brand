import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AdminWorkspacesPage() {
  const supabase = await createClient();
  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, plan, status, created_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Workspaces</h1>
      <div className="border rounded divide-y">
        {workspaces?.map((w) => (
          <Link key={w.id} href={`/admin/workspaces/${w.id}`} className="block p-4 hover:bg-gray-50">
            <div className="font-medium">{w.name}</div>
            <div className="text-sm text-gray-500">{w.plan} · {w.status}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
