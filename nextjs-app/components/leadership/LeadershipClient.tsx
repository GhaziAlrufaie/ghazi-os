/*
 * Ghazi OS — Leadership Client (Sunrise Theme)
 * branch: studio-theme-v1
 * CSS classes مأخوذة مباشرة من ghazi-sunrise(5).html
 * لا inline styles — كل شيء في studio-theme.css
 */
'use client';
import './studio-theme.css';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  addDecision, deleteDecision,
} from '@/lib/leadership-actions';
import {
  addInboxTask, deleteInboxTask,
  type InboxTask,
} from '@/lib/inbox-actions';
import {
  setDayFocus, clearDayFocus, moveFocusToNextDay,
  type WeeklyFocusEntry, type FocusTargetType,
} from '@/lib/weekly-focus-actions';
import type { DecisionRow, EmployeeRow } from '@/lib/leadership-types';

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
function DailyTasksSection() {
  const tasks = [
    { title: 'راجع مبيعات الأمس', meta: '📊 من سلة', time: '8:00 ص', done: true },
    { title: 'رد على رسائل العملاء', meta: '💬 بيت الجوزاء', time: '9:00 ص', done: true },
    { title: 'افحص تحليلات السناب', meta: '📱 المحتوى', time: '11:00 ص', done: false },
    { title: 'تابع الفريق وحدّث المهام', meta: '👥 الفريق', time: '2:00 م', done: false },
    { title: 'اكتب ملاحظة يومية', meta: '📝 أهم إنجاز', time: '6:00 م', done: false },
    { title: 'مراجعة قائمة الغد', meta: '🎯 التحضير', time: '9:00 م', done: false },
  ];
  const [doneStates, setDoneStates] = useState<boolean[]>(tasks.map(t => t.done));
  const doneCount = doneStates.filter(Boolean).length;
  const total = tasks.length;
  const pct = Math.round((doneCount / total) * 100);

  return (
    <section className="section">
      <div className="section-head">
        <div className="section-title-wrap">
          <div className="section-icon" style={{ background: 'var(--mint-light)', color: 'var(--mint-deep)' }}>☑️</div>
          <div className="section-title">
            <div className="section-title-text">روتينك اليومي</div>
            <div className="section-subtitle">مهام ثابتة كل يوم · <span>{doneCount}</span> من {total} منجزة</div>
          </div>
        </div>
        <span className="section-link">+ إضافة</span>
      </div>
      <div className="daily-progress">
        <div className="daily-progress-bar" style={{ width: `${pct}%` }} />
      </div>
      <div className="daily-grid">
        {tasks.map((task, i) => (
          <div key={i} className={`daily-task${doneStates[i] ? ' done' : ''}`}>
            <div
              className={`daily-checkbox${doneStates[i] ? ' checked' : ''}`}
              onClick={() => {
                const next = [...doneStates];
                next[i] = !next[i];
                setDoneStates(next);
              }}
            >
              {doneStates[i] && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            <div className="daily-task-body">
              <div className="daily-task-title">{task.title}</div>
              <div className="daily-task-meta">{task.meta}</div>
            </div>
            <span className="daily-time">{task.time}</span>
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
  const tip = DAILY_TIPS[new Date().getDay() % DAILY_TIPS.length];

  const sorted = todayFocus ? activeTasks.filter(t => {
    if (todayFocus.targetType === 'brand') return t.brandId === todayFocus.targetId;
    if (todayFocus.targetType === 'project') return t.projectId === todayFocus.targetId;
    if (todayFocus.targetType === 'task') return t.id === todayFocus.targetId;
    return false;
  }).sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return (order[a.priority as keyof typeof order] ?? 4) - (order[b.priority as keyof typeof order] ?? 4);
  }) : [];

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

    return (
      <section className="focus-hero" style={{ borderTop: `4px solid ${taskColor}` }}>
        <div className="focus-content">
          <div style={{ flex: 1 }}>
            <div className="focus-label">
              <span className="focus-label-dot" style={{ background: taskColor }} />
              <span>مهمة الفوكس</span>
              {isOverdue && <span className="focus-overdue-badge">متأخرة</span>}
            </div>
            <h1 className="focus-title">{selectedTask.title}</h1>
            {taskBrand && <p className="focus-subtitle" style={{ color: taskColor }}>{taskBrand.name}</p>}
            {totalItems > 0 && (
              <div className="focus-progress-wrap">
                <div className="focus-progress-bar">
                  <div className="focus-progress-fill" style={{ width: `${totalItems > 0 ? Math.round(doneItems/totalItems*100) : 0}%`, background: taskColor }} />
                </div>
                <span className="focus-progress-label">{doneItems}/{totalItems}</span>
              </div>
            )}
            {nextSteps.length > 0 && (
              <div className="focus-next-steps">
                {nextSteps.map(step => (
                  <div key={step.id} className="focus-step">
                    <input type="checkbox" style={{ accentColor: taskColor }} />
                    <span className="flex-1">{step.title}</span>
                    <span className="focus-step-type">{step.type}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="focus-cta">
              <button className="focus-btn ghost" onClick={() => setSelectedTaskId(null)}>↩ رجوع</button>
            </div>
          </div>
          <div className="focus-icon-big">✅</div>
        </div>
      </section>
    );
  }

  // Main focus view
  return (
    <section className="focus-hero" style={{ borderTop: `4px solid ${color}` }}>
      <div className="focus-content">
        <div style={{ flex: 1 }}>
          <div className="focus-label">
            <span className="focus-label-dot" style={{ background: color }} />
            <span>الشيء الواحد الآن · Today&apos;s ONE Thing</span>
          </div>
          <h1 className="focus-title">{todayFocus.targetName}</h1>
          {brand && <p className="focus-subtitle">{brand.icon} براند</p>}
          {project && project.progress > 0 && (
            <div className="focus-progress-wrap">
              <div className="focus-progress-bar">
                <div className="focus-progress-fill" style={{ width: `${project.progress}%`, background: color }} />
              </div>
              <span className="focus-progress-label">{project.progress}%</span>
            </div>
          )}
          <div className="focus-meta">
            <div className="focus-meta-item">
              <span>{FOCUS_TYPE_ICONS[todayFocus.targetType]}</span>
              <span>{FOCUS_TYPE_LABELS[todayFocus.targetType]}</span>
            </div>
          </div>
          <div className="focus-cta">
            <button className="focus-btn ghost" onClick={onOpenEditor}>تغيير الفوكس</button>
          </div>
        </div>
        <div className="focus-icon-big">🎯</div>
      </div>
      {/* Tasks list */}
      {sorted.length > 0 && (
        <div className="focus-tasks">
          <div className="focus-tasks-label">المهام المرتبطة ({sorted.length})</div>
          {sorted.slice(0, 5).map(t => {
            const pColor = PRIORITY_COLORS[t.priority] ?? '#8B8F9F';
            return (
              <button key={t.id} onClick={() => setSelectedTaskId(t.id)} className="focus-task-item"
                style={{ borderRight: `3px solid ${pColor}` }}>
                <span className="priority-dot" style={{ background: pColor }} />
                <span className="flex-1">{t.title}</span>
                <span className="priority-badge" style={{ background: `${pColor}18`, color: pColor }}>{PRIORITY_LABELS[t.priority]}</span>
              </button>
            );
          })}
          {sorted.length > 5 && <div className="focus-tasks-more">+ {sorted.length - 5} مهمة أخرى</div>}
        </div>
      )}
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
function CalendarMini({ upcomingEvents, brands }: { upcomingEvents: UpcomingEvent[]; brands: Brand[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventDays = new Set(upcomingEvents.map(e => e.day));
  const nextEvent = upcomingEvents.find(e => e.day > today);

  const cells: React.ReactNode[] = [];
  // Header
  ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => (
    cells.push(<div key={`h-${d}`} className="cal-cell header">{d}</div>)
  ));
  // Empty cells
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e-${i}`} className="cal-cell" />);
  }
  // Days
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today;
    const hasEvent = eventDays.has(d);
    const isPast = d < today && hasEvent;
    const isSoon = nextEvent && d === nextEvent.day;
    let cls = 'cal-cell';
    if (isToday) cls += ' today';
    else if (isPast) cls += ' past-event';
    else if (isSoon) cls += ' soon-event';
    else if (hasEvent) cls += ' upcoming-event';
    cells.push(<div key={d} className={cls}>{d}</div>);
  }

  return (
    <div>
      {upcomingEvents.length > 0 && (() => {
        const next = upcomingEvents[0];
        const dateStr = `${next.year}-${String(next.month+1).padStart(2,'0')}-${String(next.day).padStart(2,'0')}`;
        const dl = Math.ceil((new Date(dateStr+'T00:00:00').getTime() - new Date().setHours(0,0,0,0)) / 86400000);
        const label = dl === 0 ? 'اليوم' : dl === 1 ? 'غداً' : dl === 2 ? 'بعد يومين' : `بعد ${dl} أيام`;
        return (
          <div className="cal-alert">
            <div className="cal-alert-dot"></div>
            <div className="cal-alert-text">
              <strong>{label}:</strong> {next.title}
            </div>
          </div>
        );
      })()}
      <div className="cal-mini">{cells}</div>
      <div className="upcoming-list">
        {upcomingEvents.slice(0, 4).map(e => {
          const brand = brands.find(b => b.id === e.brandId);
          const dl = daysLeft(`${e.year}-${String(e.month).padStart(2,'0')}-${String(e.day).padStart(2,'0')}`);
          const isUrgent = dl <= 3;
          return (
            <div key={e.id} className={`upcoming-item${isUrgent ? ' urgent' : ''}`}>
              <div className="upcoming-date">
                <div className="upcoming-day">{e.day}</div>
                <div className="upcoming-month">{MONTH_NAMES[e.month - 1]?.slice(0, 3)}</div>
              </div>
              <div className="upcoming-body">
                <div className="upcoming-title">{e.title}</div>
                <div className="upcoming-when">
                  {dl <= 0 ? 'اليوم' : dl === 1 ? 'غداً' : `بعد ${dl} أيام`}
                  {brand && ` · ${brand.name}`}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Inbox Panel ──────────────────────────────────────────────────────────────
function InboxPanel({ inboxTasks }: { inboxTasks: InboxTask[] }) {
  const [newText, setNewText] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleAdd() {
    if (!newText.trim()) return;
    const text = newText.trim();
    setNewText('');
    startTransition(async () => { await addInboxTask(text); router.refresh(); });
  }

  async function handleDelete(id: string) {
    startTransition(async () => { await deleteInboxTask(id); router.refresh(); });
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
      {inboxTasks.length === 0 ? (
        <div className="empty-state">صندوق الوارد فارغ ✨</div>
      ) : (
        inboxTasks.slice(0, 8).map(t => (
          <div key={t.id} className="inbox-item">
            <div className="inbox-icon">💡</div>
            <span>{t.text}</span>
            <button onClick={() => handleDelete(t.id)} className="inbox-delete">✕</button>
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
}: Props) {
  const [editorDate, setEditorDate] = useState<string | null>(null);
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
      <main className="main">

        {/* ── Greeting ────────────────────────────────────────────────────── */}
        <div className="greeting" style={{ padding: '8px 24px 0' }}>
          <div className="greeting-title">
            <span className="greeting-emoji">👋</span>
            <div className="greeting-text">
              <div className="greeting-hello">
                {greeting} <span className="name">غازي</span>
              </div>
              <div className="greeting-date">{dateLabel}</div>
            </div>
          </div>
          <div className="greeting-meta">
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

        {/* ── المحتوى الرئيسي ─────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* FocusHero — كامل العرض بدون padding */}
          <FocusHero
            todayFocus={todayFocus}
            activeTasks={activeTasks}
            personalTasks={personalTasks}
            brands={brands}
            projects={projects}
            onOpenEditor={() => setEditorDate(todayISO())}
          />

          {/* باقي المحتوى بـ padding جانبي */}
          <div style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* WeeklyCompass — كامل العرض */}
          <WeeklyCompass
            weeklyFocus={weeklyFocus}
            brands={brands}
            activeTasks={activeTasks}
            projects={projects}
            onOpenEditor={(d) => setEditorDate(d)}
          />

          {/* DailyTasks — كامل العرض */}
          <div className="section daily-tasks-section">
            <div className="section-head">
              <div className="section-title-wrap">
                <div className="section-icon" style={{ background: 'var(--mint-light)', color: 'var(--mint-deep)' }}>☑️</div>
                <div className="section-title">
                  <div className="section-title-text">روتينك اليومي</div>
                  <div className="section-subtitle">مهام ثابتة كل يوم</div>
                </div>
              </div>
            </div>
            <div className="daily-progress">
              <div className="daily-progress-bar" style={{ width: '33%' }}></div>
            </div>
            <div className="daily-grid">
              {[
                { title: 'راجع مبيعات الأمس', meta: '📊 من سلة', time: '8:00 ص', done: true },
                { title: 'رد على رسائل العملاء', meta: '💬 بيت الجوزاء', time: '9:00 ص', done: true },
                { title: 'افحص تحليلات السناب', meta: '📱 المحتوى', time: '11:00 ص', done: false },
                { title: 'تابع الفريق وحدّث المهام', meta: '👥 الفريق', time: '2:00 م', done: false },
                { title: 'اكتب ملاحظة يومية', meta: '📝 أهم إنجاز', time: '6:00 م', done: false },
                { title: 'مراجعة قائمة الغد', meta: '🎯 التحضير', time: '9:00 م', done: false },
              ].map((task, i) => (
                <div key={i} className={`daily-task${task.done ? ' done' : ''}`}>
                  <div className={`daily-checkbox${task.done ? ' checked' : ''}`}>
                    {task.done && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                  <div className="daily-task-body">
                    <div className="daily-task-title">{task.title}</div>
                    <div className="daily-task-meta">{task.meta}</div>
                  </div>
                  <span className="daily-time">{task.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ثلاثة أعمدة متساوية: القرارات + التقويم + الوارد */}
          <div className="triple-panel" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 20
          }}>

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
              <CalendarMini upcomingEvents={upcomingEvents} brands={brands} />
            </section>

            {/* الوارد */}
            <section className="section">
              <div className="section-head">
                <div className="section-title-wrap">
                  <div className="section-icon" style={{ background: 'var(--lavender-light)', color: '#7B5AD8' }}>💡</div>
                  <div className="section-title">
                    <div className="section-title-text">الوارد</div>
                    <div className="section-subtitle">أفكار سريعة</div>
                  </div>
                </div>
              </div>
              <InboxPanel inboxTasks={inboxTasks} />
            </section>

          </div>{/* end ثلاثة أعمدة */}

          </div>{/* end padding wrapper */}

        </div>{/* end المحتوى الرئيسي */}


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
