'use client';
import nextDynamic from 'next/dynamic';
import { ToastProvider } from '@/components/Toast';
import { MonthNavProvider } from '@/components/MonthNav';

const LayoutShell = nextDynamic(() => import('@/components/LayoutShell'), {
  ssr: false,
  loading: () => <></>,
});

export default function LayoutShellWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <MonthNavProvider>
        <LayoutShell>{children}</LayoutShell>
      </MonthNavProvider>
    </ToastProvider>
  );
}
