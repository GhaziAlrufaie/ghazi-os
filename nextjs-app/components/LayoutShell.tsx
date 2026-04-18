'use client';
/*
 * Ghazi OS — LayoutShell
 * يستقبل sidebar كـ prop (Server Component) لتجاوز Server/Client boundary
 * يستخدم CSS classes من globals.css: .side, .main
 */
import { useEffect, useState } from 'react';

interface LayoutShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

export default function LayoutShell({ children, sidebar }: LayoutShellProps) {
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
          {sidebar}
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
