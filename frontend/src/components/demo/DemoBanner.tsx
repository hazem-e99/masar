'use client';

export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-50 bg-teal-800 px-4 py-2 text-center text-sm text-white"
    >
      This demo uses fictional data and resets every 6 hours.
      <span className="mx-2" dir="rtl">
        هذا العرض يستخدم بيانات وهمية ويُعاد ضبطه كل ٦ ساعات.
      </span>
    </div>
  );
}
