'use client';
// BrandDetailClient — تفاصيل البراند
// @hello-pangea/dnd للـ Drag & Drop + TaskPanel + AddTaskModal
import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import type { BrandRow } from '@/lib/brands-types';
import type { Task, TaskStatus, TaskPriority, TaskType } from '@/lib/tasks-actions';
import { addTask, updateTask, deleteTask, archiveTask, restoreTask } from '@/lib/tasks-actions';
import type { ProjectRow } from '@/lib/projects-types';
import { updateBrand, deleteBrand } from '@/lib/brands-actions';
import TaskPanel from './TaskPanel';
import AddTaskModal from './AddTaskModal';
import { useGlobal } from '@/components/GlobalProviders';

// ─── Constants ────────────────────────────────────────────────────────────────
const KANBAN_COLS: { id: TaskStatus; name: string; color: string }[] = [
  { id: 'ideas',       name: '💡 أفكار',      color: '#8B5CF6' },
  { id: 'todo',        name: '📝 قيد الانتظار', color: '#3B82F6' },
  { id: 'in_progress', name: '🚀 جاري التنفيذ', color: '#C9A84C' },
  { id: 'done',        name: '✅ مكتمل',       color: '#10B981' },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: '#EF4444',
  high:     '#F97316',
  medium:   '#3B82F6',
  low:      '#10B981',
};

