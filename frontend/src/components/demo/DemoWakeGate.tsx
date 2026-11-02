'use client';

import { useEffect, useState } from 'react';
import { getBackendOrigin } from '@/lib/backend-url';

const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export function DemoWakeGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(!DEMO);
  const [showWake, setShowWake] = useState(false);

  useEffect(() => {
    if (!DEMO) return;
    let cancelled = false;
    const reveal = window.setTimeout(() => {
      if (!cancelled) setShowWake(true);
    }, 800);

    const ping = async () => {
      while (!cancelled) {
        try {
          const res = await fetch(`${getBackendOrigin()}/api/Demo/status`, {
            cache: 'no-store',
          });
          if (res.ok) {
            if (!cancelled) setReady(true);
            return;
          }
        } catch {
          // The free host is still waking.
        }
        await new Promise((resolve) => window.setTimeout(resolve, 3000));
      }
    };

    void ping();
    return () => {
      cancelled = true;
      window.clearTimeout(reveal);
    };
  }, []);

  if (!ready && showWake) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-teal-700 border-t-transparent" />
          <p className="text-lg font-semibold text-slate-900">
            Waking the demo server, about 1 minute
          </p>
          <p className="text-sm text-slate-600" dir="rtl">
            جارٍ تشغيل الخادم التجريبي، حوالي دقيقة واحدة
          </p>
        </div>
      </div>
    );
  }

  if (!ready) return <div className="min-h-screen bg-background" />;
  return <>{children}</>;
}
