'use client';
/*
 * Ghazi OS — LayoutShell
 * يستخدم CSS classes من globals.css: .side, .main
 */
import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(d => setIsLoggedIn(d.isLoggedIn === true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  if (isLoggedIn === null) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Orbs */}
      <div className="orb o1" />
      <div className="orb o2" />

      {isLoggedIn ? (
        <>
          <Sidebar />
          <div className="main">
            {children}
          </div>
        </>
      ) : (
        <>{children}</>
      )}
    </>
  );
}
