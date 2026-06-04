'use client';

import Link from 'next/link';

// Mock data for demo
const MOCK_API_KEY = 'vr_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const MOCK_USAGE = { today: 42, thisMonth: 890, limit: 1000 };

export default function DashboardPage() {
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
            <Link href="/docs" style={{ color: '#4b5563', textDecoration: 'none' }}>Docs</Link>
            <Link href="/pricing" style={{ color: '#4b5563', textDecoration: 'none' }}>Pricing</Link>
            <Link href="/dashboard" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Dashboard</Link>
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 8px' }}>Dashboard</h1>
        <p style={{ color: '#6b7280', margin: '0 0 32px' }}>Manage your API keys and monitor usage.</p>

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
