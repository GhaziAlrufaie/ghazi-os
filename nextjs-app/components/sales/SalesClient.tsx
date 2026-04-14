'use client';

import { useState, useTransition } from 'react';
import { addSallaOrder, updateSallaOrder, deleteSallaOrder } from '@/lib/sales-actions';
import type { SallaOrderRow } from '@/lib/sales-types';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '@/lib/sales-types';
import type { MetricRow } from '@/lib/performance-types';

interface Props {
  orders: SallaOrderRow[];
  metrics: MetricRow[];
  brands: { id: string; name: string; icon: string }[];
}

interface OrderFormData {
  orderNumber: string;
  status: string;
  customerName: string;
  customerPhone: string;
  totalAmount: number;
  brand: string;
  items: string;
}

const emptyOrder: OrderFormData = {
  orderNumber: '', status: 'pending', customerName: '',
  customerPhone: '', totalAmount: 0, brand: '', items: '[]',
};

export default function SalesClient({ orders, metrics, brands }: Props) {
  const [isPending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SallaOrderRow | null>(null);
  const [form, setForm] = useState<OrderFormData>(emptyOrder);
  const [searchQuery, setSearchQuery] = useState('');

  // ── Summary stats ──────────────────────────────────────────────────────
  const totalRevenue = orders.reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const avgOrderValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

  // ── Metrics summary ────────────────────────────────────────────────────
  const totalMetricRevenue = metrics.reduce((s, m) => s + (m.revenue ?? 0), 0);
  const totalAdSpend = metrics.reduce((s, m) => s + (m.ad_spend ?? 0), 0);
  const avgRoas = metrics.length > 0
    ? (metrics.reduce((s, m) => s + (m.roas ?? 0), 0) / metrics.length).toFixed(1)
    : '0';

  // ── Handlers ───────────────────────────────────────────────────────────
  const openAdd = () => { setEditingOrder(null); setForm(emptyOrder); setShowForm(true); };
  const openEdit = (o: SallaOrderRow) => {
    setEditingOrder(o);
    setForm({
      orderNumber: o.order_number,
      status: o.status,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      totalAmount: o.total_amount,
      brand: o.brand ?? '',
      items: JSON.stringify(o.items ?? []),
    });
    setShowForm(true);
  };
  const handleSave = () => {
    if (!form.customerName.trim()) return;
    startTransition(async () => {
      if (editingOrder) {
        await updateSallaOrder(editingOrder.id, form);
      } else {
        await addSallaOrder(form);
      }
      setShowForm(false);
    });
  };
  const handleDelete = (id: number) => {
    if (!window.confirm('حذف هذا الطلب؟')) return;
    startTransition(async () => { await deleteSallaOrder(id); });
  };

  // ── Filtered orders ────────────────────────────────────────────────────
  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchBrand = brandFilter === 'all' || o.brand === brandFilter;
    const matchSearch = !searchQuery ||
      o.customer_name.includes(searchQuery) ||
      o.order_number.includes(searchQuery) ||
      o.customer_phone.includes(searchQuery);
    return matchStatus && matchBrand && matchSearch;
  });

  // ── Unique brands from orders ──────────────────────────────────────────
  const orderBrands = [...new Set(orders.map(o => o.brand).filter(Boolean))];

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">المبيعات</h1>
        <span className="text-sm text-gray-400">{orders.length} طلب مسجّل</span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'إجمالي الطلبات', value: orders.length.toLocaleString('ar-SA'), color: 'text-blue-400', icon: '📦' },
          { label: 'الطلبات المكتملة', value: deliveredOrders.toLocaleString('ar-SA'), color: 'text-green-400', icon: '✅' },
          { label: 'قيد المعالجة', value: pendingOrders.toLocaleString('ar-SA'), color: 'text-yellow-400', icon: '⏳' },
          { label: 'متوسط قيمة الطلب', value: `${avgOrderValue.toLocaleString('ar-SA')} ر.س`, color: 'text-purple-400', icon: '💰' },
        ].map(card => (
          <div key={card.label} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-xs text-gray-400 mb-1">{card.icon} {card.label}</p>
            <p className={`text-lg font-bold ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Metrics Summary */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'إيرادات المقاييس', value: `${totalMetricRevenue.toLocaleString('ar-SA')} ر.س`, color: 'text-green-400' },
            { label: 'الإنفاق الإعلاني', value: `${totalAdSpend.toLocaleString('ar-SA')} ر.س`, color: 'text-red-400' },
            { label: 'متوسط ROAS', value: `${avgRoas}x`, color: 'text-yellow-400' },
          ].map(card => (
            <div key={card.label} className="bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className={`text-base font-bold ${card.color}`}>{card.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="بحث باسم العميل أو رقم الطلب..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-yellow-400 outline-none"
        />
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === 'all' ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
            الكل ({orders.length})
          </button>
          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${statusFilter === s ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
              {ORDER_STATUS_LABELS[s]} ({orders.filter(o => o.status === s).length})
            </button>
          ))}
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300 transition-colors whitespace-nowrap">
          + طلب جديد
        </button>
      </div>

      {/* Brand filter */}
      {orderBrands.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-4">
          <button onClick={() => setBrandFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${brandFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
            كل البراندات
          </button>
          {orderBrands.map(b => (
            <button key={b} onClick={() => setBrandFilter(b!)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${brandFilter === b ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>
              {b}
            </button>
          ))}
        </div>
      )}

      {/* Order Form */}
      {showForm && (
        <div className="bg-gray-800 rounded-xl p-5 mb-6 border border-gray-600">
          <h3 className="font-bold mb-4 text-yellow-400">{editingOrder ? '✏ تعديل الطلب' : '+ طلب جديد'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">رقم الطلب</label>
              <input type="text" placeholder="ORD-001" value={form.orderNumber} onChange={e => setForm(p => ({ ...p, orderNumber: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">اسم العميل *</label>
              <input type="text" placeholder="اسم العميل" value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">رقم الجوال</label>
              <input type="text" placeholder="+966..." value={form.customerPhone} onChange={e => setForm(p => ({ ...p, customerPhone: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">الحالة</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none">
                <option value="pending">معلّق</option>
                <option value="processing">قيد المعالجة</option>
                <option value="shipped">تم الشحن</option>
                <option value="delivered">تم التسليم</option>
                <option value="cancelled">ملغي</option>
                <option value="refunded">مُسترد</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">المبلغ الإجمالي (ر.س)</label>
              <input type="number" value={form.totalAmount} onChange={e => setForm(p => ({ ...p, totalAmount: Number(e.target.value) }))}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">البراند</label>
              <select value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-yellow-400 outline-none">
                <option value="">— بدون براند —</option>
                {brands.map(b => <option key={b.id} value={b.name}>{b.icon} {b.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={isPending || !form.customerName.trim()}
              className="px-4 py-2 bg-yellow-400 text-black rounded-lg text-sm font-bold hover:bg-yellow-300 disabled:opacity-50 transition-colors">
              {isPending ? 'جاري الحفظ...' : '+ أضف'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors">إلغاء</button>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-right py-2 px-3">رقم الطلب</th>
              <th className="text-right py-2 px-3">العميل</th>
              <th className="text-right py-2 px-3">الجوال</th>
              <th className="text-right py-2 px-3">المبلغ</th>
              <th className="text-right py-2 px-3">البراند</th>
              <th className="text-right py-2 px-3">الحالة</th>
              <th className="text-right py-2 px-3">التاريخ</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center text-gray-500 py-8">لا توجد طلبات</td></tr>
            ) : (
              filtered.map(o => (
                <tr key={o.id} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors">
                  <td className="py-3 px-3 font-mono text-xs text-gray-300">{o.order_number}</td>
                  <td className="py-3 px-3 font-medium text-white">{o.customer_name}</td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{o.customer_phone}</td>
                  <td className="py-3 px-3 text-green-400 font-medium">{o.total_amount.toLocaleString('ar-SA')} ر.س</td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{o.brand ?? '—'}</td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ORDER_STATUS_COLORS[o.status] ?? 'bg-gray-700 text-gray-400'}`}>
                      {ORDER_STATUS_LABELS[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-500 text-xs">
                    {new Date(o.created_at).toLocaleDateString('ar-SA')}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(o)} className="text-xs px-2 py-1 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors">✏</button>
                      <button onClick={() => handleDelete(o.id)} className="text-xs px-2 py-1 bg-red-900 text-red-300 rounded hover:bg-red-800 transition-colors">🗑</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-gray-500 mt-3 text-center">
          عرض {filtered.length} من {orders.length} طلب
        </p>
      )}
    </div>
  );
}
