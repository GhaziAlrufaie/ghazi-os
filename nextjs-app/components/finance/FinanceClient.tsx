'use client';
// FinanceClient — صفحة المالية
// Tabs: كل المهام | مشاريع مالية | 💰 المصاريف
// Kanban 5 أعمدة: todo / in_progress / waiting / done / ideas
// DnD: @hello-pangea/dnd
import { useState, useTransition } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { addTask, updateTask, archiveTask, deleteTask } from '@/lib/tasks-actions';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';
import type { ProjectRow } from '@/lib/projects-types';
import type { ExpenseSection } from '@/lib/expenses-types';
import TaskPanel from '@/components/brands/TaskPanel';
import AddTaskModal from '@/components/brands/AddTaskModal';
import type { BrandRow } from '@/lib/brands-types';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo',        label: 'قيد الانتظار', color: 'var(--accent)' },
  { id: 'in_progress', label: 'جاري التنفيذ',  color: 'var(--gold)' },
  { id: 'on_hold',     label: 'معلق',          color: 'var(--warning)' },
  { id: 'done',        label: 'تم',            color: 'var(--success)' },
  { id: 'ideas',       label: '💡 أفكار',      color: '#9C27B0' },
];

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high:     '#f97316',
  medium:   '#eab308',
  low:      '#22c55e',
};

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function isOverdue(task: Task): number {
  if (!task.dueDate || task.status === 'done') return 0;
  const diff = Math.floor((Date.now() - new Date(task.dueDate).getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

interface Props {
  initialTasks: Task[];
  projects: ProjectRow[];
  expenses: ExpenseSection[];
  brands: BrandRow[];
}

type TabType = 'all' | 'projects' | 'expenses';

export default function FinanceClient({ initialTasks, projects, expenses, brands }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [tab, setTab] = useState<TabType>('all');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [quickAdd, setQuickAdd] = useState<Record<string, string>>({});
  const [quickPriority, setQuickPriority] = useState<TaskPriority>('medium');
  const [, startTransition] = useTransition();

  // ── تحديد المهام المعروضة ────────────────────────────────────────────────
  const displayTasks = tasks.filter(t => {
    if (selectedProjectId) return t.projectId === selectedProjectId;
    return true;
  });

  // ── إحصائيات ─────────────────────────────────────────────────────────────
  const doneCount = tasks.filter(t => t.status === 'done').length;
  const openCount = tasks.filter(t => t.status !== 'done').length;
  const overdueCount = tasks.filter(t => isOverdue(t) > 0).length;
  const health = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  // ── DnD ──────────────────────────────────────────────────────────────────
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as TaskStatus;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    startTransition(async () => {
      await updateTask({ id: taskId, status: newStatus });
    });
  };

  // ── Quick Add ─────────────────────────────────────────────────────────────
  const handleQuickAdd = (colId: TaskStatus) => {
    const title = (quickAdd[colId] ?? '').trim();
    if (!title) return;
    const tempId = `tmp_${Date.now()}`;
    const newTask: Task = {
      id: tempId, title, description: '', status: colId,
      priority: quickPriority, dueDate: null, brandId: null,
      projectId: selectedProjectId, sortOrder: 0, hasDescription: false,
    };
    setTasks(prev => [...prev, newTask]);
    setQuickAdd(prev => ({ ...prev, [colId]: '' }));
    startTransition(async () => {
      const result = await addTask({ title, status: colId, priority: quickPriority, projectId: selectedProjectId });
      if (result.task) {
        setTasks(prev => prev.map(t => t.id === tempId ? result.task! : t));
      }
    });
  };

  // ── Archive / Delete ──────────────────────────────────────────────────────
  const handleArchive = (task: Task) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    if (selectedTask?.id === task.id) setSelectedTask(null);
    startTransition(async () => { await archiveTask(task); });
  };

  const handleDelete = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
    startTransition(async () => { await deleteTask(taskId); });
  };

  // ── Update ────────────────────────────────────────────────────────────────
  const handleUpdate = (patch: Partial<Task>) => {
    if (!selectedTask) return;
    const updated = { ...selectedTask, ...patch };
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? updated : t));
    setSelectedTask(updated);
    startTransition(async () => {
      await updateTask({ id: selectedTask.id, ...patch });
    });
  };

  // ── Expenses Tab ──────────────────────────────────────────────────────────
  const totalExpenses = expenses.reduce((s, sec) =>
    s + sec.items.reduce((ss, item) => ss + (item.amount ?? 0), 0), 0
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--brd)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>💰 المالية</h2>
        {/* Stats */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>✅ {doneCount} منجزة</span>
          <span className="badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning)' }}>📋 {openCount} مفتوحة</span>
          {overdueCount > 0 && <span className="badge" style={{ background: '#ef444422', color: '#ef4444' }}>⚠️ {overdueCount} متأخرة</span>}
          <span className="badge" style={{ background: 'var(--card-bg)', color: 'var(--txt2)' }}>💚 {health}%</span>
        </div>
        <div style={{ marginRight: 'auto' }}>
          <button className="btn btn-sm" onClick={() => setShowAddModal(true)}>+ مهمة جديدة</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', padding: '8px 16px', borderBottom: '1px solid var(--brd)' }}>
        {([
          { id: 'all' as TabType, label: 'كل المهام', count: tasks.length },
          { id: 'projects' as TabType, label: 'مشاريع مالية', count: projects.length },
          { id: 'expenses' as TabType, label: '💰 المصاريف', count: expenses.length },
        ]).map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${tab === t.id ? '' : 'btn-plain'}`}
            style={{ fontSize: '11px' }}
            onClick={() => { setTab(t.id); setSelectedProjectId(null); }}
          >
            {t.label} <span className="badge" style={{ fontSize: '9px', marginRight: '4px' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* ── Kanban Tab ── */}
        {(tab === 'all' || tab === 'projects') && (
          <>
            {/* Projects selector */}
            {tab === 'projects' && (
              <div style={{ padding: '10px 16px', display: 'flex', gap: '6px', flexWrap: 'wrap', borderBottom: '1px solid var(--brd)' }}>
                <button
                  className={`btn btn-sm ${!selectedProjectId ? '' : 'btn-plain'}`}
                  style={{ fontSize: '10px' }}
                  onClick={() => setSelectedProjectId(null)}
                >
                  كل المشاريع
                </button>
                {projects.map(p => (
                  <button
                    key={p.id}
                    className={`btn btn-sm ${selectedProjectId === p.id ? '' : 'btn-plain'}`}
                    style={{ fontSize: '10px' }}
                    onClick={() => setSelectedProjectId(p.id)}
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            )}

            {/* Kanban Board */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <div style={{ display: 'flex', gap: '10px', padding: '14px', overflowX: 'auto', minHeight: '400px' }}>
                {COLUMNS.map(col => {
                  const colTasks = displayTasks.filter(t => t.status === col.id);
                  return (
                    <div key={col.id} style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {/* Column Header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 8px', borderRadius: '6px', background: 'var(--card-bg)', border: '1px solid var(--brd)' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: col.color }}>{col.label}</span>
                        <span className="badge" style={{ fontSize: '9px' }}>{colTasks.length}</span>
                      </div>

                      {/* Droppable */}
                      <Droppable droppableId={col.id}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            style={{
                              flex: 1,
                              minHeight: '80px',
                              borderRadius: '8px',
                              padding: '4px',
                              background: snapshot.isDraggingOver ? 'var(--hover-bg)' : 'transparent',
                              border: snapshot.isDraggingOver ? `1px dashed ${col.color}` : '1px dashed transparent',
                              transition: 'all 0.15s',
                            }}
                          >
                            {colTasks.map((task, index) => {
                              const overdueDays = isOverdue(task);
                              return (
                                <Draggable key={task.id} draggableId={task.id} index={index}>
                                  {(prov, snap) => (
                                    <div
                                      ref={prov.innerRef}
                                      {...prov.draggableProps}
                                      {...prov.dragHandleProps}
                                      className="brand-task-card"
                                      style={{
                                        ...prov.draggableProps.style,
                                        opacity: snap.isDragging ? 0.85 : 1,
                                        marginBottom: '6px',
                                        cursor: 'grab',
                                      }}
                                      onClick={() => setSelectedTask(task)}
                                    >
                                      {/* Hover Actions */}
                                      <div className="ptc-actions" onClick={e => e.stopPropagation()}>
                                        <button className="ptc-btn arch" title="أرشفة" onClick={e => { e.stopPropagation(); handleArchive(task); }}>🗄️</button>
                                        <button className="ptc-btn del" title="حذف" onClick={e => { e.stopPropagation(); handleDelete(task.id); }}>🗑️</button>
                                      </div>
                                      {/* Title */}
                                      <div className="btc-title">{task.title}</div>
                                      {/* Meta */}
                                      <div className="btc-meta">
                                        <div className="priority-dot" style={{ background: PRIORITY_COLORS[task.priority] }} />
                                        {overdueDays > 0 && (
                                          <span style={{ fontSize: '9px', color: '#ef4444', marginRight: '4px' }}>⚠️ {overdueDays}ي</span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>

                      {/* Quick Add */}
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                          className="quick-add-input"
                          placeholder="+ مهمة..."
                          value={quickAdd[col.id] ?? ''}
                          onChange={e => setQuickAdd(prev => ({ ...prev, [col.id]: e.target.value }))}
                          onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(col.id); }}
                          style={{ flex: 1, fontSize: '11px' }}
                        />
                        <button
                          className="btn btn-sm"
                          style={{ fontSize: '11px', padding: '4px 8px' }}
                          onClick={() => handleQuickAdd(col.id)}
                        >+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DragDropContext>
          </>
        )}

        {/* ── Expenses Tab ── */}
        {tab === 'expenses' && (
          <div style={{ padding: '16px' }}>
            {/* Total */}
            <div className="card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>💰 إجمالي المصاريف</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--gold)' }}>
                {totalExpenses.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ريال
              </span>
            </div>

            {/* Sections */}
            {expenses.length === 0 ? (
              <div className="empty-state">
                <div className="icon">💸</div>
                <h3>لا توجد مصاريف</h3>
                <p>أضف مصاريفك من صفحة المصاريف</p>
              </div>
            ) : (
              expenses.map(sec => {
                const secTotal = sec.items.reduce((s, i) => s + (i.amount ?? 0), 0);
                return (
                  <div key={sec.id} className="card" style={{ marginBottom: '10px', padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: sec.color ?? 'var(--gold)' }} />
                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{sec.title}</span>
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--gold)' }}>
                        {secTotal.toLocaleString('ar-SA')} ريال
                      </span>
                    </div>
                    {sec.items.map(item => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--brd)' }}>
                        <div>
                          <span style={{ fontSize: '12px' }}>{item.name}</span>
                          {item.note && <span style={{ fontSize: '10px', color: 'var(--txt3)', marginRight: '6px' }}>— {item.note}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="badge" style={{ fontSize: '9px' }}>{item.kind === 'fixed' ? 'ثابت' : 'متغير'}</span>
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>{item.amount.toLocaleString('ar-SA')} ريال</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Task Panel */}
      {selectedTask && (
        <TaskPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdate}
          onArchive={handleArchive}
          onDelete={(id) => handleDelete(id)}
        />
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <AddTaskModal
          brands={brands}
          projects={projects}
          onClose={() => setShowAddModal(false)}
          onAdd={(task) => {
            setTasks(prev => [...prev, task]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}
