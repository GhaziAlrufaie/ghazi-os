'use client';
// TaskPanel — VIP Premium 2-Column Modal (Notion/Linear Style)
import React, { useState, useEffect } from 'react';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';
import { updateTask } from '@/lib/tasks-actions';

interface ChecklistItem { id: string; text: string; isCompleted: boolean; }
interface ChecklistGroup { id: string; title: string; items: ChecklistItem[]; }

const STATUS_OPTIONS: { v: TaskStatus; lbl: string; bg: string; color: string }[] = [
  { v: 'todo',        lbl: 'قيد الانتظار',  bg: '#EFF6FF', color: '#1D4ED8' },
  { v: 'in_progress', lbl: 'جاري التنفيذ',  bg: '#FFF7ED', color: '#C2410C' },
  { v: 'on_hold',     lbl: 'معلق',           bg: '#FDF4FF', color: '#7E22CE' },
  { v: 'done',        lbl: '✅ منجز',        bg: '#F0FDF4', color: '#166534' },
  { v: 'ideas',       lbl: '💡 أفكار',       bg: '#F5F3FF', color: '#6D28D9' },
  { v: 'projects',    lbl: '🚀 مشاريع',      bg: '#F0F9FF', color: '#0369A1' },
];
const PRIORITY_OPTIONS: { v: TaskPriority; lbl: string; bg: string; color: string }[] = [
  { v: 'critical', lbl: '🔴 حرج',    bg: '#FEF2F2', color: '#DC2626' },
  { v: 'high',     lbl: '🟠 عالي',   bg: '#FFF7ED', color: '#EA580C' },
  { v: 'medium',   lbl: '🟡 متوسط',  bg: '#FEFCE8', color: '#CA8A04' },
  { v: 'low',      lbl: '⬇️ منخفض', bg: '#F0FDF4', color: '#16A34A' },
];

interface TaskPanelProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onArchive: (task: Task) => void;
}

function parseGroups(raw: unknown): ChecklistGroup[] {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  const first = raw[0] as Record<string, unknown>;
  if ('items' in first && Array.isArray(first.items)) return raw as ChecklistGroup[];
  return [{
    id: 'default_group',
    title: 'الخطوات العامة',
    items: (raw as { id: string; title: string; done: boolean }[]).map(s => ({
      id: s.id, text: s.title, isCompleted: s.done,
    })),
  }];
}

