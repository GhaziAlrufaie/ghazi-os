'use client';
/*
 * Ghazi OS — Topbar
 * مطابق للأصل: .topbar, .search-wrap, .search-input, .search-dropdown
 * يحتوي: عنوان الصفحة + Global Search (Ctrl+K) + Quick Add (Ctrl+N) + أزرار إجراءات
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

  // تجميع النتائج حسب النوع
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
    <div className="topbar">
      <h2>{title}</h2>

      <div className="topbar-actions">
        {/* Global Search */}
        <div className="search-wrap" ref={searchRef} style={{ position: 'relative' }}>
          <span className="search-icon">{isSearching ? '⏳' : '🔍'}</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="بحث سريع... (Ctrl+K)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
            onKeyDown={(e) => { if (e.key === 'Escape') { setQuery(''); setShowDropdown(false); } }}
          />

          {/* Dropdown */}
          <div className={`search-dropdown${showDropdown ? ' on' : ''}`}>
            {isSearching ? (
              <div className="search-empty">جاري البحث...</div>
            ) : noResults ? (
              <div className="search-empty">لا توجد نتائج لـ &quot;{query}&quot;</div>
            ) : (
              Object.entries(grouped).map(([type, items]) => (
                <div key={type}>
                  <div className="search-group-label">{typeLabels[type] || type}</div>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="search-item"
                      onClick={() => handleResultClick(item)}
                    >
                      <span className="search-item-icon">{item.icon}</span>
                      <div className="search-item-body">
                        <div
                          className="search-item-title"
                          dangerouslySetInnerHTML={{
                            __html: item.title.replace(
                              new RegExp(escapeRegex(query), 'gi'),
                              (m) => `<mark class="search-highlight">${m}</mark>`
                            ),
                          }}
                        />
                        {item.meta && (
                          <div className="search-item-meta">{item.meta}</div>
                        )}
                      </div>
                      <span className="search-item-badge">{typeLabels[item.type]}</span>
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
            width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--brd)',
            background: 'var(--bg2)', color: 'var(--txt2)', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'border-color .15s, color .15s', flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold-b)';
            (e.currentTarget as HTMLElement).style.color = 'var(--gold)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--brd)';
            (e.currentTarget as HTMLElement).style.color = 'var(--txt2)';
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
