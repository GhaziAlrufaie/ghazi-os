'use client';
// Client Component — Brands (قسم البراندات)
// Light Theme مطابق للأصل — grid بطاقات + إحصائيات + CRUD
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { BrandRow } from '@/lib/brands-types';
import { STATUS_LABELS } from '@/lib/brands-types';
import { addBrand, updateBrand, deleteBrand } from '@/lib/brands-actions';
import type { BrandStats } from '@/app/brands/page';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = [
  '#C9963B','#10B981','#3B82F6','#8B5CF6','#EF4444',
  '#F59E0B','#EC4899','#14B8A6','#F97316','#6366F1',
  '#1D4ED8','#059669','#DC2626','#7C3AED','#0891B2',
];
const ICONS = ['🏷','✨','🌟','💎','🎯','🛍','📦','🏪','🎨','💼','🚀','🌿','📱','🔑','🏠','🚗','🍽','💡','🎓','💰'];

const STATUS_COLORS: Record<string, string> = {
  active: 'var(--success)',
  paused: 'var(--warning)',
  archived: 'var(--txt3)',
};

// ─── BrandForm Modal ──────────────────────────────────────────────────────────
interface FormProps {
  edit?: BrandRow | null;
  onClose: () => void;
  onSave: (b: BrandRow, isEdit: boolean) => void;
}

