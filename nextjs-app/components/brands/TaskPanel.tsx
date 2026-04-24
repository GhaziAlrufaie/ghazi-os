'use client';
// TaskPanel — لوحة تفاصيل المهمة الجانبية
// Side drawer من اليمين — مطابق لـ index.html الأصلي
import React, { useState, useEffect, useRef } from 'react';
import type { Task, TaskStatus, TaskPriority, SubtaskItem } from '@/lib/tasks-actions';
import { updateTask, deleteTask, archiveTask } from '@/lib/tasks-actions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BrandRow { id: string; name: string; color: string; }

interface ActivityItem {
  id: string;
  text: string;
  ts: string;
  type: 'action' | 'comment';
}

interface LinkItem { id: string; url: string; label: string; }

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
  waiting:     'status-on_hold',
  done:        'status-done',
  ideas:       'status-ideas',
  projects:    'status-ideas',
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
  brands?: BrandRow[];
  onClose: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onArchive: (task: Task) => void;
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
  const [tags, setTags]         = useState<string[]>([]);
  const [newTag, setNewTag]     = useState('');
  const [links, setLinks]       = useState<LinkItem[]>([]);
  const [newLink, setNewLink]   = useState({ url: '', label: '' });
  const [showLinkForm, setShowLinkForm] = useState(false);

  // Sync state when task changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDesc(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ?? '');
    // تحميل subtasks من Supabase
    setSubtasks(Array.isArray((task as Task & { subtasks?: SubtaskItem[] }).subtasks)
      ? ((task as Task & { subtasks?: SubtaskItem[] }).subtasks as SubtaskItem[])
      : []);
    setActivity([]);
    setComment('');
    setTags([]);
    setLinks([]);
    setNewTag('');
    setNewLink({ url: '', label: '' });
    setShowLinkForm(false);
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
    await updateTask({ id: task!.id, title: val });
    onUpdate({ title: val });
  }

  async function saveDesc(val: string) {
    if (val === (task!.description ?? '')) return;
    await updateTask({ id: task!.id, description: val });
    onUpdate({ description: val });
  }

  async function changeStatus(v: TaskStatus) {
    setStatus(v);
    await updateTask({ id: task!.id, status: v });
    onUpdate({ status: v });
  }

  async function changePriority(v: TaskPriority) {
    setPriority(v);
    await updateTask({ id: task!.id, priority: v });
    onUpdate({ priority: v });
  }

  async function changeDueDate(val: string) {
    setDueDate(val);
    await updateTask({ id: task!.id, dueDate: val || null });
    onUpdate({ dueDate: val || null });
  }

  // ── Tags ──
  function addTag() {
    const t = newTag.trim().replace(/^#/, '');
    if (!t || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setNewTag('');
  }
  function removeTag(tag: string) { setTags((prev) => prev.filter((t) => t !== tag)); }

  // ── Links ──
  function addLink() {
    if (!newLink.url.trim()) return;
    setLinks((prev) => [...prev, { id: `lnk_${Date.now()}`, url: newLink.url.trim(), label: newLink.label.trim() || newLink.url.trim() }]);
    setNewLink({ url: '', label: '' });
    setShowLinkForm(false);
  }
  function removeLink(id: string) { setLinks((prev) => prev.filter((l) => l.id !== id)); }

  // ── Subtasks ──
  async function addSubtask() {
    if (!newSt.trim()) return;
    const st: SubtaskItem = {
      id: `st_${Date.now()}`,
      title: newSt.trim(),
      done: false,
    };
    const updated = [...subtasks, st];
    setSubtasks(updated);
    setNewSt('');
    await updateTask({ id: task!.id, subtasks: updated });
  }

  async function toggleSubtask(id: string) {
    const updated = subtasks.map((s) => s.id === id ? { ...s, done: !s.done } : s);
    setSubtasks(updated);
    await updateTask({ id: task!.id, subtasks: updated });
  }

  async function removeSubtask(id: string) {
    const updated = subtasks.filter((s) => s.id !== id);
    setSubtasks(updated);
    await updateTask({ id: task!.id, subtasks: updated });
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
  function handleDelete() {
    onDelete(task!.id);
    onClose();
  }

  function handleArchive() {
    onArchive(task!);
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

            {/* Tags */}
            <div className="tp-section-label" style={{ marginTop: 16 }}>🏷️ التصنيفات</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {tags.map((tag) => (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, fontSize: 11, background: 'rgba(201,168,76,0.15)', color: 'var(--gold)', border: '1px solid rgba(201,168,76,0.25)' }}>
                  #{tag}
                  <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', padding: 0, fontSize: 10 }}>✕</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addTag(); }} placeholder="+ أضف تصنيف..." style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: 'var(--txt1)', outline: 'none' }} />
              <button className="btn btn-sm" onClick={addTag}>+</button>
            </div>

            {/* Links */}
            <div className="tp-section-label" style={{ marginTop: 16 }}>🔗 الروابط</div>
            {links.map((lnk) => (
              <div key={lnk.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, padding: '5px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ fontSize: 12 }}>🔗</span>
                <a href={lnk.url} target="_blank" rel="noreferrer" style={{ flex: 1, fontSize: 11, color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lnk.label}</a>
                <button onClick={() => removeLink(lnk.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', fontSize: 10 }}>✕</button>
              </div>
            ))}
            {showLinkForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input value={newLink.url} onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: 'var(--txt1)', outline: 'none' }} />
                <input value={newLink.label} onChange={(e) => setNewLink((p) => ({ ...p, label: e.target.value }))} placeholder="التسمية (اختياري)" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '5px 10px', fontSize: 11, color: 'var(--txt1)', outline: 'none' }} />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm" onClick={addLink}>إضافة</button>
                  <button className="btn btn-sm btn-plain" onClick={() => setShowLinkForm(false)}>إلغاء</button>
                </div>
              </div>
            ) : (
              <button className="btn btn-sm btn-plain" onClick={() => setShowLinkForm(true)}>+ رابط جديد</button>
            )}

            {/* Subtasks */}
            <div className="tp-section-label" style={{ marginTop: 16 }}>✅ الخطوات</div>
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
                onClick={handleArchive}>
                🗄️ أرشفة
              </button>
              <button
                className="btn btn-sm btn-plain"
                style={{ width: '100%', color: 'var(--danger)' }}
                onClick={handleDelete}>
                🗑 حذف
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
