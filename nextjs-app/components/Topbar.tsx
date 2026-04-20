'use client';
/*
 * Ghazi OS — Topbar (Studio Theme: شريط علوي بطابع المكتب الخشبي)
 * branch: studio-theme-v1
 * عنوان بـ Playfair + بحث بخط Caveat مائل + زر إضافة ذهبي
 */
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGlobal } from '@/components/GlobalProviders';

interface TopbarProps {
  title: string;
  actions?: React.ReactNode;
}

interface SearchResult {
  type: 'brand' | 'task' | 'project' | 'decision';
  id: string;
  title: string;
  meta?: string;
  href: string;
  icon: string;
}

export default function Topbar({ title, actions }: TopbarProps) {
  const router = useRouter();
  const { openQuickAdd } = useGlobal();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // إغلاق الـ dropdown عند النقر خارجه
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Ctrl+K
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // البحث مع debounce 300ms
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      setNoResults(false);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          const r = data.results || [];
          setResults(r);
          setNoResults(r.length === 0);
          setShowDropdown(true);
        }
      } catch {
        setResults([]);
        setNoResults(true);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  function handleResultClick(result: SearchResult) {
    router.push(result.href);
    setQuery('');
    setShowDropdown(false);
  }

  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {});

  const typeLabels: Record<string, string> = {
    brand: 'البراندات',
    task: 'المهام',
    project: 'المشاريع',
    decision: 'القرارات',
  };

  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return (
    <div className="topbar" style={{
      background: 'linear-gradient(180deg, rgba(247,236,214,0.06), rgba(247,236,214,0.02))',
      borderBottom: '1px solid rgba(247,236,214,0.1)',
    }}>
      {/* Title */}
      <h2 style={{
        fontFamily: 'var(--font-playfair, serif)',
        color: '#E8BC6F',
        fontWeight: 600,
        fontSize: 18,
        letterSpacing: '0.02em',
      }}>
        {title}
      </h2>

      <div className="topbar-actions">
        {/* Global Search */}
        <div className="search-wrap" ref={searchRef} style={{ position: 'relative' }}>
          <span className="search-icon" style={{ color: 'rgba(247,236,214,0.4)' }}>
            {isSearching ? '⏳' : '🔍'}
          </span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="ابحث في المكتب... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setQuery(''); setShowDropdown(false); } }}
            style={{
              background: 'rgba(247,236,214,0.06)',
              border: '1px solid rgba(247,236,214,0.15)',
              color: '#F7ECD6',
              fontFamily: 'var(--font-caveat, cursive)',
              fontStyle: 'italic',
              fontSize: 15,
            }}
          />

          {/* Dropdown */}
          <div
            className={`search-dropdown${showDropdown ? ' on' : ''}`}
            style={{
              background: 'linear-gradient(135deg, #FBF3DF 0%, #F0E2BC 100%)',
              border: '1px solid rgba(212,160,85,0.4)',
              borderRadius: 4,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              color: '#2B1810',
            }}
          >
            {isSearching ? (
              <div className="search-empty" style={{ fontFamily: 'var(--font-caveat, cursive)', color: '#5A4028' }}>جاري البحث...</div>
            ) : noResults ? (
              <div className="search-empty" style={{ fontFamily: 'var(--font-caveat, cursive)', color: '#5A4028' }}>لا توجد نتائج لـ &quot;{query}&quot;</div>
            ) : (
              Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <div className="search-group-label" style={{
                    fontFamily: 'var(--font-cormorant, serif)',
                    fontStyle: 'italic',
                    color: '#9C7231',
                    borderBottom: '1px dashed rgba(212,160,85,0.3)',
                  }}>
                    {typeLabels[type] || type}
                  </div>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="search-item"
                      onClick={() => handleResultClick(item)}
                      style={{ color: '#2B1810' }}
                    >
                      <span className="search-item-icon">{item.icon}</span>
                      <div className="search-item-body">
                        <div
                          className="search-item-title"
                          style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 16, color: '#2B1810' }}
                          dangerouslySetInnerHTML={{
                            __html: item.title.replace(
                              new RegExp(escapeRegex(query), 'gi'),
                              (m) => `<mark style="background:rgba(212,160,85,0.4);color:#3D2817;border-radius:2px">${m}</mark>`
                            ),
                          }}
                        />
                        {item.meta && (
                          <div className="search-item-meta" style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', color: '#8B6F42' }}>{item.meta}</div>
                        )}
                      </div>
                      <span className="search-item-badge" style={{
                        background: 'rgba(212,160,85,0.2)',
                        color: '#9C7231',
                        fontFamily: 'var(--font-cormorant, serif)',
                        fontStyle: 'italic',
                        borderRadius: 3,
                      }}>
                        {typeLabels[item.type]}
                      </span>
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Add Button */}
        <button
          onClick={openQuickAdd}
          title="إضافة سريعة (Ctrl+N)"
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: '1px solid rgba(212,160,85,0.4)',
            background: 'rgba(212,160,85,0.1)',
            color: '#E8BC6F',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
            fontFamily: 'var(--font-playfair, serif)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,85,0.25)';
            (e.currentTarget as HTMLElement).style.borderColor = '#D4A055';
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'rgba(212,160,85,0.1)';
            (e.currentTarget as HTMLElement).style.borderColor = 'rgba(212,160,85,0.4)';
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
          }}
        >
          +
        </button>

        {/* Custom Actions */}
        {actions}
      </div>
    </div>
  );
}
