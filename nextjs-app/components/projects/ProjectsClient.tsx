'use client';
// Client Component — Projects (قسم المشاريع)
// عرض المشاريع مجمّعة حسب الحالة + CRUD كامل
import React, { useState } from 'react';
import type { ProjectRow } from '@/lib/projects-types';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/lib/projects-types';
import { addProject, updateProject, deleteProject } from '@/lib/projects-actions';
import type { BrandRow } from '@/lib/brands-types';

// ─── Priority colors ──────────────────────────────────────────────────────────
const PRIORITY_COLORS: Record<string, string> = {
  low: '#6B7280',
  medium: '#3B82F6',
  high: '#F59E0B',
  critical: '#EF4444',
};

const STATUS_COLORS: Record<string, string> = {
  planning: '#8B5CF6',
  active: '#10B981',
  paused: '#F59E0B',
  done: '#6B7280',
  archived: '#374151',
};

// ─── ProjectForm Modal ────────────────────────────────────────────────────────
interface FormProps {
  edit?: ProjectRow | null;
  brands: BrandRow[];
  onClose: () => void;
  onSave: (p: ProjectRow, isEdit: boolean) => void;
}
function ProjectForm({ edit, brands, onClose, onSave }: FormProps) {
  const isEdit = !!edit;
  const [title,      setTitle]      = useState(edit?.title ?? '');
  const [desc,       setDesc]       = useState(edit?.description ?? '');
  const [brandId,    setBrandId]    = useState(edit?.brandId ?? '');
  const [status,     setStatus]     = useState(edit?.status ?? 'planning');
  const [priority,   setPriority]   = useState(edit?.priority ?? 'medium');
  const [startDate,  setStartDate]  = useState(edit?.startDate ?? '');
  const [targetDate, setTargetDate] = useState(edit?.targetDate ?? '');
  const [tagsInput,  setTagsInput]  = useState((edit?.tags ?? []).join(', '));
  const [progress,   setProgress]   = useState(edit?.progress ?? 0);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!title.trim()) { setError('أدخل عنوان المشروع'); return; }
    setLoading(true); setError('');
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      brandId: brandId || null,
      title: title.trim(),
      description: desc,
      status,
      priority,
      startDate: startDate || null,
      targetDate: targetDate || null,
      tags,
    };
    if (isEdit && edit) {
      const res = await updateProject({ id: edit.id, ...payload, progress });
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      if (res.project) onSave(res.project, true);
    } else {
      const res = await addProject(payload);
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      if (res.project) onSave(res.project, false);
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="rounded-xl p-6 w-full max-w-lg relative overflow-y-auto max-h-[90vh]" style={{ background: '#0d1117', border: '1px solid rgba(201,150,59,0.25)' }}>
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-white">✕</button>
        <h2 className="text-lg font-bold mb-5" style={{ color: '#C9963B' }}>
          {isEdit ? '✏ تعديل المشروع' : '+ مشروع جديد'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">عنوان المشروع *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="اسم المشروع"
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,150,59,0.15)' }} />
          </div>
          {/* Brand */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">البراند (اختياري)</label>
            <select value={brandId} onChange={e => setBrandId(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ background: '#0d1117', border: '1px solid rgba(201,150,59,0.15)' }}>
              <option value="">— بدون براند —</option>
              {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
            </select>
          </div>
          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">الحالة</label>
              <select value={status} onChange={e => setStatus(e.target.value as 'planning' | 'active' | 'paused' | 'done' | 'archived')}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: '#0d1117', border: '1px solid rgba(201,150,59,0.15)' }}>
                <option value="planning">تخطيط</option>
                <option value="active">نشط</option>
                <option value="paused">متوقف</option>
                <option value="done">مكتمل</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">الأولوية</label>
              <select value={priority} onChange={e => setPriority(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: '#0d1117', border: '1px solid rgba(201,150,59,0.15)' }}>
                <option value="low">منخفض</option>
                <option value="medium">متوسط</option>
                <option value="high">مرتفع</option>
                <option value="critical">حرج</option>
              </select>
            </div>
          </div>
          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">تاريخ البدء</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,150,59,0.15)', colorScheme: 'dark' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">تاريخ الهدف</label>
              <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,150,59,0.15)', colorScheme: 'dark' }} />
            </div>
          </div>
          {/* Progress (edit only) */}
          {isEdit && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">التقدم: {progress}%</label>
              <input type="range" min={0} max={100} value={progress} onChange={e => setProgress(Number(e.target.value))}
                className="w-full" style={{ accentColor: '#C9963B' }} />
            </div>
          )}
          {/* Tags */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">الوسوم (مفصولة بفاصلة)</label>
            <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="تسويق, منتج, عاجل"
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,150,59,0.15)' }} />
          </div>
          {/* Description */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">وصف (اختياري)</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="تفاصيل المشروع..."
              className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none resize-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,150,59,0.15)' }} />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg text-sm text-gray-400 border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>إلغاء</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg text-sm font-semibold" style={{ background: '#C9963B', color: '#05070d', opacity: loading ? 0.6 : 1 }}>
              {loading ? '...' : isEdit ? 'حفظ' : '+ أضف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────
interface CardProps {
  project: ProjectRow;
  brand?: BrandRow;
  onEdit: (p: ProjectRow) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}
function ProjectCard({ project: p, brand, onEdit, onDelete, deleting }: CardProps) {
  const brandColor = brand?.color ?? '#C9963B';
  return (
    <div className="rounded-xl p-4 relative" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${brandColor}22` }}>
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl" style={{ background: brandColor }} />
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mt-1">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm leading-snug">{p.title}</h3>
          {brand && (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs">{brand.icon}</span>
              <span className="text-xs" style={{ color: brandColor }}>{brand.name}</span>
            </div>
          )}
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full flex-shrink-0 font-medium"
          style={{ background: `${PRIORITY_COLORS[p.priority]}22`, color: PRIORITY_COLORS[p.priority] }}>
          {PRIORITY_LABELS[p.priority]}
        </span>
      </div>
      {/* Progress bar */}
      {p.progress > 0 && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>التقدم</span><span>{p.progress}%</span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${p.progress}%`, background: brandColor }} />
          </div>
        </div>
      )}
      {/* Tags */}
      {p.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {p.tags.map(t => (
            <span key={t} className="text-xs px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: '#9ca3af' }}>
              {t}
            </span>
          ))}
        </div>
      )}
      {/* Dates */}
      {(p.startDate || p.targetDate) && (
        <div className="flex gap-3 mt-2 text-xs text-gray-500">
          {p.startDate && <span>📅 {p.startDate}</span>}
          {p.targetDate && <span>🎯 {p.targetDate}</span>}
        </div>
      )}
      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button onClick={() => onEdit(p)} className="flex-1 py-1.5 rounded-lg text-xs text-blue-400 hover:text-blue-300" style={{ background: 'rgba(59,130,246,0.1)' }}>✏ تعديل</button>
        <button onClick={() => onDelete(p.id)} disabled={deleting} className="flex-1 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300" style={{ background: 'rgba(239,68,68,0.1)' }}>
          {deleting ? '...' : '🗑 حذف'}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  initialProjects: ProjectRow[];
  brands: BrandRow[];
}

