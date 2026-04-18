'use client';
/*
 * Ghazi OS — Sidebar
 * مطابق للأصل: light theme, IBM Plex Sans Arabic
 * CSS classes من globals.css: .side, .sn, .sn-brand, etc.
 */
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const BRANDS = [
  { id: 'b1', label: 'سيارة', color: '#007AFF' },
  { id: 'b2', label: 'ذكرني', color: '#FF9500' },
  { id: 'b3', label: 'ميكانيكي', color: '#34C759' },
  { id: 'b4', label: 'مطعم', color: '#FF3B30' },
  { id: 'b5', label: 'عقار', color: '#AF52DE' },
  { id: 'b6', label: 'استشارات', color: '#C9A84C' },
  { id: 'b7', label: 'تقنية', color: '#5AC8FA' },
  { id: 'b8', label: 'تجارة', color: '#FF2D55' },
];

const NAV_ITEMS = [
  {
    id: 'cmd',
    label: 'المركز',
    href: '/leadership',
    icon: (
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    ),
  },
  {
    id: 'brands',
    label: 'البراندات',
    href: '/brands',
    hasBrands: true,
    icon: (
      <svg viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
    ),
  },
  {
    id: 'tasks',
    label: 'المهام',
    href: '/tasks',
    icon: (
      <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
    ),
  },
  {
    id: 'projects',
    label: 'المشاريع',
    href: '/projects',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/></svg>
    ),
  },
  {
    id: 'decisions',
    label: 'القرارات',
    href: '/decisions',
    icon: (
      <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    ),
  },
  {
    id: 'sales',
    label: 'المبيعات',
    href: '/sales',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
    ),
  },
  {
    id: 'personal',
    label: 'الشخصي',
    href: '/personal',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    ),
  },
  {
    id: 'worlds',
    label: 'عوالمي',
    href: '/worlds',
    icon: (
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
    ),
  },
  {
    id: 'finance',
    label: 'الماليات',
    href: '/finance',
    icon: (
      <svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
    ),
  },
  {
    id: 'calendar',
    label: 'التقويم',
    href: '/calendar',
    icon: (
      <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
    ),
  },
  {
    id: 'performance',
    label: 'الأداء',
    href: '/performance',
    icon: (
      <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
    ),
  },
  {
    id: 'inbox',
    label: 'الوارد',
    href: '/inbox',
    icon: (
      <svg viewBox="0 0 24 24"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></svg>
    ),
  },
  {
    id: 'team',
    label: 'الفريق',
    href: '/team',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
    ),
  },
  {
    id: 'reminders',
    label: 'التذكيرات',
    href: '/reminders',
    icon: (
      <svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
    ),
  },
  {
    id: 'settings',
    label: 'الإعدادات',
    href: '/settings',
    icon: (
      <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [brandsOpen, setBrandsOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="side">
      {/* Logo */}
      <div className="side-logo">
        <div className="logo-box">G</div>
        <div className="logo-txt">
          <h1>Ghazi OS</h1>
          <div className="sub">نظام إدارة الأعمال</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="side-nav">
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === '/'
            ? pathname === '/'
            : (pathname ?? '').startsWith(item.href);

          if (item.hasBrands) {
            return (
              <div key={item.id}>
                <div
                  className={`sn-brands-hdr${isActive ? ' on' : ''}`}
                  onClick={() => setBrandsOpen(!brandsOpen)}
                >
                  <span style={{ width: 16, height: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  <span className={`sn-chevron${brandsOpen ? ' open' : ''}`}>▾</span>
                </div>
                <div
                  className="sn-brand-group"
                  style={{ maxHeight: brandsOpen ? `${BRANDS.length * 36}px` : '0' }}
                >
                  {BRANDS.map((brand) => (
                    <Link
                      key={brand.id}
                      href={`/brands/${brand.id}`}
                      className={`sn-brand${(pathname ?? '').includes(`/brands/${brand.id}`) ? ' on' : ''}`}
                    >
                      <span className="dot" style={{ backgroundColor: brand.color }} />
                      <span>{brand.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`sn${isActive ? ' on' : ''}`}
            >
              <span style={{ width: 16, height: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="side-foot">
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 10px',
            background: 'none',
            border: '1px solid var(--brd)',
            borderRadius: '6px',
            color: 'var(--txt3)',
            fontSize: '11px',
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'all 0.15s',
            textAlign: 'right',
            marginBottom: '4px',
          }}
          onMouseEnter={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = 'rgba(255,59,48,0.06)';
            b.style.color = 'var(--danger)';
            b.style.borderColor = 'rgba(255,59,48,0.2)';
          }}
          onMouseLeave={(e) => {
            const b = e.currentTarget as HTMLButtonElement;
            b.style.background = 'none';
            b.style.color = 'var(--txt3)';
            b.style.borderColor = 'var(--brd)';
          }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 13, height: 13, stroke: 'currentColor', fill: 'none', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', flexShrink: 0 }}>
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          <span>تسجيل الخروج</span>
        </button>
        <div style={{ fontSize: 9, color: 'var(--txt3)', textAlign: 'center', marginTop: 4 }}>
          Ghazi OS v2.0 — 2025
        </div>
      </div>
    </aside>
  );
}
