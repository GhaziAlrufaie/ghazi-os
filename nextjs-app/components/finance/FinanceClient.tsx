'use client';
// FinanceClient — صفحة المالية المستقلة
// Layout: .scr.on wrapper — نفس /brands و /calendar
// Kanban 5 أعمدة: todo / in_progress / on_hold / done / ideas
// المهام المعروضة = category='financial' فقط — لا مهام البراندات
// Tabs: كل المهام المالية | 💰 المصاريف
import { useState, useTransition } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { addFinanceTask, updateTask, archiveTask, deleteTask, restoreTask } from '@/lib/tasks-actions';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';
import type { ExpenseSection } from '@/lib/expenses-types';
import { EXPENSE_TYPE_LABELS } from '@/lib/expenses-types';
import TaskPanel from '@/components/brands/TaskPanel';
import { useGlobal } from '@/components/GlobalProviders';

// ─── ثوابت ───────────────────────────────────────────────────────────────────
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

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'حرج',
  high:     'مرتفع',
  medium:   'متوسط',
  low:      'منخفض',
};

function isOverdue(task: Task): number {
  if (!task.dueDate || task.status === 'done') return 0;
  const diff = Math.floor((Date.now() - new Date(task.dueDate).getTime()) / 86400000);
  return diff > 0 ? diff : 0;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  initialTasks: Task[];
  expenses:     ExpenseSection[];
}

type TabType = 'kanban' | 'expenses';

