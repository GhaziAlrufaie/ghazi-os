'use client';
// TaskPanel — VIP Premium 2-Column Modal (Notion/Linear Style)
// PERFORMANCE: All state is strictly local. saveField uses createBrowserClient (NOT Server Action).
// Close is instant — DB save happens in the background after modal unmounts.
import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';
import { createBrowserClient } from '@/lib/supabase';

interface ChecklistLog { id: string; text: string; type: 'update' | 'info' | 'blocker'; date: string; }
interface ChecklistItem { id: string; text: string; isCompleted: boolean; logs?: ChecklistLog[]; }
interface ChecklistGroup { id: string; title: string; items: ChecklistItem[]; }

const STATUS_OPTIONS: { v: TaskStatus; lbl: string; bg: string; color: string }[] = [
  { v: 'ideas',       lbl: '💡 أفكار',       bg: '#F5F3FF', color: '#6D28D9' },
  { v: 'todo',        lbl: '📝 قيد الانتظار', bg: '#EFF6FF', color: '#1D4ED8' },
  { v: 'in_progress', lbl: '🚀 جاري التنفيذ', bg: '#FFF7ED', color: '#C2410C' },
  { v: 'on_hold',     lbl: '✋ معلق',         bg: '#FDF4FF', color: '#7E22CE' },
  { v: 'done',        lbl: '✅ منجز',         bg: '#F0FDF4', color: '#166534' },
];
const PRIORITY_OPTIONS: { v: TaskPriority; lbl: string; bg: string; color: string }[] = [
  { v: 'critical', lbl: '🔴 حرج',    bg: '#FEF2F2', color: '#DC2626' },
  { v: 'high',     lbl: '🟠 عالي',   bg: '#FFF7ED', color: '#EA580C' },
  { v: 'medium',   lbl: '🟡 متوسط',  bg: '#FEFCE8', color: '#CA8A04' },
  { v: 'low',      lbl: '⬇️ منخفض', bg: '#F0FDF4', color: '#16A34A' },
];

interface HQCol { id: string; name: string; color: string; }
interface TaskPanelProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
  onArchive: (task: Task) => void;
  isHQ?: boolean;
  hqCols?: HQCol[];
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

