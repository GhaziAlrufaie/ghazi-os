/*
 * Ghazi OS — Legendary Edition
 * Root Layout: Aurora + Noise + Cursor Glow + Sidebar
 */
import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import CursorGlow from '@/components/CursorGlow';
import { getSession } from '@/lib/session';

export const metadata: Metadata = {
  title: 'Ghazi OS',
  description: 'نظام إدارة الأعمال',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const isLoggedIn = session.isLoggedIn === true;

  return (
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@200;300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {/* طبقة Aurora الحية */}
        <div className="aurora-layer" aria-hidden="true" />

        {/* طبقة Noise الحبيبية */}
        <div className="noise-layer" aria-hidden="true" />

        {/* هالة الماوس الذهبية */}
        <CursorGlow />

        {isLoggedIn ? (
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              {children}
            </main>
          </div>
        ) : (
          <>{children}</>
        )}
      </body>
    </html>
  );
}
