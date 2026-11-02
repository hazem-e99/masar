'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getApiErrorMessage } from '@/lib/apiError';

const PASSWORD = 'Masar-demo-1';

const ACCOUNTS = [
  { label: 'Admin', email: 'admin@demo.example.com' },
  { label: 'Movement manager', email: 'manager@demo.example.com' },
  { label: 'Conductor', email: 'conductor@demo.example.com' },
  { label: 'Driver', email: 'driver@demo.example.com' },
  { label: 'Student', email: 'student@demo.example.com' },
];

export function DemoLoginPanel({ onSignedIn }: { onSignedIn: () => void }) {
  const { login } = useAuth();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null;

  const signIn = async (email: string) => {
    setError('');
    setBusy(email);
    try {
      await login(email, PASSWORD, true);
      onSignedIn();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-teal-200 bg-teal-50 p-4">
      <p className="text-sm font-semibold text-teal-900">Try a demo account</p>
      <p className="mt-1 text-xs text-teal-800">
        One password for every role: {PASSWORD}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {ACCOUNTS.map((account) => (
          <button
            key={account.email}
            type="button"
            disabled={busy !== null}
            onClick={() => signIn(account.email)}
            className="rounded-lg bg-white px-3 py-2 text-sm font-medium text-teal-900 shadow-sm hover:bg-teal-100 disabled:opacity-60"
          >
            {busy === account.email ? 'Signing in…' : account.label}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
