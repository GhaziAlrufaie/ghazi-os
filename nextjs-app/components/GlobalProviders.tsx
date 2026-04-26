'use client';
// Ghazi OS — Global Providers
// يوفر: Quick Add Modal + Keyboard Shortcuts + Undo Stack
// يُلف كل الصفحات من LayoutShellWrapper
import {
  createContext, useContext, useState, useCallback, useEffect, useRef,
  type ReactNode,
} from 'react';
import { useToast } from '@/components/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────
type UndoAction = {
  id: string;
  label: string;
  undo: () => Promise<void>;
  timestamp: number;
};

interface GlobalContextType {
  // Quick Add
  openQuickAdd: () => void;
  // Undo
  pushUndo: (action: Omit<UndoAction, 'id' | 'timestamp'>) => void;
  // Search focus
  focusSearch: () => void;
}

const GlobalContext = createContext<GlobalContextType>({
  openQuickAdd: () => {},
  pushUndo: () => {},
  focusSearch: () => {},
});

export function useGlobal() {
  return useContext(GlobalContext);
}

// ─── Undo Toast ───────────────────────────────────────────────────────────────
interface UndoToastItem {
  id: string;
  label: string;
  undo: () => Promise<void>;
  timer: ReturnType<typeof setTimeout>;
}

// ─── Quick Add Modal ──────────────────────────────────────────────────────────
function QuickAddModal({ onClose }: { onClose: () => void }) {
  const options = [
    { icon: '📋', label: 'مهمة جديدة',   href: '/tasks',     key: '1' },
    { icon: '📁', label: 'مشروع جديد',   href: '/projects',  key: '2' },
    { icon: '⚖️', label: 'قرار جديد',    href: '/decisions', key: '3' },
    { icon: '💡', label: 'فكرة شخصية',   href: '/personal',  key: '4' },
  ];

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      const opt = options.find((o) => o.key === e.key);
      if (opt) { window.location.href = opt.href; onClose(); }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-bg on" onClick={onClose}>
      <div
        className="modal-box"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 420, padding: '28px 24px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--txt)', margin: 0 }}>إضافة سريعة</h2>
          <p style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 4 }}>اختر نوع العنصر الجديد</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {options.map((opt) => (
            <a
              key={opt.key}
              href={opt.href}
              onClick={onClose}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                padding: '20px 16px', borderRadius: 14, border: '1px solid var(--brd)',
                background: 'var(--card)', cursor: 'pointer', textDecoration: 'none',
                transition: 'border-color .15s, background .15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--gold-b)';
                (e.currentTarget as HTMLElement).style.background = 'var(--gold-dim)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--brd)';
                (e.currentTarget as HTMLElement).style.background = 'var(--card)';
              }}
            >
              <span style={{ fontSize: 28 }}>{opt.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{opt.label}</span>
              <span style={{ fontSize: 10, color: 'var(--txt3)', background: 'var(--bg2)', padding: '2px 6px', borderRadius: 6 }}>
                {opt.key}
              </span>
            </a>
          ))}
        </div>
        <p style={{ fontSize: 11, color: 'var(--txt3)', textAlign: 'center', marginTop: 16, marginBottom: 0 }}>
          اضغط <kbd style={{ background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>Esc</kbd> للإغلاق
        </p>
      </div>
    </div>
  );
}

