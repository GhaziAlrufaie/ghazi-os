'use client';
// Calendar Client — Light Theme — مطابق لـ index.html
// Design: --bg:#FFFFFF | --txt:#1D1D1F | --gold:#C9A84C | --brd:#E5E5E5
import React, { useState, useCallback } from 'react';
import type { CalEvent, CalTask, Brand } from '@/app/calendar/page';
import { addEvent, updateEvent, deleteEvent } from '@/lib/calendar-actions';

// ─── ثوابت ───────────────────────────────────────────────────────────────────
const MONTHS = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
const DAYS_AR = ['أح','إث','ثل','أر','خم','جم','سب'];
const OCCASIONS = [
  { name: 'رمضان',        date: new Date(2027, 1, 17), icon: '🌙' },
  { name: 'اليوم الوطني', date: new Date(2026, 8, 23), icon: '🇸🇦' },
  { name: 'يوم التأسيس', date: new Date(2027, 1, 22), icon: '🏛️' },
];
const RECURRING = [
  { label: 'يومي',       note: 'واتساب + سلة' },
  { label: 'جمعة',       note: 'أحمد + سداد' },
  { label: 'آخر الشهر',  note: 'رواتب' },
  { label: 'شهري',       note: 'بشرى + المصنع' },
];
const EVENT_TYPES = [
  { value: 'event',    label: 'حدث عام' },
  { value: 'meeting',  label: 'اجتماع' },
  { value: 'deadline', label: 'موعد نهائي' },
  { value: 'reminder', label: 'تذكير' },
];
function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  initialEvents: CalEvent[];
  initialTasks:  CalTask[];
  brands:        Brand[];
}

