'use client';
/*
 * Ghazi OS — Login Page
 * مطابق للأصل: light theme, IBM Plex Sans Arabic
 * CSS classes من globals.css: .login-screen, .login-box, etc.
 */
import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || 'كلمة المرور غير صحيحة');
        setPassword('');
      }
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        {/* Logo */}
        <div className="login-logo">
          <div className="login-logo-box">G</div>
          <div className="login-logo-txt">
            <h1>Ghazi OS</h1>
            <p>نظام إدارة الأعمال</p>
          </div>
        </div>

        <h2>مرحباً بعودتك 👋</h2>

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="pass-input">كلمة المرور</label>
            <input
              id="pass-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
              placeholder="أدخل كلمة المرور"
            />
          </div>

          <div className="login-err">{error}</div>

          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>

        <div className="login-footer">
          Ghazi OS v2.0 — 2025
        </div>
      </div>
    </div>
  );
}
