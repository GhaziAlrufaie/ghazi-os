'use client';
/*
 * Ghazi OS — Topbar
 * مطابق للأصل: .topbar, .search-wrap, .search-input, .search-dropdown
 * يحتوي: عنوان الصفحة + Global Search + أزرار إجراءات
 */
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
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

  // البحث
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    // بحث في Supabase (مؤقتاً نعرض نتائج فارغة)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setShowDropdown(true);
        }
      } catch {
        setResults([]);
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

  return (
    <div className="topbar">
      <h2>{title}</h2>

      <div className="topbar-actions">
        {/* Global Search */}
        <div className="search-wrap" ref={searchRef}>
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="بحث سريع..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setShowDropdown(true); }}
          />

          {/* Dropdown */}
          <div className={`search-dropdown${showDropdown && results.length > 0 ? ' on' : ''}`}>
            {Object.keys(grouped).length === 0 && query.trim() ? (
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
                              new RegExp(query, 'gi'),
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

        {/* Custom Actions */}
        {actions}
      </div>
    </div>
  );
}
