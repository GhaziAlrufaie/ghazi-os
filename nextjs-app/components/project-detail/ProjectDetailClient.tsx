'use client';
// ProjectDetailClient — تفاصيل المشروع + Kanban 5 أعمدة
// Layout: Stats Column (280px يسار) + Kanban (يمين)
// Drag & Drop بين الأعمدة + TaskPanel + Quick Add + Priority Picker
import React, { useState, useTransition, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';
import { addTask, updateTask, deleteTask, archiveTask } from '@/lib/tasks-actions';
import type { BrandRow } from '@/lib/brands-types';
import type { ProjectRow } from '@/lib/projects-types';
import TaskPanel from '@/components/brands/TaskPanel';
import AddTaskModal from '@/components/brands/AddTaskModal';

// ─── Types ────────────────────────────────────────────────────────────────────


// ─── Constants ────────────────────────────────────────────────────────────────
const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo',        label: 'قيد الانتظار',  color: '#9ca3af' },
  { id: 'in_progress', label: 'جاري التنفيذ',  color: '#3b82f6' },
  { id: 'on_hold',     label: 'معلق',           color: '#f59e0b' },
  { id: 'done',        label: 'تم',             color: '#22c55e' },
];

const PRI_COLORS: Record<string, string> = {
  critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#6b7280',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') return false;
  return new Date(task.dueDate) < new Date();
}

function daysOverdue(task: Task): number {
  if (!task.dueDate) return 0;
  return Math.ceil((Date.now() - new Date(task.dueDate).getTime()) / 86400000);
}

