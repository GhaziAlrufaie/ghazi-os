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

  // الحالة الأولية: نفترض أن المستخدم مسجل دخول (optimistic)
  // إذا لم يكن مسجلاً، سيُعاد توجيهه من الـ middleware/server
  // هذا يمنع flash بدون Sidebar
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
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
        // إذا تأكد أنه غير مسجل دخول → عرض المحتوى فقط (صفحة login)
        <>{children}</>
      )}
    </>
  );
}
