'use client';
// Design: Reminders page — simple list with inline edit + add + delete
import { useState, useTransition, useRef } from 'react';
import {
  addReminder,
  updateReminder,
  deleteReminder,
  type Reminder,
} from '@/lib/reminders-actions';

interface Props { initialReminders: Reminder[] }

export default function RemindersClient({ initialReminders }: Props) {
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd() {
    const text = newText.trim();
    if (!text) return;
    setNewText('');
    const tempId = `temp_${Date.now()}`;
    const tempReminder: Reminder = { id: tempId, text, created_at: new Date().toISOString() };
    setReminders((prev) => [tempReminder, ...prev]);
    startTransition(async () => {
      const result = await addReminder(text);
      if (result.reminder) {
        setReminders((prev) => prev.map((r) => r.id === tempId ? result.reminder! : r));
      } else {
        setReminders((prev) => prev.filter((r) => r.id !== tempId));
      }
    });
  }

  function handleDelete(id: string) {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    startTransition(async () => { await deleteReminder(id); });
  }

  function startEdit(r: Reminder) {
    setEditingId(r.id);
    setEditText(r.text);
  }

  function handleSaveEdit(id: string) {
    const text = editText.trim();
    if (!text) return;
    setReminders((prev) => prev.map((r) => r.id === id ? { ...r, text } : r));
    setEditingId(null);
    startTransition(async () => { await updateReminder(id, text); });
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <span className="text-2xl">💡</span>
        <h1 className="text-xl font-bold text-white">تذكيراتي</h1>
        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{reminders.length}</span>
      </div>

      {/* Add Row */}
      <div className="flex gap-2 mb-6">
        <input
          ref={inputRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="أضف تذكيراً جديداً..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-purple-500/50 transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!newText.trim()}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-sm rounded-lg transition-colors font-medium"
        >
          إضافة
        </button>
      </div>

      {/* List */}
      {reminders.length === 0 ? (
        <div className="text-center py-16 text-gray-600">
          <div className="text-4xl mb-3">💡</div>
          <p className="text-sm">لا توجد تذكيرات حتى الآن</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {reminders.map((r) => (
            <div key={r.id}
              className="flex items-center gap-3 bg-[#1a1a2e] border border-white/8 rounded-lg px-4 py-3 group hover:border-white/20 transition-all">
              <span className="text-yellow-500 text-sm flex-shrink-0">💡</span>
              {editingId === r.id ? (
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit(r.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={() => handleSaveEdit(r.id)}
                  autoFocus
                  className="flex-1 bg-transparent text-sm text-white outline-none border-b border-purple-500/50"
                />
              ) : (
                <span
                  onClick={() => startEdit(r)}
                  className="flex-1 text-sm text-gray-200 cursor-text hover:text-white transition-colors"
                >
                  {r.text}
                </span>
              )}
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => startEdit(r)} className="text-gray-500 hover:text-blue-400 text-xs px-1.5 py-1">✏</button>
                <button onClick={() => handleDelete(r.id)} className="text-gray-500 hover:text-red-400 text-xs px-1.5 py-1">✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
