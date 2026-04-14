import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen">
      <header className="border-b px-6 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="font-semibold">CAIO Portal</Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/settings/team">Team</Link>
          <Link href="/settings/profile">Profile</Link>
          <Link href="/settings/billing">Billing</Link>
          <Link href="/logout">Sign out</Link>
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
