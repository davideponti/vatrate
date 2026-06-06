'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
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

      // Store user and session token
      localStorage.setItem('vatrate_user', data.user.email);
      localStorage.setItem('vatrate_token', data.token);

      // Show the API key
      setNewKey(data.api_key);

      // Redirect after a moment
      setTimeout(() => {
        router.push('/dashboard');
      }, 5000);
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  if (newKey) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 500, width: '100%', background: 'white', borderRadius: 16, padding: 40, border: '1px solid #e5e7eb', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 8px' }}>Account Created!</h1>
          <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 24px' }}>
            Here is your API key — save it now. You won't see it again!
          </p>

          <div style={{
            background: '#f0fdf4',
            border: '2px solid #22c55e',
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}>
            <div style={{
              fontFamily: 'monospace',
              fontSize: 13,
              wordBreak: 'break-all',
              background: 'white',
              padding: 12,
              borderRadius: 8,
              border: '1px solid #bbf7d0',
              marginBottom: 12,
              textAlign: 'left',
            }}>
              {newKey}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(newKey);
              }}
              style={{
                padding: '10px 20px',
                background: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
                width: '100%',
              }}>
              Copy API Key
            </button>
          </div>

          <p style={{ fontSize: 14, color: '#9ca3af' }}>
            Redirecting to dashboard...
          </p>
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
