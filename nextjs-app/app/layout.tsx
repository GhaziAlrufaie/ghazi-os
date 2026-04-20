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
        {/* IBM Plex Sans Arabic — واجهة عامة */}
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Playfair Display — عناوين رئيسية */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600&display=swap"
          rel="stylesheet"
        />
        {/* Cormorant Garamond — نصوص ثانوية مائلة */}
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap"
          rel="stylesheet"
        />
        {/* Caveat — خط يدوي للتفاصيل */}
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        {/* CSS Variables for font families */}
        <style>{`
          :root {
            --font-playfair: 'Playfair Display', Georgia, serif;
            --font-cormorant: 'Cormorant Garamond', Georgia, serif;
            --font-caveat: 'Caveat', cursive;
            --font-ibm: 'IBM Plex Sans Arabic', sans-serif;
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
