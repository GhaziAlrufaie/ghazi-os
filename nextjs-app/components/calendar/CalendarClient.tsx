'use client';
// Legendary Edition — Calendar Client Component
// عرض تقويم شهري تفاعلي + أحداث الشهر + عد تنازلي للمناسبات

import { useState, useCallback } from 'react';
import type { CalEvent, CalTask, Brand } from '@/app/calendar/page';
import { addEvent, deleteEvent } from '@/lib/calendar-actions';

// ─── ثوابت ───────────────────────────────────────────────────────────────────
const MONTHS = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
const DAYS_AR = ['أح','إث','ثل','أر','خم','جم','سب'];

const OCCASIONS = [
  { name: 'رمضان',       date: new Date(2026, 2,  1), icon: '◑' },
  { name: 'اليوم الوطني', date: new Date(2026, 8, 23), icon: '★' },
  { name: 'يوم التأسيس', date: new Date(2027, 1, 22), icon: '◆' },
];

const RECURRING = [
  'يومي — واتساب + سلة',
  'جمعة — أحمد + سداد',
  'آخر الشهر — رواتب',
  'شهري — بشرى + المصنع',
];

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  initialEvents: CalEvent[];
  initialTasks: CalTask[];
  brands: Brand[];
}

// ─── DayPanel ────────────────────────────────────────────────────────────────
interface DayPanelProps {
  day: number; month: number; year: number;
  events: CalEvent[]; tasks: CalTask[];
  brands: Brand[];
  onClose: () => void;
  onDelete: (id: string) => void;
}

