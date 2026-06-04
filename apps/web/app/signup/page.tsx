'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    // Mock signup: store user in localStorage
    const users = JSON.parse(localStorage.getItem('vatrate_users') || '[]');
    if (users.find((u: any) => u.email === email)) {
      setError('An account with this email already exists.');
      return;
    }

    users.push({ email, password });
    localStorage.setItem('vatrate_users', JSON.stringify(users));
    localStorage.setItem('vatrate_user', email);
    router.push('/dashboard');
  };

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
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 8, border: '1px solid #e5e7eb',
                  fontSize: 15, outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>
            <button type="submit" style={{
              padding: '14px', background: '#2563eb', color: 'white', border: 'none',
              borderRadius: 10, fontSize: 16, fontWeight: 600, cursor: 'pointer',
            }}>
              Create Account
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
