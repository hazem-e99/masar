'use client';

import { useEffect } from 'react';
import { useToast } from '@/components/ui/Toast';

export function DemoBlockedListener() {
  const { showToast } = useToast();

  useEffect(() => {
    const onBlocked = (event: Event) => {
      const message =
        (event as CustomEvent<{ message?: string }>).detail?.message ||
        'This demo resets every 6 hours, so that change is locked. Records you create yourself can still be deleted.';
      showToast({
        type: 'warning',
        title: 'Locked in the demo',
        message,
        duration: 6000,
      });
    };
    window.addEventListener('masar:demo-read-only', onBlocked);
    return () => window.removeEventListener('masar:demo-read-only', onBlocked);
  }, [showToast]);

  return null;
}
