'use client';
// ProjectsClient — صفحة المشاريع
// Kanban 4 أعمدة: تخطيط / نشط / موقوف / مكتمل + List View
// Color stripe يمين بلون البراند + Progress bar + Days remaining
import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { BrandRow } from '@/lib/brands-types';
import type { ProjectRow } from '@/lib/projects-types';
import { addProject, updateProject, deleteProject } from '@/lib/projects-actions';

// ─── Types ────────────────────────────────────────────────────────────────────


// ─── Constants ────────────────────────────────────────────────────────────────
const KANBAN_COLS: { id: ProjectRow['status']; label: string; color: string }[] = [
  { id: 'planning',  label: 'تخطيط',   color: '#2196f3' },
  { id: 'active',    label: 'نشط',      color: '#4caf50' },
  { id: 'paused',    label: 'موقوف',    color: '#ff9800' },
  { id: 'done',      label: 'مكتمل',    color: '#9e9e9e' },
];

const STATUS_LABELS: Record<string, string> = {
  planning: 'تخطيط', active: 'نشط', paused: 'موقوف',
  done: 'مكتمل', archived: 'مؤرشف',
};

const PRI_LABELS: Record<string, string> = {
  critical: 'حرج', high: 'عالي', medium: 'متوسط', low: 'منخفض',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function daysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function daysLeftLabel(dateStr: string | null): string {
  const d = daysLeft(dateStr);
  if (d === null) return '';
  if (d < 0) return `متأخر ${Math.abs(d)} يوم`;
  if (d === 0) return 'اليوم';
  if (d === 1) return 'غداً';
  return `${d} يوم متبقي`;
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────
function ProjectCard({
  project, brand, taskCount, doneCount, onEdit, onDelete, onNavigate,
}: {
  project: ProjectRow;
  brand?: BrandRow;
  taskCount: number;
  doneCount: number;
  onEdit: (p: ProjectRow) => void;
  onDelete: (id: string) => void;
  onNavigate: (id: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const prog = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : (project.progress ?? 0);
  const days = daysLeft(project.targetDate);
  const isOverdue = days !== null && days < 0;
  const brandColor = brand?.color ?? '#C9A84C';

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('حذف هذا المشروع؟')) return;
    setDeleting(true);
    await onDelete(project.id);
    setDeleting(false);
  }

  return (
    <div
      className="proj-card"
      onClick={() => onNavigate(project.id)}
      style={{ borderRight: `3px solid ${brandColor}`, cursor: 'pointer' }}
    >
      {/* Header */}
      <div className="proj-card-header">
        <div className="proj-card-title">{project.title}</div>
        <div className="proj-card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="ptc-btn" onClick={() => onEdit(project)} title="تعديل">✏</button>
          <button className="ptc-btn del" onClick={handleDelete} disabled={deleting} title="حذف">
            {deleting ? '...' : '🗑'}
          </button>
        </div>
      </div>

      {/* Brand */}
      {brand && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8 }}>
          <span className="brand-dot" style={{ background: brandColor }} />
          <span style={{ fontSize: 11, color: 'var(--txt2)' }}>{brand.name}</span>
        </div>
      )}

      {/* Description */}
      {project.description && (
        <div style={{ fontSize: 11, color: 'var(--txt2)', marginBottom: 8, lineHeight: 1.5 }}>
          {project.description.slice(0, 80)}{project.description.length > 80 ? '...' : ''}
        </div>
      )}

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10, color: 'var(--txt2)', marginBottom: 4 }}>
        <span>{doneCount}/{taskCount} مهمة</span>
        <span>{prog}%</span>
      </div>
      <div className="progress-bar" style={{ marginBottom: 8 }}>
        <div className="progress-fill" style={{ width: `${prog}%`, background: brandColor }} />
      </div>

      {/* Days remaining */}
      {project.targetDate && (
        <div style={{ fontSize: 9, color: isOverdue ? 'var(--danger)' : 'var(--txt3)', marginBottom: 4 }}>
          {daysLeftLabel(project.targetDate)}
        </div>
      )}

      {/* Status badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        <span className={`badge ${project.status === 'active' ? 'badge-success' : project.status === 'planning' ? 'badge-accent' : project.status === 'paused' ? 'badge-warning' : 'badge-muted'}`}>
          {STATUS_LABELS[project.status] ?? project.status}
        </span>
        <span className={`badge ${project.priority === 'critical' ? 'badge-danger' : project.priority === 'high' ? 'badge-warning' : 'badge-muted'}`}>
          {PRI_LABELS[project.priority] ?? project.priority}
        </span>
      </div>
    </div>
  );
}

// ─── AddProjectModal ──────────────────────────────────────────────────────────
function AddProjectModal({
  brands, edit, onClose, onSave,
}: {
  brands: BrandRow[];
  edit: ProjectRow | null;
  onClose: () => void;
  onSave: (p: ProjectRow, isEdit: boolean) => void;
}) {
  const [title, setTitle]       = useState(edit?.title ?? '');
  const [desc, setDesc]         = useState(edit?.description ?? '');
  const [brandId, setBrandId]   = useState(edit?.brandId ?? '');
  const [status, setStatus]     = useState<string>(edit?.status ?? 'planning');
  const [priority, setPriority] = useState<string>(edit?.priority ?? 'medium');
  const [startDate, setStartDate] = useState(edit?.startDate ?? '');
  const [targetDate, setTargetDate] = useState(edit?.targetDate ?? '');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  async function handleSave() {
    if (!title.trim()) { setError('أدخل اسم المشروع'); return; }
    setSaving(true);
    if (edit) {
      const res = await updateProject({
        id: edit.id, brandId: brandId || null, title, description: desc,
        status: status as ProjectRow['status'], priority: priority as ProjectRow['priority'],
        startDate: startDate || null, targetDate: targetDate || null,
        tags: edit.tags, progress: edit.progress,
      });
      if (res.project) { onSave(res.project, true); onClose(); }
      else setError(res.error ?? 'خطأ في الحفظ');
    } else {
      const res = await addProject({
        brandId: brandId || null, title, description: desc,
        status, priority, startDate: startDate || null,
        targetDate: targetDate || null, tags: [],
      });
      if (res.project) { onSave(res.project, false); onClose(); }
      else setError(res.error ?? 'خطأ في الإضافة');
    }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{edit ? 'تعديل المشروع' : '+ مشروع جديد'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {error && <div style={{ color: 'var(--danger)', fontSize: 12, marginBottom: 8 }}>{error}</div>}
        <label className="field-label">اسم المشروع *</label>
        <input className="field-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="اسم المشروع..." />
        <label className="field-label">الوصف</label>
        <textarea className="field-input" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="وصف المشروع..." rows={3} style={{ resize: 'vertical' }} />
        <label className="field-label">البراند</label>
        <select className="field-input" value={brandId} onChange={(e) => setBrandId(e.target.value)}>
          <option value="">— بدون براند</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="field-label">الحالة</label>
            <select className="field-input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="planning">تخطيط</option>
              <option value="active">نشط</option>
              <option value="paused">موقوف</option>
              <option value="done">مكتمل</option>
            </select>
          </div>
          <div>
            <label className="field-label">الأولوية</label>
            <select className="field-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="critical">حرج</option>
              <option value="high">عالي</option>
              <option value="medium">متوسط</option>
              <option value="low">منخفض</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <label className="field-label">تاريخ البداية</label>
            <input type="date" className="field-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="field-label">تاريخ الهدف</label>
            <input type="date" className="field-input" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>إلغاء</button>
          <button className="btn-save" onClick={handleSave} disabled={saving}>
            {saving ? 'جارٍ الحفظ...' : (edit ? 'حفظ التعديلات' : '+ أضف المشروع')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  initialProjects: ProjectRow[];
  brands: BrandRow[];
  taskStats?: Record<string, { total: number; done: number }>;
}

export default function ProjectsClient({ initialProjects, brands, taskStats = {} }: Props) {
  const router = useRouter();
  const [projects, setProjects]   = useState<ProjectRow[]>(initialProjects);
  const [view, setView]           = useState<'kanban' | 'list'>('kanban');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [showForm, setShowForm]   = useState(false);
  const [editProj, setEditProj]   = useState<ProjectRow | null>(null);
  const [, startTransition]       = useTransition();

  const brandMap = Object.fromEntries(brands.map((b) => [b.id, b]));

  const filtered = filterBrand === 'all'
    ? projects
    : projects.filter((p) => p.brandId === filterBrand);

  function handleSave(p: ProjectRow, isEdit: boolean) {
    setProjects((prev) => isEdit ? prev.map((x) => x.id === p.id ? p : x) : [...prev, p]);
  }

  function handleDelete(id: string) {
    setProjects((prev) => prev.filter((x) => x.id !== id));
    startTransition(async () => { await deleteProject(id); });
  }

  function handleNavigate(id: string) {
    router.push(`/project-detail/${id}`);
  }

  return (
    <div className="scr on" style={{ padding: '20px 24px' }}>
      {/* Topbar */}
      <div style={{ marginBottom: 16 }}>
        <div className="filters">
          <select
            className="filter-select"
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
          >
            <option value="all">كل البراندات</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div style={{ marginRight: 'auto', display: 'flex', gap: 6 }}>
            <button
              className={`btn btn-sm${view === 'kanban' ? '' : ' btn-plain'}`}
              onClick={() => setView('kanban')}
            >كانبان</button>
            <button
              className={`btn btn-sm${view === 'list' ? '' : ' btn-plain'}`}
              onClick={() => setView('list')}
            >قائمة</button>
            <button
              className="btn btn-sm"
              onClick={() => { setEditProj(null); setShowForm(true); }}
              style={{ marginRight: 8 }}
            >+ مشروع جديد</button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="kanban">
          {KANBAN_COLS.map((col) => {
            const colProjs = filtered.filter((p) => p.status === col.id);
            return (
              <div key={col.id} className="kanban-col">
                <div className="kanban-col-header">
                  <h3 style={{ color: col.color }}>{col.label}</h3>
                  <span className="badge badge-muted">{colProjs.length}</span>
                </div>
                {colProjs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--txt3)', fontSize: 11 }}>
                    لا توجد مشاريع
                  </div>
                )}
                {colProjs.map((p) => {
                  const stats = taskStats[p.id] ?? { total: 0, done: 0 };
                  return (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      brand={p.brandId ? brandMap[p.brandId] : undefined}
                      taskCount={stats.total}
                      doneCount={stats.done}
                      onEdit={(proj) => { setEditProj(proj); setShowForm(true); }}
                      onDelete={handleDelete}
                      onNavigate={handleNavigate}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <table className="tasks-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>المشروع</th>
              <th>البراند</th>
              <th>الحالة</th>
              <th>الأولوية</th>
              <th>التقدم</th>
              <th>الموعد</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: 'var(--txt3)' }}>
                  لا توجد مشاريع
                </td>
              </tr>
            )}
            {filtered.map((p) => {
              const brand = p.brandId ? brandMap[p.brandId] : undefined;
              const stats = taskStats[p.id] ?? { total: 0, done: 0 };
              const prog = stats.total > 0
                ? Math.round((stats.done / stats.total) * 100)
                : (p.progress ?? 0);
              const days = daysLeft(p.targetDate);
              const isOverdue = days !== null && days < 0;
              return (
                <tr
                  key={p.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNavigate(p.id)}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {brand && (
                        <div style={{ width: 3, height: 20, background: brand.color, borderRadius: 2, flexShrink: 0 }} />
                      )}
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{p.title}</span>
                    </div>
                  </td>
                  <td>
                    {brand ? (
                      <span className="brand-tag" style={{ background: `${brand.color}22`, color: brand.color }}>
                        {brand.name}
                      </span>
                    ) : '—'}
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'active' ? 'badge-success' : p.status === 'planning' ? 'badge-accent' : p.status === 'paused' ? 'badge-warning' : 'badge-muted'}`}>
                      {STATUS_LABELS[p.status] ?? p.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.priority === 'critical' ? 'badge-danger' : p.priority === 'high' ? 'badge-warning' : 'badge-muted'}`}>
                      {PRI_LABELS[p.priority] ?? p.priority}
                    </span>
                  </td>
                  <td style={{ minWidth: 100 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="progress-bar" style={{ flex: 1 }}>
                        <div className="progress-fill" style={{ width: `${prog}%`, background: brand?.color ?? 'var(--accent)' }} />
                      </div>
                      <span style={{ fontSize: 10, color: 'var(--txt2)' }}>{prog}%</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 10, color: isOverdue ? 'var(--danger)' : 'var(--txt2)' }}>
                    {daysLeftLabel(p.targetDate)}
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="btn btn-sm btn-plain"
                      style={{ fontSize: 10 }}
                      onClick={() => { setEditProj(p); setShowForm(true); }}
                    >✏</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {filtered.length === 0 && view === 'kanban' && (
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div className="icon">📋</div>
          <h3>لا توجد مشاريع</h3>
          <p>ابدأ بإنشاء مشروعك الأول</p>
          <button className="btn" onClick={() => { setEditProj(null); setShowForm(true); }}>
            + مشروع جديد
          </button>
        </div>
      )}

      {/* Modal */}
      {showForm && (
        <AddProjectModal
          brands={brands}
          edit={editProj}
          onClose={() => { setShowForm(false); setEditProj(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
