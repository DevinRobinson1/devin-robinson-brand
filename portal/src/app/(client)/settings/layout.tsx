import Link from 'next/link';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-8">
      <aside className="w-48 shrink-0">
        <nav className="flex flex-col gap-2 text-sm">
          <Link href="/settings/profile">Profile</Link>
          <Link href="/settings/team">Team</Link>
          <Link href="/settings/billing">Billing</Link>
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
