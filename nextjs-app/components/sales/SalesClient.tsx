'use client';
// SalesClient — صفحة المبيعات حسب المواصفات
// Stats: اليوم / الأسبوع / الشهر (عدد + مبلغ)
// List: آخر 50 طلب مع Status badge ملون
import { useState } from 'react';
import type { SallaOrderRow } from '@/lib/sales-types';

const STATUS_COLORS: Record<string, string> = {
  pending:    '#FF9800',
  processing: '#2196F3',
  completed:  '#4CAF50',
  cancelled:  '#F44336',
  refunded:   '#9C27B0',
  delivered:  '#4CAF50',
  shipped:    '#00BCD4',
};
const STATUS_LABELS: Record<string, string> = {
  pending:    'معلق',
  processing: 'قيد التنفيذ',
  completed:  'مكتمل',
  cancelled:  'ملغي',
  refunded:   'مسترجع',
  delivered:  'تم التسليم',
  shipped:    'تم الشحن',
};

const MONTHS_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];

function fmt(n: number) {
  return n.toLocaleString('ar-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Props {
  orders: SallaOrderRow[];
}

export default function SalesClient({ orders }: Props) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  // ── حساب الإحصائيات ──────────────────────────────────────────────────
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const todayOrders  = orders.filter(o => new Date(o.created_at) >= todayStart);
  const weekOrders   = orders.filter(o => new Date(o.created_at) >= weekStart);
  const monthOrders  = orders.filter(o => new Date(o.created_at) >= monthStart);

  const todayTotal  = todayOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const weekTotal   = weekOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0);
  const monthTotal  = monthOrders.reduce((s, o) => s + (o.total_amount ?? 0), 0);

  // ── فلترة + آخر 50 ──────────────────────────────────────────────────
  const filtered = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .slice(0, 50);

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>🛍️ المبيعات — سلة</h2>
        <button
          className="btn btn-sm btn-plain"
          onClick={handleRefresh}
          disabled={refreshing}
          style={{ fontSize: '11px' }}
        >
          {refreshing ? '⏳ جاري...' : '🔄 تحديث'}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div className="card" style={{ flex: 1, minWidth: '140px', textAlign: 'center', padding: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--txt3)', marginBottom: '4px' }}>اليوم</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--gold)' }}>{todayOrders.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--txt2)' }}>{fmt(todayTotal)} ريال</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '140px', textAlign: 'center', padding: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--txt3)', marginBottom: '4px' }}>هذا الأسبوع</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#4CAF50' }}>{weekOrders.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--txt2)' }}>{fmt(weekTotal)} ريال</div>
        </div>
        <div className="card" style={{ flex: 1, minWidth: '140px', textAlign: 'center', padding: '16px' }}>
          <div style={{ fontSize: '10px', color: 'var(--txt3)', marginBottom: '4px' }}>هذا الشهر</div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#2196F3' }}>{monthOrders.length}</div>
          <div style={{ fontSize: '11px', color: 'var(--txt2)' }}>{fmt(monthTotal)} ريال</div>
        </div>
      </div>

      {/* Orders List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* List Header */}
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--brd)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700 }}>📋 آخر الطلبات</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['all', 'pending', 'processing', 'completed', 'cancelled', 'refunded'].map(s => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? '' : 'btn-plain'}`}
                style={{ fontSize: '10px', padding: '3px 8px' }}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'الكل' : STATUS_LABELS[s] ?? s}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px' }}>
            <div className="icon">🛍️</div>
            <h3>لا توجد طلبات</h3>
            <p>ستظهر هنا بعد ربط سلة بالنظام</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((o, i) => {
              const d = new Date(o.created_at);
              const dateStr = `${d.getDate()} ${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`;
              const timeStr = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
              const statusColor = STATUS_COLORS[o.status] ?? '#888';
              const statusLabel = STATUS_LABELS[o.status] ?? o.status ?? 'غير محدد';
              return (
                <div
                  key={o.id ?? i}
                  style={{ padding: '12px 16px', borderBottom: '1px solid var(--brd)', display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <div style={{ width: '3px', height: '44px', borderRadius: '2px', background: statusColor, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700 }}>
                        #{o.order_number ?? o.salla_order_id ?? '—'}
                      </span>
                      <span className="badge" style={{ background: `${statusColor}22`, color: statusColor, fontSize: '9px' }}>
                        {statusLabel}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--txt2)' }}>{o.customer_name ?? 'عميل'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--txt3)', marginTop: '2px' }}>
                      {dateStr} — {timeStr}
                    </div>
                  </div>
                  <div style={{ textAlign: 'left', flexShrink: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gold)' }}>
                      {fmt(parseFloat(String(o.total_amount ?? 0)))}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--txt3)' }}>{o.currency ?? 'SAR'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
