/*
 * Ghazi OS — Leadership Client (Sunrise Theme)
 * branch: studio-theme-v1
 * CSS classes مأخوذة مباشرة من ghazi-sunrise(5).html
 * لا inline styles — كل شيء في studio-theme.css
 */
'use client';
import './studio-theme.css';
import { useState, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  addDecision, deleteDecision,
} from '@/lib/leadership-actions';
import { addTask, updateTask } from '@/lib/tasks-actions';
import { addPersonalTask } from '@/lib/personal-actions';
import {
  addInboxTask, deleteInboxTask, updateInboxTask,
  type InboxTask,
} from '@/lib/inbox-actions';
import {
  setDayFocus, clearDayFocus, moveFocusToNextDay,
  type WeeklyFocusEntry, type FocusTargetType,
} from '@/lib/weekly-focus-actions';
import type { DecisionRow, EmployeeRow } from '@/lib/leadership-types';
import {
  addDailyRoutine, toggleDailyRoutine, updateDailyRoutineTime, deleteDailyRoutine,
  type DailyRoutine,
} from '@/lib/daily-routines-actions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChecklistItem { id: string; text: string; done: boolean; }
interface Subtask { id: string; title: string; completed: boolean; }
interface ActiveTask {
  id: string; title: string; status: string; priority: string;
  brandId: string | null; brandName: string | null; brandColor: string | null;
  dueDate: string | null; projectId: string | null; hasDescription: boolean;
  subtasks: Subtask[]; checklist?: ChecklistItem[];
}
interface UpcomingEvent {
  id: string; title: string; day: number; month: number; year: number;
  brandId: string | null; brandName: string | null; brandColor: string | null;
}
interface Brand { id: string; name: string; icon: string; color: string; status: string; }
interface Project { id: string; brandId: string | null; title: string; status: string; priority: string; targetDate: string | null; progress: number; }
interface PersonalTask { id: string; title: string; priority: string; status: string; category: string; }

interface Props {
  decisions: DecisionRow[];
  employees: EmployeeRow[];
  brands: Brand[];
  inboxTasks: InboxTask[];
  weeklyFocus: WeeklyFocusEntry[];
  todaySales: number;
  upcomingEvents: UpcomingEvent[];
  activeTasks: ActiveTask[];
  dailyTasks: string[];
  projects: Project[];
  personalTasks: PersonalTask[];
  dailyRoutines: DailyRoutine[];
}

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_NAMES_SHORT: Record<number, string> = {
  0: 'SUN', 1: 'MON', 2: 'TUE', 3: 'WED', 4: 'THU', 5: 'FRI', 6: 'SAT',
};
const DAY_NAMES_AR: Record<number, string> = {
  0: 'الأحد', 1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
  4: 'الخميس', 5: 'الجمعة', 6: 'السبت',
};
const MONTH_NAMES = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const PRIORITY_COLORS: Record<string, string> = {
  critical: '#FF6B6B', high: '#FFB085', medium: '#4ECDC4', low: '#6BCB77',
};
const PRIORITY_LABELS: Record<string, string> = {
  critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض',
};
const FOCUS_TYPE_LABELS: Record<string, string> = {
  brand: 'براند', project: 'مشروع', task: 'مهمة', personal: 'شخصي', finance: 'مالي', recharge: 'استراحة', custom: 'مخصص',
};
const FOCUS_TYPE_ICONS: Record<string, string> = {
  brand: '🎯', project: '📁', task: '✅', personal: '👤', finance: '💰', recharge: '🌿', custom: '✏️',
};
const DAILY_TIPS = [
  'ابدأ يومك بالمهم مو بالعاجل',
  'لا تطارد الكمال — الإنجاز أهم',
  'ركّز على شيء واحد حتى تخلصه',
  'كل مهمة كبيرة تبدأ بخطوة صغيرة',
  'وقتك أثمن مورد — استثمره بوعي',
  'النجاح عادات يومية، مو أحداث كبيرة',
  'خذ استراحة — العقل المرتاح أكثر إنتاجاً',
];