export default function TaskPanel({ task, onClose, onUpdate, onDelete, onArchive }: TaskPanelProps) {
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [status, setStatus]     = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate]   = useState('');
  const [groups, setGroups]     = useState<ChecklistGroup[]>([]);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDesc(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ?? '');
    setGroups(parseGroups(task.subtasks));
  }, [task?.id]);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!task) return null;

  async function saveField(patch: Parameters<typeof updateTask>[0]) {
    setSaving(true);
    const res = await updateTask(patch);
    setSaving(false);
    if (res.task) onUpdate(res.task);
  }

  async function saveGroups(updated: ChecklistGroup[]) {
    setGroups(updated);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await saveField({ id: task!.id, subtasks: updated as any });
  }

  function addGroup() {
    const g: ChecklistGroup = { id: `g_${Date.now()}`, title: '', items: [] };
    saveGroups([...groups, g]);
  }
  function updateGroupTitle(gid: string, val: string) {
    setGroups(groups.map(g => g.id === gid ? { ...g, title: val } : g));
  }
  function saveGroupTitle(gid: string, val: string) {
    saveGroups(groups.map(g => g.id === gid ? { ...g, title: val } : g));
  }
  function deleteGroup(gid: string) { saveGroups(groups.filter(g => g.id !== gid)); }
  function addItem(gid: string) {
    const item: ChecklistItem = { id: `i_${Date.now()}`, text: '', isCompleted: false };
    saveGroups(groups.map(g => g.id === gid ? { ...g, items: [...g.items, item] } : g));
  }
  function updateItemText(gid: string, iid: string, val: string) {
    setGroups(groups.map(g => g.id === gid ? { ...g, items: g.items.map(i => i.id === iid ? { ...i, text: val } : i) } : g));
  }
  function saveItemText(gid: string, iid: string, val: string) {
    saveGroups(groups.map(g => g.id === gid ? { ...g, items: g.items.map(i => i.id === iid ? { ...i, text: val } : i) } : g));
  }
  function toggleItem(gid: string, iid: string) {
    saveGroups(groups.map(g => g.id === gid ? { ...g, items: g.items.map(i => i.id === iid ? { ...i, isCompleted: !i.isCompleted } : i) } : g));
  }
  function deleteItem(gid: string, iid: string) {
    saveGroups(groups.map(g => g.id === gid ? { ...g, items: g.items.filter(i => i.id !== iid) } : g));
  }

  function handleDelete() {
    if (!window.confirm('هل أنت متأكد من حذف هذه المهمة نهائياً؟')) return;
    onDelete(task!.id);
    onClose();
  }
  function handleArchive() { onArchive(task!); onClose(); }

  const activeStatus   = STATUS_OPTIONS.find(s => s.v === status)    ?? STATUS_OPTIONS[0];
  const activePriority = PRIORITY_OPTIONS.find(p => p.v === priority) ?? PRIORITY_OPTIONS[2];
  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  const doneItems  = groups.reduce((s, g) => s + g.items.filter(i => i.isCompleted).length, 0);

  return (
    <div className="vip-modal-overlay" onClick={onClose}>
      <div className="vip-modal-container" dir="rtl" onClick={e => e.stopPropagation()}>

        {/* SIDEBAR */}
        <div className="vip-modal-sidebar">
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button onClick={onClose} style={{ background: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>✕</button>
          </div>

          <div className="vip-meta-section">
            <span className="vip-meta-label">🚀 الحالة</span>
            <select className="vip-meta-badge" value={status}
              onChange={e => { const v = e.target.value as TaskStatus; setStatus(v); saveField({ id: task!.id, status: v }); }}
              style={{ background: activeStatus.bg, color: activeStatus.color, borderColor: activeStatus.color + '40' }}>
              {STATUS_OPTIONS.map(s => <option key={s.v} value={s.v}>{s.lbl}</option>)}
            </select>
          </div>

          <div className="vip-meta-section">
            <span className="vip-meta-label">🔥 الأولوية</span>
            <select className="vip-meta-badge" value={priority}
              onChange={e => { const v = e.target.value as TaskPriority; setPriority(v); saveField({ id: task!.id, priority: v }); }}
              style={{ background: activePriority.bg, color: activePriority.color, borderColor: activePriority.color + '40' }}>
              {PRIORITY_OPTIONS.map(p => <option key={p.v} value={p.v}>{p.lbl}</option>)}
            </select>
          </div>

          <div className="vip-meta-section">
            <span className="vip-meta-label">📅 الموعد النهائي</span>
            <input type="date" className="vip-meta-badge" value={dueDate}
              onChange={e => { setDueDate(e.target.value); saveField({ id: task!.id, dueDate: e.target.value || null }); }}
              style={{ fontFamily: 'inherit', cursor: 'pointer' }} />
          </div>

          {totalItems > 0 && (
            <div className="vip-meta-section">
              <span className="vip-meta-label">✅ تقدم العمل</span>
              <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{doneItems}/{totalItems}</span>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#10B981' }}>{Math.round((doneItems / totalItems) * 100)}%</span>
                </div>
                <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((doneItems / totalItems) * 100)}%`, background: '#10B981', borderRadius: '99px', transition: 'width 0.3s' }} />
                </div>
              </div>
            </div>
          )}

          <div className="vip-meta-section" style={{ marginTop: 'auto' }}>
            <span className="vip-meta-label">🔑 معرف المهمة</span>
            <div style={{ fontSize: '11px', color: '#94A3B8', fontFamily: 'monospace', background: '#F1F5F9', padding: '8px 12px', borderRadius: '8px', wordBreak: 'break-all' }}>{task.id}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={handleArchive} style={{ padding: '12px', borderRadius: '12px', background: '#FFFFFF', color: '#475569', border: '1px solid #E2E8F0', fontWeight: '900', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>📦 أرشفة المهمة</button>
            <button onClick={handleDelete} style={{ padding: '12px', borderRadius: '12px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', fontWeight: '900', cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit' }}>🗑️ حذف المهمة</button>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="vip-modal-main">
          <textarea className="vip-task-title-input" value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={e => { if (e.target.value.trim() !== task.title) saveField({ id: task!.id, title: e.target.value.trim() || task.title }); }}
            placeholder="عنوان المهمة..." rows={2} />

          <div>
            <div className="vip-modal-section-title">📝 الوصف والتفاصيل</div>
            <textarea className="vip-task-desc-input" value={desc}
              onChange={e => setDesc(e.target.value)}
              onBlur={e => saveField({ id: task!.id, description: e.target.value })}
              placeholder="أضف تفاصيل المهمة والروابط هنا..." />
          </div>

          <div>
            <div className="vip-modal-section-title">✅ مجموعات العمل وخطوات التنفيذ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {groups.map(group => {
                const gDone = group.items.filter(i => i.isCompleted).length;
                return (
                  <div key={group.id} className="vip-checklist-group">
                    <div className="vip-checklist-header">
                      <input className="vip-checklist-title" value={group.title}
                        placeholder="اسم المجموعة (مثال: 🎨 قسم التصاميم)..."
                        onChange={e => updateGroupTitle(group.id, e.target.value)}
                        onBlur={e => saveGroupTitle(group.id, e.target.value)} />
                      {group.items.length > 0 && <span className="vip-checklist-progress">{gDone}/{group.items.length}</span>}
                      <button className="vip-modal-del-group-btn" onClick={() => deleteGroup(group.id)} title="حذف المجموعة">🗑️</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {group.items.map(item => (
                        <div key={item.id} className="vip-checklist-item">
                          <input type="checkbox" className="vip-checkbox" checked={item.isCompleted} onChange={() => toggleItem(group.id, item.id)} />
                          <input className={`vip-checklist-input${item.isCompleted ? ' completed' : ''}`} value={item.text}
                            placeholder="اكتب خطوة التنفيذ..."
                            onChange={e => updateItemText(group.id, item.id, e.target.value)}
                            onBlur={e => saveItemText(group.id, item.id, e.target.value)} />
                          <button className="vip-modal-del-item-btn" onClick={() => deleteItem(group.id, item.id)} title="حذف">✕</button>
                        </div>
                      ))}
                      <div style={{ padding: '10px 18px' }}>
                        <button className="vip-modal-add-item-btn" onClick={() => addItem(group.id)}>+ أضف خطوة</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="vip-modal-add-group-btn" onClick={addGroup}>+ إضافة مجموعة جديدة</button>
          </div>

          {saving && (
            <div style={{ position: 'fixed', bottom: '24px', left: '24px', background: '#1E293B', color: '#94A3B8', fontSize: '12px', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', zIndex: 100000 }}>
              جارٍ الحفظ...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