function genId(): string {
  return `tsk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// ─── PriorityPicker ───────────────────────────────────────────────────────────
function PriorityPicker({ onSelect, onCancel }: {
  onSelect: (p: TaskPriority) => void;
  onCancel: () => void;
}) {
  return (
    <div className="priority-picker">
      <div className="priority-picker-title">اختر الأولوية</div>
      {(['critical', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
        <button key={p} className={`priority-option ${p}`} onClick={() => onSelect(p)}>
          <span className={`priority-dot ${p}`} />
          {{ critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض' }[p]}
        </button>
      ))}
      <button className="priority-option" style={{ color: 'var(--txt3)', marginTop: 4 }} onClick={onCancel}>إلغاء</button>
    </div>
  );
}

// ─── TaskCard ─────────────────────────────────────────────────────────────────
function TaskCard({
  task, brand, index, onOpen, onDelete, onArchive,
}: {
  task: Task;
  brand?: BrandRow;
  index: number;
  onOpen: (t: Task) => void;
  onDelete: (id: string) => void;
  onArchive: (task: Task) => void;
}) {
  const overdue = isOverdue(task);
  const overdueDays = overdue ? daysOverdue(task) : 0;

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="kanban-card"
          style={{
            ...provided.draggableProps.style,
            borderColor: overdue ? 'rgba(239,68,68,0.35)' : undefined,
            opacity: snapshot.isDragging ? 0.85 : 1,
          }}
          onClick={() => onOpen(task)}
        >
          {/* Brand stripe */}
          {brand && (
            <div style={{
              position: 'absolute', top: 0, right: 0,
              width: 3, height: '100%',
              background: brand.color, borderRadius: '0 6px 6px 0',
            }} />
          )}

          {/* Hover actions */}
          <div className="ptc-actions" onClick={(e) => e.stopPropagation()}>
            <button className="ptc-btn arch" title="أرشفة" onClick={() => onArchive(task)}>🗄️</button>
            <button className="ptc-btn del" title="حذف" onClick={() => onDelete(task.id)}>🗑️</button>
          </div>

          {/* Title */}
          <div style={{
            fontSize: 12, fontWeight: 600, marginBottom: 6, lineHeight: 1.4,
            textDecoration: task.status === 'done' ? 'line-through' : 'none',
            color: task.status === 'done' ? 'var(--txt3)' : 'var(--txt1)',
          }}>
            {task.title}
          </div>

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`priority-dot ${task.priority}`} />
            {brand && (
              <span style={{ fontSize: 10, color: brand.color }}>{brand.name}</span>
            )}
          </div>

          {/* Overdue */}
          {overdue && (
            <div style={{ fontSize: 9, color: 'var(--danger)', marginTop: 4 }}>
              متأخر {overdueDays} يوم
            </div>
          )}

          {/* Icons */}
          {task.hasDescription && (
            <div className="btc-icons" style={{ marginTop: 5 }}>
              <span className="btc-icon">📝</span>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}

// ─── Stats Column ─────────────────────────────────────────────────────────────
function StatsColumn({
  project, tasks, brand, onAddTask,
}: {
  project: ProjectRow;
  tasks: Task[];
  brand?: BrandRow;
  onAddTask: () => void;
}) {
  const total  = tasks.length;
  const done   = tasks.filter((t) => t.status === 'done').length;
  const open   = tasks.filter((t) => t.status !== 'done').length;
  const overdue = tasks.filter(isOverdue).length;
  const prog   = total > 0 ? Math.round((done / total) * 100) : (project.progress ?? 0);
  const brandColor = brand?.color ?? '#C9A84C';

  const overdueList = tasks
    .filter(isOverdue)
    .sort((a, b) => daysOverdue(b) - daysOverdue(a))
    .slice(0, 4);

  return (
    <div className="brand-stats-col" style={{ width: 280, flexShrink: 0 }}>
      {/* Brand header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        {brand && (
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${brandColor}22`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>
            {brand.icon ?? '📁'}
          </div>
        )}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt1)' }}>{project.title}</div>
          {brand && <div style={{ fontSize: 11, color: brandColor }}>{brand.name}</div>}
        </div>
      </div>

      {/* Progress */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--txt2)', marginBottom: 4 }}>
          <span>التقدم</span><span>{prog}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${prog}%`, background: brandColor }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'منجزة', value: done, color: 'var(--success)' },
          { label: 'مفتوحة', value: open, color: 'var(--accent)' },
          { label: 'الكل', value: total, color: 'var(--txt2)' },
          { label: 'متأخرة', value: overdue, color: overdue > 0 ? 'var(--danger)' : 'var(--txt3)' },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ padding: '8px 10px' }}>
            <div className="n" style={{ fontSize: 18, color: s.color }}>{s.value}</div>
            <div className="l" style={{ fontSize: 10 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Overdue alerts */}
      {overdueList.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--danger)', marginBottom: 8 }}>
            ⚠️ متأخرة ({overdue})
          </div>
          {overdueList.map((t) => (
            <div key={t.id} style={{
              padding: '6px 8px', marginBottom: 4,
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 6, fontSize: 11,
            }}>
              <div style={{ color: 'var(--txt1)', fontWeight: 600 }}>{t.title}</div>
              <div style={{ color: 'var(--danger)', fontSize: 9, marginTop: 2 }}>
                متأخر {daysOverdue(t)} يوم
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add task button */}
      <button
        className="btn"
        style={{ width: '100%', marginTop: 16 }}
        onClick={onAddTask}
      >
        + مهمة جديدة
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  project: ProjectRow;
  initialTasks: Task[];
  brands: BrandRow[];
}

export default function ProjectDetailClient({ project, initialTasks, brands }: Props) {
  const router = useRouter();
  const [tasks, setTasks]               = useState<Task[]>(initialTasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [quickAdd, setQuickAdd]         = useState<{ colId: TaskStatus; title: string } | null>(null);
  const [showPicker, setShowPicker]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition]             = useTransition();

  const brandMap = Object.fromEntries(brands.map((b) => [b.id, b]));
  const projectBrand = project.brandId ? brandMap[project.brandId] : undefined;

  // ── Drag & Drop ──────────────────────────────────────────────────────────────
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as TaskStatus;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    setTasks((prev) => prev.map((t) => t.id === draggableId ? { ...t, status: newStatus } : t));

    startTransition(async () => {
      const res = await updateTask({ id: draggableId, status: newStatus });
      if (res.error) {
        // Revert on error
        setTasks((prev) => prev.map((t) => t.id === draggableId ? { ...t, status: task.status } : t));
      }
    });
  }, [tasks]);

  // ── Quick Add ────────────────────────────────────────────────────────────────
  function handleQuickAddKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (!quickAdd?.title.trim()) return;
      setShowPicker(true);
    }
    if (e.key === 'Escape') { setQuickAdd(null); setShowPicker(false); }
  }

  async function handlePrioritySelect(priority: TaskPriority) {
    if (!quickAdd) return;
    const tempId = genId();
    const newTask: Task = {
      id: tempId, title: quickAdd.title, description: '',
      status: quickAdd.colId, priority,
      dueDate: null, brandId: project.brandId,
      projectId: project.id, sortOrder: 0, hasDescription: false, subtasks: [], blockerReason: null, latestUpdate: null,
    };
    setTasks((prev) => [...prev, newTask]);
    setQuickAdd(null);
    setShowPicker(false);

    startTransition(async () => {
      const res = await addTask({
        title: quickAdd.title, status: quickAdd.colId, priority,
        brandId: project.brandId, projectId: project.id,
      });
      if (res.task) {
        setTasks((prev) => prev.map((t) => t.id === tempId ? res.task! : t));
      } else {
        setTasks((prev) => prev.filter((t) => t.id !== tempId));
      }
    });
  }

  // ── Task actions ─────────────────────────────────────────────────────────────
  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (selectedTask?.id === id) setSelectedTask(null);
    startTransition(async () => { await deleteTask(id); });
  }

  function handleArchive(task: Task) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    if (selectedTask?.id === task.id) setSelectedTask(null);
    startTransition(async () => { await archiveTask(task); });
  }

  function handleTaskUpdate(patch: Partial<Task>) {
    if (!selectedTask) return;
    const updated = { ...selectedTask, ...patch };
    setTasks((prev) => prev.map((t) => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
    startTransition(async () => {
      await updateTask({
        id: updated.id,
        title: patch.title,
        description: patch.description,
        status: patch.status,
        priority: patch.priority,
        dueDate: patch.dueDate,
      });
    });
  }

  function handleAddTask(task: Task) {
    setTasks((prev) => [...prev, task]);
  }

  return (
    <div className="scr on" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 12, color: 'var(--txt2)' }}>
        <button
          onClick={() => router.push('/projects')}
          style={{ background: 'none', border: 'none', color: 'var(--txt2)', cursor: 'pointer', padding: 0 }}
        >
          المشاريع
        </button>
        <span>/</span>
        <span style={{ color: 'var(--txt1)' }}>{project.title}</span>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', gap: 20, flex: 1, overflow: 'hidden' }}>
        {/* Stats Column */}
        <div style={{ overflowY: 'auto' }}>
          <StatsColumn
            project={project}
            tasks={tasks}
            brand={projectBrand}
            onAddTask={() => setShowAddModal(true)}
          />
        </div>

        {/* Kanban */}
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban" style={{ minWidth: 900 }}>
              {COLUMNS.map((col) => {
                const colTasks = tasks
                  .filter((t) => t.status === col.id)
                  .sort((a, b) => a.sortOrder - b.sortOrder);
                const isAddingHere = quickAdd?.colId === col.id;

                return (
                  <div key={col.id} className="kanban-col">
                    {/* Column header */}
                    <div className="kanban-col-header">
                      <h3 style={{ color: col.color }}>{col.label}</h3>
                      <span className="badge badge-muted">{colTasks.length}</span>
                      <button
                        style={{ marginRight: 'auto', background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 16 }}
                        onClick={() => {
                          setQuickAdd({ colId: col.id, title: '' });
                          setShowPicker(false);
                          setTimeout(() => inputRef.current?.focus(), 50);
                        }}
                      >+</button>
                    </div>

                    {/* Quick-add input */}
                    {isAddingHere && (
                      <div style={{ position: 'relative', marginBottom: 8 }}>
                        <input
                          ref={inputRef}
                          value={quickAdd.title}
                          onChange={(e) => setQuickAdd({ ...quickAdd, title: e.target.value })}
                          onKeyDown={handleQuickAddKeyDown}
                          placeholder="اسم المهمة ثم Enter..."
                          style={{
                            width: '100%', background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(59,130,246,0.4)', borderRadius: 8,
                            padding: '8px 12px', fontSize: 12, color: 'var(--txt1)',
                            outline: 'none', boxSizing: 'border-box',
                          }}
                        />
                        {showPicker && (
                          <PriorityPicker
                            onSelect={handlePrioritySelect}
                            onCancel={() => { setQuickAdd(null); setShowPicker(false); }}
                          />
                        )}
                      </div>
                    )}

                    {/* Tasks */}
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{
                            flex: 1, minHeight: 60,
                            background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.03)' : 'transparent',
                            borderRadius: 8, transition: 'background 0.15s',
                          }}
                        >
                          {colTasks.map((task, idx) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              brand={task.brandId ? brandMap[task.brandId] : undefined}
                              index={idx}
                              onOpen={setSelectedTask}
                              onDelete={handleDelete}
                              onArchive={(task) => { setTasks((prev) => prev.filter((t) => t.id !== task.id)); setSelectedTask(null); }}
                            />
                          ))}
                          {provided.placeholder}
                          {colTasks.length === 0 && !isAddingHere && (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--txt3)', fontSize: 11, borderRadius: 8, border: '1px dashed rgba(255,255,255,0.05)' }}>
                              لا توجد مهام
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        </div>
      </div>

      {/* Task Panel */}
      {selectedTask && (
        <TaskPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          defaultBrandId={project.brandId}
          defaultProjectId={project.id}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTask}
        />
      )}
    </div>
  );
}
