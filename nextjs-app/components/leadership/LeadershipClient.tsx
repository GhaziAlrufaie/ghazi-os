'use client';
/*
 * Ghazi OS — Leadership Client (Sunrise Energy Theme)
 * branch: studio-theme-v1
 * خلفية كريمية دافئة + كورال + أصفر دافئ + أخضر نعناع
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
  critical: '#FF6B6B', high: '#FFB085', medium: '#4ECDC4', low: '#6BCB77',
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

// ─── Sunrise Card (بطاقة بيضاء مع ظل دافئ) ──────────────────────────────────
function SunriseCard({
  children,
  style = {},
  accent,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  accent?: string;
}) {
  return (
    <div style={{
      background: 'white',
      borderRadius: 20,
      padding: '20px',
      position: 'relative',
      boxShadow: '0 4px 24px rgba(255,107,107,0.08), 0 1px 4px rgba(0,0,0,0.04)',
      border: '1px solid #F5EDE4',
      borderTop: accent ? `3px solid ${accent}` : '1px solid #F5EDE4',
      ...style,
    }}>
      {children}
    </div>
  );
}

// ─── Section Title ────────────────────────────────────────────────────────────
function SectionTitle({ icon, title, badge, color }: { icon: string; title: string; badge?: number; color?: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 16,
      direction: 'rtl',
    }}>
      <span style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        background: color ? `${color}18` : '#FFF0F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        flexShrink: 0,
      }}>{icon}</span>
      <span style={{
        fontFamily: 'var(--font-ibm, sans-serif)',
        fontSize: 15,
        fontWeight: 700,
        color: '#2D3142',
        flex: 1,
      }}>
        {title}
      </span>
      {badge !== undefined && badge > 0 && (
        <span style={{
          background: color || '#FF6B6B',
          color: 'white',
          fontWeight: 700,
          borderRadius: 20,
          minWidth: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          padding: '0 6px',
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
        background: 'linear-gradient(135deg, #6BCB77, #4ECDC4)',
        padding: '10px 20px',
        display: 'flex', alignItems: 'center', gap: 12, direction: 'rtl',
      }}>
        <span style={{ fontSize: 18 }}>🌿</span>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, color: 'white', fontWeight: 600 }}>
            وضع الشحن — يوم استراحة مقصود ✓
          </span>
        </div>
        <button onClick={onEdit} style={{
          fontFamily: 'var(--font-ibm, sans-serif)',
          fontSize: 12,
          color: 'white',
          background: 'rgba(255,255,255,0.2)',
          border: '1px solid rgba(255,255,255,0.4)',
          borderRadius: 8,
          padding: '4px 12px',
          cursor: 'pointer',
          fontWeight: 600,
        }}>تعديل</button>
      </div>
    );
  }

  const color = todayFocus.targetColor || '#FF6B6B';
  const typeIcon = FOCUS_TYPE_ICONS[todayFocus.targetType] ?? '🎯';

  return (
    <div style={{
      position: 'sticky', top: 56, zIndex: 38,
      background: `linear-gradient(135deg, ${color}18, ${color}08)`,
      borderBottom: `2px solid ${color}30`,
      borderRight: `4px solid ${color}`,
      padding: '10px 20px',
      display: 'flex', alignItems: 'center', gap: 12, direction: 'rtl',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, color: '#8B8F9F' }}>
          {typeIcon} بوصلتك اليوم:{' '}
        </span>
        <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 14, fontWeight: 700, color }}>
          {todayFocus.targetName}
        </span>
      </div>
      {todayFocus.targetType === 'brand' && todaySales > 0 && (
        <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, color: '#6BCB77', fontWeight: 700 }}>
          📈 {fmt(todaySales)} ريال
        </span>
      )}
      <button onClick={onEdit} style={{
        fontFamily: 'var(--font-ibm, sans-serif)',
        fontSize: 12,
        color,
        background: `${color}12`,
        border: `1px solid ${color}40`,
        borderRadius: 8,
        padding: '4px 12px',
        cursor: 'pointer',
        fontWeight: 600,
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
    <SunriseCard accent="#FF6B6B">
      <SectionTitle icon="🧭" title="بوصلة الأسبوع" color="#FF6B6B" />
      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, minWidth: 480, paddingBottom: 4 }}>
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
                onClick={() => onOpenEditor(dateStr)}
                draggable
                onDragStart={(e) => { setDragDate(dateStr); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
                onDragEnter={() => setDragOverDate(dateStr)}
                onDragLeave={() => setDragOverDate(null)}
                onDrop={(e) => handleDrop(e, dateStr)}
                style={{
                  flex: 1, minWidth: 64, cursor: 'pointer',
                  background: isToday ? '#FFF0F0' : isDragOver ? '#FFF8F0' : '#FAFAFA',
                  border: isToday ? `2px solid #FF6B6B` : isDragOver ? '2px dashed #FFB085' : '1px solid #F0E6D6',
                  borderRadius: 12, padding: '10px 6px', textAlign: 'center',
                  transition: 'all 0.15s', direction: 'rtl',
                  boxShadow: isToday ? '0 4px 12px rgba(255,107,107,0.15)' : 'none',
                }}
              >
                <div style={{
                  fontFamily: 'var(--font-ibm, sans-serif)',
                  fontSize: 10,
                  color: isToday ? '#FF6B6B' : '#8B8F9F',
                  fontWeight: isToday ? 700 : 500,
                  marginBottom: 4,
                }}>
                  {dayName(dateStr)}
                </div>
                <div style={{
                  fontFamily: 'var(--font-ibm, sans-serif)',
                  fontSize: isToday ? 20 : 16,
                  fontWeight: 700,
                  color: isToday ? '#FF6B6B' : '#2D3142',
                  marginBottom: 6,
                }}>
                  {isToday ? (
                    <span style={{
                      background: '#FF6B6B',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: 20,
                      fontSize: 10,
                      display: 'inline-block',
                    }}>اليوم</span>
                  ) : (
                    new Date(dateStr + 'T00:00:00').getDate()
                  )}
                </div>

                {!focus ? (
                  <div style={{ fontSize: 18, color: '#E0D8D0', marginBottom: 4 }}>+</div>
                ) : focus.targetType === 'recharge' ? (
                  <>
                    <div style={{ fontSize: 16, marginBottom: 3 }}>🌿</div>
                    <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 10, color: '#6BCB77', fontWeight: 600 }}>استراحة</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 14, marginBottom: 3 }}>{icon}</div>
                    <div style={{
                      fontFamily: 'var(--font-ibm, sans-serif)',
                      fontSize: 10,
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
                      fontFamily: 'var(--font-ibm, sans-serif)',
                      fontSize: 9,
                      background: `${color}18`,
                      color,
                      padding: '2px 6px',
                      borderRadius: 10,
                      fontWeight: 600,
                    }}>
                      {FOCUS_TYPE_LABELS[focus.targetType] ?? ''}
                    </span>
                    {proj && proj.progress > 0 && (
                      <div style={{ marginTop: 4 }}>
                        <div style={{ height: 3, background: '#F0E6D6', borderRadius: 3 }}>
                          <div style={{ width: `${proj.progress}%`, height: 3, background: color, borderRadius: 3 }} />
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
    </SunriseCard>
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
    setType(t);
    setSelectedId(null);
    setSelectedName('');
    setSelectedColor('#FF6B6B');
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
    width: '100%', padding: '8px 12px',
    border: '1px solid #F0E6D6',
    borderRadius: 10, fontSize: 14,
    fontFamily: 'var(--font-ibm, sans-serif)',
    background: '#FAFAFA',
    color: '#2D3142', direction: 'rtl',
    outline: 'none',
  };

  function buildTargetList() {
    if (type === 'brand') {
      return brands.map(b => (
        <button
          key={b.id}
          onClick={() => handleTargetSelect(b.id, b.name, b.color)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 12px',
            background: selectedId === b.id ? `${b.color}12` : 'white',
            border: selectedId === b.id ? `1.5px solid ${b.color}` : '1px solid #F0E6D6',
            borderRadius: 12, cursor: 'pointer',
            fontFamily: 'var(--font-ibm, sans-serif)',
            direction: 'rtl', marginBottom: 6, transition: 'all 0.1s',
          }}
        >
          <span style={{ fontSize: 16 }}>{b.icon}</span>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#2D3142' }}>{b.name}</span>
          {selectedId === b.id && <span style={{ color: b.color, fontSize: 14 }}>✓</span>}
        </button>
      ));
    }
    if (type === 'project') {
      const filtered = brandFilter ? projects.filter(p => p.brandId === brandFilter) : projects;
      return (
        <>
          <select style={{ ...inputStyle, height: 36, marginBottom: 10 }} value={brandFilter} onChange={e => setBrandFilter(e.target.value)}>
            <option value="">كل البراندات</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
          </select>
          {filtered.map(p => {
            const brand = brands.find(b => b.id === p.brandId);
            return (
              <button key={p.id} onClick={() => handleTargetSelect(p.id, p.title, brand?.color ?? '#FF6B6B')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px',
                  background: selectedId === p.id ? '#FFF0F0' : 'white',
                  border: selectedId === p.id ? '1.5px solid #FF6B6B' : '1px solid #F0E6D6',
                  borderRadius: 12, cursor: 'pointer',
                  fontFamily: 'var(--font-ibm, sans-serif)',
                  direction: 'rtl', marginBottom: 6,
                }}
              >
                <span>📁</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#2D3142' }}>{p.title}</span>
                {brand && <span style={{ fontSize: 11, color: brand.color, fontWeight: 600 }}>{brand.name}</span>}
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
          <select style={{ ...inputStyle, height: 36, marginBottom: 10 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">كل الأولويات</option>
            <option value="critical">حرج</option>
            <option value="high">عالي</option>
            <option value="medium">متوسط</option>
            <option value="low">منخفض</option>
          </select>
          {filtered.slice(0, 10).map(t => (
            <button key={t.id} onClick={() => handleTargetSelect(t.id, t.title, PRIORITY_COLORS[t.priority] ?? '#FF6B6B')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px',
                background: selectedId === t.id ? '#FFF0F0' : 'white',
                border: selectedId === t.id ? '1.5px solid #FF6B6B' : '1px solid #F0E6D6',
                borderLeft: `3px solid ${PRIORITY_COLORS[t.priority] ?? '#FF6B6B'}`,
                borderRadius: 12, cursor: 'pointer',
                fontFamily: 'var(--font-ibm, sans-serif)',
                direction: 'rtl', marginBottom: 6,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[t.priority] ?? '#888', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#2D3142' }}>{t.title}</span>
              {t.brandName && <span style={{ fontSize: 10, color: t.brandColor ?? '#8B8F9F', fontWeight: 600 }}>{t.brandName}</span>}
              {selectedId === t.id && <span style={{ color: '#FF6B6B' }}>✓</span>}
            </button>
          ))}
          {filtered.length === 0 && <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, color: '#8B8F9F', padding: '8px 0' }}>لا توجد مهام مطابقة</div>}
        </>
      );
    }
    if (type === 'personal') {
      const filtered = priorityFilter ? personalTasks.filter(t => t.priority === priorityFilter) : personalTasks;
      return (
        <>
          <select style={{ ...inputStyle, height: 36, marginBottom: 10 }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">كل الأولويات</option>
            <option value="critical">حرج</option>
            <option value="high">عالي</option>
            <option value="medium">متوسط</option>
            <option value="low">منخفض</option>
          </select>
          {filtered.slice(0, 10).map(t => (
            <button key={t.id} onClick={() => handleTargetSelect(t.id, t.title, PRIORITY_COLORS[t.priority] ?? '#A78BFA')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px',
                background: selectedId === t.id ? '#F5F0FF' : 'white',
                border: selectedId === t.id ? '1.5px solid #A78BFA' : '1px solid #F0E6D6',
                borderRadius: 12, cursor: 'pointer',
                fontFamily: 'var(--font-ibm, sans-serif)',
                direction: 'rtl', marginBottom: 6,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[t.priority] ?? '#A78BFA', display: 'inline-block', flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#2D3142' }}>{t.title}</span>
              {selectedId === t.id && <span style={{ color: '#A78BFA' }}>✓</span>}
            </button>
          ))}
        </>
      );
    }
    if (type === 'finance') {
      return (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>💰</div>
          <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 16, fontWeight: 700, color: '#6BCB77', marginBottom: 10 }}>يوم مالي</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {['مراجعة الحسابات', 'دفع الرواتب', 'تحليل المبيعات', 'مراجعة المصاريف', 'تخطيط الميزانية'].map(tag => (
              <span key={tag} style={{ background: '#F0FFF4', color: '#6BCB77', padding: '4px 12px', borderRadius: 20, fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        </div>
      );
    }
    if (type === 'recharge') {
      return (
        <div style={{ padding: '12px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🌿</div>
          <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 16, fontWeight: 700, color: '#4ECDC4', marginBottom: 10 }}>يوم استراحة وشحن طاقة</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
            {['نوم كافٍ', 'رياضة خفيفة', 'وقت عائلي', 'قراءة', 'تأمل وتفكير'].map(tag => (
              <span key={tag} style={{ background: '#F0FFFE', color: '#4ECDC4', padding: '4px 12px', borderRadius: 20, fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, fontWeight: 600 }}>{tag}</span>
            ))}
          </div>
        </div>
      );
    }
    if (type === 'custom') {
      return (
        <input
          style={{ ...inputStyle, height: 42, fontSize: 15 }}
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
      style={{ position: 'fixed', inset: 0, background: 'rgba(45,49,66,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto',
          direction: 'rtl',
          boxShadow: '0 20px 60px rgba(255,107,107,0.15)',
          color: '#2D3142',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 20px 16px',
          borderBottom: '1px solid #F5EDE4',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #FFF0F0, #FFF8F0)',
          borderRadius: '24px 24px 0 0',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 18, fontWeight: 800, color: '#2D3142' }}>
              🧭 تعيين فوكس — {dayName(dateStr)}
            </div>
            <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, color: '#8B8F9F', marginTop: 2 }}>
              {dateShort(dateStr)}{isToday ? ' — اليوم' : ''}
            </div>
          </div>
          <button onClick={onClose} style={{ background: '#F5EDE4', border: 'none', borderRadius: 10, width: 32, height: 32, fontSize: 14, cursor: 'pointer', color: '#8B8F9F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Hungry brands */}
          {hungryBrands.length > 0 && (
            <div style={{
              background: '#FFF8F0',
              border: '1px solid #FFE0C0',
              borderRadius: 12,
              padding: '10px 14px',
              marginBottom: 16,
              direction: 'rtl',
            }}>
              <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 11, fontWeight: 700, color: '#FFB085', marginBottom: 8 }}>
                ⚡ براندات بدون فوكس هذا الأسبوع:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {hungryBrands.map(b => (
                  <button
                    key={b.id}
                    onClick={() => { handleTypeSelect('brand'); handleTargetSelect(b.id, b.name, b.color); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '4px 10px',
                      background: 'white',
                      border: `1.5px solid ${b.color}`,
                      borderRadius: 20, cursor: 'pointer',
                      fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, fontWeight: 600,
                      color: b.color,
                    }}
                  >
                    <span>{b.icon}</span>
                    <span>{b.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Type Selector */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, fontWeight: 700, color: '#8B8F9F', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              نوع الفوكس
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['brand', 'project', 'task', 'personal', 'finance', 'recharge', 'custom'] as FocusTargetType[]).map(t => (
                <button
                  key={t}
                  onClick={() => handleTypeSelect(t)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 12px',
                    background: type === t ? '#FF6B6B' : 'white',
                    border: type === t ? '1.5px solid #FF6B6B' : '1px solid #F0E6D6',
                    borderRadius: 20, cursor: 'pointer',
                    fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, fontWeight: 600,
                    color: type === t ? 'white' : '#5A5F73',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{FOCUS_TYPE_ICONS[t]}</span>
                  <span>{FOCUS_TYPE_LABELS[t]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, fontWeight: 700, color: '#8B8F9F', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {type === 'brand' ? 'اختر البراند' : type === 'project' ? 'اختر المشروع' : type === 'task' ? 'اختر المهمة' : type === 'personal' ? 'اختر المهمة الشخصية' : type === 'finance' ? 'تفاصيل اليوم المالي' : type === 'recharge' ? 'تفاصيل الاستراحة' : 'اكتب الفوكس'}
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }}>
              {buildTargetList()}
            </div>
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, fontWeight: 700, color: '#8B8F9F', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>ملاحظات (اختياري)</div>
            <textarea
              style={{ ...inputStyle, resize: 'none', padding: '10px 12px', fontSize: 14 }}
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
              width: '100%', padding: '12px',
              background: isSaveDisabled ? '#F0E6D6' : 'linear-gradient(135deg, #FF6B6B 0%, #FFB085 100%)',
              color: isSaveDisabled ? '#C4C8D4' : 'white',
              border: 'none', borderRadius: 14,
              fontFamily: 'var(--font-ibm, sans-serif)',
              fontSize: 15, fontWeight: 700,
              cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
              marginBottom: 10,
              boxShadow: isSaveDisabled ? 'none' : '0 4px 16px rgba(255,107,107,0.3)',
            }}
          >
            {isPending ? '...' : '💾 حفظ'}
          </button>

          {existing && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleMigrateToNext} disabled={isPending}
                style={{
                  flex: 1, padding: '10px',
                  background: '#FFF8F0',
                  border: '1px solid #FFE0C0',
                  borderRadius: 12,
                  fontFamily: 'var(--font-ibm, sans-serif)',
                  fontSize: 13, color: '#FFB085', fontWeight: 600,
                  cursor: 'pointer',
                }}>
                ترحيل للغد ➡️
              </button>
              <button onClick={handleClear} disabled={isPending}
                style={{
                  flex: 1, padding: '10px',
                  background: '#FFF0F0',
                  border: '1px solid #FFD0D0',
                  borderRadius: 12,
                  fontFamily: 'var(--font-ibm, sans-serif)',
                  fontSize: 13, color: '#FF6B6B', fontWeight: 600,
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
      <SunriseCard accent="#4ECDC4" style={{ marginBottom: 20, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, color: '#4ECDC4', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>وضع الاستراحة</div>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🌿</div>
        <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 20, fontWeight: 800, color: '#2D3142' }}>يوم راحة مقصود</div>
        <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, color: '#8B8F9F', marginTop: 6 }}>
          استرح — العقل المرتاح أكثر إنتاجاً
        </div>
        <button onClick={onOpenEditor} style={{
          marginTop: 14, padding: '8px 20px',
          background: '#F0FFFE',
          border: '1.5px solid #4ECDC4',
          borderRadius: 12,
          fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, fontWeight: 600,
          color: '#4ECDC4', cursor: 'pointer',
        }}>تغيير الفوكس</button>
      </SunriseCard>
    );
  }

  // No focus
  if (!todayFocus) {
    return (
      <SunriseCard accent="#FFD93D" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, color: '#FFB085', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          الشيء الواحد الآن
        </div>
        <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 14, color: '#8B8F9F', marginBottom: 16, lineHeight: 1.6 }}>
          {tip}
        </div>
        <button onClick={onOpenEditor} style={{
          width: '100%', padding: '12px',
          background: 'linear-gradient(135deg, #FF6B6B 0%, #FFB085 100%)',
          color: 'white', border: 'none', borderRadius: 14,
          fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 15, fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(255,107,107,0.3)',
        }}>
          🧭 حدد فوكس اليوم
        </button>
      </SunriseCard>
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
      <SunriseCard accent={taskColor} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12, direction: 'rtl' }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 10, fontWeight: 700, background: '#EEF2FF', color: '#6366F1', padding: '2px 8px', borderRadius: 20 }}>مهمة</span>
              <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 10, fontWeight: 700, background: `${PRIORITY_COLORS[selectedTask.priority]}18`, color: PRIORITY_COLORS[selectedTask.priority], padding: '2px 8px', borderRadius: 20 }}>{PRIORITY_LABELS[selectedTask.priority]}</span>
              {isOverdue && <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 10, fontWeight: 700, background: '#FFE3E3', color: '#FF6B6B', padding: '2px 8px', borderRadius: 20 }}>متأخرة</span>}
            </div>
            <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 22, fontWeight: 800, color: '#2D3142', marginBottom: 4, lineHeight: 1.3 }}>
              {selectedTask.title}
            </div>
            {taskBrand && <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, color: taskColor, fontWeight: 600 }}>{taskBrand.name}</div>}
          </div>
        </div>

        {stTotal > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 11, color: '#8B8F9F', marginBottom: 4 }}>
              <span>مهام فرعية: {stDone}/{stTotal}</span>
              <span>{stTotal > 0 ? Math.round(stDone/stTotal*100) : 0}%</span>
            </div>
            <div style={{ height: 6, background: '#F5EDE4', borderRadius: 6 }}>
              <div style={{ width: `${stTotal > 0 ? Math.round(stDone/stTotal*100) : 0}%`, height: 6, background: taskColor, borderRadius: 6, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        {nextSteps.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 11, fontWeight: 700, color: '#8B8F9F', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>الخطوة التالية:</div>
            {nextSteps.map(step => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid #F5EDE4' }}>
                <input type="checkbox" style={{ accentColor: taskColor }} />
                <span style={{ flex: 1, fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, color: '#2D3142' }}>{step.title}</span>
                <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 10, fontWeight: 600, color: '#8B8F9F', background: '#F5EDE4', padding: '2px 8px', borderRadius: 10 }}>{step.type}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {[
            { label: '✓ خلصت', bg: '#F0FFF4', color: '#6BCB77', border: '#C0EDD0' },
            { label: '⏸ معلق', bg: '#FFF8F0', color: '#FFB085', border: '#FFE0C0' },
            { label: '↩ رجوع', bg: '#F5EDE4', color: '#8B8F9F', border: '#E0D8D0' },
          ].map(btn => (
            <button key={btn.label} onClick={() => setSelectedTaskId(null)} style={{
              padding: '6px 14px',
              background: btn.bg,
              border: `1px solid ${btn.border}`,
              borderRadius: 10,
              fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, fontWeight: 600,
              color: btn.color, cursor: 'pointer',
            }}>{btn.label}</button>
          ))}
        </div>
      </SunriseCard>
    );
  }

  // Focus with tasks list
  return (
    <SunriseCard accent={color} style={{ marginBottom: 20 }}>
      {/* Focus Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 16, direction: 'rtl' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 11, fontWeight: 700, color: '#8B8F9F', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {FOCUS_TYPE_ICONS[todayFocus.targetType]} {FOCUS_TYPE_LABELS[todayFocus.targetType]}
          </div>
          <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 24, fontWeight: 800, color: '#2D3142', lineHeight: 1.2, marginBottom: 4 }}>
            {todayFocus.targetName}
          </div>
          {brand && <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, color: '#8B8F9F' }}>{brand.icon} براند</div>}
          {project && project.progress > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 11, color: '#8B8F9F', marginBottom: 4 }}>
                <span>تقدم المشروع</span>
                <span>{project.progress}%</span>
              </div>
              <div style={{ height: 6, background: '#F5EDE4', borderRadius: 6 }}>
                <div style={{ width: `${project.progress}%`, height: 6, background: color, borderRadius: 6 }} />
              </div>
            </div>
          )}
        </div>
        <button onClick={onOpenEditor} style={{
          padding: '6px 14px',
          background: `${color}12`,
          border: `1.5px solid ${color}40`,
          borderRadius: 10,
          fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, fontWeight: 600,
          color, cursor: 'pointer', flexShrink: 0,
        }}>تعديل</button>
      </div>

      {/* Tasks */}
      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0', fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, color: '#8B8F9F' }}>
          ✅ لا توجد مهام مرتبطة
        </div>
      ) : (
        <>
          <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 11, fontWeight: 700, color: '#8B8F9F', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            المهام المرتبطة ({sorted.length})
          </div>
          {sorted.slice(0, 8).map(t => {
            const pColor = PRIORITY_COLORS[t.priority] ?? '#8B8F9F';
            const brand = brands.find(b => b.id === t.brandId);
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
                  width: '100%', display: 'flex', flexDirection: 'column', gap: 4,
                  padding: '10px 12px',
                  background: '#FAFAFA',
                  border: '1px solid #F0E6D6',
                  borderRight: `3px solid ${pColor}`,
                  borderRadius: 12, cursor: 'pointer',
                  fontFamily: 'var(--font-ibm, sans-serif)',
                  marginBottom: 6, textAlign: 'right', direction: 'rtl',
                  transition: 'all 0.1s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: pColor, display: 'inline-block', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#2D3142' }}>{t.title}</span>
                  <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 10, fontWeight: 700, background: `${pColor}18`, color: pColor, padding: '2px 8px', borderRadius: 10 }}>{PRIORITY_LABELS[t.priority]}</span>
                </div>
                {brand && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingRight: 16 }}>
                    <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 11, color: brand.color, fontWeight: 600 }}>{brand.name}</span>
                    {isOverdue && <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 10, color: '#FF6B6B', fontWeight: 700 }}>⚠ متأخرة</span>}
                  </div>
                )}
                {totalItems > 0 && (
                  <div style={{ paddingRight: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ flex: 1, height: 4, background: '#F0E6D6', borderRadius: 4 }}>
                      <div style={{ width: `${pct}%`, height: 4, background: pColor, borderRadius: 4 }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 10, color: '#8B8F9F' }}>{doneItems}/{totalItems}</span>
                  </div>
                )}
              </button>
            );
          })}
          {sorted.length > 8 && <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, color: '#8B8F9F', textAlign: 'center', marginTop: 4 }}>+ {sorted.length - 8} مهمة أخرى</div>}
        </>
      )}
    </SunriseCard>
  );
}

