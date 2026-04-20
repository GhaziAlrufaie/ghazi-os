'use client';
/*
 * Ghazi OS — Sidebar (Studio Theme: رف خشبي فاخر)
 * branch: studio-theme-v1
 * خلفية خشب داكن + لوحة ذهبية + nav items بلون الورق الكريمي
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

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
      {
        id: 'cmd',
        label: 'المركز',
        href: '/leadership',
        icon: '⌚',
      },
      {
        id: 'decisions',
        label: 'القرارات',
        href: '/decisions',
        icon: '⚖️',
      },
    ],
  },
  {
    label: 'الأعمال',
    items: [
      {
        id: 'brands',
        label: 'البراندات',
        href: '/brands',
        hasBrands: true,
        icon: '🏷',
      },
      {
        id: 'tasks',
        label: 'المهام',
        href: '/tasks',
        icon: '✅',
      },
      {
        id: 'projects',
        label: 'المشاريع',
        href: '/projects',
        icon: '📁',
      },
      {
        id: 'sales',
        label: 'المبيعات',
        href: '/sales',
        icon: '📈',
      },
      {
        id: 'finance',
        label: 'الماليات',
        href: '/finance',
        icon: '💰',
      },
    ],
  },
  {
    label: 'الحياة',
    items: [
      {
        id: 'personal',
        label: 'الشخصي',
        href: '/personal',
        icon: '👤',
      },
      {
        id: 'worlds',
        label: 'عوالمي',
        href: '/worlds',
        icon: '🌍',
      },
      {
        id: 'calendar',
        label: 'التقويم',
        href: '/calendar',
        icon: '📅',
      },
      {
        id: 'reminders',
        label: 'التذكيرات',
        href: '/reminders',
        icon: '🔔',
      },
    ],
  },
  {
    label: 'التحليل',
    items: [
      {
        id: 'performance',
        label: 'الأداء',
        href: '/performance',
        icon: '📊',
      },
      {
        id: 'settings',
        label: 'الإعدادات',
        href: '/settings',
        icon: '⚙️',
      },
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
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    setDateStr(getTodayStr());
    // فتح البراندات تلقائياً إذا كنا في صفحة براند
    if ((pathname ?? '').startsWith('/brands')) setBrandsOpen(true);
  }, [pathname]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="side" style={{
      background: `
        repeating-linear-gradient(
          92deg,
          rgba(0,0,0,0.25) 0px, rgba(0,0,0,0.25) 1px,
          transparent 1px, transparent 4px,
          rgba(0,0,0,0.1) 4px, rgba(0,0,0,0.1) 5px,
          transparent 5px, transparent 14px
        ),
        repeating-linear-gradient(
          88deg,
          rgba(107,74,47,0.08) 0px, rgba(107,74,47,0.08) 2px,
          transparent 2px, transparent 20px
        ),
        linear-gradient(180deg, #3D2817 0%, #4A2F1B 40%, #3D2817 100%)
      `,
      boxShadow: 'inset -4px 0 12px rgba(0,0,0,0.4), 4px 0 16px rgba(0,0,0,0.3)',
      borderLeft: 'none',
    }}>
      {/* Logo Plaque */}
      <div style={{
        margin: '14px 10px 10px',
        background: 'linear-gradient(135deg, #D4A055 0%, #9C7231 50%, #D4A055 100%)',
        borderRadius: 6,
        padding: '10px 14px',
        position: 'relative',
        boxShadow: '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
        direction: 'rtl',
      }}>
        {/* مسامير الزوايا */}
        <span style={{ position: 'absolute', top: 5, right: 5, width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'block' }} />
        <span style={{ position: 'absolute', top: 5, left: 5, width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'block' }} />
        <span style={{ position: 'absolute', bottom: 5, right: 5, width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'block' }} />
        <span style={{ position: 'absolute', bottom: 5, left: 5, width: 5, height: 5, borderRadius: '50%', background: 'rgba(255,255,255,0.5)', display: 'block' }} />
        <div style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 18, fontWeight: 600, color: '#3D2817', letterSpacing: '0.05em' }}>
          Ghazi OS
        </div>
        <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 11, color: 'rgba(61,40,23,0.7)', marginTop: 2 }}>
          {dateStr || 'نظام إدارة الأعمال'}
        </div>
      </div>

      {/* Navigation */}
      <nav className="side-nav" style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {/* Group Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px 4px',
              direction: 'rtl',
            }}>
              <div style={{ flex: 1, height: 1, borderTop: '1px dashed rgba(212,160,85,0.3)' }} />
              <span style={{
                fontFamily: 'var(--font-caveat, cursive)',
                fontSize: 11,
                color: 'rgba(212,160,85,0.7)',
                whiteSpace: 'nowrap',
              }}>
                {group.label}
              </span>
              <div style={{ flex: 1, height: 1, borderTop: '1px dashed rgba(212,160,85,0.3)' }} />
            </div>

            {group.items.map((item) => {
              const isActive = item.href === '/'
                ? pathname === '/'
                : (pathname ?? '').startsWith(item.href);

              if (item.hasBrands) {
                return (
                  <div key={item.id}>
                    <div
                      onClick={() => setBrandsOpen(!brandsOpen)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '7px 14px',
                        cursor: 'pointer',
                        direction: 'rtl',
                        background: isActive ? 'rgba(212,160,85,0.18)' : 'transparent',
                        borderRight: isActive ? '3px solid #D4A055' : '3px solid transparent',
                        transition: 'all 0.2s',
                        color: isActive ? '#E8BC6F' : 'rgba(247,236,214,0.85)',
                        fontFamily: 'var(--font-ibm, sans-serif)',
                        fontSize: 12,
                        fontWeight: isActive ? 600 : 400,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,85,0.1)';
                          (e.currentTarget as HTMLElement).style.color = '#E8BC6F';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          (e.currentTarget as HTMLElement).style.background = 'transparent';
                          (e.currentTarget as HTMLElement).style.color = 'rgba(247,236,214,0.85)';
                        }
                      }}
                    >
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      <span style={{
                        fontSize: 10,
                        transform: brandsOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                        display: 'inline-block',
                        color: 'rgba(212,160,85,0.6)',
                      }}>▾</span>
                    </div>
                    <div style={{
                      maxHeight: brandsOpen ? `${brands.length * 34 + 8}px` : '0',
                      overflow: 'hidden',
                      transition: 'max-height 0.3s ease',
                    }}>
                      {brands.length === 0 ? (
                        <div style={{ padding: '6px 28px', fontSize: 11, color: 'rgba(247,236,214,0.4)', fontFamily: 'var(--font-ibm, sans-serif)' }}>لا توجد براندات</div>
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
                                padding: '6px 14px 6px 14px',
                                paddingRight: 28,
                                textDecoration: 'none',
                                direction: 'rtl',
                                background: isBrandActive ? 'rgba(212,160,85,0.12)' : 'transparent',
                                borderRight: `3px solid ${isBrandActive ? brand.color : 'transparent'}`,
                                transition: 'all 0.15s',
                                color: isBrandActive ? '#E8BC6F' : 'rgba(247,236,214,0.7)',
                                fontSize: 11,
                                fontFamily: 'var(--font-ibm, sans-serif)',
                              }}
                            >
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: brand.color, flexShrink: 0, display: 'inline-block' }} />
                              <span>{brand.icon} {brand.name}</span>
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
                    gap: 8,
                    padding: '7px 14px',
                    textDecoration: 'none',
                    direction: 'rtl',
                    background: isActive ? 'rgba(212,160,85,0.18)' : 'transparent',
                    borderRight: isActive ? '3px solid #D4A055' : '3px solid transparent',
                    transition: 'all 0.2s',
                    color: isActive ? '#E8BC6F' : 'rgba(247,236,214,0.85)',
                    fontFamily: 'var(--font-ibm, sans-serif)',
                    fontSize: 12,
                    fontWeight: isActive ? 600 : 400,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,85,0.1)';
                      (e.currentTarget as HTMLElement).style.color = '#E8BC6F';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.currentTarget as HTMLElement).style.background = 'transparent';
                      (e.currentTarget as HTMLElement).style.color = 'rgba(247,236,214,0.85)';
                    }
                  }}
                >
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '10px 10px 12px',
        borderTop: '1px solid rgba(212,160,85,0.2)',
      }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            padding: '7px 10px',
            background: 'rgba(139,30,30,0.15)',
            border: '1px solid rgba(139,30,30,0.3)',
            borderRadius: 4,
            color: 'rgba(247,236,214,0.6)',
            fontSize: 11,
            fontFamily: 'var(--font-ibm, sans-serif)',
            cursor: 'pointer',
            transition: 'all 0.15s',
            direction: 'rtl',
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = 'rgba(139,30,30,0.3)';
            b.style.color = '#F7ECD6';
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = 'rgba(139,30,30,0.15)';
            b.style.color = 'rgba(247,236,214,0.6)';
          }}
        >
          <span>🚪</span>
          <span>خروج</span>
        </button>
        <div style={{
          fontFamily: 'var(--font-cormorant, serif)',
          fontStyle: 'italic',
          fontSize: 10,
          color: 'rgba(212,160,85,0.4)',
          textAlign: 'center',
          marginTop: 6,
        }}>
          Ghazi OS — Studio
        </div>
      </div>
    </aside>
  );
}
