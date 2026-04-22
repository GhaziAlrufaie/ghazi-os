'use client';
// BrandDetailClient — تصميم brand-board.html
// Header strip + Kanban 4 cols + Ideas section
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from '@hello-pangea/dnd';
import type { BrandRow } from '@/lib/brands-types';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';
import { addTask, updateTask, deleteTask, archiveTask, restoreTask } from '@/lib/tasks-actions';
import type { ProjectRow } from '@/lib/projects-types';
import { updateBrand, deleteBrand } from '@/lib/brands-actions';
import TaskPanel from './TaskPanel';
import AddTaskModal from './AddTaskModal';
import { useGlobal } from '@/components/GlobalProviders';

// ─── Constants ────────────────────────────────────────────────────────────────
const KANBAN_COLS: { id: TaskStatus; name: string; color: string }[] = [
  { id: 'todo',        name: 'قيد الانتظار', color: '#F59E0B' },
  { id: 'in_progress', name: 'جاري التنفيذ', color: '#3B82F6' },
  { id: 'on_hold',     name: 'معلق',         color: '#8B5CF6' },
  { id: 'done',        name: 'تم ✓',         color: '#10B981' },
];

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  critical: '#EF4444',
  high:     '#F59E0B',
  medium:   '#8B5CF6',
  low:      '#10B981',
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: 'حرج',
  high:     'عالي',
  medium:   'متوسط',
  low:      'منخفض',
};

