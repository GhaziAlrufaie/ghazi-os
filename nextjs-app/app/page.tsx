export const dynamic = 'force-dynamic';
/*
 * Ghazi OS — Legendary Edition
 * Dashboard Page: لوحة القيادة
 * Server Component — يقرأ البيانات من Supabase مباشرة
 */
import { createServerClient } from '@/lib/supabase';

async function getDashboardData() {
  try {
    const supabase = createServerClient();
    const [tasksRes, brandsRes, decisionsRes] = await Promise.all([
      supabase.from('tasks').select('id, status', { count: 'exact' }).neq('status', 'done'),
      supabase.from('brands').select('id', { count: 'exact' }).eq('status', 'active'),
      supabase.from('decisions').select('id', { count: 'exact' }).eq('status', 'pending'),
    ]);
    return {
      activeTasks: tasksRes.count ?? 0,
      activeBrands: brandsRes.count ?? 0,
      pendingDecisions: decisionsRes.count ?? 0,
    };
  } catch {
    return { activeTasks: 0, activeBrands: 0, pendingDecisions: 0 };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  const stats = [
    { label: 'المهام النشطة', value: String(data.activeTasks).padStart(2, '0'), color: 'var(--info)' },
    { label: 'البراندات النشطة', value: String(data.activeBrands).padStart(2, '0'), color: 'var(--gold)' },
    { label: 'القرارات المعلقة', value: String(data.pendingDecisions).padStart(2, '0'), color: 'var(--warning)' },
  ];

  return (
    <div>
      {/* Page Header */}
      <div style={{ padding: '32px 24px 0', marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>
          لوحة القيادة
        </h1>
        <p style={{ fontSize: 13, color: 'var(--txt3)' }}>
          مرحباً يا غازي — نظام إدارة الأعمال جاهز
        </p>
      </div>

      {/* Stats Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
          padding: '0 24px',
        }}
      >
        {stats.map((stat) => (
          <div key={stat.label} className="card">
            <div
              style={{
                fontSize: 11,
                color: 'var(--txt3)',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              {stat.label}
            </div>
            <div
              style={{
                fontSize: 40,
                fontWeight: 200,
                color: stat.color,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Status Banner */}
      <div
        className="card"
        style={{
          background: 'rgba(201,168,76,0.04)',
          borderColor: 'rgba(201,168,76,0.15)',
          margin: '0 24px',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: 'var(--gold)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom: 12,
          }}
        >
          حالة النظام
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { label: 'Next.js 15 (App Router)', status: 'يعمل' },
            { label: 'Supabase PostgreSQL', status: 'متصل' },
            { label: 'نظام المصادقة (Server-side)', status: 'آمن' },
            { label: 'قسم الإعدادات', status: 'مكتمل' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '6px 0',
                borderBottom: '1px solid var(--brd)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--txt2)' }}>{item.label}</span>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--success)',
                  background: 'rgba(46,204,113,0.1)',
                  padding: '2px 10px',
                  borderRadius: 20,
                  border: '1px solid rgba(46,204,113,0.2)',
                }}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