function DayPanel({ day, month, year, events, tasks, brands, onClose, onDelete }: DayPanelProps) {
  const brandsMap: Record<string, Brand> = {};
  brands.forEach(b => { brandsMap[b.id] = b; });

  const dayEvents = events.filter(e => e.day === day && e.month === month && e.year === year);
  const dayTasks  = tasks.filter(t => {
    const d = new Date(t.dueDate);
    return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-xl p-6 w-full max-w-sm relative" style={{ background: '#0d1117', border: '1px solid rgba(201,150,59,0.2)' }}>
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-white text-lg">✕</button>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#C9963B' }}>
          {pad(day)} {MONTHS[month]} {year}
        </h2>

        {dayEvents.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-semibold mb-2" style={{ color: '#C9963B' }}>الأحداث</div>
            {dayEvents.map(e => {
              const b = e.brandId ? brandsMap[e.brandId] : null;
              return (
                <div key={e.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <div>
                    <div className="text-sm font-medium text-white">{e.title}</div>
                    {b && <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${b.color}22`, color: b.color }}>{b.name}</span>}
                  </div>
                  <button onClick={() => onDelete(e.id)} className="text-xs text-red-400 hover:text-red-300 mr-2">حذف</button>
                </div>
              );
            })}
          </div>
        )}

        {dayTasks.length > 0 && (
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: '#C9963B' }}>المهام</div>
            {dayTasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                <div className={`w-4 h-4 rounded-sm border flex items-center justify-center text-xs flex-shrink-0 ${t.status === 'done' ? 'border-green-500 bg-green-500/20' : 'border-gray-600'}`}>
                  {t.status === 'done' && <span className="text-green-400">✓</span>}
                </div>
                <div className="flex-1">
                  <div className={`text-sm ${t.status === 'done' ? 'line-through text-gray-500' : 'text-white'}`}>{t.title}</div>
                  {t.brandName && <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${t.brandColor}22`, color: t.brandColor ?? '#C9963B' }}>{t.brandName}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {dayEvents.length === 0 && dayTasks.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-4">لا توجد أحداث أو مهام في هذا اليوم</p>
        )}
      </div>
    </div>
  );
}

// ─── AddEventModal ────────────────────────────────────────────────────────────
interface AddEventModalProps {
  brands: Brand[];
  onClose: () => void;
  onAdd: (e: CalEvent) => void;
}

function AddEventModal({ brands, onClose, onAdd }: AddEventModalProps) {
  const [title, setTitle]   = useState('');
  const [date,  setDate]    = useState('');
  const [brand, setBrand]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!title.trim() || !date) { setError('أدخل الاسم والتاريخ'); return; }
    setLoading(true);
    const d = new Date(date);
    const result = await addEvent({ title: title.trim(), day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), brandId: brand || null, type: 'event' });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    if (result.event) onAdd(result.event);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
      <div className="rounded-xl p-6 w-full max-w-sm relative" style={{ background: '#0d1117', border: '1px solid rgba(201,150,59,0.2)' }}>
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-white text-lg">✕</button>
        <h2 className="text-lg font-bold mb-4" style={{ color: '#C9963B' }}>+ حدث جديد</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">عنوان الحدث</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: اجتماع فريق" className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,150,59,0.15)' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">التاريخ</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,150,59,0.15)', colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">البراند (اختياري)</label>
            <select value={brand} onChange={e => setBrand(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none" style={{ background: '#0d1117', border: '1px solid rgba(201,150,59,0.15)' }}>
              <option value="">بدون براند</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-sm text-gray-400 border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>إلغاء</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg text-sm font-semibold transition-opacity" style={{ background: '#C9963B', color: '#05070d', opacity: loading ? 0.6 : 1 }}>
              {loading ? '...' : '+ أضف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CalendarClient({ initialEvents, initialTasks, brands }: Props) {
  const now = new Date();
  const [events, setEvents]         = useState<CalEvent[]>(initialEvents);
  const [curMonth, setCurMonth]     = useState(now.getMonth());
  const [curYear,  setCurYear]      = useState(now.getFullYear());
  const [dayPanel, setDayPanel]     = useState<{ day: number; month: number; year: number } | null>(null);
  const [showAdd,  setShowAdd]      = useState(false);

  const brandsMap: Record<string, Brand> = {};
  brands.forEach(b => { brandsMap[b.id] = b; });

  // ── Navigation ──────────────────────────────────────────────────────────────
  function prevMonth() {
    if (curMonth === 0) { setCurMonth(11); setCurYear(y => y - 1); }
    else setCurMonth(m => m - 1);
  }
  function nextMonth() {
    if (curMonth === 11) { setCurMonth(0); setCurYear(y => y + 1); }
    else setCurMonth(m => m + 1);
  }

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddEvent = useCallback((e: CalEvent) => {
    setEvents(prev => [...prev, e]);
  }, []);

  const handleDeleteEvent = useCallback(async (id: string) => {
    await deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  // ── Calendar Grid ────────────────────────────────────────────────────────────
  function buildGrid() {
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const firstDay    = new Date(curYear, curMonth, 1).getDay();
    const isCurrentMonth = now.getMonth() === curMonth && now.getFullYear() === curYear;
    const today = isCurrentMonth ? now.getDate() : -1;

    const cells: JSX.Element[] = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<td key={`e${i}`} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayEvents = events.filter(e => e.day === d && e.month === curMonth && e.year === curYear);
      const dayTasks  = initialTasks.filter(t => {
        const dt = new Date(t.dueDate);
        return dt.getDate() === d && dt.getMonth() === curMonth && dt.getFullYear() === curYear;
      });
      const hasItems = dayEvents.length > 0 || dayTasks.length > 0;
      const isToday  = d === today;

      cells.push(
        <td
          key={d}
          onClick={() => setDayPanel({ day: d, month: curMonth, year: curYear })}
          style={{
            padding: '6px 2px',
            fontSize: '11px',
            borderRadius: '6px',
            textAlign: 'center',
            cursor: 'pointer',
            position: 'relative',
            background: isToday ? '#C9963B' : 'transparent',
            color: isToday ? '#05070d' : hasItems ? '#C9963B' : 'rgba(255,255,255,0.3)',
            fontWeight: isToday || hasItems ? 700 : 400,
            transition: 'background 0.2s',
          }}
          title={[...dayEvents.map(e => e.title), ...dayTasks.map(t => t.title)].join(', ')}
        >
          {pad(d)}
          {hasItems && !isToday && (
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C9963B', margin: '2px auto 0' }} />
          )}
        </td>
      );
    }

    // Fill remaining
    const remaining = 7 - ((firstDay + daysInMonth) % 7);
    if (remaining < 7) {
      for (let j = 0; j < remaining; j++) cells.push(<td key={`r${j}`} />);
    }

    // Split into rows
    const rows: JSX.Element[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', direction: 'ltr' }}>
        <thead>
          <tr>
            {DAYS_AR.map(d => (
              <th key={d} style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', padding: '4px 2px', fontWeight: 600, textAlign: 'center' }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => <tr key={i}>{row}</tr>)}
        </tbody>
      </table>
    );
  }

  // ── Countdown ────────────────────────────────────────────────────────────────
  const countdowns = OCCASIONS
    .map(o => ({ ...o, days: Math.ceil((o.date.getTime() - now.getTime()) / 86400000) }))
    .filter(o => o.days > 0 && o.days <= 90);

  // ── Month Events ─────────────────────────────────────────────────────────────
  const monthEvents = events
    .filter(e => e.month === curMonth && e.year === curYear)
    .sort((a, b) => a.day - b.day);

  return (
    <div className="min-h-screen" style={{ background: '#05070d', direction: 'rtl' }}>
      {/* Aurora */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: 0, right: 0, width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(201,150,59,0.08) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#C9963B' }}>التقويم</h1>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {monthEvents.length} حدث — {MONTHS[curMonth]} {curYear}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: 'rgba(201,150,59,0.15)', border: '1px solid rgba(201,150,59,0.3)', color: '#C9963B' }}
          >
            + حدث
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Calendar Grid + Countdowns */}
          <div className="space-y-4">
            {/* Calendar Grid */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,150,59,0.1)' }}>
              {/* Month Nav */}
              <div className="flex items-center justify-between mb-4">
                <button onClick={nextMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-white/10" style={{ color: '#C9963B' }}>→</button>
                <h3 className="font-bold text-base" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {MONTHS[curMonth]} {curYear}
                </h3>
                <button onClick={prevMonth} className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors hover:bg-white/10" style={{ color: '#C9963B' }}>←</button>
              </div>
              {buildGrid()}
            </div>

            {/* Countdowns */}
            {countdowns.length > 0 && (
              <div className="space-y-2">
                {countdowns.map(o => (
                  <div key={o.name} className="flex items-center justify-between px-4 py-3 rounded-lg" style={{ background: 'rgba(201,150,59,0.06)', border: '1px solid rgba(201,150,59,0.12)' }}>
                    <span className="text-sm font-semibold" style={{ color: '#E8C068' }}>{o.icon} {o.name}</span>
                    <div className="text-center">
                      <div className="text-xl font-black" style={{ color: '#C9963B' }}>{pad(o.days)}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>يوم</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Month Events + Recurring */}
          <div className="space-y-4">
            {/* Month Events */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,150,59,0.1)' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>أحداث الشهر</h3>
                <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(201,150,59,0.1)', color: '#C9963B' }}>{monthEvents.length}</span>
              </div>
              {monthEvents.length === 0 ? (
                <p className="text-center text-sm py-6" style={{ color: 'rgba(255,255,255,0.25)' }}>لا توجد أحداث هذا الشهر</p>
              ) : (
                <div className="space-y-1">
                  {monthEvents.map(e => {
                    const b = e.brandId ? brandsMap[e.brandId] : null;
                    return (
                      <div key={e.id} className="flex items-start gap-3 py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-xs font-bold mt-0.5 w-6 flex-shrink-0" style={{ color: '#C9963B' }}>{pad(e.day)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{e.title}</div>
                          {b && <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${b.color}22`, color: b.color }}>{b.name}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recurring */}
            <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(201,150,59,0.1)' }}>
              <h3 className="font-bold text-sm mb-3" style={{ color: 'rgba(255,255,255,0.8)' }}>متكرر</h3>
              <div className="space-y-1">
                {RECURRING.map((r, i) => (
                  <div key={i} className="py-2 text-xs border-b" style={{ color: 'rgba(255,255,255,0.4)', borderColor: 'rgba(255,255,255,0.05)' }}>{r}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Day Panel Modal */}
      {dayPanel && (
        <DayPanel
          day={dayPanel.day} month={dayPanel.month} year={dayPanel.year}
          events={events} tasks={initialTasks}
          brands={brands}
          onClose={() => setDayPanel(null)}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* Add Event Modal */}
      {showAdd && (
        <AddEventModal
          brands={brands}
          onClose={() => setShowAdd(false)}
          onAdd={handleAddEvent}
        />
      )}
    </div>
  );
}
