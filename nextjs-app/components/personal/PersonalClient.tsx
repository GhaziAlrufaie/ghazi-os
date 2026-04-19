'use client';
// Design: Personal section — category filter tabs + Kanban 4 cols + DnD (@hello-pangea/dnd)
// Layout: .scr.on wrapper — same as /brands /calendar /reminders
import { useState, useTransition, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  addPersonalTask,
  updatePersonalTask,
  deletePersonalTask,
  archivePersonalTask,
  type PersonalTask,
  type TaskStatus,
  type TaskPriority,
  type TaskCategory,
} from '@/lib/personal-actions';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo',        label: 'قيد الانتظار', color: '#6B7280' },
  { id: 'in_progress', label: 'قيد التنفيذ',  color: '#3B82F6' },
  { id: 'on_hold',     label: 'معلّق',         color: '#F59E0B' },
  { id: 'done',        label: 'مكتمل',         color: '#10B981' },
];
const PRIORITY_META: Record<TaskPriority, { label: string; bg: string; color: string }> = {
  critical: { label: 'حرج',   bg: 'rgba(239,68,68,0.1)',  color: '#ef4444' },
  high:     { label: 'عالي',  bg: 'rgba(249,115,22,0.1)', color: '#f97316' },
  medium:   { label: 'متوسط', bg: 'rgba(234,179,8,0.1)',  color: '#ca8a04' },
  low:      { label: 'منخفض', bg: 'rgba(59,130,246,0.1)', color: '#3b82f6' },
};
const PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low'];
const CATEGORIES: { id: TaskCategory; label: string; emoji: string }[] = [
  { id: 'personal',    label: 'شخصي',        emoji: '👤' },
  { id: 'health',      label: 'صحة',          emoji: '💪' },
  { id: 'family',      label: 'عائلة',        emoji: '👨‍👩‍👧' },
  { id: 'development', label: 'تطوير ذاتي',   emoji: '📚' },
  { id: 'financial',   label: 'مالي',         emoji: '💰' },
  { id: 'ideas',       label: 'أفكار',        emoji: '💡' },
];

interface Props { initialTasks: PersonalTask[] }
interface QuickAdd { colId: TaskStatus; title: string; category: TaskCategory }

function PriorityPicker({ onSelect, onCancel }: { onSelect: (p: TaskPriority) => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'absolute', zIndex: 20, bottom: 'calc(100% + 4px)', right: 0, background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 8, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 120 }}>
      {PRIORITIES.map((p) => (
        <button key={p} onClick={() => onSelect(p)}
          style={{ fontSize: 12, padding: '5px 10px', borderRadius: 6, border: 'none', background: PRIORITY_META[p].bg, color: PRIORITY_META[p].color, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right' }}>
          {PRIORITY_META[p].label}
        </button>
      ))}
      <button onClick={onCancel} style={{ fontSize: 11, color: 'var(--txt3)', background: 'none', border: 'none', cursor: 'pointer', marginTop: 2, fontFamily: 'inherit' }}>إلغاء</button>
    </div>
  );
}

