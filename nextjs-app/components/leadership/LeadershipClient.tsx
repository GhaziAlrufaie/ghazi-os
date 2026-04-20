'use client';
/*
 * Ghazi OS — Leadership Client (Studio Theme: المكتب الخشبي الفاخر)
 * branch: studio-theme-v1
 * خلفية خشب + ورق كريمي + خطوط Playfair/Caveat/Cormorant
 * كل البيانات والمنطق محفوظ بدون تغيير
 */
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

// ─── Paper Card (مكوّن الورقة الكريمية) ──────────────────────────────────────
function PaperCard({
  children,
  rotate = 0,
  delay = 0,
  style = {},
}: {
  children: React.ReactNode;
  rotate?: number;
  delay?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #FBF3DF 0%, #F0E2BC 100%)',
      borderRadius: 4,
      padding: '16px',
      position: 'relative',
      boxShadow: `
        2px 2px 0 rgba(237,220,184,0.6),
        4px 4px 0 rgba(220,200,160,0.4),
        0 8px 24px rgba(0,0,0,0.35)
      `,
      transform: `rotate(${rotate}deg)`,
      animation: `place-on-table 0.4s ease-out ${delay}s both`,
      color: '#2B1810',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Section Title (عنوان القسم بخط Caveat) ──────────────────────────────────
function SectionTitle({ icon, title, badge }: { icon: string; title: string; badge?: number }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
      paddingBottom: 8,
      borderBottom: '1px dashed rgba(180,150,100,0.4)',
      direction: 'rtl',
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      <span style={{
        fontFamily: 'var(--font-caveat, cursive)',
        fontSize: 22,
        fontWeight: 600,
        color: '#3D2817',
        flex: 1,
      }}>
        {title}
      </span>
      {badge !== undefined && badge > 0 && (
        <span style={{
          background: 'linear-gradient(135deg, #D4A055, #9C7231)',
          color: '#3D2817',
          fontWeight: 700,
          borderRadius: '50%',
          minWidth: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}>
          {badge}
        </span>
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
        background: 'linear-gradient(135deg, rgba(90,120,67,0.2), rgba(90,120,67,0.1))',
        borderBottom: '1px solid rgba(90,120,67,0.3)',
        borderRight: '4px solid #5A7843',
        padding: '8px 16px',
        display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl',
        animation: 'place-on-table 0.4s ease-out',
      }}>
        <span style={{ fontSize: 18 }}>🌿</span>
        <div style={{ flex: 1 }}>
          <span style={{
            fontFamily: 'var(--font-cormorant, serif)',
            fontStyle: 'italic',
            fontSize: 12,
            color: 'rgba(247,236,214,0.6)',
          }}>وضع الشحن — </span>
          <span style={{
            fontFamily: 'var(--font-caveat, cursive)',
            fontSize: 18,
            fontWeight: 600,
            color: '#8BC34A',
          }}>يوم استراحة مقصود ✓</span>
        </div>
        <button onClick={onEdit} style={{
          fontFamily: 'var(--font-caveat, cursive)',
          fontSize: 14,
          color: '#D4A055',
          background: 'none',
          border: '1px dashed rgba(212,160,85,0.5)',
          borderRadius: 3,
          padding: '3px 10px',
          cursor: 'pointer',
        }}>تعديل</button>
      </div>
    );
  }

  const color = todayFocus.targetColor || '#D4A055';
  const typeIcon = FOCUS_TYPE_ICONS[todayFocus.targetType] ?? '🎯';

  return (
    <div style={{
      position: 'sticky', top: 56, zIndex: 38,
      background: 'linear-gradient(135deg, rgba(212,160,85,0.2), rgba(232,188,111,0.1))',
      borderBottom: '1px solid rgba(212,160,85,0.3)',
      borderRight: `4px solid ${color}`,
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', gap: 10, direction: 'rtl',
      animation: 'place-on-table 0.4s ease-out',
      transform: 'rotate(-0.2deg)',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{
          fontFamily: 'var(--font-cormorant, serif)',
          fontStyle: 'italic',
          fontSize: 12,
          color: 'rgba(247,236,214,0.5)',
        }}>⚙️ خلّص روتينك أولاً — {typeIcon} بوصلتك اليوم: </span>
        <span style={{
          fontFamily: 'var(--font-caveat, cursive)',
          fontSize: 20,
          fontWeight: 700,
          color,
        }}>{todayFocus.targetName}</span>
      </div>
      {todayFocus.targetType === 'brand' && todaySales > 0 && (
        <span style={{
          fontFamily: 'var(--font-caveat, cursive)',
          fontSize: 16,
          color: '#8BC34A',
          fontWeight: 600,
        }}>📈 {fmt(todaySales)} ريال</span>
      )}
      <button onClick={onEdit} style={{
        fontFamily: 'var(--font-caveat, cursive)',
        fontSize: 14,
        color: '#D4A055',
        background: 'none',
        border: '1px dashed rgba(212,160,85,0.5)',
        borderRadius: 3,
        padding: '3px 10px',
        cursor: 'pointer',
      }}>تعديل</button>
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
    <div style={{
      background: 'linear-gradient(180deg, #FBF3DF 0%, #F0E2BC 100%)',
      borderRadius: 4,
      padding: '14px',
      position: 'relative',
      boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
      transform: 'rotate(0.4deg)',
      animation: 'place-on-table 0.4s ease-out 0.1s both',
    }}>
      {/* خطوط الورق */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 4, pointerEvents: 'none',
        background: 'repeating-linear-gradient(180deg, transparent 0px, transparent 23px, rgba(180,150,100,0.15) 23px, rgba(180,150,100,0.15) 24px)',
      }} />
      <SectionTitle icon="🧭" title="بوصلة الأسبوع" />
      <div style={{ overflowX: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 6, minWidth: 480, paddingBottom: 4 }}>
          {weekDates.map((dateStr) => {
            const focus = focusMap[dateStr] ?? null;
            const isToday = dateStr === todayISO();
            const isDragOver = dragOverDate === dateStr;
            const color = focus?.targetColor || '#D4A055';
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
                  flex: 1, minWidth: 64, cursor: 'pointer',
                  background: isToday ? 'rgba(212,160,85,0.12)' : isDragOver ? 'rgba(212,160,85,0.18)' : 'rgba(255,255,255,0.5)',
                  border: isToday ? '2px solid #D4A055' : isDragOver ? '2px dashed #D4A055' : '1px dashed rgba(180,150,100,0.5)',
                  borderRadius: 4, padding: '8px 6px', textAlign: 'center',
                  transition: 'all 0.15s', direction: 'rtl',
                  boxShadow: isToday ? '0 2px 8px rgba(212,160,85,0.2)' : '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                {/* Day name */}
                <div style={{
                  fontFamily: 'var(--font-cormorant, serif)',
                  fontStyle: 'italic',
                  fontSize: 10,
                  color: isToday ? '#9C7231' : '#8B6F42',
                  fontWeight: 600,
                  marginBottom: 2,
                }}>
                  {dayName(dateStr)}
                </div>
                <div style={{
                  fontFamily: 'var(--font-playfair, serif)',
                  fontSize: isToday ? 22 : 18,
                  fontWeight: 600,
                  color: isToday ? '#3D2817' : '#5A4028',
                  marginBottom: 4,
                }}>
                  {isToday ? (
                    <span style={{
                      background: '#8B1E1E',
                      color: 'white',
                      padding: '1px 6px',
                      borderRadius: 3,
                      fontSize: 9,
                      fontFamily: 'var(--font-caveat, cursive)',
                      display: 'inline-block',
                      transform: 'rotate(-2deg)',
                    }}>اليوم</span>
                  ) : (
                    new Date(dateStr + 'T00:00:00').getDate()
                  )}
                </div>

                {!focus ? (
                  <div style={{ fontSize: 16, color: 'rgba(180,150,100,0.5)', marginBottom: 4 }}>+</div>
                ) : focus.targetType === 'recharge' ? (
                  <>
                    <div style={{ fontSize: 16, marginBottom: 3 }}>🌿</div>
                    <div style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 10, color: '#5A7843', fontWeight: 600 }}>استراحة</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 14, marginBottom: 3 }}>{icon}</div>
                    <div style={{
                      fontFamily: 'var(--font-caveat, cursive)',
                      fontSize: 11,
                      fontWeight: 700,
                      color,
                      marginBottom: 3,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {focus.targetName}
                    </div>
                    <span style={{
                      fontFamily: 'var(--font-cormorant, serif)',
                      fontStyle: 'italic',
                      fontSize: 9,
                      background: `${color}22`,
                      color,
                      padding: '1px 5px',
                      borderRadius: 3,
                      fontWeight: 600,
                    }}>
                      {FOCUS_TYPE_LABELS[focus.targetType] ?? ''}
                    </span>
                    {proj && proj.progress > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ height: 2, background: 'rgba(180,150,100,0.3)', borderRadius: 2 }}>
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
  const [selectedColor, setSelectedColor] = useState(existing?.targetColor ?? '#D4A055');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [customText, setCustomText] = useState(existing?.targetType === 'custom' ? (existing?.targetName ?? '') : '');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const isToday = dateStr === todayISO();

  const weekDates = getWeekDates();
  const focusedBrandIds = new Set(weeklyFocus.filter(f => f.targetType === 'brand').map(f => f.targetId).filter(Boolean));
  const hungryBrands = brands.filter(b => !focusedBrandIds.has(b.id)).slice(0, 5);

  const collisionCount = type === 'brand' && selectedId
    ? weeklyFocus.filter(f => f.focusDate !== dateStr && f.targetType === 'brand' && f.targetId === selectedId).length
    : 0;

  function handleTypeSelect(t: FocusTargetType) {
    setType(t);
    setSelectedId(null);
    setSelectedName('');
    setSelectedColor('#D4A055');
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

  const paperInputStyle: React.CSSProperties = {
    width: '100%', padding: '6px 10px',
    border: '1px solid rgba(180,150,100,0.4)',
    borderRadius: 4, fontSize: 14,
    fontFamily: 'var(--font-caveat, cursive)',
    background: 'rgba(247,236,214,0.3)',
    color: '#2B1810', direction: 'rtl',
  };

  function buildTargetList() {
    if (type === 'brand') {
      return brands.map(b => (
        <button
          key={b.id}
          onClick={() => handleTargetSelect(b.id, b.name, b.color)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px',
            background: selectedId === b.id ? `${b.color}18` : 'rgba(255,255,255,0.4)',
            border: selectedId === b.id ? `1px solid ${b.color}` : '1px solid rgba(180,150,100,0.3)',
            borderRight: `3px solid ${b.color}`,
            borderRadius: 4, cursor: 'pointer',
            fontFamily: 'var(--font-caveat, cursive)',
            direction: 'rtl', marginBottom: 4, transition: 'all 0.1s',
          }}
        >
          <span style={{ fontSize: 15 }}>{b.icon}</span>
          <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#2B1810' }}>{b.name}</span>
          {selectedId === b.id && <span style={{ color: b.color, fontSize: 14 }}>✓</span>}
        </button>
      ));
    }
    if (type === 'project') {
      const filtered = brandFilter ? projects.filter(p => p.brandId === brandFilter) : projects;
      return (
        <>
          <select style={{ ...paperInputStyle, height: 32, marginBottom: 8 }} value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
            <option value="">كل البراندات</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
          </select>
          {filtered.map(p => {
            const brand = brands.find(b => b.id === p.brandId);
            return (
              <button key={p.id} onClick={() => handleTargetSelect(p.id, p.title, brand?.color ?? '#D4A055')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px',
                  background: selectedId === p.id ? 'rgba(212,160,85,0.1)' : 'rgba(255,255,255,0.4)',
                  border: selectedId === p.id ? '1px solid #D4A055' : '1px solid rgba(180,150,100,0.3)',
                  borderRight: `3px solid ${brand?.color ?? '#D4A055'}`,
                  borderRadius: 4, cursor: 'pointer',
                  fontFamily: 'var(--font-caveat, cursive)',
                  direction: 'rtl', marginBottom: 4,
                }}
              >
                <span>📁</span>
                <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: '#2B1810' }}>{p.title}</span>
                {brand && <span style={{ fontSize: 11, color: brand.color }}>{brand.name}</span>}
                {selectedId === p.id && <span style={{ color: '#D4A055' }}>✓</span>}
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
          <select style={{ ...paperInputStyle, height: 30, marginBottom: 8 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">كل الأولويات</option>
            <option value="critical">حرج</option>
            <option value="high">عالي</option>
            <option value="medium">متوسط</option>
            <option value="low">منخفض</option>
          </select>
          {filtered.slice(0, 10).map(t => (
            <button key={t.id} onClick={() => handleTargetSelect(t.id, t.title, PRIORITY_COLORS[t.priority] ?? '#D4A055')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '6px 10px',
                background: selectedId === t.id ? 'rgba(212,160,85,0.1)' : 'rgba(255,255,255,0.4)',
                border: selectedId === t.id ? '1px solid #D4A055' : '1px solid rgba(180,150,100,0.3)',
                borderRight: `3px solid ${PRIORITY_COLORS[t.priority] ?? '#D4A055'}`,
                borderRadius: 4, cursor: 'pointer',
                fontFamily: 'var(--font-caveat, cursive)',
                direction: 'rtl', marginBottom: 3,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[t.priority] ?? '#888', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#2B1810' }}>{t.title}</span>
              {t.brandName && <span style={{ fontSize: 10, color: t.brandColor ?? '#8B6F42' }}>{t.brandName}</span>}
              {selectedId === t.id && <span style={{ color: '#D4A055' }}>✓</span>}
            </button>
          ))}
          {filtered.length === 0 && <div style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 14, color: '#8B6F42', padding: '8px 0' }}>لا توجد مهام مطابقة</div>}
        </>
      );
    }
    if (type === 'personal') {
      const filtered = priorityFilter ? personalTasks.filter(t => t.priority === priorityFilter) : personalTasks;
      return (
        <>
          <select style={{ ...paperInputStyle, height: 30, marginBottom: 8 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
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
                padding: '6px 10px',
                background: selectedId === t.id ? 'rgba(155,89,182,0.08)' : 'rgba(255,255,255,0.4)',
                border: selectedId === t.id ? '1px solid #9b59b6' : '1px solid rgba(180,150,100,0.3)',
                borderRight: `3px solid ${PRIORITY_COLORS[t.priority] ?? '#9b59b6'}`,
                borderRadius: 4, cursor: 'pointer',
                fontFamily: 'var(--font-caveat, cursive)',
                direction: 'rtl', marginBottom: 3,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: PRIORITY_COLORS[t.priority] ?? '#9b59b6', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: '#2B1810' }}>{t.title}</span>
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
          <div style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 20, fontWeight: 600, color: '#27ae60', marginBottom: 8 }}>يوم مالي</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {['مراجعة الحسابات', 'دفع الرواتب', 'تحليل المبيعات', 'مراجعة المصاريف', 'تخطيط الميزانية'].map(tag => (
              <span key={tag} style={{ background: 'rgba(39,174,96,0.1)', color: '#27ae60', padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-caveat, cursive)', fontSize: 14 }}>{tag}</span>
            ))}
          </div>
        </div>
      );
    }
    if (type === 'recharge') {
      return (
        <div style={{ padding: '10px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 30, marginBottom: 8 }}>🌿</div>
          <div style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 20, fontWeight: 600, color: '#2ecc71', marginBottom: 8 }}>يوم استراحة وشحن طاقة</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
            {['نوم كافٍ', 'رياضة خفيفة', 'وقت عائلي', 'قراءة', 'تأمل وتفكير'].map(tag => (
              <span key={tag} style={{ background: 'rgba(46,204,113,0.1)', color: '#2ecc71', padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-caveat, cursive)', fontSize: 14 }}>{tag}</span>
            ))}
          </div>
        </div>
      );
    }
    if (type === 'custom') {
      return (
        <input
          style={{ ...paperInputStyle, height: 36, fontSize: 18 }}
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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #FBF3DF 0%, #F0E2BC 100%)',
          borderRadius: 4, width: '100%', maxWidth: 460, maxHeight: '90vh', overflow: 'auto',
          direction: 'rtl',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
          color: '#2B1810',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px dashed rgba(180,150,100,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 22, fontWeight: 700, color: '#3D2817' }}>
              🧭 تعيين فوكس — {dayName(dateStr)}
            </div>
            <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 12, color: '#8B6F42' }}>
              {dateShort(dateStr)}{isToday ? ' — اليوم' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 16, cursor: 'pointer', color: '#8B6F42', padding: '4px 8px' }}>✕</button>
        </div>

        <div style={{ padding: '14px 16px' }}>
          {/* Hungry brands */}
          {hungryBrands.length > 0 && (
            <div style={{
              background: 'rgba(212,160,85,0.1)',
              border: '1px dashed rgba(212,160,85,0.4)',
              borderRadius: 4, padding: '8px 12px', marginBottom: 12,
            }}>
              <div style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 16, fontWeight: 700, color: '#9C7231', marginBottom: 4 }}>💡 براندات تشتكي من الإهمال:</div>
              {hungryBrands.map(b => (
                <div key={b.id} style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 15, color: '#5A4028', padding: '1px 0' }}>• {b.icon} {b.name}</div>
              ))}
            </div>
          )}

          {/* Collision warning */}
          {collisionCount > 0 && (
            <div style={{
              background: 'rgba(139,30,30,0.06)',
              border: '1px solid rgba(139,30,30,0.2)',
              borderRadius: 4, padding: '8px 12px', marginBottom: 12,
              fontFamily: 'var(--font-caveat, cursive)', fontSize: 15, color: '#8B1E1E',
            }}>
              ⚠️ هذا البراند مُعيَّن في {collisionCount} يوم آخر هذا الأسبوع
            </div>
          )}

          {/* Type selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 12, fontWeight: 700, color: '#8B6F42', marginBottom: 8 }}>نوع الفوكس</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {(['brand','project','task','personal','finance','recharge'] as FocusTargetType[]).map(t => (
                <button
                  key={t}
                  onClick={() => handleTypeSelect(t)}
                  style={{
                    padding: '8px 6px', borderRadius: 4, cursor: 'pointer',
                    fontFamily: 'var(--font-caveat, cursive)',
                    background: type === t ? 'rgba(212,160,85,0.15)' : 'rgba(255,255,255,0.4)',
                    border: type === t ? '1.5px solid #D4A055' : '1px dashed rgba(180,150,100,0.4)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    transition: 'all 0.1s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{FOCUS_TYPE_ICONS[t]}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: type === t ? '#9C7231' : '#8B6F42' }}>{FOCUS_TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 12, fontWeight: 700, color: '#8B6F42', marginBottom: 8 }}>
              {type === 'brand' ? 'اختر البراند' : type === 'project' ? 'اختر المشروع' : type === 'task' ? 'اختر المهمة' : type === 'personal' ? 'اختر المهمة الشخصية' : type === 'finance' ? 'تفاصيل اليوم المالي' : type === 'recharge' ? 'تفاصيل الاستراحة' : 'اكتب الفوكس'}
            </div>
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {buildTargetList()}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 12, fontWeight: 700, color: '#8B6F42', marginBottom: 6 }}>ملاحظات (اختياري)</div>
            <textarea
              style={{ ...paperInputStyle, resize: 'none', padding: '8px 10px', fontSize: 16 }}
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
              width: '100%', padding: '10px',
              background: isSaveDisabled ? 'rgba(180,150,100,0.3)' : 'linear-gradient(135deg, #D4A055, #9C7231)',
              color: isSaveDisabled ? '#8B6F42' : '#3D2817',
              border: 'none', borderRadius: 4,
              fontFamily: 'var(--font-caveat, cursive)',
              fontSize: 18, fontWeight: 700,
              cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
              marginBottom: 8,
              boxShadow: isSaveDisabled ? 'none' : '0 2px 8px rgba(0,0,0,0.2)',
            }}
          >
            {isPending ? '...' : '💾 حفظ'}
          </button>

          {existing && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleMigrateToNext} disabled={isPending}
                style={{
                  flex: 1, padding: '8px',
                  background: 'rgba(212,160,85,0.1)',
                  border: '1px dashed rgba(212,160,85,0.4)',
                  borderRadius: 4,
                  fontFamily: 'var(--font-caveat, cursive)',
                  fontSize: 15, color: '#9C7231',
                  cursor: 'pointer',
                }}>
                ترحيل للغد ➡️
              </button>
              <button onClick={handleClear} disabled={isPending}
                style={{
                  flex: 1, padding: '8px',
                  background: 'rgba(139,30,30,0.06)',
                  border: '1px dashed rgba(139,30,30,0.3)',
                  borderRadius: 4,
                  fontFamily: 'var(--font-caveat, cursive)',
                  fontSize: 15, color: '#8B1E1E',
                  cursor: 'pointer',
                }}>
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

  // Recharge
  if (todayFocus?.targetType === 'recharge') {
    return (
      <PaperCard rotate={-1} delay={0.2} style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 13, color: '#5A7843', fontWeight: 600, marginBottom: 6 }}>وضع الاستراحة</div>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🌿</div>
        <div style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 20, fontWeight: 700, color: '#3D5A28' }}>يوم راحة مقصود</div>
        <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 13, color: '#8B6F42', marginTop: 6 }}>
          استرح — العقل المرتاح أكثر إنتاجاً
        </div>
        <button onClick={onOpenEditor} style={{
          marginTop: 12, padding: '6px 16px',
          background: 'rgba(90,120,67,0.1)',
          border: '1px dashed rgba(90,120,67,0.4)',
          borderRadius: 3,
          fontFamily: 'var(--font-caveat, cursive)', fontSize: 16,
          color: '#5A7843', cursor: 'pointer',
        }}>تغيير الفوكس</button>
      </PaperCard>
    );
  }

  // No focus
  if (!todayFocus) {
    return (
      <PaperCard rotate={-1.5} delay={0.2} style={{ marginBottom: 16 }}>
        {/* دبوس */}
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          width: 16, height: 16,
          background: 'radial-gradient(circle at 40% 35%, #E8BC6F 0%, #D4A055 50%, #9C7231 100%)',
          borderRadius: '50%',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          zIndex: 10,
        }} />
        <div style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 14, color: '#8B1E1E', fontWeight: 600, marginBottom: 8 }}>
          الشيء الواحد الآن
        </div>
        <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 14, color: '#8B6F42', marginBottom: 12 }}>
          {tip}
        </div>
        <button onClick={onOpenEditor} style={{
          width: '100%', padding: '10px',
          background: 'linear-gradient(135deg, #D4A055, #9C7231)',
          color: '#3D2817', border: 'none', borderRadius: 4,
          fontFamily: 'var(--font-caveat, cursive)', fontSize: 18, fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          transform: 'rotate(0.5deg)',
        }}>
          🧭 حدد فوكس اليوم
        </button>
      </PaperCard>
    );
  }

  const color = todayFocus.targetColor || '#D4A055';
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
      <PaperCard rotate={-1.5} delay={0.2} style={{ marginBottom: 16 }}>
        {/* دبوس */}
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          width: 16, height: 16,
          background: 'radial-gradient(circle at 40% 35%, #E8BC6F 0%, #D4A055 50%, #9C7231 100%)',
          borderRadius: '50%',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          zIndex: 10,
        }} />

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10, direction: 'rtl' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 10, background: 'rgba(52,152,219,0.1)', color: '#3498db', padding: '1px 6px', borderRadius: 3 }}>مهمة</span>
              <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 10, background: `${PRIORITY_COLORS[selectedTask.priority]}22`, color: PRIORITY_COLORS[selectedTask.priority], padding: '1px 6px', borderRadius: 3 }}>{PRIORITY_LABELS[selectedTask.priority]}</span>
              {isOverdue && <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 10, background: 'rgba(139,30,30,0.1)', color: '#8B1E1E', padding: '1px 6px', borderRadius: 3 }}>متأخرة</span>}
            </div>
            <div style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 28, fontWeight: 700, color: '#2B1810', marginBottom: 3, lineHeight: 1.2 }}>
              {selectedTask.title}
            </div>
            {taskBrand && <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 13, color: taskColor }}>{taskBrand.name}</div>}
          </div>
        </div>

        {stTotal > 0 && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 11, color: '#8B6F42', marginBottom: 3 }}>
              <span>مهام فرعية: {stDone}/{stTotal}</span>
              <span>{stTotal > 0 ? Math.round(stDone/stTotal*100) : 0}%</span>
            </div>
            <div style={{ height: 4, background: 'rgba(180,150,100,0.3)', borderRadius: 4 }}>
              <div style={{ width: `${stTotal > 0 ? Math.round(stDone/stTotal*100) : 0}%`, height: 4, background: taskColor, borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {nextSteps.length > 0 && (
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 11, color: '#8B6F42', fontWeight: 600, marginBottom: 4 }}>الخطوة التالية:</div>
            {nextSteps.map(step => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', borderBottom: '1px solid rgba(180,150,100,0.2)' }}>
                <input type="checkbox" style={{ accentColor: taskColor }} />
                <span style={{ flex: 1, fontFamily: 'var(--font-caveat, cursive)', fontSize: 16 }}>{step.title}</span>
                <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 10, color: '#8B6F42', background: 'rgba(180,150,100,0.15)', padding: '1px 5px', borderRadius: 3 }}>{step.type}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
          {[
            { label: '✓ خلصت', bg: 'rgba(90,120,67,0.1)', color: '#5A7843', border: 'rgba(90,120,67,0.3)' },
            { label: '⚡ عالق', bg: 'rgba(139,30,30,0.06)', color: '#8B1E1E', border: 'rgba(139,30,30,0.2)' },
            { label: '⏰ بعدين', bg: 'rgba(212,160,85,0.08)', color: '#9C7231', border: 'rgba(212,160,85,0.3)' },
          ].map(btn => (
            <button key={btn.label} style={{
              flex: 1, padding: '6px 8px',
              background: btn.bg,
              color: btn.color,
              border: `1px dashed ${btn.border}`,
              borderRadius: 4,
              fontFamily: 'var(--font-caveat, cursive)', fontSize: 15,
              cursor: 'pointer',
            }}>{btn.label}</button>
          ))}
          <button onClick={() => setSelectedTaskId(null)} style={{
            flex: 1, padding: '6px 8px',
            background: 'rgba(180,150,100,0.1)',
            color: '#8B6F42',
            border: '1px dashed rgba(180,150,100,0.3)',
            borderRadius: 4,
            fontFamily: 'var(--font-caveat, cursive)', fontSize: 15,
            cursor: 'pointer',
          }}>🔄 تغيير</button>
        </div>
        <Link href={`/tasks/${selectedTask.id}`} style={{
          fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic',
          fontSize: 13, color: '#9C7231', display: 'block', textAlign: 'center',
        }}>فتح التفاصيل ←</Link>
      </PaperCard>
    );
  }

  // Pick list
  return (
    <PaperCard rotate={-1.5} delay={0.2} style={{ marginBottom: 16 }}>
      {/* دبوس */}
      <div style={{
        position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
        width: 16, height: 16,
        background: 'radial-gradient(circle at 40% 35%, #E8BC6F 0%, #D4A055 50%, #9C7231 100%)',
        borderRadius: '50%',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        zIndex: 10,
      }} />
      <div style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 22, fontWeight: 700, color: '#3D2817', marginBottom: 4 }}>
        الشيء الواحد الآن
      </div>
      <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 13, color: '#8B6F42', marginBottom: 10 }}>
        {tip}
      </div>
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-caveat, cursive)', fontSize: 18, color: '#8B6F42' }}>
          ما فيه مهام نشطة لهذا الفوكس 🎉
        </div>
      ) : (
        <>
          <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 12, color: '#8B6F42', marginBottom: 6 }}>اختر مهمة تركز عليها الآن:</div>
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
                  padding: '7px 10px',
                  background: 'rgba(255,255,255,0.4)',
                  border: '1px dashed rgba(180,150,100,0.4)',
                  borderRight: `3px solid ${pColor}`,
                  borderRadius: 4, cursor: 'pointer',
                  fontFamily: 'var(--font-caveat, cursive)',
                  marginBottom: 4, textAlign: 'right', direction: 'rtl',
                  transition: 'all 0.1s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: pColor, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 17, fontWeight: 600, color: '#2B1810' }}>{t.title}</span>
                  <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 10, background: `${pColor}22`, color: pColor, padding: '1px 5px', borderRadius: 3 }}>{PRIORITY_LABELS[t.priority]}</span>
                </div>
                {brand && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 13 }}>
                    <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 11, color: brand.color }}>{brand.name}</span>
                    {isOverdue && <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 10, color: '#8B1E1E' }}>⚠ متأخرة</span>}
                  </div>
                )}
                {totalItems > 0 && (
                  <div style={{ paddingRight: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ flex: 1, height: 3, background: 'rgba(180,150,100,0.3)', borderRadius: 3 }}>
                      <div style={{ width: `${pct}%`, height: 3, background: pColor, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 10, color: '#8B6F42' }}>{doneItems}/{totalItems}</span>
                  </div>
                )}
              </button>
            );
          })}
          {sorted.length > 8 && <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 12, color: '#8B6F42' }}>+ {sorted.length - 8} مهمة أخرى</div>}
        </>
      )}
    </PaperCard>
  );
}

