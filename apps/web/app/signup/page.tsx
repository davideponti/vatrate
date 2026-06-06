'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
    } catch (err) {
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

      // Now log in automatically
      const loginRes = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: createdEmail, password }),
      });

      const loginData = await loginRes.json();

      if (loginRes.ok) {
        localStorage.setItem('vatrate_user', loginData.user.email);
        localStorage.setItem('vatrate_token', loginData.token);
        router.push('/dashboard');
      } else {
        // If auto-login fails, redirect to login page
        router.push('/login');
      }
    } catch (err) {
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
        setError('');
        alert('A new verification code has been sent to your email.');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to resend code.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  if (step === 'verify') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
        <header style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 24px', background: 'white' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>VATRate</Link>
          </div>
        </header>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ width: '100%', maxWidth: 420, background: 'white', borderRadius: 16, padding: 40, border: '1px solid #e5e7eb' }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Verify your email</h1>
              <p style={{ color: '#6b7280', fontSize: 15, margin: 0, lineHeight: 1.5 }}>
                We sent a verification code to<br />
                <strong style={{ color: '#1a1a2e' }}>{createdEmail}</strong>
              </p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6 }}>Verification Code</label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px 16px', borderRadius: 8, border: '1px solid #e5e7eb',
                    fontSize: 24, outline: 'none', boxSizing: 'border-box', textAlign: 'center',
                    letterSpacing: 8, fontFamily: 'monospace',
                  }}
                />
              </div>
              <button type="submit" disabled={loading} style={{
                padding: '14px', background: loading ? '#93c5fd' : '#2563eb', color: 'white', border: 'none',
                borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              }}>
                {loading ? 'Verifying...' : 'Verify Email'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button
                onClick={handleResendCode}
                disabled={loading}
                style={{
                  background: 'none', border: 'none', color: '#2563eb', cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 14, fontWeight: 500, textDecoration: 'underline',
                }}>
                Resend verification code
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '16px 24px', background: 'white' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ fontSize: 24, fontWeight: 700, color: '#2563eb', textDecoration: 'none' }}>VATRate</Link>
          <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link href="/" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>Home</Link>
            <Link href="/docs" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>Docs</Link>
            <Link href="/pricing" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>Pricing</Link>
            <Link href="/login" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>Sign In</Link>
          </nav>
        </div>
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400, background: 'white', borderRadius: 16, padding: 40, border: '1px solid #e5e7eb' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px', textAlign: 'center' }}>Create your account</h1>
          <p style={{ color: '#6b7280', fontSize: 15, textAlign: 'center', margin: '0 0 32px' }}>
            Get your free API key in seconds.
          </p>

          {error && (
            <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e5e7eb',
                  fontSize: 15, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6 }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                disabled={loading}
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e5e7eb',
                  fontSize: 15, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <button type="submit" disabled={loading} style={{
              padding: '14px', background: loading ? '#93c5fd' : '#2563eb', color: 'white', border: 'none',
              borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', color: '#6b7280', fontSize: 14, marginTop: 24 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
