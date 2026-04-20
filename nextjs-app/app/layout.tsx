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
        {/* IBM Plex Sans Arabic — واجهة عامة (عربي) */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Plus Jakarta Sans — أرقام وعناوين إنجليزية */}
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* CSS Variables for font families */}
        <style>{`
          :root {
            --font-ibm: 'IBM Plex Sans Arabic', sans-serif;
            --font-jakarta: 'Plus Jakarta Sans', sans-serif;
          }
        `}</style>
      </head>
      <body>
        <LayoutShellWrapper sidebar={<SidebarServer />}>
          {children}
        </LayoutShellWrapper>
      </body>
    </html>
  );
}