// ─── Add Task Modal ───────────────────────────────────────────────────────────
interface AddModalProps {
  defaultStatus: TaskStatus;
  onClose: () => void;
  onAdd:   (task: Task) => void;
}
function AddFinanceTaskModal({ defaultStatus, onClose, onAdd }: AddModalProps) {
  const [title,    setTitle]    = useState('');
  const [status,   setStatus]   = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate,  setDueDate]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('أدخل عنوان المهمة'); return; }
    setLoading(true); setError('');
    const result = await addFinanceTask({ title: title.trim(), status, priority });
    setLoading(false);
    if (result.error) { setError(result.error); return; }
    if (result.task) {
      // update due date if set
      if (dueDate && result.task) {
        await updateTask({ id: result.task.id, dueDate });
        onAdd({ ...result.task, dueDate });
      } else {
        onAdd(result.task);
      }
    }
    onClose();
  }

  return (
    <div className="modal-bg on" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', marginBottom: 20 }}>+ مهمة مالية جديدة</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>العنوان *</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)} autoFocus
              placeholder="عنوان المهمة المالية..."
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>الحالة</label>
              <select
                value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }}
              >
                {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>الأولوية</label>
              <select
                value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }}
              >
                {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>تاريخ الاستحقاق (اختياري)</label>
            <input
              type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }}
            />
          </div>
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              type="button" onClick={onClose}
              style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--bg2)', border: '1px solid var(--brd)', color: 'var(--txt3)', cursor: 'pointer' }}
            >إلغاء</button>
            <button type="submit" className="btn" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? '...' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function FinanceClient({ initialTasks, expenses }: Props) {
  const { pushUndo } = useGlobal();
  const [tasks,          setTasks]          = useState<Task[]>(initialTasks);
  const [tab,            setTab]            = useState<TabType>('kanban');
  const [selectedTask,   setSelectedTask]   = useState<Task | null>(null);
  const [showAddModal,   setShowAddModal]   = useState(false);
  const [addModalStatus, setAddModalStatus] = useState<TaskStatus>('todo');
  const [quickAdd,       setQuickAdd]       = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  // ── إحصائيات ─────────────────────────────────────────────────────────────
  const doneCount    = tasks.filter(t => t.status === 'done').length;
  const openCount    = tasks.filter(t => t.status !== 'done').length;
  const overdueCount = tasks.filter(t => isOverdue(t) > 0).length;
  const health       = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  // ── DnD ──────────────────────────────────────────────────────────────────
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId   = result.draggableId;
    const newStatus = result.destination.droppableId as TaskStatus;
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === newStatus) return;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    startTransition(async () => { await updateTask({ id: taskId, status: newStatus }); });
  };

  // ── Quick Add ─────────────────────────────────────────────────────────────
  const handleQuickAdd = (colId: TaskStatus) => {
    const title = (quickAdd[colId] ?? '').trim();
    if (!title) return;
    const tempId = `tmp_${Date.now()}`;
    const newTask: Task = {
      id: tempId, title, description: '', status: colId,
      priority: 'medium', dueDate: null, brandId: null,
      projectId: null, sortOrder: 0, hasDescription: false, subtasks: [],
    };
    setTasks(prev => [...prev, newTask]);
    setQuickAdd(prev => ({ ...prev, [colId]: '' }));
    startTransition(async () => {
      const result = await addFinanceTask({ title, status: colId, priority: 'medium' });
      if (result.task) setTasks(prev => prev.map(t => t.id === tempId ? result.task! : t));
    });
  };

  // ── Archive / Delete ──────────────────────────────────────────────────────
  const handleArchive = (task: Task) => {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    if (selectedTask?.id === task.id) setSelectedTask(null);
    startTransition(async () => { await archiveTask(task); });
  };

  const handleDelete = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    setTasks(prev => prev.filter(t => t.id !== taskId));
    if (selectedTask?.id === taskId) setSelectedTask(null);
    startTransition(async () => { await deleteTask(taskId); });
    pushUndo({
      label: `حذف "${task.title}"`,
      undo: async () => {
        await restoreTask(task);
        setTasks(prev => [...prev, task]);
      },
    });
  };

  // ── Update ────────────────────────────────────────────────────────────────
  const handleUpdate = (patch: Partial<Task>) => {
    if (!selectedTask) return;
    const updated = { ...selectedTask, ...patch };
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? updated : t));
    setSelectedTask(updated);
    startTransition(async () => { await updateTask({ id: selectedTask.id, ...patch }); });
  };

  // ── Expenses ──────────────────────────────────────────────────────────────
  const totalExpenses = expenses.reduce((s, sec) =>
    s + sec.items.reduce((ss, item) => ss + (item.amount ?? 0), 0), 0
  );

  return (
    <div className="scr on">

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)', marginBottom: 4 }}>💰 حسابات وماليات</h1>
          <p style={{ fontSize: 12, color: 'var(--txt3)' }}>
            {tasks.length} مهمة مالية
          </p>
        </div>
        <button className="btn" onClick={() => { setAddModalStatus('todo'); setShowAddModal(true); }}>
          + مهمة مالية
        </button>
      </div>

      {/* ── Stats Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { icon: '✅', label: 'منجزة',   value: doneCount,    color: 'var(--success)' },
          { icon: '📋', label: 'مفتوحة',  value: openCount,    color: 'var(--accent)' },
          { icon: '⚠️', label: 'متأخرة',  value: overdueCount, color: 'var(--danger)' },
          { icon: '💚', label: 'الصحة',   value: `${health}%`, color: 'var(--gold)' },
        ].map(s => (
          <div
            key={s.label}
            style={{ background: 'var(--bg)', border: '1px solid var(--brd)', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 6 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--brd)', paddingBottom: 12 }}>
        {([
          { id: 'kanban'   as TabType, label: '📋 المهام المالية', count: tasks.length },
          { id: 'expenses' as TabType, label: '💰 المصاريف',       count: expenses.length },
        ]).map(t => (
          <button
            key={t.id}
            className={`btn btn-sm ${tab === t.id ? '' : 'btn-plain'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            <span style={{ fontSize: 9, marginRight: 4, padding: '1px 6px', borderRadius: 8, background: 'rgba(0,0,0,0.06)', color: 'inherit' }}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* ── Kanban Tab ── */}
      {tab === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
            {COLUMNS.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);
              return (
                <div key={col.id} style={{ flex: '0 0 220px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Column Header */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8,
                    background: 'var(--bg)', border: '1px solid var(--brd)',
                    borderTop: `3px solid ${col.color}`,
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: col.color }}>{col.label}</span>
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 8, background: 'var(--bg2)', color: 'var(--txt3)', fontWeight: 600 }}>{colTasks.length}</span>
                  </div>

                  {/* Droppable */}
                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          flex: 1,
                          minHeight: 120,
                          borderRadius: 8,
                          padding: 4,
                          background: snapshot.isDraggingOver ? 'var(--gold-dim)' : 'transparent',
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
                                    marginBottom: 6,
                                    cursor: 'grab',
                                  }}
                                  onClick={() => setSelectedTask(task)}
                                >
                                  {/* Actions */}
                                  <div className="ptc-actions">
                                    <button
                                      className="ptc-btn arch" title="أرشفة"
                                      onClick={e => { e.stopPropagation(); handleArchive(task); }}
                                    >🗄️</button>
                                    <button
                                      className="ptc-btn del" title="حذف"
                                      onClick={e => { e.stopPropagation(); handleDelete(task.id); }}
                                    >🗑️</button>
                                  </div>
                                  {/* Title */}
                                  <div className="btc-title">{task.title}</div>
                                  {/* Meta */}
                                  <div className="btc-meta">
                                    <div
                                      className="priority-dot"
                                      style={{ background: PRIORITY_COLORS[task.priority] }}
                                      title={PRIORITY_LABELS[task.priority]}
                                    />
                                    {overdueDays > 0 && (
                                      <span className="btc-overdue">⚠️ {overdueDays}ي</span>
                                    )}
                                    {task.dueDate && overdueDays === 0 && (
                                      <span className="btc-due">
                                        {new Date(task.dueDate).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
                                      </span>
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
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input
                      placeholder="+ مهمة مالية..."
                      value={quickAdd[col.id] ?? ''}
                      onChange={e => setQuickAdd(prev => ({ ...prev, [col.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(col.id); }}
                      style={{
                        flex: 1, fontSize: 11, padding: '6px 10px',
                        border: '1px solid var(--brd)', borderRadius: 6,
                        background: 'var(--bg)', color: 'var(--txt)',
                        outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                    <button
                      className="btn btn-sm"
                      style={{ padding: '4px 10px' }}
                      onClick={() => handleQuickAdd(col.id)}
                    >+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}

      {/* ── Expenses Tab ── */}
      {tab === 'expenses' && (
        <div>
          {/* Total Card */}
          <div style={{
            background: 'var(--gold-dim)', border: '1px solid var(--gold-b)',
            borderRadius: 16, padding: '20px 24px', marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 4 }}>إجمالي المصاريف الشهرية</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--gold)' }}>
                {totalExpenses.toLocaleString('ar-SA', { minimumFractionDigits: 0 })}
                <span style={{ fontSize: 14, fontWeight: 600, marginRight: 4 }}>ريال</span>
              </div>
            </div>
            <div style={{ fontSize: 40, opacity: 0.5 }}>💰</div>
          </div>

          {/* Sections */}
          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="icon">💸</div>
              <h3>لا توجد مصاريف</h3>
              <p>أضف مصاريفك من صفحة المصاريف</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {expenses.map(sec => {
                const secTotal = sec.items.reduce((s, i) => s + (i.amount ?? 0), 0);
                return (
                  <div
                    key={sec.id}
                    style={{ background: 'var(--bg)', border: '1px solid var(--brd)', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
                  >
                    {/* Section Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: sec.color ?? 'var(--gold)', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{sec.title}</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: 'var(--bg2)', color: 'var(--txt3)' }}>
                          {EXPENSE_TYPE_LABELS[sec.type] ?? sec.type}
                        </span>
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)' }}>
                        {secTotal.toLocaleString('ar-SA')} ر
                      </span>
                    </div>
                    {/* Items */}
                    {sec.items.map((item, i) => (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '7px 0',
                          borderBottom: i < sec.items.length - 1 ? '1px solid var(--brd)' : 'none',
                        }}
                      >
                        <div>
                          <span style={{ fontSize: 12, color: 'var(--txt)' }}>{item.name}</span>
                          {item.note && <span style={{ fontSize: 10, color: 'var(--txt3)', marginRight: 6 }}>— {item.note}</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: item.kind === 'fixed' ? 'rgba(52,199,89,0.1)' : 'rgba(245,158,11,0.1)', color: item.kind === 'fixed' ? 'var(--success)' : 'var(--warning)', fontWeight: 700 }}>
                            {item.kind === 'fixed' ? 'ثابت' : 'متغير'}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--txt)' }}>{item.amount.toLocaleString('ar-SA')} ر</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Task Panel ── */}
      {selectedTask && (
        <TaskPanel
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdate}
          onArchive={handleArchive}
          onDelete={handleDelete}
        />
      )}

      {/* ── Add Task Modal ── */}
      {showAddModal && (
        <AddFinanceTaskModal
          defaultStatus={addModalStatus}
          onClose={() => setShowAddModal(false)}
          onAdd={task => setTasks(prev => [...prev, task])}
        />
      )}
    </div>
  );
}
