'use client';
// RemindersClient — صفحة التذكيرات
// Layout: .scr.on wrapper — نفس /brands و /calendar
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
  const [newText, setNewText]     = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText]   = useState('');
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

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: '9px 14px',
    border: '1px solid var(--brd)',
    borderRadius: 8,
    fontSize: 13,
    color: 'var(--txt)',
    background: 'var(--bg)',
    outline: 'none',
    fontFamily: 'inherit',
  };

  return (
    <div className="scr on">

      {/* ── Page Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>💡</span>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)', margin: 0 }}>تذكيراتي</h1>
          <span style={{
            fontSize: 11, padding: '2px 10px', borderRadius: 20,
            background: 'var(--gold-dim)', color: 'var(--gold)', fontWeight: 700, border: '1px solid var(--gold-b)',
          }}>
            {reminders.length}
          </span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--txt3)', margin: 0 }}>ملاحظات وتذكيرات سريعة</p>
      </div>

      {/* ── Add Row ── */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 24,
        background: 'var(--bg)', border: '1px solid var(--brd)',
        borderRadius: 12, padding: '12px 16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}>
        <input
          ref={inputRef}
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="أضف تذكيراً جديداً... (Enter للإضافة)"
          style={inputStyle}
        />
        <button
          onClick={handleAdd}
          disabled={!newText.trim()}
          className="btn"
          style={{ opacity: !newText.trim() ? 0.5 : 1, flexShrink: 0 }}
        >
          + إضافة
        </button>
      </div>

      {/* ── List ── */}
      {reminders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--txt3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>💡</div>
          <p style={{ fontSize: 13 }}>لا توجد تذكيرات حتى الآن</p>
          <p style={{ fontSize: 11, marginTop: 4 }}>اكتب تذكيراً واضغط Enter</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 720 }}>
          {reminders.map((r) => (
            <div
              key={r.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'var(--bg)', border: '1px solid var(--brd)',
                borderRadius: 10, padding: '12px 16px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transition: 'border-color .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold-b)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--brd)')}
            >
              {/* Icon */}
              <span style={{ fontSize: 16, flexShrink: 0, color: 'var(--gold)' }}>💡</span>

              {/* Text / Edit */}
              {editingId === r.id ? (
                <input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter')  handleSaveEdit(r.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  onBlur={() => handleSaveEdit(r.id)}
                  autoFocus
                  style={{
                    flex: 1, background: 'transparent', border: 'none',
                    borderBottom: '1px solid var(--gold)', fontSize: 13,
                    color: 'var(--txt)', outline: 'none', fontFamily: 'inherit', padding: '2px 0',
                  }}
                />
              ) : (
                <span
                  onClick={() => startEdit(r)}
                  style={{
                    flex: 1, fontSize: 13, color: 'var(--txt)',
                    cursor: 'text', lineHeight: 1.5,
                  }}
                >
                  {r.text}
                </span>
              )}

              {/* Date */}
              <span style={{ fontSize: 10, color: 'var(--txt3)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {new Date(r.created_at).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' })}
              </span>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button
                  onClick={() => startEdit(r)}
                  style={{
                    background: 'none', border: '1px solid var(--brd)', borderRadius: 6,
                    color: 'var(--txt3)', cursor: 'pointer', fontSize: 12,
                    padding: '3px 8px', transition: 'all .15s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brd)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--txt3)'; }}
                >
                  ✏
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  style={{
                    background: 'none', border: '1px solid var(--brd)', borderRadius: 6,
                    color: 'var(--txt3)', cursor: 'pointer', fontSize: 12,
                    padding: '3px 8px', transition: 'all .15s', fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--danger)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--brd)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--txt3)'; }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
