'use client';
// Client Component — Events (قسم الأحداث)
// عرض الأحداث بصيغة جدول + CRUD كامل (إضافة / تعديل / حذف)
import React, { useState } from 'react';
import type { EventRow } from '@/lib/events-actions';
import { addEventRow, updateEventRow, deleteEventRow } from '@/lib/events-actions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Brand { id: string; name: string; color: string; }

const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو',
                'يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const EVENT_TYPES: { value: string; label: string; color: string }[] = [
  { value: 'event',    label: 'حدث عام',       color: '#6B7280' },
  { value: 'meeting',  label: 'اجتماع',         color: '#3B82F6' },
  { value: 'deadline', label: 'موعد نهائي',     color: '#EF4444' },
  { value: 'reminder', label: 'تذكير',           color: '#F59E0B' },
];

function pad(n: number) { return n < 10 ? `0${n}` : `${n}`; }
function typeInfo(t: string) {
  return EVENT_TYPES.find(x => x.value === t) ?? { label: t, color: '#6B7280' };
}

// ─── EventForm Modal ──────────────────────────────────────────────────────────
interface FormProps {
  brands: Brand[];
  edit?: EventRow | null;
  onClose: () => void;
  onSave: (e: EventRow, isEdit: boolean) => void;
}
function EventForm({ brands, edit, onClose, onSave }: FormProps) {
  const isEdit = !!edit;
  const initDate = edit
    ? `${edit.year}-${pad(edit.month + 1)}-${pad(edit.day)}`
    : '';
  const [title,   setTitle]   = useState(edit?.title ?? '');
  const [date,    setDate]    = useState(initDate);
  const [brand,   setBrand]   = useState(edit?.brandId ?? '');
  const [type,    setType]    = useState(edit?.type ?? 'event');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!title.trim() || !date) { setError('أدخل العنوان والتاريخ'); return; }
    setLoading(true); setError('');
    const d = new Date(date);
    const payload = { title: title.trim(), day: d.getDate(), month: d.getMonth(), year: d.getFullYear(), brandId: brand || null, type };
    if (isEdit && edit) {
      const res = await updateEventRow({ id: edit.id, ...payload });
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      if (res.event) onSave(res.event, true);
    } else {
      const res = await addEventRow(payload);
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      if (res.event) onSave(res.event, false);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-xl p-6 w-full max-w-sm relative" style={{ background: '#0d1117', border: '1px solid rgba(201,150,59,0.25)' }}>
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-white">✕</button>
        <h2 className="text-lg font-bold mb-5" style={{ color: '#C9963B' }}>
          {isEdit ? '✏ تعديل الحدث' : '+ حدث جديد'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">عنوان الحدث</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: اجتماع الفريق"
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,150,59,0.15)' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">التاريخ</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,150,59,0.15)', colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">نوع الحدث</label>
            <select value={type} onChange={e => setType(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ background: '#0d1117', border: '1px solid rgba(201,150,59,0.15)' }}>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">البراند (اختياري)</label>
            <select value={brand} onChange={e => setBrand(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ background: '#0d1117', border: '1px solid rgba(201,150,59,0.15)' }}>
              <option value="">بدون براند</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-sm text-gray-400 border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>إلغاء</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: '#C9963B', color: '#05070d', opacity: loading ? 0.6 : 1 }}>
              {loading ? '...' : isEdit ? 'حفظ' : '+ أضف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { initialEvents: EventRow[]; brands: Brand[]; }

export default function EventsClient({ initialEvents, brands }: Props) {
  const [events,   setEvents]   = useState<EventRow[]>(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [editEvt,  setEditEvt]  = useState<EventRow | null>(null);
  const [filter,   setFilter]   = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  function handleSave(e: EventRow, isEdit: boolean) {
    setEvents(prev => isEdit ? prev.map(x => x.id === e.id ? e : x) : [...prev, e]);
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا الحدث؟')) return;
    setDeleting(id);
    await deleteEventRow(id);
    setEvents(prev => prev.filter(x => x.id !== id));
    setDeleting(null);
  }

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

  // ترتيب: الأقرب أولاً
  const sorted = [...filtered].sort((a, b) => {
    const da = new Date(a.year, a.month, a.day).getTime();
    const db = new Date(b.year, b.month, b.day).getTime();
    return da - db;
  });

  const now = new Date();
  const upcoming = sorted.filter(e => new Date(e.year, e.month, e.day) >= new Date(now.getFullYear(), now.getMonth(), now.getDate()));
  const past     = sorted.filter(e => new Date(e.year, e.month, e.day) <  new Date(now.getFullYear(), now.getMonth(), now.getDate()));

  return (
    <div className="min-h-screen p-6" style={{ background: '#05070d', color: '#e2e8f0' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#C9963B' }}>الأحداث</h1>
          <p className="text-sm text-gray-400 mt-1">{events.length} حدث مسجّل</p>
        </div>
        <button
          onClick={() => { setEditEvt(null); setShowForm(true); }}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: '#C9963B', color: '#05070d' }}
        >
          + حدث جديد
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ value: 'all', label: 'الكل' }, ...EVENT_TYPES].map(t => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filter === t.value ? '#C9963B' : 'rgba(255,255,255,0.05)',
              color: filter === t.value ? '#05070d' : '#9ca3af',
              border: '1px solid',
              borderColor: filter === t.value ? '#C9963B' : 'rgba(255,255,255,0.1)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Upcoming Events */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">القادمة ({upcoming.length})</h2>
          <div className="space-y-2">
            {upcoming.map(e => <EventCard key={e.id} event={e} onEdit={() => { setEditEvt(e); setShowForm(true); }} onDelete={handleDelete} deleting={deleting} />)}
          </div>
        </section>
      )}

      {/* Past Events */}
      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">السابقة ({past.length})</h2>
          <div className="space-y-2 opacity-60">
            {past.map(e => <EventCard key={e.id} event={e} onEdit={() => { setEditEvt(e); setShowForm(true); }} onDelete={handleDelete} deleting={deleting} />)}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📅</div>
          <p>لا توجد أحداث</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <EventForm
          brands={brands}
          edit={editEvt}
          onClose={() => { setShowForm(false); setEditEvt(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ─── EventCard ────────────────────────────────────────────────────────────────
interface CardProps {
  event: EventRow;
  onEdit: () => void;
  onDelete: (id: string) => void;
  deleting: string | null;
}
function EventCard({ event: e, onEdit, onDelete, deleting }: CardProps) {
  const ti = typeInfo(e.type);
  const dateStr = `${pad(e.day)} ${MONTHS[e.month]} ${e.year}`;
  const isPast = new Date(e.year, e.month, e.day) < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-xl"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Date badge */}
      <div className="flex-shrink-0 w-12 text-center">
        <div className="text-xl font-bold" style={{ color: isPast ? '#6b7280' : '#C9963B' }}>{pad(e.day)}</div>
        <div className="text-xs text-gray-500">{MONTHS[e.month].slice(0, 3)}</div>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white truncate">{e.title}</div>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${ti.color}22`, color: ti.color }}>
            {ti.label}
          </span>
          {e.brandName && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${e.brandColor}22`, color: e.brandColor ?? '#C9963B' }}>
              {e.brandName}
            </span>
          )}
          <span className="text-xs text-gray-500">{dateStr}</span>
        </div>
      </div>
      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <button onClick={onEdit} className="text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded" style={{ background: 'rgba(59,130,246,0.1)' }}>✏</button>
        <button onClick={() => onDelete(e.id)} disabled={deleting === e.id}
          className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.1)' }}>
          {deleting === e.id ? '...' : '🗑'}
        </button>
      </div>
    </div>
  );
}
