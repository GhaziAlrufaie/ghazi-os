'use client';
// TaskPanel — لوحة تفاصيل المهمة
// تصميم مطابق لـ task-detail-v2(1).html
// Layout: Side drawer — Main (hero+subtask-groups+tags+links+activity) + Sidebar (props+actions+brand)
import React, { useState, useEffect, useRef } from 'react';
import type { Task, TaskStatus, TaskPriority, SubtaskItem } from '@/lib/tasks-actions';
import { updateTask, archiveTask } from '@/lib/tasks-actions';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BrandRow { id: string; name: string; color: string; icon?: string; description?: string; }

interface ActivityItem {
  id: string;
  text: string;
  ts: string;
  type: 'action' | 'comment';
}

interface LinkItem { id: string; url: string; label: string; }

interface SubtaskGroup {
  id: string;
  name: string;
  collapsed: boolean;
  steps: SubtaskItem[];
}

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
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen((o) => !o)}
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
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen((o) => !o)}
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

// ─── GroupRing SVG ────────────────────────────────────────────────────────────
function GroupRing({ done, total }: { done: number; total: number }) {
  const r = 8;
  const circ = 2 * Math.PI * r; // ≈ 50.27
  const pct = total > 0 ? done / total : 0;
  const offset = circ * (1 - pct);
  const color = pct >= 1 ? '#22C55E' : pct > 0 ? '#F59E0B' : '#EDE0CC';
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r={r} fill="none" stroke="#EDE0CC" strokeWidth="2.5" />
      {total > 0 && (
        <circle cx="11" cy="11" r={r} fill="none" stroke={color} strokeWidth="2.5"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 11 11)" />
      )}
    </svg>
  );
}