const PRIORITY_BADGE_CLASS: Record<TaskPriority, string> = {
  critical: 'bb-badge-critical',
  high:     'bb-badge-high',
  medium:   'bb-badge-medium',
  low:      'bb-badge-low',
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
function formatDate(dueDate: string | null): string {
  if (!dueDate) return '';
  const d = new Date(dueDate);
  return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' });
}

// ─── Brand color from brand data ──────────────────────────────────────────────
function getBrandColor(brand: BrandRow): { color: string; deep: string; light: string; soft: string; glow: string } {
  const c = brand.color || '#C9A84C';
  return {
    color: c,
    deep:  c,
    light: `${c}18`,
    soft:  `${c}12`,
    glow:  `${c}40`,
  };
}

// ─── Priority Picker ──────────────────────────────────────────────────────────
const PRI_OPTIONS: { v: TaskPriority; lbl: string }[] = [
  { v: 'critical', lbl: '🔴 حرج' },
  { v: 'high',     lbl: '🟠 عالي' },
  { v: 'medium',   lbl: '🟡 متوسط' },
  { v: 'low',      lbl: '⬇️ منخفض' },
];
function PriPicker({ onSelect, onClose }: { onSelect: (p: TaskPriority) => void; onClose: () => void }) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} onClick={onClose} />
      <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 4, background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)', zIndex: 9998, padding: '4px 0', minWidth: 120 }}>
        {PRI_OPTIONS.map((p) => (
          <button key={p.v} onClick={() => onSelect(p.v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '7px 12px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--txt)', fontFamily: 'inherit' }}>
            {p.lbl}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  project: ProjectRow | undefined;
  index: number;
  colColor: string;
  brandColor: string;
  brandLight: string;
  isDoneCol: boolean;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
}
function TaskCard({ task, project, index, colColor, brandColor, brandLight, isDoneCol, onArchive, onDelete, onClick }: TaskCardProps) {
  const overdue  = isOverdue(task);
  const dueLabel = daysLeftLabel(task.dueDate);
  const dateStr  = formatDate(task.dueDate);

  // subtasks progress
  const subtasks = task.subtasks ?? [];
  const totalSub = subtasks.length;
  const doneSub  = subtasks.filter((s) => s.done).length;
  const subPct   = totalSub > 0 ? Math.round((doneSub / totalSub) * 100) : 0;

  const borderRight = task.priority === 'critical' ? '3px solid #EF4444'
    : task.priority === 'high' ? `3px solid #F59E0B` : undefined;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bb-task-card${snapshot.isDragging ? ' dragging' : ''}${isDoneCol ? ' done' : ''}`}
          style={{
            ...provided.draggableProps.style,
            borderRight,
            cursor: 'pointer',
          }}
          onClick={() => onClick(task)}>
          {/* Quick actions */}
          <div className="ptc-actions" onClick={(e) => e.stopPropagation()}>
            <button className="ptc-btn arch" title="أرشفة" onClick={() => onArchive(task.id)}>🗄️</button>
            <button className="ptc-btn del"  title="حذف"   onClick={() => onDelete(task.id)}>🗑️</button>
          </div>

          {/* Title row */}
          <div className="bb-task-top">
            <div className="bb-task-checkbox" style={{ borderColor: colColor }} />
            <div className="bb-task-title" title={task.title}>{task.title}</div>
          </div>

          {/* Badges */}
          <div className="bb-task-badges">
            <span className={`bb-badge ${PRIORITY_BADGE_CLASS[task.priority]}`}>{PRIORITY_LABELS[task.priority]}</span>
            {project && <span className="bb-badge bb-badge-project" style={{ background: `${brandColor}18`, color: brandColor }}>{project.title}</span>}
          </div>

          {/* Subtasks progress */}
          {totalSub > 0 && (
            <div className="bb-task-progress">
              <div className="bb-progress-bar">
                <div className="bb-progress-fill" style={{ width: `${subPct}%`, background: brandColor }} />
              </div>
              <div className="bb-progress-label">{doneSub} / {totalSub} مهام فرعية</div>
            </div>
          )}

          {/* Meta */}
          {(task.dueDate || overdue) && (
            <div className="bb-task-meta">
              {task.dueDate && <div className="bb-meta-item">📅 <span>{dateStr}</span></div>}
              {overdue
                ? <div className="bb-meta-item" style={{ color: '#EF4444' }}>⚠️ <span>{dueLabel}</span></div>
                : task.dueDate && <div className="bb-meta-item">⏰ <span>{dueLabel}</span></div>
              }
            </div>
          )}
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
  brandColor: string;
  brandLight: string;
  activeProjectId: string | null;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (task: Task) => void;
  onCardClick: (task: Task) => void;
}
function KanbanCol({ col, tasks, projects, brandId, brandColor, brandLight, activeProjectId, onArchive, onDelete, onAdd, onCardClick }: KanbanColProps) {
  const [value, setValue]     = useState('');
  const [showPri, setShowPri] = useState(false);
  const [loading, setLoading] = useState(false);
  const isDoneCol = col.id === 'done';

  async function handleAdd(priority: TaskPriority) {
    const title = value.trim();
    if (!title) return;
    setShowPri(false);
    setLoading(true);
    const res = await addTask({
      title,
      status: col.id,
      priority,
      brandId,
      projectId: activeProjectId,
    });
    setLoading(false);
    if (res.task) {
      onAdd({ ...res.task, hasDescription: false, subtasks: [] });
      setValue('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && value.trim()) setShowPri(true);
  }

  return (
    <div className="bb-col">
      {/* Column header */}
      <div className="bb-col-head">
        <div className="bb-col-dot" style={{ background: col.color }} />
        <div className="bb-col-title">{col.name}</div>
        <div className="bb-col-count">{tasks.length}</div>
      </div>

      {/* Cards */}
      <Droppable droppableId={col.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="bb-col-body"
            style={{ background: snapshot.isDraggingOver ? `${brandColor}08` : undefined }}>
            {tasks.length === 0 && (
              <div className="bb-col-empty">
                <div style={{ fontSize: 24, marginBottom: 6 }}>{isDoneCol ? '📭' : '🎉'}</div>
                <div>{isDoneCol ? 'لا توجد مهام منجزة بعد' : 'لا توجد مهام'}</div>
              </div>
            )}
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                project={projects.find((p) => p.id === task.projectId)}
                index={index}
                colColor={col.color}
                brandColor={brandColor}
                brandLight={brandLight}
                isDoneCol={isDoneCol}
                onArchive={onArchive}
                onDelete={onDelete}
                onClick={onCardClick}
              />
            ))}
            <div style={{ display: 'none' }}>{provided.placeholder}</div>
          </div>
        )}
      </Droppable>

      {/* Quick add */}
      <div style={{ position: 'relative' }}>
        <button
          className="bb-col-add"
          style={{ borderColor: value ? brandColor : undefined, color: value ? brandColor : undefined }}
          onClick={() => { if (value.trim()) setShowPri(true); else { const inp = document.getElementById(`bb-inp-${col.id}`); inp?.focus(); } }}>
          <input
            id={`bb-inp-${col.id}`}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="+ إضافة مهمة"
            disabled={loading}
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'none', border: 'none', outline: 'none', flex: 1, fontFamily: 'inherit', fontSize: 12, color: 'inherit', cursor: 'text', direction: 'rtl' }}
          />
          {loading && <span style={{ fontSize: 10 }}>...</span>}
        </button>
        {showPri && <PriPicker onSelect={handleAdd} onClose={() => setShowPri(false)} />}
      </div>
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

  const bc = getBrandColor(brand);

  // ── Drag & Drop ──
  const onDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStatus = destination.droppableId as TaskStatus;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task || task.status === newStatus) return;
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
    pushUndo({
      label: `حذف "${task.title}"`,
      undo: async () => {
        const res = await restoreTask(task);
        if (!res?.error) setTasks((prev) => [...prev, task]);
      },
    });
    deleteTask(id).catch(() => {});
  }
  function handleAdd(task: Task) { setTasks((prev) => [...prev, task]); }
  function handleUpdate(patch: Partial<Task>) {
    if (!panelTask) return;
    const updated = { ...panelTask, ...patch };
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setPanelTask(updated);
  }
  async function handleDeleteBrand() {
    if (!confirm(`هل تريد حذف براند "${brand.name}" نهائياً؟`)) return;
    await deleteBrand(brand.id);
    router.push('/brands');
  }

  const visibleTasks = activeProjectId
    ? tasks.filter((t) => t.projectId === activeProjectId)
    : tasks.filter((t) => !t.projectId);

  // Stats
  const doneTasks    = tasks.filter((t) => t.status === 'done').length;
  const openTasks    = tasks.filter((t) => t.status !== 'done').length;
  const criticalTasks = tasks.filter((t) => t.priority === 'critical' && t.status !== 'done').length;
  const health = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const healthColor = health >= 70 ? '#22C55E' : health >= 40 ? '#F59E0B' : '#EF4444';

  // Ideas tasks (status === 'ideas')
  const ideasTasks = tasks.filter((t) => t.status === 'ideas');

  return (
    <div className="bb-wrap">
      {/* ── Brand Header Strip ── */}
      <header className="bb-header" style={{ '--bb-color': bc.color, '--bb-deep': bc.deep, '--bb-light': bc.light } as React.CSSProperties}>
        <div className="bb-accent-line" style={{ background: `linear-gradient(90deg, ${bc.color}, ${bc.deep})` }} />

        {/* Avatar */}
        <div className="bb-avatar" style={{ background: bc.light, borderColor: bc.color }}>
          {brand.icon || '🏷️'}
        </div>

        {/* Info */}
        <div className="bb-brand-info">
          <div className="bb-brand-name">
            {brand.name}
            <span className="bb-brand-status">{STATUS_LABEL[brand.status] ?? brand.status}</span>
          </div>
          {brand.description && <div className="bb-brand-desc">{brand.description}</div>}
        </div>

        {/* Stats pills */}
        <div className="bb-stats">
          <div className="bb-stat-pill">
            <span>📋</span>
            <span className="bb-stat-num">{openTasks}</span>
            <span>مفتوحة</span>
          </div>
          <div className="bb-stat-pill bb-stat-critical">
            <span>🔴</span>
            <span className="bb-stat-num">{criticalTasks}</span>
            <span>حرجة</span>
          </div>
          <div className="bb-stat-pill">
            <span>✅</span>
            <span className="bb-stat-num">{doneTasks}</span>
            <span>منجزة</span>
          </div>
          <div className="bb-stat-pill bb-stat-health">
            <span>💚</span>
            <div className="bb-health-bar">
              <div className="bb-health-fill" style={{ width: `${health}%`, background: healthColor }} />
            </div>
            <span className="bb-stat-num" style={{ color: healthColor }}>{health}%</span>
          </div>
        </div>

        {/* Actions */}
        <div className="bb-header-actions">
          {/* Project tabs */}
          <div className="bb-proj-tabs">
            <button
              className={`bb-proj-tab${activeProjectId === null ? ' on' : ''}`}
              style={activeProjectId === null ? { background: bc.color, borderColor: bc.color, color: '#fff' } : {}}
              onClick={() => setActiveProjectId(null)}>
              {brand.name}
            </button>
            {projects.map((proj) => (
              <button
                key={proj.id}
                className={`bb-proj-tab${activeProjectId === proj.id ? ' on' : ''}`}
                style={activeProjectId === proj.id ? { background: bc.color, borderColor: bc.color, color: '#fff' } : {}}
                onClick={() => setActiveProjectId(proj.id)}>
                {proj.title}
              </button>
            ))}
          </div>

          {/* Menu */}
          <div style={{ position: 'relative' }}>
            <button className="bb-btn-icon" onClick={() => setMenuOpen(!menuOpen)} title="خيارات">⋯</button>
            {menuOpen && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} onClick={() => setMenuOpen(false)} />
                <div className="proj-opts-menu on" style={{ top: '100%', left: 0, right: 'auto', zIndex: 9998 }}>
                  <div className="proj-opts-item" onClick={() => { setMenuOpen(false); router.push('/brands'); }}>🗄️ أرشفة البراند</div>
                  <div className="proj-opts-item danger" onClick={() => { setMenuOpen(false); handleDeleteBrand(); }}>🗑 حذف البراند</div>
                </div>
              </>
            )}
          </div>

          <button className="bb-btn-add" style={{ background: bc.color, boxShadow: `0 4px 12px ${bc.glow}` }}
            onClick={() => setShowAddModal(true)}>
            <span>+</span>
            <span>مهمة جديدة</span>
          </button>
        </div>
      </header>

      {/* ── Board Area ── */}
      <div className="bb-board-area">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="bb-board-cols">
            {KANBAN_COLS.map((col) => (
              <KanbanCol
                key={col.id}
                col={col}
                tasks={visibleTasks.filter((t) => t.status === col.id)}
                projects={projects}
                brandId={brand.id}
                brandColor={bc.color}
                brandLight={bc.light}
                activeProjectId={activeProjectId}
                onArchive={handleArchive}
                onDelete={handleDelete}
                onAdd={handleAdd}
                onCardClick={(task) => setPanelTask(task)}
              />
            ))}
          </div>
        </DragDropContext>

        {/* ── Ideas Section ── */}
        <div className="bb-ideas-section">
          <div className="bb-ideas-head">
            <span style={{ fontSize: 18 }}>💡</span>
            <div className="bb-ideas-title">أفكار وملاحظات</div>
            <button className="bb-ideas-add-btn" onClick={() => setShowAddModal(true)}>+ إضافة فكرة</button>
          </div>
          <div className="bb-ideas-grid">
            {ideasTasks.map((t) => (
              <div key={t.id} className="bb-idea-card" onClick={() => setPanelTask(t)}>{t.title}</div>
            ))}
            <button className="bb-idea-card bb-idea-new" style={{ borderColor: bc.color }} onClick={() => setShowAddModal(true)}>
              <span style={{ fontSize: 18 }}>+</span>
              <span style={{ fontSize: 12 }}>فكرة جديدة...</span>
            </button>
          </div>
        </div>
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
