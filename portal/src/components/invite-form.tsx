'use client';
import { useState } from 'react';

export function InviteForm({ workspaceId, seatLimit, currentCount }: {
  workspaceId: string; seatLimit: number; currentCount: number;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const atLimit = currentCount >= seatLimit;

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const res = await fetch('/api/invites', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ workspaceId, email }),
    });
    const body = await res.json();
    setStatus(res.ok ? 'Invite sent.' : body.error ?? 'Invite failed.');
    setLoading(false);
    if (res.ok) setEmail('');
  }

  return (
    <form onSubmit={invite} className="flex gap-2 items-start">
      <input
        type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
        placeholder="teammate@company.com" disabled={atLimit}
        className="flex-1 border px-3 py-2 rounded"
      />
      <button disabled={atLimit || loading} className="bg-black text-white px-4 py-2 rounded disabled:opacity-50">
        {atLimit ? `Seat limit (${seatLimit})` : 'Invite'}
      </button>
      {status && <p className="w-full text-sm text-gray-600">{status}</p>}
    </form>
  );
}
