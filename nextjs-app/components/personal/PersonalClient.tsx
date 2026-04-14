'use client';
// Design: Personal section — category filter tabs + Kanban + priority system

import { useState, useTransition, useRef } from 'react';
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

const PRIORITY_META: Record<TaskPriority, { label: string; color: string; dot: string }> = {
  critical: { label: 'حرج',   color: 'bg-red-500/20 text-red-400',       dot: 'bg-red-500' },
  high:     { label: 'عالي',  color: 'bg-orange-500/20 text-orange-400', dot: 'bg-orange-500' },
  medium:   { label: 'متوسط', color: 'bg-yellow-500/20 text-yellow-400', dot: 'bg-yellow-500' },
  low:      { label: 'منخفض', color: 'bg-blue-500/20 text-blue-400',     dot: 'bg-blue-500' },
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

interface Props {
  initialTasks: PersonalTask[];
}

function PriorityPicker({
  onSelect,
  onCancel,
}: {
  onSelect: (p: TaskPriority) => void;
  onCancel: () => void;
}) {
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

function TaskCard({
  task,
  onStatusChange,
  onDelete,
  onArchive,
  onEdit,
}: {
  task: PersonalTask;
  onStatusChange: (id: string, s: TaskStatus) => void;
  onDelete: (id: string) => void;
  onArchive: (t: PersonalTask) => void;
  onEdit: (t: PersonalTask) => void;
}) {
  const pm = PRIORITY_META[task.priority];
  const cat = CATEGORIES.find((c) => c.id === task.category);

  return (
    <div className="bg-[#1a1a2e] border border-white/8 rounded-lg p-3 group hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-gray-200 flex-1 leading-snug">{task.title}</p>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(task)} title="تعديل" className="text-gray-500 hover:text-blue-400 text-xs px-1">✏</button>
          <button onClick={() => onArchive(task)} title="أرشفة" className="text-gray-500 hover:text-yellow-400 text-xs px-1">📦</button>
          <button onClick={() => onDelete(task.id)} title="حذف نهائي" className="text-gray-500 hover:text-red-400 text-xs px-1">✕</button>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${pm.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${pm.dot}`} />
          {pm.label}
        </span>
        {cat && (
          <span className="text-[10px] text-gray-500">
            {cat.emoji} {cat.label}
          </span>
        )}
        {task.hasDescription && <span className="text-[10px] text-gray-500">📝</span>}
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

function EditModal({
  task,
  onSave,
  onClose,
}: {
  task: PersonalTask;
  onSave: (patch: Partial<PersonalTask>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [category, setCategory] = useState<TaskCategory>(task.category);
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

        {/* Priority */}
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

        {/* Category */}
        <div className="flex gap-2 mb-3 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`text-xs px-2 py-1 rounded-full border transition-all ${
                category === c.id
                  ? 'bg-purple-500/20 text-purple-300 border-transparent'
                  : 'border-white/10 text-gray-500'
              }`}
            >
              {c.emoji} {c.label}
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
            onClick={() => onSave({ title, description, priority, category, dueDate: dueDate || null })}
            className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-500 text-white rounded-lg"
          >
            حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PersonalClient({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<PersonalTask[]>(initialTasks);
  const [isPending, startTransition] = useTransition();
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all');
  const [quickAdd, setQuickAdd] = useState<{
    colId: TaskStatus;
    title: string;
    category: TaskCategory;
  } | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredTasks =
    activeCategory === 'all' ? tasks : tasks.filter((t) => t.category === activeCategory);

  function handleQuickAddKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && quickAdd?.title.trim()) setShowPicker(true);
    if (e.key === 'Escape') { setQuickAdd(null); setShowPicker(false); }
  }

  function handlePrioritySelect(priority: TaskPriority) {
    if (!quickAdd?.title.trim()) return;
    const { colId, title, category } = quickAdd;
    setQuickAdd(null);
    setShowPicker(false);
    startTransition(async () => {
      const result = await addPersonalTask({ title, status: colId, priority, category });
      if (result.task) setTasks((prev) => [result.task!, ...prev]);
    });
  }

  function handleStatusChange(id: string, status: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    startTransition(async () => { await updatePersonalTask({ id, status }); });
  }

  function handleDelete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => { await deletePersonalTask(id); });
  }

  function handleArchive(task: PersonalTask) {
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    startTransition(async () => {
      const res = await archivePersonalTask(task);
      if (res.error) {
        setTasks((prev) => [task, ...prev]);
      }
    });
  }

  function handleSaveEdit(patch: Partial<PersonalTask>) {
    if (!editingTask) return;
    const id = editingTask.id;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, ...patch, hasDescription: !!(patch.description?.trim() ?? t.description?.trim()) }
          : t
      )
    );
    setEditingTask(null);
    startTransition(async () => {
      await updatePersonalTask({
        id,
        title: patch.title,
        description: patch.description,
        priority: patch.priority,
        category: patch.category,
        dueDate: patch.dueDate,
      });
    });
  }

  const tasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter((t) => t.status === status).sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-white">المهام الشخصية</h1>
        <span className="text-xs text-gray-500">{tasks.length} مهمة</span>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        <button
          onClick={() => setActiveCategory('all')}
          className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
            activeCategory === 'all'
              ? 'bg-white/10 text-white border-transparent'
              : 'border-white/10 text-gray-500 hover:text-gray-300'
          }`}
        >
          الكل ({tasks.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = tasks.filter((t) => t.category === c.id).length;
          return (
            <button
              key={c.id}
              onClick={() => setActiveCategory(c.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                activeCategory === c.id
                  ? 'bg-purple-500/20 text-purple-300 border-transparent'
                  : 'border-white/10 text-gray-500 hover:text-gray-300'
              }`}
            >
              {c.emoji} {c.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {COLUMNS.map((col) => {
          const colTasks = tasksByStatus(col.id);
          const isAddingHere = quickAdd?.colId === col.id;
          const defaultCat: TaskCategory =
            activeCategory === 'all' ? 'personal' : activeCategory;

          return (
            <div key={col.id} className="flex-shrink-0 w-64 flex flex-col">
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
                    setQuickAdd({ colId: col.id, title: '', category: defaultCat });
                    setShowPicker(false);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="text-gray-600 hover:text-gray-300 text-lg leading-none"
                >
                  +
                </button>
              </div>

              {isAddingHere && (
                <div className="relative mb-2">
                  <input
                    ref={inputRef}
                    value={quickAdd.title}
                    onChange={(e) => setQuickAdd({ ...quickAdd, title: e.target.value })}
                    onKeyDown={handleQuickAddKeyDown}
                    placeholder="اسم المهمة ثم Enter..."
                    className="w-full bg-white/5 border border-purple-500/40 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none"
                  />
                  {showPicker && (
                    <PriorityPicker
                      onSelect={handlePrioritySelect}
                      onCancel={() => { setQuickAdd(null); setShowPicker(false); }}
                    />
                  )}
                </div>
              )}

              <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onArchive={handleArchive}
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
