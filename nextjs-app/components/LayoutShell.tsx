'use client';
/*
 * Ghazi OS — LayoutShell
 * يستقبل sidebar كـ prop (Server Component) لتجاوز Server/Client boundary
 * يستخدم CSS classes من globals.css: .side, .main, .topbar, .month-bar
 */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Topbar from '@/components/Topbar';
import MonthNav from '@/components/MonthNav';

interface LayoutShellProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
}

// خريطة المسارات → عناوين الصفحات
const PAGE_TITLES: Record<string, string> = {
  '/': 'لوحة القيادة',
  '/leadership': 'المركز القيادي',
  '/brands': 'البراندات',
  '/tasks': 'المهام',
  '/projects': 'المشاريع',
  '/sales': 'المبيعات',
  '/finance': 'الماليات',
  '/personal': 'الشخصي',
  '/worlds': 'عوالمي',
  '/reminders': 'التذكيرات',
  '/decisions': 'القرارات',
  '/calendar': 'التقويم',
  '/performance': 'الأداء',
  '/archive': 'الأرشيف',
  '/settings': 'الإعدادات',
};

export default function LayoutShell({ children, sidebar }: LayoutShellProps) {
  const pathname = usePathname();

  // تحقق سريع من الـ cookie لتجنب flash بدون Sidebar
  // iron-session يضع الـ cookie بـ httpOnly=true لذا لا يمكن قراءتها من JS
  // نستخدم localStorage كـ cache للحالة
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    // تحقق من localStorage cache أولاً لتجنب flash
    return localStorage.getItem('ghazi_auth') === '1';
  });
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(d => {
        const loggedIn = d.isLoggedIn === true;
        setIsLoggedIn(loggedIn);
        setAuthChecked(true);
        // حفظ الحالة في localStorage كـ cache
        if (loggedIn) {
          localStorage.setItem('ghazi_auth', '1');
        } else {
          localStorage.removeItem('ghazi_auth');
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
        setAuthChecked(true);
        localStorage.removeItem('ghazi_auth');
      });
  }, []);

  // تحديد عنوان الصفحة — يبحث عن أقرب مطابقة
  const currentPath = pathname ?? '/';
  const pageTitle = (() => {
    if (PAGE_TITLES[currentPath]) return PAGE_TITLES[currentPath];
    // مطابقة جزئية (مثل /brands/123)
    for (const [path, title] of Object.entries(PAGE_TITLES)) {
      if (path !== '/' && currentPath.startsWith(path)) return title;
    }
    return 'Ghazi OS';
  })();

  // إذا لم يتم التحقق بعد ولا يوجد cache → loading skeleton
  if (!isLoggedIn && !authChecked) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg)' }}>
        <div style={{ width: 32, height: 32, border: '3px solid var(--brd)', borderTopColor: 'var(--gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
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
            {/* Topbar — ثابت في أعلى كل صفحة */}
            <Topbar title={pageTitle} />

            {/* Month Navigation Bar */}
            <MonthNav />

            {/* محتوى الصفحة */}
            {children}
          </div>
        </>
      ) : (
        <>{children}</>
      )}
    </>
  );
}
