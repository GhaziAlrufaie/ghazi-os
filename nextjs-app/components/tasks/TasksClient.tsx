'use client';
// Design: Dark sidebar layout, Kanban columns, priority badges, description icon

import { useState, useTransition, useRef } from 'react';
import {
  addTask,
  updateTask,
  deleteTask,
  type Task,
  type TaskStatus,
  type TaskPriority,
} from '@/lib/tasks-actions';

const COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
  { id: 'todo',        label: 'قيد الانتظار',  color: '#6B7280' },
  { id: 'in_progress', label: 'قيد التنفيذ',   color: '#3B82F6' },
  { id: 'on_hold',     label: 'معلّق',          color: '#F59E0B' },
  { id: 'done',        label: 'مكتمل',          color: '#10B981' },
];

const PRIORITY_META: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  critical: { label: 'حرج',    color: 'bg-red-500/20 text-red-400',    dot: 'bg-red-500' },
  high:     { label: 'عالي',   color: 'bg-orange-500/20 text-orange-400', dot: 'bg-orange-500' },
  medium:   { label: 'متوسط',  color: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-500' },
  low:      { label: 'منخفض',  color: 'bg-blue-500/20 text-blue-400',   dot: 'bg-blue-500' },
};

const PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

interface Props {
  initialTasks: Task[];
  brands: { id: string; name: string; color: string }[];
}

interface PriorityPickerProps {
  onSelect: (p: TaskPriority) => void;
  onCancel: () => void;
}

function PriorityPicker({ onSelect, onCancel }: PriorityPickerProps) {
  return (
    <div className="absolute z-20 bottom-full mb-1 right-0 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-xl p-2 flex flex-col gap-1 min-w-[120px]">
      {PRIORITIES.map((p) => (
        <button
          key={p}
          onClick={() => onSelect(p)}
          className={`text-xs px-3 py-1.5 rounded flex items-center gap-2 hover:opacity-80 ${PRIORITY_META[p].color}`}
        >
          <span className={`w-2 h-2 rounded-full ${PRIORITY_META[p].dot}`} />
          {PRIORITY_META[p].label}
        </button>
      ))}
      <button onClick={onCancel} className="text-xs text-gray-500 hover:text-gray-300 mt-1 text-center">
        إلغاء
      </button>
    </div>
  );
}

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, s: TaskStatus) => void;
  onDelete: (id: string) => void;
  onEdit: (task: Task) => void;
}

