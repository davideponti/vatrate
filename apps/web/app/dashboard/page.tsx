'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

// Mock data for demo
const MOCK_API_KEY = 'vr_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const MOCK_USAGE = { today: 42, thisMonth: 890, limit: 1000 };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('vatrate_user');
    if (!loggedInUser) {
      router.push('/login');
    } else {
      setUser(loggedInUser);
      setLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('vatrate_user');
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ fontSize: 16, color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f9fafb' }}>
      {/* Nav */}
      <header style={{
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        background: 'white',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Link href="/" style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#2563eb',
            textDecoration: 'none',
          }}>
            VATRate
          </Link>
          <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link href="/" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>Home</Link>
            <Link href="/docs" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>Docs</Link>
            <Link href="/pricing" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>Pricing</Link>
            <Link href="/dashboard" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>Dashboard</Link>
            <button onClick={handleLogout} style={{
              padding: '8px 20px',
              background: '#dc2626',
              color: 'white',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}>
              Logout
            </button>
            <a href="https://github.com/davideponti/vatrate" target="_blank" rel="noopener noreferrer"
              style={{
                padding: '8px 20px',
                background: '#1e293b',
                color: 'white',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
              }}>
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px' }}>Dashboard</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Welcome, <strong>{user}</strong>. Manage your API keys and monitor usage.
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}>
          {[
            { label: 'API Requests Today', value: MOCK_USAGE.today },
            { label: 'API Requests This Month', value: `${MOCK_USAGE.thisMonth} / ${MOCK_USAGE.limit}` },
            { label: 'Plan', value: 'Basic' },
            { label: 'Status', value: 'Active', color: '#059669' },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: 20,
              background: 'white',
              borderRadius: 12,
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{stat.label}</div>
              <div style={{
                fontSize: 24,
                fontWeight: 700,
                color: stat.color || '#1a1a2e',
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* API Key */}
        <div style={{
          padding: 24,
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px' }}>Your API Key</h2>
          <div style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            background: '#f3f4f6',
            padding: '12px 16px',
            borderRadius: 8,
            fontFamily: 'monospace',
            fontSize: 14,
          }}>
            <span style={{ flex: 1 }}>{MOCK_API_KEY}</span>
            <button
              onClick={() => navigator.clipboard.writeText(MOCK_API_KEY)}
              style={{
                padding: '6px 12px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}>
              Copy
            </button>
          </div>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: '8px 0 0' }}>
            Include this key in the Authorization header: <code style={{ background: '#f3f4f6', padding: '2px 4px', borderRadius: 3 }}>Bearer vr_live_...</code>
          </p>
        </div>

        {/* Recent Activity */}
        <div style={{
          padding: 24,
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Recent Activity</h2>
          <div style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>
            No recent activity to display. Start making API requests to see your usage here.
          </div>
        </div>
      </div>
    </div>
  );
}
