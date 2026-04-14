'use client';
// Client Component — Inbox (صندوق الأفكار السريعة)
// يعرض قائمة inbox_tasks مع إضافة + تعديل + حذف

import { useState, useTransition } from 'react';
import {
  addInboxTask,
  updateInboxTask,
  deleteInboxTask,
  type InboxTask,
} from '@/lib/inbox-actions';

interface Props {
  initialTasks: InboxTask[];
}

export default function InboxClient({ initialTasks }: Props) {
  const [tasks, setTasks] = useState<InboxTask[]>(initialTasks);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // إضافة فكرة جديدة
  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;
    setError(null);

    startTransition(async () => {
      const result = await addInboxTask(text);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.task) {
        setTasks((prev) => [result.task!, ...prev]);
      }
      setNewText('');
    });
  }

  // بدء التعديل
  function startEdit(task: InboxTask) {
    setEditingId(task.id);
    setEditText(task.text);
  }

  // حفظ التعديل
  function handleUpdate(id: string) {
    const text = editText.trim();
    if (!text) return;
    setError(null);

    startTransition(async () => {
      const result = await updateInboxTask(id, text);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, text } : t))
      );
      setEditingId(null);
    });
  }

  // حذف فكرة
  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteInboxTask(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setTasks((prev) => prev.filter((t) => t.id !== id));
    });
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white">الوارد</h1>
          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
            صندوق الأفكار السريعة
          </span>
        </div>
        <span className="text-xs text-gray-500">{tasks.length} فكرة</span>
      </div>

      {/* نموذج الإضافة */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-5">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="أضف فكرة أو مهمة سريعة..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
          disabled={isPending}
          dir="rtl"
        />
        <button
          type="submit"
          disabled={isPending || !newText.trim()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 transition-colors"
        >
          {isPending ? '...' : 'إضافة'}
        </button>
      </form>

      {/* رسالة الخطأ */}
      {error && (
        <div className="rounded-lg bg-red-900/20 border border-red-500/20 px-4 py-2 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      {/* قائمة الأفكار */}
      <div className="flex flex-col gap-3 overflow-y-auto flex-1">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-600 text-sm py-16 border border-dashed border-white/10 rounded-xl">
            لا توجد أفكار بعد. أضف أول فكرة!
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="group bg-[#1a1a2e] border border-white/8 hover:border-white/20 rounded-xl p-4 transition-all"
            >
              {editingId === task.id ? (
                /* وضع التعديل */
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdate(task.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    className="flex-1 bg-white/5 border border-blue-500/40 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                    autoFocus
                    dir="rtl"
                  />
                  <button
                    onClick={() => handleUpdate(task.id)}
                    disabled={isPending}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                  >
                    حفظ
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="rounded-lg bg-white/5 px-3 py-1.5 text-xs text-gray-400 hover:bg-white/10"
                  >
                    إلغاء
                  </button>
                </div>
              ) : (
                /* وضع العرض */
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-200 leading-relaxed" dir="rtl">
                      {task.text}
                    </p>
                    <p className="mt-1.5 text-xs text-gray-600">
                      {formatDate(task.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => startEdit(task)}
                      className="rounded-lg p-1.5 text-gray-600 hover:bg-white/5 hover:text-blue-400 transition-all"
                      title="تعديل"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      disabled={isPending}
                      className="rounded-lg p-1.5 text-gray-600 hover:bg-red-900/20 hover:text-red-400 disabled:opacity-50 transition-all"
                      title="حذف"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
