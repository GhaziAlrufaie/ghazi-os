'use client';
// PerformanceClient — صفحة الأداء
// Layout: .scr.on wrapper — نفس /brands و /calendar
// Charts: Recharts (BarChart)
// Data: Supabase metrics table — حقيقية بالكامل
import { useState, useTransition, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { addMetric, updateMetric, deleteMetric } from '@/lib/performance-actions';
import type { MetricRow } from '@/lib/performance-types';

// ─── Types ────────────────────────────────────────────────────────────────────
interface BrandInfo { id: string; name: string; color: string; icon: string; }

interface Props {
  metrics: MetricRow[];
  brands:  BrandInfo[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(n: number) {
  return n.toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ─── Add / Edit Metric Modal ──────────────────────────────────────────────────
interface MetricModalProps {
  brands:   BrandInfo[];
  editRow?: MetricRow | null;
  onClose:  () => void;
  onSave:   (row: MetricRow, isEdit: boolean) => void;
}
function MetricModal({ brands, editRow, onClose, onSave }: MetricModalProps) {
  const isEdit = !!editRow;
  const [brandId,  setBrandId]  = useState(editRow?.brand_id ?? (brands[0]?.id ?? ''));
  const [date,     setDate]     = useState(editRow?.date ?? todayStr());
  const [revenue,  setRevenue]  = useState(String(editRow?.revenue ?? ''));
  const [orders,   setOrders]   = useState(String(editRow?.orders ?? ''));
  const [adSpend,  setAdSpend]  = useState(String(editRow?.ad_spend ?? ''));
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const revNum = Number(revenue) || 0;
  const ordNum = Number(orders)  || 0;
  const adsNum = Number(adSpend) || 0;
  const previewRoas = adsNum > 0 ? (Math.round((revNum / adsNum) * 10) / 10).toFixed(1) : null;
  const previewAvg  = ordNum > 0 ? fmt(Math.round(revNum / ordNum)) : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!brandId || !date || !revenue) { setError('أدخل البراند والتاريخ والإيرادات'); return; }
    setLoading(true); setError('');
    const input = { brandId, date, revenue: revNum, orders: ordNum, adSpend: adsNum };
    const avgOrderValue = ordNum > 0 ? Math.round(revNum / ordNum) : 0;
    const roas = adsNum > 0 ? Math.round((revNum / adsNum) * 10) / 10 : 0;
    try {
      if (isEdit && editRow) {
        await updateMetric(editRow.id, input);
        onSave({ ...editRow, brand_id: brandId, date, revenue: revNum, orders: ordNum, ad_spend: adsNum, avg_order_value: avgOrderValue, roas }, true);
        onClose();
      } else {
        await addMetric(input);
        window.location.reload();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
      setLoading(false);
    }
  }

  return (
    <div className="modal-bg on" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 460 }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--txt)', marginBottom: 20 }}>
          {isEdit ? 'تعديل البيانات' : '+ بيانات أداء جديدة'}
        </h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>البراند *</label>
              <select value={brandId} onChange={e => setBrandId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }}>
                {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>التاريخ *</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>الإيرادات (ر.س) *</label>
              <input type="number" min="0" value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="0"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>عدد الطلبات</label>
              <input type="number" min="0" value={orders} onChange={e => setOrders(e.target.value)} placeholder="0"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt3)', display: 'block', marginBottom: 4 }}>الإنفاق الإعلاني (ر.س)</label>
            <input type="number" min="0" value={adSpend} onChange={e => setAdSpend(e.target.value)} placeholder="0"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 13, color: 'var(--txt)', background: 'var(--bg)', outline: 'none' }} />
          </div>
          {(revNum > 0 || adsNum > 0) && (
            <div style={{ background: 'var(--gold-dim)', border: '1px solid var(--gold-b)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--txt2)', display: 'flex', gap: 20 }}>
              <span>متوسط الطلب: <strong style={{ color: 'var(--gold)' }}>{previewAvg ?? '—'} ر.س</strong></span>
              <span>ROAS: <strong style={{ color: 'var(--success)' }}>{previewRoas ?? '—'}x</strong></span>
            </div>
          )}
          {error && <p style={{ fontSize: 12, color: 'var(--danger)', margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose}
              style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--bg2)', border: '1px solid var(--brd)', color: 'var(--txt3)', cursor: 'pointer' }}>
              إلغاء
            </button>
            <button type="submit" className="btn" disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
              {loading ? '...' : isEdit ? 'حفظ' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
interface TooltipPayload { value: number; name: string; }
interface CustomTooltipProps { active?: boolean; payload?: TooltipPayload[]; label?: string; suffix?: string; }
function CustomTooltip({ active, payload, label, suffix = '' }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--brd)', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: 'var(--txt2)' }}>{fmt(p.value)}{suffix}</div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function PerformanceClient({ metrics: initialMetrics, brands }: Props) {
  const [metrics,     setMetrics]     = useState<MetricRow[]>(initialMetrics);
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [showModal,   setShowModal]   = useState(false);
  const [editRow,     setEditRow]     = useState<MetricRow | null>(null);
  const [, startTransition] = useTransition();

  const brandsMap: Record<string, BrandInfo> = {};
  brands.forEach(b => { brandsMap[b.id] = b; });

  // ── Filtered metrics ──────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    brandFilter === 'all' ? metrics : metrics.filter(m => m.brand_id === brandFilter),
    [metrics, brandFilter]
  );

  // ── Stats ─────────────────────────────────────────────────────────────────
  const totalRevenue = filtered.reduce((s, m) => s + (m.revenue ?? 0), 0);
  const totalOrders  = filtered.reduce((s, m) => s + (m.orders  ?? 0), 0);
  const totalAdSpend = filtered.reduce((s, m) => s + (m.ad_spend ?? 0), 0);
  const overallRoas  = totalAdSpend > 0 ? (totalRevenue / totalAdSpend).toFixed(1) : '—';

  // ── Chart 1: Monthly Revenue ──────────────────────────────────────────────
  const revenueByMonth = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(m => {
      const key = m.date.slice(0, 7);
      map[key] = (map[key] ?? 0) + m.revenue;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({ month, revenue }));
  }, [filtered]);

  // ── Chart 2: ROAS by Brand ────────────────────────────────────────────────
  const roasByBrand = useMemo(() => {
    const map: Record<string, { revenue: number; adSpend: number }> = {};
    filtered.forEach(m => {
      if (!map[m.brand_id]) map[m.brand_id] = { revenue: 0, adSpend: 0 };
      map[m.brand_id].revenue  += m.revenue  ?? 0;
      map[m.brand_id].adSpend  += m.ad_spend ?? 0;
    });
    return Object.entries(map)
      .filter(([, v]) => v.adSpend > 0)
      .map(([brandId, v]) => ({
        name:  brandsMap[brandId]?.name ?? brandId,
        roas:  Math.round((v.revenue / v.adSpend) * 10) / 10,
        color: brandsMap[brandId]?.color ?? '#C9A84C',
      }))
      .sort((a, b) => b.roas - a.roas);
  }, [filtered, brandsMap]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSave = (row: MetricRow, isEdit: boolean) => {
    if (isEdit) setMetrics(prev => prev.map(m => m.id === row.id ? row : m));
    else        setMetrics(prev => [row, ...prev]);
  };

  const handleDelete = (id: string) => {
    if (!confirm('حذف هذا السجل؟')) return;
    setMetrics(prev => prev.filter(m => m.id !== id));
    startTransition(async () => { await deleteMetric(id); });
  };

  return (
    <div className="scr on">

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--txt)', marginBottom: 4 }}>الأداء</h1>
          <p style={{ fontSize: 12, color: 'var(--txt3)' }}>{filtered.length} سجل</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
            style={{ padding: '7px 12px', border: '1px solid var(--brd)', borderRadius: 8, fontSize: 12, color: 'var(--txt)', background: 'var(--bg)', outline: 'none', cursor: 'pointer' }}>
            <option value="all">كل البراندات</option>
            {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
          </select>
          <button className="btn" onClick={() => { setEditRow(null); setShowModal(true); }}>+ بيانات</button>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { icon: '💰', label: 'إجمالي الإيرادات', value: `${fmt(totalRevenue)} ر.س`, color: 'var(--gold)' },
          { icon: '📦', label: 'إجمالي الطلبات',   value: fmt(totalOrders),            color: 'var(--accent)' },
          { icon: '📢', label: 'الإنفاق الإعلاني', value: `${fmt(totalAdSpend)} ر.س`,  color: 'var(--warning)' },
          { icon: '📈', label: 'متوسط ROAS',        value: `${overallRoas}x`,           color: 'var(--success)' },
        ].map(s => (
          <div key={s.label}
            style={{ background: 'var(--bg)', border: '1px solid var(--brd)', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 11, color: 'var(--txt3)', marginBottom: 8 }}>{s.icon} {s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

        {/* Chart 1: Monthly Revenue */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--brd)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 16 }}>📈 الإيرادات الشهرية</h3>
          {revenueByMonth.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--txt3)', fontSize: 13 }}>لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueByMonth} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--txt3)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--txt3)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip suffix=" ر.س" />} />
                <Bar dataKey="revenue" fill="#C9A84C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 2: ROAS by Brand */}
        <div style={{ background: 'var(--bg)', border: '1px solid var(--brd)', borderRadius: 14, padding: '20px 24px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', marginBottom: 16 }}>📊 ROAS حسب البراند</h3>
          {roasByBrand.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--txt3)', fontSize: 13 }}>لا توجد بيانات</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={roasByBrand} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--txt3)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--txt3)' }} tickFormatter={v => `${v}x`} />
                <Tooltip content={<CustomTooltip suffix="x" />} />
                <Bar dataKey="roas" radius={[4, 4, 0, 0]}>
                  {roasByBrand.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ── Data Table ── */}
      <div style={{ background: 'var(--bg)', border: '1px solid var(--brd)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--brd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--txt)', margin: 0 }}>📋 سجل البيانات</h3>
          <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{filtered.length} سجل</span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📊</div>
            <h3>لا توجد بيانات</h3>
            <p>أضف بيانات أداء جديدة</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg2)' }}>
                  {['التاريخ', 'البراند', 'الإيرادات', 'الطلبات', 'الإنفاق', 'ROAS', ''].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: 'var(--txt3)', borderBottom: '1px solid var(--brd)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map((m, i) => {
                  const brand = brandsMap[m.brand_id];
                  return (
                    <tr key={m.id}
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--brd)' : 'none' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg2)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--txt2)', whiteSpace: 'nowrap' }}>{m.date}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {brand ? (
                          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 10, background: `${brand.color}22`, color: brand.color, fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {brand.icon} {brand.name}
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, color: 'var(--txt3)' }}>{m.brand_id}</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{fmt(m.revenue)} ر.س</td>
                      <td style={{ padding: '12px 16px', color: 'var(--txt)', textAlign: 'center' }}>{fmt(m.orders)}</td>
                      <td style={{ padding: '12px 16px', color: 'var(--txt2)', whiteSpace: 'nowrap' }}>{fmt(m.ad_spend)} ر.س</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--success)', whiteSpace: 'nowrap' }}>{m.roas}x</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => { setEditRow(m); setShowModal(true); }}
                            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--brd)', background: 'var(--bg2)', color: 'var(--txt2)', cursor: 'pointer' }}>
                            تعديل
                          </button>
                          <button onClick={() => handleDelete(m.id)}
                            style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, border: '1px solid rgba(255,59,48,0.3)', background: 'rgba(255,59,48,0.05)', color: 'var(--danger)', cursor: 'pointer' }}>
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal ── */}
      {showModal && (
        <MetricModal
          brands={brands}
          editRow={editRow}
          onClose={() => { setShowModal(false); setEditRow(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
