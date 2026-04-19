'use client';
// TaskPanel — لوحة تفاصيل المهمة الجانبية
// Side drawer من اليمين — مطابق لـ index.html الأصلي
import React, { useState, useEffect, useRef } from 'react';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';
import { updateTask, deleteTask, archiveTask } from '@/lib/tasks-actions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface SubtaskItem {
  id: string;
  title: string;
  done: boolean;
}

interface ActivityItem {
  id: string;
  text: string;
  ts: string;
  type: 'action' | 'comment';
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_CHIPS: { v: TaskStatus; lbl: string; color: string }[] = [
  { v: 'todo',        lbl: 'قيد الانتظار',  color: '#2196f3' },
  { v: 'in_progress', lbl: 'جاري التنفيذ',  color: '#ff9800' },
  { v: 'on_hold',     lbl: 'معلق',           color: '#e91e63' },
  { v: 'done',        lbl: 'منجز',           color: '#4caf50' },
  { v: 'ideas',       lbl: '💡 أفكار',       color: '#9c27b0' },
];

const PRI_CHIPS: { v: TaskPriority; lbl: string; color: string }[] = [
  { v: 'critical', lbl: '🔴 حرج',      color: '#f44336' },
  { v: 'high',     lbl: '🟠 عالي',     color: '#ff9800' },
  { v: 'medium',   lbl: '🟡 متوسط',    color: '#ffc107' },
  { v: 'low',      lbl: '⬇️ منخفض',   color: '#9e9e9e' },
];

const STATUS_CHIP_CLASS: Record<TaskStatus, string> = {
  todo:        'status-todo',
  in_progress: 'status-in_progress',
  on_hold:     'status-on_hold',
  done:        'status-done',
  ideas:       'status-ideas',
};

const PRI_CHIP_CLASS: Record<TaskPriority, string> = {
  critical: 'pri-critical',
  high:     'pri-high',
  medium:   'pri-medium',
  low:      'pri-low',
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface TaskPanelProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (updated: Task) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

// ─── Dropdown Component ───────────────────────────────────────────────────────
function Dropdown<T extends string>({
  value,
  chips,
  chipClass,
  onChange,
}: {
  value: T;
  chips: { v: T; lbl: string; color: string }[];
  chipClass: Record<T, string>;
  onChange: (v: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = chips.find((c) => c.v === value) ?? chips[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="tp-dd-wrap" ref={ref}>
      <div
        className={`tp-dd-btn tp-chip ${chipClass[value]}`}
        onClick={() => setOpen((o) => !o)}>
        {active.lbl}
      </div>
      <div className={`tp-dd-menu${open ? ' open' : ''}`}>
        {chips.map((c) => (
          <div
            key={c.v}
            className={`tp-dd-item${c.v === value ? ' active' : ''}`}
            onClick={() => { onChange(c.v); setOpen(false); }}>
            <span className="tp-dd-dot" style={{ background: c.color }} />
            {c.lbl}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main TaskPanel ───────────────────────────────────────────────────────────
export default function TaskPanel({ task, onClose, onUpdate, onDelete, onArchive }: TaskPanelProps) {
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [status, setStatus]     = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate]   = useState('');
  const [subtasks, setSubtasks] = useState<SubtaskItem[]>([]);
  const [newSt, setNewSt]       = useState('');
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [comment, setComment]   = useState('');
  const [saving, setSaving]     = useState(false);

  // Sync state when task changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDesc(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ?? '');
    setSubtasks([]);
    setActivity([]);
    setComment('');
  }, [task?.id]);

  // Escape key
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!task) return null;

  // ── Auto-save helpers ──
  async function saveTitle(val: string) {
    if (val === task!.title) return;
    const res = await updateTask({ id: task!.id, title: val });
    if (res.task) onUpdate(res.task);
  }

  async function saveDesc(val: string) {
    if (val === task!.description) return;
    const res = await updateTask({ id: task!.id, description: val });
    if (res.task) onUpdate(res.task);
  }

  async function changeStatus(v: TaskStatus) {
    setStatus(v);
    const res = await updateTask({ id: task!.id, status: v });
    if (res.task) onUpdate(res.task);
  }

  async function changePriority(v: TaskPriority) {
    setPriority(v);
    const res = await updateTask({ id: task!.id, priority: v });
    if (res.task) onUpdate(res.task);
  }

  async function changeDueDate(val: string) {
    setDueDate(val);
    const res = await updateTask({ id: task!.id, dueDate: val || null });
    if (res.task) onUpdate(res.task);
  }

  // ── Subtasks ──
  function addSubtask() {
    if (!newSt.trim()) return;
    const st: SubtaskItem = {
      id: `st_${Date.now()}`,
      title: newSt.trim(),
      done: false,
    };
    setSubtasks((prev) => [...prev, st]);
    setNewSt('');
  }

  function toggleSubtask(id: string) {
    setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, done: !s.done } : s));
  }

  function removeSubtask(id: string) {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  }

  // ── Activity ──
  function addComment() {
    if (!comment.trim()) return;
    const item: ActivityItem = {
      id: `act_${Date.now()}`,
      text: comment.trim(),
      ts: new Date().toLocaleString('ar-SA'),
      type: 'comment',
    };
    setActivity((prev) => [item, ...prev]);
    setComment('');
  }

  // ── Delete / Archive ──
  async function handleDelete() {
    if (!confirm('هل تريد حذف هذه المهمة؟')) return;
    setSaving(true);
    await deleteTask(task!.id);
    setSaving(false);
    onDelete(task!.id);
    onClose();
  }

  async function handleArchive() {
    setSaving(true);
    await archiveTask(task!);
    setSaving(false);
    onArchive(task!.id);
    onClose();
  }

  const stDone = subtasks.filter((s) => s.done).length;
  const stPct = subtasks.length > 0 ? Math.round((stDone / subtasks.length) * 100) : 0;

  return (
    <>
      {/* Overlay */}
      <div
        className="task-panel-overlay on"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="task-panel on" dir="rtl">
        {/* Header */}
        <div className="tp-header">
          <div>
            <div className="tp-breadcrumb">
              <span>المهام</span>
              <span>›</span>
              <span style={{ color: 'var(--txt)' }}>{task.title.slice(0, 30)}{task.title.length > 30 ? '...' : ''}</span>
            </div>
          </div>
          <div className="tp-actions">
            <span className="tp-task-id">{task.id.slice(0, 12)}</span>
            <button
              className="tp-copy-btn"
              onClick={() => navigator.clipboard.writeText(task.id)}
              title="نسخ المعرّف">
              نسخ
            </button>
            <button className="tp-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div className="tp-body">
          {/* Main Column */}
          <div className="tp-col-main">
            {/* Title */}
            <input
              className="tp-title-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={(e) => saveTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              placeholder="عنوان المهمة..."
            />

            {/* Description */}
            <textarea
              className="tp-desc-area"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={(e) => saveDesc(e.target.value)}
              placeholder="أضف وصفاً..."
              rows={4}
            />

            {/* Subtasks */}
            <div className="tp-section-label">✅ الخطوات</div>
            {subtasks.length > 0 && (
              <>
                <div className="tp-st-progress">
                  <div className="tp-st-progress-fill" style={{ width: `${stPct}%` }} />
                </div>
                {subtasks.map((st) => (
                  <div key={st.id} className="tp-st-row">
                    <div
                      className={`tp-st-cb${st.done ? ' done' : ''}`}
                      onClick={() => toggleSubtask(st.id)}>
                      {st.done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span className={`tp-st-text${st.done ? ' done' : ''}`}>{st.title}</span>
                    <button className="tp-st-del" onClick={() => removeSubtask(st.id)}>✕</button>
                  </div>
                ))}
              </>
            )}
            <div className="tp-st-add">
              <input
                value={newSt}
                onChange={(e) => setNewSt(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addSubtask(); }}
                placeholder="+ أضف خطوة... اضغط Enter"
              />
            </div>

            {/* Activity */}
            <div className="tp-section-label" style={{ marginTop: 24 }}>💬 النشاط</div>
            <textarea
              className="tp-comment-box"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addComment(); }}
              placeholder="اكتب تعليقاً... (Ctrl+Enter للإرسال)"
              rows={3}
            />
            <button
              className="btn btn-sm"
              style={{ marginTop: 6 }}
              onClick={addComment}
              disabled={!comment.trim()}>
              إرسال
            </button>
            {activity.length > 0 && (
              <div style={{ marginTop: 12 }}>
                {activity.map((a) => (
                  <div key={a.id} className="tp-activity-item">
                    <div className={`tp-activity-dot${a.type === 'comment' ? ' comment' : ''}`} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--txt)' }}>{a.text}</div>
                      <div className="tp-activity-time">{a.ts}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Column */}
          <div className="tp-col-side">
            {/* Status */}
            <div className="tp-section-label">الحالة</div>
            <Dropdown
              value={status}
              chips={STATUS_CHIPS}
              chipClass={STATUS_CHIP_CLASS}
              onChange={changeStatus}
            />

            {/* Priority */}
            <div className="tp-section-label">الأولوية</div>
            <Dropdown
              value={priority}
              chips={PRI_CHIPS}
              chipClass={PRI_CHIP_CLASS}
              onChange={changePriority}
            />

            {/* Due Date */}
            <div className="tp-section-label">📅 الموعد النهائي</div>
            <input
              type="date"
              style={{
                width: '100%', background: 'var(--bg)', border: '1px solid var(--brd)',
                borderRadius: 6, padding: '6px 8px', fontSize: 12, color: 'var(--txt)',
                fontFamily: 'inherit', outline: 'none',
              }}
              value={dueDate}
              onChange={(e) => changeDueDate(e.target.value)}
            />

            {/* Actions */}
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                className="btn btn-sm"
                style={{ width: '100%' }}
                onClick={handleArchive}
                disabled={saving}>
                🗄️ أرشفة
              </button>
              <button
                className="btn btn-sm btn-plain"
                style={{ width: '100%', color: 'var(--danger)' }}
                onClick={handleDelete}
                disabled={saving}>
                🗑 حذف
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
