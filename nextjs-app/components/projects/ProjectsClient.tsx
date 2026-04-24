'use client';
// Design: Projects page — VIP Kanban identical to Brands section
// Layout: VIP header + brand filter + view toggle + VIP Kanban 4 cols
// Modal: Premium 2-column modal with grouped checklists saved to description as JSON
import React, { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { BrandRow } from '@/lib/brands-types';
import type { ProjectRow } from '@/lib/projects-types';
import { addProject, updateProject, deleteProject } from '@/lib/projects-actions';

// ─── Constants ────────────────────────────────────────────────────────────────
const KANBAN_COLS: { id: ProjectRow['status']; label: string; emoji: string }[] = [
  { id: 'planning', label: 'تخطيط',  emoji: '📋' },
  { id: 'active',   label: 'نشط',    emoji: '🚀' },
  { id: 'paused',   label: 'موقوف',  emoji: '✋' },
  { id: 'done',     label: 'مكتمل',  emoji: '✅' },
];

const PRI_LABELS: Record<string, string> = {
  critical: '🔴 حرج', high: '🟠 عالي', medium: '🟡 متوسط', low: '⬇️ منخفض',
};
const PRI_COLORS: Record<string, { bg: string; color: string }> = {
  critical: { bg: '#FEE2E2', color: '#991B1B' },
  high:     { bg: '#FFEDD5', color: '#9A3412' },
  medium:   { bg: '#FEF9C3', color: '#854D0E' },
  low:      { bg: '#F1F5F9', color: '#475569' },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChecklistItem { id: string; text: string; isCompleted: boolean; }
interface ChecklistGroup { id: string; title: string; items: ChecklistItem[]; }

function parseGroups(description: string): ChecklistGroup[] {
  if (!description) return [];
  try {
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed) && parsed[0]?.items) return parsed;
  } catch {}
  return [];
}

function daysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

