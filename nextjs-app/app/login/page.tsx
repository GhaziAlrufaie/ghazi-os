'use client';

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
        setTimeout(() => setShake(false), 500);
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
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'IBM Plex Sans Arabic', sans-serif",
      }}
    >
      <div
        style={{
          background: '#141414',
          border: '1px solid rgba(201,168,76,0.2)',
          borderRadius: '16px',
          padding: '48px 40px',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 0 60px rgba(201,168,76,0.08)',
          transform: shake ? 'translateX(8px)' : 'none',
          transition: 'transform 0.1s ease',
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#C9A84C',
              letterSpacing: '-1px',
              marginBottom: '4px',
            }}
          >
            Ghazi OS
          </div>
          <div style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>
            نظام إدارة الأعمال
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* حقل اسم المستخدم */}
          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#888',
                marginBottom: '6px',
                fontWeight: '600',
                letterSpacing: '0.5px',
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
                background: '#1e1e1e',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#fff',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C9A84C')}
              onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
            />
          </div>

          {/* حقل كلمة المرور */}
          <div style={{ marginBottom: '24px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                color: '#888',
                marginBottom: '6px',
                fontWeight: '600',
                letterSpacing: '0.5px',
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
                background: '#1e1e1e',
                border: '1px solid #2a2a2a',
                borderRadius: '8px',
                padding: '12px 14px',
                color: '#fff',
                fontSize: '14px',
                fontFamily: 'inherit',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#C9A84C')}
              onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
            />
          </div>

          {/* رسالة الخطأ */}
          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '10px 14px',
                color: '#ef4444',
                fontSize: '13px',
                marginBottom: '16px',
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
              background: loading ? '#2a2a2a' : 'linear-gradient(135deg, #C9A84C, #E8C97A)',
              border: 'none',
              borderRadius: '8px',
              padding: '13px',
              color: loading ? '#666' : '#0a0a0a',
              fontSize: '15px',
              fontWeight: '700',
              fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              letterSpacing: '0.3px',
            }}
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
