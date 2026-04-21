'use client';
// TaskPanel — لوحة تفاصيل المهمة
// تصميم مطابق لـ task-detail-v2(1).html
// Layout: Side drawer من اليمين — Main (hero+subtasks+tags+links+activity) + Sidebar (props+actions+brand)
import React, { useState, useEffect, useRef } from 'react';
import type { Task, TaskStatus, TaskPriority, SubtaskItem } from '@/lib/tasks-actions';
import { updateTask, deleteTask, archiveTask } from '@/lib/tasks-actions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BrandRow { id: string; name: string; color: string; icon?: string; description?: string; }

interface ActivityItem {
  id: string;
  text: string;
  ts: string;
  type: 'action' | 'comment';
}

interface LinkItem { id: string; url: string; label: string; }

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS: { v: TaskStatus; lbl: string; color: string; bg: string }[] = [
  { v: 'todo',        lbl: 'قيد الانتظار',  color: '#92400E', bg: '#FEF3C7' },
  { v: 'in_progress', lbl: 'جاري التنفيذ',  color: '#1D4ED8', bg: '#DBEAFE' },
  { v: 'on_hold',     lbl: 'معلق',           color: '#6D28D9', bg: '#EDE9FE' },
  { v: 'done',        lbl: 'منجز',           color: '#15803D', bg: '#DCFCE7' },
  { v: 'ideas',       lbl: '💡 أفكار',       color: '#7C3AED', bg: '#F5F3FF' },
];

