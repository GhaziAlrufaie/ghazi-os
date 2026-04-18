'use client';
// Ghazi OS — Leadership (القيادة) — Full Cockpit View
// 8 Elements: TopBar, WeekCompass, FocusNow, DailyFixed, Decisions, Calendar, Inbox, BottomNav
import { useState, useTransition, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  addDecision, updateDecision, deleteDecision,
  addEmployee, updateEmployee, deleteEmployee,
} from '@/lib/leadership-actions';
import {
  addInboxTask, updateInboxTask, deleteInboxTask,
  type InboxTask,
} from '@/lib/inbox-actions';
import {
  setDayFocus, clearDayFocus, moveFocusToNextDay,
  type WeeklyFocusEntry, type FocusTargetType,
} from '@/lib/weekly-focus-actions';
import type { DecisionRow, EmployeeRow } from '@/lib/leadership-types';
import { DECISION_STATUS_LABELS, DECISION_IMPACT_LABELS } from '@/lib/leadership-types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Subtask { id: string; title: string; completed: boolean; }
interface ActiveTask {
  id: string; title: string; status: string; priority: string;
  brandId: string | null; brandName: string | null; brandColor: string | null;
  dueDate: string | null;
  projectId: string | null;
  hasDescription: boolean;
  subtasks: Subtask[];
}
interface UpcomingEvent {
  id: string; title: string; day: number; month: number; year: number;
  brandId: string | null; brandName: string | null; brandColor: string | null;
}
interface Brand { id: string; name: string; icon: string; color: string; }
interface Project { id: string; brandId: string | null; title: string; status: string; }
interface PersonalTask { id: string; title: string; priority: string; status: string; }
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

function toISO(d: Date): string { return d.toISOString().split('T')[0]; }
function todayISO(): string { return toISO(new Date()); }
function fmt(n: number): string { return n.toLocaleString('ar-SA'); }

function getWeekDates(offset = 0): Date[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i + offset * 7);
    return d;
  });
}

