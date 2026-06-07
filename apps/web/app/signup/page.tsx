'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OAuthButtons from '@/components/oauth-buttons';

const s = {
  page: { minHeight: '100vh', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 50%, #f0f0ff 100%)' },
  left: { flex: 1, display: 'flex', flexDirection: 'column' as const, justifyContent: 'center', padding: '40px 60px', maxWidth: 520 },
  right: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40, background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', position: 'relative' as const, overflow: 'hidden' },
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

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'signup' | 'verify'>('signup');
  const [verificationCode, setVerificationCode] = useState('');
  const [createdEmail, setCreatedEmail] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to create account.');
        setLoading(false);
        return;
      }

      setCreatedEmail(email);
      setStep('verify');
      setLoading(false);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!verificationCode) {
      setError('Please enter the verification code.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/verify-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: createdEmail, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Invalid verification code.');
        setLoading(false);
        return;
      }

      // Auto-login
      const loginRes = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: createdEmail, password }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok) {
        localStorage.setItem('vatrate_user', loginData.user?.email || createdEmail);
        localStorage.setItem('vatrate_token', loginData.token);
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/verify-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: createdEmail }),
      });
      if (res.ok) {
        alert('A new verification code has been sent to your email.');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to resend code.');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  // --- VERIFY STEP ---
  if (step === 'verify') {
    return (
      <div style={s.page}>
        <div style={s.left}>
          <div style={s.card}>
            <Link href="/" style={{...s.logo, display: 'inline-block', marginBottom: 40}}>
              VAT<span style={{color: '#1e293b'}}>Rate</span>
            </Link>

            <div style={{textAlign: 'center', marginBottom: 32}}>
              <div style={{fontSize: 48, marginBottom: 16}}>📧</div>
              <h1 style={s.title}>Verify your email</h1>
              <p style={{...s.subtitle, marginBottom: 0}}>
                We sent a verification code to<br />
                <strong style={{color: '#0f172a'}}>{createdEmail}</strong>
              </p>
            </div>

            {error && <div style={s.errorBox}>{error}</div>}

            <form onSubmit={handleVerifyCode} style={{display: 'flex', flexDirection: 'column', gap: 16}}>
              <div>
                <label style={s.label}>Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  disabled={loading}
                  style={{...s.input, fontSize: 28, textAlign: 'center', letterSpacing: 10, fontFamily: 'monospace'}}
                />
              </div>
              <button type="submit" disabled={loading} style={loading ? s.btnDisabled : s.btn}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div style={{textAlign: 'center', marginTop: 20}}>
              <button onClick={handleResendCode} disabled={loading} style={{
                background: 'none', border: 'none', color: '#2563eb', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 500, textDecoration: 'underline',
              }}>
                Resend verification code
              </button>
            </div>
          </div>
        </div>
        <div style={s.right}>
          <div style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(37,99,235,0.1) 0%, transparent 60%)',
            position: 'absolute', inset: 0, pointerEvents: 'none',
          }} />
          <div style={{maxWidth: 380, position: 'relative', zIndex: 1, textAlign: 'center'}}>
            <div style={{fontSize: 64, marginBottom: 20}}>🔐</div>
            <h3 style={{fontSize: 22, fontWeight: 700, color: 'white', margin: '0 0 12px'}}>
              One last step!
            </h3>
            <p style={{color: '#94a3b8', lineHeight: 1.7, margin: 0, fontSize: 15}}>
              We need to verify your email address to ensure secure access to the API. 
              The code expires in 10 minutes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // --- SIGNUP STEP ---
  return (
    <div style={s.page}>
      <div style={s.left}>
        <div style={s.card}>
          <Link href="/" style={{...s.logo, display: 'inline-block', marginBottom: 40}}>
            VAT<span style={{color: '#1e293b'}}>Rate</span>
          </Link>

          <h1 style={s.title}>Create your account</h1>
          <p style={s.subtitle}>Get your free API key in seconds. No credit card required.</p>

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
              <label style={s.label}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters" disabled={loading}
                style={s.input}
                onFocus={e => e.target.style.borderColor = '#2563eb'}
                onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <button type="submit" disabled={loading} style={loading ? s.btnDisabled : s.btn}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <OAuthButtons mode="signup" />

          <p style={{textAlign: 'center', color: '#64748b', fontSize: 14, marginTop: 24}}>
            Already have an account?{' '}
            <Link href="/login" style={s.link}>Sign in</Link>
          </p>

          <div style={{marginTop: 24, padding: '16px 20px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0'}}>
            <div style={{fontSize: 13, fontWeight: 700, color: '#0f172a', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1}}>
              What you get
            </div>
            {['100 API requests/month', 'All 27 EU countries', 'OSS threshold checker', 'Upcoming rate alerts'].map((f, i) => (
              <div key={i} style={{fontSize: 14, color: '#64748b', padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8}}>
                <span style={{color: '#22c55e'}}>✓</span> {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={s.right}>
        <div style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(37,99,235,0.1) 0%, transparent 60%)',
          position: 'absolute', inset: 0, pointerEvents: 'none',
        }} />
        <div style={{maxWidth: 420, position: 'relative', zIndex: 1}}>
          <div style={{
            background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)',
            borderRadius: 24, padding: 40, border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{fontSize: 48, marginBottom: 16}}>⚡</div>
            <h3 style={{fontSize: 22, fontWeight: 700, color: 'white', margin: '0 0 12px'}}>
              Free tier, seriously free
            </h3>
            <p style={{color: '#94a3b8', lineHeight: 1.7, margin: 0, fontSize: 15}}>
              100 API requests per month at no cost. No credit card, no commitment. 
              Upgrade when you need more.
            </p>
            <div style={{
              marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            }}>
              {[
                {val: '100', label: 'Requests/mo'},
                {val: '27', label: 'EU Countries'},
                {val: '99.9%', label: 'Uptime'},
                {val: '€0', label: 'To start'},
              ].map((stat, i) => (
                <div key={i} style={{padding: 16, background: 'rgba(255,255,255,0.05)', borderRadius: 12, textAlign: 'center'}}>
                  <div style={{fontSize: 24, fontWeight: 800, color: 'white'}}>{stat.val}</div>
                  <div style={{fontSize: 12, color: '#64748b', marginTop: 2}}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
