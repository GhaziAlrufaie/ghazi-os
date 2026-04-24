'use client';
/*
 * Ghazi OS — Sidebar (Sunrise Energy Theme)
 * branch: studio-theme-v1
 * خلفية بيضاء كريمية دافئة + تمييز بالكورال + أيقونات ملونة
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/components/SidebarContext';

interface Brand {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface SidebarProps {
  brands?: Brand[];
}

const NAV_GROUPS = [
  {
    label: 'القيادة',
    items: [
      { id: 'cmd', label: 'المركز', href: '/leadership', icon: '🧭' },
      { id: 'decisions', label: 'القرارات', href: '/decisions', icon: '⚖️' },
    ],
  },
  {
    label: 'الأعمال',
    items: [
      { id: 'brands', label: 'البراندات', href: '/brands', hasBrands: true, icon: '🏷' },
      { id: 'tasks', label: 'المهام', href: '/tasks', icon: '✅' },
      { id: 'projects', label: 'المشاريع', href: '/projects', icon: '📁' },
      { id: 'sales', label: 'المبيعات', href: '/sales', icon: '📈' },
      { id: 'finance', label: 'الماليات', href: '/finance', icon: '💰' },
    ],
  },
  {
    label: 'الحياة',
    items: [
      { id: 'personal', label: 'الشخصي', href: '/personal', icon: '👤' },
      { id: 'worlds', label: 'عوالمي', href: '/worlds', icon: '🌍' },
      { id: 'calendar', label: 'التقويم', href: '/calendar', icon: '📅' },
      { id: 'reminders', label: 'التذكيرات', href: '/reminders', icon: '🔔' },
    ],
  },
  {
    label: 'التحليل',
    items: [
      { id: 'performance', label: 'الأداء', href: '/performance', icon: '📊' },
      { id: 'settings', label: 'الإعدادات', href: '/settings', icon: '⚙️' },
    ],
  },
];

const DAYS_AR = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

function getTodayStr() {
  const today = new Date();
  return `${DAYS_AR[today.getDay()]} ${today.getDate()} ${MONTHS_AR[today.getMonth()]}`;
}

export default function Sidebar({ brands = [] }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [brandsOpen, setBrandsOpen] = useState(false);
  const { collapsed, setCollapsed } = useSidebar();
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    setDateStr(getTodayStr());
    if ((pathname ?? '').startsWith('/brands')) setBrandsOpen(true);
  }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="side" style={{
      background: '#FFFBF5',
      borderLeft: collapsed ? 'none' : '1px solid #F0E6D6',
      boxShadow: '2px 0 12px rgba(255,107,107,0.06)',
      width: collapsed ? '0px' : '220px',
      minWidth: collapsed ? '0px' : '220px',
      overflow: 'hidden',
      transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), min-width 0.3s cubic-bezier(0.4,0,0.2,1), border 0.3s ease',
    }}>
      {/* Inner wrapper keeps content at 220px so it slides out cleanly */}
      <div style={{ width: '220px', height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Close Button */}
      <button
        onClick={() => setCollapsed(true)}
        style={{ position: 'absolute', top: '16px', left: '12px', background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 50, fontSize: '12px', fontWeight: 'bold', transition: 'all 0.2s', flexShrink: 0 }}
        title="طي القائمة"
      >
        ❯
      </button>
      {/* Logo */}
      <div style={{
        margin: '16px 12px 12px',
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #FF6B6B 0%, #FFB085 50%, #FFD93D 100%)',
        borderRadius: 16,
        direction: 'rtl',
        boxShadow: '0 4px 16px rgba(255,107,107,0.25)',
      }}>
        <div style={{
          fontFamily: 'var(--font-jakarta, sans-serif)',
          fontSize: 18,
          fontWeight: 800,
          color: 'white',
          letterSpacing: '-0.5px',
        }}>
          Ghazi OS
        </div>
        <div style={{
          fontFamily: 'var(--font-ibm, sans-serif)',
          fontSize: 11,
          color: 'rgba(255,255,255,0.85)',
          marginTop: 2,
          fontWeight: 500,
        }}>
          {dateStr || 'نظام إدارة الأعمال'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="side-nav" style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Group Label */}
            <div style={{
              padding: '10px 16px 4px',
              fontSize: 10,
              fontWeight: 700,
              color: '#C4C8D4',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              fontFamily: 'var(--font-ibm, sans-serif)',
              direction: 'rtl',
            }}>
              {group.label}
            </div>

            {group.items.map((item) => {
              const isActive = item.href === '/'
                ? pathname === '/'
                : (pathname ?? '').startsWith(item.href);

              if ('hasBrands' in item && item.hasBrands) {
                return (
                  <div key={item.id}>
                    <div
                      onClick={() => setBrandsOpen(!brandsOpen)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 16px',
                        cursor: 'pointer',
                        direction: 'rtl',
                        background: isActive ? '#FFE3E3' : 'transparent',
                        borderRight: isActive ? '3px solid #FF6B6B' : '3px solid transparent',
                        transition: 'all 0.2s',
                        color: isActive ? '#E84545' : '#5A5F73',
                        fontFamily: 'var(--font-ibm, sans-serif)',
                        fontSize: 13,
                        fontWeight: isActive ? 600 : 500,
                        borderRadius: '0 0 0 0',
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = '#FFF8F0';
                          (e.currentTarget as HTMLElement).style.color = '#E84545';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = '#5A5F73';
                        }
                      }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span style={{
                        fontSize: 10,
                        transform: brandsOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                        display: 'inline-block',
                        color: '#C4C8D4',
                      }}>▾</span>
                    </div>
                    <div style={{
                      maxHeight: brandsOpen ? `${brands.length * 34 + 8}px` : '0',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease',
                    }}>
                      {brands.length === 0 ? (
                        <div style={{ padding: '6px 32px', fontSize: 11, color: '#C4C8D4', fontFamily: 'var(--font-ibm, sans-serif)' }}>لا توجد براندات</div>
                      ) : (
                        brands.map((brand) => {
                          const isBrandActive = (pathname ?? '').includes(`/brands/${brand.id}`);
                          return (
                            <Link
                              key={brand.id}
                              href={`/brands/${brand.id}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '6px 16px 6px 16px',
                                paddingRight: 36,
                                textDecoration: 'none',
                                direction: 'rtl',
                                background: isBrandActive ? '#FFF8F0' : 'transparent',
                                borderRight: `3px solid ${isBrandActive ? brand.color : 'transparent'}`,
                                transition: 'all 0.15s',
                                color: isBrandActive ? '#2D3142' : '#8B8F9F',
                                fontSize: 12,
                                fontFamily: 'var(--font-ibm, sans-serif)',
                                fontWeight: isBrandActive ? 600 : 400,
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: brand.color, flexShrink: 0, display: 'inline-block' }} />
                              <span>{brand.id === 'x17747068433191tevy' ? '💡 مختبر الأفكار (HQ)' : `${brand.icon} ${brand.name}`}</span>
                            </Link>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 16px',
                    textDecoration: 'none',
                    direction: 'rtl',
                    background: isActive ? '#FFE3E3' : 'transparent',
                    borderRight: isActive ? '3px solid #FF6B6B' : '3px solid transparent',
                    transition: 'all 0.2s',
                    color: isActive ? '#E84545' : '#5A5F73',
                    fontFamily: 'var(--font-ibm, sans-serif)',
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = '#FFF8F0';
                      (e.currentTarget as HTMLElement).style.color = '#E84545';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = '#5A5F73';
                    }
                  }}
                >
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid #F0E6D6',
      }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '9px 12px',
            background: '#FFF8F0',
            border: '1px solid #F0E6D6',
            borderRadius: 12,
            color: '#8B8F9F',
            fontSize: 12,
            fontFamily: 'var(--font-ibm, sans-serif)',
            cursor: 'pointer',
            transition: 'all 0.2s',
            direction: 'rtl',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = '#FFE3E3';
            b.style.color = '#E84545';
            b.style.borderColor = '#FF6B6B';
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = '#FFF8F0';
            b.style.color = '#8B8F9F';
            b.style.borderColor = '#F0E6D6';
          }}
        >
          <span>🚪</span>
          <span>تسجيل الخروج</span>
        </button>
      </div>
      </div>
    </aside>
  );
}
