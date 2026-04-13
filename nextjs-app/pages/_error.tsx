import type { NextPageContext } from 'next';

interface Props {
  statusCode?: number;
}

function Error({ statusCode }: Props) {
  return (
    <div style={{ 
      textAlign: 'center', 
      paddingTop: '20vh',
      background: '#05070d',
      color: '#C9963B',
      minHeight: '100vh',
      fontFamily: 'IBM Plex Sans Arabic, sans-serif'
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>
        {statusCode || 'خطأ'}
      </h1>
      <p>
        {statusCode === 404 ? 'الصفحة غير موجودة' : 'حدث خطأ في الخادم'}
      </p>
      <a href="/" style={{ color: '#C9963B', marginTop: '1rem', display: 'block' }}>
        العودة للرئيسية
      </a>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? (err as any).statusCode : 404;
  return { statusCode };
};

export default Error;
