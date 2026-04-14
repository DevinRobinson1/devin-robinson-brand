'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/browser';

export default function ProfilePage() {
  const supabase = createClient();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('profiles').select('full_name').eq('user_id', user.id).single();
      setFullName(data?.full_name ?? '');
    })();
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('profiles').update({ full_name: fullName }).eq('user_id', user.id);
    setStatus(error ? error.message : 'Saved.');
  }

  async function setPw(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 12) { setStatus('Password must be at least 12 characters.'); return; }
    const { error } = await supabase.auth.updateUser({ password });
    setStatus(error ? error.message : 'Password updated.');
    setPassword('');
  }

  return (
    <div className="max-w-md space-y-8">
      <section>
        <h2 className="text-lg font-semibold mb-2">Profile</h2>
        <form onSubmit={saveProfile} className="space-y-2">
          <input value={fullName} onChange={(e) => setFullName(e.target.value)}
            placeholder="Full name" className="w-full border px-3 py-2 rounded" />
          <button className="bg-black text-white px-4 py-2 rounded">Save</button>
        </form>
      </section>
      <section>
        <h2 className="text-lg font-semibold mb-2">Set password</h2>
        <form onSubmit={setPw} className="space-y-2">
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="New password (min 12)" className="w-full border px-3 py-2 rounded" minLength={12} />
          <button className="bg-black text-white px-4 py-2 rounded">Update password</button>
        </form>
      </section>
      {status && <p className="text-sm text-gray-600">{status}</p>}
    </div>
  );
}
