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
  '/employees': 'الفريق',
  '/inbox': 'صندوق الوارد',
  '/events': 'الفعاليات',
  '/reports': 'التقارير',
  '/settings': 'الإعدادات',
};

export default function LayoutShell({ children, sidebar }: LayoutShellProps) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    fetch('/api/auth/check')
      .then(r => r.json())
      .then(d => setIsLoggedIn(d.isLoggedIn === true))
      .catch(() => setIsLoggedIn(false));
  }, []);

  if (isLoggedIn === null) {
    return <>{children}</>;
  }

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
