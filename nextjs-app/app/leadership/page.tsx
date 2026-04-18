/*
 * Ghazi OS — Leadership Page (Placeholder)
 * المرحلة 2 — لم تُنفَّذ بعد
 */
export const dynamic = 'force-dynamic';

export default function LeadershipPage() {
  return (
    <div style={{ padding: '32px 24px' }}>
      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--txt)', marginBottom: 4 }}>
          المركز القيادي
        </h1>
        <p style={{ fontSize: 13, color: 'var(--txt3)' }}>
          هذه الصفحة قيد التطوير — المرحلة 2
        </p>
      </div>

      {/* Placeholder */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px dashed var(--brd)',
          borderRadius: 12,
          padding: '48px 24px',
          textAlign: 'center',
          color: 'var(--txt3)',
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏗</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--txt2)', marginBottom: 8 }}>
          Dashboard — قريباً
        </div>
        <div style={{ fontSize: 12 }}>
          سيتضمن: بوصلة الأسبوع، الشيء الواحد الآن، القرارات المعلقة، صندوق الوارد، الفريق
        </div>
      </div>
    </div>
  );
}