function TaskCard({ task, onStatusChange, onDelete, onEdit }: TaskCardProps) {
  const pm = PRIORITY_META[task.priority];
  return (
    <div className="bg-[#1a1a2e] border border-white/8 rounded-lg p-3 group hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-200 flex-1 leading-snug">{task.title}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} className="text-gray-500 hover:text-blue-400 text-xs px-1">✏</button>
          <button onClick={() => onDelete(task.id)} className="text-gray-500 hover:text-red-400 text-xs px-1">✕</button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${pm.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${pm.dot}`} />
          {pm.label}
        </span>
        {task.hasDescription && <span className="text-[10px] text-gray-500">📝</span>}
        {task.dueDate && (
          <span className="text-[10px] text-gray-500">
            {new Date(task.dueDate).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      <div className="flex gap-1 mt-2">
        {COLUMNS.filter((c) => c.id !== task.status).map((c) => (
          <button
            key={c.id}
            onClick={() => onStatusChange(task.id, c.id)}
            className="text-[9px] px-1.5 py-0.5 rounded border border-white/10 text-gray-500 hover:text-gray-300 hover:border-white/20 transition-all"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}

interface EditModalProps {
  task: Task;
  onSave: (patch: Partial<Task>) => void;
  onClose: () => void;
}

function EditModal({ task, onSave, onClose }: EditModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#12121f] border border-white/10 rounded-xl p-5 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-white font-semibold mb-4">تعديل المهمة</h3>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-3"
          placeholder="عنوان المهمة"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-3 resize-none h-20"
          placeholder="الوصف (اختياري)"
        />
        <div className="flex gap-2 mb-3 flex-wrap">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 border transition-all ${
                priority === p ? PRIORITY_META[p].color + ' border-transparent' : 'border-white/10 text-gray-500'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_META[p].dot}`} />
              {PRIORITY_META[p].label}
            </button>
          ))}
        </div>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white mb-4"
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">إلغاء</button>
          <button
            onClick={() => onSave({ title, description, priority, dueDate: dueDate || null })}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TasksClient({ initialTasks, brands }: Props) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Quick-add state per column
  const [quickAdd, setQuickAdd] = useState<{ colId: TaskStatus; title: string } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleQuickAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && quickAdd?.title.trim()) {
      setShowPicker(true);
    }
    if (e.key === 'Escape') {
      setQuickAdd(null);
      setShowPicker(false);
    }
  }

  function handlePrioritySelect(priority: TaskPriority) {
    if (!quickAdd?.title.trim()) return;
    const colId = quickAdd.colId;
    const title = quickAdd.title.trim();
    setQuickAdd(null);
    setShowPicker(false);

    startTransition(async () => {
      const result = await addTask({ title, status: colId, priority });
      if (result.task) {
        setTasks((prev) => [result.task!, ...prev]);
      }
    });
  }

  function handleStatusChange(id: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    startTransition(async () => {
      await updateTask({ id, status });
    });
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => {
      await deleteTask(id);
    });
  }

  function handleSaveEdit(patch: Partial<Task>) {
    if (!editingTask) return;
    const id = editingTask.id;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              ...patch,
              hasDescription: !!(patch.description?.trim() ?? t.description?.trim()),
            }
          : t
      )
    );
    setEditingTask(null);
    startTransition(async () => {
      await updateTask({
        id,
        title: patch.title,
        description: patch.description,
        priority: patch.priority,
        dueDate: patch.dueDate,
      });
    });
  }

  const tasksByStatus = (status: TaskStatus) =>
    tasks.filter((t) => t.status === status).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">المهام العامة</h1>
        <span className="text-xs text-gray-500">{tasks.length} مهمة</span>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus(col.id);
          const isAddingHere = quickAdd?.colId === col.id;

          return (
            <div key={col.id} className="flex-shrink-0 w-64 flex flex-col">
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  <span className="text-sm font-medium text-gray-300">{col.label}</span>
                  <span className="text-xs text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">
                    {colTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setQuickAdd({ colId: col.id, title: '' });
                    setShowPicker(false);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="text-gray-600 hover:text-gray-300 text-lg leading-none"
                >
                  +
                </button>
              </div>

              {/* Quick-add input */}
              {isAddingHere && (
                <div className="relative mb-2">
                  <input
                    ref={inputRef}
                    value={quickAdd.title}
                    onChange={(e) => setQuickAdd({ ...quickAdd, title: e.target.value })}
                    onKeyDown={handleQuickAddKeyDown}
                    placeholder="اسم المهمة ثم Enter..."
                    className="w-full bg-white/5 border border-blue-500/40 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none"
                  />
                  {showPicker && (
                    <PriorityPicker
                      onSelect={handlePrioritySelect}
                      onCancel={() => {
                        setQuickAdd(null);
                        setShowPicker(false);
                      }}
                    />
                  )}
                </div>
              )}

              {/* Tasks */}
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onEdit={setEditingTask}
                  />
                ))}
                {colTasks.length === 0 && !isAddingHere && (
                  <div className="text-center text-gray-700 text-xs py-8 border border-dashed border-white/5 rounded-lg">
                    لا توجد مهام
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editingTask && (
        <EditModal task={editingTask} onSave={handleSaveEdit} onClose={() => setEditingTask(null)} />
      )}

      {isPending && (
        <div className="fixed bottom-4 left-4 text-xs text-gray-500 bg-black/40 px-3 py-1 rounded-full">
          جارٍ الحفظ...
        </div>
      )}
    </div>
  );
}
