export const dynamic = 'force-dynamic';

export default function NotFound() {
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
      <h1 style={{ fontSize: '4rem', margin: 0 }}>404</h1>
      <p>الصفحة غير موجودة</p>
      <a href="/" style={{ color: '#C9963B', marginTop: '1rem' }}>العودة للرئيسية</a>
    </div>
  );
}
