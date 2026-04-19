'use client';
// AddTaskModal — Modal إضافة مهمة جديدة
import React, { useState, useEffect, useRef } from 'react';
import type { Task, TaskStatus, TaskPriority } from '@/lib/tasks-actions';
import { addTask } from '@/lib/tasks-actions';
import type { ProjectRow } from '@/lib/projects-types';
import type { BrandRow } from '@/lib/brands-types';

interface AddTaskModalProps {
  brand?: BrandRow;
  brands?: BrandRow[];
  defaultBrandId?: string | null;
  projects?: ProjectRow[];
  defaultStatus?: TaskStatus;
  defaultProjectId?: string | null;
  onClose: () => void;
  onAdd: (task: Task) => void;
}

export default function AddTaskModal({
  brand,
  brands,
  defaultBrandId = null,
  projects = [],
  defaultStatus = 'todo',
  defaultProjectId = null,
  onClose,
  onAdd,
}: AddTaskModalProps) {
  const allBrands: BrandRow[] = brands ?? (brand ? [brand] : []);
  const [title, setTitle]         = useState('');
  const [desc, setDesc]           = useState('');
  const [status, setStatus]       = useState<TaskStatus>(defaultStatus);
  const [priority, setPriority]   = useState<TaskPriority>('medium');
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? '');
  const [brandId, setBrandId]     = useState<string>(defaultBrandId ?? brand?.id ?? '');
  const [dueDate, setDueDate]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    function handler(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const activeBrand = allBrands.find((b) => b.id === brandId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setError('أدخل عنوان المهمة'); return; }
    if (!brandId) { setError('اختر البراند'); return; }
    setLoading(true);
    setError('');
    const res = await addTask({
      title: title.trim(),
      status,
      priority,
      brandId,
      projectId: projectId || null,
    });
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    if (res.task) onAdd(res.task);
    onClose();
  }

  return (
    <div className="add-task-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="add-task-modal" dir="rtl">
        <h2>+ مهمة جديدة</h2>
        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="atm-field">
            <label className="atm-label">العنوان *</label>
            <input
              ref={titleRef}
              className="atm-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="عنوان المهمة..."
            />
          </div>

          {/* Description */}
          <div className="atm-field">
            <label className="atm-label">الوصف (اختياري)</label>
            <textarea
              className="atm-textarea"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="وصف المهمة..."
              rows={3}
            />
          </div>

          {/* Status + Priority */}
          <div className="atm-row">
            <div className="atm-field">
              <label className="atm-label">الحالة</label>
              <select
                className="atm-select"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                <option value="todo">قيد الانتظار</option>
                <option value="in_progress">جاري التنفيذ</option>
                <option value="on_hold">معلق</option>
                <option value="done">منجز</option>
                <option value="ideas">💡 أفكار</option>
              </select>
            </div>
            <div className="atm-field">
              <label className="atm-label">الأولوية</label>
              <select
                className="atm-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                <option value="critical">🔴 حرج</option>
                <option value="high">🟠 عالي</option>
                <option value="medium">🟡 متوسط</option>
                <option value="low">⬇️ منخفض</option>
              </select>
            </div>
          </div>

          {/* Project + Due Date */}
          <div className="atm-row">
            <div className="atm-field">
              <label className="atm-label">المشروع (اختياري)</label>
              <select
                className="atm-select"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}>
                <option value="">— بدون مشروع —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
            <div className="atm-field">
              <label className="atm-label">الموعد النهائي (اختياري)</label>
              <input
                type="date"
                className="atm-input"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Brand */}
          <div className="atm-field">
            <label className="atm-label">البراند *</label>
            {allBrands.length === 1 ? (
              <div style={{
                padding: '9px 12px', background: 'var(--bg2)', border: '1px solid var(--brd)',
                borderRadius: 8, fontSize: 13, color: 'var(--txt2)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span>{activeBrand?.icon}</span>
                <span>{activeBrand?.name}</span>
              </div>
            ) : (
              <select
                className="atm-select"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}>
                <option value="">— اختر البراند —</option>
                {allBrands.map((b) => (
                  <option key={b.id} value={b.id}>{b.icon} {b.name}</option>
                ))}
              </select>
            )}
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 8 }}>{error}</div>
          )}

          <div className="atm-footer">
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'جاري الإضافة...' : '+ إضافة المهمة'}
            </button>
            <button type="button" className="btn btn-plain" onClick={onClose}>
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