// ─── SubtaskGroup Component ───────────────────────────────────────────────────
interface GroupProps {
  group: SubtaskGroup;
  newStepId: string | null;           // id of the step that needs auto-focus
  onToggleCollapse: (gid: string) => void;
  onRename: (gid: string, name: string) => void;
  onDelete: (gid: string) => void;
  onAddStep: (gid: string) => void;
  onToggleStep: (gid: string, sid: string) => void;
  onDeleteStep: (gid: string, sid: string) => void;
  onRenameStep: (gid: string, sid: string, title: string) => void;
}
function SubtaskGroupRow({ group, newStepId, onToggleCollapse, onRename, onDelete, onAddStep, onToggleStep, onDeleteStep, onRenameStep }: GroupProps) {
  const done = group.steps.filter((s) => s.done).length;
  const total = group.steps.length;
  return (
    <div className="sg-group">
      {/* Group header */}
      <div className="sg-header" onClick={() => onToggleCollapse(group.id)}>
        <div className="sg-arrow" style={{ transform: group.collapsed ? 'rotate(-90deg)' : 'rotate(0deg)' }}>▾</div>
        <GroupRing done={done} total={total} />
        <input
          className="sg-name"
          value={group.name}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onRename(group.id, e.target.value)}
        />
        <span className="sg-badge">{done}/{total}</span>
        <button className="sg-btn sg-add-step" onClick={(e) => { e.stopPropagation(); onAddStep(group.id); }} title="+ خطوة">+</button>
        <button className="sg-btn sg-del" onClick={(e) => { e.stopPropagation(); onDelete(group.id); }} title="حذف المجموعة">✕</button>
      </div>

      {/* Steps */}
      {!group.collapsed && (
        <div className="sg-steps">
          {group.steps.map((step, idx) => {
            const isLast = idx === group.steps.length - 1;
            const isNew = step.id === newStepId;
            return (
              <div key={step.id} className="sg-step-row">
                {/* Connector */}
                <div className="sg-conn">
                  <div className="sg-dot" />
                  <div className={`sg-line${isLast ? ' last' : ''}`} />
                </div>
                {/* Checkbox */}
                <div
                  className={`tp-sub-cb${step.done ? ' done' : ''}`}
                  onClick={() => !isNew && onToggleStep(group.id, step.id)}>
                  {step.done && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700 }}>✓</span>}
                </div>
                {/* Inline editable title */}
                <input
                  className={`sg-step-input${step.done ? ' done' : ''}`}
                  value={step.title}
                  autoFocus={isNew}
                  placeholder="اكتب الخطوة..."
                  onChange={(e) => onRenameStep(group.id, step.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    if (e.key === 'Escape') {
                      if (!step.title.trim()) onDeleteStep(group.id, step.id);
                      else (e.target as HTMLInputElement).blur();
                    }
                  }}
                  onBlur={() => { if (!step.title.trim()) onDeleteStep(group.id, step.id); }}
                />
                {/* Delete */}
                <button className="tp-sub-del" onClick={() => onDeleteStep(group.id, step.id)}>✕</button>
              </div>
            );
          })}
          {group.steps.length === 0 && (
            <div style={{ padding: '6px 18px 8px', fontSize: 11, color: 'var(--txt3)' }}>لا توجد خطوات — اضغط + لإضافة</div>
          )}
        </div>
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
  const [groups, setGroups]     = useState<SubtaskGroup[]>([]);
  const [newStepId, setNewStepId] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [comment, setComment]   = useState('');
  const [tags, setTags]         = useState<string[]>([]);
  const [newTag, setNewTag]     = useState('');
  const [links, setLinks]       = useState<LinkItem[]>([]);
  const [newLink, setNewLink]   = useState({ url: '', label: '' });
  const [showLinkForm, setShowLinkForm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ── Convert flat subtasks → one default group on load ──
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDesc(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ?? '');

    // Load groups from task.subtasks stored as JSON
    // Format: if subtasks is an array of SubtaskItem → wrap in default group
    // If subtasks contains a special marker, parse as groups
    const raw = Array.isArray(task.subtasks) ? task.subtasks : [];
    // Check if first item has __groups marker
    if (raw.length > 0 && (raw[0] as SubtaskItem & { __groups?: SubtaskGroup[] }).__groups) {
      setGroups((raw[0] as SubtaskItem & { __groups?: SubtaskGroup[] }).__groups ?? []);
    } else if (raw.length > 0) {
      // Migrate flat subtasks to a default group
      setGroups([{ id: 'g_default', name: 'الخطوات', collapsed: false, steps: raw }]);
    } else {
      setGroups([]);
    }

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
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!task) return null;

  // ── Derived stats ──
  const priData = PRI_OPTIONS.find((o) => o.v === priority) ?? PRI_OPTIONS[2];
  const stData  = STATUS_OPTIONS.find((o) => o.v === status) ?? STATUS_OPTIONS[0];
  const allSteps = groups.flatMap((g) => g.steps);
  const totalSteps = allSteps.length;
  const doneSteps  = allSteps.filter((s) => s.done).length;
  const stPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  function formatDue(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' });
  }
  function isDueOverdue(): boolean {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date() && status !== 'done';
  }

  // ── Persist groups to Supabase via subtasks field ──
  async function persistGroups(updated: SubtaskGroup[]) {
    // Store groups as: [{__groups: [...]}] — a single marker item
    const marker = [{ id: '__marker', title: '', done: false, __groups: updated }] as unknown as SubtaskItem[];
    await updateTask({ id: task!.id, subtasks: marker });
    onUpdate({ subtasks: marker });
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

  // ── Groups CRUD ──
  function addGroup() {
    const g: SubtaskGroup = { id: `g_${Date.now()}`, name: 'مجموعة جديدة', collapsed: false, steps: [] };
    const updated = [...groups, g];
    setGroups(updated);
    persistGroups(updated);
  }

  function toggleCollapse(gid: string) {
    setGroups((prev) => prev.map((g) => g.id === gid ? { ...g, collapsed: !g.collapsed } : g));
    // No need to persist collapse state
  }

  function renameGroup(gid: string, name: string) {
    const updated = groups.map((g) => g.id === gid ? { ...g, name } : g);
    setGroups(updated);
    persistGroups(updated);
  }

  function deleteGroup(gid: string) {
    const updated = groups.filter((g) => g.id !== gid);
    setGroups(updated);
    persistGroups(updated);
  }

  function addStep(gid: string) {
    const sid = `st_${Date.now()}`;
    const step: SubtaskItem = { id: sid, title: '', done: false };
    const updated = groups.map((g) => g.id === gid
      ? { ...g, collapsed: false, steps: [...g.steps, step] }
      : g
    );
    setGroups(updated);
    setNewStepId(sid);
    // Don't persist yet — will persist on blur/rename
  }

  function toggleStep(gid: string, sid: string) {
    const updated = groups.map((g) => g.id === gid
      ? { ...g, steps: g.steps.map((s) => s.id === sid ? { ...s, done: !s.done } : s) }
      : g
    );
    setGroups(updated);
    persistGroups(updated);
  }

  function renameStep(gid: string, sid: string, title: string) {
    const updated = groups.map((g) => g.id === gid
      ? { ...g, steps: g.steps.map((s) => s.id === sid ? { ...s, title } : s) }
      : g
    );
    setGroups(updated);
    persistGroups(updated);
  }

  function deleteStep(gid: string, sid: string) {
    const updated = groups.map((g) => g.id === gid
      ? { ...g, steps: g.steps.filter((s) => s.id !== sid) }
      : g
    );
    setGroups(updated);
    persistGroups(updated);
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
    const item: ActivityItem = { id: `act_${Date.now()}`, text: comment.trim(), ts: new Date().toLocaleString('ar-SA'), type: 'comment' };
    setActivity((prev) => [item, ...prev]);
    setComment('');
  }

  // ── Delete / Archive ──
  async function handleMarkDone() { await changeStatus('done'); }
  async function handlePostpone() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await changeDueDate(tomorrow.toISOString().split('T')[0]);
  }
  function handleDelete() {
    if (!confirm(`هل تريد حذف المهمة "${task!.title}"؟`)) return;
    onDelete(task!.id);
    onClose();
  }
  function handleArchive() { onArchive(task!); onClose(); }

  const brand = brands?.find((b) => b.id === task.brandId);

  return (
    <>
      <div className="task-panel-overlay on" onClick={onClose} />
      <div className="task-panel on" dir="rtl">

        {/* ── Header ── */}
        <div className="tp-header">
          <div className="tp-breadcrumb">
            <span style={{ cursor: 'pointer', color: 'var(--txt3)' }} onClick={onClose}>المهام</span>
            <span style={{ color: 'var(--txt3)' }}>›</span>
            <span style={{ color: 'var(--txt)', fontWeight: 600 }}>{title.slice(0, 35)}{title.length > 35 ? '...' : ''}</span>
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
                <div className="tp-priority-bar" style={{ background: priData.bar }} />
                <div className="tp-meta-row">
                  <span className="tp-task-id">{task.id.slice(0, 8)}</span>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: stData.bg, color: stData.color }}>{stData.lbl}</span>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: priData.bg, color: priData.color }}>{priData.lbl}</span>
                </div>
                <textarea ref={textareaRef} className="tp-title-input" value={title} rows={1}
                  onChange={(e) => { setTitle(e.target.value); e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                  onBlur={(e) => saveTitle(e.target.value)} placeholder="عنوان المهمة..." />
                <textarea className="tp-desc-area" value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  onBlur={(e) => saveDesc(e.target.value)}
                  placeholder="+ أضف وصفاً للمهمة..." rows={3} />
              </div>
              {totalSteps > 0 && (
                <div className="tp-progress-section">
                  <div className="tp-prog-header">
                    <div className="tp-prog-title">✅ التقدم</div>
                    <div className="tp-prog-pct" style={{ color: priData.color }}>{stPct}%</div>
                  </div>
                  <div className="tp-prog-bar-big">
                    <div className="tp-prog-fill-big" style={{ width: `${stPct}%`, background: priData.bar }} />
                  </div>
                  <div className="tp-prog-sub">{doneSteps} من {totalSteps} خطوات مكتملة</div>
                </div>
              )}
            </div>

            {/* SUBTASKS — GROUPED */}
            <div className="tp-section-card">
              <div className="tp-section-head">
                <div className="tp-section-icon" style={{ background: '#F0FFF4' }}>✅</div>
                <div className="tp-section-title">المهام الفرعية</div>
                <span className="tp-section-count">{doneSteps} / {totalSteps}</span>
                <button className="sg-add-group-btn" onClick={addGroup}>+ مجموعة</button>
              </div>
              <div style={{ padding: '8px 0' }}>
                {groups.map((group) => (
                  <SubtaskGroupRow
                    key={group.id}
                    group={group}
                    newStepId={newStepId}
                    onToggleCollapse={toggleCollapse}
                    onRename={renameGroup}
                    onDelete={deleteGroup}
                    onAddStep={addStep}
                    onToggleStep={toggleStep}
                    onDeleteStep={deleteStep}
                    onRenameStep={renameStep}
                  />
                ))}
                {groups.length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--txt3)', fontSize: 12 }}>
                    لا توجد مجموعات — اضغط "+ مجموعة" لإضافة
                  </div>
                )}
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
                <input value={newTag} onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addTag(); }}
                  placeholder="+ تصنيف جديد" className="tp-tag-input" />
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
                <textarea className="tp-comment-input" value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && e.ctrlKey) addComment(); }}
                  placeholder="أضف ملاحظة أو تعليق... (Ctrl+Enter)" rows={1} />
                <button className="tp-send-btn" onClick={addComment} disabled={!comment.trim()}>↑</button>
              </div>
            </div>

          </div>

          {/* ════ SIDEBAR ════ */}
          <div className="tp-col-side">

            <div className="tp-props-card">
              <div className="tp-props-head">⚙️ الخصائص</div>
              <div className="tp-prop-row">
                <div className="tp-prop-label">📋 الحالة</div>
                <div className="tp-prop-value"><StatusDropdown value={status} onChange={changeStatus} /></div>
              </div>
              <div className="tp-prop-row">
                <div className="tp-prop-label">🎯 الأولوية</div>
                <div className="tp-prop-value"><PriorityDropdown value={priority} onChange={changePriority} /></div>
              </div>
              <div className="tp-prop-row">
                <div className="tp-prop-label">📅 الموعد</div>
                <div className="tp-prop-value">
                  <input type="date" value={dueDate} onChange={(e) => changeDueDate(e.target.value)}
                    style={{ background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 8, padding: '4px 8px', fontSize: 12, color: isDueOverdue() ? '#EF4444' : 'var(--txt)', fontFamily: 'inherit', outline: 'none', width: '100%' }} />
                  {dueDate && <div style={{ fontSize: 11, color: isDueOverdue() ? '#EF4444' : 'var(--txt3)', marginTop: 2 }}>{isDueOverdue() ? '⚠️ ' : '📅 '}{formatDue(dueDate)}</div>}
                </div>
              </div>
            </div>

            <div className="tp-quick-actions">
              <div className="tp-quick-head">الإجراءات</div>
              <button className="tp-qbtn done-btn" onClick={handleMarkDone}><span>✅</span><span>تم الإنجاز</span></button>
              <button className="tp-qbtn" onClick={handlePostpone}><span>📅</span><span>تأجيل للغد</span></button>
              <button className="tp-qbtn" onClick={handleArchive}><span>🗄️</span><span>أرشفة</span></button>
              <button className="tp-qbtn danger" onClick={handleDelete}><span>🗑</span><span>حذف</span></button>
            </div>

            {brand && (
              <div className="tp-brand-mini" style={{ borderColor: brand.color ? `${brand.color}40` : undefined }}>
                <div className="tp-brand-mini-avatar" style={{ background: `${brand.color}18`, borderColor: brand.color }}>
                  {brand.icon || '🏷️'}
                </div>
                <div>
                  <div className="tp-brand-mini-name">{brand.name}</div>
                  {brand.description && <div className="tp-brand-mini-sub">{brand.description}</div>}
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
