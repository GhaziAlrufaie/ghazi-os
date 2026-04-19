'use client';
// Calendar Client — Light Theme — مطابق لـ index.html
// Layout: .scr.on wrapper (padding: 20px 24px) — نفس /brands و /tasks
// Grid: 1fr 320px — تقويم واسع + panel يمين ثابت
import React, { useState, useCallback } from 'react';
import type { CalEvent, CalTask, Brand } from '@/app/calendar/page';
import { addEvent, updateEvent, deleteEvent } from '@/lib/calendar-actions';

// ─── ثوابت ───────────────────────────────────────────────────────────────────
const MONTHS_AR = [
  'يناير','فبراير','مارس','أبريل','مايو','يونيو',
  'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر',
];
const DAYS_AR = ['أح','إث','ثل','أر','خم','جم','سب'];
const OCCASIONS = [
  { name: 'رمضان',        date: new Date(2027, 1, 17), icon: '🌙' },
  { name: 'اليوم الوطني', date: new Date(2026, 8, 23), icon: '🇸🇦' },
  { name: 'يوم التأسيس',  date: new Date(2027, 1, 22), icon: '🏛️' },
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
    <div className="modal-bg on" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', marginBottom: 20 }}>
          {isEdit ? 'تعديل الحدث' : '+ حدث جديد'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>العنوان</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="اسم الحدث..."
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>التاريخ</label>
            <input
              type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>النوع</label>
            <select
              value={type} onChange={e => setType(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }}
            >
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>البراند (اختياري)</label>
            <select
              value={brand} onChange={e => setBrand(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }}
            >
              <option value="">— بدون براند —</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button" onClick={onClose}
              style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--bg2)', border: '1px solid var(--brd)', color: 'var(--txt3)', cursor: 'pointer' }}
            >إلغاء</button>
            <button
              type="submit" disabled={loading}
              className="btn"
              style={{ opacity: loading ? 0.7 : 1 }}
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
    <div className="modal-bg on" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 440, maxHeight: '80vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--gold)', marginBottom: 16 }}>
          {pad(day)} {MONTHS_AR[month]} {year}
        </h2>
        {dayEvents.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>📌 الأحداث</div>
            {dayEvents.map(e => {
              const b = e.brandId ? brandsMap[e.brandId] : null;
              return (
                <div key={e.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--brd)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{e.title}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'var(--gold-dim)', color: 'var(--gold)', fontWeight: 700 }}>
                          {typeLabel[e.type] ?? e.type}
                        </span>
                        {b && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: `${b.color}22`, color: b.color, fontWeight: 700 }}>
                            {b.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => { onEdit(e); onClose(); }}
                        style={{ fontSize: 12, color: '#007AFF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >تعديل</button>
                      <button
                        onClick={() => onDelete(e.id)}
                        style={{ fontSize: 12, color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      >حذف</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {dayTasks.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>✅ المهام</div>
            {dayTasks.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--brd)' }}>
                <div
                  style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: t.status === 'done' ? '1.5px solid var(--success)' : '1.5px solid var(--txt3)',
                    background: t.status === 'done' ? 'rgba(52,199,89,0.1)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: 'var(--success)',
                  }}
                >{t.status === 'done' ? '✓' : ''}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: 'var(--txt)', textDecoration: t.status === 'done' ? 'line-through' : 'none', opacity: t.status === 'done' ? 0.5 : 1 }}>{t.title}</div>
                  {t.brandName && (
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: `${t.brandColor ?? 'var(--gold)'}22`, color: t.brandColor ?? 'var(--gold)', fontWeight: 700, marginTop: 2, display: 'inline-block' }}>
                      {t.brandName}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        {dayEvents.length === 0 && dayTasks.length === 0 && (
          <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--txt3)', padding: '24px 0' }}>
            لا توجد أحداث أو مهام في هذا اليوم
          </p>
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

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells.push(<td key={`e${i}`} style={{ padding: '12px 8px', minHeight: 80 }} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayEvts  = events.filter(e => e.day === d && e.month === curMonth && e.year === curYear);
      const dayTasks = initialTasks.filter(t => {
        const dt = new Date(t.dueDate);
        return dt.getDate() === d && dt.getMonth() === curMonth && dt.getFullYear() === curYear;
      });
      const hasItems = dayEvts.length > 0 || dayTasks.length > 0;
      const isToday  = d === today;
      cells.push(
        <td
          key={d}
          onClick={() => setDayPanel({ day: d, month: curMonth, year: curYear })}
          onDoubleClick={() => openAddForDay(d, curMonth, curYear)}
          style={{
            padding: '12px 8px',
            minHeight: 80,
            fontSize: 13,
            borderRadius: 8,
            textAlign: 'center',
            cursor: 'pointer',
            verticalAlign: 'top',
            background: isToday ? 'var(--gold)' : 'transparent',
            color: isToday ? '#fff' : hasItems ? 'var(--gold)' : 'var(--txt)',
            fontWeight: isToday || hasItems ? 700 : 400,
            transition: 'background 0.15s',
          }}
          title={[...dayEvts.map(e => e.title), ...dayTasks.map(t => t.title)].join(', ') || 'انقر مرتين لإضافة حدث'}
        >
          <div>{pad(d)}</div>
          {hasItems && !isToday && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 2, marginTop: 4 }}>
              {dayEvts.slice(0, 3).map((_, i) => (
                <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--gold)' }} />
              ))}
            </div>
          )}
        </td>
      );
    }

    // Trailing empty cells
    const remaining = 7 - ((firstDay + daysInMonth) % 7);
    if (remaining < 7) {
      for (let j = 0; j < remaining; j++) cells.push(<td key={`r${j}`} style={{ padding: '12px 8px', minHeight: 80 }} />);
    }

    const rows: React.ReactElement[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    return (
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '2px', direction: 'ltr' }}>
        <thead>
          <tr>
            {DAYS_AR.map(d => (
              <th key={d} style={{ fontSize: 11, color: 'var(--txt3)', padding: '8px 4px', fontWeight: 600, textAlign: 'center' }}>{d}</th>
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
    <div className="scr on">

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)', marginBottom: 4 }}>التقويم</h1>
          <p style={{ fontSize: 12, color: 'var(--txt3)' }}>
            {monthEvents.length} حدث — {MONTHS_AR[curMonth]} {curYear}
          </p>
        </div>
        <button
          className="btn"
          onClick={() => { setEditTarget(null); setFormDefault(undefined); setShowForm(true); }}
        >
          + حدث جديد
        </button>
      </div>

      {/* ── Main Grid: Calendar (1fr) + Sidebar (320px) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ── Left: Calendar Card + Countdowns ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Calendar Card */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--brd)', borderRadius: 16, padding: '20px 24px', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            {/* Month Navigation */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <button
                onClick={nextMonth}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--brd)', background: 'var(--bg2)', color: 'var(--gold)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >◄</button>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', margin: 0 }}>
                {MONTHS_AR[curMonth]} {curYear}
              </h3>
              <button
                onClick={prevMonth}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--brd)', background: 'var(--bg2)', color: 'var(--gold)', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >►</button>
            </div>

            {/* Grid */}
            {buildGrid()}

            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--txt3)', marginTop: 12 }}>
              انقر مرة للتفاصيل · انقر مرتين لإضافة حدث
            </p>
          </div>

          {/* Countdowns */}
          {countdowns.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                العد التنازلي
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {countdowns.map(o => (
                  <div
                    key={o.name}
                    style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', borderRadius: 12, padding: '16px 20px' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 6 }}>{o.icon} {o.name}</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)', lineHeight: 1 }}>{o.days}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>يوم متبقي</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right Sidebar: أحداث الشهر + متكرر ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* أحداث الشهر */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--brd)', borderRadius: 16, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--txt)', margin: 0 }}>📌 أحداث الشهر</h3>
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: 'var(--gold-dim)', color: 'var(--gold)', fontWeight: 700 }}>
                {monthEvents.length}
              </span>
            </div>
            {monthEvents.length === 0 ? (
              <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--txt3)', padding: '16px 0' }}>
                لا توجد أحداث هذا الشهر
              </p>
            ) : (
              <div>
                {monthEvents.map(e => {
                  const b = e.brandId ? brandsMap[e.brandId] : null;
                  return (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--brd)' }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gold)', flexShrink: 0, minWidth: 24, textAlign: 'center', marginTop: 1 }}>
                        {pad(e.day)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {e.title}
                        </div>
                        {b && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: `${b.color}22`, color: b.color, fontWeight: 700, marginTop: 2, display: 'inline-block' }}>
                            {b.name}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => openEdit(e)}
                        style={{ fontSize: 12, color: 'var(--txt3)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                      >✏</button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* متكرر */}
          <div style={{ background: 'var(--bg)', border: '1px solid var(--brd)', borderRadius: 16, padding: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: 'var(--txt)', marginBottom: 14 }}>🔁 متكرر</h3>
            <div>
              {RECURRING.map((r, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: i < RECURRING.length - 1 ? '1px solid var(--brd)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{r.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{r.note}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── Day Panel Modal ── */}
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

      {/* ── Add / Edit Event Modal ── */}
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
