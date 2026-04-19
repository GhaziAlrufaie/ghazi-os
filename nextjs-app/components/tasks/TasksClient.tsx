'use client';
// TasksClient — المهام العامة
// 3 Views: List + Kanban + Calendar
// فلترة: براند + مشروع + حالة + أولوية
// Drag & Drop + TaskPanel + Quick Add + Priority Picker
import React, { useState, useTransition, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import type { BrandRow } from '@/lib/brands-types';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';
import { addTask, updateTask, deleteTask, archiveTask } from '@/lib/tasks-actions';
import TaskPanel from '@/components/brands/TaskPanel';
import AddTaskModal from '@/components/brands/AddTaskModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProjectRow { id: string; title: string; brand_id?: string | null; }

// ─── Constants ────────────────────────────────────────────────────────────────
const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo',        label: 'قيد الانتظار', color: '#9ca3af' },
  { id: 'in_progress', label: 'جاري التنفيذ', color: '#3b82f6' },
  { id: 'on_hold',     label: 'معلق',          color: '#f59e0b' },
  { id: 'done',        label: 'تم',            color: '#22c55e' },
  { id: 'ideas',       label: '💡 أفكار',      color: '#a78bfa' },
];

const STATUS_LABELS: Record<string, string> = {
  todo: 'قيد الانتظار', in_progress: 'جاري', on_hold: 'معلق', done: 'تم', ideas: 'أفكار',
};

const PRI_LABELS: Record<string, string> = {
  critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض',
};

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') return false;
  return new Date(task.dueDate) < new Date();
}

function daysOverdue(task: Task): number {
  if (!task.dueDate) return 0;
  return Math.ceil((Date.now() - new Date(task.dueDate).getTime()) / 86400000);
}

function daysLeftLabel(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
  if (d < 0) return `متأخر ${Math.abs(d)} يوم`;
  if (d === 0) return 'اليوم';
  if (d === 1) return 'غداً';
  return `${d} يوم`;
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
          {PRI_LABELS[p]}
        </button>
      ))}
      <button className="priority-option" style={{ color: 'var(--txt3)', marginTop: 4 }} onClick={onCancel}>إلغاء</button>
    </div>
  );
}

// ─── TaskCard (Kanban) ────────────────────────────────────────────────────────
function TaskCard({
  task, brand, project, index, onOpen, onDelete, onArchive,
}: {
  task: Task;
  brand?: BrandRow;
  project?: ProjectRow;
  index: number;
  onOpen: (t: Task) => void;
  onDelete: (id: string) => void;
  onArchive: (t: Task) => void;
}) {
  const overdue = isOverdue(task);
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
          {brand && (
            <div style={{ position: 'absolute', top: 0, right: 0, width: 3, height: '100%', background: brand.color, borderRadius: '0 6px 6px 0' }} />
          )}
          <div className="ptc-actions" onClick={(e) => e.stopPropagation()}>
            <button className="ptc-btn arch" onClick={() => onArchive(task)}>🗄️</button>
            <button className="ptc-btn del" onClick={() => onDelete(task.id)}>🗑️</button>
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, lineHeight: 1.4, textDecoration: task.status === 'done' ? 'line-through' : 'none', color: task.status === 'done' ? 'var(--txt3)' : 'var(--txt1)' }}>
            {task.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className={`priority-dot ${task.priority}`} />
            {project && <span style={{ fontSize: 10, color: 'var(--txt3)' }}>{project.title}</span>}
          </div>
          {overdue && (
            <div style={{ fontSize: 9, color: 'var(--danger)', marginTop: 4 }}>متأخر {daysOverdue(task)} يوم</div>
          )}
          {task.hasDescription && (
            <div className="btc-icons" style={{ marginTop: 5 }}><span className="btc-icon">📝</span></div>
          )}
        </div>
      )}
    </Draggable>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  initialTasks: Task[];
  brands: BrandRow[];
  projects: ProjectRow[];
}

