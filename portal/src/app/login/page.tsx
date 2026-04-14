'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';
  const [mode, setMode] = useState<'magic' | 'password'>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const supabase = createClient();
    try {
      if (mode === 'magic') {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
        });
        if (error) throw error;
        setStatus('Check your email for a magic link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = next;
      }
    } catch (err: any) {
      setStatus(err.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-semibold mb-6">Sign in</h1>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode('magic')}
          className={`px-3 py-1 rounded ${mode === 'magic' ? 'bg-black text-white' : 'bg-gray-100'}`}
        >Magic link</button>
        <button
          type="button"
          onClick={() => setMode('password')}
          className={`px-3 py-1 rounded ${mode === 'password' ? 'bg-black text-white' : 'bg-gray-100'}`}
        >Password</button>
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <input
          type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full border px-3 py-2 rounded"
        />
        {mode === 'password' && (
          <input
            type="password" required minLength={12} value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (min 12 characters)"
            className="w-full border px-3 py-2 rounded"
          />
        )}
        <button disabled={loading} className="w-full bg-black text-white py-2 rounded disabled:opacity-50">
          {loading ? 'Working…' : mode === 'magic' ? 'Send magic link' : 'Sign in'}
        </button>
      </form>
      {status && <p className="mt-4 text-sm text-gray-600">{status}</p>}
    </main>
  );
}
