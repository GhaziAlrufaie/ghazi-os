'use client';
// Client Component — Brands (قسم البراندات)
// عرض البراندات في شبكة بطاقات + CRUD كامل
import React, { useState } from 'react';
import type { BrandRow } from '@/lib/brands-actions';
import { addBrand, updateBrand, deleteBrand, STATUS_LABELS } from '@/lib/brands-actions';

// ─── Color Palette ────────────────────────────────────────────────────────────
const COLORS = [
  '#C9963B','#10B981','#3B82F6','#8B5CF6','#EF4444',
  '#F59E0B','#EC4899','#14B8A6','#F97316','#6366F1',
];
const ICONS = ['🏷','✨','🌟','💎','🎯','🛍','📦','🏪','🎨','💼','🚀','🌿'];

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
  const [status,   setStatus]   = useState(edit?.status ?? 'active');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.8)' }}>
      <div className="rounded-xl p-6 w-full max-w-md relative overflow-y-auto max-h-[90vh]" style={{ background: '#0d1117', border: '1px solid rgba(201,150,59,0.25)' }}>
        <button onClick={onClose} className="absolute top-4 left-4 text-gray-400 hover:text-white">✕</button>
        <h2 className="text-lg font-bold mb-5" style={{ color: '#C9963B' }}>
          {isEdit ? '✏ تعديل البراند' : '+ براند جديد'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon picker */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">الأيقونة</label>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(ic => (
                <button key={ic} type="button" onClick={() => setIcon(ic)}
                  className="w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all"
                  style={{ background: icon === ic ? `${color}33` : 'rgba(255,255,255,0.05)', border: `1px solid ${icon === ic ? color : 'rgba(255,255,255,0.1)'}` }}>
                  {ic}
                </button>
              ))}
            </div>
          </div>
          {/* Color picker */}
          <div>
            <label className="block text-xs text-gray-400 mb-2">اللون</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all"
                  style={{ background: c, border: `2px solid ${color === c ? '#fff' : 'transparent'}`, transform: color === c ? 'scale(1.2)' : 'scale(1)' }} />
              ))}
            </div>
          </div>
          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">الاسم (عربي)</label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="غازي بوتيك"
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,150,59,0.15)' }} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">الاسم (إنجليزي)</label>
              <input value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="Ghazi Boutique"
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,150,59,0.15)' }} />
            </div>
          </div>
          {/* Status + Production days */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">الحالة</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: '#0d1117', border: '1px solid rgba(201,150,59,0.15)' }}>
                <option value="active">نشط</option>
                <option value="paused">متوقف</option>
                <option value="archived">مؤرشف</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">أيام الإنتاج</label>
              <input type="number" min={1} max={30} value={prodDays} onChange={e => setProdDays(Number(e.target.value))}
                className="w-full rounded-lg px-3 py-2 text-sm text-white outline-none"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(201,150,59,0.15)' }} />
            </div>
          </div>
          {/* Description */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">وصف (اختياري)</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2} placeholder="وصف مختصر للبراند..."
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

// ─── Main Component ───────────────────────────────────────────────────────────
interface Props { initialBrands: BrandRow[]; }

export default function BrandsClient({ initialBrands }: Props) {
  const [brands,   setBrands]   = useState<BrandRow[]>(initialBrands);
  const [showForm, setShowForm] = useState(false);
  const [editBrand, setEditBrand] = useState<BrandRow | null>(null);
  const [filter,   setFilter]   = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  function handleSave(b: BrandRow, isEdit: boolean) {
    setBrands(prev => isEdit ? prev.map(x => x.id === b.id ? b : x) : [...prev, b]);
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذا البراند؟ سيتم حذف كل بياناته.')) return;
    setDeleting(id);
    await deleteBrand(id);
    setBrands(prev => prev.filter(x => x.id !== id));
    setDeleting(null);
  }

  const filtered = filter === 'all' ? brands : brands.filter(b => b.status === filter);

  const statusColors: Record<string, string> = {
    active: '#10B981',
    paused: '#F59E0B',
    archived: '#6B7280',
  };

  return (
    <div className="min-h-screen p-6" style={{ background: '#05070d', color: '#e2e8f0' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#C9963B' }}>البراندات</h1>
          <p className="text-sm text-gray-400 mt-1">{brands.length} براند مسجّل</p>
        </div>
        <button
          onClick={() => { setEditBrand(null); setShowForm(true); }}
          className="px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: '#C9963B', color: '#05070d' }}
        >
          + براند جديد
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-6">
        {[
          { value: 'all',      label: `الكل (${brands.length})` },
          { value: 'active',   label: `نشط (${brands.filter(b => b.status === 'active').length})` },
          { value: 'paused',   label: `متوقف (${brands.filter(b => b.status === 'paused').length})` },
          { value: 'archived', label: `مؤرشف (${brands.filter(b => b.status === 'archived').length})` },
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

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(b => (
          <div key={b.id} className="rounded-xl p-4 relative group"
            style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${b.color}33` }}>
            {/* Top bar color */}
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ background: b.color }} />
            {/* Icon + Name */}
            <div className="flex items-start gap-3 mt-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${b.color}22` }}>
                {b.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white truncate">{b.name}</div>
                {b.nameEn && <div className="text-xs text-gray-500 truncate">{b.nameEn}</div>}
              </div>
            </div>
            {/* Status + Production */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: `${statusColors[b.status]}22`, color: statusColors[b.status] }}>
                {STATUS_LABELS[b.status] ?? b.status}
              </span>
              <span className="text-xs text-gray-500">{b.productionDays} يوم إنتاج</span>
            </div>
            {/* Description */}
            {b.description && (
              <p className="text-xs text-gray-500 mt-2 line-clamp-2">{b.description}</p>
            )}
            {/* Actions */}
            <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <button onClick={() => { setEditBrand(b); setShowForm(true); }}
                className="flex-1 py-1.5 rounded-lg text-xs text-blue-400 hover:text-blue-300"
                style={{ background: 'rgba(59,130,246,0.1)' }}>✏ تعديل</button>
              <button onClick={() => handleDelete(b.id)} disabled={deleting === b.id}
                className="flex-1 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300"
                style={{ background: 'rgba(239,68,68,0.1)' }}>
                {deleting === b.id ? '...' : '🗑 حذف'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">🏷</div>
          <p>لا توجد براندات</p>
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