// ─── QuickAdd ─────────────────────────────────────────────────────────────────
function QuickAdd({ colId, brandId, onAdd }: {
  colId: ProjectRow['status'];
  brandId: string | null;
  onAdd: (p: ProjectRow) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');
  const [showPri, setShowPri] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function doAdd(priority: 'low' | 'medium' | 'high' | 'critical') {
    if (!value.trim() || saving) return;
    setSaving(true);
    setShowPri(false);
    const { project } = await addProject({
      title: value.trim(),
      description: '',
      status: colId,
      priority,
      brandId: brandId || null,
      startDate: null,
      targetDate: null,
      tags: [],
    });
    setSaving(false);
    if (project) { onAdd(project); setValue(''); setIsOpen(false); }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && value.trim()) {
      setShowPri(true);
      timerRef.current = setTimeout(() => { doAdd('low'); }, 10000);
    }
    if (e.key === 'Escape') { setIsOpen(false); setValue(''); setShowPri(false); }
  }

  if (!isOpen) {
    return (
      <button
        className="vip-add-task-btn"
        onClick={() => setIsOpen(true)}
        style={{ width: '100%', padding: '10px', marginTop: '8px', background: 'rgba(234,88,12,0.04)', color: '#EA580C', border: '1px dashed rgba(234,88,12,0.25)', borderRadius: '12px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', textAlign: 'center' }}
      >+ إضافة مشروع جديد</button>
    );
  }

  return (
    <div style={{ marginTop: '8px', position: 'relative' }}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="اسم المشروع..."
        style={{ width: '100%', padding: '10px 12px', border: '2px solid #EA580C', borderRadius: '12px', fontSize: '13px', fontWeight: '600', outline: 'none', boxSizing: 'border-box', boxShadow: '0 0 0 3px rgba(234,88,12,0.1)' }}
      />
      {showPri && (
        <div style={{ position: 'absolute', top: '100%', right: 0, left: 0, background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, overflow: 'hidden', marginTop: '4px' }}>
          {(['critical','high','medium','low'] as const).map((p) => (
            <button key={p} onClick={() => { if (timerRef.current) clearTimeout(timerRef.current); doAdd(p); }}
              style={{ display: 'block', width: '100%', padding: '10px 14px', background: 'none', border: 'none', textAlign: 'right', fontSize: '13px', fontWeight: '700', cursor: 'pointer', color: PRI_COLORS[p].color }}>
              {PRI_LABELS[p]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────
function ProjectCard({ project, brand, taskCount, doneCount, onClick }: {
  project: ProjectRow;
  brand?: BrandRow;
  taskCount: number;
  doneCount: number;
  onClick: () => void;
}) {
  const prog = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : (project.progress ?? 0);
  const days = daysLeft(project.targetDate);
  const isOverdue = days !== null && days < 0;
  const pri = PRI_COLORS[project.priority] ?? PRI_COLORS.low;
  const groups = parseGroups(project.description);
  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  const doneItems = groups.reduce((s, g) => s + g.items.filter((i) => i.isCompleted).length, 0);
  const hasDesc = project.description && !project.description.startsWith('[');

  return (
    <div className="vip-task-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="vip-task-title">{project.title}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
        <span className="vip-tag" style={{ background: pri.bg, color: pri.color }}>
          {PRI_LABELS[project.priority]}
        </span>
        {brand && (
          <span className="vip-tag" style={{ background: `${brand.color}18`, color: brand.color }}>
            {brand.name}
          </span>
        )}
        {hasDesc && <span className="vip-tag" title="يوجد وصف">📝</span>}
      </div>
      {totalItems > 0 && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>✅ {doneItems}/{totalItems}</span>
          <div style={{ flex: 1, height: '3px', background: '#F1F5F9', borderRadius: '2px' }}>
            <div style={{ width: `${totalItems > 0 ? Math.round((doneItems/totalItems)*100) : 0}%`, height: '100%', background: '#EA580C', borderRadius: '2px' }} />
          </div>
        </div>
      )}
      {project.targetDate && (
        <div style={{ marginTop: '6px' }}>
          <span className="vip-tag" style={{ background: isOverdue ? '#FEE2E2' : '#F0FDF4', color: isOverdue ? '#991B1B' : '#166534', fontSize: '11px' }}>
            {isOverdue ? `⚠️ متأخر ${Math.abs(days!)} يوم` : `🗓 ${project.targetDate}`}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Premium Modal ────────────────────────────────────────────────────────────
function PremiumProjectModal({ project, brands, onClose, onSave, onDelete }: {
  project: ProjectRow;
  brands: BrandRow[];
  onClose: () => void;
  onSave: (p: ProjectRow) => void;
  onDelete: (id: string) => void;
}) {
  const [title, setTitle] = useState(project.title);
  const [status, setStatus] = useState(project.status);
  const [priority, setPriority] = useState(project.priority);
  const [brandId, setBrandId] = useState(project.brandId ?? '');
  const [targetDate, setTargetDate] = useState(project.targetDate ?? '');
  const [groups, setGroups] = useState<ChecklistGroup[]>(() => parseGroups(project.description));
  const [saving, setSaving] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState('');

  function uid() { return Math.random().toString(36).slice(2); }

  async function handleSave() {
    setSaving(true);
    const desc = groups.length > 0 ? JSON.stringify(groups) : (project.description.startsWith('[') ? '' : project.description);
    const { project: updated } = await updateProject({
      id: project.id,
      title,
      description: desc,
      status,
      priority,
      brandId: brandId || null,
      startDate: project.startDate,
      targetDate: targetDate || null,
      tags: project.tags,
      progress: project.progress,
    });
    setSaving(false);
    if (updated) { onSave(updated); onClose(); }
  }

  function addGroup() {
    if (!newGroupTitle.trim()) return;
    setGroups((g) => [...g, { id: uid(), title: newGroupTitle.trim(), items: [] }]);
    setNewGroupTitle('');
  }

  function addItem(gid: string, text: string) {
    if (!text.trim()) return;
    setGroups((gs) => gs.map((g) => g.id === gid ? { ...g, items: [...g.items, { id: uid(), text: text.trim(), isCompleted: false }] } : g));
  }

  function toggleItem(gid: string, iid: string) {
    setGroups((gs) => gs.map((g) => g.id === gid ? { ...g, items: g.items.map((i) => i.id === iid ? { ...i, isCompleted: !i.isCompleted } : i) } : g));
  }

  function deleteGroup(gid: string) {
    setGroups((gs) => gs.filter((g) => g.id !== gid));
  }

  const totalItems = groups.reduce((s, g) => s + g.items.length, 0);
  const doneItems = groups.reduce((s, g) => s + g.items.filter((i) => i.isCompleted).length, 0);
  const progressPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;
  const brand = brands.find((b) => b.id === brandId);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '1100px', maxHeight: '90vh', display: 'flex', overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.2)' }}>
        {/* Left: Main Content */}
        <div style={{ flex: 1, padding: '32px', overflowY: 'auto', borderLeft: '1px solid #F1F5F9' }}>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', fontSize: '22px', fontWeight: '900', color: '#0F172A', border: 'none', outline: 'none', marginBottom: '24px', background: 'transparent' }} />

          {/* Grouped Checklists */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>مجموعات العمل وخطوات التنفيذ</h3>
              {totalItems > 0 && <span style={{ fontSize: '12px', color: '#EA580C', fontWeight: '700' }}>{doneItems}/{totalItems} مكتمل</span>}
            </div>

            {groups.map((group) => (
              <GroupBlock key={group.id} group={group} onToggle={(iid) => toggleItem(group.id, iid)}
                onAddItem={(text) => addItem(group.id, text)} onDelete={() => deleteGroup(group.id)} />
            ))}

            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <input value={newGroupTitle} onChange={(e) => setNewGroupTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addGroup()}
                placeholder="+ إضافة مجموعة جديدة..."
                style={{ flex: 1, padding: '10px 14px', border: '1px dashed #CBD5E1', borderRadius: '10px', fontSize: '13px', outline: 'none', background: '#F8FAFC' }} />
              <button onClick={addGroup}
                style={{ padding: '10px 16px', background: '#EA580C', color: '#fff', border: 'none', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>إضافة</button>
            </div>
          </div>
        </div>

        {/* Right: Sidebar */}
        <div style={{ width: '280px', padding: '32px 24px', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: '#0F172A' }}>تفاصيل المشروع</h3>
            <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
          </div>

          {totalItems > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: '600' }}>التقدم الإجمالي</span>
                <span style={{ fontSize: '12px', fontWeight: '800', color: '#EA580C' }}>{progressPct}%</span>
              </div>
              <div style={{ height: '6px', background: '#E2E8F0', borderRadius: '3px' }}>
                <div style={{ width: `${progressPct}%`, height: '100%', background: 'linear-gradient(90deg,#EA580C,#F97316)', borderRadius: '3px', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          <SidebarField label="الحالة">
            <select value={status} onChange={(e) => setStatus(e.target.value as ProjectRow['status'])}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: '700', outline: 'none', background: '#fff' }}>
              <option value="planning">📋 تخطيط</option>
              <option value="active">🚀 نشط</option>
              <option value="paused">✋ موقوف</option>
              <option value="done">✅ مكتمل</option>
            </select>
          </SidebarField>

          <SidebarField label="الأولوية">
            <select value={priority} onChange={(e) => setPriority(e.target.value as ProjectRow['priority'])}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: '700', outline: 'none', background: '#fff', color: PRI_COLORS[priority]?.color }}>
              <option value="critical">🔴 حرج</option>
              <option value="high">🟠 عالي</option>
              <option value="medium">🟡 متوسط</option>
              <option value="low">⬇️ منخفض</option>
            </select>
          </SidebarField>

          <SidebarField label="البراند">
            <select value={brandId} onChange={(e) => setBrandId(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', fontWeight: '700', outline: 'none', background: '#fff' }}>
              <option value="">بدون براند</option>
              {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </SidebarField>

          <SidebarField label="الموعد النهائي">
            <input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '10px', fontSize: '13px', outline: 'none', background: '#fff', boxSizing: 'border-box' }} />
          </SidebarField>

          <button onClick={handleSave} disabled={saving}
            style={{ padding: '12px', background: saving ? '#94A3B8' : '#EA580C', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '14px' }}>
            {saving ? 'جارٍ الحفظ...' : '💾 حفظ التغييرات'}
          </button>

          <button onClick={() => { if (confirm('حذف هذا المشروع نهائياً؟')) { onDelete(project.id); onClose(); } }}
            style={{ padding: '10px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
            🗑️ حذف المشروع
          </button>
        </div>
      </div>
    </div>
  );
}

function SidebarField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '11px', fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>{label}</div>
      {children}
    </div>
  );
}

function GroupBlock({ group, onToggle, onAddItem, onDelete }: {
  group: ChecklistGroup;
  onToggle: (iid: string) => void;
  onAddItem: (text: string) => void;
  onDelete: () => void;
}) {
  const [newItem, setNewItem] = useState('');
  const done = group.items.filter((i) => i.isCompleted).length;
  const pct = group.items.length > 0 ? Math.round((done / group.items.length) * 100) : 0;

  return (
    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px', fontWeight: '800', color: '#EA580C' }}>❖ {group.title}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: '#64748B' }}>{done}/{group.items.length}</span>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', fontSize: '12px' }}>✕</button>
        </div>
      </div>
      {group.items.length > 0 && (
        <div style={{ height: '3px', background: '#E2E8F0', borderRadius: '2px', marginBottom: '10px' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: '#EA580C', borderRadius: '2px' }} />
        </div>
      )}
      {group.items.map((item) => (
        <label key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 0', cursor: 'pointer' }}>
          <input type="checkbox" checked={item.isCompleted} onChange={() => onToggle(item.id)}
            style={{ marginTop: '2px', accentColor: '#EA580C', flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: item.isCompleted ? '#94A3B8' : '#1E293B', textDecoration: item.isCompleted ? 'line-through' : 'none' }}>{item.text}</span>
        </label>
      ))}
      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
        <input value={newItem} onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && newItem.trim()) { onAddItem(newItem.trim()); setNewItem(''); } }}
          placeholder="+ إضافة خطوة..."
          style={{ flex: 1, padding: '6px 10px', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: '12px', outline: 'none', background: '#fff' }} />
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
  const [projects, setProjects] = useState<ProjectRow[]>(initialProjects);
  const [view, setView] = useState<'kanban' | 'list'>('kanban');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<ProjectRow | null>(null);
  const [, startTransition] = useTransition();

  const brandMap = Object.fromEntries(brands.map((b) => [b.id, b]));
  const filtered = filterBrand === 'all' ? projects : projects.filter((p) => p.brandId === filterBrand);

  const totalProjects = projects.length;
  const doneProjects = projects.filter((p) => p.status === 'done').length;

  function handleAdd(p: ProjectRow) {
    setProjects((prev) => [...prev, p]);
  }

  function handleSave(p: ProjectRow) {
    setProjects((prev) => prev.map((x) => x.id === p.id ? p : x));
  }

  function handleDelete(id: string) {
    setProjects((prev) => prev.filter((x) => x.id !== id));
    startTransition(async () => { await deleteProject(id); });
  }

  return (
    <div style={{ padding: '28px 24px', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* VIP Header */}
      <div className="vip-brand-header" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ background: '#F1F5F9', padding: '12px', borderRadius: '12px', fontSize: '24px' }}>📂</div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#0F172A' }}>إدارة المشاريع</h2>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B', marginTop: '2px' }}>
              {doneProjects} مكتمل من {totalProjects} مشروع
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}
            style={{ background: '#fff', border: '1px solid #E2E8F0', padding: '8px 16px', borderRadius: '12px', fontSize: '13px', fontWeight: '700', color: '#475569', outline: 'none', cursor: 'pointer' }}>
            <option value="all">كل البراندات</option>
            {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <div style={{ display: 'flex', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '4px' }}>
            <button onClick={() => setView('kanban')}
              style={{ background: view === 'kanban' ? '#fff' : 'transparent', color: view === 'kanban' ? '#0F172A' : '#64748B', border: 'none', padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', boxShadow: view === 'kanban' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none', cursor: 'pointer' }}>كانبان</button>
            <button onClick={() => setView('list')}
              style={{ background: view === 'list' ? '#fff' : 'transparent', color: view === 'list' ? '#0F172A' : '#64748B', border: 'none', padding: '6px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '800', boxShadow: view === 'list' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none', cursor: 'pointer' }}>قائمة</button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="vip-kanban-board">
          {KANBAN_COLS.map((col) => {
            const colProjs = filtered.filter((p) => p.status === col.id);
            return (
              <div key={col.id} className="vip-kanban-column">
                <div className="vip-column-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{col.emoji}</span>
                    <span style={{ fontWeight: '800', color: '#1E293B', fontSize: '14px' }}>{col.label}</span>
                  </div>
                  <span style={{ background: '#FFF7ED', color: '#EA580C', border: '1px solid rgba(234,88,12,0.2)', borderRadius: '20px', padding: '2px 10px', fontSize: '12px', fontWeight: '800' }}>{colProjs.length}</span>
                </div>
                <div className="vip-tasks-container">
                  {colProjs.map((p) => {
                    const stats = taskStats[p.id] ?? { total: 0, done: 0 };
                    return (
                      <ProjectCard key={p.id} project={p}
                        brand={p.brandId ? brandMap[p.brandId] : undefined}
                        taskCount={stats.total} doneCount={stats.done}
                        onClick={() => setSelectedProject(p)} />
                    );
                  })}
                </div>
                <QuickAdd colId={col.id} brandId={filterBrand !== 'all' ? filterBrand : null} onAdd={handleAdd} />
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                {['المشروع','البراند','الحالة','الأولوية','التقدم','الموعد'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '800', color: '#64748B', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const brand = p.brandId ? brandMap[p.brandId] : undefined;
                const stats = taskStats[p.id] ?? { total: 0, done: 0 };
                const prog = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : (p.progress ?? 0);
                const days = daysLeft(p.targetDate);
                const isOverdue = days !== null && days < 0;
                const pri = PRI_COLORS[p.priority] ?? PRI_COLORS.low;
                return (
                  <tr key={p.id} onClick={() => setSelectedProject(p)}
                    style={{ borderBottom: '1px solid #F1F5F9', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: '700', color: '#1E293B' }}>{p.title}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {brand ? <span className="vip-tag" style={{ background: `${brand.color}18`, color: brand.color }}>{brand.name}</span> : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="vip-tag">{KANBAN_COLS.find((c) => c.id === p.status)?.emoji} {KANBAN_COLS.find((c) => c.id === p.status)?.label}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="vip-tag" style={{ background: pri.bg, color: pri.color }}>{PRI_LABELS[p.priority]}</span>
                    </td>
                    <td style={{ padding: '12px 16px', minWidth: '100px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1, height: '4px', background: '#F1F5F9', borderRadius: '2px' }}>
                          <div style={{ width: `${prog}%`, height: '100%', background: '#EA580C', borderRadius: '2px' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748B', fontWeight: '700' }}>{prog}%</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '12px', color: isOverdue ? '#991B1B' : '#64748B' }}>
                      {p.targetDate ? (isOverdue ? `⚠️ متأخر ${Math.abs(days!)} يوم` : p.targetDate) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#94A3B8' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>📂</div>
              <p style={{ fontWeight: '700' }}>لا توجد مشاريع</p>
            </div>
          )}
        </div>
      )}

      {/* Premium Modal */}
      {selectedProject && (
        <PremiumProjectModal
          project={selectedProject}
          brands={brands}
          onClose={() => setSelectedProject(null)}
          onSave={(p) => { handleSave(p); setSelectedProject(p); }}
          onDelete={(id) => { handleDelete(id); setSelectedProject(null); }}
        />
      )}
    </div>
  );
}