// ─── EventFormModal ───────────────────────────────────────────────────────────
interface EventFormModalProps {
  brands:       Brand[];
  editEvent?:   CalEvent | null;
  defaultDate?: { day: number; month: number; year: number };
  onClose:      () => void;
  onSave:       (e: CalEvent, isEdit: boolean) => void;
}
function EventFormModal({ brands, editEvent, defaultDate, onClose, onSave }: EventFormModalProps) {
  const isEdit = !!editEvent;
  const initDate = editEvent
    ? `${editEvent.year}-${pad(editEvent.month + 1)}-${pad(editEvent.day)}`
    : defaultDate
    ? `${defaultDate.year}-${pad(defaultDate.month + 1)}-${pad(defaultDate.day)}`
    : '';
  const [title,   setTitle]   = useState(editEvent?.title ?? '');
  const [date,    setDate]    = useState(initDate);
  const [brand,   setBrand]   = useState(editEvent?.brandId ?? '');
  const [type,    setType]    = useState(editEvent?.type ?? 'event');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!title.trim() || !date) { setError('أدخل الاسم والتاريخ'); return; }
    setLoading(true); setError('');
    const d = new Date(date);
    const payload = {
      title: title.trim(),
      day:   d.getDate(),
      month: d.getMonth(),
      year:  d.getFullYear(),
      brandId: brand || null,
      type,
    };
    if (isEdit && editEvent) {
      const result = await updateEvent({ id: editEvent.id, ...payload });
      setLoading(false);
      if (result.error) { setError(result.error); return; }
      if (result.event) onSave(result.event, true);
    } else {
      const result = await addEvent(payload);
      setLoading(false);
      if (result.error) { setError(result.error); return; }
      if (result.event) onSave(result.event, false);
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 relative"
        style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-lg"
          style={{ color: '#AEAEB2', background: 'none', border: 'none', cursor: 'pointer' }}
        >✕</button>
        <h2 className="text-base font-bold mb-4" style={{ color: '#1D1D1F' }}>
          {isEdit ? 'تعديل الحدث' : '+ حدث جديد'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#6E6E73' }}>العنوان</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="اسم الحدث..."
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: '#F5F5F7', border: '1px solid #E5E5E5', color: '#1D1D1F', outline: 'none' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#6E6E73' }}>التاريخ</label>
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: '#F5F5F7', border: '1px solid #E5E5E5', color: '#1D1D1F', outline: 'none' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#6E6E73' }}>النوع</label>
            <select
              value={type} onChange={e => setType(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: '#F5F5F7', border: '1px solid #E5E5E5', color: '#1D1D1F', outline: 'none' }}
            >
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: '#6E6E73' }}>البراند (اختياري)</label>
            <select
              value={brand} onChange={e => setBrand(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm"
              style={{ background: '#F5F5F7', border: '1px solid #E5E5E5', color: '#1D1D1F', outline: 'none' }}
            >
              <option value="">— بدون براند —</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {error && <p className="text-xs" style={{ color: '#FF3B30' }}>{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg text-sm font-semibold"
              style={{ background: '#F5F5F7', border: '1px solid #E5E5E5', color: '#6E6E73', cursor: 'pointer' }}
            >إلغاء</button>
            <button
              type="submit" disabled={loading}
              className="flex-1 py-2 rounded-lg text-sm font-bold"
              style={{ background: '#C9A84C', color: '#FFFFFF', border: 'none', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}
            >{loading ? '...' : isEdit ? 'حفظ' : 'إضافة'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── DayPanel Modal ───────────────────────────────────────────────────────────
interface DayPanelProps {
  day: number; month: number; year: number;
  events: CalEvent[]; tasks: CalTask[];
  brands: Brand[];
  onClose:  () => void;
  onDelete: (id: string) => void;
  onEdit:   (e: CalEvent) => void;
}
function DayPanel({ day, month, year, events, tasks, brands, onClose, onDelete, onEdit }: DayPanelProps) {
  const brandsMap: Record<string, Brand> = {};
  brands.forEach(b => { brandsMap[b.id] = b; });
  const dayEvents = events.filter(e => e.day === day && e.month === month && e.year === year);
  const dayTasks  = tasks.filter(t => {
    const d = new Date(t.dueDate);
    return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
  });
  const typeLabel: Record<string, string> = {
    event: 'حدث', meeting: 'اجتماع', deadline: 'موعد نهائي', reminder: 'تذكير',
  };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 relative"
        style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 text-lg"
          style={{ color: '#AEAEB2', background: 'none', border: 'none', cursor: 'pointer' }}
        >✕</button>
        <h2 className="text-base font-bold mb-4" style={{ color: '#C9A84C' }}>
          {pad(day)} {MONTHS[month]} {year}
        </h2>
        {dayEvents.length > 0 && (
          <div className="mb-4">
            <div className="text-xs font-bold mb-2" style={{ color: '#C9A84C' }}>📌 الأحداث</div>
            {dayEvents.map(e => {
              const b = e.brandId ? brandsMap[e.brandId] : null;
              return (
                <div key={e.id} className="py-2" style={{ borderBottom: '1px solid #F0F0F0' }}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium" style={{ color: '#1D1D1F' }}>{e.title}</div>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}>
                          {typeLabel[e.type] ?? e.type}
                        </span>
                        {b && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${b.color}22`, color: b.color }}>{b.name}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => { onEdit(e); onClose(); }} className="text-xs" style={{ color: '#007AFF', background: 'none', border: 'none', cursor: 'pointer' }}>تعديل</button>
                      <button onClick={() => onDelete(e.id)} className="text-xs" style={{ color: '#FF3B30', background: 'none', border: 'none', cursor: 'pointer' }}>حذف</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {dayTasks.length > 0 && (
          <div>
            <div className="text-xs font-bold mb-2" style={{ color: '#C9A84C' }}>✅ المهام</div>
            {dayTasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 py-2" style={{ borderBottom: '1px solid #F0F0F0' }}>
                <div
                  className="w-4 h-4 rounded flex items-center justify-center text-xs flex-shrink-0"
                  style={{
                    border: t.status === 'done' ? '1.5px solid #34C759' : '1.5px solid #AEAEB2',
                    background: t.status === 'done' ? 'rgba(52,199,89,0.1)' : 'transparent',
                  }}
                >
                  {t.status === 'done' && <span style={{ color: '#34C759' }}>✓</span>}
                </div>
                <div className="flex-1">
                  <div className="text-sm" style={{ color: t.status === 'done' ? '#AEAEB2' : '#1D1D1F', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
                  {t.brandName && (
                    <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block" style={{ background: `${t.brandColor ?? '#C9A84C'}22`, color: t.brandColor ?? '#C9A84C' }}>
                      {t.brandName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {dayEvents.length === 0 && dayTasks.length === 0 && (
          <p className="text-center text-sm py-6" style={{ color: '#AEAEB2' }}>لا توجد أحداث أو مهام في هذا اليوم</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CalendarClient({ initialEvents, initialTasks, brands }: Props) {
  const now = new Date();
  const [events,      setEvents]      = useState<CalEvent[]>(initialEvents);
  const [curMonth,    setCurMonth]    = useState(now.getMonth());
  const [curYear,     setCurYear]     = useState(now.getFullYear());
  const [dayPanel,    setDayPanel]    = useState<{ day: number; month: number; year: number } | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [editTarget,  setEditTarget]  = useState<CalEvent | null>(null);
  const [formDefault, setFormDefault] = useState<{ day: number; month: number; year: number } | undefined>();

  const brandsMap: Record<string, Brand> = {};
  brands.forEach(b => { brandsMap[b.id] = b; });

  // ── Navigation ───────────────────────────────────────────────────────────────
  function prevMonth() {
    if (curMonth === 0) { setCurMonth(11); setCurYear(y => y - 1); }
    else setCurMonth(m => m - 1);
  }
  function nextMonth() {
    if (curMonth === 11) { setCurMonth(0); setCurYear(y => y + 1); }
    else setCurMonth(m => m + 1);
  }

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleSaveEvent = useCallback((e: CalEvent, isEdit: boolean) => {
    if (isEdit) setEvents(prev => prev.map(ev => ev.id === e.id ? e : ev));
    else        setEvents(prev => [...prev, e]);
  }, []);

  const handleDeleteEvent = useCallback(async (id: string) => {
    await deleteEvent(id);
    setEvents(prev => prev.filter(e => e.id !== id));
  }, []);

  const openAddForDay = useCallback((day: number, month: number, year: number) => {
    setEditTarget(null); setFormDefault({ day, month, year }); setShowForm(true);
  }, []);

  const openEdit = useCallback((e: CalEvent) => {
    setEditTarget(e); setFormDefault(undefined); setShowForm(true);
  }, []);

  // ── Calendar Grid ─────────────────────────────────────────────────────────────
  function buildGrid() {
    const daysInMonth    = new Date(curYear, curMonth + 1, 0).getDate();
    const firstDay       = new Date(curYear, curMonth, 1).getDay();
    const isCurrentMonth = now.getMonth() === curMonth && now.getFullYear() === curYear;
    const today          = isCurrentMonth ? now.getDate() : -1;
    const cells: React.ReactElement[] = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<td key={`e${i}`} style={{ padding: '8px 4px' }} />);
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
          onDoubleClick={() => openAddForDay(d, curMonth, curYear)}
          style={{
            padding: '8px 4px',
            fontSize: '12px',
            borderRadius: '8px',
            textAlign: 'center',
            cursor: 'pointer',
            position: 'relative',
            background: isToday ? '#C9A84C' : 'transparent',
            color: isToday ? '#FFFFFF' : hasItems ? '#C9A84C' : '#1D1D1F',
            fontWeight: isToday || hasItems ? 700 : 400,
            transition: 'background 0.15s',
          }}
          title={[...dayEvents.map(e => e.title), ...dayTasks.map(t => t.title)].join(', ') || 'انقر مرتين لإضافة حدث'}
        >
          {pad(d)}
          {hasItems && !isToday && (
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#C9A84C', margin: '2px auto 0' }} />
          )}
        </td>
      );
    }
    const remaining = 7 - ((firstDay + daysInMonth) % 7);
    if (remaining < 7) {
      for (let j = 0; j < remaining; j++) cells.push(<td key={`r${j}`} style={{ padding: '8px 4px' }} />);
    }
    const rows: React.ReactElement[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return (
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '2px', direction: 'ltr' }}>
        <thead>
          <tr>
            {DAYS_AR.map(d => (
              <th key={d} style={{ fontSize: '11px', color: '#AEAEB2', padding: '4px 2px', fontWeight: 600, textAlign: 'center' }}>{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => <tr key={i}>{row}</tr>)}
        </tbody>
      </table>
    );
  }

  // ── Countdowns ────────────────────────────────────────────────────────────────
  const countdowns = OCCASIONS
    .map(o => ({ ...o, days: Math.ceil((o.date.getTime() - now.getTime()) / 86400000) }))
    .filter(o => o.days > 0 && o.days <= 365);

  // ── Month Events ──────────────────────────────────────────────────────────────
  const monthEvents = events
    .filter(e => e.month === curMonth && e.year === curYear)
    .sort((a, b) => a.day - b.day);

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100vh', direction: 'rtl' }}>

      {/* Page Header */}
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: '1px solid #E5E5E5', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 30 }}
      >
        <div>
          <h1 className="text-xl font-bold" style={{ color: '#1D1D1F' }}>التقويم</h1>
          <p className="text-xs mt-0.5" style={{ color: '#AEAEB2' }}>
            {monthEvents.length} حدث — {MONTHS[curMonth]} {curYear}
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setFormDefault(undefined); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold"
          style={{ background: '#C9A84C', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
        >
          + حدث
        </button>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', maxWidth: 1000 }}
        >

          {/* ── Left: Calendar Grid + Countdowns ── */}
          <div className="space-y-5">

            {/* Calendar Card */}
            <div
              className="rounded-2xl p-5"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
            >
              {/* Month Nav */}
              <div className="flex items-center justify-between mb-5">
                <button
                  onClick={nextMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: '#F5F5F7', border: '1px solid #E5E5E5', color: '#C9A84C', cursor: 'pointer' }}
                >◄</button>
                <h3 className="font-bold text-base" style={{ color: '#1D1D1F' }}>
                  {MONTHS[curMonth]} {curYear}
                </h3>
                <button
                  onClick={prevMonth}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: '#F5F5F7', border: '1px solid #E5E5E5', color: '#C9A84C', cursor: 'pointer' }}
                >►</button>
              </div>
              {buildGrid()}
              <p className="text-center text-xs mt-3" style={{ color: '#AEAEB2' }}>
                انقر مرة للتفاصيل · انقر مرتين لإضافة حدث
              </p>
            </div>

            {/* Countdowns */}
            {countdowns.length > 0 && (
              <div>
                <h3 className="text-xs font-bold mb-3" style={{ color: '#6E6E73' }}>العد التنازلي</h3>
                <div className="grid grid-cols-3 gap-3">
                  {countdowns.map(o => (
                    <div
                      key={o.name}
                      className="rounded-xl px-4 py-3"
                      style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)' }}
                    >
                      <div className="text-sm font-semibold mb-1" style={{ color: '#1D1D1F' }}>{o.icon} {o.name}</div>
                      <div className="text-2xl font-black" style={{ color: '#C9A84C' }}>{o.days}</div>
                      <div className="text-xs" style={{ color: '#AEAEB2' }}>يوم متبقي</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Events Panel ── */}
          <div className="space-y-4">

            {/* Month Events */}
            <div
              className="rounded-2xl p-4"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm" style={{ color: '#1D1D1F' }}>📌 أحداث الشهر</h3>
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(201,168,76,0.1)', color: '#C9A84C' }}
                >{monthEvents.length}</span>
              </div>
              {monthEvents.length === 0 ? (
                <p className="text-center text-sm py-4" style={{ color: '#AEAEB2' }}>لا توجد أحداث هذا الشهر</p>
              ) : (
                <div>
                  {monthEvents.map(e => {
                    const b = e.brandId ? brandsMap[e.brandId] : null;
                    return (
                      <div key={e.id} className="flex items-start gap-3 py-2" style={{ borderBottom: '1px solid #F5F5F7' }}>
                        <span className="text-xs font-bold mt-0.5 w-6 flex-shrink-0 text-center" style={{ color: '#C9A84C' }}>{pad(e.day)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate" style={{ color: '#1D1D1F' }}>{e.title}</div>
                          {b && (
                            <span className="text-xs px-2 py-0.5 rounded-full mt-0.5 inline-block" style={{ background: `${b.color}22`, color: b.color }}>{b.name}</span>
                          )}
                        </div>
                        <button
                          onClick={() => openEdit(e)}
                          className="text-xs flex-shrink-0"
                          style={{ color: '#AEAEB2', background: 'none', border: 'none', cursor: 'pointer' }}
                        >✏</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recurring */}
            <div
              className="rounded-2xl p-4"
              style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}
            >
              <h3 className="font-bold text-sm mb-3" style={{ color: '#1D1D1F' }}>🔁 متكرر</h3>
              <div>
                {RECURRING.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2"
                    style={{ borderBottom: i < RECURRING.length - 1 ? '1px solid #F5F5F7' : 'none' }}
                  >
                    <span className="text-xs font-semibold" style={{ color: '#1D1D1F' }}>{r.label}</span>
                    <span className="text-xs" style={{ color: '#AEAEB2' }}>{r.note}</span>
                  </div>
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
          onEdit={openEdit}
        />
      )}

      {/* Add / Edit Event Modal */}
      {showForm && (
        <EventFormModal
          brands={brands}
          editEvent={editTarget}
          defaultDate={formDefault}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
}