export default function TaskPanel({ task, onClose, onUpdate, onDelete, onArchive, isHQ = false, hqCols }: TaskPanelProps) {
  // ── Strictly local state — parent board does NOT re-render on keystrokes ──
  const [title, setTitle]       = useState('');
  const [desc, setDesc]         = useState('');
  const [status, setStatus]     = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate]   = useState('');
  const [blockerReason, setBlockerReason] = useState<string>('');
  const [latestUpdate, setLatestUpdate]   = useState<string>('');
  const [groups, setGroups]     = useState<ChecklistGroup[]>([]);
  const [bgSaving, setBgSaving] = useState(false); // background save indicator only
  // ── Task Attachments state ─────────────────────────────────────────────
  const [localAttachments, setLocalAttachments] = useState<{id: string; name: string; url: string; linkedStep: string}[]>(() => {
    try { return Array.isArray(task?.attachments) ? task.attachments : (typeof task?.attachments === 'string' ? JSON.parse(task.attachments) : []); } catch { return []; }
  });
  const [isUploadingTaskFile, setIsUploadingTaskFile] = useState(false);
  // ── Nested Logs state ──────────────────────────────────────────────────────
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [newLogText, setNewLogText] = useState<Record<string, string>>({});
  const [newLogType, setNewLogType] = useState<Record<string, 'update' | 'info' | 'blocker'>>({});

  // Stable browser supabase client — never recreated
  const supabase = useMemo(() => createBrowserClient(), []);
  // ── Debounce ref for saveGroupsToDb — prevents DB hammering ──────────────
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref to always have latest values for background save on close
  const latestRef = useRef({ title, desc, status, priority, dueDate, groups, blockerReason, latestUpdate, attachments: localAttachments, taskId: task?.id });
  // ── Sync latestRef on every render (no deps needed — ref update is free) ──
  latestRef.current = { title, desc, status, priority, dueDate, groups, blockerReason, latestUpdate, attachments: localAttachments, taskId: task?.id };

  // Reset local state when a new task is opened
  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDesc(task.description ?? '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate ?? '');
    setGroups(parseGroups(task.subtasks));
    setBlockerReason(task.blockerReason ?? '');
    setLatestUpdate(task.latestUpdate ?? '');
    // Sync attachments
    try {
      setLocalAttachments(Array.isArray(task.attachments) ? task.attachments : (typeof task.attachments === 'string' ? JSON.parse(task.attachments) : []));
    } catch { setLocalAttachments([]); }
  }, [task?.id]);

  // Escape key closes modal + cleanup debounce timer on unmount
  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') handleClose(); }
    document.addEventListener('keydown', handler);
    return () => {
      document.removeEventListener('keydown', handler);
      // Flush any pending debounced save immediately on unmount
      if (saveDebounceRef.current) {
        clearTimeout(saveDebounceRef.current);
        // Fire save immediately if there's pending data
        const { groups: g, taskId } = latestRef.current;
        if (taskId) {
          supabase.from('tasks').update({ subtasks: g }).eq('id', taskId).then(() => {});
        }
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!task) return null;

  // ── INSTANT CLOSE + BACKGROUND SAVE ──────────────────────────────────────
  function handleClose() {
    // 1. Close modal IMMEDIATELY — zero lag, zero UI freeze
    onClose();

    // 2. Notify parent of latest state for optimistic UI update
    const { title: t, desc: d, status: s, priority: p, dueDate: dd, groups: g } = latestRef.current;
    const br = latestRef.current.blockerReason;
    const lu = latestRef.current.latestUpdate;
    onUpdate({
      id: task!.id,
      title: t,
      description: d,
      status: s,
      priority: p,
      dueDate: dd || null,
      subtasks: g as unknown as Task['subtasks'],
      latestUpdate: lu || null,
    });

    // 3. Save to Supabase in the background (fire-and-forget)
    supabase.from('tasks').update({
      title: t,
      description: d,
      status: s,
      priority: p,
      due_date: dd || null,
      subtasks: g,
      blocker_reason: br || null,
      latest_update: lu || null,
      attachments: latestRef.current.attachments,
    }).eq('id', task!.id).then(({ error }) => {
      if (error) console.error('Background save failed:', error.message);
    });
  }

  // ── IMMEDIATE FIELD SAVES (status, priority, dueDate — user expects instant feedback) ──
  function saveFieldImmediate(patch: Record<string, unknown>) {
    setBgSaving(true);
    supabase.from('tasks').update(patch).eq('id', task!.id).then(({ error }) => {
      setBgSaving(false);
      if (error) console.error('Field save failed:', error.message);
    });
  }

  // ── TASK ATTACHMENTS HANDLERS ────────────────────────────────────────────
  const handleTaskFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setIsUploadingTaskFile(true);
    const uploadedDocs: {id: string; name: string; url: string; linkedStep: string}[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '').substring(0, 15);
      const fileName = `task-${task!.id}-${Date.now()}-${Math.random().toString(36).substring(7)}-${safeName}.${fileExt}`;
      const { error } = await supabase.storage.from('task_docs').upload(fileName, file);
      if (!error) {
        const { data } = supabase.storage.from('task_docs').getPublicUrl(fileName);
        uploadedDocs.push({ id: Date.now().toString() + Math.random(), name: file.name, url: data.publicUrl, linkedStep: 'عام (للمهمة بالكامل)' });
      } else {
        console.error('Upload error:', error.message);
      }
    }
    setLocalAttachments(prev => {
      const updated = [...prev, ...uploadedDocs];
      // Save to DB immediately after upload
      supabase.from('tasks').update({ attachments: updated }).eq('id', task!.id).then(({ error }) => {
        if (error) console.error('Attachments save error:', error.message);
      });
      return updated;
    });
    setIsUploadingTaskFile(false);
    e.target.value = '';
  };
  const updateAttachmentLink = (id: string, stepName: string) => {
    setLocalAttachments(prev => {
      const updated = prev.map(att => att.id === id ? { ...att, linkedStep: stepName } : att);
      supabase.from('tasks').update({ attachments: updated }).eq('id', task!.id).then(({ error }) => {
        if (error) console.error('Attachment link save error:', error.message);
      });
      return updated;
    });
  };
  const removeTaskAttachment = (id: string) => {
    setLocalAttachments(prev => {
      const updated = prev.filter(att => att.id !== id);
      supabase.from('tasks').update({ attachments: updated }).eq('id', task!.id).then(({ error }) => {
        if (error) console.error('Attachment delete error:', error.message);
      });
      return updated;
    });
  };
  // ── CHECKLIST HELPERS ────────────────────────────────────────────────────
  function saveGroupsToDb(updated: ChecklistGroup[]) {
    // Debounce: cancel any pending save, wait 600ms before hitting DB
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => {
      supabase.from('tasks').update({ subtasks: updated }).eq('id', task!.id).then(({ error }) => {
        if (error) console.error('Checklist save failed:', error.message);
      });
    }, 600);
  }
  function saveGroups(updated: ChecklistGroup[]) {
    setGroups(updated);
    saveGroupsToDb(updated);
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
    // Local only — save on blur
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
  // ── Nested Logs functions ──────────────────────────────────────────────────
  function toggleLogs(gid: string, iid: string) {
    const key = `${gid}-${iid}`;
    setExpandedLogs(prev => ({ ...prev, [key]: !prev[key] }));
    if (!newLogType[key]) setNewLogType(prev => ({ ...prev, [key]: 'update' }));
  }
  function handleAddLog(gid: string, iid: string) {
    const key = `${gid}-${iid}`;
    const text = newLogText[key];
    if (!text || !text.trim()) return;
    const newLog: ChecklistLog = {
      id: Date.now().toString(),
      text: text.trim(),
      type: newLogType[key] || 'update',
      date: new Date().toLocaleString('ar-SA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    };
    const updated = groups.map(g => g.id === gid ? {
      ...g,
      items: g.items.map(i => i.id === iid ? { ...i, logs: [...(i.logs || []), newLog] } : i),
    } : g);
    saveGroups(updated);
    setNewLogText(prev => ({ ...prev, [key]: '' }));
  }
  function handleDeleteLog(gid: string, iid: string, logId: string) {
    const updated = groups.map(g => g.id === gid ? {
      ...g,
      items: g.items.map(i => i.id === iid ? { ...i, logs: (i.logs || []).filter(l => l.id !== logId) } : i),
    } : g);
    saveGroups(updated);
  }

  function handleDelete() {
    if (!window.confirm('هل أنت متأكد من حذف هذه المهمة نهائياً؟')) return;
    onDelete(task!.id);
    onClose();
  }
  function handleArchive() { onArchive(task!); onClose(); }

  const activeStatus = isHQ && hqCols
    ? (hqCols.find(c => c.id === status) ? { bg: '#F5F3FF', color: '#6D28D9' } : { bg: '#F5F3FF', color: '#6D28D9' })
    : (STATUS_OPTIONS.find(s => s.v === status) ?? STATUS_OPTIONS[0]);
  const activePriority = PRIORITY_OPTIONS.find(p => p.v === priority) ?? PRIORITY_OPTIONS[2];
  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  const doneItems  = groups.reduce((s, g) => s + g.items.filter(i => i.isCompleted).length, 0);

  return (
    <div className="vip-modal-overlay" onClick={handleClose}>
      <div className="vip-modal-container" dir="rtl" onClick={e => e.stopPropagation()}>

        {/* SIDEBAR */}
        <div className="vip-modal-sidebar">
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <button onClick={handleClose} style={{ background: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>✕</button>
          </div>

          <div className="vip-meta-section">
            <span className="vip-meta-label">🚀 الحالة</span>
            <select className="vip-meta-badge" value={status}
              onChange={e => {
                const v = e.target.value as TaskStatus;
                setStatus(v);
                saveFieldImmediate({ status: v });
                onUpdate({ id: task!.id, status: v }); // optimistic parent update
              }}
              style={{ background: activeStatus.bg, color: activeStatus.color, borderColor: activeStatus.color + '40' }}>
              {isHQ && hqCols
                ? hqCols.map(col => <option key={col.id} value={col.id}>{col.name}</option>)
                : STATUS_OPTIONS.map(s => <option key={s.v} value={s.v}>{s.lbl}</option>)
              }
            </select>
          </div>

          <div className="vip-meta-section">
            <span className="vip-meta-label">🔥 الأولوية</span>
            <select className="vip-meta-badge" value={priority}
              onChange={e => {
                const v = e.target.value as TaskPriority;
                setPriority(v);
                saveFieldImmediate({ priority: v });
                onUpdate({ id: task!.id, priority: v });
              }}
              style={{ background: activePriority.bg, color: activePriority.color, borderColor: activePriority.color + '40' }}>
              {PRIORITY_OPTIONS.map(p => <option key={p.v} value={p.v}>{p.lbl}</option>)}
            </select>
          </div>

          <div className="vip-meta-section">
            <span className="vip-meta-label">📅 الموعد النهائي</span>
            <input type="date" className="vip-meta-badge" value={dueDate}
              onChange={e => {
                setDueDate(e.target.value);
                saveFieldImmediate({ due_date: e.target.value || null });
                onUpdate({ id: task!.id, dueDate: e.target.value || null });
              }}
              style={{ fontFamily: 'inherit', cursor: 'pointer' }} />
          </div>
          {status === 'on_hold' && (
            <div style={{ marginTop: '4px', padding: '12px', background: '#FEF2F2', borderRadius: '10px', border: '1px dashed #FCA5A5' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#991B1B', marginBottom: '8px', letterSpacing: '0.5px' }}>
                🛑 سبب التعليق (لماذا توقف العمل؟)
              </label>
              <input
                type="text"
                value={blockerReason}
                onChange={e => setBlockerReason(e.target.value)}
                onBlur={e => {
                  const v = e.target.value;
                  saveFieldImmediate({ blocker_reason: v || null });
                  onUpdate({ id: task!.id, blockerReason: v || null });
                }}
                placeholder="مثال: بانتظار وصول شحنة الزيت من الخارج..."
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #F87171', fontSize: '12px', outline: 'none', background: '#FFFFFF', color: '#7F1D1D', fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>
          )}
          {/* ── LATEST UPDATE / QUICK NOTE ── */}
          <div style={{ marginTop: '4px', padding: '12px', background: '#FFFBEB', borderRadius: '10px', border: '1px solid #FDE68A' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: '#D97706', marginBottom: '8px', letterSpacing: '0.5px' }}>
              💬 آخر تطور / ملاحظة سريعة (يظهر خارج المهمة)
            </label>
            <input
              type="text"
              value={latestUpdate}
              onChange={e => setLatestUpdate(e.target.value)}
              onBlur={e => {
                const v = e.target.value;
                saveFieldImmediate({ latest_update: v || null });
                onUpdate({ id: task!.id, latestUpdate: v || null });
              }}
              placeholder="مثال: تم عرض الفكرة على الجوزاء وبانتظار رأيها..."
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px dashed #FCD34D', fontSize: '12px', outline: 'none', background: '#FFFFFF', color: '#92400E', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
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
          {/* Title — local only, saved on blur */}
          <textarea className="vip-task-title-input" value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={e => {
              const v = e.target.value.trim() || task.title;
              if (v !== task.title) saveFieldImmediate({ title: v });
            }}
            placeholder="عنوان المهمة..." rows={2} />

          <div>
            <div className="vip-modal-section-title">📝 الوصف والتفاصيل</div>
            {/* Description — local only, saved on blur — NO onChange to parent */}
            <textarea className="vip-task-desc-input" value={desc}
              onChange={e => setDesc(e.target.value)}
              onBlur={e => saveFieldImmediate({ description: e.target.value })}
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
                      {group.items.map(item => {
                        const logKey = `${group.id}-${item.id}`;
                        const isExpanded = expandedLogs[logKey];
                        const logType = newLogType[logKey] || 'update';
                        return (
                          <div key={item.id}>
                            {/* Item Row */}
                            <div className="vip-checklist-item" style={{ alignItems: 'center' }}>
                              <input type="checkbox" className="vip-checkbox" checked={item.isCompleted} onChange={() => toggleItem(group.id, item.id)} />
                              <input className={`vip-checklist-input${item.isCompleted ? ' completed' : ''}`} value={item.text}
                                placeholder="اكتب خطوة التنفيذ..."
                                onChange={e => updateItemText(group.id, item.id, e.target.value)}
                                onBlur={e => saveItemText(group.id, item.id, e.target.value)} />
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                                <button
                                  onClick={() => toggleLogs(group.id, item.id)}
                                  style={{ background: isExpanded ? '#EFF6FF' : '#F8FAFC', border: `1px solid ${isExpanded ? '#BFDBFE' : '#E2E8F0'}`, color: isExpanded ? '#1D4ED8' : '#475569', fontSize: 11, fontWeight: 'bold', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', gap: 4, alignItems: 'center', transition: '0.2s', whiteSpace: 'nowrap' }}
                                >
                                  💬 {(item.logs?.length ?? 0) > 0 ? `${item.logs!.length} تحديثات` : 'سجل'}
                                </button>
                                <button className="vip-modal-del-item-btn" onClick={() => deleteItem(group.id, item.id)} title="حذف">✕</button>
                              </div>
                            </div>
                            {/* Nested Logs Area */}
                            {isExpanded && (
                              <div style={{ marginRight: 28, paddingRight: 16, borderRight: '2px dashed #CBD5E1', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8, marginBottom: 16 }}>
                                {/* Input Area */}
                                <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}>
                                  <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                                    <button onClick={() => setNewLogType(p => ({ ...p, [logKey]: 'update' }))} style={{ flex: 1, padding: 6, borderRadius: 6, fontSize: 11, fontWeight: 'bold', cursor: 'pointer', border: logType === 'update' ? '1px solid #3B82F6' : '1px solid transparent', background: logType === 'update' ? '#EFF6FF' : '#F1F5F9', color: logType === 'update' ? '#1D4ED8' : '#64748B' }}>📞 تواصل</button>
                                    <button onClick={() => setNewLogType(p => ({ ...p, [logKey]: 'info' }))} style={{ flex: 1, padding: 6, borderRadius: 6, fontSize: 11, fontWeight: 'bold', cursor: 'pointer', border: logType === 'info' ? '1px solid #F59E0B' : '1px solid transparent', background: logType === 'info' ? '#FFFBEB' : '#F1F5F9', color: logType === 'info' ? '#B45309' : '#64748B' }}>💡 معلومة</button>
                                    <button onClick={() => setNewLogType(p => ({ ...p, [logKey]: 'blocker' }))} style={{ flex: 1, padding: 6, borderRadius: 6, fontSize: 11, fontWeight: 'bold', cursor: 'pointer', border: logType === 'blocker' ? '1px solid #EF4444' : '1px solid transparent', background: logType === 'blocker' ? '#FEF2F2' : '#F1F5F9', color: logType === 'blocker' ? '#B91C1C' : '#64748B' }}>🛑 عقبة</button>
                                  </div>
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <input
                                      type="text"
                                      placeholder="سجل ما حدث في هذه الخطوة..."
                                      value={newLogText[logKey] || ''}
                                      onChange={e => setNewLogText(p => ({ ...p, [logKey]: e.target.value }))}
                                      onKeyDown={e => e.key === 'Enter' && handleAddLog(group.id, item.id)}
                                      style={{ flex: 1, padding: '8px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: 12, outline: 'none', fontFamily: 'inherit' }}
                                    />
                                    <button onClick={() => handleAddLog(group.id, item.id)} style={{ background: '#0F172A', color: 'white', border: 'none', padding: '0 16px', borderRadius: 6, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}>حفظ</button>
                                  </div>
                                </div>
                                {/* Logs Timeline */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  {(item.logs || []).slice().reverse().map(log => {
                                    const isUpd = log.type === 'update';
                                    const isInf = log.type === 'info';
                                    const bg = isUpd ? '#EFF6FF' : isInf ? '#FFFBEB' : '#FEF2F2';
                                    const border = isUpd ? '#BFDBFE' : isInf ? '#FDE68A' : '#FECACA';
                                    const color = isUpd ? '#1D4ED8' : isInf ? '#B45309' : '#B91C1C';
                                    const icon = isUpd ? '📞' : isInf ? '💡' : '🛑';
                                    const label = isUpd ? 'تواصل وتحديث' : isInf ? 'معلومة / قرار' : 'عقبة وتأخير';
                                    return (
                                      <div key={log.id} style={{ background: bg, border: `1px solid ${border}`, padding: '10px 14px', borderRadius: 8, position: 'relative' }}>
                                        <button onClick={() => handleDeleteLog(group.id, item.id, log.id)} style={{ position: 'absolute', top: 8, left: 8, background: 'none', border: 'none', color: border, cursor: 'pointer', fontSize: 14, fontWeight: 'bold' }}>✕</button>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                          <span style={{ fontSize: 11, fontWeight: 900, color }}>{icon} {label}</span>
                                          <span style={{ fontSize: 10, color: '#64748B', fontWeight: 'bold', marginRight: 20 }}>{log.date}</span>
                                        </div>
                                        <p style={{ margin: 0, fontSize: 13, color: '#1E293B', fontWeight: 700, lineHeight: 1.6 }}>{log.text}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
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

          {/* ── Task Attachments Section ─────────────────────────────────── */}
          <div style={{ background: '#F8FAFC', padding: '20px', borderRadius: '16px', border: '1px solid #E2E8F0', marginTop: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '900', color: '#1E293B', margin: 0 }}>🗂️ ملفات ومرفقات المهمة</h3>
              <label style={{ cursor: isUploadingTaskFile ? 'not-allowed' : 'pointer', background: '#0F172A', color: '#FFFFFF', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isUploadingTaskFile ? '⏳ جاري الرفع...' : '📎 إرفاق ملفات'}
                <input type="file" multiple onChange={handleTaskFileUpload} disabled={isUploadingTaskFile} style={{ display: 'none' }} accept="*/*" />
              </label>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {localAttachments.map((file) => (
                <div key={file.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'space-between', alignItems: 'center', background: '#FFFFFF', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 200px' }}>
                    <span style={{ fontSize: '20px' }}>📄</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '800', color: '#334155', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.name}>{file.name}</span>
                      <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: '#2563EB', fontWeight: 'bold', textDecoration: 'none' }}>🔗 عرض الملف</a>
                    </div>
                  </div>
                  <div style={{ flex: '1 1 250px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'bold', whiteSpace: 'nowrap' }}>يرتبط بـ:</span>
                    <select
                      value={file.linkedStep}
                      onChange={(e) => updateAttachmentLink(file.id, e.target.value)}
                      style={{ flex: 1, padding: '8px 10px', borderRadius: '6px', border: '1px solid #CBD5E1', fontSize: '11px', outline: 'none', background: '#F8FAFC', maxWidth: '200px', fontWeight: 'bold', color: file.linkedStep === 'عام (للمهمة بالكامل)' ? '#64748B' : '#1D4ED8' }}
                    >
                      <option value="عام (للمهمة بالكامل)">عام (للمهمة بالكامل)</option>
                      {groups.map((group, gIdx) => (
                        <optgroup key={gIdx} label={group.title || `مجموعة ${gIdx + 1}`}>
                          {group.items.map((item, iIdx) => (
                            <option key={iIdx} value={item.text}>{item.text.substring(0, 40)}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    <button onClick={() => removeTaskAttachment(file.id)} style={{ background: '#FEF2F2', color: '#EF4444', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold' }}>حذف</button>
                  </div>
                </div>
              ))}
              {localAttachments.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', border: '1px dashed #CBD5E1', borderRadius: '12px', background: '#F8FAFC' }}>
                  <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 'bold' }}>لا توجد مرفقات لهذه المهمة. ارفع ملفات التسعير، الصور، أو العقود.</span>
                </div>
              )}
            </div>
          </div>
          {/* Background save indicator — subtle, non-blocking */}
          {bgSaving && (
            <div style={{ position: 'fixed', bottom: '24px', left: '24px', background: '#1E293B', color: '#94A3B8', fontSize: '12px', fontWeight: 700, padding: '8px 16px', borderRadius: '8px', zIndex: 100000, opacity: 0.8 }}>
              ✓ جارٍ الحفظ...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
