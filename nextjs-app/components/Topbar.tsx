'use client';
/*
 * Ghazi OS — Topbar (Sunrise Energy Theme)
 * branch: studio-theme-v1
 * خلفية بيضاء كريمية + عنوان داكن + بحث بحدود كورال + زر + مشرق
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

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
      background: '#FFFBF5',
      borderBottom: '1px solid #F0E6D6',
      boxShadow: '0 2px 8px rgba(255,107,107,0.04)',
    }}>
      {/* Title */}
      <h2 style={{
        fontFamily: 'var(--font-ibm, sans-serif)',
        color: '#2D3142',
        fontWeight: 700,
        fontSize: 18,
        letterSpacing: '-0.3px',
      }}>
        {title}
      </h2>

      <div className="topbar-actions">
        {/* Global Search */}
        <div className="search-wrap" ref={searchRef} style={{ position: 'relative' }}>
          <span className="search-icon" style={{ color: '#C4C8D4' }}>
            {isSearching ? '⏳' : '🔍'}
          </span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="ابحث... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setQuery(''); setShowDropdown(false); } }}
            style={{
              background: '#FFF8F0',
              border: '1px solid #F0E6D6',
              color: '#2D3142',
              fontFamily: 'var(--font-ibm, sans-serif)',
              fontSize: 13,
            }}
          />

          {/* Dropdown */}
          <div
            className={`search-dropdown${showDropdown ? ' on' : ''}`}
            style={{
              background: 'white',
              border: '1px solid #F0E6D6',
              borderRadius: 16,
              boxShadow: '0 8px 24px rgba(255,107,107,0.1)',
              color: '#2D3142',
            }}
          >
            {isSearching ? (
              <div className="search-empty" style={{ color: '#8B8F9F' }}>جاري البحث...</div>
            ) : noResults ? (
              <div className="search-empty" style={{ color: '#8B8F9F' }}>لا توجد نتائج لـ &quot;{query}&quot;</div>
            ) : (
              Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <div className="search-group-label" style={{
                    color: '#FF6B6B',
                    borderBottom: '1px solid #F0E6D6',
                    fontFamily: 'var(--font-ibm, sans-serif)',
                    fontWeight: 700,
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>
                    {typeLabels[type] || type}
                  </div>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="search-item"
                      onClick={() => handleResultClick(item)}
                      style={{ color: '#2D3142' }}
                    >
                      <span className="search-item-icon">{item.icon}</span>
                      <div className="search-item-body">
                        <div
                          className="search-item-title"
                          style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, color: '#2D3142' }}
                          dangerouslySetInnerHTML={{
                            __html: item.title.replace(
                              new RegExp(escapeRegex(query), 'gi'),
                              (m) => `<mark style="background:#FFE3E3;color:#E84545;border-radius:4px;padding:0 2px">${m}</mark>`
                            ),
                          }}
                        />
                        {item.meta && (
                          <div className="search-item-meta" style={{ color: '#8B8F9F' }}>{item.meta}</div>
                        )}
                      </div>
                      <span className="search-item-badge" style={{
                        background: '#FFE3E3',
                        color: '#E84545',
                        borderRadius: 8,
                        fontFamily: 'var(--font-ibm, sans-serif)',
                        fontWeight: 600,
                        fontSize: 10,
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
            width: 34,
            height: 34,
            borderRadius: 10,
            border: 'none',
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FFB085 100%)',
            color: 'white',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            flexShrink: 0,
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(255,107,107,0.3)',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 20px rgba(255,107,107,0.4)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(255,107,107,0.3)';
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