export default function ProjectsClient({ initialProjects, brands }: Props) {
  const [projects,  setProjects]  = useState<ProjectRow[]>(initialProjects);
  const [showForm,  setShowForm]  = useState(false);
  const [editProj,  setEditProj]  = useState<ProjectRow | null>(null);
  const [filter,    setFilter]    = useState<string>('all');
  const [deleting,  setDeleting]  = useState<string | null>(null);

  const brandMap = Object.fromEntries(brands.map(b => [b.id, b]));

  function handleSave(p: ProjectRow, isEdit: boolean) {
    setProjects(prev => isEdit ? prev.map(x => x.id === p.id ? p : x) : [...prev, p]);
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا المشروع؟')) return;
    setDeleting(id);
    await deleteProject(id);
    setProjects(prev => prev.filter(x => x.id !== id));
    setDeleting(null);
  }

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter);

  // Group by status for kanban-like view
  const statuses: Array<ProjectRow['status']> = ['active', 'planning', 'paused', 'done', 'archived'];

  const counts = Object.fromEntries(statuses.map(s => [s, projects.filter(p => p.status === s).length]));

  return (
    <div className="min-h-screen p-6" style={{ background: '#05070d', color: '#e2e8f0' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#C9963B' }}>المشاريع</h1>
          <p className="text-sm text-gray-400 mt-1">{projects.length} مشروع مسجّل</p>
        </div>
        <button
          onClick={() => { setEditProj(null); setShowForm(true); }}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: '#C9963B', color: '#05070d' }}
        >
          + مشروع جديد
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { value: 'all',      label: `الكل (${projects.length})` },
          { value: 'active',   label: `نشط (${counts.active ?? 0})` },
          { value: 'planning', label: `تخطيط (${counts.planning ?? 0})` },
          { value: 'paused',   label: `متوقف (${counts.paused ?? 0})` },
          { value: 'done',     label: `مكتمل (${counts.done ?? 0})` },
          { value: 'archived', label: `مؤرشف (${counts.archived ?? 0})` },
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
            style={{
              background: filter === f.value ? '#C9963B' : 'rgba(255,255,255,0.05)',
              color: filter === f.value ? '#05070d' : '#9ca3af',
              border: `1px solid ${filter === f.value ? '#C9963B' : 'rgba(255,255,255,0.1)'}`,
            }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(p => (
          <ProjectCard
            key={p.id}
            project={p}
            brand={p.brandId ? brandMap[p.brandId] : undefined}
            onEdit={proj => { setEditProj(proj); setShowForm(true); }}
            onDelete={handleDelete}
            deleting={deleting === p.id}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📋</div>
          <p>لا توجد مشاريع</p>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <ProjectForm
          edit={editProj}
          brands={brands}
          onClose={() => { setShowForm(false); setEditProj(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