// ─── Decisions Panel ──────────────────────────────────────────────────────────
function DecisionsPanel({ decisions, brands }: { decisions: DecisionRow[]; brands: Brand[] }) {
  if (!decisions.length) {
    return (
      <div style={{ textAlign: 'center', padding: 16, fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 14, color: '#6BCB77', fontWeight: 600 }}>
        ✅ كل القرارات محسومة!
      </div>
    );
  }
  const impactColors: Record<string, string> = { critical: '#FF6B6B', high: '#FF6B6B', medium: '#FFB085', low: '#8B8F9F' };
  return (
    <div>
      {decisions.slice(0, 5).map(d => {
        const brand = brands.find(b => b.id === d.brand_id);
        return (
          <div key={d.id} style={{ padding: '10px 0', borderBottom: '1px solid #F5EDE4' }}>
            <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 14, fontWeight: 700, marginBottom: 6, color: '#2D3142' }}>{d.title}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'var(--font-ibm, sans-serif)',
                fontSize: 10, fontWeight: 700,
                background: `${impactColors[d.impact] ?? '#888'}18`,
                color: impactColors[d.impact] ?? '#888',
                padding: '2px 8px', borderRadius: 20,
              }}>
                {d.impact === 'critical' ? 'حرج' : d.impact === 'high' ? 'مرتفع' : d.impact === 'medium' ? 'متوسط' : 'منخفض'}
              </span>
              {d.deadline && (
                <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 11, color: daysLeft(d.deadline) < 3 ? '#FF6B6B' : '#8B8F9F', fontWeight: 600 }}>
                  {daysLeftLabel(d.deadline)}
                </span>
              )}
              {brand && <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 10, fontWeight: 700, background: `${brand.color}18`, color: brand.color, padding: '2px 8px', borderRadius: 20 }}>{brand.name}</span>}
            </div>
          </div>
        );
      })}
      {decisions.length > 5 && (
        <Link href="/decisions" style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, fontWeight: 700, color: '#FF6B6B', display: 'block', marginTop: 10 }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12, direction: 'rtl' }}>
        <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 16, fontWeight: 800, color: '#2D3142' }}>
          {MONTH_NAMES[month]}
        </span>
        <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, color: '#8B8F9F', fontWeight: 600 }}>
          {year}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 12 }}>
        {['أح','إث','ثل','أر','خم','جم','سب'].map(d => (
          <div key={d} style={{ textAlign: 'center', fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 9, fontWeight: 700, color: '#C4C8D4', textTransform: 'uppercase' }}>{d}</div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isToday = day === today;
          const hasEvent = eventDays.has(day);
          return (
            <div key={day} style={{
              textAlign: 'center',
              fontFamily: 'var(--font-ibm, sans-serif)',
              fontSize: 11, padding: '4px 0', borderRadius: '50%',
              background: isToday ? '#FF6B6B' : 'transparent',
              color: isToday ? '#fff' : hasEvent ? '#FF6B6B' : '#5A5F73',
              fontWeight: isToday || hasEvent ? 700 : 400,
              position: 'relative',
            }}>
              {day}
              {hasEvent && !isToday && (
                <span style={{
                  position: 'absolute', bottom: 1, left: '50%', transform: 'translateX(-50%)',
                  width: 3, height: 3, borderRadius: '50%', background: '#FFB085', display: 'block',
                }} />
              )}
            </div>
          );
        })}
      </div>
      {upcomingEvents.slice(0, 4).map(e => {
        const brand = brands.find(b => b.id === e.brandId);
        return (
          <div key={e.id} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: '1px solid #F5EDE4', alignItems: 'center', direction: 'rtl' }}>
            <div style={{
              minWidth: 28, height: 28, borderRadius: 8,
              background: '#FFF0F0',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-ibm, sans-serif)', fontWeight: 800, fontSize: 12, color: '#FF6B6B',
            }}>{e.day}</div>
            <div style={{ flex: 1, fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, color: '#2D3142', fontWeight: 500 }}>{e.title}</div>
            {brand && <span style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 10, fontWeight: 700, color: brand.color }}>{brand.name}</span>}
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
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, direction: 'rtl' }}>
        <input
          style={{
            flex: 1, height: 38, padding: '0 12px',
            border: '1px solid #F0E6D6',
            borderRadius: 12, fontSize: 13,
            fontFamily: 'var(--font-ibm, sans-serif)',
            background: '#FAFAFA',
            color: '#2D3142', direction: 'rtl',
            outline: 'none',
          }}
          placeholder="فكرة أو ملاحظة سريعة..."
          value={newText}
          onChange={e => setNewText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
        />
        <button onClick={handleAdd} disabled={isPending || !newText.trim()}
          style={{
            padding: '0 16px',
            background: 'linear-gradient(135deg, #FF6B6B, #FFB085)',
            color: 'white', border: 'none', borderRadius: 12,
            fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 18, fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(255,107,107,0.25)',
          }}>+</button>
      </div>
      {inboxTasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 16, fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, color: '#C4C8D4' }}>
          صندوق الوارد فارغ ✨
        </div>
      ) : (
        inboxTasks.slice(0, 8).map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '8px 0', borderBottom: '1px solid #F5EDE4',
            direction: 'rtl',
          }}>
            <span style={{ color: '#FFB085', fontSize: 12, marginTop: 4, flexShrink: 0 }}>◆</span>
            <span style={{ flex: 1, fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, color: '#2D3142', lineHeight: 1.5 }}>{t.text}</span>
            <button onClick={() => handleDelete(t.id)}
              style={{ background: 'none', border: 'none', color: '#C4C8D4', cursor: 'pointer', fontSize: 13, padding: '0 4px', flexShrink: 0, transition: 'color 0.15s' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#FF6B6B'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = '#C4C8D4'; }}
            >✕</button>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Brand Health Strip (بطاقات براندات) ─────────────────────────────────────
function BrandHealthStrip({ brands, activeTasks }: { brands: Brand[]; activeTasks: ActiveTask[] }) {
  const statusColors: Record<string, string> = { active: '#6BCB77', selling: '#4ECDC4', paused: '#FFB085', archived: '#C4C8D4' };
  const statusLabels: Record<string, string> = { active: 'نشط', selling: 'بيع', paused: 'موقف', archived: 'أرشيف' };

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 8 }}>
      {brands.map((b) => {
        const tasks = activeTasks.filter(t => t.brandId === b.id);

        return (
          <Link key={b.id} href={`/brands/${b.id}`}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textDecoration: 'none', flexShrink: 0,
              padding: '12px 14px',
              background: 'white',
              border: '1px solid #F0E6D6',
              borderTop: `3px solid ${b.color}`,
              borderRadius: 16,
              minWidth: 90,
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${b.color}25`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 6 }}>{b.icon}</div>
            <div style={{
              fontFamily: 'var(--font-ibm, sans-serif)',
              fontSize: 11, fontWeight: 700, color: '#2D3142',
              textAlign: 'center', marginBottom: 4,
              maxWidth: 70, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{b.name}</div>
            {tasks.length > 0 && (
              <div style={{
                background: '#FF6B6B',
                color: 'white',
                borderRadius: 20,
                padding: '1px 8px',
                fontSize: 10, fontWeight: 700,
                fontFamily: 'var(--font-ibm, sans-serif)',
                marginBottom: 4,
              }}>
                {tasks.length} مهمة
              </div>
            )}
            <div style={{
              fontFamily: 'var(--font-ibm, sans-serif)',
              fontSize: 9, fontWeight: 700,
              color: statusColors[b.status] ?? '#C4C8D4',
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
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

  // Greeting based on time
  const hour = d.getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

  return (
    <div className="scr on" style={{ direction: 'rtl', background: '#FFFBF5', minHeight: '100vh' }}>
      {/* Sticky Banner */}
      <StickyBanner todayFocus={todayFocus} todaySales={todaySales} onEdit={() => setEditorDate(todayISO())} />

      {/* Page Header */}
      <div style={{ padding: '24px 24px 16px', direction: 'rtl' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 4 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, fontWeight: 600, color: '#FFB085', marginBottom: 4 }}>
              ☀️ {greeting}
            </div>
            <h1 style={{
              fontFamily: 'var(--font-ibm, sans-serif)',
              fontSize: 28, fontWeight: 800,
              color: '#2D3142',
              margin: 0,
              letterSpacing: '-0.5px',
            }}>
              المركز القيادي
            </h1>
          </div>
          <div style={{
            fontFamily: 'var(--font-ibm, sans-serif)',
            fontSize: 12, color: '#8B8F9F', fontWeight: 500,
            textAlign: 'left',
            marginTop: 4,
          }}>
            {dateLabel}
          </div>
        </div>
      </div>

      {/* Brand Cards Row */}
      <div style={{ padding: '0 24px', marginBottom: 24 }}>
        <BrandHealthStrip brands={brands} activeTasks={activeTasks} />
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, padding: '0 24px 24px' }}>
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
          <SunriseCard accent="#FF6B6B" style={{ marginBottom: 20 }}>
            <SectionTitle icon="⚖️" title="قرارات معلقة" badge={decisions.length} color="#FF6B6B" />
            <DecisionsPanel decisions={decisions} brands={brands} />
          </SunriseCard>
        </div>

        {/* Left Column */}
        <div>
          {/* Calendar */}
          <SunriseCard accent="#FFD93D" style={{ marginBottom: 20 }}>
            <SectionTitle icon="📅" title="التقويم" color="#FFD93D" />
            <CalendarMini upcomingEvents={upcomingEvents} brands={brands} />
          </SunriseCard>

          {/* Inbox */}
          <SunriseCard accent="#4ECDC4" style={{ marginBottom: 20 }}>
            <SectionTitle icon="📥" title="صندوق الوارد" badge={inboxTasks.length} color="#4ECDC4" />
            <InboxPanel inboxTasks={inboxTasks} />
          </SunriseCard>

          {/* Team */}
          {employees.length > 0 && (
            <SunriseCard accent="#A78BFA" style={{ marginBottom: 20 }}>
              <SectionTitle icon="👥" title="الفريق" color="#A78BFA" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                {employees.slice(0, 4).map((e) => {
                  return (
                    <div key={e.id} style={{
                      background: '#FAFAFA',
                      border: '1px solid #F0E6D6',
                      borderRadius: 14, padding: '12px 10px',
                      textAlign: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(el) => {
                      (el.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      (el.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(167,139,250,0.15)';
                    }}
                    onMouseLeave={(el) => {
                      (el.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                      (el.currentTarget as HTMLElement).style.boxShadow = 'none';
                    }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #FF6B6B, #FFB085)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 16, fontWeight: 800,
                        color: 'white',
                        margin: '0 auto 8px',
                      }}>
                        {e.name.charAt(0)}
                      </div>
                      <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 13, fontWeight: 700, color: '#2D3142' }}>{e.name}</div>
                      <div style={{ fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 11, color: '#8B8F9F', marginTop: 2 }}>{e.role}</div>
                      <div style={{ marginTop: 6 }}>
                        <span style={{
                          fontFamily: 'var(--font-ibm, sans-serif)',
                          fontSize: 9, fontWeight: 700,
                          background: e.status === 'active' ? '#F0FFF4' : '#F5EDE4',
                          color: e.status === 'active' ? '#6BCB77' : '#8B8F9F',
                          padding: '2px 8px', borderRadius: 20,
                        }}>
                          {e.status === 'active' ? 'نشط' : e.status === 'on_leave' ? 'إجازة' : 'غير نشط'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Link href="/team" style={{
                fontFamily: 'var(--font-ibm, sans-serif)', fontSize: 12, fontWeight: 700,
                color: '#A78BFA', display: 'block', marginTop: 12, textAlign: 'center',
              }}>
                عرض الفريق كاملاً ←
              </Link>
            </SunriseCard>
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
