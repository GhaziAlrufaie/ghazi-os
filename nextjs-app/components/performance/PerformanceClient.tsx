'use client';

import { useState, useTransition } from 'react';
import {
  addMetric, updateMetric, deleteMetric,
  addMonthlyGoal, updateMonthlyGoal, deleteMonthlyGoal,
  addCampaign, updateCampaign, deleteCampaign,
} from '@/lib/performance-actions';
import type { MetricRow, MonthlyGoalRow, CampaignRow } from '@/lib/performance-types';
import { CAMPAIGN_STATUS_LABELS, MONTH_NAMES } from '@/lib/performance-types';

interface Props {
  metrics: MetricRow[];
  goals: MonthlyGoalRow[];
  campaigns: CampaignRow[];
  brands: { id: string; name: string; icon: string }[];
}

type Tab = 'metrics' | 'goals' | 'campaigns';

// ─── Metric Form ───────────────────────────────────────────────────────────
interface MetricFormData {
  brandId: string; date: string; revenue: number; orders: number; adSpend: number;
}
const emptyMetric: MetricFormData = { brandId: '', date: '', revenue: 0, orders: 0, adSpend: 0 };

// ─── Goal Form ─────────────────────────────────────────────────────────────
interface GoalFormData {
  year: number; month: number; revenueTarget: number; ordersTarget: number;
  newCustomersTarget: number; notes: string;
}
const emptyGoal: GoalFormData = {
  year: new Date().getFullYear(), month: new Date().getMonth() + 1,
  revenueTarget: 0, ordersTarget: 0, newCustomersTarget: 0, notes: '',
};

// ─── Campaign Form ─────────────────────────────────────────────────────────
interface CampaignFormData {
  brandId: string; title: string; type: string; status: string;
  startDate: string; endDate: string; budget: number; actualSpend: number;
  channels: string; notes: string;
}
const emptyCampaign: CampaignFormData = {
  brandId: '', title: '', type: 'general', status: 'planned',
  startDate: '', endDate: '', budget: 0, actualSpend: 0, channels: '', notes: '',
};

