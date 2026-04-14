'use client';
import { useState } from 'react';

export function WelcomeBanner({ planDisplayName }: { planDisplayName: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="rounded-md border border-orange-200 bg-orange-50 p-4 mb-6 flex justify-between">
      <div>
        <h2 className="font-medium">Welcome to your CAIO portal</h2>
        <p className="text-sm text-gray-700">You&apos;re on the <strong>{planDisplayName}</strong> plan.</p>
      </div>
      <button onClick={() => setDismissed(true)} className="text-sm">Dismiss</button>
    </div>
  );
}
