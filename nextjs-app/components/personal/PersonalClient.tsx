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
  restorePersonalTask,
  type PersonalTask,
  type TaskStatus,
  type TaskPriority,
  type TaskCategory,
} from '@/lib/personal-actions';
import { useGlobal } from '@/components/GlobalProviders';

// ─── Constants ────────────────────────────────────────────────────────────────
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
const DEFAULT_CATEGORIES: { id: TaskCategory; label: string; emoji: string }[] = [
  { id: 'personal',    label: 'شخصي',        emoji: '👤' },
  { id: 'health',      label: 'صحة',          emoji: '💪' },
  { id: 'family',      label: 'عائلة',        emoji: '👨‍👩‍👧' },
  { id: 'development', label: 'تطوير ذاتي',   emoji: '📚' },
  { id: 'financial',   label: 'مالي',         emoji: '💰' },
  { id: 'ideas',       label: 'أفكار',        emoji: '💡' },
];

interface Props { initialTasks: PersonalTask[] }
interface QuickAdd { colId: TaskStatus; title: string; category: TaskCategory }

// ─── PriorityPicker ───────────────────────────────────────────────────────────
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

// ─── TaskCard ─────────────────────────────────────────────────────────────────
function TaskCard({ task, index, categories, onDelete, onArchive, onEdit, onClick }: {
  task: PersonalTask; index: number;
  categories: { id: TaskCategory; label: string; emoji: string }[];
  onDelete: (id: string) => void;
  onArchive: (t: PersonalTask) => void;
  onEdit: (t: PersonalTask) => void;
  onClick: (t: PersonalTask) => void;
}) {
  const pm = PRIORITY_META[task.priority];
  const cat = categories.find((c) => c.id === task.category);
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          style={{
            ...provided.draggableProps.style,
            background: 'var(--card)', border: `1px solid ${snapshot.isDragging ? 'var(--gold-b)' : 'var(--brd)'}`,
            borderRadius: 12, padding: '10px 12px', boxShadow: snapshot.isDragging ? '0 8px 20px rgba(0,0,0,0.12)' : 'none',
            transition: 'border-color .15s', cursor: 'pointer',
          }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
            <p style={{ fontSize: 13, color: 'var(--txt)', flex: 1, lineHeight: 1.5, margin: 0 }}>{task.title}</p>
            <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
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

// ─── AddTaskModal ─────────────────────────────────────────────────────────────
function AddTaskModal({ categories, defaultStatus, onClose, onAdd }: {
  categories: { id: TaskCategory; label: string; emoji: string }[];
  defaultStatus: TaskStatus;
  onClose: () => void;
  onAdd: (task: PersonalTask) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [category, setCategory] = useState<TaskCategory>('personal');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const result = await addPersonalTask({ title: title.trim(), status, priority, category });
    if (result.task) {
      // update description and dueDate if provided
      if (description.trim() || dueDate) {
        await updatePersonalTask({ id: result.task.id, description: description.trim() || undefined, dueDate: dueDate || null });
        onAdd({ ...result.task, description: description.trim(), dueDate: dueDate || null, hasDescription: !!description.trim() });
      } else {
        onAdd(result.task);
      }
    }
    setSaving(false);
    onClose();
  }

  const inputStyle: React.CSSProperties = { width: '100%', background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 10 };

  return (
    <div className="modal-bg on" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>+ مهمة شخصية جديدة</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="عنوان المهمة *" autoFocus />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
          style={{ ...inputStyle, resize: 'none', height: 70 }} placeholder="الوصف (اختياري)" />

        {/* Status */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 5 }}>الحالة</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {COLUMNS.map((col) => (
              <button key={col.id} onClick={() => setStatus(col.id)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 10, border: `1px solid ${status === col.id ? col.color : 'var(--brd)'}`, background: status === col.id ? col.color + '20' : 'transparent', color: status === col.id ? col.color : 'var(--txt3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: status === col.id ? 700 : 400 }}>
                {col.label}
              </button>
            ))}
          </div>
        </div>

        {/* Priority */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 5 }}>الأولوية</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PRIORITIES.map((p) => (
              <button key={p} onClick={() => setPriority(p)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 10, border: `1px solid ${priority === p ? PRIORITY_META[p].color : 'var(--brd)'}`, background: priority === p ? PRIORITY_META[p].bg : 'transparent', color: priority === p ? PRIORITY_META[p].color : 'var(--txt3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: priority === p ? 700 : 400 }}>
                {PRIORITY_META[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 5 }}>الفئة</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {categories.map((c) => (
              <button key={c.id} onClick={() => setCategory(c.id)}
                style={{ fontSize: 11, padding: '4px 10px', borderRadius: 10, border: `1px solid ${category === c.id ? 'var(--gold-b)' : 'var(--brd)'}`, background: category === c.id ? 'var(--gold-dim)' : 'transparent', color: category === c.id ? 'var(--gold)' : 'var(--txt3)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: category === c.id ? 700 : 400 }}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 5 }}>تاريخ الاستحقاق (اختياري)</div>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ ...inputStyle, marginBottom: 0 }} />
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 16px', fontSize: 13, color: 'var(--txt3)', background: 'none', border: '1px solid var(--brd)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
          <button onClick={handleSave} disabled={!title.trim() || saving}
            style={{ padding: '7px 18px', fontSize: 13, background: title.trim() ? 'var(--gold)' : 'var(--brd)', color: title.trim() ? '#fff' : 'var(--txt3)', border: 'none', borderRadius: 8, cursor: title.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 700 }}>
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TaskPanel (Side Panel) ───────────────────────────────────────────────────
function TaskPanel({ task, categories, onClose, onUpdate, onDelete, onArchive }: {
  task: PersonalTask;
  categories: { id: TaskCategory; label: string; emoji: string }[];
  onClose: () => void;
  onUpdate: (patch: Partial<PersonalTask>) => void;
  onDelete: (id: string) => void;
  onArchive: (t: PersonalTask) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [dueDate, setDueDate] = useState(task.dueDate ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    const patch = { title, description, status, priority, category, dueDate: dueDate || null };
    await updatePersonalTask({ id: task.id, ...patch });
    onUpdate(patch);
    setSaving(false);
    onClose();
  }

  const chipStyle = (active: boolean, color: string, bg: string): React.CSSProperties => ({
    fontSize: 11, padding: '3px 9px', borderRadius: 10, border: `1px solid ${active ? color : 'var(--brd)'}`,
    background: active ? bg : 'transparent', color: active ? color : 'var(--txt3)',
    cursor: 'pointer', fontFamily: 'inherit', fontWeight: active ? 700 : 400,
  });

  return (
    <>
      {/* Overlay */}
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.25)' }} />
      {/* Panel */}
      <div style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 380, zIndex: 50, background: 'var(--bg)', borderRight: '1px solid var(--brd)', boxShadow: '4px 0 24px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--brd)', flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>تفاصيل المهمة</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {/* Title */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 4 }}>العنوان</div>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 8, padding: '8px 10px', fontSize: 14, fontWeight: 600, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          {/* Description */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 4 }}>الوصف</div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit', resize: 'none', height: 80, boxSizing: 'border-box' }}
              placeholder="أضف وصفاً..." />
          </div>
          {/* Status */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 6 }}>الحالة</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {COLUMNS.map((col) => (
                <button key={col.id} onClick={() => setStatus(col.id)}
                  style={chipStyle(status === col.id, col.color, col.color + '20')}>
                  {col.label}
                </button>
              ))}
            </div>
          </div>
          {/* Priority */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 6 }}>الأولوية</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {PRIORITIES.map((p) => (
                <button key={p} onClick={() => setPriority(p)}
                  style={chipStyle(priority === p, PRIORITY_META[p].color, PRIORITY_META[p].bg)}>
                  {PRIORITY_META[p].label}
                </button>
              ))}
            </div>
          </div>
          {/* Category */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 6 }}>الفئة</div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {categories.map((c) => (
                <button key={c.id} onClick={() => setCategory(c.id)}
                  style={chipStyle(category === c.id, 'var(--gold)', 'var(--gold-dim)')}>
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>
          {/* Due Date */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 4 }}>تاريخ الاستحقاق</div>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          {/* Danger Zone */}
          <div style={{ borderTop: '1px solid var(--brd)', paddingTop: 14, display: 'flex', gap: 8 }}>
            <button onClick={() => { onArchive(task); onClose(); }}
              style={{ flex: 1, padding: '7px 0', fontSize: 12, background: 'rgba(234,179,8,0.08)', color: '#ca8a04', border: '1px solid rgba(234,179,8,0.2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
              📦 أرشفة
            </button>
            <button onClick={() => { if (confirm('حذف هذه المهمة؟')) { onDelete(task.id); onClose(); } }}
              style={{ flex: 1, padding: '7px 0', fontSize: 12, background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
              🗑 حذف
            </button>
          </div>
        </div>
        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--brd)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px 0', fontSize: 13, color: 'var(--txt3)', background: 'none', border: '1px solid var(--brd)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 2, padding: '8px 0', fontSize: 13, background: 'var(--gold)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </>
  );
}

// ─── AddCategoryModal ─────────────────────────────────────────────────────────
const EMOJI_OPTIONS = ['🏃', '🧘', '📖', '💼', '🎯', '🌟', '🔥', '💡', '🎨', '🏋️', '🍎', '✈️', '🎵', '🌱', '💻'];
function AddCategoryModal({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (cat: { id: TaskCategory; label: string; emoji: string }) => void;
}) {
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  return (
    <div className="modal-bg on" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>+ فئة جديدة</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txt3)', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 4 }}>اسم الفئة</div>
          <input value={label} onChange={(e) => setLabel(e.target.value)} autoFocus
            style={{ width: '100%', background: 'var(--bg2)', border: '1px solid var(--brd)', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: 'var(--txt)', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            placeholder="مثال: رياضة، قراءة..." />
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 6 }}>الإيموجي</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {EMOJI_OPTIONS.map((e) => (
              <button key={e} onClick={() => setEmoji(e)}
                style={{ fontSize: 18, padding: '4px 6px', borderRadius: 8, border: `2px solid ${emoji === e ? 'var(--gold)' : 'transparent'}`, background: emoji === e ? 'var(--gold-dim)' : 'var(--bg2)', cursor: 'pointer' }}>
                {e}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '7px 14px', fontSize: 13, color: 'var(--txt3)', background: 'none', border: '1px solid var(--brd)', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>إلغاء</button>
          <button onClick={() => {
            if (!label.trim()) return;
            const id = label.trim().toLowerCase().replace(/\s+/g, '_') as TaskCategory;
            onAdd({ id, label: label.trim(), emoji });
            onClose();
          }} disabled={!label.trim()}
            style={{ padding: '7px 16px', fontSize: 13, background: label.trim() ? 'var(--gold)' : 'var(--brd)', color: label.trim() ? '#fff' : 'var(--txt3)', border: 'none', borderRadius: 8, cursor: label.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit', fontWeight: 700 }}>
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── EditModal ────────────────────────────────────────────────────────────────
function EditModal({ task, categories, onSave, onClose }: {
  task: PersonalTask;
  categories: { id: TaskCategory; label: string; emoji: string }[];
  onSave: (patch: Partial<PersonalTask>) => void;
  onClose: () => void;
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
          {categories.map((c) => (
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PersonalClient({ initialTasks }: Props) {
  const { pushUndo } = useGlobal();
  const [tasks, setTasks] = useState<PersonalTask[]>(initialTasks);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all');
  const [quickAdd, setQuickAdd] = useState<QuickAdd | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [editingTask, setEditingTask] = useState<PersonalTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [addTaskDefaultStatus, setAddTaskDefaultStatus] = useState<TaskStatus>('todo');
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
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    startTransition(async () => { await deletePersonalTask(id); });
    pushUndo({
      label: `حذف "${task.title}"`,
      undo: async () => {
        await restorePersonalTask(task);
        setTasks((prev) => [...prev, task]);
      },
    });
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

  function handlePanelUpdate(patch: Partial<PersonalTask>) {
    if (!selectedTask) return;
    setTasks((prev) => prev.map((t) => t.id === selectedTask.id ? { ...t, ...patch } : t));
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
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAddCategory(true)}
            style={{ fontSize: 12, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--brd)', background: 'transparent', color: 'var(--txt3)', cursor: 'pointer', fontFamily: 'inherit' }}>
            + فئة
          </button>
          <button onClick={() => { setAddTaskDefaultStatus('todo'); setShowAddTask(true); }}
            style={{ fontSize: 12, padding: '6px 14px', borderRadius: 8, border: 'none', background: 'var(--gold)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>
            + مهمة
          </button>
        </div>
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
        {categories.map((c) => {
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
                    setAddTaskDefaultStatus(col.id);
                    setShowAddTask(true);
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
                        <TaskCard key={task.id} task={task} index={index} categories={categories}
                          onDelete={handleDelete} onArchive={handleArchive} onEdit={setEditingTask}
                          onClick={setSelectedTask} />
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

      {/* Modals & Panels */}
      {showAddTask && (
        <AddTaskModal
          categories={categories}
          defaultStatus={addTaskDefaultStatus}
          onClose={() => setShowAddTask(false)}
          onAdd={(task) => setTasks((prev) => [...prev, task])}
        />
      )}
      {showAddCategory && (
        <AddCategoryModal
          onClose={() => setShowAddCategory(false)}
          onAdd={(cat) => setCategories((prev) => [...prev, cat])}
        />
      )}
      {editingTask && (
        <EditModal task={editingTask} categories={categories} onSave={handleSaveEdit} onClose={() => setEditingTask(null)} />
      )}
      {selectedTask && (
        <TaskPanel
          task={selectedTask}
          categories={categories}
          onClose={() => setSelectedTask(null)}
          onUpdate={handlePanelUpdate}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      )}
    </div>
  );
}