// ─── Main Component ────────────────────────────────────────────────────────
export default function PerformanceClient({ metrics, goals, campaigns, brands }: Props) {
  const [tab, setTab] = useState<Tab>('metrics');
  const [isPending, startTransition] = useTransition();

  // Metrics state
  const [metricFilter, setMetricFilter] = useState<string>('all');
  const [showMetricForm, setShowMetricForm] = useState(false);
  const [editingMetric, setEditingMetric] = useState<MetricRow | null>(null);
  const [metricForm, setMetricForm] = useState<MetricFormData>(emptyMetric);

  // Goals state
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<MonthlyGoalRow | null>(null);
  const [goalForm, setGoalForm] = useState<GoalFormData>(emptyGoal);

  // Campaigns state
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignRow | null>(null);
  const [campaignForm, setCampaignForm] = useState<CampaignFormData>(emptyCampaign);

  const brandMap = Object.fromEntries(brands.map(b => [b.id, b]));

  // ── Summary stats ──────────────────────────────────────────────────────
  const totalRevenue = metrics.reduce((s, m) => s + (m.revenue ?? 0), 0);
  const totalOrders = metrics.reduce((s, m) => s + (m.orders ?? 0), 0);
  const totalAdSpend = metrics.reduce((s, m) => s + (m.ad_spend ?? 0), 0);
  const avgRoas = metrics.length > 0
    ? (metrics.reduce((s, m) => s + (m.roas ?? 0), 0) / metrics.length).toFixed(1)
    : '0';

  // ── Metric handlers ────────────────────────────────────────────────────
  const openAddMetric = () => { setEditingMetric(null); setMetricForm(emptyMetric); setShowMetricForm(true); };
  const openEditMetric = (m: MetricRow) => {
    setEditingMetric(m);
    setMetricForm({ brandId: m.brand_id, date: m.date, revenue: m.revenue, orders: m.orders, adSpend: m.ad_spend });
    setShowMetricForm(true);
  };
  const handleSaveMetric = () => {
    if (!metricForm.brandId || !metricForm.date) return;
    startTransition(async () => {
      if (editingMetric) await updateMetric(editingMetric.id, metricForm);
      else await addMetric(metricForm);
      setShowMetricForm(false);
    });
  };
  const handleDeleteMetric = (id: string) => {
    if (!window.confirm('حذف هذا السجل؟')) return;
    startTransition(async () => { await deleteMetric(id); });
  };

  // ── Goal handlers ──────────────────────────────────────────────────────
  const openAddGoal = () => { setEditingGoal(null); setGoalForm(emptyGoal); setShowGoalForm(true); };
  const openEditGoal = (g: MonthlyGoalRow) => {
    setEditingGoal(g);
    setGoalForm({
      year: g.year, month: g.month,
      revenueTarget: g.revenue_target, ordersTarget: g.orders_target,
      newCustomersTarget: g.new_customers_target, notes: g.notes ?? '',
    });
    setShowGoalForm(true);
  };
  const handleSaveGoal = () => {
    startTransition(async () => {
      if (editingGoal) await updateMonthlyGoal(editingGoal.id, goalForm);
      else await addMonthlyGoal(goalForm);
      setShowGoalForm(false);
    });
  };
  const handleDeleteGoal = (id: string) => {
    if (!window.confirm('حذف هذا الهدف؟')) return;
    startTransition(async () => { await deleteMonthlyGoal(id); });
  };

  // ── Campaign handlers ──────────────────────────────────────────────────
  const openAddCampaign = () => { setEditingCampaign(null); setCampaignForm(emptyCampaign); setShowCampaignForm(true); };
  const openEditCampaign = (c: CampaignRow) => {
    setEditingCampaign(c);
    setCampaignForm({
      brandId: c.brand_id, title: c.title, type: c.type, status: c.status,
      startDate: c.start_date ?? '', endDate: c.end_date ?? '',
      budget: c.budget, actualSpend: c.actual_spend,
      channels: c.channels.join(', '), notes: c.notes ?? '',
    });
    setShowCampaignForm(true);
  };
  const handleSaveCampaign = () => {
    if (!campaignForm.title.trim()) return;
    startTransition(async () => {
      if (editingCampaign) await updateCampaign(editingCampaign.id, campaignForm);
      else await addCampaign(campaignForm);
      setShowCampaignForm(false);
    });
  };
  const handleDeleteCampaign = (id: string) => {
    if (!window.confirm('حذف هذه الحملة؟')) return;
    startTransition(async () => { await deleteCampaign(id); });
  };

  // ── Filtered data ──────────────────────────────────────────────────────
  const filteredMetrics = metricFilter === 'all' ? metrics : metrics.filter(m => m.brand_id === metricFilter);
  const filteredCampaigns = campaignFilter === 'all' ? campaigns : campaigns.filter(c => c.status === campaignFilter);

  const statusColors: Record<string, string> = {
    active: 'bg-green-900 text-green-300',
    planned: 'bg-blue-900 text-blue-300',
    completed: 'bg-gray-700 text-gray-400',
    paused: 'bg-yellow-900 text-yellow-300',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">الأداء</h1>
        <span className="text-sm text-gray-400">
          {metrics.length} سجل · {campaigns.length} حملة · {goals.length} هدف
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'إجمالي الإيرادات', value: `${totalRevenue.toLocaleString('ar-SA')} ر.س`, color: 'text-green-400' },
          { label: 'إجمالي الطلبات', value: totalOrders.toLocaleString('ar-SA'), color: 'text-blue-400' },
          { label: 'إجمالي الإنفاق الإعلاني', value: `${totalAdSpend.toLocaleString('ar-SA')} ر.س`, color: 'text-red-400' },
          { label: 'متوسط ROAS', value: `${avgRoas}x`, color: 'text-yellow-400' },
        ].map(card => (
          <div key={card.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">{card.label}</p>
            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-700">
        {[
          { key: 'metrics', label: `📊 المقاييس (${metrics.length})` },
          { key: 'goals', label: `🎯 الأهداف الشهرية (${goals.length})` },
          { key: 'campaigns', label: `📣 الحملات (${campaigns.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-yellow-400 text-yellow-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── METRICS TAB ──────────────────────────────────────────────────── */}
      {tab === 'metrics' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setMetricFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${metricFilter === 'all' ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
              >
                الكل ({metrics.length})
              </button>
              {brands.map(b => (
                <button
                  key={b.id}
                  onClick={() => setMetricFilter(b.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${metricFilter === b.id ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
                >
                  {b.icon} {b.name}
                </button>
              ))}
            </div>
            <button onClick={openAddMetric} className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors">
              + سجل جديد
            </button>
          </div>

          {showMetricForm && (
            <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-600">
              <h3 className="font-bold mb-4 text-yellow-400">{editingMetric ? '✏ تعديل السجل' : '+ سجل جديد'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">البراند *</label>
                  <select value={metricForm.brandId} onChange={e => setMetricForm(p => ({ ...p, brandId: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none">
                    <option value="">اختر براند</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">التاريخ *</label>
                  <input type="date" value={metricForm.date} onChange={e => setMetricForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الإيرادات (ر.س)</label>
                  <input type="number" value={metricForm.revenue} onChange={e => setMetricForm(p => ({ ...p, revenue: Number(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الطلبات</label>
                  <input type="number" value={metricForm.orders} onChange={e => setMetricForm(p => ({ ...p, orders: Number(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الإنفاق الإعلاني (ر.س)</label>
                  <input type="number" value={metricForm.adSpend} onChange={e => setMetricForm(p => ({ ...p, adSpend: Number(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSaveMetric} disabled={isPending || !metricForm.brandId || !metricForm.date}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300 disabled:opacity-50 transition-colors">
                  {isPending ? 'جاري الحفظ...' : '+ أضف'}
                </button>
                <button onClick={() => setShowMetricForm(false)} className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors">إلغاء</button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-gray-700">
                  <th className="text-right py-2 px-3">البراند</th>
                  <th className="text-right py-2 px-3">التاريخ</th>
                  <th className="text-right py-2 px-3">الإيرادات</th>
                  <th className="text-right py-2 px-3">الطلبات</th>
                  <th className="text-right py-2 px-3">متوسط الطلب</th>
                  <th className="text-right py-2 px-3">الإنفاق</th>
                  <th className="text-right py-2 px-3">ROAS</th>
                  <th className="py-2 px-3"></th>
                </tr>
              </thead>
              <tbody>
                {filteredMetrics.length === 0 ? (
                  <tr><td colSpan={8} className="text-center text-gray-500 py-8">لا توجد سجلات</td></tr>
                ) : (
                  filteredMetrics.map(m => {
                    const brand = brandMap[m.brand_id];
                    return (
                      <tr key={m.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                        <td className="py-3 px-3">{brand ? `${brand.icon} ${brand.name}` : m.brand_id}</td>
                        <td className="py-3 px-3 text-gray-400">{m.date}</td>
                        <td className="py-3 px-3 text-green-400 font-medium">{m.revenue.toLocaleString('ar-SA')}</td>
                        <td className="py-3 px-3 text-blue-400">{m.orders}</td>
                        <td className="py-3 px-3 text-gray-300">{m.avg_order_value.toLocaleString('ar-SA')}</td>
                        <td className="py-3 px-3 text-red-400">{m.ad_spend.toLocaleString('ar-SA')}</td>
                        <td className="py-3 px-3 text-yellow-400 font-bold">{m.roas}x</td>
                        <td className="py-3 px-3">
                          <div className="flex gap-1">
                            <button onClick={() => openEditMetric(m)} className="text-xs px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">✏</button>
                            <button onClick={() => handleDeleteMetric(m.id)} className="text-xs px-2 py-1 bg-red-900 text-red-300 rounded hover:bg-red-800 transition-colors">🗑</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── GOALS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'goals' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openAddGoal} className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors">
              + هدف شهري جديد
            </button>
          </div>

          {showGoalForm && (
            <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-600">
              <h3 className="font-bold mb-4 text-yellow-400">{editingGoal ? '✏ تعديل الهدف' : '+ هدف شهري جديد'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">السنة</label>
                  <input type="number" value={goalForm.year} onChange={e => setGoalForm(p => ({ ...p, year: Number(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الشهر</label>
                  <select value={goalForm.month} onChange={e => setGoalForm(p => ({ ...p, month: Number(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none">
                    {Object.entries(MONTH_NAMES).map(([n, name]) => (
                      <option key={n} value={n}>{name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">هدف الإيرادات (ر.س)</label>
                  <input type="number" value={goalForm.revenueTarget} onChange={e => setGoalForm(p => ({ ...p, revenueTarget: Number(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">هدف الطلبات</label>
                  <input type="number" value={goalForm.ordersTarget} onChange={e => setGoalForm(p => ({ ...p, ordersTarget: Number(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">هدف العملاء الجدد</label>
                  <input type="number" value={goalForm.newCustomersTarget} onChange={e => setGoalForm(p => ({ ...p, newCustomersTarget: Number(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">ملاحظات</label>
                  <input type="text" value={goalForm.notes} onChange={e => setGoalForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSaveGoal} disabled={isPending}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300 disabled:opacity-50 transition-colors">
                  {isPending ? 'جاري الحفظ...' : '+ أضف'}
                </button>
                <button onClick={() => setShowGoalForm(false)} className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors">إلغاء</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.length === 0 ? (
              <p className="text-gray-500 text-center py-8 col-span-2">لا توجد أهداف شهرية</p>
            ) : (
              goals.map(g => (
                <div key={g.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-yellow-400">
                      {MONTH_NAMES[g.month]} {g.year}
                    </h3>
                    <div className="flex gap-2">
                      <button onClick={() => openEditGoal(g)} className="text-xs px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">✏ تعديل</button>
                      <button onClick={() => handleDeleteGoal(g.id)} className="text-xs px-3 py-1.5 bg-red-900 text-red-300 rounded-lg hover:bg-red-800 transition-colors">🗑 حذف</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">هدف الإيرادات</span>
                      <span className="text-green-400 font-medium">{g.revenue_target.toLocaleString('ar-SA')} ر.س</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">هدف الطلبات</span>
                      <span className="text-blue-400 font-medium">{g.orders_target}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">هدف العملاء الجدد</span>
                      <span className="text-purple-400 font-medium">{g.new_customers_target}</span>
                    </div>
                    {g.notes && <p className="text-xs text-gray-500 mt-2">{g.notes}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── CAMPAIGNS TAB ─────────────────────────────────────────────────── */}
      {tab === 'campaigns' && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex gap-2 flex-wrap">
              {['all', 'active', 'planned', 'completed', 'paused'].map(s => (
                <button key={s} onClick={() => setCampaignFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${campaignFilter === s ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
                  {s === 'all' ? `الكل (${campaigns.length})` : `${CAMPAIGN_STATUS_LABELS[s]} (${campaigns.filter(c => c.status === s).length})`}
                </button>
              ))}
            </div>
            <button onClick={openAddCampaign} className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors">
              + حملة جديدة
            </button>
          </div>

          {showCampaignForm && (
            <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-600">
              <h3 className="font-bold mb-4 text-yellow-400">{editingCampaign ? '✏ تعديل الحملة' : '+ حملة جديدة'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">عنوان الحملة *</label>
                  <input type="text" placeholder="عنوان الحملة" value={campaignForm.title} onChange={e => setCampaignForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">البراند</label>
                  <select value={campaignForm.brandId} onChange={e => setCampaignForm(p => ({ ...p, brandId: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none">
                    <option value="">— بدون براند —</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.icon} {b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الحالة</label>
                  <select value={campaignForm.status} onChange={e => setCampaignForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none">
                    <option value="planned">مخططة</option>
                    <option value="active">نشطة</option>
                    <option value="completed">مكتملة</option>
                    <option value="paused">متوقفة</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">تاريخ البدء</label>
                  <input type="date" value={campaignForm.startDate} onChange={e => setCampaignForm(p => ({ ...p, startDate: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">تاريخ الانتهاء</label>
                  <input type="date" value={campaignForm.endDate} onChange={e => setCampaignForm(p => ({ ...p, endDate: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الميزانية (ر.س)</label>
                  <input type="number" value={campaignForm.budget} onChange={e => setCampaignForm(p => ({ ...p, budget: Number(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">الإنفاق الفعلي (ر.س)</label>
                  <input type="number" value={campaignForm.actualSpend} onChange={e => setCampaignForm(p => ({ ...p, actualSpend: Number(e.target.value) }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">القنوات (مفصولة بفاصلة)</label>
                  <input type="text" placeholder="انستقرام, سناب, واتساب" value={campaignForm.channels} onChange={e => setCampaignForm(p => ({ ...p, channels: e.target.value }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">ملاحظات</label>
                  <textarea placeholder="ملاحظات..." value={campaignForm.notes} onChange={e => setCampaignForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none resize-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={handleSaveCampaign} disabled={isPending || !campaignForm.title.trim()}
                  className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300 disabled:opacity-50 transition-colors">
                  {isPending ? 'جاري الحفظ...' : '+ أضف'}
                </button>
                <button onClick={() => setShowCampaignForm(false)} className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors">إلغاء</button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {filteredCampaigns.length === 0 ? (
              <p className="text-gray-500 text-center py-8">لا توجد حملات</p>
            ) : (
              filteredCampaigns.map(c => {
                const brand = c.brand_id ? brandMap[c.brand_id] : null;
                const spendPct = c.budget > 0 ? Math.min(100, Math.round((c.actual_spend / c.budget) * 100)) : 0;
                return (
                  <div key={c.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold text-white">{c.title}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[c.status] ?? 'bg-gray-700 text-gray-400'}`}>
                            {CAMPAIGN_STATUS_LABELS[c.status] ?? c.status}
                          </span>
                        </div>
                        {brand && <span className="text-xs text-gray-400">{brand.icon} {brand.name}</span>}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.channels.map(ch => (
                            <span key={ch} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{ch}</span>
                          ))}
                        </div>
                        {c.budget > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-400 mb-1">
                              <span>الإنفاق: {c.actual_spend.toLocaleString('ar-SA')} / {c.budget.toLocaleString('ar-SA')} ر.س</span>
                              <span>{spendPct}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-700 rounded-full">
                              <div className={`h-full rounded-full transition-all ${spendPct > 90 ? 'bg-red-400' : spendPct > 70 ? 'bg-yellow-400' : 'bg-green-400'}`}
                                style={{ width: `${spendPct}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => openEditCampaign(c)} className="text-xs px-3 py-1.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">✏ تعديل</button>
                        <button onClick={() => handleDeleteCampaign(c.id)} className="text-xs px-3 py-1.5 bg-red-900 text-red-300 rounded-lg hover:bg-red-800 transition-colors">🗑 حذف</button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
