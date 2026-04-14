import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AdminModeBadge } from '@/components/admin-mode-badge';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('is_admin').eq('user_id', user.id).single();
  if (!profile?.is_admin) redirect('/dashboard');

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-semibold">CAIO Portal</Link>
          <AdminModeBadge />
        </div>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin">Workspaces</Link>
          <Link href="/admin/users">Users</Link>
          <Link href="/logout">Sign out</Link>
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
