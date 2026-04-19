'use client';
import { ToastProvider } from '@/components/Toast';
import { MonthNavProvider } from '@/components/MonthNav';
import { GlobalProviders } from '@/components/GlobalProviders';
import LayoutShell from '@/components/LayoutShell';

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
