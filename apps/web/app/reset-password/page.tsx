'use client';

import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, Suspense } from 'react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to reset password.');
        setLoading(false);
        return;
      }

      setSuccess('Password reset successfully!');

      // Redirect to login after a moment
      setTimeout(() => {
        router.push('/login');
      }, 3000);
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
          {!token ? (
            <>
              <div
                style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>
                🔗
              </div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  margin: '0 0 8px',
                  textAlign: 'center',
                }}>
                Invalid Reset Link
              </h1>
              <p
                style={{
                  color: '#6b7280',
                  fontSize: 15,
                  textAlign: 'center',
                  margin: '0 0 24px',
                }}>
                This password reset link is missing or invalid. Please request a new one.
              </p>
              <div style={{ textAlign: 'center' }}>
                <Link
                  href="/forgot-password"
                  style={{
                    color: '#2563eb',
                    fontWeight: 600,
                    fontSize: 15,
                  }}>
                  Request new reset link
                </Link>
              </div>
            </>
          ) : success ? (
            <>
              <div
                style={{ fontSize: 48, textAlign: 'center', marginBottom: 16 }}>
                ✅
              </div>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  margin: '0 0 8px',
                  textAlign: 'center',
                }}>
                Password Reset!
              </h1>
              <p
                style={{
                  color: '#6b7280',
                  fontSize: 15,
                  textAlign: 'center',
                  margin: '0 0 8px',
                }}>
                {success}
              </p>
              <p
                style={{
                  color: '#9ca3af',
                  fontSize: 14,
                  textAlign: 'center',
                  margin: 0,
                }}>
                Redirecting to sign in...
              </p>
            </>
          ) : (
            <>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  margin: '0 0 4px',
                  textAlign: 'center',
                }}>
                Set new password
              </h1>
              <p
                style={{
                  color: '#6b7280',
                  fontSize: 15,
                  textAlign: 'center',
                  margin: '0 0 32px',
                }}>
                Enter your new password below.
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

              <form
                onSubmit={handleSubmit}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                }}>
                <div>
                  <label
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: 6,
                    }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
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
                <div>
                  <label
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      display: 'block',
                      marginBottom: 6,
                    }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
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
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <p
                style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: 14,
                  marginTop: 24,
                }}>
                <Link
                  href="/login"
                  style={{ color: '#2563eb', fontWeight: 600 }}>
                  Back to sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f9fafb',
      }}>
        <p style={{ color: '#6b7280', fontSize: 16 }}>Loading...</p>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
