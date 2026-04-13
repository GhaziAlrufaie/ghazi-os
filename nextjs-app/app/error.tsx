'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      height: '100vh',
      color: '#C9963B',
      fontFamily: 'IBM Plex Sans Arabic, sans-serif',
      background: '#05070d'
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>500</h1>
      <p>حدث خطأ ما</p>
      <button 
        onClick={reset}
        style={{ color: '#C9963B', marginTop: '1rem', background: 'none', border: '1px solid #C9963B', padding: '0.5rem 1rem', cursor: 'pointer' }}
      >
        إعادة المحاولة
      </button>
    </div>
  );
}
