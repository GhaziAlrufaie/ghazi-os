'use client';
/*
 * Ghazi OS — Leadership Client (المركز القيادي)
 * المرحلة 2 — Light Theme مطابق للأصل
 * WeeklyCompass + FocusEditor + FocusHero + StickyBanner + Decisions + Calendar + Inbox
 */
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
const DAY_NAMES: Record<number, string> = {
  0: 'الأحد', 1: 'الاثنين', 2: 'الثلاثاء', 3: 'الأربعاء',
  4: 'الخميس', 5: 'الجمعة', 6: 'السبت',
};
const MONTH_NAMES = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const PRIORITY_COLORS: Record<string, string> = {
  critical: '#e74c3c', high: '#f39c12', medium: '#3498db', low: '#2ecc71',
};
const PRIORITY_LABELS: Record<string, string> = {
  critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض',
};
const STATUS_LABELS: Record<string, string> = {
  todo: 'قيد الانتظار', in_progress: 'جاري', on_hold: 'معلق', waiting: 'معلق', done: 'تم',
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
function dayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return DAY_NAMES[d.getDay()] ?? '';
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

// ─── CmdSection ───────────────────────────────────────────────────────────────
function CmdSection({
  icon, title, badge, children, defaultOpen = false,
}: {
  icon: string; title: string; badge?: number; children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--brd)',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: 12,
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 14px', cursor: 'pointer',
          borderBottom: open ? '1px solid var(--brd)' : 'none',
          direction: 'rtl',
        }}
      >
        <span style={{ fontSize: 15 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{title}</span>
        {badge !== undefined && badge > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', padding: '2px 7px', borderRadius: 20 }}>{badge}</span>
        )}
        <span style={{ fontSize: 10, color: 'var(--txt3)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>❯</span>
      </div>
      {open && (
        <div style={{ padding: '12px 14px' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Sticky Banner ────────────────────────────────────────────────────────────
function StickyBanner({
  todayFocus, todaySales, onEdit,
}: {
  todayFocus: WeeklyFocusEntry | null;
  todaySales: number;
  onEdit: () => void;
}) {
  if (!todayFocus) return null;

  if (todayFocus.targetType === 'recharge') {
    return (
      <div style={{
        position: 'sticky', top: 56, zIndex: 38,
        background: 'linear-gradient(90deg, rgba(46,204,113,0.08), rgba(39,174,96,0.05))',
        borderBottom: '1px solid rgba(46,204,113,0.2)',
        padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl',
      }}>
        <span style={{ fontSize: 18 }}>🌿</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 11, color: 'var(--txt3)', fontWeight: 600 }}>وضع الشحن — </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#27ae60' }}>يوم استراحة مقصود ✓</span>
        </div>
        <button onClick={onEdit} style={{ fontSize: 10, color: 'var(--gold)', background: 'none', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>تعديل</button>
      </div>
    );
  }

  const color = todayFocus.targetColor || '#C9A84C';
  const typeIcon = FOCUS_TYPE_ICONS[todayFocus.targetType] ?? '🎯';

  return (
    <div style={{
      position: 'sticky', top: 56, zIndex: 38,
      background: 'rgba(255,255,255,0.95)',
      borderBottom: '1px solid var(--brd)',
      padding: '7px 16px', display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl',
      backdropFilter: 'blur(8px)',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 10, color: 'var(--txt3)' }}>⚙️ خلّص روتينك أولاً — {typeIcon} بوصلتك اليوم: </span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{todayFocus.targetName}</span>
      </div>
      {todayFocus.targetType === 'brand' && todaySales > 0 && (
        <span style={{ fontSize: 11, color: '#27ae60', fontWeight: 600 }}>📈 {fmt(todaySales)} ريال</span>
      )}
      <button onClick={onEdit} style={{ fontSize: 10, color: 'var(--gold)', background: 'none', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontFamily: 'inherit' }}>تعديل</button>
    </div>
  );
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
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 8, minWidth: 560, paddingBottom: 4 }}>
        {weekDates.map((dateStr) => {
          const focus = focusMap[dateStr] ?? null;
          const isToday = dateStr === todayISO();
          const isDragOver = dragOverDate === dateStr;
          const color = focus?.targetColor || '#C9A84C';
          const brand = focus?.targetType === 'brand' ? brands.find(b => b.id === focus.targetId) : null;
          const icon = focus?.targetType === 'brand' ? (brand?.icon ?? '🎯') : focus ? (FOCUS_TYPE_ICONS[focus.targetType] ?? '🎯') : null;
          const proj = focus?.targetType === 'project' ? projects.find(p => p.id === focus.targetId) : null;

          return (
            <div
              key={dateStr}
              onClick={() => onOpenEditor(dateStr)}
              draggable
              onDragStart={(e) => { setDragDate(dateStr); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
              onDragEnter={() => setDragOverDate(dateStr)}
              onDragLeave={() => setDragOverDate(null)}
              onDrop={(e) => handleDrop(e, dateStr)}
              style={{
                flex: 1, minWidth: 72, cursor: 'pointer',
                background: isToday ? 'rgba(201,168,76,0.06)' : isDragOver ? 'rgba(201,168,76,0.1)' : '#fff',
                border: isToday ? '2px solid var(--gold)' : isDragOver ? '2px dashed var(--gold)' : '1px solid var(--brd)',
                borderRadius: 10, padding: '8px 6px', textAlign: 'center',
                transition: 'all 0.15s', direction: 'rtl',
                boxShadow: isToday ? '0 2px 8px rgba(201,168,76,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              {/* Day name */}
              <div style={{ fontSize: 9, color: isToday ? 'var(--gold)' : 'var(--txt3)', fontWeight: 700, marginBottom: 2 }}>
                {dayName(dateStr)}
              </div>
              <div style={{ fontSize: 9, color: 'var(--txt3)', marginBottom: 6 }}>
                {isToday ? <span style={{ background: 'var(--gold)', color: '#fff', padding: '1px 5px', borderRadius: 8, fontSize: 8 }}>اليوم</span> : dateShort(dateStr)}
              </div>

              {!focus ? (
                <div style={{ fontSize: 18, color: 'var(--brd)', marginBottom: 4 }}>➕</div>
              ) : focus.targetType === 'recharge' ? (
                <>
                  <div style={{ fontSize: 18, marginBottom: 3 }}>🌿</div>
                  <div style={{ fontSize: 9, color: '#27ae60', fontWeight: 600 }}>استراحة</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 16, marginBottom: 3 }}>{icon}</div>
                  <div style={{ fontSize: 9, fontWeight: 700, color, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {focus.targetName}
                  </div>
                  <span style={{ fontSize: 8, background: `${color}22`, color, padding: '1px 5px', borderRadius: 8, fontWeight: 600 }}>
                    {FOCUS_TYPE_LABELS[focus.targetType] ?? ''}
                  </span>
                  {proj && proj.progress > 0 && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ height: 2, background: 'var(--brd)', borderRadius: 2 }}>
                        <div style={{ width: `${proj.progress}%`, height: 2, background: color, borderRadius: 2 }} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
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
  const [selectedColor, setSelectedColor] = useState(existing?.targetColor ?? '#C9A84C');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [customText, setCustomText] = useState(existing?.targetType === 'custom' ? (existing?.targetName ?? '') : '');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const isToday = dateStr === todayISO();

  // Hungry brands: brands with no focus this week
  const weekDates = getWeekDates();
  const focusedBrandIds = new Set(weeklyFocus.filter(f => f.targetType === 'brand').map(f => f.targetId).filter(Boolean));
  const hungryBrands = brands.filter(b => !focusedBrandIds.has(b.id)).slice(0, 5);

  // Collision warning
  const collisionCount = type === 'brand' && selectedId
    ? weeklyFocus.filter(f => f.focusDate !== dateStr && f.targetType === 'brand' && f.targetId === selectedId).length
    : 0;

  function handleTypeSelect(t: FocusTargetType) {
    setType(t);
    setSelectedId(null);
    setSelectedName('');
    setSelectedColor('#C9A84C');
    setBrandFilter('');
    setPriorityFilter('');
  }

  function handleTargetSelect(id: string, name: string, color: string) {
    setSelectedId(id);
    setSelectedName(name);
    setSelectedColor(color);
  }

  async function handleSave() {
    let finalName = selectedName;
    let finalId = selectedId;
    let finalColor = selectedColor;

    if (type === 'custom') { finalName = customText.trim(); finalId = null; finalColor = '#888'; }
    if (type === 'finance') { finalName = 'يوم مالي'; finalId = null; finalColor = '#27ae60'; }
    if (type === 'recharge') { finalName = 'استراحة'; finalId = null; finalColor = '#2ecc71'; }
    if (type === 'personal' && !finalName) { finalName = 'مهام شخصية'; finalColor = '#9b59b6'; }

    if (!finalName) return;

    startTransition(async () => {
      await setDayFocus({ focusDate: dateStr, targetType: type, targetId: finalId, targetName: finalName, targetColor: finalColor, notes });
      onSaved();
    });
  }

  async function handleClear() {
    startTransition(async () => {
      await clearDayFocus(dateStr);
      onSaved();
    });
  }

  async function handleMigrateToNext() {
    startTransition(async () => {
      await moveFocusToNextDay(dateStr);
      onSaved();
    });
  }

  const isSaveDisabled = isPending || (
    (type === 'brand' || type === 'project' || type === 'task') && !selectedId
  ) || (type === 'custom' && !customText.trim());

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px', border: '1px solid var(--brd)',
    borderRadius: 8, fontSize: 12, fontFamily: 'inherit',
    background: 'var(--bg)', color: 'var(--txt)', direction: 'rtl',
  };

  function buildTargetList() {
    if (type === 'brand') {
      return brands.map(b => (
        <button
          key={b.id}
          onClick={() => handleTargetSelect(b.id, b.name, b.color)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', background: selectedId === b.id ? `${b.color}15` : '#fff',
            border: selectedId === b.id ? `1px solid ${b.color}` : '1px solid var(--brd)',
            borderRight: `3px solid ${b.color}`,
            borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', direction: 'rtl',
            marginBottom: 4, transition: 'all 0.1s',
          }}
        >
          <span style={{ fontSize: 15 }}>{b.icon}</span>
          <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{b.name}</span>
          {selectedId === b.id && <span style={{ color: b.color, fontSize: 12 }}>✓</span>}
        </button>
      ));
    }
    if (type === 'project') {
      const filtered = brandFilter ? projects.filter(p => p.brandId === brandFilter) : projects;
      return (
        <>
          <select style={{ ...inputStyle, height: 32, marginBottom: 8 }} value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
            <option value="">كل البراندات</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
          </select>
          {filtered.map(p => {
            const brand = brands.find(b => b.id === p.brandId);
            return (
              <button key={p.id} onClick={() => handleTargetSelect(p.id, p.title, brand?.color ?? '#C9A84C')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', background: selectedId === p.id ? 'rgba(201,168,76,0.08)' : '#fff',
                  border: selectedId === p.id ? '1px solid var(--gold)' : '1px solid var(--brd)',
                  borderRight: `3px solid ${brand?.color ?? '#C9A84C'}`,
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', direction: 'rtl',
                  marginBottom: 4,
                }}
              >
                <span>📁</span>
                <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{p.title}</span>
                {brand && <span style={{ fontSize: 9, color: brand.color }}>{brand.name}</span>}
                {selectedId === p.id && <span style={{ color: 'var(--gold)' }}>✓</span>}
              </button>
            );
          })}
          {filtered.length === 0 && <div style={{ fontSize: 11, color: 'var(--txt3)', padding: '8px 0' }}>لا توجد مشاريع نشطة</div>}
        </>
      );
    }
    if (type === 'task') {
      const filtered = activeTasks.filter(t => {
        if (brandFilter && t.brandId !== brandFilter) return false;
        if (priorityFilter && t.priority !== priorityFilter) return false;
        return true;
      });
      return (
        <>
          <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
            <select style={{ ...inputStyle, height: 30, flex: 1 }} value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
              <option value="">كل البراندات</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
            </select>
            <select style={{ ...inputStyle, height: 30, flex: 1 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="">كل الأولويات</option>
              <option value="critical">حرج</option>
              <option value="high">عالي</option>
              <option value="medium">متوسط</option>
              <option value="low">منخفض</option>
            </select>
          </div>
          {filtered.slice(0, 12).map(t => (
            <button key={t.id} onClick={() => handleTargetSelect(t.id, t.title, t.brandColor ?? PRIORITY_COLORS[t.priority] ?? '#888')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', background: selectedId === t.id ? 'rgba(201,168,76,0.08)' : '#fff',
                border: selectedId === t.id ? '1px solid var(--gold)' : '1px solid var(--brd)',
                borderRight: `3px solid ${PRIORITY_COLORS[t.priority] ?? '#888'}`,
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', direction: 'rtl', marginBottom: 3,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[t.priority] ?? '#888', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--txt)' }}>{t.title}</span>
              {t.brandName && <span style={{ fontSize: 9, color: t.brandColor ?? 'var(--txt3)' }}>{t.brandName}</span>}
              {selectedId === t.id && <span style={{ color: 'var(--gold)' }}>✓</span>}
            </button>
          ))}
          {filtered.length === 0 && <div style={{ fontSize: 11, color: 'var(--txt3)', padding: '8px 0' }}>لا توجد مهام مطابقة</div>}
        </>
      );
    }
    if (type === 'personal') {
      const filtered = priorityFilter ? personalTasks.filter(t => t.priority === priorityFilter) : personalTasks;
      return (
        <>
          <select style={{ ...inputStyle, height: 30, marginBottom: 8 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">كل الأولويات</option>
            <option value="critical">حرج</option>
            <option value="high">عالي</option>
            <option value="medium">متوسط</option>
            <option value="low">منخفض</option>
          </select>
          {filtered.slice(0, 10).map(t => (
            <button key={t.id} onClick={() => handleTargetSelect(t.id, t.title, PRIORITY_COLORS[t.priority] ?? '#9b59b6')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px', background: selectedId === t.id ? 'rgba(155,89,182,0.08)' : '#fff',
                border: selectedId === t.id ? '1px solid #9b59b6' : '1px solid var(--brd)',
                borderRight: `3px solid ${PRIORITY_COLORS[t.priority] ?? '#9b59b6'}`,
                borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', direction: 'rtl', marginBottom: 3,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[t.priority] ?? '#9b59b6', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: 'var(--txt)' }}>{t.title}</span>
              {selectedId === t.id && <span style={{ color: '#9b59b6' }}>✓</span>}
            </button>
          ))}
        </>
      );
    }
    if (type === 'finance') {
      return (
        <div style={{ padding: '10px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>💰</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#27ae60', marginBottom: 8 }}>يوم مالي</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {['مراجعة الحسابات', 'دفع الرواتب', 'تحليل المبيعات', 'مراجعة المصاريف', 'تخطيط الميزانية'].map(tag => (
              <span key={tag} style={{ background: 'rgba(39,174,96,0.1)', color: '#27ae60', padding: '3px 10px', borderRadius: 20, fontSize: 10 }}>{tag}</span>
            ))}
          </div>
        </div>
      );
    }
    if (type === 'recharge') {
      return (
        <div style={{ padding: '10px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🌿</div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#2ecc71', marginBottom: 8 }}>يوم استراحة وشحن طاقة</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {['نوم كافٍ', 'رياضة خفيفة', 'وقت عائلي', 'قراءة', 'تأمل وتفكير'].map(tag => (
              <span key={tag} style={{ background: 'rgba(46,204,113,0.1)', color: '#2ecc71', padding: '3px 10px', borderRadius: 20, fontSize: 10 }}>{tag}</span>
            ))}
          </div>
        </div>
      );
    }
    if (type === 'custom') {
      return (
        <input
          style={{ ...inputStyle, height: 36 }}
          placeholder="اكتب اسم الفوكس..."
          value={customText}
          onChange={e => setCustomText(e.target.value)}
        />
      );
    }
    return null;
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, maxHeight: '90vh', overflow: 'auto', direction: 'rtl', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
      >
        {/* Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--brd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)' }}>🧭 تعيين فوكس — {dayName(dateStr)}</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{dateShort(dateStr)}{isToday ? ' — اليوم' : ''}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: 'var(--txt3)', padding: '4px 8px' }}>✕</button>
        </div>

        <div style={{ padding: '14px 16px' }}>
          {/* Hungry brands */}
          {hungryBrands.length > 0 && (
            <div style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>💡 براندات تشتكي من الإهمال:</div>
              {hungryBrands.map(b => (
                <div key={b.id} style={{ fontSize: 11, color: 'var(--txt2)', padding: '1px 0' }}>• {b.icon} {b.name}</div>
              ))}
            </div>
          )}

          {/* Collision warning */}
          {collisionCount > 0 && (
            <div style={{ background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.2)', borderRadius: 8, padding: '8px 12px', marginBottom: 12, fontSize: 11, color: 'var(--danger)' }}>
              ⚠️ هذا البراند مُعيَّن في {collisionCount} يوم آخر هذا الأسبوع
            </div>
          )}

          {/* Type selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', marginBottom: 8 }}>نوع الفوكس</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {(['brand','project','task','personal','finance','recharge'] as FocusTargetType[]).map(t => (
                <button
                  key={t}
                  onClick={() => handleTypeSelect(t)}
                  style={{
                    padding: '8px 6px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                    background: type === t ? 'rgba(201,168,76,0.12)' : '#fff',
                    border: type === t ? '1.5px solid var(--gold)' : '1px solid var(--brd)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    transition: 'all 0.1s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{FOCUS_TYPE_ICONS[t]}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: type === t ? 'var(--gold)' : 'var(--txt2)' }}>{FOCUS_TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', marginBottom: 8 }}>
              {type === 'brand' ? 'اختر البراند' : type === 'project' ? 'اختر المشروع' : type === 'task' ? 'اختر المهمة' : type === 'personal' ? 'اختر المهمة الشخصية' : type === 'finance' ? 'تفاصيل اليوم المالي' : type === 'recharge' ? 'تفاصيل الاستراحة' : 'اكتب الفوكس'}
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {buildTargetList()}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--txt3)', marginBottom: 6 }}>ملاحظات (اختياري)</div>
            <textarea
              style={{ ...inputStyle, resize: 'none', padding: '8px 10px' }}
              rows={2}
              placeholder="أضف ملاحظة..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            style={{
              width: '100%', padding: '10px', background: isSaveDisabled ? 'var(--brd)' : 'var(--gold)',
              color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700,
              cursor: isSaveDisabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 8,
            }}
          >
            {isPending ? '...' : '💾 حفظ'}
          </button>

          {existing && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleMigrateToNext} disabled={isPending}
                style={{ flex: 1, padding: '8px', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 8, fontSize: 11, color: 'var(--gold)', cursor: 'pointer', fontFamily: 'inherit' }}>
                ترحيل للغد ➡️
              </button>
              <button onClick={handleClear} disabled={isPending}
                style={{ flex: 1, padding: '8px', background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.15)', borderRadius: 8, fontSize: 11, color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>
                🗑 مسح
              </button>
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

  function getCandidates(): ActiveTask[] {
    if (!todayFocus) return activeTasks.slice(0, 10);
    const { targetType, targetId } = todayFocus;
    if (targetType === 'recharge') return [];
    if (targetType === 'brand' && targetId) return activeTasks.filter(t => t.brandId === targetId);
    if (targetType === 'project' && targetId) return activeTasks.filter(t => t.projectId === targetId);
    if (targetType === 'task' && targetId) return activeTasks.filter(t => t.id === targetId);
    if (targetType === 'finance') return activeTasks.filter(t => /مال|حساب|فاتور|دفع|راتب/.test(t.title));
    if (targetType === 'personal') return [];
    return activeTasks.slice(0, 10);
  }

  const candidates = getCandidates();
  const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...candidates].sort((a, b) => (priorityOrder[a.priority] ?? 3) - (priorityOrder[b.priority] ?? 3));
  const selectedTask = selectedTaskId ? sorted.find(t => t.id === selectedTaskId) : null;

  const heroBase: React.CSSProperties = {
    background: '#fff', border: '1px solid var(--brd)', borderRadius: 12,
    padding: '14px 16px', marginBottom: 12, direction: 'rtl',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  };

  // Recharge
  if (todayFocus?.targetType === 'recharge') {
    return (
      <div style={{ ...heroBase, background: 'rgba(46,204,113,0.04)', borderColor: 'rgba(46,204,113,0.2)', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: '#27ae60', fontWeight: 600, marginBottom: 6 }}>وضع الاستراحة</div>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🌿</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#27ae60' }}>يوم راحة مقصود</div>
        <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 4 }}>اشحن طاقتك — ستعود أقوى</div>
      </div>
    );
  }

  // No focus
  if (!todayFocus) {
    return (
      <div style={{ ...heroBase, textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 8, fontStyle: 'italic' }}>{tip}</div>
        <button onClick={onOpenEditor}
          style={{ padding: '8px 20px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          🧭 عيّن فوكس اليوم
        </button>
      </div>
    );
  }

  // Personal
  if (todayFocus.targetType === 'personal') {
    const pTasks = personalTasks.slice(0, 8);
    return (
      <div style={heroBase}>
        <div style={{ fontSize: 11, color: '#9b59b6', fontWeight: 700, marginBottom: 6 }}>الشيء الواحد الآن — شخصي 👤</div>
        <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 8, fontStyle: 'italic' }}>{tip}</div>
        {pTasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 11 }}>ما فيه مهام شخصية نشطة 🎉</div>
        ) : (
          pTasks.map(t => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid var(--brd)' }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[t.priority] ?? '#888', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 12 }}>{t.title}</span>
              <span style={{ fontSize: 9, background: `${PRIORITY_COLORS[t.priority] ?? '#888'}22`, color: PRIORITY_COLORS[t.priority] ?? '#888', padding: '1px 6px', borderRadius: 8 }}>{PRIORITY_LABELS[t.priority]}</span>
            </div>
          ))
        )}
      </div>
    );
  }

  // Selected task — expanded
  if (selectedTask) {
    const brand = brands.find(b => b.id === selectedTask.brandId);
    const color = brand?.color ?? PRIORITY_COLORS[selectedTask.priority] ?? '#C9A84C';
    const stTotal = selectedTask.subtasks.length;
    const stDone = selectedTask.subtasks.filter(s => s.completed).length;
    const clItems = selectedTask.checklist ?? [];
    const clTotal = clItems.length;
    const clDone = clItems.filter(c => c.done).length;
    const totalItems = stTotal + clTotal;
    const doneItems = stDone + clDone;
    const pct = totalItems > 0 ? Math.round(doneItems / totalItems * 100) : 0;
    const isOverdue = selectedTask.dueDate && daysLeft(selectedTask.dueDate) < 0;

    const nextSteps = [
      ...selectedTask.subtasks.filter(s => !s.completed).slice(0, 4).map(s => ({ id: s.id, title: s.title, type: 'مهمة فرعية' })),
      ...clItems.filter(c => !c.done).slice(0, Math.max(0, 4 - selectedTask.subtasks.filter(s => !s.completed).length)).map(c => ({ id: c.id, title: c.text, type: 'مراجعة' })),
    ];

    return (
      <div style={heroBase}>
        <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, marginBottom: 8 }}>الشيء الواحد الآن</div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, background: 'rgba(52,152,219,0.1)', color: '#3498db', padding: '1px 6px', borderRadius: 8 }}>مهمة</span>
              <span style={{ fontSize: 9, background: `${PRIORITY_COLORS[selectedTask.priority]}22`, color: PRIORITY_COLORS[selectedTask.priority], padding: '1px 6px', borderRadius: 8 }}>{PRIORITY_LABELS[selectedTask.priority]}</span>
              {isOverdue && <span style={{ fontSize: 9, background: 'rgba(231,76,60,0.1)', color: 'var(--danger)', padding: '1px 6px', borderRadius: 8 }}>متأخرة</span>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 3 }}>{selectedTask.title}</div>
            {brand && <div style={{ fontSize: 11, color }}>{brand.name}</div>}
          </div>
        </div>

        {/* Progress */}
        {stTotal > 0 && (
          <div style={{ marginBottom: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--txt3)', marginBottom: 3 }}>
              <span>مهام فرعية: {stDone}/{stTotal}</span>
              <span>{stTotal > 0 ? Math.round(stDone/stTotal*100) : 0}%</span>
            </div>
            <div style={{ height: 4, background: 'var(--brd)', borderRadius: 4 }}>
              <div style={{ width: `${stTotal > 0 ? Math.round(stDone/stTotal*100) : 0}%`, height: 4, background: color, borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {/* Next steps */}
        {nextSteps.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 600, marginBottom: 4 }}>الخطوة التالية:</div>
            {nextSteps.map(step => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid var(--brd)' }}>
                <input type="checkbox" style={{ accentColor: color }} />
                <span style={{ flex: 1, fontSize: 11 }}>{step.title}</span>
                <span style={{ fontSize: 9, color: 'var(--txt3)', background: 'var(--bg2)', padding: '1px 5px', borderRadius: 8 }}>{step.type}</span>
              </div>
            ))}
            {totalItems - doneItems > nextSteps.length && (
              <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 4 }}>+ {totalItems - doneItems - nextSteps.length} أخرى...</div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          <button style={{ flex: 1, padding: '6px 8px', background: 'rgba(46,204,113,0.1)', color: '#27ae60', border: '1px solid rgba(46,204,113,0.2)', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>✓ خلصت</button>
          <button style={{ flex: 1, padding: '6px 8px', background: 'rgba(231,76,60,0.06)', color: 'var(--danger)', border: '1px solid rgba(231,76,60,0.15)', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>⚡ عالق</button>
          <button style={{ flex: 1, padding: '6px 8px', background: 'rgba(201,168,76,0.08)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>⏰ بعدين</button>
          <button onClick={() => setSelectedTaskId(null)} style={{ flex: 1, padding: '6px 8px', background: 'var(--bg2)', color: 'var(--txt2)', border: '1px solid var(--brd)', borderRadius: 7, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}>🔄 تغيير</button>
        </div>
        <Link href={`/tasks/${selectedTask.id}`} style={{ fontSize: 11, color: 'var(--gold)', display: 'block', textAlign: 'center' }}>فتح التفاصيل ←</Link>
      </div>
    );
  }

  // Pick list
  return (
    <div style={heroBase}>
      <div style={{ fontSize: 11, color: 'var(--gold)', fontWeight: 700, marginBottom: 4 }}>الشيء الواحد الآن</div>
      <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 8, fontStyle: 'italic' }}>{tip}</div>
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 11 }}>ما فيه مهام نشطة لهذا الفوكس 🎉</div>
      ) : (
        <>
          <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 6 }}>اختر مهمة تركز عليها الآن:</div>
          {sorted.slice(0, 8).map(t => {
            const brand = brands.find(b => b.id === t.brandId);
            const pColor = PRIORITY_COLORS[t.priority] ?? '#888';
            const stTotal = t.subtasks.length;
            const stDone = t.subtasks.filter(s => s.completed).length;
            const clItems = t.checklist ?? [];
            const totalItems = stTotal + clItems.length;
            const doneItems = stDone + clItems.filter(c => c.done).length;
            const pct = totalItems > 0 ? Math.round(doneItems / totalItems * 100) : 0;
            const isOverdue = t.dueDate && daysLeft(t.dueDate) < 0;
            return (
              <button key={t.id} onClick={() => setSelectedTaskId(t.id)}
                style={{
                  width: '100%', display: 'flex', flexDirection: 'column', gap: 3,
                  padding: '7px 10px', background: '#fff',
                  border: '1px solid var(--brd)', borderRight: `3px solid ${pColor}`,
                  borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
                  marginBottom: 4, textAlign: 'right', direction: 'rtl',
                  transition: 'all 0.1s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: pColor, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{t.title}</span>
                  <span style={{ fontSize: 9, background: `${pColor}22`, color: pColor, padding: '1px 5px', borderRadius: 8 }}>{PRIORITY_LABELS[t.priority]}</span>
                  {STATUS_LABELS[t.status] && <span style={{ fontSize: 9, color: 'var(--txt3)' }}>{STATUS_LABELS[t.status]}</span>}
                </div>
                {brand && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 13 }}>
                    <span style={{ fontSize: 10, color: brand.color }}>{brand.name}</span>
                    {isOverdue && <span style={{ fontSize: 9, color: 'var(--danger)' }}>⚠ متأخرة</span>}
                  </div>
                )}
                {totalItems > 0 && (
                  <div style={{ paddingRight: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ flex: 1, height: 3, background: 'var(--brd)', borderRadius: 3 }}>
                      <div style={{ width: `${pct}%`, height: 3, background: pColor, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 9, color: 'var(--txt3)' }}>{doneItems}/{totalItems}</span>
                  </div>
                )}
              </button>
            );
          })}
          {sorted.length > 8 && <div style={{ fontSize: 10, color: 'var(--txt3)' }}>+ {sorted.length - 8} مهمة أخرى</div>}
        </>
      )}
    </div>
  );
}

// ─── Decisions Panel ──────────────────────────────────────────────────────────
function DecisionsPanel({ decisions, brands }: { decisions: DecisionRow[]; brands: Brand[] }) {
  if (!decisions.length) {
    return <div style={{ textAlign: 'center', padding: 12, color: 'var(--txt3)', fontSize: 11 }}>✅ كل القرارات محسومة!</div>;
  }
  const impactColors: Record<string, string> = { critical: '#e74c3c', high: '#e74c3c', medium: '#f39c12', low: '#95a5a6' };
  return (
    <div>
      {decisions.slice(0, 5).map(d => {
        const brand = brands.find(b => b.id === d.brand_id);
        return (
          <div key={d.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--brd)' }}>
            <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: 'var(--txt)' }}>{d.title}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, background: `${impactColors[d.impact] ?? '#888'}22`, color: impactColors[d.impact] ?? '#888', padding: '1px 6px', borderRadius: 8, fontWeight: 600 }}>
                {d.impact === 'critical' ? 'حرج' : d.impact === 'high' ? 'مرتفع' : d.impact === 'medium' ? 'متوسط' : 'منخفض'}
              </span>
              {d.deadline && (
                <span style={{ fontSize: 10, color: daysLeft(d.deadline) < 3 ? 'var(--danger)' : 'var(--txt3)' }}>
                  {daysLeftLabel(d.deadline)}
                </span>
              )}
              {brand && <span style={{ fontSize: 9, background: `${brand.color}22`, color: brand.color, padding: '1px 6px', borderRadius: 8 }}>{brand.name}</span>}
            </div>
          </div>
        );
      })}
      {decisions.length > 5 && (
        <Link href="/decisions" style={{ fontSize: 11, color: 'var(--gold)', display: 'block', marginTop: 8 }}>
          + {decisions.length - 5} قرار آخر ←
        </Link>
      )}
    </div>
  );
}

// ─── Calendar Mini ────────────────────────────────────────────────────────────
function CalendarMini({ upcomingEvents, brands }: { upcomingEvents: UpcomingEvent[]; brands: Brand[] }) {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = now.getDate();
  const eventDays = new Set(upcomingEvents.map(e => e.day));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
        {['أح','إث','ثل','أر','خم','جم','سب'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 9, color: 'var(--txt3)', fontWeight: 600 }}>{d}</div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isToday = day === today;
          const hasEvent = eventDays.has(day);
          return (
            <div key={day} style={{
              textAlign: 'center', fontSize: 10, padding: '3px 0', borderRadius: 4,
              background: isToday ? 'var(--gold)' : 'transparent',
              color: isToday ? '#fff' : hasEvent ? 'var(--gold)' : 'var(--txt2)',
              fontWeight: isToday || hasEvent ? 700 : 400, position: 'relative',
            }}>
              {day}
              {hasEvent && !isToday && <span style={{ position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', background: 'var(--gold)', display: 'block' }} />}
            </div>
          );
        })}
      </div>
      {upcomingEvents.slice(0, 4).map(e => {
        const brand = brands.find(b => b.id === e.brandId);
        return (
          <div key={e.id} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--brd)', alignItems: 'center' }}>
            <div style={{ minWidth: 22, color: 'var(--gold)', fontWeight: 700, fontSize: 11 }}>{e.day}</div>
            <div style={{ flex: 1, fontSize: 11, color: 'var(--txt)' }}>{e.title}</div>
            {brand && <span style={{ fontSize: 9, color: brand.color }}>{brand.name}</span>}
          </div>
        );
      })}
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
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input
          style={{ flex: 1, height: 32, padding: '0 10px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 12, fontFamily: 'inherit', background: '#fff', color: 'var(--txt)', direction: 'rtl' }}
          placeholder="فكرة أو ملاحظة سريعة..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd} disabled={isPending || !newText.trim()}
          style={{ padding: '0 12px', background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>+</button>
      </div>
      {inboxTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 12, color: 'var(--txt3)', fontSize: 11 }}>صندوق الوارد فارغ ✨</div>
      ) : (
        inboxTasks.slice(0, 8).map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--brd)' }}>
            <span style={{ flex: 1, fontSize: 12, color: 'var(--txt)' }}>{t.text}</span>
            <button onClick={() => handleDelete(t.id)}
              style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 13, padding: '0 4px' }}>✕</button>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Brand Health Strip ───────────────────────────────────────────────────────
function BrandHealthStrip({ brands, activeTasks }: { brands: Brand[]; activeTasks: ActiveTask[] }) {
  const statusColors: Record<string, string> = { active: '#27ae60', selling: '#3498db', paused: '#f39c12', archived: '#95a5a6' };
  const statusLabels: Record<string, string> = { active: 'نشط', selling: 'بيع', paused: 'موقف', archived: 'أرشيف' };
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
      {brands.map(b => {
        const tasks = activeTasks.filter(t => t.brandId === b.id);
        return (
          <Link key={b.id} href={`/brands/${b.id}`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              minWidth: 64, padding: '8px 6px', background: '#fff',
              border: '1px solid var(--brd)', borderTop: `2px solid ${b.color}`,
              borderRadius: 8, textDecoration: 'none', flexShrink: 0,
              transition: 'box-shadow 0.15s',
            }}
          >
            <div style={{ fontSize: 16 }}>{b.icon}</div>
            <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--txt)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 56 }}>{b.name}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: b.color }}>{tasks.length}</div>
            <div style={{ fontSize: 8, color: statusColors[b.status] ?? 'var(--txt3)', fontWeight: 600 }}>{statusLabels[b.status] ?? b.status}</div>
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
  const dateLabel = `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;

  return (
    <div className="scr on" style={{ direction: 'rtl' }}>
      {/* Sticky Banner */}
      <StickyBanner todayFocus={todayFocus} todaySales={todaySales} onEdit={() => setEditorDate(todayISO())} />

      {/* Page Header */}
      <div style={{ padding: '16px 20px 8px', borderBottom: '1px solid var(--brd)', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)', margin: 0 }}>المركز القيادي</h1>
        <p style={{ fontSize: 12, color: 'var(--txt3)', margin: '3px 0 0' }}>{dateLabel}</p>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, padding: '0 16px' }}>
        {/* Right Column */}
        <div>
          {/* Weekly Compass */}
          <CmdSection icon="🧭" title="بوصلة الأسبوع" defaultOpen={true}>
            <WeeklyCompass
              weeklyFocus={weeklyFocus}
              brands={brands}
              activeTasks={activeTasks}
              projects={projects}
              onOpenEditor={(d) => setEditorDate(d)}
            />
          </CmdSection>

          {/* Focus Hero */}
          <FocusHero
            todayFocus={todayFocus}
            activeTasks={activeTasks}
            personalTasks={personalTasks}
            brands={brands}
            projects={projects}
            onOpenEditor={() => setEditorDate(todayISO())}
          />

          {/* Decisions */}
          <CmdSection icon="⚖️" title="قرارات معلقة" badge={decisions.length}>
            <DecisionsPanel decisions={decisions} brands={brands} />
          </CmdSection>
        </div>

        {/* Left Column */}
        <div>
          {/* Brand Health */}
          <CmdSection icon="🏷" title="البراندات" defaultOpen={true}>
            <BrandHealthStrip brands={brands} activeTasks={activeTasks} />
          </CmdSection>

          {/* Calendar */}
          <CmdSection icon="📅" title={`${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`} defaultOpen={true}>
            <CalendarMini upcomingEvents={upcomingEvents} brands={brands} />
          </CmdSection>

          {/* Inbox */}
          <CmdSection icon="📥" title="صندوق الوارد" badge={inboxTasks.length}>
            <InboxPanel inboxTasks={inboxTasks} />
          </CmdSection>

          {/* Team */}
          {employees.length > 0 && (
            <CmdSection icon="👥" title="الفريق" badge={employees.filter(e => e.status === 'active').length}>
              <div>
                {employees.slice(0, 5).map(e => (
                  <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--brd)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--txt2)', flexShrink: 0 }}>
                      {e.name.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)' }}>{e.name}</div>
                      <div style={{ fontSize: 10, color: 'var(--txt3)' }}>{e.role}</div>
                    </div>
                    <span style={{ fontSize: 9, background: e.status === 'active' ? 'rgba(39,174,96,0.1)' : 'var(--bg2)', color: e.status === 'active' ? '#27ae60' : 'var(--txt3)', padding: '2px 7px', borderRadius: 10, fontWeight: 600 }}>
                      {e.status === 'active' ? 'نشط' : e.status === 'on_leave' ? 'إجازة' : 'غير نشط'}
                    </span>
                  </div>
                ))}
                <Link href="/team" style={{ fontSize: 11, color: 'var(--gold)', display: 'block', marginTop: 8 }}>عرض الفريق كاملاً ←</Link>
              </div>
            </CmdSection>
          )}
        </div>
      </div>

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
