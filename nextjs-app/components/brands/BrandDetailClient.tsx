'use client';
// BrandDetailClient — تفاصيل البراند
// Light Theme مطابق للأصل
// Stats Column (يمين) + Kanban 5 أعمدة + Drag & Drop + Quick Add + Priority Picker
import React, { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { BrandRow } from '@/lib/brands-types';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';
import { addTask, updateTask, deleteTask, archiveTask } from '@/lib/tasks-actions';
import type { ProjectRow } from '@/lib/projects-types';
import { updateBrand, deleteBrand } from '@/lib/brands-actions';

// ─── Constants ────────────────────────────────────────────────────────────────
const KANBAN_COLS: { id: TaskStatus; name: string; color: string }[] = [
  { id: 'todo',        name: 'قيد الانتظار', color: '#3B82F6' },
  { id: 'in_progress', name: 'جاري التنفيذ', color: '#C9A84C' },
  { id: 'on_hold',     name: 'معلق',         color: '#F97316' },
  { id: 'done',        name: 'منجز',         color: '#10B981' },
  { id: 'ideas',       name: '💡 أفكار',     color: '#8B5CF6' },
];

// ─── Dhikrni Mission Control ──────────────────────────────────────────────────
interface DhikrniProps {
  brand: BrandRow;
  tasks: Task[];
  projects: ProjectRow[];
}
function DhikrniMissionControl({ brand, tasks, projects }: DhikrniProps) {
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const activeTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const overdueTasks = tasks.filter(isOverdue).length;
  const health = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <div style={{
      padding: 32,
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      minHeight: '100%',
      color: '#fff',
      direction: 'rtl',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'linear-gradient(135deg, #C9A84C, #e6c76a)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, boxShadow: '0 8px 24px rgba(201,168,76,0.4)',
        }}>
          {brand.icon || '🔔'}
        </div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px' }}>{brand.name}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>Mission Control Center</div>
        </div>
        <div style={{ marginRight: 'auto' }}>
          <span style={{
            background: 'rgba(201,168,76,0.2)', border: '1px solid rgba(201,168,76,0.4)',
            color: '#C9A84C', borderRadius: 20, padding: '4px 14px', fontSize: 12, fontWeight: 700,
          }}>Apple Wallet App</span>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          { label: 'إجمالي المهام', value: totalTasks, icon: '📋', color: '#3B82F6' },
          { label: 'جاري التنفيذ', value: activeTasks, icon: '⚡', color: '#C9A84C' },
          { label: 'منجزة', value: doneTasks, icon: '✅', color: '#10B981' },
          { label: 'متأخرة', value: overdueTasks, icon: '⚠️', color: '#EF4444' },
        ].map((kpi) => (
          <div key={kpi.label} style={{
            background: 'rgba(255,255,255,0.06)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '20px 16px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{kpi.icon}</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: kpi.color, lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Health Bar */}
      <div style={{
        background: 'rgba(255,255,255,0.06)', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '20px 24px', marginBottom: 24,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>صحة المشروع</span>
          <span style={{ fontSize: 22, fontWeight: 900, color: health >= 70 ? '#10B981' : health >= 40 ? '#C9A84C' : '#EF4444' }}>{health}%</span>
        </div>
        <div style={{ height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            background: health >= 70 ? '#10B981' : health >= 40 ? '#C9A84C' : '#EF4444',
            width: `${health}%`, transition: 'width 0.5s ease',
          }} />
        </div>
      </div>

      {/* Projects */}
      {projects.length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.06)', borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '20px 24px', marginBottom: 24,
        }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>المشاريع</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {projects.map((proj) => {
              const projTasks = tasks.filter((t) => t.projectId === proj.id);
              const projDone = projTasks.filter((t) => t.status === 'done').length;
              const projHealth = projTasks.length > 0 ? Math.round((projDone / projTasks.length) * 100) : 0;
              return (
                <div key={proj.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                  borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
                }}>
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

      {/* Recent Tasks */}
      <div style={{
        background: 'rgba(255,255,255,0.06)', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '20px 24px',
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 16 }}>المهام الحرجة والعالية</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tasks
            .filter((t) => (t.priority === 'critical' || t.priority === 'high') && t.status !== 'done')
            .slice(0, 8)
            .map((task) => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', background: 'rgba(255,255,255,0.04)',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                  background: PRIORITY_COLORS[task.priority],
                }} />
                <span style={{ flex: 1, fontSize: 12 }}>{task.title}</span>
                {isOverdue(task) && (
                  <span style={{ fontSize: 10, color: '#EF4444', fontWeight: 700 }}>متأخر</span>
                )}
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

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  critical: 'حرج',
  high:     'عالي',
  medium:   'متوسط',
  low:      'منخفض',
};
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
  const diff = Math.ceil((new Date(dueDate).getTime() - Date.now()) / 86400000);
  return diff;
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

// ─── Priority Picker ──────────────────────────────────────────────────────────
interface PriPickerProps {
  onSelect: (p: TaskPriority) => void;
  onClose: () => void;
}
function PriPicker({ onSelect, onClose }: PriPickerProps) {
  return (
    <>
      <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} onClick={onClose} />
      <div style={{
        position: 'absolute', bottom: '100%', right: 0, marginBottom: 4,
        background: 'var(--card)', border: '1px solid var(--brd)',
        borderRadius: 8, boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        zIndex: 9998, padding: '4px 0', minWidth: 120,
      }}>
        {(['critical', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
          <button key={p} onClick={() => onSelect(p)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              width: '100%', padding: '7px 12px', background: 'none',
              border: 'none', cursor: 'pointer', fontSize: 12,
              color: 'var(--txt)', fontFamily: 'inherit', textAlign: 'right',
              transition: 'background .1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_COLORS[p], flexShrink: 0 }} />
            {PRIORITY_LABELS[p]}
          </button>
        ))}
      </div>
    </>
  );
}

// ─── Quick Add Input ──────────────────────────────────────────────────────────
interface QuickAddProps {
  colId: TaskStatus;
  brandId: string;
  projectId: string | null;
  onAdd: (task: Task) => void;
}
function QuickAdd({ colId, brandId, projectId, onAdd }: QuickAddProps) {
  const [value, setValue] = useState('');
  const [showPri, setShowPri] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleAdd(priority: TaskPriority) {
    const title = value.trim();
    if (!title) return;
    setShowPri(false);
    setLoading(true);
    const res = await addTask({ title, status: colId, priority, brandId, projectId: projectId ?? undefined });
    setLoading(false);
    if (res.task) {
      onAdd(res.task as Task);
      setValue('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && value.trim()) {
      setShowPri(true);
    }
    if (e.key === 'Escape') {
      setValue('');
      setShowPri(false);
    }
  }

  return (
    <div className="brand-board-add">
      <div className="brand-board-add-row" style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="+ مهمة..."
          disabled={loading}
        />
        <button
          onClick={() => { if (value.trim()) setShowPri(true); }}
          disabled={loading}>
          {loading ? '...' : '+'}
        </button>
        {showPri && (
          <PriPicker
            onSelect={handleAdd}
            onClose={() => setShowPri(false)}
          />
        )}
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────
interface TaskCardProps {
  task: Task;
  project: ProjectRow | undefined;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string, colId: TaskStatus) => void;
  colId: TaskStatus;
  dropTarget: string | null;
}
function TaskCard({ task, project, onArchive, onDelete, isDragging, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, colId, dropTarget }: TaskCardProps) {
  const overdue = isOverdue(task);
  const dueLabel = daysLeftLabel(task.dueDate);
  const isDropTarget = dropTarget === task.id;

  return (
    <div
      className={`brand-task-card${isDragging ? ' dragging' : ''}${isDropTarget ? ' drag-above' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, task.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, task.id, colId)}>

      {/* Actions (hover) */}
      <div className="ptc-actions" onClick={(e) => e.stopPropagation()}>
        <button className="ptc-btn arch" title="أرشفة" onClick={() => onArchive(task.id)}>🗄️</button>
        <button className="ptc-btn del" title="حذف" onClick={() => onDelete(task.id)}>🗑️</button>
      </div>

      {/* Title */}
      <div className="btc-title">{task.title}</div>

      {/* Meta */}
      <div className="btc-meta">
        <span className={`priority-dot ${task.priority}`} />
        {project && <span className="btc-proj">{project.title}</span>}
        {overdue && <span className="btc-overdue">متأخر {Math.abs(daysLeft(task.dueDate))} يوم</span>}
        {!overdue && task.dueDate && <span className="btc-due">{dueLabel}</span>}
      </div>

      {/* Icons row */}
      {task.hasDescription && (
        <div className="btc-icons">
          <span className="btc-icon">📝</span>
        </div>
      )}
    </div>
  );
}

// ─── Kanban Column ────────────────────────────────────────────────────────────
interface KanbanColProps {
  col: typeof KANBAN_COLS[0];
  tasks: Task[];
  projects: ProjectRow[];
  brandId: string;
  activeProjectId: string | null;
  dragId: string | null;
  dropTarget: string | null;
  dropColTarget: string | null;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, id: string) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetId: string, colId: TaskStatus) => void;
  onColDragOver: (e: React.DragEvent, colId: string) => void;
  onColDragLeave: (e: React.DragEvent) => void;
  onColDrop: (e: React.DragEvent, colId: TaskStatus) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (task: Task) => void;
}
function KanbanCol({ col, tasks, projects, brandId, activeProjectId, dragId, dropTarget, dropColTarget, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop, onColDragOver, onColDragLeave, onColDrop, onArchive, onDelete, onAdd }: KanbanColProps) {
  const isColTarget = dropColTarget === col.id;
  return (
    <div
      className={`brand-board-col${isColTarget ? ' drag-over' : ''}`}
      onDragOver={(e) => onColDragOver(e, col.id)}
      onDragLeave={onColDragLeave}
      onDrop={(e) => onColDrop(e, col.id)}>

      {/* Header */}
      <div className="brand-board-col-hdr">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, display: 'inline-block' }} />
          <span className="col-name" style={{ color: col.color }}>{col.name}</span>
        </div>
        <span className="col-count">{tasks.length}</span>
      </div>

      {/* Cards */}
      <div className="brand-board-cards">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            project={projects.find((p) => p.id === task.projectId)}
            onArchive={onArchive}
            onDelete={onDelete}
            isDragging={dragId === task.id}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            colId={col.id}
            dropTarget={dropTarget}
          />
        ))}
      </div>

      {/* Quick Add */}
      <QuickAdd
        colId={col.id}
        brandId={brandId}
        projectId={activeProjectId}
        onAdd={onAdd}
      />
    </div>
  );
}

// ─── Brand Stats Column ───────────────────────────────────────────────────────
interface StatsColProps {
  brand: BrandRow;
  tasks: Task[];
  onBrandUpdate: (b: BrandRow) => void;
}
function StatsCol({ brand, tasks, onBrandUpdate }: StatsColProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(brand.name);
  const nameRef = useRef<HTMLDivElement>(null);

  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const openTasks = tasks.filter((t) => t.status !== 'done').length;
  const overdueTasks = tasks.filter((t) => isOverdue(t));
  const h = brand.healthScore;
  const hColor = h >= 70 ? 'var(--success)' : h >= 40 ? 'var(--warning)' : 'var(--danger)';

  async function saveName() {
    const trimmed = nameVal.trim();
    if (!trimmed || trimmed === brand.name) { setEditingName(false); return; }
    const res = await updateBrand({
      id: brand.id,
      name: trimmed,
      nameEn: brand.nameEn,
      color: brand.color,
      icon: brand.icon,
      status: brand.status,
      description: brand.description,
      productionDays: brand.productionDays,
    });
    if (res.brand) onBrandUpdate(res.brand);
    setEditingName(false);
  }

  return (
    <div className="brand-stats-col">
      {/* Header */}
      <div className="bsc-header">
        <span className="bsc-icon">{brand.icon}</span>
        <div>
          {editingName ? (
            <input
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
              autoFocus
              style={{
                fontSize: 13, fontWeight: 800, background: 'none', border: 'none',
                borderBottom: '1px solid var(--gold)', outline: 'none',
                color: 'var(--txt)', fontFamily: 'inherit', width: '100%',
              }}
            />
          ) : (
            <div
              className="bsc-name"
              onClick={() => setEditingName(true)}
              title="اضغط لتعديل الاسم"
              style={{ cursor: 'text', borderBottom: '1px dashed transparent' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderBottomColor = 'var(--gold)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderBottomColor = 'transparent')}>
              {brand.name}
            </div>
          )}
          {brand.description && (
            <div className="bsc-desc">{brand.description}</div>
          )}
        </div>
      </div>

      {/* Status badge */}
      <span className={`badge ${STATUS_BADGE[brand.status] ?? 'badge-dim'}`} style={{ marginBottom: 16, alignSelf: 'flex-start' }}>
        {STATUS_LABEL[brand.status] ?? brand.status}
      </span>

      {/* Stats */}
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

      {/* Overdue alerts */}
      {overdueTasks.length > 0 && (
        <div className="bsc-alerts">
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--danger)', marginBottom: 4 }}>
            ⚠️ متأخرة ({overdueTasks.length})
          </div>
          {overdueTasks.slice(0, 4).map((t) => (
            <div key={t.id} className="bsc-alert-item">{t.title}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  brand: BrandRow;
  initialTasks: Task[];
  initialProjects: ProjectRow[];
}

export default function BrandDetailClient({ brand: initialBrand, initialTasks, initialProjects }: Props) {
  const router = useRouter();
  const [brand, setBrand] = useState<BrandRow>(initialBrand);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [projects] = useState<ProjectRow[]>(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null); // null = "all"
  const [menuOpen, setMenuOpen] = useState(false);

  // Drag & Drop state
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [dropColTarget, setDropColTarget] = useState<string | null>(null);

  // ── Drag handlers ──
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragId(null);
    setDropTarget(null);
    setDropColTarget(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTarget(id);
    setDropColTarget(null);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    setDropTarget(null);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetId: string, colId: TaskStatus) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    if (!id || id === targetId) { setDragId(null); setDropTarget(null); setDropColTarget(null); return; }

    // Move card: update status + sortOrder
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id === id) return { ...t, status: colId };
        return t;
      });
      return updated;
    });
    setDragId(null); setDropTarget(null); setDropColTarget(null);
    await updateTask({ id, status: colId });
  }, [dragId]);

  const handleColDragOver = useCallback((e: React.DragEvent, colId: string) => {
    e.preventDefault();
    setDropColTarget(colId);
    setDropTarget(null);
  }, []);

  const handleColDragLeave = useCallback((e: React.DragEvent) => {
    setDropColTarget(null);
  }, []);

  const handleColDrop = useCallback(async (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain') || dragId;
    if (!id) { setDragId(null); setDropColTarget(null); return; }
    setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: colId } : t));
    setDragId(null); setDropColTarget(null);
    await updateTask({ id, status: colId });
  }, [dragId]);

  // ── Task actions ──
  async function handleArchive(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    await archiveTask(task);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleDelete(id: string) {
    if (!confirm('هل تريد حذف هذه المهمة؟')) return;
    await deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function handleAdd(task: Task) {
    setTasks((prev) => [...prev, task]);
  }

  // ── Brand actions ──
  async function handleDeleteBrand() {
    if (!confirm(`هل تريد حذف براند "${brand.name}" نهائياً؟ سيتم حذف جميع مهامه ومشاريعه أيضاً.`)) return;
    await deleteBrand(brand.id);
    router.push('/brands');
  }

  // ── Filter tasks by active project ──
  const visibleTasks = activeProjectId
    ? tasks.filter((t) => t.projectId === activeProjectId)
    : tasks;

  // Dhikrni Mission Control (b4)
  if (brand.id === 'b4') {
    return <DhikrniMissionControl brand={brand} tasks={tasks} projects={projects} />;
  }

  return (
    <div className="scr on" style={{ padding: 0, height: '100%', overflow: 'hidden' }}>
      <div className="brand-detail-wrap">
        {/* Stats Column */}
        <StatsCol brand={brand} tasks={tasks} onBrandUpdate={setBrand} />

        {/* Boards Area */}
        <div className="brand-boards-outer">
          <div className="brand-board-wrap">
            {/* Nav Tabs */}
            <div className="brand-boards-nav">
              <button className="btn btn-sm" onClick={() => {
                // TODO: open new task modal
              }}>+ مهمة جديدة</button>

              <div className="bbn-tabs">
                {/* Main tab */}
                <div className={`bbn-tab-wrap${activeProjectId === null ? ' on' : ''}`}>
                  <button
                    className={`bbn-tab${activeProjectId === null ? ' on' : ''}`}
                    onClick={() => setActiveProjectId(null)}>
                    {brand.name}
                  </button>
                  <button
                    className="bbn-tab-opts"
                    onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}>
                    ⋯
                  </button>
                  {menuOpen && (
                    <>
                      <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} onClick={() => setMenuOpen(false)} />
                      <div className="proj-opts-menu on" style={{ top: '100%', right: 0, left: 'auto' }}>
                        <div className="proj-opts-item" onClick={() => { setMenuOpen(false); router.push('/brands'); }}>
                          🗄️ أرشفة البراند
                        </div>
                        <div className="proj-opts-item danger" onClick={() => { setMenuOpen(false); handleDeleteBrand(); }}>
                          🗑 حذف البراند
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Project tabs */}
                {projects.map((proj) => (
                  <div key={proj.id} className={`bbn-tab-wrap${activeProjectId === proj.id ? ' on' : ''}`}>
                    <button
                      className={`bbn-tab${activeProjectId === proj.id ? ' on' : ''}`}
                      onClick={() => setActiveProjectId(proj.id)}>
                      {proj.title}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Kanban Board */}
            <div className="brand-board-cols" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
              {KANBAN_COLS.map((col) => (
                <KanbanCol
                  key={col.id}
                  col={col}
                  tasks={visibleTasks.filter((t) => t.status === col.id)}
                  projects={projects}
                  brandId={brand.id}
                  activeProjectId={activeProjectId}
                  dragId={dragId}
                  dropTarget={dropTarget}
                  dropColTarget={dropColTarget}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onColDragOver={handleColDragOver}
                  onColDragLeave={handleColDragLeave}
                  onColDrop={handleColDrop}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                  onAdd={handleAdd}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
