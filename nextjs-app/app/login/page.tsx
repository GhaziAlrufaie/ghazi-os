'use client';
/*
 * Ghazi OS — Legendary Edition
 * Login Page: صفحة تسجيل الدخول
 * خلفية: #05070d + Aurora + Noise
 * البطاقة: glass morphism ذهبي
 */
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'خطأ في تسجيل الدخول');
        setShake(true);
        setTimeout(() => setShake(false), 600);
        setPassword('');
      }
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      dir="rtl"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        position: 'relative',
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: 'rgba(8, 11, 20, 0.85)',
          border: '1px solid rgba(201, 150, 59, 0.2)',
          borderRadius: 24,
          padding: '48px 40px',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(201,150,59,0.06)',
          transform: shake ? 'translateX(8px)' : 'none',
          transition: 'transform 0.1s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Corner glow */}
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -60,
            width: 180,
            height: 180,
            background: 'radial-gradient(circle, rgba(201,150,59,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div
            style={{
              fontSize: 36,
              fontWeight: 200,
              letterSpacing: '-0.04em',
              background: 'linear-gradient(135deg, #E8C068, #C9963B)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: 6,
              lineHeight: 1,
            }}
          >
            Ghazi OS
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(255,255,255,0.28)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}
          >
            نظام إدارة الأعمال
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* اسم المستخدم */}
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 6,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              اسم المستخدم
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && document.getElementById('pass-input')?.focus()}
              autoComplete="username"
              required
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 10,
                padding: '11px 14px',
                color: 'rgba(255,255,255,0.92)',
                fontSize: 14,
                fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(201,150,59,0.4)';
                e.target.style.boxShadow = '0 0 0 3px rgba(201,150,59,0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.10)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* كلمة المرور */}
          <div style={{ marginBottom: 24 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                color: 'rgba(255,255,255,0.4)',
                marginBottom: 6,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              كلمة المرور
            </label>
            <input
              id="pass-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 10,
                padding: '11px 14px',
                color: 'rgba(255,255,255,0.92)',
                fontSize: 14,
                fontFamily: 'IBM Plex Sans Arabic, sans-serif',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.3s, box-shadow 0.3s',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'rgba(201,150,59,0.4)';
                e.target.style.boxShadow = '0 0 0 3px rgba(201,150,59,0.08)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255,255,255,0.10)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div
              style={{
                background: 'rgba(231,76,60,0.08)',
                border: '1px solid rgba(231,76,60,0.25)',
                borderRadius: 10,
                padding: '10px 14px',
                color: '#e74c3c',
                fontSize: 13,
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}

          {/* زر الدخول */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading
                ? 'rgba(255,255,255,0.05)'
                : 'linear-gradient(135deg, #C9963B, #8B6914)',
              border: 'none',
              borderRadius: 12,
              padding: '13px',
              color: loading ? 'rgba(255,255,255,0.3)' : '#05070d',
              fontSize: 14,
              fontWeight: 600,
              fontFamily: 'IBM Plex Sans Arabic, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
              boxShadow: loading ? 'none' : '0 4px 20px rgba(201,150,59,0.3)',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 30px rgba(201,150,59,0.45)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(201,150,59,0.3)';
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
              }
            }}
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>

        {/* Version */}
        <div
          style={{
            textAlign: 'center',
            marginTop: 24,
            fontSize: 10,
            color: 'rgba(255,255,255,0.15)',
            letterSpacing: '0.06em',
          }}
        >
          Ghazi OS v9 — Legendary Edition
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
