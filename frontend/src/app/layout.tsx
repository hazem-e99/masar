import type { Metadata } from 'next';
import { Inter, Cairo } from 'next/font/google';
import './globals.css';

import { AuthProvider } from '@/hooks/useAuth';
import { ToastProvider } from '@/components/ui/Toast';
import ConsoleSilencer from '@/components/layout/ConsoleSilencer';
import ThemeInitializer from '@/components/layout/ThemeInitializer';
import LayoutShell from '@/components/layout/LayoutShell';
import I18nProvider from '@/components/providers/I18nProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cookies } from 'next/headers'
import { brand } from '@/config/brand';
import { DemoBanner } from '@/components/demo/DemoBanner';
import { DemoBlockedListener } from '@/components/demo/DemoBlockedListener';
import { DemoWakeGate } from '@/components/demo/DemoWakeGate';

const inter = Inter({ subsets: ['latin'] });
const cairo = Cairo({ subsets: ['arabic'] });

export const metadata: Metadata = {
  title: `${brand.nameAr} - نظام إدارة النقل`,
  description: 'نظام لإدارة رحلات الحافلات والحجوزات',
  icons: {
    icon: brand.logo,
    shortcut: brand.logo,
    apple: brand.logo,
  },
};



export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value as 'en' | 'ar') || 'en'
  const dir = lang === 'ar' ? 'rtl' : 'ltr'
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  return (
    <html lang={lang} dir={dir}>
      <body className={`${lang === 'ar' ? cairo.className : inter.className}${demo ? ' demo-mode' : ''}`}>
        <ErrorBoundary>
          <AuthProvider>
            <ToastProvider>
              <DemoBlockedListener />
              <ConsoleSilencer />
              <ThemeInitializer />
              <I18nProvider initialLang={lang}>
                <DemoBanner />
                <DemoWakeGate>
                  <LayoutShell>{children}</LayoutShell>
                </DemoWakeGate>
              </I18nProvider>
            </ToastProvider>
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