export default function TasksClient({ initialTasks, brands, projects }: Props) {
  const [tasks, setTasks]               = useState<Task[]>(initialTasks);
  const [view, setView]                 = useState<'list' | 'kanban' | 'calendar'>('kanban');
  const [filterBrand, setFilterBrand]   = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPri, setFilterPri]       = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [quickAdd, setQuickAdd]         = useState<{ colId: TaskStatus; title: string } | null>(null);
  const [showPicker, setShowPicker]     = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, startTransition]             = useTransition();

  // Calendar state
  const now = new Date();
  const [calYear, setCalYear]   = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const brandMap   = Object.fromEntries(brands.map((b) => [b.id, b]));
  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p]));

  // Filter
  const filtered = tasks.filter((t) => {
    if (filterBrand !== 'all' && t.brandId !== filterBrand) return false;
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPri !== 'all' && t.priority !== filterPri) return false;
    if (filterProject !== 'all' && t.projectId !== filterProject) return false;
    return true;
  });

  // ── Drag & Drop ──────────────────────────────────────────────────────────────
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination } = result;
    const newStatus = destination.droppableId as TaskStatus;
    const task = tasks.find((t) => t.id === draggableId);
    if (!task || task.status === newStatus) return;
    setTasks((prev) => prev.map((t) => t.id === draggableId ? { ...t, status: newStatus } : t));
    startTransition(async () => {
      const res = await updateTask({ id: draggableId, status: newStatus });
      if (res.error) setTasks((prev) => prev.map((t) => t.id === draggableId ? { ...t, status: task.status } : t));
    });
  }, [tasks]);

  // ── Quick Add ────────────────────────────────────────────────────────────────
  function handleQuickAddKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); if (quickAdd?.title.trim()) setShowPicker(true); }
    if (e.key === 'Escape') { setQuickAdd(null); setShowPicker(false); }
  }

  async function handlePrioritySelect(priority: TaskPriority) {
    if (!quickAdd) return;
    const tempId = genId();
    const newTask: Task = {
      id: tempId, title: quickAdd.title, description: '',
      status: quickAdd.colId, priority, dueDate: null,
      brandId: null, projectId: null, sortOrder: 0, hasDescription: false,
    };
    setTasks((prev) => [...prev, newTask]);
    setQuickAdd(null); setShowPicker(false);
    startTransition(async () => {
      const res = await addTask({ title: quickAdd.title, status: quickAdd.colId, priority });
      if (res.task) setTasks((prev) => prev.map((t) => t.id === tempId ? res.task! : t));
      else setTasks((prev) => prev.filter((t) => t.id !== tempId));
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
      await updateTask({ id: updated.id, title: patch.title, description: patch.description, status: patch.status, priority: patch.priority, dueDate: patch.dueDate });
    });
  }

  function handleAddTask(task: Task) {
    setTasks((prev) => [...prev, task]);
  }

  // ── Calendar helpers ─────────────────────────────────────────────────────────
  function buildCalendar() {
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === calYear && today.getMonth() === calMonth;
    const todayDay = isCurrentMonth ? today.getDate() : -1;
    const cells: { day: number | null; tasks: Task[] }[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ day: null, tasks: [] });
    for (let d = 1; d <= daysInMonth; d++) {
      const dayTasks = filtered.filter((t) => {
        if (!t.dueDate) return false;
        const dt = new Date(t.dueDate);
        return dt.getFullYear() === calYear && dt.getMonth() === calMonth && dt.getDate() === d;
      });
      cells.push({ day: d, tasks: dayTasks });
    }
    return { cells, todayDay };
  }

  const { cells, todayDay } = buildCalendar();

  return (
    <div className="scr on" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Filters */}
      <div className="filters" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <select className="filter-select" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
          <option value="all">كل البراندات</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select className="filter-select" value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
          <option value="all">كل المشاريع</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <select className="filter-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">كل الحالات</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="filter-select" value={filterPri} onChange={(e) => setFilterPri(e.target.value)}>
          <option value="all">كل الأولويات</option>
          {Object.entries(PRI_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <div style={{ marginRight: 'auto', display: 'flex', gap: 6 }}>
          {(['list', 'kanban', 'calendar'] as const).map((v) => (
            <button key={v} className={`btn btn-sm${view === v ? '' : ' btn-plain'}`} onClick={() => setView(v)}>
              {{ list: 'قائمة', kanban: 'كانبان', calendar: 'تقويم' }[v]}
            </button>
          ))}
          <button className="btn btn-sm" style={{ marginRight: 8 }} onClick={() => setShowAddModal(true)}>
            + مهمة جديدة
          </button>
        </div>
      </div>

      {/* ── LIST VIEW ─────────────────────────────────────────────────────────── */}
      {view === 'list' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <table className="tasks-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th></th>
                <th>المهمة</th>
                <th>البراند</th>
                <th>المشروع</th>
                <th>الحالة</th>
                <th>الأولوية</th>
                <th>الاستحقاق</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--txt3)' }}>لا توجد مهام</td></tr>
              )}
              {filtered.map((t) => {
                const brand = t.brandId ? brandMap[t.brandId] : undefined;
                const proj = t.projectId ? projectMap[t.projectId] : undefined;
                const overdue = isOverdue(t);
                return (
                  <tr key={t.id} style={{ cursor: 'pointer', background: overdue ? 'rgba(239,68,68,0.03)' : undefined }} onClick={() => setSelectedTask(t)}>
                    <td><span className={`priority-dot ${t.priority}`} style={{ display: 'inline-block' }} /></td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, textDecoration: t.status === 'done' ? 'line-through' : 'none', color: t.status === 'done' ? 'var(--txt3)' : 'var(--txt1)' }}>
                        {t.title}
                      </span>
                      {t.hasDescription && <span style={{ marginRight: 6, fontSize: 10 }}>📝</span>}
                    </td>
                    <td>
                      {brand ? (
                        <span className="brand-tag" style={{ background: `${brand.color}22`, color: brand.color }}>{brand.name}</span>
                      ) : '—'}
                    </td>
                    <td style={{ fontSize: 10, color: 'var(--txt2)' }}>{proj?.title ?? '—'}</td>
                    <td>
                      <span className={`badge ${t.status === 'done' ? 'badge-success' : t.status === 'in_progress' ? 'badge-accent' : t.status === 'on_hold' ? 'badge-warning' : 'badge-muted'}`}>
                        {STATUS_LABELS[t.status] ?? t.status}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${t.priority === 'critical' ? 'badge-danger' : t.priority === 'high' ? 'badge-warning' : 'badge-muted'}`}>
                        {PRI_LABELS[t.priority] ?? t.priority}
                      </span>
                    </td>
                    <td style={{ fontSize: 10, color: overdue ? 'var(--danger)' : 'var(--txt2)' }}>
                      {daysLeftLabel(t.dueDate)}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button className="ptc-btn arch" onClick={() => handleArchive(t)}>🗄️</button>
                      <button className="ptc-btn del" onClick={() => handleDelete(t.id)}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── KANBAN VIEW ───────────────────────────────────────────────────────── */}
      {view === 'kanban' && (
        <div style={{ flex: 1, overflowX: 'auto' }}>
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="kanban" style={{ minWidth: 1000 }}>
              {COLUMNS.map((col) => {
                const colTasks = filtered.filter((t) => t.status === col.id).sort((a, b) => a.sortOrder - b.sortOrder);
                const isAddingHere = quickAdd?.colId === col.id;
                return (
                  <div key={col.id} className="kanban-col">
                    <div className="kanban-col-header">
                      <h3 style={{ color: col.color }}>{col.label}</h3>
                      <span className="badge badge-muted">{colTasks.length}</span>
                      <button
                        style={{ marginRight: 'auto', background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 16 }}
                        onClick={() => { setQuickAdd({ colId: col.id, title: '' }); setShowPicker(false); setTimeout(() => inputRef.current?.focus(), 50); }}
                      >+</button>
                    </div>
                    {isAddingHere && (
                      <div style={{ position: 'relative', marginBottom: 8 }}>
                        <input
                          ref={inputRef}
                          value={quickAdd.title}
                          onChange={(e) => setQuickAdd({ ...quickAdd, title: e.target.value })}
                          onKeyDown={handleQuickAddKeyDown}
                          placeholder="اسم المهمة ثم Enter..."
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--txt1)', outline: 'none', boxSizing: 'border-box' }}
                        />
                        {showPicker && <PriorityPicker onSelect={handlePrioritySelect} onCancel={() => { setQuickAdd(null); setShowPicker(false); }} />}
                      </div>
                    )}
                    <Droppable droppableId={col.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          style={{ flex: 1, minHeight: 60, background: snapshot.isDraggingOver ? 'rgba(255,255,255,0.03)' : 'transparent', borderRadius: 8, transition: 'background 0.15s' }}
                        >
                          {colTasks.map((task, idx) => (
                            <TaskCard
                              key={task.id} task={task} index={idx}
                              brand={task.brandId ? brandMap[task.brandId] : undefined}
                              project={task.projectId ? projectMap[task.projectId] : undefined}
                              onOpen={setSelectedTask} onDelete={handleDelete} onArchive={handleArchive}
                            />
                          ))}
                          {provided.placeholder}
                          {colTasks.length === 0 && !isAddingHere && (
                            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--txt3)', fontSize: 11, border: '1px dashed rgba(255,255,255,0.05)', borderRadius: 8 }}>لا توجد مهام</div>
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
      )}

      {/* ── CALENDAR VIEW ─────────────────────────────────────────────────────── */}
      {view === 'calendar' && (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button className="btn btn-sm btn-plain" onClick={() => { let m = calMonth - 1; let y = calYear; if (m < 0) { m = 11; y--; } setCalMonth(m); setCalYear(y); }}>←</button>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt1)' }}>{MONTHS_AR[calMonth]} {calYear}</span>
            <button className="btn btn-sm btn-plain" onClick={() => { let m = calMonth + 1; let y = calYear; if (m > 11) { m = 0; y++; } setCalMonth(m); setCalYear(y); }}>→</button>
          </div>
          {/* Grid header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
            {['أح','إث','ثل','أر','خم','جم','سب'].map((d) => (
              <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--txt3)', padding: '4px 0' }}>{d}</div>
            ))}
          </div>
          {/* Calendar cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {cells.map((cell, i) => (
              <div
                key={i}
                style={{
                  minHeight: 80, padding: 4, borderRadius: 6,
                  background: cell.day === todayDay ? 'rgba(201,150,59,0.1)' : 'rgba(255,255,255,0.02)',
                  border: cell.day === todayDay ? '1px solid rgba(201,150,59,0.3)' : '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {cell.day && (
                  <>
                    <div style={{ fontSize: 10, color: cell.day === todayDay ? 'var(--gold)' : 'var(--txt3)', marginBottom: 4, fontWeight: cell.day === todayDay ? 700 : 400 }}>
                      {cell.day}
                    </div>
                    {cell.tasks.slice(0, 3).map((t) => {
                      const brand = t.brandId ? brandMap[t.brandId] : undefined;
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTask(t)}
                          style={{
                            fontSize: 9, padding: '2px 4px', borderRadius: 3, marginBottom: 2,
                            background: brand ? `${brand.color}22` : 'rgba(255,255,255,0.06)',
                            color: brand ? brand.color : 'var(--txt2)',
                            cursor: 'pointer', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                          }}
                        >
                          {t.title}
                        </div>
                      );
                    })}
                    {cell.tasks.length > 3 && (
                      <div style={{ fontSize: 9, color: 'var(--txt3)' }}>+{cell.tasks.length - 3} أخرى</div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Panel */}
      {selectedTask && (
        <TaskPanel
          task={selectedTask}
          brands={brands}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleTaskUpdate}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          brands={brands}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddTask}
        />
      )}
    </div>
  );
}