// ─── Decisions Panel ──────────────────────────────────────────────────────────
function DecisionsPanel({ decisions, brands }: { decisions: DecisionRow[]; brands: Brand[] }) {
  if (!decisions.length) {
    return (
      <div style={{ textAlign: 'center', padding: 12, fontFamily: 'var(--font-caveat, cursive)', fontSize: 18, color: '#8B6F42' }}>
        ✅ كل القرارات محسومة!
      </div>
    );
  }
  const impactColors: Record<string, string> = { critical: '#8B1E1E', high: '#8B1E1E', medium: '#9C7231', low: '#8B6F42' };
  return (
    <div>
      {/* ختم الشمع */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, direction: 'rtl' }}>
        <div style={{
          width: 40, height: 40,
          background: 'radial-gradient(circle at 35% 35%, #C63838 0%, #8B1E1E 60%, #5A0E0E 100%)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: 'var(--font-playfair, serif)', fontStyle: 'italic', fontSize: 16, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>G</span>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 13, fontWeight: 600, color: '#3D2817' }}>قرارات معلقة</div>
          <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 11, color: '#8B6F42' }}>تحتاج حسماً</div>
        </div>
      </div>
      {decisions.slice(0, 5).map(d => {
        const brand = brands.find(b => b.id === d.brand_id);
        return (
          <div key={d.id} style={{ padding: '8px 0', borderBottom: '1px dashed rgba(180,150,100,0.3)' }}>
            <div style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 18, fontWeight: 600, marginBottom: 4, color: '#2B1810' }}>{d.title}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic',
                fontSize: 10,
                background: `${impactColors[d.impact] ?? '#888'}18`,
                color: impactColors[d.impact] ?? '#888',
                padding: '1px 6px', borderRadius: 3, fontWeight: 600,
              }}>
                {d.impact === 'critical' ? 'حرج' : d.impact === 'high' ? 'مرتفع' : d.impact === 'medium' ? 'متوسط' : 'منخفض'}
              </span>
              {d.deadline && (
                <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 11, color: daysLeft(d.deadline) < 3 ? '#8B1E1E' : '#8B6F42' }}>
                  {daysLeftLabel(d.deadline)}
                </span>
              )}
              {brand && <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 10, background: `${brand.color}18`, color: brand.color, padding: '1px 6px', borderRadius: 3 }}>{brand.name}</span>}
            </div>
          </div>
        );
      })}
      {decisions.length > 5 && (
        <Link href="/decisions" style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 16, color: '#9C7231', display: 'block', marginTop: 8 }}>
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
      {/* شريط لاصق */}
      <div style={{
        position: 'absolute', top: -10, right: '50%', transform: 'translateX(50%)',
        width: 60, height: 14,
        background: 'rgba(255,220,100,0.7)',
        borderRadius: 2,
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, direction: 'rtl' }}>
        <span style={{ fontFamily: 'var(--font-playfair, serif)', fontSize: 15, fontWeight: 600, color: '#3D2817' }}>
          {MONTH_NAMES[month]}
        </span>
        <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 12, color: '#8B6F42' }}>
          {year}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 8 }}>
        {['أح','إث','ثل','أر','خم','جم','سب'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 9, color: '#8B6F42', fontWeight: 600 }}>{d}</div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isToday = day === today;
          const hasEvent = eventDays.has(day);
          return (
            <div key={day} style={{
              textAlign: 'center',
              fontFamily: isToday ? 'var(--font-playfair, serif)' : 'var(--font-cormorant, serif)',
              fontStyle: isToday ? 'normal' : 'italic',
              fontSize: 12, padding: '3px 0', borderRadius: '50%',
              background: isToday ? '#8B1E1E' : 'transparent',
              color: isToday ? '#fff' : hasEvent ? '#9C7231' : '#5A4028',
              fontWeight: isToday || hasEvent ? 700 : 400,
              position: 'relative',
            }}>
              {day}
              {hasEvent && !isToday && (
                <span style={{
                  position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)',
                  width: 3, height: 3, borderRadius: '50%', background: '#D4A055', display: 'block',
                }} />
              )}
            </div>
          );
        })}
      </div>
      {upcomingEvents.slice(0, 4).map(e => {
        const brand = brands.find(b => b.id === e.brandId);
        return (
          <div key={e.id} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px dashed rgba(180,150,100,0.3)', alignItems: 'center', direction: 'rtl' }}>
            <div style={{ minWidth: 22, fontFamily: 'var(--font-playfair, serif)', fontWeight: 700, fontSize: 13, color: '#9C7231' }}>{e.day}</div>
            <div style={{ flex: 1, fontFamily: 'var(--font-caveat, cursive)', fontSize: 16, color: '#2B1810' }}>{e.title}</div>
            {brand && <span style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 10, color: brand.color }}>{brand.name}</span>}
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
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, direction: 'rtl' }}>
        <input
          style={{
            flex: 1, height: 36, padding: '0 10px',
            border: '1px dashed rgba(180,150,100,0.5)',
            borderRadius: 4, fontSize: 18,
            fontFamily: 'var(--font-caveat, cursive)',
            fontStyle: 'italic',
            background: 'rgba(255,255,255,0.3)',
            color: '#2B1810', direction: 'rtl',
          }}
          placeholder="فكرة أو ملاحظة سريعة..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd} disabled={isPending || !newText.trim()}
          style={{
            padding: '0 12px',
            background: 'linear-gradient(135deg, #D4A055, #9C7231)',
            color: '#3D2817', border: 'none', borderRadius: 4,
            fontFamily: 'var(--font-playfair, serif)', fontSize: 18,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
          }}>+</button>
      </div>
      {inboxTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 12, fontFamily: 'var(--font-caveat, cursive)', fontSize: 18, color: '#8B6F42' }}>
          صندوق الوارد فارغ ✨
        </div>
      ) : (
        inboxTasks.slice(0, 8).map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '6px 0', borderBottom: '1px dashed rgba(180,150,100,0.25)',
            direction: 'rtl',
          }}>
            <span style={{ color: '#D4A055', fontSize: 10, marginTop: 6, flexShrink: 0 }}>◆</span>
            <span style={{ flex: 1, fontFamily: 'var(--font-caveat, cursive)', fontSize: 18, color: '#2B1810' }}>{t.text}</span>
            <button onClick={() => handleDelete(t.id)}
              style={{ background: 'none', border: 'none', color: '#C9B585', cursor: 'pointer', fontSize: 13, padding: '0 4px', flexShrink: 0 }}>✕</button>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Brand Health Strip (زجاجات عطور) ────────────────────────────────────────
