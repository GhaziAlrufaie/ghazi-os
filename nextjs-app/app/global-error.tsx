'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ background: '#05070d', color: '#C9963B', fontFamily: 'IBM Plex Sans Arabic, sans-serif', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', margin: 0 }}>
        <h1>حدث خطأ ما</h1>
        <button onClick={reset} style={{ color: '#C9963B', background: 'none', border: '1px solid #C9963B', padding: '0.5rem 1rem', cursor: 'pointer', marginTop: '1rem' }}>
          إعادة المحاولة
        </button>
      </body>
    </html>
  );
}