function TaskCard({ task, index, onDelete, onArchive, onEdit }: {
  task: PersonalTask; index: number;
  onDelete: (id: string) => void;
  onArchive: (t: PersonalTask) => void;
  onEdit: (t: PersonalTask) => void;
}) {
  const pm = PRIORITY_META[task.priority];
  const cat = CATEGORIES.find((c) => c.id === task.category);
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            background: 'var(--card)', border: `1px solid ${snapshot.isDragging ? 'var(--gold-b)' : 'var(--brd)'}`,
            borderRadius: 12, padding: '10px 12px', boxShadow: snapshot.isDragging ? '0 8px 20px rgba(0,0,0,0.12)' : 'none',
            transition: 'border-color .15s',
          }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--txt)', flex: 1, lineHeight: 1.5, margin: 0 }}>{task.title}</p>
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
              <button onClick={() => onEdit(task)} title="تعديل" style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 12, padding: '0 3px' }}>✏</button>
              <button onClick={() => onArchive(task)} title="أرشفة" style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 12, padding: '0 3px' }}>📦</button>
              <button onClick={() => onDelete(task.id)} title="حذف" style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 12, padding: '0 3px' }}>✕</button>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: pm.bg, color: pm.color, fontWeight: 600 }}>{pm.label}</span>
            {cat && <span style={{ fontSize: 10, color: 'var(--txt3)' }}>{cat.emoji} {cat.label}</span>}
            {task.hasDescription && <span style={{ fontSize: 10, color: 'var(--txt3)' }}>📝</span>}
            {task.dueDate && (
              <span style={{ fontSize: 10, color: new Date(task.dueDate) < new Date() ? '#ef4444' : 'var(--txt3)' }}>
                {new Date(task.dueDate) < new Date() ? '⚠️ متأخر' : `📅 ${task.dueDate}`}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

function EditModal({ task, onSave, onClose }: {
  task: PersonalTask; onSave: (patch: Partial<PersonalTask>) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  return (
    <div className="modal-bg on" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)', marginBottom: 16 }}>تعديل المهمة</h3>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }}
          placeholder="عنوان المهمة" />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit', marginBottom: 10, resize: 'none', height: 80, boxSizing: 'border-box' }}
          placeholder="الوصف (اختياري)" />
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {PRIORITIES.map((p) => (
            <button key={p} onClick={() => setPriority(p)}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 10, border: `1px solid ${priority === p ? PRIORITY_META[p].color : 'var(--brd)'}`, background: priority === p ? PRIORITY_META[p].bg : 'transparent', color: priority === p ? PRIORITY_META[p].color : 'var(--txt3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: priority === p ? 700 : 400 }}>
              {PRIORITY_META[p].label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCategory(c.id)}
              style={{ fontSize: 11, padding: '4px 10px', borderRadius: 10, border: `1px solid ${category === c.id ? 'var(--gold-b)' : 'var(--brd)'}`, background: category === c.id ? 'var(--gold-dim)' : 'transparent', color: category === c.id ? 'var(--gold)' : 'var(--txt3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: category === c.id ? 700 : 400 }}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
          style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit', marginBottom: 16, boxSizing: 'border-box' }} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', fontSize: 13, color: 'var(--txt3)', background: 'none', border: '1px solid var(--brd)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
          <button onClick={() => { onSave({ title, description, priority, category, dueDate: dueDate || null }); onClose(); }}
            style={{ padding: '7px 16px', fontSize: 13, background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>حفظ</button>
        </div>
      </div>
    </div>
  );
}

export default function PersonalClient({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<PersonalTask[]>(initialTasks);
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all');
  const [quickAdd, setQuickAdd] = useState<QuickAdd | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTasks = activeCategory === 'all' ? tasks : tasks.filter((t) => t.category === activeCategory);

  function handleQuickAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && quickAdd?.title.trim()) setShowPicker(true);
    else if (e.key === 'Escape') { setQuickAdd(null); setShowPicker(false); }
  }

  function handlePrioritySelect(priority: TaskPriority) {
    if (!quickAdd?.title.trim()) return;
    const { colId, title, category } = quickAdd;
    setShowPicker(false);
    setQuickAdd(null);
    const tempId = `temp_${Date.now()}`;
    const tempTask: PersonalTask = {
      id: tempId, title, description: '', status: colId,
      priority, category, dueDate: null, sortOrder: 0, hasDescription: false,
    };
    setTasks((prev) => [...prev, tempTask]);
    startTransition(async () => {
      const result = await addPersonalTask({ title, status: colId, priority, category });
      if (result.task) setTasks((prev) => prev.map((t) => t.id === tempId ? result.task! : t));
      else setTasks((prev) => prev.filter((t) => t.id !== tempId));
    });
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => { await deletePersonalTask(id); });
  }

  function handleArchive(task: PersonalTask) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    startTransition(async () => { await archivePersonalTask(task); });
  }

  function handleSaveEdit(patch: Partial<PersonalTask>) {
    if (!editingTask) return;
    setTasks((prev) => prev.map((t) => t.id === editingTask.id ? { ...t, ...patch } : t));
    startTransition(async () => {
      await updatePersonalTask({ id: editingTask.id, title: patch.title, description: patch.description,
        priority: patch.priority, category: patch.category, dueDate: patch.dueDate });
    });
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newStatus = destination.droppableId as TaskStatus;
    setTasks((prev) => prev.map((t) => t.id === draggableId ? { ...t, status: newStatus } : t));
    startTransition(async () => { await updatePersonalTask({ id: draggableId, status: newStatus }); });
  }

  const tasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((t) => t.status === status).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="scr on">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)', margin: 0 }}>المهام الشخصية</h1>
        <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{tasks.length} مهمة</span>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveCategory('all')}
          style={{
            fontSize: 12, padding: '5px 12px', borderRadius: 20, border: '1px solid',
            borderColor: activeCategory === 'all' ? 'var(--gold-b)' : 'var(--brd)',
            background: activeCategory === 'all' ? 'var(--gold-dim)' : 'transparent',
            color: activeCategory === 'all' ? 'var(--gold)' : 'var(--txt3)',
            fontWeight: activeCategory === 'all' ? 700 : 400,
            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
          }}>
          الكل ({tasks.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = tasks.filter((t) => t.category === c.id).length;
          const isActive = activeCategory === c.id;
          return (
            <button key={c.id} onClick={() => setActiveCategory(c.id)}
              style={{
                fontSize: 12, padding: '5px 12px', borderRadius: 20, border: '1px solid',
                borderColor: isActive ? 'var(--gold-b)' : 'var(--brd)',
                background: isActive ? 'var(--gold-dim)' : 'transparent',
                color: isActive ? 'var(--gold)' : 'var(--txt3)',
                fontWeight: isActive ? 700 : 400,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
              }}>
              {c.emoji} {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Kanban */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16 }}>
          {COLUMNS.map((col) => {
            const colTasks = tasksByStatus(col.id);
            const isAddingHere = quickAdd?.colId === col.id;
            const defaultCat: TaskCategory = activeCategory === 'all' ? 'personal' : activeCategory;
            return (
              <div key={col.id} style={{ flexShrink: 0, width: 260, display: 'flex', flexDirection: 'column' }}>
                {/* Column Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--txt)' }}>{col.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--txt3)', background: 'var(--bg2)', padding: '1px 6px', borderRadius: 8 }}>{colTasks.length}</span>
                  </div>
                  <button onClick={() => {
                    setQuickAdd({ colId: col.id, title: '', category: defaultCat });
                    setShowPicker(false);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }} style={{ background: 'none', border: 'none', color: 'var(--txt3)', fontSize: 20, cursor: 'pointer', lineHeight: 1, fontFamily: 'inherit', padding: '0 4px' }}>+</button>
                </div>

                {/* Quick Add Input */}
                {isAddingHere && (
                  <div style={{ position: 'relative', marginBottom: 8 }}>
                    <input ref={inputRef} value={quickAdd.title}
                      onChange={(e) => setQuickAdd({ ...quickAdd, title: e.target.value })}
                      onKeyDown={handleQuickAddKeyDown}
                      placeholder="اسم المهمة ثم Enter..."
                      style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--gold-b)', borderRadius: 8, padding: '7px 10px', fontSize: 13, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                    {showPicker && (
                      <PriorityPicker onSelect={handlePrioritySelect}
                        onCancel={() => { setQuickAdd(null); setShowPicker(false); }} />
                    )}
                  </div>
                )}

                {/* Droppable */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      style={{
                        display: 'flex', flexDirection: 'column', gap: 8, flex: 1,
                        overflowY: 'auto', minHeight: 80, borderRadius: 10, padding: 4,
                        background: snapshot.isDraggingOver ? 'rgba(201,168,76,0.04)' : 'transparent',
                        border: snapshot.isDraggingOver ? '1px dashed var(--gold-b)' : '1px dashed transparent',
                        transition: 'all .15s',
                      }}>
                      {colTasks.map((task, index) => (
                        <TaskCard key={task.id} task={task} index={index}
                          onDelete={handleDelete} onArchive={handleArchive} onEdit={setEditingTask} />
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && !isAddingHere && !snapshot.isDraggingOver && (
                        <div style={{ textAlign: 'center', color: 'var(--txt3)', fontSize: 12, padding: '24px 0', border: '1px dashed var(--brd)', borderRadius: 10 }}>
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

      {editingTask && (
        <EditModal task={editingTask} onSave={handleSaveEdit} onClose={() => setEditingTask(null)} />
      )}
    </div>
  );
}