const PRI_OPTIONS: { v: TaskPriority; lbl: string; color: string; bg: string; bar: string }[] = [
  { v: 'critical', lbl: '🔴 حرج',    color: '#DC2626', bg: '#FEE2E2', bar: 'linear-gradient(90deg,#EF4444,#FCA5A5)' },
  { v: 'high',     lbl: '🟠 عالي',   color: '#D97706', bg: '#FEF3C7', bar: 'linear-gradient(90deg,#F59E0B,#FCD34D)' },
  { v: 'medium',   lbl: '🟡 متوسط',  color: '#7C3AED', bg: '#EDE9FE', bar: 'linear-gradient(90deg,#8B5CF6,#C4B5FD)' },
  { v: 'low',      lbl: '⬇️ منخفض', color: '#16A34A', bg: '#F0FDF4', bar: 'linear-gradient(90deg,#22C55E,#86EFAC)' },
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface TaskPanelProps {
  task: Task | null;
  brands?: BrandRow[];
  onClose: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onArchive: (task: Task) => void;
}

// ─── StatusDropdown ───────────────────────────────────────────────────────────
function StatusDropdown({ value, onChange }: { value: TaskStatus; onChange: (v: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = STATUS_OPTIONS.find((o) => o.v === value) ?? STATUS_OPTIONS[0];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: active.bg, color: active.color, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        {active.lbl} ▾
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9998, padding: '4px 0', minWidth: 150 }}>
            {STATUS_OPTIONS.map((o) => (
              <button key={o.v} onClick={() => { onChange(o.v); setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: o.v === value ? o.bg : 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: o.color, fontFamily: 'inherit', fontWeight: 600 }}>
                {o.lbl}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── PriorityDropdown ─────────────────────────────────────────────────────────
function PriorityDropdown({ value, onChange }: { value: TaskPriority; onChange: (v: TaskPriority) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = PRI_OPTIONS.find((o) => o.v === value) ?? PRI_OPTIONS[2];

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700, background: active.bg, color: active.color, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        {active.lbl} ▾
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 9997 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, background: 'var(--card)', border: '1px solid var(--brd)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 9998, padding: '4px 0', minWidth: 140 }}>
            {PRI_OPTIONS.map((o) => (
              <button key={o.v} onClick={() => { onChange(o.v); setOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 12px', background: o.v === value ? o.bg : 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: o.color, fontFamily: 'inherit', fontWeight: 600 }}>
                {o.lbl}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main TaskPanel ───────────────────────────────────────────────────────────
export default function TaskPanel({ task, brands, onClose, onUpdate, onDelete, onArchive }: TaskPanelProps) {
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync state when task changes
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDesc(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ?? '');
    setSubtasks(Array.isArray(task.subtasks) ? task.subtasks : []);
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

  // ── Helpers ──
  const priData = PRI_OPTIONS.find((o) => o.v === priority) ?? PRI_OPTIONS[2];
  const stData  = STATUS_OPTIONS.find((o) => o.v === status) ?? STATUS_OPTIONS[0];
  const stDone  = subtasks.filter((s) => s.done).length;
  const stPct   = subtasks.length > 0 ? Math.round((stDone / subtasks.length) * 100) : 0;

  function formatDue(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' });
  }

  function isDueOverdue(): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && status !== 'done';
  }

  // ── Auto-save ──
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

  // ── Subtasks ──
  async function addSubtask() {
    if (!newSt.trim()) return;
    const st: SubtaskItem = { id: `st_${Date.now()}`, title: newSt.trim(), done: false };
    const updated = [...subtasks, st];
    setSubtasks(updated);
    setNewSt('');
    await updateTask({ id: task!.id, subtasks: updated });
    onUpdate({ subtasks: updated });
  }

  async function toggleSubtask(id: string) {
    const updated = subtasks.map((s) => s.id === id ? { ...s, done: !s.done } : s);
    setSubtasks(updated);
    await updateTask({ id: task!.id, subtasks: updated });
    onUpdate({ subtasks: updated });
  }

  async function removeSubtask(id: string) {
    const updated = subtasks.filter((s) => s.id !== id);
    setSubtasks(updated);
    await updateTask({ id: task!.id, subtasks: updated });
    onUpdate({ subtasks: updated });
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
  async function handleMarkDone() {
    await changeStatus('done');
  }

  async function handlePostpone() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const val = tomorrow.toISOString().split('T')[0];
    await changeDueDate(val);
  }

  function handleDelete() {
    if (!confirm(`هل تريد حذف المهمة "${task!.title}"؟`)) return;
    onDelete(task!.id);
    onClose();
  }

  function handleArchive() {
    onArchive(task!);
    onClose();
  }

  // ── Brand ──
  const brand = brands?.find((b) => b.id === task.brandId);

  return (
    <>
      {/* Overlay */}
      <div className="task-panel-overlay on" onClick={onClose} />

      {/* Panel */}
      <div className="task-panel on" dir="rtl">

        {/* ── Header ── */}
        <div className="tp-header">
          <div className="tp-breadcrumb">
            <span style={{ cursor: 'pointer', color: 'var(--txt3)' }} onClick={onClose}>المهام</span>
            <span style={{ color: 'var(--txt3)' }}>›</span>
            <span style={{ color: 'var(--txt)', fontWeight: 600 }}>
              {title.slice(0, 35)}{title.length > 35 ? '...' : ''}
            </span>
          </div>
          <div className="tp-actions">
            <button className="tp-icon-btn" onClick={() => navigator.clipboard.writeText(task.id)} title="نسخ الرابط">🔗</button>
            <button className="tp-icon-btn" onClick={handleArchive} title="أرشفة">🗄️</button>
            <button className="tp-icon-btn danger" onClick={handleDelete} title="حذف">🗑</button>
            <button className="tp-close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="tp-body">

          {/* ════ MAIN ════ */}
          <div className="tp-col-main">

            {/* TASK HERO */}
            <div className="tp-hero">
              <div className="tp-hero-top">
                {/* Priority bar */}
                <div className="tp-priority-bar" style={{ background: priData.bar }} />

                {/* Meta row */}
                <div className="tp-meta-row">
                  <span className="tp-task-id">{task.id.slice(0, 8)}</span>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: stData.bg, color: stData.color }}>
                    {stData.lbl}
                  </span>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: priData.bg, color: priData.color }}>
                    {priData.lbl}
                  </span>
                </div>

                {/* Title */}
                <textarea
                  ref={textareaRef}
                  className="tp-title-input"
                  value={title}
                  rows={1}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = e.target.scrollHeight + 'px';
                  }}
                  onBlur={(e) => saveTitle(e.target.value)}
                  placeholder="عنوان المهمة..."
                />

                {/* Description */}
                <textarea
                  className="tp-desc-area"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  onBlur={(e) => saveDesc(e.target.value)}
                  placeholder="+ أضف وصفاً للمهمة..."
                  rows={3}
                />
              </div>

              {/* Progress section */}
              {subtasks.length > 0 && (
                <div className="tp-progress-section">
                  <div className="tp-prog-header">
                    <div className="tp-prog-title">✅ التقدم</div>
                    <div className="tp-prog-pct" style={{ color: priData.color }}>{stPct}%</div>
                  </div>
                  <div className="tp-prog-bar-big">
                    <div className="tp-prog-fill-big" style={{ width: `${stPct}%`, background: priData.bar }} />
                  </div>
                  <div className="tp-prog-sub">{stDone} من {subtasks.length} خطوات مكتملة</div>
                </div>
              )}
            </div>

            {/* SUBTASKS */}
            <div className="tp-section-card">
              <div className="tp-section-head">
                <div className="tp-section-icon" style={{ background: '#F0FFF4' }}>✅</div>
                <div className="tp-section-title">المهام الفرعية</div>
                <span className="tp-section-count">{stDone} / {subtasks.length}</span>
              </div>
              <div className="tp-subtask-list">
                {subtasks.map((st) => (
                  <div key={st.id} className="tp-subtask-item">
                    <div
                      className={`tp-sub-cb${st.done ? ' done' : ''}`}
                      onClick={() => toggleSubtask(st.id)}>
                      {st.done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span className={`tp-sub-text${st.done ? ' done' : ''}`}>{st.title}</span>
                    <button className="tp-sub-del" onClick={() => removeSubtask(st.id)}>✕</button>
                  </div>
                ))}
              </div>
              <div className="tp-add-subtask">
                <input
                  value={newSt}
                  onChange={(e) => setNewSt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addSubtask(); }}
                  placeholder="+ أضف خطوة... اضغط Enter"
                />
                <button className="tp-add-sub-btn" onClick={addSubtask}>+</button>
              </div>
            </div>

            {/* TAGS */}
            <div className="tp-section-card">
              <div className="tp-section-head">
                <div className="tp-section-icon" style={{ background: '#FEF3C7' }}>🏷️</div>
                <div className="tp-section-title">التصنيفات</div>
              </div>
              <div className="tp-tags-wrap">
                {tags.map((tag) => (
                  <span key={tag} className="tp-tag">
                    #{tag}
                    <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: '0 0 0 4px', fontSize: 10 }}>✕</button>
                  </span>
                ))}
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addTag(); }}
                  placeholder="+ تصنيف جديد"
                  className="tp-tag-input"
                />
              </div>
            </div>

            {/* LINKS */}
            <div className="tp-section-card">
              <div className="tp-section-head">
                <div className="tp-section-icon" style={{ background: '#EFF6FF' }}>🔗</div>
                <div className="tp-section-title">الروابط</div>
              </div>
              <div className="tp-links-list">
                {links.map((lnk) => (
                  <div key={lnk.id} className="tp-link-item">
                    <div className="tp-link-favicon">🔗</div>
                    <a href={lnk.url} target="_blank" rel="noreferrer" className="tp-link-text">{lnk.label}</a>
                    <button onClick={() => removeLink(lnk.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', fontSize: 10 }}>✕</button>
                  </div>
                ))}
              </div>
              {showLinkForm ? (
                <div style={{ padding: '8px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <input value={newLink.url} onChange={(e) => setNewLink((p) => ({ ...p, url: e.target.value }))} placeholder="https://..." className="tp-link-input" />
                  <input value={newLink.label} onChange={(e) => setNewLink((p) => ({ ...p, label: e.target.value }))} placeholder="التسمية (اختياري)" className="tp-link-input" />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" onClick={addLink}>إضافة</button>
                    <button className="btn btn-sm btn-plain" onClick={() => setShowLinkForm(false)}>إلغاء</button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '4px 16px 12px' }}>
                  <button onClick={() => setShowLinkForm(true)} style={{ background: 'none', border: 'none', fontFamily: 'inherit', fontSize: 12, color: 'var(--accent)', cursor: 'pointer', fontWeight: 600 }}>+ رابط جديد</button>
                </div>
              )}
            </div>

            {/* ACTIVITY */}
            <div className="tp-section-card">
              <div className="tp-section-head">
                <div className="tp-section-icon" style={{ background: '#FFF0F0' }}>💬</div>
                <div className="tp-section-title">النشاطات والملاحظات</div>
              </div>
              <div className="tp-activity-list">
                {activity.map((a) => (
                  <div key={a.id} className="tp-activity-item">
                    <div className="tp-activity-avatar">غ</div>
                    <div className="tp-activity-body">
                      <div className="tp-activity-text">{a.text}</div>
                      <div className="tp-activity-time">{a.ts}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="tp-add-comment">
                <div className="tp-comment-avatar">غ</div>
                <textarea
                  className="tp-comment-input"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addComment(); }}
                  placeholder="أضف ملاحظة أو تعليق... (Ctrl+Enter)"
                  rows={1}
                />
                <button className="tp-send-btn" onClick={addComment} disabled={!comment.trim()}>↑</button>
              </div>
            </div>

          </div>

          {/* ════ SIDEBAR ════ */}
          <div className="tp-col-side">

            {/* PROPERTIES */}
            <div className="tp-props-card">
              <div className="tp-props-head">⚙️ الخصائص</div>

              <div className="tp-prop-row">
                <div className="tp-prop-label">📋 الحالة</div>
                <div className="tp-prop-value">
                  <StatusDropdown value={status} onChange={changeStatus} />
                </div>
              </div>

              <div className="tp-prop-row">
                <div className="tp-prop-label">🎯 الأولوية</div>
                <div className="tp-prop-value">
                  <PriorityDropdown value={priority} onChange={changePriority} />
                </div>
              </div>

              <div className="tp-prop-row">
                <div className="tp-prop-label">📅 الموعد</div>
                <div className="tp-prop-value">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => changeDueDate(e.target.value)}
                    style={{
                      background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 8,
                      padding: '4px 8px', fontSize: 12, color: isDueOverdue() ? '#EF4444' : 'var(--txt)',
                      fontFamily: 'inherit', outline: 'none', width: '100%',
                    }}
                  />
                  {dueDate && <div style={{ fontSize: 11, color: isDueOverdue() ? '#EF4444' : 'var(--txt3)', marginTop: 2 }}>
                    {isDueOverdue() ? '⚠️ ' : '📅 '}{formatDue(dueDate)}
                  </div>}
                </div>
              </div>

            </div>

            {/* QUICK ACTIONS */}
            <div className="tp-quick-actions">
              <div className="tp-quick-head">الإجراءات</div>
              <button className="tp-qbtn done-btn" onClick={handleMarkDone}>
                <span>✅</span>
                <span>تم الإنجاز</span>
              </button>
              <button className="tp-qbtn" onClick={handlePostpone}>
                <span>📅</span>
                <span>تأجيل للغد</span>
              </button>
              <button className="tp-qbtn" onClick={handleArchive}>
                <span>🗄️</span>
                <span>أرشفة</span>
              </button>
              <button className="tp-qbtn danger" onClick={handleDelete}>
                <span>🗑</span>
                <span>حذف</span>
              </button>
            </div>

            {/* BRAND CARD */}
            {brand && (
              <div className="tp-brand-mini" style={{ borderColor: brand.color ? `${brand.color}40` : undefined }}>
                <div className="tp-brand-mini-avatar" style={{ background: `${brand.color}18`, borderColor: brand.color }}>
                  {(brand as BrandRow & { icon?: string }).icon || '🏷️'}
                </div>
                <div>
                  <div className="tp-brand-mini-name">{brand.name}</div>
                  {(brand as BrandRow & { description?: string }).description && (
                    <div className="tp-brand-mini-sub">{(brand as BrandRow & { description?: string }).description}</div>
                  )}
                </div>
                <div className="tp-brand-mini-arrow">←</div>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