// ─── Collapsible Section ──────────────────────────────────────────────────────
function CollapsibleSection({
  id, icon, title, badge, children, defaultOpen = false,
}: {
  id: string; icon: string; title: string; badge?: number; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ background: 'rgba(255,255,255,0.018)', border: '1px solid rgba(201,150,59,0.12)', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt)', fontFamily: 'inherit', textAlign: 'right', direction: 'rtl' }}
      >
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{title}</span>
        {badge !== undefined && badge > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, background: 'rgba(201,150,59,0.2)', color: 'var(--gold)', padding: '2px 8px', borderRadius: 20 }}>{badge}</span>
        )}
        <span style={{ fontSize: 11, color: 'var(--txt3)', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>❯</span>
      </button>
      {open && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Week Compass ─────────────────────────────────────────────────────────────
const FOCUS_TYPE_LABELS: Record<FocusTargetType, string> = {
  brand: '🏷 براند', project: '📁 مشروع', task: '✅ مهمة',
  personal: '👤 شخصي', finance: '💰 مالي', recharge: '⚡ استراحة', custom: '✏ مخصص',
};
const FOCUS_TYPE_COLORS: Record<FocusTargetType, string> = {
  brand: '#C9A84C', project: '#3498db', task: '#2ecc71',
  personal: '#8B5CF6', finance: '#e67e22', recharge: '#1abc9c', custom: '#6B7280',
};
const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

function WeekCompass({
  weeklyFocus, brands, activeTasks, todaySales, onFocusChange, projects, personalTasks,
}: {
  weeklyFocus: WeeklyFocusEntry[];
  brands: Brand[];
  activeTasks: ActiveTask[];
  todaySales: number;
  onFocusChange: (entries: WeeklyFocusEntry[]) => void;
  projects: Project[];
  personalTasks: PersonalTask[];
}) {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<FocusTargetType>('brand');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [taskBrandFilter, setTaskBrandFilter] = useState('');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState('');
  const [customName, setCustomName] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [projectBrandFilter, setProjectBrandFilter] = useState('');
  const [selectedPersonalTaskId, setSelectedPersonalTaskId] = useState('');
  const [personalPriorityFilter, setPersonalPriorityFilter] = useState('');
  const [isPending, startTransition] = useTransition();

  const weekDates = getWeekDates(weekOffset);
  const entryMap = new Map(weeklyFocus.map(e => [e.focusDate, e]));
  const today = todayISO();

  const last7BrandIds = new Set(weeklyFocus.filter(e => e.targetType === 'brand').map(e => e.targetId));
  const neglectedBrands = brands.filter(b => !last7BrandIds.has(b.id));

  const filteredTasks = activeTasks
    .filter(t => !taskBrandFilter || t.brandId === taskBrandFilter)
    .filter(t => !taskPriorityFilter || t.priority === taskPriorityFilter)
    .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));

  const weekStart = weekDates[0];
  const isCurrentWeek = weekOffset === 0;
  const weekLabel = `📅 ${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getFullYear()}${isCurrentWeek ? ' — الحالي' : ''}`;

  function openModal(date: string) {
    const existing = entryMap.get(date);
    setModalDate(date);
    setTargetType(existing?.targetType ?? 'brand');
    setSelectedBrandId(existing?.targetType === 'brand' ? (existing.targetId ?? '') : '');
    setSelectedTaskId(existing?.targetType === 'task' ? (existing.targetId ?? '') : '');
    setSelectedProjectId(existing?.targetType === 'project' ? (existing.targetId ?? '') : '');
    setSelectedPersonalTaskId(existing?.targetType === 'personal' ? (existing.targetId ?? '') : '');
    setTaskBrandFilter('');
    setTaskPriorityFilter('');
    setProjectBrandFilter('');
    setPersonalPriorityFilter('');
    setCustomName(existing?.targetType === 'custom' ? existing.targetName : '');
    setNotes(existing?.notes ?? '');
  }

  function handleSave() {
    if (!modalDate) return;
    let targetName = '', targetColor = FOCUS_TYPE_COLORS[targetType], targetId: string | null = null;
    if (targetType === 'brand') {
      const brand = brands.find(b => b.id === selectedBrandId);
      if (!brand) return;
      targetName = brand.name; targetColor = brand.color; targetId = brand.id;
    } else if (targetType === 'task') {
      const task = activeTasks.find(t => t.id === selectedTaskId);
      if (!task) return;
      targetName = task.title; targetColor = PRIORITY_COLORS[task.priority] ?? '#888'; targetId = task.id;
    } else if (targetType === 'project') {
      const project = projects.find(p => p.id === selectedProjectId);
      if (!project) return;
      targetName = project.title; targetId = project.id;
    } else if (targetType === 'personal') {
      const pt = personalTasks.find(p => p.id === selectedPersonalTaskId);
      if (pt) { targetName = pt.title; targetId = pt.id; } else { targetName = 'مهام شخصية'; }
    } else if (targetType === 'finance') {
      targetName = 'يوم مالي'; targetColor = '#e67e22';
    } else if (targetType === 'recharge') {
      targetName = 'استراحة'; targetColor = '#1abc9c';
    } else {
      if (!customName.trim()) return;
      targetName = customName.trim();
    }
    const date = modalDate;
    startTransition(async () => {
      const result = await setDayFocus({ focusDate: date, targetType, targetId, targetName, targetColor, notes });
      if (result.entry) {
        onFocusChange([...weeklyFocus.filter(e => e.focusDate !== date), result.entry!]);
        router.refresh();
      }
    });
    setModalDate(null);
  }

  function handleClear() {
    if (!modalDate) return;
    const date = modalDate;
    onFocusChange(weeklyFocus.filter(e => e.focusDate !== date));
    setModalDate(null);
    startTransition(async () => {
      await clearDayFocus(date);
      router.refresh();
    });
  }

  function handleMoveToNextDay() {
    if (!modalDate) return;
    const date = modalDate;
    setModalDate(null);
    startTransition(async () => {
      await moveFocusToNextDay(date);
      router.refresh();
    });
  }

  const isSaveDisabled = isPending
    || (targetType === 'brand' && !selectedBrandId)
    || (targetType === 'task' && !selectedTaskId)
    || (targetType === 'project' && !selectedProjectId)
    || (targetType === 'custom' && !customName.trim());

  return (
    <>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, direction: 'rtl', flexWrap: 'wrap' }}>
        <button onClick={() => setWeekOffset(o => o - 1)}
          style={{ fontSize: 14, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--txt3)', fontFamily: 'inherit' }}>‹</button>
        <span style={{ fontSize: 11, color: 'var(--txt3)', flex: 1, textAlign: 'center' }}>{weekLabel}</span>
        <button onClick={() => setWeekOffset(o => o + 1)}
          style={{ fontSize: 14, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: 'var(--txt3)', fontFamily: 'inherit' }}>›</button>
        {neglectedBrands.length > 0 && (
          <span title={neglectedBrands.map(b => b.name).join('، ')}
            style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, background: 'rgba(231,76,60,0.15)', color: '#e74c3c', cursor: 'default', whiteSpace: 'nowrap' }}>
            🔴 {neglectedBrands.length} براند يشتكي
          </span>
        )}
        <button onClick={() => openModal(today)}
          style={{ fontSize: 11, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', border: '1px solid rgba(201,150,59,0.3)', background: 'rgba(201,150,59,0.08)', color: 'var(--gold)', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>+ تعيين اليوم</button>
      </div>

      {/* ── بطاقات الأيام ── */}
      <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
        <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
          {weekDates.map(d => {
            const iso = toISO(d);
            const entry = entryMap.get(iso);
            const isToday = iso === today;
            const brand = entry?.targetType === 'brand' ? brands.find(b => b.id === entry.targetId) : null;
            const taskCount = brand ? activeTasks.filter(t => t.brandId === brand.id).length : 0;
            const typeIcon = brand?.icon ?? (
              entry?.targetType === 'personal' ? '👤' :
              entry?.targetType === 'finance' ? '💰' :
              entry?.targetType === 'recharge' ? '⚡' :
              entry?.targetType === 'task' ? '✅' :
              entry?.targetType === 'project' ? '📁' : '✏'
            );
            return (
              <button
                key={iso}
                onClick={() => openModal(iso)}
                style={{
                  width: 110, flexShrink: 0, padding: '10px 8px', borderRadius: 12, cursor: 'pointer', textAlign: 'right', direction: 'rtl',
                  background: isToday ? 'rgba(201,150,59,0.08)' : 'rgba(255,255,255,0.02)',
                  border: isToday ? '1.5px solid rgba(201,150,59,0.4)' : '1.5px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isToday ? 'var(--gold)' : 'var(--txt3)' }}>{DAY_NAMES[d.getDay()]}</span>
                  <span style={{ fontSize: 9, color: 'var(--txt3)' }}>{d.getDate()}</span>
                </div>
                {entry ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                      <span style={{ fontSize: 13 }}>{typeIcon}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: entry.targetColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 68 }}>{entry.targetName}</span>
                    </div>
                    <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 10, background: `${entry.targetColor}22`, color: entry.targetColor, display: 'inline-block', marginBottom: 3 }}>
                      {FOCUS_TYPE_LABELS[entry.targetType]?.split(' ')[1] ?? entry.targetType}
                    </span>
                    {/* براند: عدد المهام + مبيعات اليوم */}
                    {entry.targetType === 'brand' && brand && taskCount > 0 && (
                      <div style={{ fontSize: 8, color: 'var(--txt3)', marginTop: 2 }}>{taskCount} مهمة</div>
                    )}
                    {isToday && entry.targetType === 'brand' && (
                      <div style={{ fontSize: 8, color: '#2ecc71', marginTop: 1 }}>{fmt(todaySales)} ر.س</div>
                    )}
                    {/* مشروع: أيقونة مشروع */}
                    {entry.targetType === 'project' && (
                      <div style={{ fontSize: 8, color: '#3498db', marginTop: 2 }}>📁 مشروع</div>
                    )}
                    {/* مهمة: نقطة ملونة بالأولوية */}
                    {entry.targetType === 'task' && (
                      <div style={{ fontSize: 8, color: entry.targetColor, marginTop: 2 }}>✅ مهمة</div>
                    )}
                    {/* شخصي */}
                    {entry.targetType === 'personal' && (
                      <div style={{ fontSize: 8, color: '#8B5CF6', marginTop: 2 }}>👤 شخصي</div>
                    )}
                    {/* مالي */}
                    {entry.targetType === 'finance' && (
                      <div style={{ fontSize: 8, color: '#e67e22', marginTop: 2 }}>💰 يوم مالي</div>
                    )}
                    {/* استراحة */}
                    {entry.targetType === 'recharge' && (
                      <div style={{ fontSize: 8, color: '#1abc9c', marginTop: 2 }}>🌿 استراحة</div>
                    )}
                    {entry.notes && <p style={{ fontSize: 8, color: 'var(--txt3)', margin: '2px 0 0', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{entry.notes}</p>}
                  </div>
                ) : (
                  <span style={{ fontSize: 9, color: 'var(--txt3)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 4, padding: '2px 4px', display: 'inline-block' }}>+ فوكس</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── لوحة البراندات المهملة ── */}
      {neglectedBrands.length > 0 && (
        <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 10, background: 'rgba(231,76,60,0.06)', border: '1px solid rgba(231,76,60,0.15)', direction: 'rtl' }}>
          <p style={{ fontSize: 10, color: '#e74c3c', margin: '0 0 6px', fontWeight: 600 }}>🔴 براندات لم تُعيَّن هذا الأسبوع:</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {neglectedBrands.map(b => (
              <button key={b.id} onClick={() => openModal(today)}
                style={{ fontSize: 10, padding: '3px 8px', borderRadius: 20, cursor: 'pointer', border: `1px solid ${b.color}44`, background: `${b.color}11`, color: b.color, fontFamily: 'inherit' }}>
                {b.icon} {b.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Modal تعيين الفوكس ── */}
      {modalDate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setModalDate(null)}>
          <div style={{ background: '#0c1020', border: '1px solid rgba(201,150,59,0.2)', borderRadius: 16, padding: 20, width: '100%', maxWidth: 440, maxHeight: '90vh', overflowY: 'auto', direction: 'rtl' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>تعيين الفوكس</h3>
            <p style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 14 }}>{DAY_NAMES[new Date(modalDate + 'T12:00:00').getDay()]} — {modalDate}</p>

            {/* 7 أنواع */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 14 }}>
              {(Object.keys(FOCUS_TYPE_LABELS) as FocusTargetType[]).map(t => (
                <button key={t} onClick={() => setTargetType(t)}
                  style={{ fontSize: 10, padding: '7px 4px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: targetType === t ? `1px solid ${FOCUS_TYPE_COLORS[t]}` : '1px solid rgba(255,255,255,0.08)', background: targetType === t ? `${FOCUS_TYPE_COLORS[t]}22` : 'rgba(255,255,255,0.03)', color: targetType === t ? FOCUS_TYPE_COLORS[t] : 'var(--txt3)', textAlign: 'center' }}>
                  {FOCUS_TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            {/* براند */}
            {targetType === 'brand' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                {brands.map(b => (
                  <button key={b.id} onClick={() => setSelectedBrandId(b.id)}
                    style={{ fontSize: 11, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right', direction: 'rtl', border: selectedBrandId === b.id ? `1px solid ${b.color}` : '1px solid rgba(255,255,255,0.08)', background: selectedBrandId === b.id ? `${b.color}20` : 'rgba(255,255,255,0.02)', color: selectedBrandId === b.id ? 'var(--txt)' : 'var(--txt3)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14 }}>{b.icon}</span>
                      <span style={{ color: selectedBrandId === b.id ? b.color : undefined }}>{b.name}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* مهمة: فلترة بالبراند أولاً ثم الأولوية */}
            {targetType === 'task' && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                  <select value={taskBrandFilter} onChange={e => setTaskBrandFilter(e.target.value)}
                    style={{ fontSize: 10, padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0c1020', color: 'var(--txt)', fontFamily: 'inherit', flex: 1 }}>
                    <option value=''>كل البراندات</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                  </select>
                  <select value={taskPriorityFilter} onChange={e => setTaskPriorityFilter(e.target.value)}
                    style={{ fontSize: 10, padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0c1020', color: 'var(--txt)', fontFamily: 'inherit', flex: 1 }}>
                    <option value=''>كل الأولويات</option>
                    <option value='critical'>🔴 حرج</option>
                    <option value='high'>🟠 عالي</option>
                    <option value='medium'>🔵 متوسط</option>
                    <option value='low'>🟢 منخفض</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                  {filteredTasks.length === 0 && <p style={{ fontSize: 11, color: 'var(--txt3)', textAlign: 'center', padding: 8 }}>لا توجد مهام</p>}
                  {filteredTasks.map(t => (
                    <button key={t.id} onClick={() => setSelectedTaskId(t.id)}
                      style={{ fontSize: 11, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right', direction: 'rtl', border: selectedTaskId === t.id ? `1px solid ${PRIORITY_COLORS[t.priority]}` : '1px solid rgba(255,255,255,0.08)', background: selectedTaskId === t.id ? `${PRIORITY_COLORS[t.priority]}18` : 'rgba(255,255,255,0.02)', color: 'var(--txt)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[t.priority] ?? '#888', flexShrink: 0 }} />
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</span>
                        {t.brandName && <span style={{ fontSize: 9, color: t.brandColor ?? 'var(--txt3)', flexShrink: 0 }}>{t.brandName}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* مشروع: فلترة بالبراند ثم قائمة مشاريعه */}
            {targetType === 'project' && (
              <div style={{ marginBottom: 14 }}>
                <select value={projectBrandFilter} onChange={e => { setProjectBrandFilter(e.target.value); setSelectedProjectId(''); }}
                  style={{ fontSize: 10, padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0c1020', color: 'var(--txt)', fontFamily: 'inherit', width: '100%', marginBottom: 8 }}>
                  <option value=''>كل البراندات</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                </select>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                  {projects.filter(p => !projectBrandFilter || p.brandId === projectBrandFilter).length === 0 && (
                    <p style={{ fontSize: 11, color: 'var(--txt3)', textAlign: 'center', padding: 8 }}>لا توجد مشاريع نشطة</p>
                  )}
                  {projects.filter(p => !projectBrandFilter || p.brandId === projectBrandFilter).map(p => {
                    const pBrand = brands.find(b => b.id === p.brandId);
                    return (
                      <button key={p.id} onClick={() => setSelectedProjectId(p.id)}
                        style={{ fontSize: 11, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right', direction: 'rtl', border: selectedProjectId === p.id ? '1px solid #3498db' : '1px solid rgba(255,255,255,0.08)', background: selectedProjectId === p.id ? 'rgba(52,152,219,0.12)' : 'rgba(255,255,255,0.02)', color: 'var(--txt)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13 }}>📁</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                          {pBrand && <span style={{ fontSize: 9, color: pBrand.color, flexShrink: 0 }}>{pBrand.icon} {pBrand.name}</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* شخصي: قائمة personal_tasks مع فلترة بالأولوية */}
            {targetType === 'personal' && (
              <div style={{ marginBottom: 14 }}>
                <select value={personalPriorityFilter} onChange={e => setPersonalPriorityFilter(e.target.value)}
                  style={{ fontSize: 10, padding: '5px 8px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: '#0c1020', color: 'var(--txt)', fontFamily: 'inherit', width: '100%', marginBottom: 8 }}>
                  <option value=''>كل الأولويات</option>
                  <option value='critical'>🔴 حرج</option>
                  <option value='high'>🟠 عالي</option>
                  <option value='medium'>🔵 متوسط</option>
                  <option value='low'>🟢 منخفض</option>
                </select>
                {personalTasks.length === 0 ? (
                  <p style={{ fontSize: 11, color: 'var(--txt3)', textAlign: 'center', padding: 8 }}>لا توجد مهام شخصية نشطة</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 200, overflowY: 'auto' }}>
                    {personalTasks
                      .filter(p => !personalPriorityFilter || p.priority === personalPriorityFilter)
                      .sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9))
                      .map(p => (
                        <button key={p.id} onClick={() => setSelectedPersonalTaskId(p.id)}
                          style={{ fontSize: 11, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right', direction: 'rtl', border: selectedPersonalTaskId === p.id ? `1px solid ${PRIORITY_COLORS[p.priority] ?? '#8B5CF6'}` : '1px solid rgba(255,255,255,0.08)', background: selectedPersonalTaskId === p.id ? `${PRIORITY_COLORS[p.priority] ?? '#8B5CF6'}18` : 'rgba(255,255,255,0.02)', color: 'var(--txt)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: PRIORITY_COLORS[p.priority] ?? '#8B5CF6', flexShrink: 0 }} />
                            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                            <span style={{ fontSize: 9, color: PRIORITY_COLORS[p.priority] ?? '#8B5CF6', flexShrink: 0 }}>{PRIORITY_LABELS[p.priority]}</span>
                          </div>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* مالي: نص توضيحي + ملاحظات */}
            {targetType === 'finance' && (
              <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 10, background: 'rgba(230,126,34,0.06)', border: '1px solid rgba(230,126,34,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>💰</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#e67e22' }}>يوم مالي</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>مراجعات، حسابات، دفعات، تقارير مالية</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['مراجعة الحسابات', 'دفع الرواتب', 'تقرير المبيعات', 'تسوية الفواتير'].map(tag => (
                    <span key={tag} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: 'rgba(230,126,34,0.1)', color: '#e67e22', border: '1px solid rgba(230,126,34,0.2)' }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* استراحة: نص توضيحي + ملاحظات */}
            {targetType === 'recharge' && (
              <div style={{ marginBottom: 14, padding: '12px 14px', borderRadius: 10, background: 'rgba(26,188,156,0.06)', border: '1px solid rgba(26,188,156,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>🌿</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1abc9c' }}>يوم استراحة وتجديد طاقة</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>لا عمل اليوم — فقط راحة واستعادة الطاقة</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['نوم كافٍ', 'رياضة خفيفة', 'قراءة', 'وقت عائلي', 'تأمل'].map(tag => (
                    <span key={tag} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 20, background: 'rgba(26,188,156,0.1)', color: '#1abc9c', border: '1px solid rgba(26,188,156,0.2)' }}>{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* مخصص */}
            {targetType === 'custom' && (
              <input value={customName} onChange={e => setCustomName(e.target.value)}
                placeholder='اسم الفوكس المخصص'
                className='input' style={{ marginBottom: 14 }} />
            )}

            {/* ملاحظات */}
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder='ملاحظات (اختياري)' className='input' style={{ height: 56, resize: 'none', marginBottom: 14 }} />

            {/* أزرار */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {entryMap.has(modalDate) && (
                <>
                  <button onClick={handleClear} style={{ fontSize: 11, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid rgba(231,76,60,0.3)', background: 'transparent', color: '#e74c3c' }}>مسح</button>
                  <button onClick={handleMoveToNextDay} style={{ fontSize: 11, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid rgba(52,152,219,0.3)', background: 'transparent', color: '#3498db' }}>ترحيل للغد ➡️</button>
                </>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={() => setModalDate(null)} style={{ fontSize: 12, padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: 'transparent', color: 'var(--txt3)' }}>إلغاء</button>
              <button onClick={handleSave} disabled={isSaveDisabled}
                style={{ fontSize: 12, padding: '7px 18px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: 'linear-gradient(135deg,var(--gold),#8B6914)', color: '#05070d', fontWeight: 700, opacity: isSaveDisabled ? 0.5 : 1 }}>
                {isPending ? 'جارٍ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─── Focus Now (الشيء الواحد الآن) ───────────────────────────────────────────
const FOCUS_TIPS = [
  'ابدأ يومك بالمهم مو بالعاجل',
  'الإنجاز الحقيقي يبدأ بخطوة واحدة',
  'لا تطارد الكمال — أنجز ثم حسّن',
  'ركّز على شيء واحد حتى يكتمل',
  'المهمة الصعبة أولاً — بعدها كل شيء أسهل',
  'قيمتك في عمقك لا في كثرة مهامك',
];

const STATUS_LABELS: Record<string, string> = {
  todo: 'قيد الانتظار', in_progress: 'جاري', blocked: 'عالق', done: 'مكتمل',
};

function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}


function FocusNow({
  tasks, todayFocus, projects, personalTasks,
}: {
  tasks: ActiveTask[];
  todayFocus: WeeklyFocusEntry | null;
  projects: Project[];
  personalTasks: PersonalTask[];
}) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localSubtasks, setLocalSubtasks] = useState<Record<string, boolean>>({});
  const [localStatus, setLocalStatus] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const tip = FOCUS_TIPS[new Date().getDay() % FOCUS_TIPS.length];

  // ── فلترة المهام حسب نوع الفوكس ──
  const focusType = todayFocus?.targetType ?? null;
  const focusTargetId = todayFocus?.targetId ?? null;

  const candidateTasks = (() => {
    if (!focusType || focusType === 'custom') return tasks;
    if (focusType === 'brand') {
      return tasks.filter(t => t.brandId === focusTargetId);
    }
    if (focusType === 'project') {
      return tasks.filter(t => t.projectId === focusTargetId);
    }
    if (focusType === 'task') {
      return tasks.filter(t => t.id === focusTargetId);
    }
    if (focusType === 'personal') {
      // مهام شخصية — نعرض personalTasks كـ display فقط
      return [];
    }
    if (focusType === 'finance') {
      // مهام مالية — بحث في العنوان
      return tasks.filter(t => /مال|حساب|فاتور|دفع|راتب|ضريب/i.test(t.title));
    }
    if (focusType === 'recharge') return [];
    return tasks;
  })();

  const sortedTasks = [...candidateTasks].sort((a, b) =>
    (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9)
  );

  const selectedTask = sortedTasks.find(t => t.id === selectedId) ?? null;

  // ── حالة استراحة ──
  if (focusType === 'recharge') {
    return (
      <div style={{ paddingTop: 12 }}>
        <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(26,188,156,0.06)', border: '1px solid rgba(26,188,156,0.2)', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🌿</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1abc9c', marginBottom: 4 }}>يوم استراحة</div>
          <div style={{ fontSize: 11, color: 'var(--txt3)' }}>لا عمل اليوم — خذ وقتك لتجديد الطاقة</div>
        </div>
      </div>
    );
  }

  // ── حالة شخصي ──
  if (focusType === 'personal') {
    const focusedPersonal = personalTasks.find(p => p.id === focusTargetId);
    const displayPersonal = focusedPersonal ? [focusedPersonal] : personalTasks.slice(0, 5);
    return (
      <div style={{ paddingTop: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 8, padding: '6px 10px', background: 'rgba(139,92,246,0.06)', borderRadius: 8, border: '1px solid rgba(139,92,246,0.15)' }}>
          💡 {tip}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {displayPersonal.map(p => {
            const pColor = PRIORITY_COLORS[p.priority] ?? '#8B5CF6';
            return (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: pColor, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                  <div style={{ fontSize: 9, color: pColor, marginTop: 1 }}>{PRIORITY_LABELS[p.priority]}</div>
                </div>
                <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 10, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6' }}>شخصي</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── لا مهام ──
  if (!sortedTasks.length) {
    return (
      <div style={{ paddingTop: 12 }}>
        <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 10, padding: '6px 10px', background: 'rgba(201,150,59,0.06)', borderRadius: 8, border: '1px solid rgba(201,150,59,0.1)' }}>💡 {tip}</div>
        <p style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', padding: '16px 0' }}>🎉 لا توجد مهام نشطة{focusType ? ` لـ ${todayFocus?.targetName}` : ''}</p>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 12 }}>
      {/* نصيحة اليوم */}
      <div style={{ fontSize: 10, color: 'var(--txt3)', marginBottom: 10, padding: '6px 10px', background: 'rgba(201,150,59,0.06)', borderRadius: 8, border: '1px solid rgba(201,150,59,0.1)' }}>💡 {tip}</div>

      {/* قائمة المهام */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sortedTasks.map(t => {
          const isSelected = selectedId === t.id;
          const pColor = PRIORITY_COLORS[t.priority] ?? '#888';
          const currentStatus = localStatus[t.id] ?? t.status;
          const completedSubs = t.subtasks.filter(s => localSubtasks[s.id] !== undefined ? localSubtasks[s.id] : s.completed).length;
          const totalSubs = t.subtasks.length;
          const progressPct = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : (currentStatus === 'done' ? 100 : 0);
          const barColor = isOverdue(t.dueDate) ? '#e74c3c' : currentStatus === 'in_progress' ? 'var(--gold)' : pColor;
          const overdue = isOverdue(t.dueDate);

          return (
            <div key={t.id}
              style={{ borderRadius: 12, border: isSelected ? `1.5px solid ${pColor}` : '1px solid rgba(255,255,255,0.07)', background: isSelected ? `${pColor}08` : 'rgba(255,255,255,0.02)', transition: 'all 0.2s', overflow: 'hidden' }}
            >
              {/* ── صف المهمة ── */}
              <div
                onClick={() => setSelectedId(isSelected ? null : t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer' }}
              >
                {/* نقطة الأولوية */}
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: pColor, flexShrink: 0 }} />

                {/* المحتوى */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--txt)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: isSelected ? 600 : 400 }}>{t.title}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    {t.brandName && <span style={{ fontSize: 9, color: t.brandColor ?? 'var(--txt3)' }}>{t.brandName}</span>}
                    {t.dueDate && (
                      <span style={{ fontSize: 9, color: overdue ? '#e74c3c' : 'var(--txt3)' }}>
                        {overdue ? '⚠ ' : ''}{
                          new Date(t.dueDate).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })
                        }
                      </span>
                    )}
                    <span style={{ fontSize: 9, color: currentStatus === 'blocked' ? '#e74c3c' : currentStatus === 'in_progress' ? 'var(--gold)' : 'var(--txt3)' }}>
                      {STATUS_LABELS[currentStatus] ?? currentStatus}
                    </span>
                    {totalSubs > 0 && <span style={{ fontSize: 9, color: 'var(--txt3)' }}>{completedSubs}/{totalSubs}</span>}
                  </div>
                </div>

                {/* شريط التقدم */}
                <div style={{ width: 44, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                  <span style={{ fontSize: 8, color: 'var(--txt3)' }}>{progressPct}%</span>
                  <div style={{ width: 44, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                    <div style={{ width: `${progressPct}%`, height: '100%', background: barColor, borderRadius: 3, transition: 'width 0.3s' }} />
                  </div>
                </div>
              </div>

              {/* ── العرض الموسّع ── */}
              {isSelected && (
                <div style={{ padding: '0 12px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  {/* شارات الرأس */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, marginTop: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: `${pColor}20`, color: pColor, border: `1px solid ${pColor}40` }}>
                      {PRIORITY_LABELS[t.priority]}
                    </span>
                    {t.projectId && (
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: 'rgba(52,152,219,0.1)', color: '#3498db', border: '1px solid rgba(52,152,219,0.3)' }}>📁 مشروع</span>
                    )}
                    {t.hasDescription && (
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: 'rgba(255,255,255,0.05)', color: 'var(--txt3)', border: '1px solid rgba(255,255,255,0.1)' }}>📝 وصف</span>
                    )}
                    {overdue && (
                      <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 10, background: 'rgba(231,76,60,0.1)', color: '#e74c3c', border: '1px solid rgba(231,76,60,0.3)' }}>⚠ متأخرة</span>
                    )}
                  </div>

                  {/* شريط تقدم موسّع */}
                  {totalSubs > 0 && (
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 9, color: 'var(--txt3)' }}>الخطوة التالية</span>
                        <span style={{ fontSize: 9, color: barColor, fontWeight: 600 }}>{progressPct}% — {completedSubs}/{totalSubs}</span>
                      </div>
                      <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4 }}>
                        <div style={{ width: `${progressPct}%`, height: '100%', background: barColor, borderRadius: 4, transition: 'width 0.3s' }} />
                      </div>
                    </div>
                  )}

                  {/* المهام الفرعية — أول 4 */}
                  {t.subtasks.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                      {t.subtasks.slice(0, 4).map(s => {
                        const checked = localSubtasks[s.id] !== undefined ? localSubtasks[s.id] : s.completed;
                        return (
                          <div key={s.id}
                            onClick={e => { e.stopPropagation(); setLocalSubtasks(prev => ({ ...prev, [s.id]: !checked })); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 7, cursor: 'pointer', background: checked ? 'rgba(46,204,113,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${checked ? 'rgba(46,204,113,0.15)' : 'rgba(255,255,255,0.06)'}` }}
                          >
                            <div style={{ width: 13, height: 13, borderRadius: 3, border: `1.5px solid ${checked ? '#2ecc71' : 'rgba(255,255,255,0.2)'}`, background: checked ? '#2ecc71' : 'transparent', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {checked && <span style={{ fontSize: 9, color: '#05070d', fontWeight: 700 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: 11, color: checked ? 'var(--txt3)' : 'var(--txt)', textDecoration: checked ? 'line-through' : 'none', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                            <span style={{ fontSize: 8, color: 'var(--txt3)', flexShrink: 0 }}>قائمة</span>
                          </div>
                        );
                      })}
                      {t.subtasks.length > 4 && (
                        <span style={{ fontSize: 10, color: 'var(--txt3)', paddingRight: 8 }}>+ {t.subtasks.length - 4} أخرى...</span>
                      )}
                    </div>
                  )}

                  {/* اختيار الحالة */}
                  <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: 'var(--txt3)' }}>الحالة:</span>
                    {(['todo', 'in_progress', 'blocked'] as const).map(s => (
                      <button key={s} onClick={e => { e.stopPropagation(); setLocalStatus(prev => ({ ...prev, [t.id]: s })); }}
                        style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit', border: (localStatus[t.id] ?? t.status) === s ? `1px solid ${s === 'blocked' ? '#e74c3c' : s === 'in_progress' ? 'var(--gold)' : 'rgba(255,255,255,0.3)'}` : '1px solid rgba(255,255,255,0.08)', background: (localStatus[t.id] ?? t.status) === s ? (s === 'blocked' ? 'rgba(231,76,60,0.1)' : s === 'in_progress' ? 'rgba(201,150,59,0.1)' : 'rgba(255,255,255,0.05)') : 'transparent', color: (localStatus[t.id] ?? t.status) === s ? (s === 'blocked' ? '#e74c3c' : s === 'in_progress' ? 'var(--gold)' : 'var(--txt)') : 'var(--txt3)' }}>
                        {STATUS_LABELS[s]}
                      </button>
                    ))}
                  </div>

                  {/* أزرار الإجراءات السريعة */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      onClick={e => { e.stopPropagation(); setLocalStatus(prev => ({ ...prev, [t.id]: 'done' })); setSelectedId(null); }}
                      style={{ fontSize: 10, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid rgba(46,204,113,0.3)', background: 'rgba(46,204,113,0.08)', color: '#2ecc71' }}
                    >✓ خلصت</button>
                    <button
                      onClick={e => { e.stopPropagation(); setLocalStatus(prev => ({ ...prev, [t.id]: 'blocked' })); }}
                      style={{ fontSize: 10, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid rgba(231,76,60,0.3)', background: 'rgba(231,76,60,0.08)', color: '#e74c3c' }}
                    >⚡ عالق</button>
                    <button
                      onClick={e => { e.stopPropagation(); setSelectedId(null); }}
                      style={{ fontSize: 10, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--txt3)' }}
                    >⏰ بعدين</button>
                    <button
                      onClick={e => { e.stopPropagation(); const others = sortedTasks.filter(x => x.id !== t.id); if (others.length) setSelectedId(others[0].id); }}
                      style={{ fontSize: 10, padding: '5px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--txt3)' }}
                    >🔄 تغيير</button>
                    <div style={{ flex: 1 }} />
                    <Link href={`/tasks/${t.id}`}
                      onClick={e => e.stopPropagation()}
                      style={{ fontSize: 10, padding: '5px 10px', borderRadius: 8, border: `1px solid ${pColor}40`, background: `${pColor}10`, color: pColor, textDecoration: 'none', display: 'inline-block' }}
                    >فتح التفاصيل ←</Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Daily Fixed Tasks (يومي ثابت) ───────────────────────────────────────────
function DailyFixed({ initialTasks }: { initialTasks: string[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const [newTask, setNewTask] = useState('');

  function toggle(i: number) {
    setChecked(prev => { const n = new Set(prev); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  }

  function addTask() {
    const val = newTask.trim();
    if (!val) return;
    setTasks(prev => [...prev, val]);
    setNewTask('');
  }

  function removeTask(i: number) {
    setTasks(prev => prev.filter((_, idx) => idx !== i));
    setChecked(prev => { const n = new Set(prev); n.delete(i); return n; });
  }

  if (!tasks.length && !newTask) {
    return (
      <div style={{ paddingTop: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 8 }}>لا توجد مهام ثابتة بعد</p>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="+ مهمة ثابتة جديدة..." className="input" style={{ flex: 1, fontSize: 12, padding: '7px 10px' }} />
          <button onClick={addTask} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,var(--gold),#8B6914)', color: '#05070d', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
        {tasks.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: checked.has(i) ? 'rgba(46,204,113,0.04)' : 'transparent' }}>
            <div onClick={() => toggle(i)} style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${checked.has(i) ? '#2ecc71' : 'rgba(255,255,255,0.2)'}`, background: checked.has(i) ? '#2ecc71' : 'transparent', flexShrink: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {checked.has(i) && <span style={{ fontSize: 9, color: '#05070d', fontWeight: 700 }}>✓</span>}
            </div>
            <span style={{ flex: 1, fontSize: 12, color: checked.has(i) ? 'var(--txt3)' : 'var(--txt)', textDecoration: checked.has(i) ? 'line-through' : 'none' }}>{t}</span>
            <button onClick={() => removeTask(i)} style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 13, padding: '0 2px', opacity: 0.5 }}>✕</button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={newTask} onChange={e => setNewTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="+ مهمة ثابتة جديدة..." className="input" style={{ flex: 1, fontSize: 12, padding: '7px 10px' }} />
        <button onClick={addTask} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,var(--gold),#8B6914)', color: '#05070d', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>+</button>
      </div>
    </div>
  );
}

// ─── Decisions Panel (قرارات معلقة) ──────────────────────────────────────────
function DecisionsPanel({ decisions }: { decisions: DecisionRow[] }) {
  const pending = decisions.filter(d => d.status === 'open');
  const now = Date.now();
  if (!pending.length) {
    return <p style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', padding: '16px 0' }}>✅ كل القرارات محسومة!</p>;
  }
  return (
    <div style={{ paddingTop: 8 }}>
      {pending.slice(0, 5).map(d => {
        const impactColor = { critical: '#e74c3c', high: '#f39c12', medium: '#3498db', low: '#2ecc71' }[d.impact] || 'var(--txt3)';
        const daysOverdue = d.deadline ? Math.floor((now - new Date(d.deadline).getTime()) / 86400000) : 0;
        return (
          <Link key={d.id} href="/decisions" style={{ display: 'block', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--txt)', marginBottom: 3 }}>{d.title}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, color: impactColor, fontWeight: 600 }}>{DECISION_IMPACT_LABELS[d.impact]}</span>
              {daysOverdue > 0 && <span style={{ fontSize: 10, color: '#e74c3c' }}>متأخر {daysOverdue} يوم</span>}
            </div>
          </Link>
        );
      })}
      {pending.length > 5 && (
        <Link href="/decisions" style={{ display: 'block', textAlign: 'center', padding: '8px 0', fontSize: 11, color: 'var(--txt3)', textDecoration: 'none' }}>+ {pending.length - 5} قرار آخر</Link>
      )}
    </div>
  );
}

// ─── Calendar Panel ───────────────────────────────────────────────────────────
function CalendarPanel({ events }: { events: UpcomingEvent[] }) {
  if (!events.length) {
    return <p style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', padding: '16px 0' }}>لا توجد أحداث قادمة</p>;
  }
  return (
    <div style={{ paddingTop: 8 }}>
      {events.map(e => (
        <Link key={e.id} href="/calendar" style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', textDecoration: 'none', alignItems: 'center' }}>
          <div style={{ minWidth: 28, textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--gold)' }}>{e.day}</div>
            <div style={{ fontSize: 9, color: 'var(--txt3)' }}>{MONTH_NAMES[e.month - 1]}</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--txt)' }}>{e.title}</div>
            {e.brandName && <span style={{ fontSize: 10, color: e.brandColor ?? 'var(--txt3)' }}>{e.brandName}</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}

// ─── Inbox Panel ──────────────────────────────────────────────────────────────
function InboxPanel({ initialTasks }: { initialTasks: InboxTask[] }) {
  const [tasks, setTasks] = useState<InboxTask[]>(initialTasks);
  const [newText, setNewText] = useState('');
  const [isPending, startTransition] = useTransition();
  const now = Date.now();
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

  function handleAdd() {
    const text = newText.trim();
    if (!text) return;
    startTransition(async () => {
      const result = await addInboxTask(text);
      if (result.task) { setTasks(prev => [result.task!, ...prev]); setNewText(''); }
    });
  }

  function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    startTransition(async () => { await deleteInboxTask(id); });
  }

  const staleCount = tasks.filter(t => (now - new Date(t.created_at).getTime()) > THREE_DAYS).length;

  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input value={newText} onChange={e => setNewText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} placeholder="اكتب فكرة سريعة واضغط Enter..." className="input" style={{ flex: 1, fontSize: 12, padding: '7px 10px' }} />
        <button onClick={handleAdd} disabled={isPending} style={{ padding: '7px 12px', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,var(--gold),#8B6914)', color: '#05070d', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: isPending ? 0.6 : 1 }}>+ أضف</button>
      </div>
      {tasks.length === 0 ? (
        <p style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', padding: '8px 0' }}>📭 الصندوق فارغ</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tasks.map(t => {
            const isStale = (now - new Date(t.created_at).getTime()) > THREE_DAYS;
            const daysAgo = Math.floor((now - new Date(t.created_at).getTime()) / (1000 * 60 * 60 * 24));
            return (
              <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 8px', borderRadius: 8, background: isStale ? 'rgba(243,156,18,0.04)' : 'rgba(255,255,255,0.02)', border: `1px solid ${isStale ? 'rgba(243,156,18,0.15)' : 'rgba(255,255,255,0.04)'}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: 'var(--txt)' }}>{t.text}</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 2 }}>
                    {daysAgo === 0 ? 'اليوم' : daysAgo === 1 ? 'أمس' : `${daysAgo} أيام`}
                    {isStale && <span style={{ color: '#f39c12', marginRight: 6 }}>⏰ تحتاج تصنيف</span>}
                  </div>
                </div>
                <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 14, padding: '0 2px', flexShrink: 0 }}>×</button>
              </div>
            );
          })}
          {staleCount > 0 && <div style={{ fontSize: 10, color: '#f39c12', textAlign: 'center', padding: '4px 0' }}>⏰ {staleCount} مهمة تنتظر التصنيف أكثر من ٣ أيام</div>}
        </div>
      )}
    </div>
  );
}

// ─── Decision Form ─────────────────────────────────────────────────────────
interface DecisionFormData {
  title: string; brandId: string; impact: string; status: string; context: string; deadline: string; notes: string;
}
const emptyDecision: DecisionFormData = { title: '', brandId: '', impact: 'medium', status: 'open', context: '', deadline: '', notes: '' };

// ─── Employee Form ─────────────────────────────────────────────────────────
interface EmployeeFormData {
  name: string; role: string; brandIds: string[]; salaryType: string; salaryAmount: number; salaryUnit: string; status: string;
}
const emptyEmployee: EmployeeFormData = { name: '', role: '', brandIds: [], salaryType: 'fixed', salaryAmount: 0, salaryUnit: '', status: 'active' };

// ─── Main Component ────────────────────────────────────────────────────────
export default function LeadershipClient({
  decisions: initialDecisions,
  employees: initialEmployees,
  brands,
  inboxTasks,
  weeklyFocus: initialFocus,
  todaySales,
  upcomingEvents,
  activeTasks,
  dailyTasks,
  projects,
  personalTasks,
}: Props) {
  const pathname = usePathname();
  const [decisions, setDecisions] = useState<DecisionRow[]>(initialDecisions);
  const [employees, setEmployees] = useState<EmployeeRow[]>(initialEmployees);
  const [weeklyFocus, setWeeklyFocus] = useState<WeeklyFocusEntry[]>(initialFocus);
  const [isPending, startTransition] = useTransition();
  const [tab, setTab] = useState<'decisions' | 'employees'>('decisions');
  const [showDecForm, setShowDecForm] = useState(false);
  const [editingDecId, setEditingDecId] = useState<string | null>(null);
  const [decForm, setDecForm] = useState<DecisionFormData>(emptyDecision);
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState<EmployeeFormData>(emptyEmployee);
  const [searchQuery, setSearchQuery] = useState('');

  // Today's focus
  const today = todayISO();
  const todayFocus = weeklyFocus.find(e => e.focusDate === today);

  // Nav items
  const NAV_ITEMS = [
    { id: 'leadership', label: 'القيادة', href: '/leadership', emoji: '⚙️' },
    { id: 'brands', label: 'البراندات', href: '/brands', emoji: '🏷' },
    { id: 'personal', label: 'الشخصي', href: '/personal', emoji: '👤' },
    { id: 'worlds', label: 'عوالمي', href: '/weekly-focus', emoji: '🌐' },
    { id: 'accounts', label: 'حسابات', href: '/accounts', emoji: '💰' },
  ];

  // ─── Decision CRUD ──────────────────────────────────────────────────────────
  function startAddDecision() { setDecForm(emptyDecision); setEditingDecId(null); setShowDecForm(true); }
  function startEditDecision(d: DecisionRow) {
    setDecForm({ title: d.title, brandId: d.brand_id ?? '', impact: d.impact, status: d.status, context: d.context ?? '', deadline: d.deadline ?? '', notes: d.notes ?? '' });
    setEditingDecId(d.id); setShowDecForm(true);
  }
  function handleSaveDecision() {
    if (!decForm.title.trim()) return;
    startTransition(async () => {
      if (editingDecId) {
        await updateDecision(editingDecId, decForm);
        setDecisions(prev => prev.map(d => d.id === editingDecId ? { ...d, ...decForm, brand_id: decForm.brandId || null, deadline: decForm.deadline || null, context: decForm.context || null, notes: decForm.notes || null } as DecisionRow : d));
      } else {
        await addDecision(decForm);
        const newD: DecisionRow = { id: `d${Date.now()}`, title: decForm.title, brand_id: decForm.brandId || null, project_id: null, impact: decForm.impact as DecisionRow['impact'], status: decForm.status as DecisionRow['status'], context: decForm.context || null, options: [], chosen_option_id: null, deadline: decForm.deadline || null, decided_at: null, decided_by: null, notes: decForm.notes || null, updated_at: new Date().toISOString() };
        setDecisions(prev => [newD, ...prev]);
      }
      setShowDecForm(false);
    });
  }
  function handleDeleteDecision(id: string) {
    if (!confirm('حذف هذا القرار؟')) return;
    startTransition(async () => { await deleteDecision(id); setDecisions(prev => prev.filter(d => d.id !== id)); });
  }

  // ─── Employee CRUD ──────────────────────────────────────────────────────────
  function startAddEmployee() { setEmpForm(emptyEmployee); setEditingEmpId(null); setShowEmpForm(true); }
  function startEditEmployee(e: EmployeeRow) {
    setEmpForm({ name: e.name, role: e.role, brandIds: e.brand_ids ?? [], salaryType: e.salary_type, salaryAmount: e.salary_amount, salaryUnit: e.salary_unit ?? '', status: e.status });
    setEditingEmpId(e.id); setShowEmpForm(true);
  }
  function handleSaveEmployee() {
    if (!empForm.name.trim()) return;
    startTransition(async () => {
      if (editingEmpId) {
        await updateEmployee(editingEmpId, empForm);
        setEmployees(prev => prev.map(e => e.id === editingEmpId ? { ...e, name: empForm.name, role: empForm.role, brand_ids: empForm.brandIds, salary_type: empForm.salaryType as EmployeeRow['salary_type'], salary_amount: empForm.salaryAmount, salary_unit: empForm.salaryUnit || null, status: empForm.status as EmployeeRow['status'] } : e));
      } else {
        await addEmployee(empForm);
        const newE: EmployeeRow = { id: `emp${Date.now()}`, name: empForm.name, role: empForm.role, brand_ids: empForm.brandIds, salary_type: empForm.salaryType as EmployeeRow['salary_type'], salary_amount: empForm.salaryAmount, salary_unit: empForm.salaryUnit || null, reports_to: null, status: empForm.status as EmployeeRow['status'], created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        setEmployees(prev => [...prev, newE]);
      }
      setShowEmpForm(false);
    });
  }
  function handleDeleteEmployee(id: string) {
    if (!confirm('حذف هذا الموظف؟')) return;
    startTransition(async () => { await deleteEmployee(id); setEmployees(prev => prev.filter(e => e.id !== id)); });
  }

  const filteredDecisions = decisions.filter(d => !searchQuery || d.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredEmployees = employees.filter(e => !searchQuery || e.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const pendingDecisions = decisions.filter(d => d.status === 'open');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── 1. الشريط العلوي ── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(5,7,13,0.96)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(201,150,59,0.12)', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, direction: 'rtl', flexShrink: 0 }}>
        {/* Search */}
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--txt3)', fontSize: 13 }}>🔍</span>
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث في القرارات والموظفين..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '7px 32px 7px 10px', color: 'var(--txt)', fontFamily: 'inherit', fontSize: 12, outline: 'none', direction: 'rtl' }}
          />
        </div>
        {/* Add button */}
        <button
          onClick={tab === 'decisions' ? startAddDecision : startAddEmployee}
          style={{ padding: '7px 14px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,var(--gold),#8B6914)', color: '#05070d', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}
        >
          + {tab === 'decisions' ? 'قرار' : 'موظف'}
        </button>
        {/* Today's sales */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(46,204,113,0.08)', borderRadius: 8, border: '1px solid rgba(46,204,113,0.2)', flexShrink: 0 }}>
          <span style={{ fontSize: 11 }}>📈</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2ecc71' }}>{fmt(todaySales)} ر.س</span>
        </div>
        {/* Today's focus */}
        {todayFocus && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px', background: 'rgba(201,150,59,0.06)', borderRadius: 8, border: '1px solid rgba(201,150,59,0.15)', flexShrink: 0, maxWidth: 160 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: todayFocus.targetColor, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--txt2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{todayFocus.targetName}</span>
          </div>
        )}
      </div>

      {/* ── Main Scrollable Content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', direction: 'rtl' }}>

        {/* ── 2. بوصلة الأسبوع ── */}
        <CollapsibleSection id="compass" icon="🧭" title="بوصلة الأسبوع" defaultOpen={true}>
          <WeekCompass weeklyFocus={weeklyFocus} brands={brands} activeTasks={activeTasks} todaySales={todaySales} onFocusChange={setWeeklyFocus} projects={projects} personalTasks={personalTasks} />
        </CollapsibleSection>

        {/* ── 3. الشيء الواحد الآن ── */}
        <CollapsibleSection id="focus" icon="🎯" title="الشيء الواحد الآن" badge={activeTasks.length} defaultOpen={true}>
          <FocusNow tasks={activeTasks} todayFocus={todayFocus ?? null} projects={projects} personalTasks={personalTasks} />
        </CollapsibleSection>

        {/* ── Row: يومي ثابت + قرارات معلقة ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* ── 4. يومي ثابت ── */}
          <CollapsibleSection id="daily" icon="⚡" title="يومي ثابت" defaultOpen={false}>
            <DailyFixed initialTasks={dailyTasks} />
          </CollapsibleSection>

          {/* ── 5. قرارات معلقة ── */}
          <CollapsibleSection id="decisions-panel" icon="⚖️" title="قرارات معلقة" badge={pendingDecisions.length} defaultOpen={false}>
            <DecisionsPanel decisions={decisions} />
          </CollapsibleSection>
        </div>

        {/* ── Row: التقويم + صندوق الوارد ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* ── 6. التقويم ── */}
          <CollapsibleSection id="calendar" icon="📅" title="التقويم" badge={upcomingEvents.length} defaultOpen={false}>
            <CalendarPanel events={upcomingEvents} />
          </CollapsibleSection>

          {/* ── 7. صندوق الوارد ── */}
          <CollapsibleSection id="inbox" icon="📥" title="صندوق الوارد" badge={inboxTasks.length} defaultOpen={false}>
            <InboxPanel initialTasks={inboxTasks} />
          </CollapsibleSection>
        </div>

        {/* ── Tabs: القرارات والموظفون ── */}
        <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.018)', border: '1px solid rgba(201,150,59,0.12)', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {(['decisions', 'employees'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ flex: 1, padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: tab === t ? 600 : 400, color: tab === t ? 'var(--gold)' : 'var(--txt3)', borderBottom: tab === t ? '2px solid var(--gold)' : '2px solid transparent', transition: 'all 0.2s' }}>
                {t === 'decisions' ? `⚖️ القرارات (${decisions.length})` : `👥 الفريق (${employees.length})`}
              </button>
            ))}
          </div>

          <div style={{ padding: 16 }}>
            {/* Decisions Tab */}
            {tab === 'decisions' && (
              <>
                {showDecForm && (
                  <div style={{ background: 'rgba(201,150,59,0.04)', border: '1px solid rgba(201,150,59,0.15)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <input className="input" placeholder="عنوان القرار *" value={decForm.title} onChange={e => setDecForm(p => ({ ...p, title: e.target.value }))} />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <select className="input" value={decForm.impact} onChange={e => setDecForm(p => ({ ...p, impact: e.target.value }))}>
                        <option value="critical">حرج</option><option value="high">عالي</option><option value="medium">متوسط</option><option value="low">منخفض</option>
                      </select>
                      <select className="input" value={decForm.status} onChange={e => setDecForm(p => ({ ...p, status: e.target.value }))}>
                        <option value="open">مفتوح</option><option value="decided">تم القرار</option><option value="archived">مؤرشف</option>
                      </select>
                    </div>
                    <select className="input" value={decForm.brandId} onChange={e => setDecForm(p => ({ ...p, brandId: e.target.value }))}>
                      <option value="">بدون براند</option>
                      {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    <input className="input" type="date" value={decForm.deadline} onChange={e => setDecForm(p => ({ ...p, deadline: e.target.value }))} />
                    <textarea className="input" placeholder="السياق والملاحظات" value={decForm.context} onChange={e => setDecForm(p => ({ ...p, context: e.target.value }))} style={{ height: 60, resize: 'none' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleSaveDecision} disabled={isPending} className="btn btn-gold btn-sm">{isPending ? 'جارٍ...' : editingDecId ? 'حفظ التعديل' : 'إضافة'}</button>
                      <button onClick={() => setShowDecForm(false)} className="btn btn-ghost btn-sm">إلغاء</button>
                    </div>
                  </div>
                )}
                {filteredDecisions.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', padding: '20px 0' }}>لا توجد قرارات</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filteredDecisions.map(d => {
                      const impactColor = { critical: '#e74c3c', high: '#f39c12', medium: '#3498db', low: '#2ecc71' }[d.impact] || 'var(--txt3)';
                      const statusColor = { open: '#f39c12', decided: '#2ecc71', archived: 'var(--txt3)' }[d.status] || 'var(--txt3)';
                      return (
                        <div key={d.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)', marginBottom: 4 }}>{d.title}</div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              <span style={{ fontSize: 10, color: impactColor, fontWeight: 600 }}>{DECISION_IMPACT_LABELS[d.impact]}</span>
                              <span style={{ fontSize: 10, color: statusColor }}>{DECISION_STATUS_LABELS[d.status]}</span>
                              {d.deadline && <span style={{ fontSize: 10, color: 'var(--txt3)' }}>📅 {d.deadline}</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => startEditDecision(d)} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}>✏️</button>
                            <button onClick={() => handleDeleteDecision(d.id)} style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}>🗑</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* Employees Tab */}
            {tab === 'employees' && (
              <>
                {showEmpForm && (
                  <div style={{ background: 'rgba(201,150,59,0.04)', border: '1px solid rgba(201,150,59,0.15)', borderRadius: 12, padding: 16, marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <input className="input" placeholder="الاسم *" value={empForm.name} onChange={e => setEmpForm(p => ({ ...p, name: e.target.value }))} />
                      <input className="input" placeholder="المنصب" value={empForm.role} onChange={e => setEmpForm(p => ({ ...p, role: e.target.value }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <select className="input" value={empForm.salaryType} onChange={e => setEmpForm(p => ({ ...p, salaryType: e.target.value }))}>
                        <option value="fixed">راتب ثابت</option><option value="per_unit">بالقطعة</option><option value="commission">عمولة</option><option value="volunteer">متطوع</option>
                      </select>
                      <input className="input" type="number" placeholder="المبلغ" value={empForm.salaryAmount || ''} onChange={e => setEmpForm(p => ({ ...p, salaryAmount: Number(e.target.value) }))} />
                    </div>
                    <select className="input" value={empForm.status} onChange={e => setEmpForm(p => ({ ...p, status: e.target.value }))}>
                      <option value="active">نشط</option><option value="inactive">غير نشط</option><option value="on_leave">إجازة</option>
                    </select>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={handleSaveEmployee} disabled={isPending} className="btn btn-gold btn-sm">{isPending ? 'جارٍ...' : editingEmpId ? 'حفظ التعديل' : 'إضافة'}</button>
                      <button onClick={() => setShowEmpForm(false)} className="btn btn-ghost btn-sm">إلغاء</button>
                    </div>
                  </div>
                )}
                {filteredEmployees.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--txt3)', textAlign: 'center', padding: '20px 0' }}>لا يوجد موظفون</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {filteredEmployees.map(e => {
                      const statusColor = { active: '#2ecc71', inactive: 'var(--txt3)', on_leave: '#f39c12' }[e.status] || 'var(--txt3)';
                      return (
                        <div key={e.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(201,150,59,0.1)', border: '1px solid rgba(201,150,59,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>
                            {e.name.charAt(0)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{e.name}</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                              <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{e.role}</span>
                              <span style={{ fontSize: 10, color: statusColor, fontWeight: 600 }}>● {e.status === 'active' ? 'نشط' : e.status === 'inactive' ? 'غير نشط' : 'إجازة'}</span>
                              {e.salary_amount > 0 && <span style={{ fontSize: 10, color: 'var(--gold)' }}>{fmt(e.salary_amount)} ر.س</span>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                            <button onClick={() => startEditEmployee(e)} style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}>✏️</button>
                            <button onClick={() => handleDeleteEmployee(e.id)} style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 13, padding: '2px 4px' }}>🗑</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Bottom padding for nav bar */}
        <div style={{ height: 80 }} />
      </div>

      {/* ── 8. الشريط السفلي ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(5,7,13,0.97)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(201,150,59,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '8px 0 calc(8px + env(safe-area-inset-bottom))', direction: 'rtl' }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.href === '/leadership' ? (pathname ?? '').startsWith('/leadership') : (pathname ?? '').startsWith(item.href);
          return (
            <Link key={item.id} href={item.href}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '4px 12px', borderRadius: 10, textDecoration: 'none', transition: 'all 0.2s', background: isActive ? 'rgba(201,150,59,0.1)' : 'transparent' }}>
              <span style={{ fontSize: 18 }}>{item.emoji}</span>
              <span style={{ fontSize: 10, fontWeight: isActive ? 600 : 400, color: isActive ? 'var(--gold)' : 'var(--txt3)' }}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
