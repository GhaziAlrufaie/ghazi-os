import Sidebar from '@/components/Sidebar';

export default function DashboardPage() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content" style={{ padding: '32px' }}>
        <div style={{ maxWidth: '900px' }}>
          {/* Header */}
          <div style={{ marginBottom: '32px' }}>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: '800',
                color: 'var(--txt)',
                letterSpacing: '-0.5px',
              }}
            >
              لوحة القيادة
            </h1>
            <p style={{ color: 'var(--txt2)', fontSize: '14px', marginTop: '4px' }}>
              مرحباً يا غازي — نظام إدارة الأعمال جاهز
            </p>
          </div>

          {/* Status Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '32px',
            }}
          >
            {[
              { label: 'المهام النشطة', value: '—', color: 'var(--accent)' },
              { label: 'البراندات', value: '—', color: 'var(--gold)' },
              { label: 'مبيعات اليوم', value: '—', color: 'var(--success)' },
              { label: 'القرارات المعلقة', value: '—', color: 'var(--warning)' },
            ].map((card) => (
              <div key={card.label} className="card">
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--txt3)',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                    marginBottom: '8px',
                    textTransform: 'uppercase',
                  }}
                >
                  {card.label}
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: '800',
                    color: card.color,
                  }}
                >
                  {card.value}
                </div>
              </div>
            ))}
          </div>

          {/* Migration Notice */}
          <div
            style={{
              background: 'rgba(201,168,76,0.06)',
              border: '1px solid var(--gold-b)',
              borderRadius: '12px',
              padding: '20px 24px',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                fontWeight: '700',
                color: 'var(--gold)',
                marginBottom: '8px',
              }}
            >
              🚀 مرحلة التأسيس مكتملة
            </div>
            <div style={{ fontSize: '13px', color: 'var(--txt2)', lineHeight: '1.7' }}>
              تم تأسيس Next.js 15 بنجاح مع:
              <ul style={{ marginTop: '8px', paddingRight: '20px' }}>
                <li>نظام مصادقة آمن (Server-side + Session Cookie)</li>
                <li>Supabase client منفصل للـ Server والـ Client</li>
                <li>Middleware لحماية كل المسارات</li>
                <li>Sidebar مطابق لـ Ghazi OS</li>
                <li>الخطوة التالية: تفعيل RLS على Supabase</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
