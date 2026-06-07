'use client';

import { useState } from 'react';

interface OAuthButtonsProps {
  mode: 'login' | 'signup';
}

const btnBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: '1px solid #e2e8f0',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  background: 'white',
  color: '#1e293b',
  transition: 'all 0.15s ease',
  boxSizing: 'border-box' as const,
};

const btnDisabled: React.CSSProperties = {
  ...btnBase,
  opacity: 0.6,
  cursor: 'not-allowed',
};

const dividerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  margin: '20px 0',
  color: '#94a3b8',
  fontSize: 13,
  fontWeight: 500,
};

export default function OAuthButtons({ mode }: OAuthButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleOAuth = (provider: 'github' | 'google') => {
    setLoading(provider);
    // Redirect to the OAuth initiation endpoint
    window.location.href = `/api/v1/auth/oauth/${provider}`;
  };

  return (
    <div>
      <div style={dividerStyle}>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
        <span>or continue with</span>
        <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* GitHub Button */}
        <button
          type="button"
          onClick={() => handleOAuth('github')}
          disabled={loading !== null}
          style={loading ? btnDisabled : btnBase}
          onMouseEnter={e => {
            if (!loading) e.currentTarget.style.borderColor = '#94a3b8';
          }}
          onMouseLeave={e => {
            if (!loading) e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          {loading === 'github' ? (
            <span style={{ display: 'inline-block', width: 20, height: 20 }}>
              <svg viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" fill="none" />
                <circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="3" fill="none"
                  strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 16 16" fill="#1e293b">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          )}
          {loading === 'github' ? 'Redirecting to GitHub...' : `${mode === 'login' ? 'Sign in' : 'Sign up'} with GitHub`}
        </button>

        {/* Google Button */}
        <button
          type="button"
          onClick={() => handleOAuth('google')}
          disabled={loading !== null}
          style={loading ? btnDisabled : btnBase}
          onMouseEnter={e => {
            if (!loading) e.currentTarget.style.borderColor = '#94a3b8';
          }}
          onMouseLeave={e => {
            if (!loading) e.currentTarget.style.borderColor = '#e2e8f0';
          }}
        >
          {loading === 'google' ? (
            <span style={{ display: 'inline-block', width: 20, height: 20 }}>
              <svg viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                <circle cx="12" cy="12" r="10" stroke="#e2e8f0" strokeWidth="3" fill="none" />
                <circle cx="12" cy="12" r="10" stroke="#2563eb" strokeWidth="3" fill="none"
                  strokeDasharray="31.4 31.4" strokeLinecap="round" />
              </svg>
            </span>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
          )}
          {loading === 'google' ? 'Redirecting to Google...' : `${mode === 'login' ? 'Sign in' : 'Sign up'} with Google`}
        </button>
      </div>
    </div>
  );
}