// ─── Shortcuts Help Modal ─────────────────────────────────────────────────────
function ShortcutsModal({ onClose }: { onClose: () => void }) {
  const shortcuts = [
    { keys: 'Ctrl+K', label: 'بحث عام' },
    { keys: 'Ctrl+N', label: 'إضافة سريعة' },
    { keys: 'Ctrl+Z', label: 'تراجع عن آخر عملية' },
    { keys: '/', label: 'تركيز على البحث' },
    { keys: '?', label: 'عرض الاختصارات' },
    { keys: 'Esc', label: 'إغلاق Modal/Panel' },
  ];
  return (
    <div className="modal-bg on" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>⌨️ اختصارات لوحة المفاتيح</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {shortcuts.map((s) => (
            <div key={s.keys} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: 'var(--txt)' }}>{s.label}</span>
              <kbd style={{
                background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 6,
                padding: '3px 8px', fontSize: 11, color: 'var(--txt2)', fontFamily: 'monospace',
              }}>{s.keys}</kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Undo Toast Component ─────────────────────────────────────────────────────
function UndoToastContainer({ items, onUndo, onDismiss }: {
  items: UndoToastItem[];
  onUndo: (id: string) => void;
  onDismiss: (id: string) => void;
}) {
  if (items.length === 0) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 80, right: 24, zIndex: 600,
      display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
    }}>
      {items.map((item) => (
        <div key={item.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--card)', border: '1px solid var(--brd)',
          borderRadius: 10, padding: '10px 14px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          fontSize: 13, color: 'var(--txt)',
          animation: 'slideInRight .2s ease',
        }}>
          <span>🗑 {item.label}</span>
          <button
            onClick={() => onUndo(item.id)}
            style={{
              fontSize: 12, fontWeight: 700, color: 'var(--gold)',
              background: 'var(--gold-dim)', border: '1px solid var(--gold-b)',
              borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            تراجع
          </button>
          <button
            onClick={() => onDismiss(item.id)}
            style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 14 }}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Main Provider ────────────────────────────────────────────────────────────
export function GlobalProviders({ children }: { children: ReactNode }) {
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [undoItems, setUndoItems] = useState<UndoToastItem[]>([]);
  const handleCloseQuickAdd = useCallback(() => setShowQuickAdd(false), []);
  const handleCloseShortcuts = useCallback(() => setShowShortcuts(false), []);
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // ── Keyboard Shortcuts ──
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const isMac = navigator.platform.includes('Mac');
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      // Ctrl+K — Global Search
      if (ctrl && e.key === 'k') {
        e.preventDefault();
        const inp = document.querySelector<HTMLInputElement>('.search-input');
        if (inp) { inp.focus(); inp.select(); }
        return;
      }
      // Ctrl+N — Quick Add
      if (ctrl && e.key === 'n') {
        e.preventDefault();
        setShowQuickAdd(true);
        return;
      }
      // Ctrl+Z — Undo
      if (ctrl && e.key === 'z') {
        e.preventDefault();
        setUndoItems((prev) => {
          if (prev.length === 0) return prev;
          const last = prev[prev.length - 1];
          clearTimeout(last.timer);
          last.undo().then(() => toast('تم التراجع بنجاح', 'ok'));
          return prev.slice(0, -1);
        });
        return;
      }
      // / — focus search (not in input)
      if (e.key === '/' && !isInput) {
        e.preventDefault();
        const inp = document.querySelector<HTMLInputElement>('.search-input');
        if (inp) inp.focus();
        return;
      }
      // ? — show shortcuts
      if (e.key === '?' && !isInput) {
        setShowShortcuts(true);
        return;
      }
      // Esc — close modals
      if (e.key === 'Escape') {
        setShowQuickAdd(false);
        setShowShortcuts(false);
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toast]);

  // ── Undo Stack ──
  const pushUndo = useCallback((action: Omit<UndoAction, 'id' | 'timestamp'>) => {
    const id = `undo_${Date.now()}`;
    const timer = setTimeout(() => {
      setUndoItems((prev) => prev.filter((i) => i.id !== id));
    }, 5000);
    setUndoItems((prev) => {
      // max 5 items
      const next = [...prev.slice(-4), { id, label: action.label, undo: action.undo, timer }];
      return next;
    });
  }, []);

  const handleUndo = useCallback((id: string) => {
    setUndoItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) {
        clearTimeout(item.timer);
        item.undo().then(() => toast('تم التراجع بنجاح', 'ok'));
      }
      return prev.filter((i) => i.id !== id);
    });
  }, [toast]);

  const handleDismiss = useCallback((id: string) => {
    setUndoItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) clearTimeout(item.timer);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const focusSearch = useCallback(() => {
    const inp = document.querySelector<HTMLInputElement>('.search-input');
    if (inp) inp.focus();
  }, []);

  return (
    <GlobalContext.Provider value={{ openQuickAdd: () => setShowQuickAdd(true), pushUndo, focusSearch }}>
      {children}
      {showQuickAdd && <QuickAddModal onClose={handleCloseQuickAdd} />}
      {showShortcuts && <ShortcutsModal onClose={handleCloseShortcuts} />}
      <UndoToastContainer items={undoItems} onUndo={handleUndo} onDismiss={handleDismiss} />
    </GlobalContext.Provider>
  );
}