function BrandForm({ edit, onClose, onSave }: FormProps) {
  const isEdit = !!edit;
  const [name,     setName]     = useState(edit?.name ?? '');
  const [nameEn,   setNameEn]   = useState(edit?.nameEn ?? '');
  const [color,    setColor]    = useState(edit?.color ?? '#C9963B');
  const [icon,     setIcon]     = useState(edit?.icon ?? '🏷');
  const [status,   setStatus]   = useState<BrandRow['status']>(edit?.status ?? 'active');
  const [desc,     setDesc]     = useState(edit?.description ?? '');
  const [prodDays, setProdDays] = useState(edit?.productionDays ?? 7);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!name.trim()) { setError('أدخل اسم البراند'); return; }
    setLoading(true); setError('');
    const payload = { name: name.trim(), nameEn: nameEn.trim(), color, icon, status, description: desc, productionDays: prodDays };
    if (isEdit && edit) {
      const res = await updateBrand({ id: edit.id, ...payload });
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      if (res.brand) onSave(res.brand, true);
    } else {
      const res = await addBrand(payload);
      setLoading(false);
      if (res.error) { setError(res.error); return; }
      if (res.brand) onSave(res.brand, false);
    }
    onClose();
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '7px 10px', border: '1px solid var(--brd)',
    borderRadius: 6, fontSize: 13, fontFamily: 'inherit',
    background: 'var(--bg2)', color: 'var(--txt)', outline: 'none', direction: 'rtl',
    boxSizing: 'border-box',
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: 480 }}>
        <div className="modal-hdr">
          <span className="modal-title">{isEdit ? '✏ تعديل البراند' : '+ براند جديد'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Icon picker */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 6 }}>الأيقونة</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, fontSize: 18,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: icon === ic ? `${color}22` : 'var(--bg2)',
                    border: `1px solid ${icon === ic ? color : 'var(--brd)'}`,
                    cursor: 'pointer', transition: 'all .12s',
                  }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Color picker */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 6 }}>اللون</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', background: c,
                    border: `2px solid ${color === c ? 'var(--txt)' : 'transparent'}`,
                    cursor: 'pointer', transition: 'all .12s',
                  }} />
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>الاسم *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم البراند" style={inp} />
          </div>

          {/* Name EN */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>الاسم بالإنجليزي</label>
            <input value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Brand name" style={{ ...inp, direction: 'ltr' }} />
          </div>

          {/* Status */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>الحالة</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as BrandRow['status'])} style={inp}>
              <option value="active">نشط</option>
              <option value="paused">متوقف</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>الوصف</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="وصف مختصر..."
              style={{ ...inp, resize: 'vertical' }} />
          </div>

          {/* Production Days */}
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>أيام الإنتاج</label>
            <input type="number" min={1} max={30} value={prodDays} onChange={(e) => setProdDays(Number(e.target.value))}
              style={{ ...inp, width: 80 }} />
          </div>

          {error && <p style={{ color: 'var(--danger)', fontSize: 11 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-plain" onClick={onClose}>إلغاء</button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? '...' : isEdit ? 'حفظ التعديلات' : '+ إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Brand Card ───────────────────────────────────────────────────────────────
interface CardProps {
  brand: BrandRow;
  stats: BrandStats;
  onEdit: () => void;
  onDelete: () => void;
  onClick: () => void;
}

function BrandCard({ brand, stats, onEdit, onDelete, onClick }: CardProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="brand-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      {/* Color stripe (يمين) */}
      <div className="color-stripe" style={{ background: brand.color }} />

      {/* Header: icon + name + menu */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>{brand.icon}</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt)' }}>{brand.name}</div>
            {brand.nameEn && (
              <div style={{ fontSize: 10, color: 'var(--txt3)', direction: 'ltr' }}>{brand.nameEn}</div>
            )}
          </div>
        </div>

        {/* Options menu */}
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--txt3)', fontSize: 16, padding: '2px 6px', borderRadius: 4, lineHeight: 1 }}>
            ⋯
          </button>
          {menuOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} onClick={() => setMenuOpen(false)} />
              <div className="proj-opts-menu on" style={{ left: 'auto', right: 0, top: '100%' }}>
                <div className="proj-opts-item" onClick={() => { setMenuOpen(false); onEdit(); }}>✏ تعديل</div>
                <div className="proj-opts-item danger" onClick={() => { setMenuOpen(false); onDelete(); }}>🗑 حذف</div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Status badge */}
      <div style={{ marginBottom: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
          background: `${STATUS_COLORS[brand.status]}22`,
          color: STATUS_COLORS[brand.status],
          border: `1px solid ${STATUS_COLORS[brand.status]}44`,
        }}>
          {STATUS_LABELS[brand.status] ?? brand.status}
        </span>
      </div>

      {/* Description */}
      {brand.description && (
        <div style={{
          fontSize: 11, color: 'var(--txt3)', marginBottom: 8, lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {brand.description}
        </div>
      )}

      {/* Health progress bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
          <span style={{ fontSize: 10, color: 'var(--txt3)' }}>صحة البراند</span>
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: brand.healthScore >= 70 ? 'var(--success)' : brand.healthScore >= 40 ? 'var(--warning)' : 'var(--danger)',
          }}>
            {brand.healthScore}%
          </span>
        </div>
        <div style={{ height: 4, background: 'var(--bg2)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 4,
            width: `${brand.healthScore}%`,
            background: brand.healthScore >= 70 ? 'var(--success)' : brand.healthScore >= 40 ? 'var(--warning)' : 'var(--danger)',
            transition: 'width .3s',
          }} />
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--txt2)' }}>
          <span>📋</span>
          <span style={{ fontWeight: 700, color: 'var(--txt)' }}>{stats.openTasks}</span>
          <span style={{ color: 'var(--txt3)' }}>مهمة</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--txt2)' }}>
          <span>📁</span>
          <span style={{ fontWeight: 700, color: 'var(--txt)' }}>{stats.projects}</span>
          <span style={{ color: 'var(--txt3)' }}>مشروع</span>
        </div>
        {stats.doneTasks > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--success)' }}>
            <span>✓</span>
            <span style={{ fontWeight: 700 }}>{stats.doneTasks}</span>
          </div>
        )}
        {stats.decisions > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: 'var(--warning)' }}>
            <span>⚡</span>
            <span style={{ fontWeight: 700 }}>{stats.decisions}</span>
            <span>قرار</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props {
  initialBrands: BrandRow[];
  statsMap: Record<string, BrandStats>;
}

export default function BrandsClient({ initialBrands, statsMap }: Props) {
  const router = useRouter();
  const [brands, setBrands] = useState<BrandRow[]>(initialBrands);
  const [showForm, setShowForm] = useState(false);
  const [editBrand, setEditBrand] = useState<BrandRow | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'paused' | 'archived'>('all');

  const filtered = brands.filter((b) => filter === 'all' || b.status === filter);

  function handleSave(b: BrandRow, isEdit: boolean) {
    if (isEdit) {
      setBrands((prev) => prev.map((x) => (x.id === b.id ? b : x)));
    } else {
      setBrands((prev) => [...prev, b]);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('هل تريد حذف هذا البراند؟')) return;
    const res = await deleteBrand(id);
    if (!res.error) {
      setBrands((prev) => prev.filter((b) => b.id !== id));
    }
  }

  return (
    <div className="scr on">
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)', marginBottom: 4 }}>البراندات</h1>
          <p style={{ fontSize: 12, color: 'var(--txt3)' }}>
            {brands.length} براند • {brands.filter((b) => b.status === 'active').length} نشط
          </p>
        </div>
        <button className="btn" onClick={() => { setEditBrand(null); setShowForm(true); }}>
          + براند جديد
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {(['all', 'active', 'paused', 'archived'] as const).map((f) => {
          const count = f === 'all' ? brands.length : brands.filter((b) => b.status === f).length;
          const labels: Record<string, string> = { all: 'الكل', active: 'نشط', paused: 'متوقف', archived: 'مؤرشف' };
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '4px 12px', borderRadius: 16, fontSize: 11, fontWeight: 600,
                cursor: 'pointer', border: '1px solid', fontFamily: 'inherit',
                background: filter === f ? 'var(--gold)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--txt2)',
                borderColor: filter === f ? 'var(--gold)' : 'var(--brd)',
                transition: 'all .15s',
              }}>
              {labels[f]} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--txt3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🏷</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>لا يوجد براندات</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>أضف براندك الأول</div>
        </div>
      ) : (
        <div className="brands-grid">
          {filtered.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              stats={statsMap[brand.id] ?? { openTasks: 0, doneTasks: 0, projects: 0, decisions: 0 }}
              onClick={() => router.push(`/brands/${brand.id}`)}
              onEdit={() => { setEditBrand(brand); setShowForm(true); }}
              onDelete={() => handleDelete(brand.id)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <BrandForm
          edit={editBrand}
          onClose={() => { setShowForm(false); setEditBrand(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
