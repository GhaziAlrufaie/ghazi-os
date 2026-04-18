import type { Metadata } from 'next';
import './globals.css';
import LayoutShellWrapper from '@/components/LayoutShellWrapper';
import SidebarServer from '@/components/SidebarServer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ghazi OS',
  description: 'نظام إدارة الأعمال',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <LayoutShellWrapper sidebar={<SidebarServer />}>
          {children}
        </LayoutShellWrapper>
      </body>
    </html>
  );
}
