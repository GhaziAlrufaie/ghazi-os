'use client';
// PersonalClient — VIP Kanban (mirrors Brands page design)
import React, { useState, useRef, useEffect, useTransition, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import type { PersonalTask, TaskStatus, TaskPriority, TaskCategory } from '@/lib/personal-actions';
import {
  addPersonalTask,
  updatePersonalTask,
  deletePersonalTask,
  restorePersonalTask,
  archivePersonalTask,
} from '@/lib/personal-actions';
import { useGlobal } from '@/components/GlobalProviders';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLUMNS: { id: TaskStatus; name: string; emoji: string; color: string }[] = [
  { id: 'todo',        name: 'قيد الانتظار', emoji: '📥', color: '#3B82F6' },
  { id: 'in_progress', name: 'جاري التنفيذ', emoji: '🚀', color: '#F97316' },
  { id: 'on_hold',     name: 'معلق',          emoji: '✋', color: '#8B5CF6' },
  { id: 'done',        name: 'منجز',          emoji: '✅', color: '#10B981' },
];

const PRIORITY_META: Record<TaskPriority, { label: string; bg: string; color: string }> = {
  critical: { label: '🔴 حرج',    bg: '#FEF2F2', color: '#DC2626' },
  high:     { label: '🟠 عالي',   bg: '#FFF7ED', color: '#EA580C' },
  medium:   { label: '🟡 متوسط',  bg: '#FEFCE8', color: '#CA8A04' },
  low:      { label: '⬇️ منخفض', bg: '#F0FDF4', color: '#16A34A' },
};
const PRIORITIES: TaskPriority[] = ['critical', 'high', 'medium', 'low'];

const DEFAULT_CATEGORIES: { id: TaskCategory; label: string; emoji: string }[] = [
  { id: 'personal',    label: 'شخصي',      emoji: '👤' },
  { id: 'health',      label: 'صحة',        emoji: '💪' },
  { id: 'family',      label: 'عائلة',      emoji: '👨‍👩‍👧' },
  { id: 'development', label: 'تطوير ذاتي', emoji: '📚' },
  { id: 'financial',   label: 'مالي',       emoji: '💰' },
  { id: 'ideas',       label: 'أفكار',      emoji: '💡' },
];

// ─── PriorityPicker ───────────────────────────────────────────────────────────
function PriorityPicker({ onSelect, onCancel }: { onSelect: (p: TaskPriority) => void; onCancel: () => void }) {
  useEffect(() => {
    const t = setTimeout(onCancel, 10000);
    return () => clearTimeout(t);
  }, [onCancel]);
  return (
    <div style={{ position: 'absolute', zIndex: 30, bottom: 'calc(100% + 6px)', right: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 10, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 140 }}>
      <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 2, textAlign: 'center' }}>اختر الأولوية</div>
      {PRIORITIES.map((p) => {
        const m = PRIORITY_META[p];
        return (
          <button key={p} onClick={() => onSelect(p)} style={{ fontSize: 13, padding: '8px 14px', borderRadius: 10, border: 'none', background: m.bg, color: m.color, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right' }}>
            {m.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── VIP Task Card ────────────────────────────────────────────────────────────
function VIPTaskCard({ task, index, categories, onClick }: {
  task: PersonalTask; index: number;
  categories: { id: TaskCategory; label: string; emoji: string }[];
  onClick: (t: PersonalTask) => void;
}) {
  const pm = PRIORITY_META[task.priority];
  const cat = categories.find((c) => c.id === task.category);
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
          onClick={() => onClick(task)}
          className={`vip-task-card${snapshot.isDragging ? ' dragging' : ''}`}
          style={{ ...provided.draggableProps.style }}
        >
          <div className="vip-task-title">{task.title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
            <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: pm.bg, color: pm.color, fontWeight: 700 }}>{pm.label}</span>
            {cat && <span style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>{cat.emoji} {cat.label}</span>}
            {task.hasDescription && <span style={{ fontSize: 11, color: '#94A3B8' }}>📝</span>}
            {task.dueDate && (
              <span style={{ fontSize: 11, padding: '3px 9px', borderRadius: 20, background: isOverdue ? '#FEF2F2' : '#F0FDF4', color: isOverdue ? '#DC2626' : '#16A34A', fontWeight: 700 }}>
                {isOverdue ? `⚠️ متأخر` : `🗓 ${task.dueDate}`}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

// ─── VIP QuickAdd ─────────────────────────────────────────────────────────────
function VIPQuickAdd({ colId, defaultCategory, onAdd }: {
  colId: TaskStatus;
  defaultCategory: TaskCategory;
  onAdd: (title: string, priority: TaskPriority) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && value.trim()) setShowPicker(true);
    else if (e.key === 'Escape') { setIsOpen(false); setValue(''); setShowPicker(false); }
  }

  function handleSelect(p: TaskPriority) {
    if (!value.trim()) return;
    onAdd(value.trim(), p);
    setValue(''); setIsOpen(false); setShowPicker(false);
  }

  if (!isOpen) {
    return (
      <button className="vip-add-task-btn" onClick={() => setIsOpen(true)}>
        + إضافة مهمة جديدة
      </button>
    );
  }
  return (
    <div style={{ position: 'relative', marginTop: 8 }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="اسم المهمة ثم Enter..."
        style={{ width: '100%', background: '#fff', border: '2px solid #EA580C', borderRadius: 12, padding: '10px 14px', fontSize: 14, color: '#1E293B', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', boxShadow: '0 0 0 4px rgba(234,88,12,0.08)' }}
      />
      {showPicker && <PriorityPicker onSelect={handleSelect} onCancel={() => { setIsOpen(false); setValue(''); setShowPicker(false); }} />}
    </div>
  );
}

// ─── Personal Task Modal ──────────────────────────────────────────────────────
interface ChecklistItem { id: string; text: string; isCompleted: boolean; }
interface ChecklistGroup { id: string; title: string; items: ChecklistItem[]; }

function PersonalTaskModal({ task, categories, onClose, onUpdate, onDelete, onArchive }: {
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
  const [groups, setGroups] = useState<ChecklistGroup[]>([]);
  const [newGroupTitle, setNewGroupTitle] = useState('');
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});

  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  const doneItems = groups.reduce((s, g) => s + g.items.filter(i => i.isCompleted).length, 0);
  const progressPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  async function save() {
    setSaving(true);
    const patch: Partial<PersonalTask> = { title, description, status, priority, category, dueDate: dueDate || null };
    onUpdate(patch);
    await updatePersonalTask({ id: task.id, title, description, status, priority, category, dueDate: dueDate || null });
    setSaving(false);
  }

  function toggleItem(groupId: string, itemId: string) {
    setGroups(prev => prev.map(g => g.id !== groupId ? g : {
      ...g, items: g.items.map(i => i.id !== itemId ? i : { ...i, isCompleted: !i.isCompleted })
    }));
  }

  function addGroup() {
    if (!newGroupTitle.trim()) return;
    const g: ChecklistGroup = { id: `g_${Date.now()}`, title: newGroupTitle.trim(), items: [] };
    setGroups(prev => [...prev, g]);
    setNewGroupTitle('');
  }

  function addItem(groupId: string) {
    const text = newItemTexts[groupId]?.trim();
    if (!text) return;
    const item: ChecklistItem = { id: `i_${Date.now()}`, text, isCompleted: false };
    setGroups(prev => prev.map(g => g.id !== groupId ? g : { ...g, items: [...g.items, item] }));
    setNewItemTexts(prev => ({ ...prev, [groupId]: '' }));
  }

  const pm = PRIORITY_META[priority];
  const cat = categories.find(c => c.id === category);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#FFFFFF', borderRadius: 24, width: '100%', maxWidth: 1000, maxHeight: '90vh', overflow: 'hidden', display: 'flex', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
        {/* Left: Main Content */}
        <div style={{ flex: 1, padding: 32, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Title */}
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>عنوان المهمة</div>
            <textarea value={title} onChange={e => setTitle(e.target.value)} rows={2}
              style={{ width: '100%', fontSize: 20, fontWeight: 900, color: '#0F172A', border: 'none', outline: 'none', resize: 'none', fontFamily: 'inherit', background: 'transparent', lineHeight: 1.4 }} />
          </div>
          {/* Description */}
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>الوصف</div>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="أضف وصفاً للمهمة..."
              style={{ width: '100%', fontSize: 14, color: '#475569', border: '1px solid #E2E8F0', borderRadius: 12, padding: '12px 16px', outline: 'none', resize: 'vertical', fontFamily: 'inherit', background: '#F8FAFC', lineHeight: 1.6 }} />
          </div>
          {/* Checklists */}
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>قوائم المراجعة</div>
            {groups.map(group => (
              <div key={group.id} style={{ marginBottom: 20, background: '#F8FAFC', borderRadius: 16, padding: 16 }}>
                <h5 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 900, color: '#475569', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#EA580C' }}>❖</span> {group.title}
                </h5>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.items.map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', padding: '10px 14px', borderRadius: 10, border: `1px solid ${item.isCompleted ? '#86EFAC' : '#E2E8F0'}`, opacity: item.isCompleted ? 0.6 : 1 }}>
                      <input type="checkbox" checked={item.isCompleted} onChange={() => toggleItem(group.id, item.id)} style={{ width: 18, height: 18, accentColor: '#10B981', cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 700, color: item.isCompleted ? '#94A3B8' : '#1E293B', textDecoration: item.isCompleted ? 'line-through' : 'none', flex: 1 }}>{item.text}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <input value={newItemTexts[group.id] ?? ''} onChange={e => setNewItemTexts(prev => ({ ...prev, [group.id]: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') addItem(group.id); }}
                    placeholder="+ خطوة جديدة..."
                    style={{ flex: 1, fontSize: 13, padding: '8px 12px', borderRadius: 10, border: '1px dashed #CBD5E1', outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
                  <button onClick={() => addItem(group.id)} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#EA580C', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>+</button>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newGroupTitle} onChange={e => setNewGroupTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addGroup(); }}
                placeholder="+ إضافة مجموعة جديدة..."
                style={{ flex: 1, fontSize: 13, padding: '10px 14px', borderRadius: 12, border: '1px dashed #CBD5E1', outline: 'none', fontFamily: 'inherit', background: '#F8FAFC' }} />
              <button onClick={addGroup} style={{ padding: '10px 16px', borderRadius: 12, border: 'none', background: '#1E293B', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 13 }}>+ مجموعة</button>
            </div>
          </div>
          {/* Save */}
          <button onClick={save} disabled={saving}
            style={{ padding: '14px 24px', borderRadius: 14, border: 'none', background: saving ? '#94A3B8' : '#EA580C', color: '#fff', fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 15, fontFamily: 'inherit' }}>
            {saving ? 'جارٍ الحفظ...' : '💾 حفظ التغييرات'}
          </button>
        </div>
        {/* Right: Sidebar */}
        <div style={{ width: 260, background: '#F8FAFC', borderRight: '1px solid #E2E8F0', padding: 24, display: 'flex', flexDirection: 'column', gap: 20, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A' }}>تفاصيل المهمة</div>
            <button onClick={onClose} style={{ background: '#E2E8F0', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>
          {/* Progress */}
          {totalItems > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>التقدم</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#EA580C' }}>{doneItems}/{totalItems}</span>
              </div>
              <div style={{ height: 8, background: '#E2E8F0', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: '#EA580C', borderRadius: 100, width: `${progressPct}%`, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}
          {/* Status */}
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 6 }}>الحالة</div>
            <select value={status} onChange={e => setStatus(e.target.value as TaskStatus)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#fff', cursor: 'pointer' }}>
              {COLUMNS.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          {/* Priority */}
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 6 }}>الأولوية</div>
            <select value={priority} onChange={e => setPriority(e.target.value as TaskPriority)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: pm.bg, color: pm.color, cursor: 'pointer' }}>
              {PRIORITIES.map(p => <option key={p} value={p}>{PRIORITY_META[p].label}</option>)}
            </select>
          </div>
          {/* Category */}
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 6 }}>الفئة</div>
            <select value={category} onChange={e => setCategory(e.target.value as TaskCategory)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 700, fontFamily: 'inherit', background: '#fff', cursor: 'pointer' }}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
            </select>
          </div>
          {/* Due Date */}
          <div>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700, marginBottom: 6 }}>الموعد النهائي</div>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: 'inherit', background: '#fff', cursor: 'pointer' }} />
          </div>
          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 'auto' }}>
            <button onClick={() => { onArchive(task); onClose(); }}
              style={{ padding: '10px', borderRadius: 10, border: '1px solid #E2E8F0', background: '#fff', color: '#475569', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              📦 أرشفة
            </button>
            <button onClick={() => { if (window.confirm('هل أنت متأكد من حذف هذه المهمة نهائياً؟')) { onDelete(task.id); onClose(); } }}
              style={{ padding: '10px', borderRadius: 10, border: '1px solid #FCA5A5', background: '#FEF2F2', color: '#DC2626', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
              🗑️ حذف نهائياً
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { initialTasks: PersonalTask[] }

export default function PersonalClient({ initialTasks }: Props) {
  const { pushUndo } = useGlobal();
  const [tasks, setTasks] = useState<PersonalTask[]>(initialTasks);
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<PersonalTask | null>(null);
  const [, startTransition] = useTransition();

  const filteredTasks = useMemo(() =>
    activeCategory === 'all' ? tasks : tasks.filter(t => t.category === activeCategory),
    [tasks, activeCategory]
  );

  function handleAdd(colId: TaskStatus, title: string, priority: TaskPriority) {
    const defaultCat: TaskCategory = activeCategory === 'all' ? 'personal' : activeCategory;
    const tempId = `temp_${Date.now()}`;
    const tempTask: PersonalTask = { id: tempId, title, description: '', status: colId, priority, category: defaultCat, dueDate: null, sortOrder: 0, hasDescription: false };
    setTasks(prev => [...prev, tempTask]);
    startTransition(async () => {
      const result = await addPersonalTask({ title, status: colId, priority, category: defaultCat });
      if (result.task) setTasks(prev => prev.map(t => t.id === tempId ? result.task! : t));
      else setTasks(prev => prev.filter(t => t.id !== tempId));
    });
  }

  function handleDelete(id: string) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    setTasks(prev => prev.filter(t => t.id !== id));
    startTransition(async () => { await deletePersonalTask(id); });
    pushUndo({
      label: `حذف "${task.title}"`,
      undo: async () => { await restorePersonalTask(task); setTasks(prev => [...prev, task]); },
    });
  }

  function handleArchive(task: PersonalTask) {
    setTasks(prev => prev.filter(t => t.id !== task.id));
    startTransition(async () => { await archivePersonalTask(task); });
  }

  function handleUpdate(patch: Partial<PersonalTask>) {
    if (!selectedTask) return;
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? { ...t, ...patch } : t));
    setSelectedTask(prev => prev ? { ...prev, ...patch } : prev);
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return;
    const { draggableId, source, destination } = result;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const newStatus = destination.droppableId as TaskStatus;
    setTasks(prev => prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t));
    startTransition(async () => { await updatePersonalTask({ id: draggableId, status: newStatus }); });
  }

  const tasksByStatus = (status: TaskStatus) =>
    filteredTasks.filter(t => t.status === status).sort((a, b) => a.sortOrder - b.sortOrder);

  const defaultCat: TaskCategory = activeCategory === 'all' ? 'personal' : activeCategory;

  return (
    <div style={{ padding: '28px 24px 24px', height: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* VIP Header */}
      <div className="vip-brand-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ background: '#EFF6FF', padding: 12, borderRadius: 12, fontSize: 24 }}>👤</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: '#0F172A' }}>المهام الشخصية</h2>
            <div style={{ fontSize: 13, color: '#64748B', fontWeight: 600, marginTop: 2 }}>
              {tasks.length} مهمة · {tasks.filter(t => t.status === 'done').length} منجزة
            </div>
          </div>
        </div>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setActiveCategory('all')}
            style={{ background: activeCategory === 'all' ? '#1E293B' : '#F8FAFC', color: activeCategory === 'all' ? '#fff' : '#475569', padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 800, border: activeCategory === 'all' ? 'none' : '1px solid #E2E8F0', cursor: 'pointer', fontFamily: 'inherit' }}>
            الكل ({tasks.length})
          </button>
          {categories.map(c => {
            const count = tasks.filter(t => t.category === c.id).length;
            const isActive = activeCategory === c.id;
            return (
              <button key={c.id} onClick={() => setActiveCategory(c.id)}
                style={{ background: isActive ? '#1E293B' : '#F8FAFC', color: isActive ? '#fff' : '#475569', padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 800, border: isActive ? 'none' : '1px solid #E2E8F0', cursor: 'pointer', fontFamily: 'inherit' }}>
                {c.emoji} {c.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* VIP Kanban Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="vip-kanban-board" style={{ flex: 1 }}>
          {COLUMNS.map(col => {
            const colTasks = tasksByStatus(col.id);
            return (
              <div key={col.id} className="vip-kanban-column">
                {/* Column Header */}
                <div className="vip-column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{col.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#1E293B' }}>{col.name}</span>
                  </div>
                  <span style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid #FED7AA', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 800 }}>{colTasks.length}</span>
                </div>
                {/* Tasks Container */}
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef} {...provided.droppableProps}
                      className="vip-tasks-container"
                      style={{ background: snapshot.isDraggingOver ? 'rgba(234,88,12,0.04)' : 'transparent', border: snapshot.isDraggingOver ? '1px dashed rgba(234,88,12,0.3)' : '1px dashed transparent', borderRadius: 12, transition: 'all 0.2s' }}
                    >
                      {colTasks.map((task, index) => (
                        <VIPTaskCard key={task.id} task={task} index={index} categories={categories} onClick={setSelectedTask} />
                      ))}
                      {provided.placeholder}
                      {colTasks.length === 0 && !snapshot.isDraggingOver && (
                        <div style={{ textAlign: 'center', color: '#CBD5E1', fontSize: 13, padding: '24px 0', border: '1px dashed #E2E8F0', borderRadius: 12 }}>لا توجد مهام</div>
                      )}
                    </div>
                  )}
                </Droppable>
                {/* Inline QuickAdd */}
                <VIPQuickAdd colId={col.id} defaultCategory={defaultCat} onAdd={(title, priority) => handleAdd(col.id, title, priority)} />
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Task Modal */}
      {selectedTask && (
        <PersonalTaskModal
          task={selectedTask}
          categories={categories}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onArchive={handleArchive}
        />
      )}
    </div>
  );
}