function BrandHealthStrip({ brands, activeTasks }: { brands: Brand[]; activeTasks: ActiveTask[] }) {
  const statusColors: Record<string, string> = { active: '#5A7843', selling: '#3498db', paused: '#9C7231', archived: '#8B6F42' };
  const statusLabels: Record<string, string> = { active: 'نشط', selling: 'بيع', paused: 'موقف', archived: 'أرشيف' };

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, paddingTop: 16 }}>
      {brands.map((b, idx) => {
        const tasks = activeTasks.filter(t => t.brandId === b.id);
        const rotations = [-3, 2, -1.5, 3, -2, 1.5, -3, 2];
        const rot = rotations[idx % rotations.length];

        return (
          <Link key={b.id} href={`/brands/${b.id}`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textDecoration: 'none', flexShrink: 0,
              transform: `rotate(${rot}deg)`,
              transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = `rotate(0deg) translateY(-8px)`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = `rotate(${rot}deg)`;
            }}
          >
            {/* Cap */}
            <div style={{
              width: '40%', height: 22,
              background: 'linear-gradient(135deg, #E8BC6F, #9C7231)',
              borderRadius: '3px 3px 0 0',
              boxShadow: '0 -1px 4px rgba(0,0,0,0.2)',
              alignSelf: 'center',
            }} />
            {/* Body */}
            <div style={{
              width: 72, height: 90,
              background: `linear-gradient(135deg, ${b.color}CC, ${b.color}88)`,
              borderRadius: '4px 4px 8px 8px',
              position: 'relative', overflow: 'hidden',
              boxShadow: '2px 4px 12px rgba(0,0,0,0.4), inset -3px 0 6px rgba(0,0,0,0.15)',
            }}>
              {/* Shine */}
              <div style={{
                position: 'absolute', top: 6, right: 6,
                width: 14, height: 30,
                background: 'rgba(255,255,255,0.15)',
                borderRadius: '50%',
                transform: 'rotate(-15deg)',
              }} />
              {/* Label */}
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'rgba(247,236,214,0.92)',
                borderRadius: 3, padding: '3px 5px',
                textAlign: 'center', minWidth: 50,
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }}>
                <span style={{ fontSize: 12, display: 'block' }}>{b.icon}</span>
                <span style={{
                  fontFamily: 'var(--font-caveat, cursive)',
                  fontSize: 9, color: '#2B1810', display: 'block',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 44,
                }}>{b.name}</span>
              </div>
              {/* Task count badge */}
              {tasks.length > 0 && (
                <div style={{
                  position: 'absolute', top: -6, left: -6,
                  width: 18, height: 18,
                  background: '#8B1E1E',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: 'white', fontWeight: 700, zIndex: 5,
                }}>
                  {tasks.length}
                </div>
              )}
            </div>
            {/* Shadow */}
            <div style={{
              width: 56, height: 8,
              background: 'radial-gradient(ellipse, rgba(0,0,0,0.3) 0%, transparent 70%)',
              marginTop: 4,
            }} />
            {/* Status */}
            <div style={{
              fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic',
              fontSize: 9, color: statusColors[b.status] ?? '#8B6F42',
              marginTop: 2,
            }}>
              {statusLabels[b.status] ?? b.status}
            </div>
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
      <div style={{ padding: '16px 20px 8px', marginBottom: 16, direction: 'rtl' }}>
        <h1 style={{
          fontFamily: 'var(--font-playfair, serif)',
          fontSize: 28, fontWeight: 600,
          color: '#E8BC6F',
          margin: 0,
          letterSpacing: '0.02em',
        }}>
          المركز القيادي
        </h1>
        <p style={{
          fontFamily: 'var(--font-cormorant, serif)',
          fontStyle: 'italic',
          fontSize: 14, color: 'rgba(247,236,214,0.5)',
          margin: '4px 0 0',
        }}>
          {dateLabel}
        </p>
      </div>

      {/* Brand Bottles Row */}
      <div style={{ padding: '0 16px', marginBottom: 20 }}>
        <BrandHealthStrip brands={brands} activeTasks={activeTasks} />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, padding: '0 16px' }}>
        {/* Right Column */}
        <div>
          {/* Weekly Compass */}
          <div style={{ marginBottom: 20 }}>
            <WeeklyCompass
              weeklyFocus={weeklyFocus}
              brands={brands}
              activeTasks={activeTasks}
              projects={projects}
              onOpenEditor={(d) => setEditorDate(d)}
            />
          </div>

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
          <PaperCard rotate={0.5} delay={0.4} style={{ marginBottom: 20 }}>
            <SectionTitle icon="⚖️" title="قرارات معلقة" badge={decisions.length} />
            <DecisionsPanel decisions={decisions} brands={brands} />
          </PaperCard>
        </div>

        {/* Left Column */}
        <div>
          {/* Calendar */}
          <PaperCard rotate={-2} delay={0.5} style={{ marginBottom: 20, position: 'relative', paddingTop: 20 }}>
            <CalendarMini upcomingEvents={upcomingEvents} brands={brands} />
          </PaperCard>

          {/* Inbox */}
          <PaperCard rotate={0} delay={0.6} style={{ marginBottom: 20 }}>
            <SectionTitle icon="📥" title="صندوق الوارد" badge={inboxTasks.length} />
            <InboxPanel inboxTasks={inboxTasks} />
          </PaperCard>

          {/* Team */}
          {employees.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 18, color: 'rgba(232,188,111,0.7)', marginBottom: 12, paddingBottom: 4, borderBottom: '1px dashed rgba(212,160,85,0.2)' }}>
                👥 الفريق
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                {employees.slice(0, 4).map((e, idx) => {
                  const rotations = [-1, 1.5, -1.5, 1];
                  const rot = rotations[idx % rotations.length];
                  return (
                    <div key={e.id} style={{
                      background: 'linear-gradient(135deg, #FBF3DF 0%, #F0E2BC 100%)',
                      borderRadius: 4, padding: '12px 10px',
                      position: 'relative',
                      boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
                      transform: `rotate(${rot}deg)`,
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      color: '#2B1810',
                    }}
                    onMouseEnter={(el) => {
                      (el.currentTarget as HTMLElement).style.transform = `rotate(0deg) translateY(-4px)`;
                      (el.currentTarget as HTMLElement).style.boxShadow = '0 6px 16px rgba(0,0,0,0.3)';
                    }}
                    onMouseLeave={(el) => {
                      (el.currentTarget as HTMLElement).style.transform = `rotate(${rot}deg)`;
                      (el.currentTarget as HTMLElement).style.boxShadow = '0 3px 10px rgba(0,0,0,0.2)';
                    }}
                    >
                      {/* شريط لاصق */}
                      <div style={{
                        position: 'absolute', top: -8, right: '50%', transform: 'translateX(50%)',
                        width: 36, height: 12,
                        background: 'rgba(255,220,100,0.7)',
                        borderRadius: 2,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                      }} />
                      {/* Avatar */}
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #D4A055, #9C7231)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-playfair, serif)', fontSize: 16, fontWeight: 600,
                        color: 'white', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                        margin: '0 auto 6px',
                      }}>
                        {e.name.charAt(0)}
                      </div>
                      <div style={{ fontFamily: 'var(--font-caveat, cursive)', fontSize: 16, fontWeight: 700, color: '#2B1810', textAlign: 'center' }}>{e.name}</div>
                      <div style={{ fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic', fontSize: 11, color: '#8B6F42', textAlign: 'center' }}>{e.role}</div>
                      <div style={{ textAlign: 'center', marginTop: 4 }}>
                        <span style={{
                          fontFamily: 'var(--font-cormorant, serif)', fontStyle: 'italic',
                          fontSize: 9,
                          background: e.status === 'active' ? 'rgba(90,120,67,0.1)' : 'rgba(180,150,100,0.1)',
                          color: e.status === 'active' ? '#5A7843' : '#8B6F42',
                          padding: '2px 7px', borderRadius: 10, fontWeight: 600,
                        }}>
                          {e.status === 'active' ? 'نشط' : e.status === 'on_leave' ? 'إجازة' : 'غير نشط'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link href="/team" style={{
                fontFamily: 'var(--font-caveat, cursive)', fontSize: 15,
                color: 'rgba(232,188,111,0.7)', display: 'block', marginTop: 8, textAlign: 'center',
              }}>
                عرض الفريق كاملاً ←
              </Link>
            </div>
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
