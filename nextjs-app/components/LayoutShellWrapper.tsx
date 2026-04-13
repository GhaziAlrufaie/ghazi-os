'use client';
import nextDynamic from 'next/dynamic';

const LayoutShell = nextDynamic(() => import('@/components/LayoutShell'), {
  ssr: false,
  loading: () => <></>,
});

export default function LayoutShellWrapper({ children }: { children: React.ReactNode }) {
  return <LayoutShell>{children}</LayoutShell>;
}