function toISO(d: Date): string { return d.toISOString().split('T')[0]; }
function todayISO(): string { return toISO(new Date()); }
function fmt(n: number): string { return n.toLocaleString('ar-SA'); }
function dayNameAr(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return DAY_NAMES_AR[d.getDay()] ?? '';
}
function dayNameShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return DAY_NAMES_SHORT[d.getDay()] ?? '';
}
function dateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]}`;
}
function daysLeft(dateStr: string): number {
  const now = new Date(); now.setHours(0,0,0,0);
  const d = new Date(dateStr + 'T00:00:00');
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}
function daysLeftLabel(dateStr: string): string {
  const dl = daysLeft(dateStr);
  if (dl < 0) return `متأخر ${Math.abs(dl)} يوم`;
  if (dl === 0) return 'اليوم';
  if (dl === 1) return 'غداً';
  return `${dl} أيام`;
}
function getWeekDates(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return toISO(d);
  });
}

// ─── Weekly Compass ───────────────────────────────────────────────────────────
function WeeklyCompass({
  weeklyFocus, brands, activeTasks, projects, onOpenEditor,
}: {
  weeklyFocus: WeeklyFocusEntry[];
  brands: Brand[];
  activeTasks: ActiveTask[];
  projects: Project[];
  onOpenEditor: (dateStr: string) => void;
}) {
  const weekDates = getWeekDates();
  const focusMap: Record<string, WeeklyFocusEntry> = {};
  weeklyFocus.forEach(f => { focusMap[f.focusDate] = f; });

  const [dragDate, setDragDate] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleDrop(e: React.DragEvent, targetDate: string) {
    e.preventDefault();
    setDragOverDate(null);
    if (!dragDate || dragDate === targetDate) { setDragDate(null); return; }
    const srcFocus = focusMap[dragDate];
    const dstFocus = focusMap[targetDate];
    if (srcFocus) {
      await setDayFocus({ focusDate: targetDate, targetType: srcFocus.targetType, targetId: srcFocus.targetId, targetName: srcFocus.targetName, targetColor: srcFocus.targetColor, notes: srcFocus.notes });
    } else {
      await clearDayFocus(targetDate);
    }
    if (dstFocus) {
      await setDayFocus({ focusDate: dragDate, targetType: dstFocus.targetType, targetId: dstFocus.targetId, targetName: dstFocus.targetName, targetColor: dstFocus.targetColor, notes: dstFocus.notes });
    } else {
      await clearDayFocus(dragDate);
    }
    setDragDate(null);
    startTransition(() => { window.location.reload(); });
  }

  return (
    <section className="section weekly-compass-section">
      <div className="section-head">
        <div className="section-title-wrap">
          <div className="section-icon" style={{ background: 'var(--sky-light)', color: 'var(--sky-deep)' }}>🧭</div>
          <div className="section-title">
            <div className="section-title-text">بوصلة الأسبوع</div>
            <div className="section-subtitle">Weekly Focus · 7 days</div>
          </div>
        </div>
        <span className="section-link">تعديل →</span>
      </div>
      <div className="week-grid">
        {weekDates.map((dateStr) => {
          const focus = focusMap[dateStr] ?? null;
          const isToday = dateStr === todayISO();
          const isDragOver = dragOverDate === dateStr;
          const color = focus?.targetColor || '#FF6B6B';
          const brand = focus?.targetType === 'brand' ? brands.find(b => b.id === focus.targetId) : null;
          const icon = focus?.targetType === 'brand' ? (brand?.icon ?? '🎯') : focus ? (FOCUS_TYPE_ICONS[focus.targetType] ?? '🎯') : null;
          const proj = focus?.targetType === 'project' ? projects.find(p => p.id === focus.targetId) : null;

          return (
            <div
              key={dateStr}
              className={`day-card${isToday ? ' today' : ''}${isDragOver ? ' drag-over' : ''}`}
              onClick={() => onOpenEditor(dateStr)}
              draggable
              onDragStart={(e) => { setDragDate(dateStr); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDragEnter={() => setDragOverDate(dateStr)}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={(e) => handleDrop(e, dateStr)}
            >
              {isToday && <div className="day-today-badge">اليوم</div>}
              <div className="day-name">{dayNameShort(dateStr)}</div>
              <div className="day-num">{new Date(dateStr + 'T00:00:00').getDate()}</div>
              {!focus ? (
                <div className="day-empty">+</div>
              ) : focus.targetType === 'recharge' ? (
                <div className="day-focus-wrap">
                  <div className="day-focus-emoji">🌿</div>
                  <div className="day-focus-name">استراحة</div>
                  <span className="day-focus-type" style={{ background: 'var(--mint-light)', color: 'var(--mint-deep)' }}>استراحة</span>
                </div>
              ) : (
                <div className="day-focus-wrap">
                  <div className="day-focus-emoji">{icon}</div>
                  <div className="day-focus-name">{focus.targetName}</div>
                  <span className="day-focus-type" style={{ background: `${color}18`, color }}>
                    {FOCUS_TYPE_LABELS[focus.targetType] ?? ''}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Daily Tasks ──────────────────────────────────────────────────────────────
function DailyTasksSection({ routines: initialRoutines }: { routines: DailyRoutine[] }) {
  const [routines, setRoutines] = useState<DailyRoutine[]>(initialRoutines);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMeta, setNewMeta] = useState('');
  const [newTime, setNewTime] = useState('');
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [editingTimeVal, setEditingTimeVal] = useState('');
  const [, startTransition] = useTransition();

  const doneCount = routines.filter(r => r.isDone).length;
  const total = routines.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  function handleToggle(id: string, current: boolean) {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, isDone: !current } : r));
    startTransition(async () => { await toggleDailyRoutine(id, !current); });
  }

  function handleDelete(id: string) {
    setRoutines(prev => prev.filter(r => r.id !== id));
    startTransition(async () => { await deleteDailyRoutine(id); });
  }

  function handleTimeClick(r: DailyRoutine) {
    setEditingTimeId(r.id);
    setEditingTimeVal(r.timeStr);
  }

  function handleTimeSave(id: string) {
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, timeStr: editingTimeVal } : r));
    setEditingTimeId(null);
    startTransition(async () => { await updateDailyRoutineTime(id, editingTimeVal); });
  }

  async function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    // Optimistic update — add immediately with temp id
    const tempId = `temp-${Date.now()}`;
    const optimistic: DailyRoutine = {
      id: tempId,
      title,
      meta: newMeta.trim(),
      timeStr: newTime.trim(),
      isDone: false,
      sortOrder: routines.length + 1,
    };
    setRoutines(prev => [...prev, optimistic]);
    setNewTitle(''); setNewMeta(''); setNewTime('');
    setShowAddForm(false);
    // Persist to Supabase in background
    try {
      const result = await addDailyRoutine({ title, meta: newMeta.trim(), timeStr: newTime.trim() });
      if (result.routine) {
        // Replace temp with real id from DB
        setRoutines(prev => prev.map(r => r.id === tempId ? result.routine! : r));
      }
    } catch {
      // Keep optimistic item even if server fails — will sync on next page load
    }
  }

  return (
    <section className="section daily-tasks-section">
      <div className="section-head">
        <div className="section-title-wrap">
          <div className="section-icon" style={{ background: 'var(--mint-light)', color: 'var(--mint-deep)' }}>☑️</div>
          <div className="section-title">
            <div className="section-title-text">روتينك اليومي</div>
            <div className="section-subtitle">مهام ثابتة كل يوم · <span>{doneCount}</span> من {total} منجزة</div>
          </div>
        </div>
        <button
          className="section-link"
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          onClick={() => setShowAddForm(v => !v)}
        >+ إضافة</button>
      </div>
      <div className="daily-progress">
        <div className="daily-progress-bar" style={{ width: `${pct}%` }} />
      </div>
      {showAddForm && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap', direction: 'rtl' }}>
          <input
            placeholder="اسم المهمة *"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            style={{ flex: '1 1 140px', padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'inherit', fontSize: 13 }}
          />
          <input
            placeholder="التفاصيل (مثال: 📊 من سلة)"
            value={newMeta}
            onChange={e => setNewMeta(e.target.value)}
            style={{ flex: '1 1 140px', padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'inherit', fontSize: 13 }}
          />
          <input
            placeholder="الوقت (مثال: 8:00 ص)"
            value={newTime}
            onChange={e => setNewTime(e.target.value)}
            style={{ flex: '0 1 110px', padding: '6px 10px', borderRadius: 8, border: '1px solid #ddd', fontFamily: 'inherit', fontSize: 13 }}
          />
          <button
            onClick={handleAdd}
            style={{ padding: '6px 16px', borderRadius: 8, background: 'var(--mint-deep)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
          >حفظ</button>
          <button
            onClick={() => { setShowAddForm(false); setNewTitle(''); setNewMeta(''); setNewTime(''); }}
            style={{ padding: '6px 12px', borderRadius: 8, background: '#f0f0f0', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}
          >إلغاء</button>
        </div>
      )}
      <div className="daily-grid">
        {routines.map((r) => (
          <div key={r.id} className={`daily-task${r.isDone ? ' done' : ''}`}>
            <div
              className={`daily-checkbox${r.isDone ? ' checked' : ''}`}
              onClick={() => handleToggle(r.id, r.isDone)}
            >
              {r.isDone && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div className="daily-task-body">
              <div className="daily-task-title">{r.title}</div>
              {r.meta && <div className="daily-task-meta">{r.meta}</div>}
            </div>
            {editingTimeId === r.id ? (
              <input
                value={editingTimeVal}
                onChange={e => setEditingTimeVal(e.target.value)}
                onBlur={() => handleTimeSave(r.id)}
                onKeyDown={e => e.key === 'Enter' && handleTimeSave(r.id)}
                autoFocus
                style={{ width: 80, padding: '2px 6px', borderRadius: 6, border: '1px solid #ccc', fontSize: 12, fontFamily: 'inherit', textAlign: 'center' }}
              />
            ) : (
              <span
                className="daily-time"
                onClick={() => handleTimeClick(r)}
                title="انقر لتعديل الوقت"
                style={{ cursor: 'pointer' }}
              >{r.timeStr || '—'}</span>
            )}
            <button
              onClick={() => handleDelete(r.id)}
              title="حذف"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
            >✕</button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Focus Editor Modal ───────────────────────────────────────────────────────
function FocusEditorModal({
  dateStr, weeklyFocus, brands, projects, activeTasks, personalTasks,
  onClose, onSaved,
}: {
  dateStr: string;
  weeklyFocus: WeeklyFocusEntry[];
  brands: Brand[];
  projects: Project[];
  activeTasks: ActiveTask[];
  personalTasks: PersonalTask[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const focusMap: Record<string, WeeklyFocusEntry> = {};
  weeklyFocus.forEach(f => { focusMap[f.focusDate] = f; });
  const existing = focusMap[dateStr] ?? null;

  const [type, setType] = useState<FocusTargetType>(existing?.targetType ?? 'brand');
  const [selectedId, setSelectedId] = useState<string | null>(existing?.targetId ?? null);
  const [selectedName, setSelectedName] = useState(existing?.targetName ?? '');
  const [selectedColor, setSelectedColor] = useState(existing?.targetColor ?? '#FF6B6B');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [customText, setCustomText] = useState(existing?.targetType === 'custom' ? (existing?.targetName ?? '') : '');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const isToday = dateStr === todayISO();
  const focusedBrandIds = new Set(weeklyFocus.filter(f => f.targetType === 'brand').map(f => f.targetId).filter(Boolean));
  const hungryBrands = brands.filter(b => !focusedBrandIds.has(b.id)).slice(0, 5);

  function handleTypeSelect(t: FocusTargetType) {
    setType(t); setSelectedId(null); setSelectedName(''); setSelectedColor('#FF6B6B');
    setBrandFilter(''); setPriorityFilter('');
  }
  function handleTargetSelect(id: string, name: string, color: string) {
    setSelectedId(id); setSelectedName(name); setSelectedColor(color);
  }

  async function handleSave() {
    let finalName = selectedName, finalId = selectedId, finalColor = selectedColor;
    if (type === 'custom') { finalName = customText.trim(); finalId = null; finalColor = '#888'; }
    if (type === 'finance') { finalName = 'يوم مالي'; finalId = null; finalColor = '#6BCB77'; }
    if (type === 'recharge') { finalName = 'استراحة'; finalId = null; finalColor = '#4ECDC4'; }
    if (type === 'personal' && !finalName) { finalName = 'مهام شخصية'; finalColor = '#A78BFA'; }
    if (!finalName) return;
    startTransition(async () => {
      await setDayFocus({ focusDate: dateStr, targetType: type, targetId: finalId, targetName: finalName, targetColor: finalColor, notes });
      onSaved();
    });
  }

  async function handleClear() {
    startTransition(async () => { await clearDayFocus(dateStr); onSaved(); });
  }

  async function handleMigrateToNext() {
    startTransition(async () => { await moveFocusToNextDay(dateStr); onSaved(); });
  }

  const isSaveDisabled = isPending || (
    (type === 'brand' || type === 'project' || type === 'task') && !selectedId
  ) || (type === 'custom' && !customText.trim());

  function buildTargetList() {
    if (type === 'brand') {
      return brands.map(b => (
        <button key={b.id} onClick={() => handleTargetSelect(b.id, b.name, b.color)}
          className={`modal-target-btn${selectedId === b.id ? ' selected' : ''}`}
          style={{ borderColor: selectedId === b.id ? b.color : undefined, background: selectedId === b.id ? `${b.color}12` : undefined }}
        >
          <span>{b.icon}</span>
          <span className="flex-1">{b.name}</span>
          {selectedId === b.id && <span style={{ color: b.color }}>✓</span>}
        </button>
      ));
    }
    if (type === 'project') {
      const filtered = brandFilter ? projects.filter(p => p.brandId === brandFilter) : projects;
      return (
        <>
          <select className="modal-select" value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
            <option value="">كل البراندات</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
          </select>
          {filtered.map(p => {
            const brand = brands.find(b => b.id === p.brandId);
            return (
              <button key={p.id} onClick={() => handleTargetSelect(p.id, p.title, brand?.color ?? '#FF6B6B')}
                className={`modal-target-btn${selectedId === p.id ? ' selected' : ''}`}
              >
                <span>📁</span>
                <span className="flex-1">{p.title}</span>
                {brand && <span className="modal-brand-tag" style={{ color: brand.color }}>{brand.name}</span>}
                {selectedId === p.id && <span style={{ color: '#FF6B6B' }}>✓</span>}
              </button>
            );
          })}
        </>
      );
    }
    if (type === 'task') {
      const filtered = priorityFilter ? activeTasks.filter(t => t.priority === priorityFilter) : activeTasks;
      return (
        <>
          <select className="modal-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">كل الأولويات</option>
            <option value="critical">حرج</option>
            <option value="high">عالي</option>
            <option value="medium">متوسط</option>
            <option value="low">منخفض</option>
          </select>
          {filtered.slice(0, 10).map(t => (
            <button key={t.id} onClick={() => handleTargetSelect(t.id, t.title, PRIORITY_COLORS[t.priority] ?? '#FF6B6B')}
              className={`modal-target-btn${selectedId === t.id ? ' selected' : ''}`}
              style={{ borderRight: `3px solid ${PRIORITY_COLORS[t.priority] ?? '#FF6B6B'}` }}
            >
              <span className="priority-dot" style={{ background: PRIORITY_COLORS[t.priority] ?? '#888' }} />
              <span className="flex-1">{t.title}</span>
              {t.brandName && <span className="modal-brand-tag" style={{ color: t.brandColor ?? '#8B8F9F' }}>{t.brandName}</span>}
              {selectedId === t.id && <span style={{ color: '#FF6B6B' }}>✓</span>}
            </button>
          ))}
          {filtered.length === 0 && <div className="modal-empty">لا توجد مهام مطابقة</div>}
        </>
      );
    }
    if (type === 'personal') {
      const filtered = priorityFilter ? personalTasks.filter(t => t.priority === priorityFilter) : personalTasks;
      return (
        <>
          <select className="modal-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">كل الأولويات</option>
            <option value="critical">حرج</option>
            <option value="high">عالي</option>
            <option value="medium">متوسط</option>
            <option value="low">منخفض</option>
          </select>
          {filtered.slice(0, 10).map(t => (
            <button key={t.id} onClick={() => handleTargetSelect(t.id, t.title, PRIORITY_COLORS[t.priority] ?? '#A78BFA')}
              className={`modal-target-btn${selectedId === t.id ? ' selected' : ''}`}
            >
              <span className="priority-dot" style={{ background: PRIORITY_COLORS[t.priority] ?? '#A78BFA' }} />
              <span className="flex-1">{t.title}</span>
              {selectedId === t.id && <span style={{ color: '#A78BFA' }}>✓</span>}
            </button>
          ))}
        </>
      );
    }
    if (type === 'finance') {
      return (
        <div className="modal-type-info">
          <div className="modal-type-emoji">💰</div>
          <div className="modal-type-label" style={{ color: '#6BCB77' }}>يوم مالي</div>
          <div className="modal-tags">
            {['مراجعة الحسابات', 'دفع الرواتب', 'تحليل المبيعات', 'مراجعة المصاريف', 'تخطيط الميزانية'].map(tag => (
              <span key={tag} className="modal-tag" style={{ background: '#F0FFF4', color: '#6BCB77' }}>{tag}</span>
            ))}
          </div>
        </div>
      );
    }
    if (type === 'recharge') {
      return (
        <div className="modal-type-info">
          <div className="modal-type-emoji">🌿</div>
          <div className="modal-type-label" style={{ color: '#4ECDC4' }}>يوم استراحة وشحن طاقة</div>
          <div className="modal-tags">
            {['نوم كافٍ', 'رياضة خفيفة', 'وقت عائلي', 'قراءة', 'تأمل وتفكير'].map(tag => (
              <span key={tag} className="modal-tag" style={{ background: '#F0FFFE', color: '#4ECDC4' }}>{tag}</span>
            ))}
          </div>
        </div>
      );
    }
    if (type === 'custom') {
      return (
        <input className="modal-input" placeholder="اكتب اسم الفوكس..." value={customText} onChange={e => setCustomText(e.target.value)} />
      );
    }
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">🧭 تعيين فوكس — {dayNameAr(dateStr)}</div>
            <div className="modal-subtitle">{dateShort(dateStr)}{isToday ? ' — اليوم' : ''}</div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {hungryBrands.length > 0 && (
            <div className="hungry-brands-box">
              <div className="hungry-brands-label">⚡ براندات بدون فوكس هذا الأسبوع:</div>
              <div className="hungry-brands-list">
                {hungryBrands.map(b => (
                  <button key={b.id}
                    onClick={() => { handleTypeSelect('brand'); handleTargetSelect(b.id, b.name, b.color); }}
                    className="hungry-brand-btn"
                    style={{ border: `1.5px solid ${b.color}`, color: b.color }}
                  >
                    <span>{b.icon}</span>
                    <span>{b.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="modal-section">
            <div className="modal-section-label">نوع الفوكس</div>
            <div className="modal-type-list">
              {(['brand', 'project', 'task', 'personal', 'finance', 'recharge', 'custom'] as FocusTargetType[]).map(t => (
                <button key={t} onClick={() => handleTypeSelect(t)}
                  className={`modal-type-btn${type === t ? ' active' : ''}`}
                >
                  <span>{FOCUS_TYPE_ICONS[t]}</span>
                  <span>{FOCUS_TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="modal-section">
            <div className="modal-section-label">
              {type === 'brand' ? 'اختر البراند' : type === 'project' ? 'اختر المشروع' : type === 'task' ? 'اختر المهمة' : type === 'personal' ? 'اختر المهمة الشخصية' : type === 'finance' ? 'تفاصيل اليوم المالي' : type === 'recharge' ? 'تفاصيل الاستراحة' : 'اكتب الفوكس'}
            </div>
            <div className="modal-target-scroll">{buildTargetList()}</div>
          </div>
          <div className="modal-section">
            <div className="modal-section-label">ملاحظات (اختياري)</div>
            <textarea className="modal-textarea" rows={2} placeholder="أضف ملاحظة..." value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <button onClick={handleSave} disabled={isSaveDisabled} className={`modal-save-btn${isSaveDisabled ? ' disabled' : ''}`}>
            {isPending ? '...' : '💾 حفظ'}
          </button>
          {existing && (
            <div className="modal-actions">
              <button onClick={handleMigrateToNext} disabled={isPending} className="modal-action-btn migrate">ترحيل للغد ➡️</button>
              <button onClick={handleClear} disabled={isPending} className="modal-action-btn clear">🗑 مسح</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Focus Hero ───────────────────────────────────────────────────────────────
function FocusHero({
  todayFocus, activeTasks, personalTasks, brands, projects, onOpenEditor,
}: {
  todayFocus: WeeklyFocusEntry | null;
  activeTasks: ActiveTask[];
  personalTasks: PersonalTask[];
  brands: Brand[];
  projects: Project[];
  onOpenEditor: () => void;
}) {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();
  const tip = DAILY_TIPS[new Date().getDay() % DAILY_TIPS.length];

  const sorted = useMemo(() => todayFocus ? activeTasks.filter(t => {
    if (todayFocus.targetType === 'brand') return t.brandId === todayFocus.targetId;
    if (todayFocus.targetType === 'project') return t.projectId === todayFocus.targetId;
    if (todayFocus.targetType === 'task') return t.id === todayFocus.targetId;
    return false;
  }).sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.priority as keyof typeof order] ?? 4) - (order[b.priority as keyof typeof order] ?? 4);
  }) : [], [todayFocus, activeTasks]);

  const selectedTask = selectedTaskId ? sorted.find(t => t.id === selectedTaskId) ?? null : null;

  // Recharge mode
  if (todayFocus?.targetType === 'recharge') {
    return (
      <section className="focus-hero recharge" >
        <div className="focus-content">
          <div>
            <div className="focus-label">
              <span className="focus-label-dot" style={{ background: '#4ECDC4' }} />
              <span>وضع الشحن — يوم استراحة مقصود</span>
            </div>
            <h1 className="focus-title" style={{ color: '#4ECDC4' }}>🌿 يوم الاستراحة</h1>
            <p className="focus-subtitle">استرح اليوم — الطاقة المشحونة تساوي إنتاجية أكبر غداً.</p>
          </div>
          <div className="focus-icon-big">🌿</div>
        </div>
      </section>
    );
  }

  // No focus
  if (!todayFocus) {
    return (
      <section className="focus-hero no-focus" >
        <div className="focus-content">
          <div>
            <div className="focus-label">
              <span className="focus-label-dot" />
              <span>الشيء الواحد الآن · Today&apos;s ONE Thing</span>
            </div>
            <h1 className="focus-title">لم يُحدَّد فوكس اليوم</h1>
            <p className="focus-subtitle">{tip}</p>
            <div className="focus-cta">
              <button className="focus-btn" onClick={onOpenEditor}>
                <span>🧭</span>
                <span>حدد فوكس اليوم</span>
              </button>
            </div>
          </div>
          <div className="focus-icon-big">🎯</div>
        </div>
      </section>
    );
  }

  const color = todayFocus.targetColor || '#FF6B6B';
  const brand = todayFocus.targetType === 'brand' ? brands.find(b => b.id === todayFocus.targetId) : null;
  const project = todayFocus.targetType === 'project' ? projects.find(p => p.id === todayFocus.targetId) : null;

  // Selected task view
  if (selectedTask) {
    const taskBrand = brands.find(b => b.id === selectedTask.brandId);
    const taskColor = taskBrand?.color || color;
    const stTotal = selectedTask.subtasks.length;
    const stDone = selectedTask.subtasks.filter(s => s.completed).length;
    const clItems = selectedTask.checklist ?? [];
    const totalItems = stTotal + clItems.length;
    const doneItems = stDone + clItems.filter(c => c.done).length;
    const isOverdue = selectedTask.dueDate && daysLeft(selectedTask.dueDate) < 0;
    const nextSteps = [
      ...selectedTask.subtasks.filter(s => !s.completed).map(s => ({ id: s.id, title: s.title, type: 'مهمة فرعية' })),
      ...clItems.filter(c => !c.done).map(c => ({ id: c.id, title: c.text, type: 'قائمة' })),
    ].slice(0, 3);

    const progressPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
    return (
      <section className="focus-hero">
        {/* ── LEFT COLUMN: Task info + action buttons ─────────────────────── */}
        <div style={{
          display: 'flex', flexDirection: 'column',
          background: 'rgba(255,255,255,0.65)',
          border: '1px solid rgba(255,255,255,0.9)',
          padding: 32, borderRadius: 24, flex: 1,
          boxShadow: '0 8px 32px rgba(0,0,0,0.03)',
          minHeight: '100%', position: 'relative', zIndex: 2,
        }}>
          {/* Badge + Title */}
          <div className="focus-label" style={{ marginBottom: 16 }}>
            <span className="focus-label-dot" style={{ background: taskColor }} />
            <span>مهمة الفوكس</span>
          </div>
          <h1 className="focus-title" style={{ marginBottom: 10 }}>{selectedTask.title}</h1>
          {/* Tags row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <span style={{ background: '#FFF7ED', color: '#C2410C', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
              مهمة
            </span>
            <span style={{ background: `${PRIORITY_COLORS[selectedTask.priority]}18`, color: PRIORITY_COLORS[selectedTask.priority], padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
              {PRIORITY_LABELS[selectedTask.priority]}
            </span>
            {taskBrand && (
              <span style={{ background: '#FFF7ED', color: '#C2410C', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {taskBrand.icon} {taskBrand.name}
              </span>
            )}
            {isOverdue && (
              <span style={{ background: '#FEE2E2', color: '#991B1B', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                ⚠️ متأخرة
              </span>
            )}
          </div>
          {/* Progress section */}
          {totalItems > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#431407' }}>إنجاز المهام الفرعية</span>
                <span style={{ fontSize: 14, fontWeight: 900, color: '#EA580C' }}>{doneItems}/{totalItems}</span>
              </div>
              <div style={{ height: 10, background: 'rgba(0,0,0,0.06)', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#EA580C', borderRadius: 100, width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}
          {/* Next steps */}
          {nextSteps.length > 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {nextSteps.map(step => (
                <div key={step.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#FFFFFF', padding: '14px 18px', borderRadius: 14,
                  border: '1px solid rgba(0,0,0,0.04)', boxShadow: '0 4px 12px rgba(0,0,0,0.02)', gap: 14,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
                    <input type="checkbox" onClick={(e) => e.stopPropagation()} style={{ width: 20, height: 20, accentColor: '#EA580C', cursor: 'pointer', flexShrink: 0, margin: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>{step.title}</span>
                  </div>
                  <span style={{ background: '#FFF7ED', color: '#C2410C', padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{step.type}</span>
                </div>
              ))}
              {totalItems - doneItems > nextSteps.length && (
                <div style={{ fontSize: 12, color: '#9A6B4B', textAlign: 'center', padding: 8, fontWeight: 500 }}>
                  + {totalItems - doneItems - nextSteps.length} أخرى...
                </div>
              )}
            </div>
          )}
          {/* 2x2 Action buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 'auto' }}>
            <button style={{ background: '#DCFCE7', color: '#166534', padding: '14px 16px', borderRadius: 14, fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>✓ خلصت</button>
            <button style={{ background: '#FEE2E2', color: '#991B1B', padding: '14px 16px', borderRadius: 14, fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>✋ عالق</button>
            <button style={{ background: '#FFEDD5', color: '#9A3412', padding: '14px 16px', borderRadius: 14, fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>⏰ بعدين</button>
            <button onClick={() => setSelectedTaskId(null)} style={{ background: '#F1F5F9', color: '#334155', padding: '14px 16px', borderRadius: 14, fontWeight: 800, border: 'none', cursor: 'pointer', fontSize: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontFamily: 'inherit' }}>🔄 تغيير</button>
          </div>
          {/* Open details link */}
          <Link href={`/tasks/${selectedTask.id}`} style={{ fontSize: 12, color: '#EA580C', display: 'block', textAlign: 'center', marginTop: 14, fontWeight: 600 }}>فتح التفاصيل الكاملة ←</Link>
        </div>
        {/* ── RIGHT COLUMN: Big icon + task count ─────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, position: 'relative', zIndex: 2 }}>
          <div className="focus-icon-big" style={{ width: 100, height: 100, fontSize: 56 }}>✅</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#EA580C' }}>{progressPct}%</div>
            <div style={{ fontSize: 13, color: '#9A6B4B', fontWeight: 600 }}>مكتمل</div>
          </div>
        </div>
      </section>
    );
  }

  // Main focus view — Premium 2-column layout
  return (
    <section className="focus-hero">
      {/* ── LEFT COLUMN: Main info ───────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'relative', zIndex: 2 }}>
        {/* Badge */}
        <div className="focus-label">
          <span className="focus-label-dot" />
          <span>الشيء الواحد الآن · Today&apos;s ONE Thing</span>
        </div>
        {/* Icon + Title row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
          <div className="focus-icon-big">🎯</div>
          <div style={{ flex: 1 }}>
            <h1 className="focus-title">{todayFocus.targetName}</h1>
            {/* Tags row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {brand && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
                  fontSize: 12, fontWeight: 600, color: '#EA580C',
                }}>
                  {brand.icon} {brand.name}
                </span>
              )}
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20,
                background: 'rgba(67,20,7,0.06)', border: '1px solid rgba(67,20,7,0.1)',
                fontSize: 12, fontWeight: 600, color: '#7C3D1A',
              }}>
                {FOCUS_TYPE_ICONS[todayFocus.targetType]} {FOCUS_TYPE_LABELS[todayFocus.targetType]}
              </span>
              {sorted.length > 0 && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', borderRadius: 20,
                  background: 'rgba(234,88,12,0.06)', border: '1px solid rgba(234,88,12,0.15)',
                  fontSize: 12, fontWeight: 600, color: '#9A6B4B',
                }}>
                  ✅ {sorted.length} مهمة
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Progress bar if available */}
        {project && project.progress > 0 && (
          <div className="focus-progress-wrap">
            <div className="focus-progress-bar">
              <div className="focus-progress-fill" style={{ width: `${project.progress}%`, background: '#EA580C' }} />
            </div>
            <span className="focus-progress-label">{project.progress}%</span>
          </div>
        )}
        {/* Action buttons */}
        <div className="focus-cta">
          <button className="focus-btn" onClick={onOpenEditor} style={{ fontSize: 14 }}>
            🚀 ابدأ الآن
          </button>
          <button className="focus-btn ghost" onClick={onOpenEditor}>
            🔄 تغيير المهمة
          </button>
        </div>
      </div>
      {/* ── RIGHT COLUMN: Premium subtask checklist ──────────────────────── */}
      <div className="focus-hero-right-col" style={{ position: 'relative', zIndex: 2 }}>
        {sorted.length > 0 ? (
          <>
            <div className="focus-hero-right-col-label">
              المهام المرتبطة ({sorted.length})
            </div>
            {sorted.slice(0, 5).map(t => {
              const pColor = PRIORITY_COLORS[t.priority] ?? '#8B8F9F';
              const pLabel = PRIORITY_LABELS[t.priority];
              const effectiveStatus = localStatuses[t.id] ?? t.status;
              const isDone = effectiveStatus === 'done';
              return (
                <div key={t.id} className="premium-subtask" onClick={() => setSelectedTaskId(t.id)} style={{
                  cursor: 'pointer',
                  opacity: isDone ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  transition: 'all 0.2s ease',
                }}>
                  <input
                    type="checkbox"
                    checked={isDone}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      const newStatus = e.target.checked ? 'done' : 'todo';
                      // Optimistic UI update
                      setLocalStatuses(prev => ({ ...prev, [t.id]: newStatus }));
                      // Persist to DB
                      startTransition(async () => {
                        const result = await updateTask({ id: t.id, status: newStatus as 'todo' | 'in_progress' | 'on_hold' | 'done' });
                        if (result.error) {
                          // Revert on error
                          setLocalStatuses(prev => ({ ...prev, [t.id]: t.status }));
                        }
                      });
                    }}
                    style={{ cursor: 'pointer', width: 20, height: 20, accentColor: '#EA580C', flexShrink: 0 }}
                  />
                  <span style={{
                    flex: 1,
                    textDecoration: isDone ? 'line-through' : 'none',
                    color: isDone ? '#9A6B4B' : '#431407',
                    transition: 'all 0.2s',
                  }}>{t.title}</span>
                  <span className="premium-subtask-priority" style={{ background: `${pColor}18`, color: pColor }}>
                    {pLabel}
                  </span>
                </div>
              );
            })}
            {sorted.length > 5 && (
              <div className="premium-subtask-more">+ {sorted.length - 5} مهمة أخرى</div>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, opacity: 0.6 }}>
            <span style={{ fontSize: 40 }}>✨</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#9A6B4B', textAlign: 'center' }}>لا توجد مهام مرتبطة بعد</span>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Decisions Panel ──────────────────────────────────────────────────────────
function DecisionsPanel({ decisions, brands }: { decisions: DecisionRow[]; brands: Brand[] }) {
  if (!decisions.length) {
    return <div className="empty-state">✅ كل القرارات محسومة!</div>;
  }
  return (
    <div>
      {decisions.slice(0, 5).map(d => {
        const brand = brands.find(b => b.id === d.brand_id);
        const impact = d.impact ?? 'medium';
        return (
          <div key={d.id} className={`decision-item ${impact}`}>
            <div className="decision-title">{d.title}</div>
            <div className="decision-meta">
              <span className={`impact-badge ${impact}`}>
                {impact === 'critical' || impact === 'high' ? 'حرج' : impact === 'medium' ? 'متوسط' : 'منخفض'}
              </span>
              {brand && <span className="decision-brand">{brand.name}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Calendar Mini ────────────────────────────────────────────────────────────
function CalendarMini({ upcomingEvents, brands, activeTasks }: { upcomingEvents: UpcomingEvent[]; brands: Brand[]; activeTasks: ActiveTask[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const [selectedDate, setSelectedDate] = useState<number | null>(null);

  // Build a set of days that have events
  const eventDays = new Set(upcomingEvents.map(e => e.day));

  // Build a set of days that have tasks with due dates in the current month/year
  const taskDays = new Set<number>();
  activeTasks.forEach(t => {
    if (!t.dueDate) return;
    const d = new Date(t.dueDate);
    if (d.getFullYear() === year && d.getMonth() === month) {
      taskDays.add(d.getDate());
    }
  });

  // Tomorrow's date
  const tomorrow = new Date(now);
  tomorrow.setDate(today + 1);
  const tomorrowDay = tomorrow.getDate();
  const tomorrowMonth = tomorrow.getMonth(); // 0-indexed
  const tomorrowYear = tomorrow.getFullYear();

  // Items for the selected date
  const selectedEvents = selectedDate
    ? upcomingEvents.filter(e => e.day === selectedDate && e.month === month + 1 && e.year === year)
    : [];
  const selectedTasks = selectedDate
    ? activeTasks.filter(t => {
        if (!t.dueDate) return false;
        const d = new Date(t.dueDate);
        return d.getFullYear() === year && d.getMonth() === month && d.getDate() === selectedDate;
      })
    : [];

  // Tomorrow's items
  const tomorrowEvents = upcomingEvents.filter(e =>
    e.day === tomorrowDay && e.month === tomorrowMonth + 1 && e.year === tomorrowYear
  );
  const tomorrowTasks = activeTasks.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getFullYear() === tomorrowYear && d.getMonth() === tomorrowMonth && d.getDate() === tomorrowDay;
  });

  // Build calendar days array for compact grid
  const calendarDays: { num: number; isToday: boolean; isMuted: boolean; hasDot: boolean; }[] = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push({ num: 0, isToday: false, isMuted: true, hasDot: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push({
      num: d,
      isToday: d === today,
      isMuted: false,
      hasDot: eventDays.has(d) || taskDays.has(d),
    });
  }
  const ARABIC_MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  // Upcoming events sorted by date
  const upcomingSorted = [...upcomingEvents]
    .filter(e => {
      const d = new Date(e.year, e.month - 1, e.day);
      const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d >= todayDate;
    })
    .sort((a, b) => {
      const da = new Date(a.year, a.month - 1, a.day).getTime();
      const db = new Date(b.year, b.month - 1, b.day).getTime();
      return da - db;
    })
    .slice(0, 8);
  return (
    <div className="compact-calendar-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#1E293B', margin: 0 }}>
            {ARABIC_MONTHS[month]} {year}
          </h3>
          <span style={{ fontSize: 12, color: '#64748B' }}>{upcomingEvents.length} أحداث قادمة</span>
        </div>
        <div style={{ background: '#FFF7ED', padding: 8, borderRadius: 10, color: '#EA580C', fontSize: 18 }}>📅</div>
      </div>
      {/* Compact calendar grid */}
      <div className="compact-calendar-grid">
        {['أح','اث','ث','أر','خ','ج','س'].map((d, i) => (
          <div key={`h-${i}`} className="compact-calendar-day-header">{d}</div>
        ))}
        {calendarDays.map((day, idx) => {
          if (day.num === 0) return <div key={`e-${idx}`} />;
          const isSelected = day.num === selectedDate;
          let cls = 'compact-calendar-cell';
          if (day.isToday) cls += ' is-today';
          else if (isSelected) cls += ' is-selected';
          if (day.hasDot && !day.isToday) cls += ' has-dot';
          return (
            <div key={day.num} className={cls} onClick={() => setSelectedDate(day.num === selectedDate ? null : day.num)}>
              {day.num}
            </div>
          );
        })}
      </div>
      {/* Day Details Modal */}
      {selectedDate && (selectedEvents.length > 0 || selectedTasks.length > 0) && (
        <div onClick={() => setSelectedDate(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 16, padding: '20px 24px', minWidth: 300, maxWidth: 420, width: '90vw', direction: 'rtl', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <button onClick={() => setSelectedDate(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#94A3B8' }}>✕</button>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#1E293B' }}>{selectedDate} {ARABIC_MONTHS[month]}</div>
            </div>
            {selectedEvents.map(e => {
              const brand = brands.find(b => b.id === e.brandId);
              return (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#F8FAFC', borderRadius: 10, marginBottom: 6 }}>
                  <span style={{ flex: 1, fontSize: 13, color: '#1E293B' }}>{e.title}</span>
                  {brand && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${brand.color}22`, color: brand.color, fontWeight: 600 }}>{brand.icon} {brand.name}</span>}
                </div>
              );
            })}
            {selectedTasks.map(t => {
              const brand = brands.find(b => b.id === t.brandId);
              const isDone = t.status === 'done';
              return (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: '#F8FAFC', borderRadius: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: 14 }}>{isDone ? '☑️' : '⬜'}</span>
                  <span style={{ flex: 1, fontSize: 13, color: '#1E293B', textDecoration: isDone ? 'line-through' : 'none' }}>{t.title}</span>
                  {brand && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${brand.color}22`, color: brand.color, fontWeight: 600 }}>{brand.icon}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {/* Upcoming section */}
      <div className="upcoming-section">
        <h4 style={{ fontSize: 13, fontWeight: 800, color: '#431407', marginBottom: 10, marginTop: 0 }}>قادم</h4>
        {upcomingSorted.length === 0 ? (
          <div style={{ fontSize: 12, color: '#94A3B8', textAlign: 'center', padding: '16px 0' }}>لا توجد أحداث قادمة قريباً.</div>
        ) : (
          upcomingSorted.map(e => {
            const brand = brands.find(b => b.id === e.brandId);
            return (
              <div key={e.id} className="upcoming-item">
                <div className="upcoming-item-date">
                  <div className="upcoming-item-date-day">{e.day}</div>
                  <div className="upcoming-item-date-month">{ARABIC_MONTHS[e.month - 1]?.slice(0, 3)}</div>
                </div>
                <span className="upcoming-item-title">{e.title}</span>
                {brand && (
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, background: `${brand.color}18`, color: brand.color, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {brand.icon}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
// ─── Inbox Panel ──────────────────────────────────────────────────────────────
function formatInboxDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const itemDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (itemDay.getTime() === today.getTime()) return 'اليوم';
  if (itemDay.getTime() === yesterday.getTime()) return 'أمس';
  const MONTHS = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function InboxPanel({ inboxTasks, brands }: { inboxTasks: InboxTask[]; brands: Brand[] }) {
  const [tasks, setTasks] = useState<InboxTask[]>(inboxTasks);
  const [newText, setNewText] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [, startTransition] = useTransition();
  // Sync when prop changes (after server revalidation)
  useMemo(() => { setTasks(inboxTasks); }, [inboxTasks]);
  async function handleAdd() {
    if (!newText.trim()) return;
    const text = newText.trim();
    setNewText('');
    const tempItem: InboxTask = { id: `temp-${Date.now()}`, text, created_at: new Date().toISOString() };
    setTasks(prev => [tempItem, ...prev]);
    startTransition(async () => { await addInboxTask(text); });
  }
  async function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    startTransition(async () => { await deleteInboxTask(id); });
  }
  async function handleMove(task: InboxTask, target: 'personal' | string) {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    setExpandedId(null);
    try {
      if (target === 'personal') {
        await addPersonalTask({ title: task.text, status: 'todo', priority: 'medium', category: 'ideas' });
      } else {
        await addTask({ title: task.text, status: 'todo', priority: 'medium', brandId: target });
      }
      await deleteInboxTask(task.id);
    } catch {
      // Keep removed optimistically — server action failed silently
    }
  }
  function startEdit(task: InboxTask) {
    setEditingId(task.id);
    setEditText(task.text);
    setExpandedId(null);
  }
  function handleSaveEdit(id: string) {
    const text = editText.trim();
    if (!text) { setEditingId(null); return; }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text } : t));
    setEditingId(null);
    startTransition(async () => { await updateInboxTask(id, text); });
  }
  return (
    <div>
      <input
        className="inbox-input"
        placeholder="💭 فكرة جديدة..."
        type="text"
        value={newText}
        onChange={e => setNewText(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
      />
      {tasks.length === 0 ? (
        <div className="empty-state">صندوق الوارد فارغ ✨</div>
      ) : (
        tasks.slice(0, 8).map(t => (
          <div key={t.id} style={{ marginBottom: 6 }}>
            {/* Main task row */}
            <div className="inbox-item" style={{ alignItems: 'flex-start', flexWrap: 'wrap', minWidth: 0 }}>
              <div className="inbox-icon" style={{ marginTop: 2, flexShrink: 0 }}>💡</div>
              <div className="inbox-item-text" style={{ flex: 1, minWidth: 0 }}>
                {editingId === t.id ? (
                  <input
                    autoFocus
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveEdit(t.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => handleSaveEdit(t.id)}
                    style={{
                      width: '100%', background: 'transparent', border: 'none',
                      borderBottom: '1px solid var(--gold, #f0a500)', fontSize: '13px',
                      color: 'var(--txt, var(--ink))', outline: 'none', fontFamily: 'inherit', padding: '2px 0',
                    }}
                  />
                ) : (
                  <div
                    onClick={() => startEdit(t)}
                    style={{ cursor: 'text', wordBreak: 'break-word', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}
                  >{t.text}</div>
                )}
                <div style={{ fontSize: 10, color: 'var(--ink-faded, #aaa)', marginTop: 2 }}>{formatInboxDate(t.created_at)}</div>
              </div>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexShrink: 0, marginTop: 2 }}>
                <button
                  onClick={() => startEdit(t)}
                  className="inbox-delete"
                  title="تعديل"
                  style={{ fontSize: 12, padding: '0 6px' }}
                >✏️</button>
                <button
                  onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}
                  className="inbox-delete"
                  title="نقل إلى..."
                  style={{ fontSize: 12, padding: '0 6px' }}
                >📁</button>
                <button onClick={() => handleDelete(t.id)} className="inbox-delete">✕</button>
              </div>
            </div>
            {/* Inline accordion — move targets */}
            {expandedId === t.id && (
              <div style={{
                background: 'var(--bg-soft)',
                border: '1px solid var(--border-soft)',
                borderRadius: '0 0 12px 12px',
                padding: '6px 8px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                direction: 'rtl',
              }}>
                <button
                  onClick={() => handleMove(t, 'personal')}
                  style={{
                    padding: '4px 10px', background: 'var(--lavender-light)', border: 'none',
                    borderRadius: 20, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                    color: 'var(--ink)', fontWeight: 600,
                  }}
                >👤 شخصي</button>
                {brands.map(b => (
                  <button
                    key={b.id}
                    onClick={() => handleMove(t, b.id)}
                    style={{
                      padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border-soft)',
                      borderRadius: 20, fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                      color: 'var(--ink)', fontWeight: 500,
                    }}
                  >{b.icon} {b.name}</button>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

// ─── Brand Health Strip ───────────────────────────────────────────────────────
function BrandHealthStrip({ brands, activeTasks }: { brands: Brand[]; activeTasks: ActiveTask[] }) {
  const statusLabels: Record<string, string> = { active: 'نشط', selling: 'بيع', paused: 'موقف', archived: 'أرشيف' };

  return (
    <div className="brand-strip">
      {brands.map((b) => {
        const tasks = activeTasks.filter(t => t.brandId === b.id);
        return (
          <Link key={b.id} href={`/brands/${b.id}`} className="brand-bottle" style={{ borderTop: `3px solid ${b.color}` }}>
            <div className="brand-bottle-icon">{b.icon}</div>
            <div className="brand-bottle-name">{b.name}</div>
            {tasks.length > 0 && (
              <div className="brand-bottle-tasks">{tasks.length} مهمة</div>
            )}
            <div className="brand-bottle-status" style={{ color: b.color }}>{statusLabels[b.status] ?? b.status}</div>
          </Link>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LeadershipClient({
  decisions, employees, brands, inboxTasks, weeklyFocus,
  todaySales, upcomingEvents, activeTasks, dailyTasks, projects, personalTasks,
  dailyRoutines: initialDailyRoutines,
}: Props) {
  const [editorDate, setEditorDate] = useState<string | null>(null);
  const [dailyRoutines] = useState<DailyRoutine[]>(initialDailyRoutines);
  const router = useRouter();

  const focusMap: Record<string, WeeklyFocusEntry> = {};
  weeklyFocus.forEach(f => { focusMap[f.focusDate] = f; });
  const todayFocus = focusMap[todayISO()] ?? null;

  function handleEditorSaved() {
    setEditorDate(null);
    router.refresh();
  }

  const d = new Date();
  const hour = d.getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';
  const dateLabel = `${DAY_NAMES_AR[d.getDay()]} · ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()} · يوم جديد، فرصة جديدة`;

  return (
    <div className="app" style={{ direction: 'rtl' }}>
      <main style={{ display: "contents" }}>

        {/* ── Greeting ────────────────────────────────────────────────────── */}
        {/* ── الغلاف الرئيسي — fluid، padding موحد 40px ─────────────────── */}
        <div style={{
          flex: 1,
          width: '100%',
          padding: '24px 40px 40px',
          boxSizing: 'border-box',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}>
          {/* ── Header: تحية يمين + أزرار يسار ─────────────────────────── */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginBottom: '4px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className="greeting-emoji">👋</span>
              <div className="greeting-text">
                <div className="greeting-hello">
                  {greeting} <span className="name">غازي</span>
                </div>
                <div className="greeting-date">{dateLabel}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="quick-action">
                <span>🔍</span>
                <span>بحث</span>
              </button>
              <button className="quick-action primary" onClick={() => setEditorDate(todayISO())}>
                <span>+</span>
                <span>فوكس اليوم</span>
              </button>
            </div>
          </div>
          {/* ── FocusHero ─────────────────────────────────────────────────── */}
          <FocusHero
            todayFocus={todayFocus}
            activeTasks={activeTasks}
            personalTasks={personalTasks}
            brands={brands}
            projects={projects}
            onOpenEditor={() => setEditorDate(todayISO())}
          />

          {/* باقي المحتوى بـ padding جانبي */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%' }}>

          {/* WeeklyCompass — كامل العرض */}
          <WeeklyCompass
            weeklyFocus={weeklyFocus}
            brands={brands}
            activeTasks={activeTasks}
            projects={projects}
            onOpenEditor={(d) => setEditorDate(d)}
          />

          {/* DailyTasks — كامل العرض */}
          <DailyTasksSection routines={dailyRoutines} />
          {/* Bento Grid: القرارات + التقويم (صف 1) | الوارد كامل العرض (صف 2) */}
          <div className="dashboard-bottom-grid">
            {/* القرارات */}
            <section className="section">
              <div className="section-head">
                <div className="section-title-wrap">
                  <div className="section-icon" style={{ background: 'var(--coral-light)', color: 'var(--coral-deep)' }}>⚖️</div>
                  <div className="section-title">
                    <div className="section-title-text">قرارات</div>
                    <div className="section-subtitle">{decisions.length} معلقة</div>
                  </div>
                </div>
              </div>
              <DecisionsPanel decisions={decisions} brands={brands} />
            </section>
            {/* التقويم */}
            <section className="section">
              <div className="section-head">
                <div className="section-title-wrap">
                  <div className="section-icon" style={{ background: 'var(--sky-light)', color: 'var(--sky-deep)' }}>📅</div>
                  <div className="section-title">
                    <div className="section-title-text">{MONTH_NAMES[d.getMonth()]}</div>
                    <div className="section-subtitle">{upcomingEvents.length} أحداث قادمة</div>
                  </div>
                </div>
              </div>
              <CalendarMini upcomingEvents={upcomingEvents} brands={brands} activeTasks={activeTasks} />
            </section>
            {/* الوارد — كامل العرض */}
            <section className="section inbox-full-width">
              <div className="section-head">
                <div className="section-title-wrap">
                  <div className="section-icon" style={{ background: 'var(--lavender-light)', color: '#7B5AD8' }}>💡</div>
                  <div className="section-title">
                    <div className="section-title-text">الوارد</div>
                    <div className="section-subtitle">أفكار سريعة</div>
                  </div>
                </div>
              </div>
              <InboxPanel inboxTasks={inboxTasks} brands={brands} />
            </section>
          </div>

          </div>{/* end باقي المحتوى */}

        </div>{/* end الغلاف الرئيسي */}


      </main>

      {/* Focus Editor Modal */}
      {editorDate && (
        <FocusEditorModal
          dateStr={editorDate}
          weeklyFocus={weeklyFocus}
          brands={brands}
          projects={projects}
          activeTasks={activeTasks}
          personalTasks={personalTasks}
          onClose={() => setEditorDate(null)}
          onSaved={handleEditorSaved}
        />
      )}
    </div>
  );
}
