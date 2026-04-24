'use client';
/*
 * Ghazi OS — LayoutShell
 * يستقبل sidebar كـ prop (Server Component) لتجاوز Server/Client boundary
 * يستخدم CSS classes من globals.css: .side, .main, .topbar, .month-bar
 * 
 * ملاحظة: لا يحتاج auth check هنا — الـ middleware يتولى الحماية
 * الـ Sidebar يظهر دائماً عند تحميل الصفحة
 */
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

  // صفحة تسجيل الدخول — لا تحتاج Sidebar
  const isLoginPage = currentPath === '/login';

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Orbs */}
      <div className="orb o1" />
      <div className="orb o2" />

      {/* Sidebar */}
      {sidebar}

      {/* Main Content */}
      <div className="main">
        {/* Topbar — مخفي في /leadership لأن الترويسة المخصصة تكفي */}
        {currentPath !== '/leadership' && !currentPath.startsWith('/brands/') && <Topbar title={pageTitle} />}

        {/* Month Navigation Bar — مخفي في /leadership */}
        {currentPath !== '/leadership' && !currentPath.startsWith('/brands/') && <MonthNav />}

        {/* محتوى الصفحة */}
        {children}
      </div>
    </>
  );
}
