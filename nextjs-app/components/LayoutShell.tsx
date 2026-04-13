'use client';
/*
 * Ghazi OS — Legendary Edition
 * LayoutShell: Client Component يتحقق من الجلسة عبر API
 */
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import CursorGlow from '@/components/CursorGlow';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(d => setIsLoggedIn(d.isLoggedIn === true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  // حالة التحميل: نعرض الـ children مباشرة (صفحة login ستظهر)
  if (isLoggedIn === null) {
    return <>{children}</>;
  }

  return (
    <>
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
    </>
  );
}