const STATUS_BADGE: Record<string, string> = {
  active:   'badge-ok',
  paused:   'badge-wrn',
  archived: 'badge-dim',
};
const STATUS_LABEL: Record<string, string> = {
  active:   'نشط',
  paused:   'متوقف',
  archived: 'مؤرشف',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysLeft(dueDate: string | null): number {
  if (!dueDate) return 999;
  return Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
}
function daysLeftLabel(dueDate: string | null): string {
  if (!dueDate) return '';
  const d = daysLeft(dueDate);
  if (d < 0) return `متأخر ${Math.abs(d)} يوم`;
  if (d === 0) return 'اليوم';
  if (d === 1) return 'غداً';
  return `${d} يوم`;
}
function isOverdue(t: Task): boolean {
  return !!t.dueDate && daysLeft(t.dueDate) < 0 && t.status !== 'done';
}

// ─── Dhikrni Mission Control ──────────────────────────────────────────────────
interface DhikrniProps { brand: BrandRow; tasks: Task[]; projects: ProjectRow[]; }
function DhikrniMissionControl({ brand, tasks, projects }: DhikrniProps) {
  const totalTasks   = tasks.length;
  const doneTasks    = tasks.filter((t) => t.status === 'done').length;
  const activeTasks  = tasks.filter((t) => t.status === 'in_progress').length;
  const overdueTasks = tasks.filter(isOverdue).length;
  const health = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div style={{ padding: 32, background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', minHeight: '100%', color: '#fff', direction: 'rtl' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, #C9A84C, #e6c76a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, boxShadow: '0 8px 24px rgba(201,168,76,0.4)' }}>
          {brand.icon || '🔔'}
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px' }}>{brand.name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Mission Control Center</div>
        </div>
        <div style={{ marginRight: 'auto' }}>
          <span style={{ background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)', color: '#C9A84C', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700 }}>
            Apple Wallet App
          </span>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'إجمالي المهام', value: totalTasks, icon: '📋', color: '#3B82F6' },
          { label: 'جاري التنفيذ',  value: activeTasks, icon: '⚡', color: '#C9A84C' },
          { label: 'منجزة',         value: doneTasks,   icon: '✅', color: '#10B981' },
          { label: 'متأخرة',        value: overdueTasks, icon: '⚠️', color: '#EF4444' },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: '20px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{kpi.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>صحة المشروع</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: health >= 70 ? '#10B981' : health >= 40 ? '#C9A84C' : '#EF4444' }}>{health}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 4, background: health >= 70 ? '#10B981' : health >= 40 ? '#C9A84C' : '#EF4444', width: `${health}%`, transition: 'width 0.5s ease' }} />
        </div>
      </div>
      {projects.length > 0 && (
        <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: '20px 24px', marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>المشاريع</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projects.map((proj) => {
              const projTasks = tasks.filter((t) => t.projectId === proj.id);
              const projDone = projTasks.filter((t) => t.status === 'done').length;
              const projHealth = projTasks.length > 0 ? Math.round((projDone / projTasks.length) * 100) : 0;
              return (
                <div key={proj.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{proj.title}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{projDone}/{projTasks.length} مهمة</div>
                  </div>
                  <div style={{ width: 80, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', background: '#C9A84C', width: `${projHealth}%`, borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, minWidth: 32, textAlign: 'left' }}>{projHealth}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', padding: '20px 24px' }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>المهام الحرجة والعالية</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks.filter((t) => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'done').slice(0, 8).map((task) => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: PRIORITY_COLORS[task.priority] }} />
              <span style={{ flex: 1, fontSize: 12 }}>{task.title}</span>
              {isOverdue(task) && <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700 }}>متأخر</span>}
            </div>
          ))}
          {tasks.filter((t) => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'done').length === 0 && (
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '20px 0' }}>لا توجد مهام حرجة أو عالية الأولوية 🎉</div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Priority Picker ──────────────────────────────────────────────────────────
const PRI_OPTIONS: { v: TaskPriority; lbl: string; color: string }[] = [
  { v: 'critical', lbl: '🔴 حرج',    color: '#EF4444' },
  { v: 'high',     lbl: '🟠 عالي',   color: '#F97316' },
  { v: 'medium',   lbl: '🟡 متوسط',  color: '#3B82F6' },
  { v: 'low',      lbl: '⬇️ منخفض', color: '#10B981' },
];
function PriPicker({ onSelect, onClose }: { onSelect: (p: TaskPriority) => void; onClose: () => void }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} onClick={onClose} />
      <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 4, background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 9998, padding: '4px 0', minWidth: 120 }}>
        {PRI_OPTIONS.map((p) => (
          <button key={p.v} onClick={() => onSelect(p.v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
            {p.lbl}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Quick Add ────────────────────────────────────────────────────────────────
interface QuickAddProps { colId: TaskStatus; brandId: string; projectId: string | null; onAdd: (task: Task) => void; }
function QuickAdd({ colId, brandId, projectId, onAdd }: QuickAddProps) {
  const [isOpen, setIsOpen]   = useState(false);
  const [value, setValue]     = useState('');
  const [showPri, setShowPri] = useState(false);
  const [loading, setLoading] = useState(false);

  // 10-second auto-timeout for priority picker (per user preference)
  useEffect(() => {
    if (!showPri) return;
    const timer = setTimeout(() => {
      handleAdd('low');
    }, 10000);
    return () => clearTimeout(timer);
  }, [showPri]);

  async function handleAdd(priority: TaskPriority) {
    const title = value.trim();
    if (!title) { setIsOpen(false); setValue(''); setShowPri(false); return; }
    setShowPri(false);
    setLoading(true);
    const res = await addTask({ title, status: colId, priority, brandId, projectId: projectId ?? undefined });
    setLoading(false);
    if (res.task) { onAdd(res.task); setValue(''); setIsOpen(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && value.trim()) { e.preventDefault(); setShowPri(true); }
    if (e.key === 'Escape') { setValue(''); setShowPri(false); setIsOpen(false); }
  }

  function handleClose() { setValue(''); setShowPri(false); setIsOpen(false); }

  if (!isOpen) {
    return (
      <button
        className="vip-add-task-btn"
        onClick={() => setIsOpen(true)}
      >
        <span>+</span> إضافة مهمة جديدة
      </button>
    );
  }

  return (
    <div style={{ margin: '0 12px 14px', display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
      <input
        autoFocus
        disabled={loading}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="اكتب اسم المهمة واضغط Enter..."
        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px', border: '2px solid #EA580C', outline: 'none', fontSize: '13px', fontWeight: '600', color: '#0F172A', background: '#FFFFFF', boxShadow: '0 4px 12px rgba(234,88,12,0.1)', boxSizing: 'border-box', fontFamily: 'inherit' }}
      />
      <div style={{ display: 'flex', gap: '8px' }}>
        <button disabled={loading || !value.trim()} onClick={() => { if (value.trim()) setShowPri(true); }} style={{ background: '#EA580C', color: 'white', border: 'none', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', flex: 1, fontFamily: 'inherit' }}>
          {loading ? 'جاري الحفظ...' : 'إضافة (Enter)'}
        </button>
        <button disabled={loading} onClick={handleClose} style={{ background: '#F1F5F9', color: '#64748B', border: 'none', padding: '7px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '800', cursor: 'pointer', flex: 1, fontFamily: 'inherit' }}>إلغاء</button>
      </div>
      {showPri && <PriPicker onSelect={handleAdd} onClose={() => setShowPri(false)} />}
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  project: ProjectRow | undefined;
  index: number;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
}
function TaskCard({ task, project, index, onArchive, onDelete, onClick }: TaskCardProps) {
  const overdue  = isOverdue(task);
  const dueLabel = daysLeftLabel(task.dueDate);
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`vip-task-card${snapshot.isDragging ? ' dragging' : ''}`}
          onClick={() => onClick(task)}
          style={{ ...provided.draggableProps.style, cursor: 'pointer' }}>
          <div className="ptc-actions" onClick={(e) => e.stopPropagation()}>
            <button className="ptc-btn arch" title="أرشفة" onClick={() => onArchive(task.id)}>🗄️</button>
            <button className="ptc-btn del"  title="حذف"   onClick={() => onDelete(task.id)}>🗑️</button>
          </div>
          <h4 className="vip-task-title">{task.title}</h4>
          <div className="vip-card-tags">
            {task.type === 'project' && <span className="vip-tag" style={{ background: '#F3E8FF', color: '#7E22CE', border: '1px solid #E9D5FF', fontWeight: 900 }}>🚀 مشروع</span>}
            {task.type === 'idea' && <span className="vip-tag" style={{ background: '#FFFBEB', color: '#D97706', border: '1px solid #FEF3C7', fontWeight: 900 }}>💡 فكرة</span>}
            {task.priority === 'critical' && <span className="vip-tag" style={{ background: '#FEF2F2', color: '#DC2626' }}>🔴 حرج</span>}
            {task.priority === 'high' && <span className="vip-tag" style={{ background: '#FFF7ED', color: '#EA580C' }}>🟠 عالي</span>}
            {task.priority === 'medium' && <span className="vip-tag" style={{ background: '#EFF6FF', color: '#2563EB' }}>🟡 متوسط</span>}
            {task.priority === 'low' && <span className="vip-tag" style={{ background: '#F0FDF4', color: '#16A34A' }}>⬇️ منخفض</span>}
            {project && <span className="vip-tag">📁 {project.title}</span>}
            {overdue && <span className="vip-tag-overdue">⚠️ متأخر {Math.abs(daysLeft(task.dueDate))} يوم</span>}
            {!overdue && task.dueDate && <span className="vip-tag-due">🗓 {dueLabel}</span>}
            {task.hasDescription && <span className="vip-tag">📝</span>}
          </div>
        </div>
      )}
    </Draggable>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
interface KanbanColProps {
  col: typeof KANBAN_COLS[0];
  tasks: Task[];
  projects: ProjectRow[];
  brandId: string;
  activeProjectId: string | null;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (task: Task) => void;
  onCardClick: (task: Task) => void;
}
function getColEmoji(colId: string): string {
  if (colId === 'todo') return '📥';
  if (colId === 'in_progress') return '🚀';
  if (colId === 'on_hold') return '✋';
  if (colId === 'done') return '✅';
  if (colId === 'ideas') return '💡';
  if (colId === 'projects') return '🚀';
  return '';
}
function KanbanCol({ col, tasks, projects, brandId, activeProjectId, onArchive, onDelete, onAdd, onCardClick }: KanbanColProps) {
  return (
    <div className="vip-kanban-column">
      <div className="vip-column-header">
        <h3 className="vip-column-title">
          <span>{col.name}</span>
        </h3>
        <div className="vip-column-count">{tasks.length}</div>
      </div>
      <Droppable droppableId={col.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`vip-tasks-container${snapshot.isDraggingOver ? ' vip-kanban-drag-over' : ''}`}
            style={{ minHeight: 80 }}>
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                project={projects.find((p) => p.id === task.projectId)}
                index={index}
                onArchive={onArchive}
                onDelete={onDelete}
                onClick={onCardClick}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      <QuickAdd colId={col.id} brandId={brandId} projectId={activeProjectId} onAdd={onAdd} />
    </div>
  );
}

// ─── Stacked Ideas + Projects Column ─────────────────────────────────────────
// ─── Stats Column ─────────────────────────────────────────────────────────────
interface StatsColProps { brand: BrandRow; tasks: Task[]; onBrandUpdate: (b: BrandRow) => void; }
function StatsCol({ brand, tasks, onBrandUpdate }: StatsColProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal]         = useState(brand.name);

  const doneTasks    = tasks.filter((t) => t.status === 'done').length;
  const openTasks    = tasks.filter((t) => t.status !== 'done').length;
  const overdueTasks = tasks.filter(isOverdue);
  const h = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const hColor = h >= 70 ? 'var(--success)' : h >= 40 ? 'var(--warning)' : 'var(--danger)';

  async function saveName() {
    const trimmed = nameVal.trim();
    if (!trimmed || trimmed === brand.name) { setEditingName(false); return; }
    const res = await updateBrand({ id: brand.id, name: trimmed, nameEn: brand.nameEn, color: brand.color, icon: brand.icon, status: brand.status, description: brand.description, productionDays: brand.productionDays });
    if (res.brand) onBrandUpdate(res.brand);
    setEditingName(false);
  }

  return (
    <div className="brand-stats-col">
      <div className="bsc-header">
        <span className="bsc-icon">{brand.icon}</span>
        <div>
          {editingName ? (
            <input value={nameVal} onChange={(e) => setNameVal(e.target.value)} onBlur={saveName}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
              autoFocus style={{ fontSize: 13, fontWeight: 800, background: 'none', border: 'none', borderBottom: '1px solid var(--gold)', outline: 'none', color: 'var(--txt)', fontFamily: 'inherit', width: '100%' }} />
          ) : (
            <div className="bsc-name" onClick={() => setEditingName(true)} title="اضغط لتعديل الاسم"
              style={{ cursor: 'text', borderBottom: '1px dashed transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}>
              {brand.name}
            </div>
          )}
          {brand.description && <div className="bsc-desc">{brand.description}</div>}
        </div>
      </div>
      <span className={`badge ${STATUS_BADGE[brand.status] ?? 'badge-dim'}`} style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
        {STATUS_LABEL[brand.status] ?? brand.status}
      </span>
      <div className="bsc-stat">
        <div className="bsc-val" style={{ color: 'var(--success)' }}>{doneTasks}</div>
        <div className="bsc-lbl">✅ مهام منجزة</div>
      </div>
      <div className="bsc-stat">
        <div className="bsc-val" style={{ color: 'var(--warning)' }}>{openTasks}</div>
        <div className="bsc-lbl">📋 مهام مفتوحة</div>
      </div>
      <div className="bsc-stat">
        <div className="bsc-val" style={{ color: hColor }}>{h}%</div>
        <div className="bsc-lbl">💚 صحة البراند</div>
      </div>
      {overdueTasks.length > 0 && (
        <div className="bsc-alerts">
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>⚠️ متأخرة ({overdueTasks.length})</div>
          {overdueTasks.slice(0, 4).map((t) => <div key={t.id} className="bsc-alert-item">{t.title}</div>)}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { brand: BrandRow; initialTasks: Task[]; initialProjects: ProjectRow[]; }

export default function BrandDetailClient({ brand: initialBrand, initialTasks, initialProjects }: Props) {
  const router = useRouter();
  const { pushUndo } = useGlobal();
  const [brand, setBrand]     = useState<BrandRow>(initialBrand);
  const [tasks, setTasks]     = useState<Task[]>(initialTasks);
  const [projects]            = useState<ProjectRow[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen]               = useState(false);
  const [panelTask, setPanelTask]             = useState<Task | null>(null);
  const [showAddModal, setShowAddModal]       = useState(false);

  // ── Drag & Drop ──
  const onDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStatus = destination.droppableId as TaskStatus;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task || task.status === newStatus) return;
    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === draggableId ? { ...t, status: newStatus } : t));
    await updateTask({ id: draggableId, status: newStatus });
  }, [tasks]);

  // ── Task actions ──
  async function handleArchive(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await archiveTask(task);
  }
  function handleDelete(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    // push undo BEFORE the async delete so the closure captures the right task
    pushUndo({
      label: `حذف "${task.title}"`,
      undo: async () => {
        const res = await restoreTask(task);
        if (!res?.error) setTasks((prev) => [...prev, task]);
      },
    });
    // fire-and-forget delete
    deleteTask(id).catch(() => {});
  }
  function handleAdd(task: Task) { setTasks((prev) => [...prev, task]); }
  function handleUpdate(patch: Partial<Task>) {
    if (!panelTask) return;
    const updated = { ...panelTask, ...patch };
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setPanelTask(updated);
  }

  // ── Brand actions ──
  async function handleDeleteBrand() {
    if (!confirm(`هل تريد حذف براند "${brand.name}" نهائياً؟`)) return;
    await deleteBrand(brand.id);
    router.push('/brands');
  }

  const visibleTasks = activeProjectId ? tasks.filter((t) => t.projectId === activeProjectId) : tasks;

  // Dhikrni Mission Control (b4 only)
  if (brand.id === 'b4') {
    return <DhikrniMissionControl brand={brand} tasks={tasks} projects={projects} />;
  }

  // -- Computed stats for header
  const doneTasks    = tasks.filter((t) => t.status === 'done').length;
  const openTasks    = tasks.filter((t) => t.status !== 'done').length;
  const overdueTasks = tasks.filter(isOverdue).length;
  const healthPct    = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const statusLabel  = STATUS_LABEL[brand.status] ?? brand.status;
  const statusIsActive = brand.status === 'active';

  return (
    <div className="scr on" style={{ padding: '28px 20px 16px', height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

      {/* VIP Horizontal Brand Header */}
      <div className="vip-brand-header">
        <div className="vip-header-brand-info">
          <div className="vip-header-brand-icon">{brand.icon || '🏷️'}</div>
          <div>
            <h2 className="vip-header-brand-name">{brand.name}</h2>
            <span className="vip-header-brand-status" style={statusIsActive ? {} : { background: '#FEF9C3', color: '#854D0E' }}>
              {statusLabel}
            </span>
          </div>
        </div>
        <div className="vip-header-stats">
          <div className="vip-stat-box">
            <span className="vip-stat-box-num" style={{ color: '#22C55E' }}>{doneTasks}</span>
            <span className="vip-stat-box-lbl">مهام منجزة ✅</span>
          </div>
          <div className="vip-stat-box">
            <span className="vip-stat-box-num" style={{ color: '#F59E0B' }}>{openTasks}</span>
            <span className="vip-stat-box-lbl">مهام مفتوحة 📂</span>
          </div>
          <div className="vip-stat-box" style={{ background: '#FFF7ED', borderColor: '#FED7AA' }}>
            <span className="vip-stat-box-lbl" style={{ color: '#C2410C' }}>صحة البراند:</span>
            <span className="vip-stat-box-num" style={{ color: '#EA580C' }}>{healthPct}%</span>
          </div>
          {overdueTasks > 0 && (
            <div className="vip-stat-box" style={{ background: '#FEF2F2', borderColor: '#FECACA' }}>
              <span className="vip-stat-box-lbl" style={{ color: '#991B1B' }}>متأخرة ⚠️</span>
              <span className="vip-stat-box-num" style={{ color: '#DC2626' }}>{overdueTasks}</span>
            </div>
          )}
        </div>
        <div className="vip-header-actions">
          <button className="btn btn-sm" onClick={() => setShowAddModal(true)}>+ مهمة جديدة</button>
        </div>
      </div>

      {/* Nav Tabs */}
      <div className="brand-boards-nav" style={{ flexShrink: 0 }}>
        <div className="bbn-tabs">
          <div className={`bbn-tab-wrap${activeProjectId === null ? ' on' : ''}`}>
            <button className={`bbn-tab${activeProjectId === null ? ' on' : ''}`} onClick={() => setActiveProjectId(null)}>{brand.name}</button>
            <button className="bbn-tab-opts" onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>⋯</button>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} onClick={() => setMenuOpen(false)} />
                <div className="proj-opts-menu on" style={{ top: '100%', right: 0, left: 'auto' }}>
                  <div className="proj-opts-item" onClick={() => { setMenuOpen(false); router.push('/brands'); }}>🗄️ أرشفة البراند</div>
                  <div className="proj-opts-item danger" onClick={() => { setMenuOpen(false); handleDeleteBrand(); }}>🗑 حذف البراند</div>
                </div>
              </>
            )}
          </div>
          {projects.map((proj) => (
            <div key={proj.id} className={`bbn-tab-wrap${activeProjectId === proj.id ? ' on' : ''}`}>
              <button className={`bbn-tab${activeProjectId === proj.id ? ' on' : ''}`} onClick={() => setActiveProjectId(proj.id)}>{proj.title}</button>
            </div>
          ))}
        </div>
      </div>

      {/* Full-Width Kanban Board */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="vip-kanban-board">
            {/* Pure status columns — ideas → todo → in_progress → done */}
            {KANBAN_COLS.map((col) => (
              <KanbanCol
                key={col.id}
                col={col}
                tasks={visibleTasks.filter((t) => t.status === col.id)}
                projects={projects}
                brandId={brand.id}
                activeProjectId={activeProjectId}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onAdd={handleAdd}
                onCardClick={(task) => setPanelTask(task)}
              />
            ))}
          </div>
        </DragDropContext>
      </div>

      {/* Task Panel */}
      <TaskPanel
        task={panelTask}
        onClose={() => setPanelTask(null)}
        onUpdate={handleUpdate}
        onDelete={(id) => { handleDelete(id); setPanelTask(null); }}
        onArchive={(task) => { setTasks((prev) => prev.filter((t) => t.id !== task.id)); setPanelTask(null); }}
      />

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          brand={brand}
          projects={projects}
          defaultProjectId={activeProjectId}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
