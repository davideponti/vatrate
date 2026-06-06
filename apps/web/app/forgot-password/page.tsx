'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!email) {
      setError('Please enter your email address.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Something went wrong.');
        setLoading(false);
        return;
      }

      setSuccess(
        data.message ||
          'If an account with that email exists, a password reset link has been sent.',
      );
      setLoading(false);
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#f9fafb',
      }}>
      <header
        style={{
          borderBottom: '1px solid #e5e7eb',
          padding: '16px 24px',
          background: 'white',
        }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Link
            href="/"
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#2563eb',
              textDecoration: 'none',
            }}>
            VATRate
          </Link>
          <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link
              href="/"
              style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>
              Home
            </Link>
            <Link
              href="/docs"
              style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>
              Docs
            </Link>
            <Link
              href="/pricing"
              style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>
              Pricing
            </Link>
            <Link
              href="/login"
              style={{
                color: '#2563eb',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 600,
              }}>
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
        <div
          style={{
            width: '100%',
            maxWidth: 400,
            background: 'white',
            borderRadius: 16,
            padding: 40,
            border: '1px solid #e5e7eb',
          }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              margin: '0 0 4px',
              textAlign: 'center',
            }}>
            Reset your password
          </h1>
          <p
            style={{
              color: '#6b7280',
              fontSize: 15,
              textAlign: 'center',
              margin: '0 0 32px',
            }}>
            Enter your email and we'll send you a reset link.
          </p>

          {error && (
            <div
              style={{
                background: '#fef2f2',
                color: '#dc2626',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 14,
                marginBottom: 16,
              }}>
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: '#f0fdf4',
                color: '#15803d',
                padding: '12px 16px',
                borderRadius: 8,
                fontSize: 14,
                marginBottom: 16,
              }}>
              {success}
            </div>
          )}

          {!success && (
            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    display: 'block',
                    marginBottom: 6,
                  }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '14px',
                  background: loading ? '#93c5fd' : '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p
            style={{
              textAlign: 'center',
              color: '#6b7280',
              fontSize: 14,
              marginTop: 24,
            }}>
            Remember your password?{' '}
            <Link
              href="/login"
              style={{ color: '#2563eb', fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
