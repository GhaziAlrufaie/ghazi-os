'use client';
import nextDynamic from 'next/dynamic';
import { ToastProvider } from '@/components/Toast';
import { MonthNavProvider } from '@/components/MonthNav';
import { GlobalProviders } from '@/components/GlobalProviders';

const LayoutShell = nextDynamic(() => import('@/components/LayoutShell'), {
  ssr: false,
  loading: () => <></>,
});

interface LayoutShellWrapperProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export default function LayoutShellWrapper({ children, sidebar }: LayoutShellWrapperProps) {
  return (
    <ToastProvider>
      <MonthNavProvider>
        <GlobalProviders>
          <LayoutShell sidebar={sidebar}>{children}</LayoutShell>
        </GlobalProviders>
      </MonthNavProvider>
    </ToastProvider>
  );
}
