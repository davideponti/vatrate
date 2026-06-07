'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OAuthButtons from '@/components/oauth-buttons';

const s = {
  page: { minHeight: '100vh', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f0f0ff 100%)' },
  left: { flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', padding: '40px 60px', maxWidth: 520 },
  right: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', position: 'relative' as const, overflow: 'hidden' },
  card: { width: '100%', maxWidth: 400 },
  logo: { fontSize: 22, fontWeight: 800, color: '#2563eb', textDecoration: 'none', letterSpacing: '-0.5px' },
  title: { fontSize: 30, fontWeight: 800, margin: '0 0 4px', color: '#0f172a', letterSpacing: '-0.5px' },
  subtitle: { color: '#64748b', fontSize: 15, margin: '0 0 32px', lineHeight: 1.5 },
  input: { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0', fontSize: 15, outline: 'none', boxSizing: 'border-box' as const, transition: 'all 0.15s ease', background: '#f8fafc' },
  label: { fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151' },
  btn: { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 14px rgba(37,99,235,0.3)' },
  btnDisabled: { width: '100%', padding: '14px', background: '#93c5fd', color: 'white', border: 'none', borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'not-allowed' },
  errorBox: { background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 14, marginBottom: 16, border: '1px solid #fecaca' },
  link: { color: '#2563eb', fontWeight: 600, textDecoration: 'none' },
};

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const router = useRouter();

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/auth/verify-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        alert('A new verification code has been sent to your email.');
        router.push('/signup');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to resend code.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNeedsVerification(false);
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'EMAIL_NOT_VERIFIED') {
          setNeedsVerification(true);
          setError('Please verify your email before signing in.');
        } else {
          setError(data.message || 'Invalid credentials.');
        }
        setLoading(false);
        return;
      }

      localStorage.setItem('vatrate_user', data.user?.email || email);
      localStorage.setItem('vatrate_token', data.token);
      router.push('/dashboard');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* Left - Form */}
      <div style={s.left}>
        <div style={s.card}>
          <Link href="/" style={{...s.logo, display: 'inline-block', marginBottom: 40}}>
            VAT<span style={{color: '#1e293b'}}>Rate</span>
          </Link>

          <h1 style={s.title}>Welcome back</h1>
          <p style={s.subtitle}>Sign in to your VATRate dashboard.</p>

          {error && <div style={s.errorBox}>{error}</div>}

          <form onSubmit={handleSubmit} style={{display: 'flex', flexDirection: 'column', gap: 20}}>
            <div>
              <label style={s.label}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" disabled={loading}
                style={s.input}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6}}>
                <label style={s.label}>Password</label>
                <Link href="/forgot-password" style={{fontSize: 13, color: '#2563eb', fontWeight: 500, textDecoration: 'none'}}>
                  Forgot password?
                </Link>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" disabled={loading}
                style={s.input}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <button type="submit" disabled={loading} style={loading ? s.btnDisabled : s.btn}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <OAuthButtons mode="login" />

          {needsVerification && (
            <div style={{textAlign: 'center', marginTop: 16}}>
              <button onClick={handleResendVerification} disabled={loading} style={{
                background: 'none', border: 'none', color: '#2563eb', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 500, textDecoration: 'underline',
              }}>
                Resend verification code
              </button>
            </div>
          )}
          <p style={{textAlign: 'center', color: '#64748b', fontSize: 14, marginTop: needsVerification ? 12 : 24}}>
            Don't have an account?{' '}
            <Link href="/signup" style={s.link}>Sign up</Link>
          </p>
        </div>
      </div>

      {/* Right - Branding */}
      <div style={s.right}>
        <div style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(37,99,235,0.1) 0%, transparent 60%)',
          position: 'absolute', inset: 0, pointerEvents: 'none',
        }} />
        <div style={{maxWidth: 420, position: 'relative', zIndex: 1}}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(20px)',
            borderRadius: 24,
            padding: 40,
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{fontSize: 48, marginBottom: 16}}>🇪🇺</div>
            <h3 style={{fontSize: 22, fontWeight: 700, color: 'white', margin: '0 0 12px'}}>
              EU VAT Made Simple
            </h3>
            <p style={{color: '#94a3b8', lineHeight: 1.7, margin: 0, fontSize: 15}}>
              One API for all 27 EU countries. Get accurate VAT rates, 
              check OSS thresholds, and classify products — all in milliseconds.
            </p>
            <div style={{
              marginTop: 24, padding: 16, background: 'rgba(255,255,255,0.05)',
              borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <code style={{color: '#e2e8f0', fontSize: 13, fontFamily: 'monospace', lineHeight: 1.8}}>
                <span style={{color: '#22c55e'}}>$</span> curl https://vatrate.eu/api/v1/rate?country=DE<br />
                <span style={{color: '#64748b'}}>// → {`{"rate": 19, "mechanism": "standard"}`}</span>
              </code>
            </div>
          </div>
          <div style={{display: 'flex', gap: 16, marginTop: 24, justifyContent: 'center'}}>
            {['🇩🇪', '🇫🇷', '🇮🇹', '🇪🇸', '🇳🇱', '🇧🇪'].map((flag, i) => (
              <span key={i} style={{fontSize: 28}}>{flag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
