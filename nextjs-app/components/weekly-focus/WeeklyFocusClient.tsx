'use client';
// Design: Weekly Focus — 7-day grid, brand picker modal, "ترحيل للغد" button

import { useState, useTransition } from 'react';
import {
  setDayFocus,
  clearDayFocus,
  moveFocusToNextDay,
  type WeeklyFocusEntry,
  type FocusTargetType,
} from '@/lib/weekly-focus-actions';

const DAY_NAMES: Record<number, string> = {
  0: 'الأحد',
  1: 'الاثنين',
  2: 'الثلاثاء',
  3: 'الأربعاء',
  4: 'الخميس',
  5: 'الجمعة',
  6: 'السبت',
};

function getWeekDates(referenceDate: Date): Date[] {
  const day = referenceDate.getDay();
  // Start week from Sunday
  const sunday = new Date(referenceDate);
  sunday.setDate(referenceDate.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

interface Brand {
  id: string;
  name: string;
  color: string;
}

interface Props {
  initialEntries: WeeklyFocusEntry[];
  brands: Brand[];
}

interface SetFocusModalProps {
  date: string;
  dayName: string;
  brands: Brand[];
  existing: WeeklyFocusEntry | null;
  onSave: (entry: WeeklyFocusEntry) => void;
  onClear: () => void;
  onMoveToTomorrow: () => void;
  onClose: () => void;
}

function SetFocusModal({
  date,
  dayName,
  brands,
  existing,
  onSave,
  onClear,
  onMoveToTomorrow,
  onClose,
}: SetFocusModalProps) {
  const [targetType, setTargetType] = useState<FocusTargetType>(
    existing?.targetType ?? 'brand'
  );
  const [selectedBrandId, setSelectedBrandId] = useState(
    existing?.targetType === 'brand' ? (existing?.targetId ?? '') : ''
  );
  const [customName, setCustomName] = useState(
    existing?.targetType === 'custom' ? (existing?.targetName ?? '') : ''
  );
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [isPending, startTransition] = useTransition();

  // Brands that haven't been focused recently (simplified: show all)
  const neglectedBrands = brands.filter(
    (b) => b.id !== existing?.targetId
  );

  function handleSave() {
    let targetName = '';
    let targetColor = '#C9A84C';
    let targetId: string | null = null;

    if (targetType === 'brand') {
      const brand = brands.find((b) => b.id === selectedBrandId);
      if (!brand) return;
      targetName = brand.name;
      targetColor = brand.color;
      targetId = brand.id;
    } else if (targetType === 'personal') {
      targetName = 'مهام شخصية';
      targetColor = '#8B5CF6';
    } else {
      if (!customName.trim()) return;
      targetName = customName.trim();
      targetColor = '#6B7280';
    }

    startTransition(async () => {
      const result = await setDayFocus({
        focusDate: date,
        targetType,
        targetId,
        targetName,
        targetColor,
        notes,
      });
      if (result.entry) {
        onSave(result.entry);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#12121f] border border-white/10 rounded-xl p-5 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-white font-semibold mb-1">تعيين الفوكس</h3>
        <p className="text-gray-500 text-xs mb-4">{dayName} — {date}</p>

        {/* Target type */}
        <div className="flex gap-2 mb-4">
          {(['brand', 'personal', 'custom'] as FocusTargetType[]).map((t) => (
            <button
              key={t}
              onClick={() => setTargetType(t)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                targetType === t
                  ? 'bg-white/10 text-white border-transparent'
                  : 'border-white/10 text-gray-500 hover:text-gray-300'
              }`}
            >
              {t === 'brand' ? '🏷 براند' : t === 'personal' ? '👤 شخصي' : '✏ مخصص'}
            </button>
          ))}
        </div>

        {/* Brand picker */}
        {targetType === 'brand' && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2">
              {brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBrandId(b.id)}
                  className={`text-xs px-3 py-2 rounded-lg border text-right transition-all ${
                    selectedBrandId === b.id
                      ? 'border-transparent text-white'
                      : 'border-white/10 text-gray-400 hover:border-white/20'
                  }`}
                  style={selectedBrandId === b.id ? { background: b.color + '30', borderColor: b.color } : {}}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                    {b.name}
                  </span>
                </button>
              ))}
            </div>
            {neglectedBrands.length > 0 && (
              <p className="text-[10px] text-gray-600 mt-2">
                براندات تشتكي من الإهمال: {neglectedBrands.slice(0, 3).map((b) => b.name).join('، ')}
              </p>
            )}
          </div>
        )}

        {/* Custom name */}
        {targetType === 'custom' && (
          <input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="اسم الفوكس المخصص"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-4 placeholder-gray-600"
          />
        )}

        {/* Notes */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ملاحظات اليوم (اختياري)"
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-4 resize-none h-16 placeholder-gray-600"
        />

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          {existing && (
            <>
              <button
                onClick={onMoveToTomorrow}
                className="text-xs px-3 py-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:border-white/20 transition-all"
              >
                ترحيل للغد ➡️
              </button>
              <button
                onClick={onClear}
                className="text-xs px-3 py-2 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all"
              >
                مسح هذا اليوم
              </button>
            </>
          )}
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">إلغاء</button>
          <button
            onClick={handleSave}
            disabled={
              isPending ||
              (targetType === 'brand' && !selectedBrandId) ||
              (targetType === 'custom' && !customName.trim())
            }
            className="px-4 py-2 text-sm bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white rounded-lg"
          >
            {isPending ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}

function DayCard({
  date,
  entry,
  isToday,
  onClick,
}: {
  date: Date;
  entry: WeeklyFocusEntry | null;
  isToday: boolean;
  onClick: () => void;
}) {
  const dayName = DAY_NAMES[date.getDay()];
  const dateStr = date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });

  return (
    <button
      onClick={onClick}
      className={`flex flex-col p-4 rounded-xl border text-right transition-all hover:scale-[1.02] ${
        isToday
          ? 'border-yellow-500/40 bg-yellow-500/5'
          : 'border-white/8 bg-[#1a1a2e] hover:border-white/20'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-medium ${isToday ? 'text-yellow-400' : 'text-gray-400'}`}>
          {dayName}
        </span>
        <span className="text-[10px] text-gray-600">{dateStr}</span>
      </div>

      {entry ? (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: entry.targetColor }}
            />
            <span className="text-sm text-white font-medium truncate">{entry.targetName}</span>
          </div>
          {entry.notes && (
            <p className="text-[10px] text-gray-500 line-clamp-2 mt-1">{entry.notes}</p>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px] text-gray-700 border border-dashed border-white/5 rounded px-2 py-1">
            + تعيين فوكس
          </span>
        </div>
      )}
    </button>
  );
}

export default function WeeklyFocusClient({ initialEntries, brands }: Props) {
  const [entries, setEntries] = useState<WeeklyFocusEntry[]>(initialEntries);
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const today = new Date();
  const referenceDate = new Date(today);
  referenceDate.setDate(today.getDate() + weekOffset * 7);
  const weekDates = getWeekDates(referenceDate);

  const entryMap = new Map(entries.map((e) => [e.focusDate, e]));

  const todayISO = toISO(today);
  const modalEntry = modalDate ? (entryMap.get(modalDate) ?? null) : null;
  const modalDayName = modalDate ? DAY_NAMES[new Date(modalDate).getDay()] : '';

  function handleSave(entry: WeeklyFocusEntry) {
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.focusDate !== entry.focusDate);
      return [...filtered, entry];
    });
    setModalDate(null);
  }

  function handleClear() {
    if (!modalDate) return;
    const date = modalDate;
    setEntries((prev) => prev.filter((e) => e.focusDate !== date));
    setModalDate(null);
    startTransition(async () => { await clearDayFocus(date); });
  }

  function handleMoveToTomorrow() {
    if (!modalDate) return;
    const date = modalDate;
    const entry = entryMap.get(date);
    if (!entry) return;

    // Calculate next business day
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow === 5) d.setDate(d.getDate() + 2);
    if (dow === 6) d.setDate(d.getDate() + 1);
    const nextDate = toISO(d);

    // Optimistic update
    setEntries((prev) => {
      const filtered = prev.filter((e) => e.focusDate !== date && e.focusDate !== nextDate);
      return [...filtered, { ...entry, focusDate: nextDate }];
    });
    setModalDate(null);

    startTransition(async () => { await moveFocusToNextDay(date); });
  }

  // Stats
  const focusedDays = weekDates.filter((d) => entryMap.has(toISO(d))).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-white">الفوكس الأسبوعي</h1>
          <p className="text-xs text-gray-500 mt-0.5">{focusedDays} من 7 أيام مُعيَّنة</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((o) => o - 1)}
            className="text-gray-500 hover:text-white px-2 py-1 rounded border border-white/10 hover:border-white/20 transition-all text-sm"
          >
            ←
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className={`text-xs px-3 py-1 rounded border transition-all ${
              weekOffset === 0
                ? 'border-yellow-500/40 text-yellow-400'
                : 'border-white/10 text-gray-500 hover:text-gray-300'
            }`}
          >
            هذا الأسبوع
          </button>
          <button
            onClick={() => setWeekOffset((o) => o + 1)}
            className="text-gray-500 hover:text-white px-2 py-1 rounded border border-white/10 hover:border-white/20 transition-all text-sm"
          >
            →
          </button>
        </div>
      </div>

      {/* Week range label */}
      <p className="text-xs text-gray-600 mb-4">
        {weekDates[0].toLocaleDateString('ar-SA', { month: 'long', day: 'numeric' })}
        {' — '}
        {weekDates[6].toLocaleDateString('ar-SA', { month: 'long', day: 'numeric', year: 'numeric' })}
      </p>

      {/* 7-day grid */}
      <div className="grid grid-cols-7 gap-3 flex-1">
        {weekDates.map((date) => {
          const iso = toISO(date);
          return (
            <DayCard
              key={iso}
              date={date}
              entry={entryMap.get(iso) ?? null}
              isToday={iso === todayISO}
              onClick={() => setModalDate(iso)}
            />
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] text-gray-600 mb-1">
          <span>تغطية الأسبوع</span>
          <span>{Math.round((focusedDays / 7) * 100)}%</span>
        </div>
        <div className="h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-500/60 rounded-full transition-all"
            style={{ width: `${(focusedDays / 7) * 100}%` }}
          />
        </div>
      </div>

      {/* Modal */}
      {modalDate && (
        <SetFocusModal
          date={modalDate}
          dayName={modalDayName}
          brands={brands}
          existing={modalEntry}
          onSave={handleSave}
          onClear={handleClear}
          onMoveToTomorrow={handleMoveToTomorrow}
          onClose={() => setModalDate(null)}
        />
      )}
    </div>
  );
}
