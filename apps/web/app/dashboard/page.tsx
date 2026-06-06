'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  environment: string;
  plan: string;
  requests_used: number;
  requests_limit: number;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
  revoked_at: string | null;
}

interface UserData {
  email: string;
  plan: string;
  requests_used: number;
  requests_limit: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');
  const [showKeyForm, setShowKeyForm] = useState(false);

  useEffect(() => {
    const email = localStorage.getItem('vatrate_user');
    const token = localStorage.getItem('vatrate_token');

    if (!email || !token) {
      router.push('/login');
      return;
    }

    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      // Fetch API keys
      const keysRes = await fetch('/api/v1/keys', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (keysRes.status === 401) {
        // Token expired or invalid, redirect to login
        localStorage.removeItem('vatrate_user');
        localStorage.removeItem('vatrate_token');
        router.push('/login');
        return;
      }

      if (keysRes.ok) {
        const keysData = await keysRes.json();
        setApiKeys(keysData.keys || []);
      }

      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data.');
      setLoading(false);
    }
  };

  const handleGenerateKey = async () => {
    setError('');
    const token = localStorage.getItem('vatrate_token');
    if (!token) return;

    const name = keyName.trim() || `Key ${apiKeys.length + 1}`;

    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const data = await res.json();
        setNewKey(data.key.full_key);
        setKeyName('');
        setShowKeyForm(false);
        // Refresh the list
        fetchData(token);
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to generate key');
      }
    } catch (err) {
      setError('Failed to generate API key.');
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? This action cannot be undone.')) {
      return;
    }

    const token = localStorage.getItem('vatrate_token');
    if (!token) return;

    try {
      const res = await fetch(`/api/v1/keys/${keyId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setApiKeys((prev) => prev.filter((k) => k.id !== keyId));
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to revoke key');
      }
    } catch (err) {
      setError('Failed to revoke API key.');
    }
  };

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleLogout = () => {
    localStorage.removeItem('vatrate_user');
    localStorage.removeItem('vatrate_token');
    router.push('/');
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ fontSize: 16, color: '#6b7280' }}>Loading...</div>
      </div>
    );
  }

  const totalUsed = apiKeys.reduce((sum, k) => sum + k.requests_used, 0);
  const totalLimit = apiKeys.length > 0 ? apiKeys[0].requests_limit : 0;
  const activeKeys = apiKeys.filter((k) => k.is_active && !k.revoked_at);

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
          <Link href="/dashboard" style={{
            fontSize: 24,
            fontWeight: 700,
            color: '#2563eb',
            textDecoration: 'none',
          }}>
            VATRate
          </Link>
          <nav style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            <Link href="/dashboard" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>Dashboard</Link>
            <Link href="/dashboard/logs" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>Logs</Link>
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
              Manage your API keys and monitor usage.
            </p>
          </div>
          <button onClick={() => setShowKeyForm(true)} style={{
            padding: '12px 24px',
            background: '#2563eb',
            color: 'white',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
          }}>
            + Generate New Key
          </button>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Key Generation Form */}
        {showKeyForm && (
          <div style={{
            padding: 20,
            background: 'white',
            borderRadius: 12,
            border: '2px solid #2563eb',
            marginBottom: 24,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 12px', color: '#1e40af' }}>
              Name your API Key
            </h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="My API Key"
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  fontSize: 15,
                  outline: 'none',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerateKey();
                  if (e.key === 'Escape') setShowKeyForm(false);
                }}
                autoFocus
              />
              <button onClick={handleGenerateKey} style={{
                padding: '10px 20px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}>
                Generate
              </button>
              <button onClick={() => setShowKeyForm(false)} style={{
                padding: '10px 20px',
                background: '#f3f4f6',
                color: '#4b5563',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* New Key Display */}
        {newKey && (
          <div style={{
            padding: 20,
            background: '#f0fdf4',
            borderRadius: 12,
            border: '2px solid #22c55e',
            marginBottom: 24,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: '#166534' }}>
              🎉 New API Key Generated
            </h3>
            <p style={{ fontSize: 14, color: '#15803d', margin: '0 0 12px' }}>
              Save this key now — it will not be shown again!
            </p>
            <div style={{
              display: 'flex',
              gap: 8,
              alignItems: 'center',
              background: 'white',
              padding: '12px 16px',
              borderRadius: 8,
              fontFamily: 'monospace',
              fontSize: 13,
              border: '1px solid #bbf7d0',
            }}>
              <span style={{ flex: 1, wordBreak: 'break-all' }}>{newKey}</span>
              <button
                onClick={() => handleCopyKey(newKey, 'new-key')}
                style={{
                  padding: '6px 12px',
                  background: '#22c55e',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                }}>
                {copiedIndex === 'new-key' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 32,
        }}>
          {[
            { label: 'Active Keys', value: activeKeys.length },
            { label: 'API Requests This Month', value: `${totalUsed} / ${totalLimit}` },
            { label: 'Plan', value: apiKeys[0]?.plan || 'free' },
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

        {/* API Keys List */}
        <div style={{
          padding: 24,
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          marginBottom: 32,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Your API Keys</h2>

          {apiKeys.length === 0 ? (
            <div style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0', fontSize: 14 }}>
              No API keys yet. Click "Generate New Key" to create one.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeKeys.map((key) => (
                <div key={key.id} style={{
                  padding: 16,
                  background: '#f9fafb',
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{key.name}</div>
                      <div style={{
                        fontFamily: 'monospace',
                        fontSize: 13,
                        color: '#6b7280',
                        marginTop: 4,
                      }}>
                        {key.key_prefix}...
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 600,
                        background: key.environment === 'live' ? '#dbeafe' : '#fef3c7',
                        color: key.environment === 'live' ? '#1d4ed8' : '#92400e',
                      }}>
                        {key.environment}
                      </span>
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        style={{
                          padding: '4px 10px',
                          background: '#fef2f2',
                          color: '#dc2626',
                          border: '1px solid #fecaca',
                          borderRadius: 6,
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 600,
                        }}>
                        Revoke
                      </button>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', gap: 16 }}>
                    <span>Used: {key.requests_used} / {key.requests_limit}</span>
                    <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                    {key.last_used_at && <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Usage Info */}
        <div style={{
          padding: 24,
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>Quick Start</h2>
          <div style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.7 }}>
            <p style={{ margin: '0 0 8px' }}>
              Use your API key in the Authorization header:
            </p>
            <pre style={{
              background: '#1e293b',
              color: '#e2e8f0',
              padding: '12px 16px',
              borderRadius: 8,
              fontSize: 13,
              overflow: 'auto',
            }}>
{`curl -H "Authorization: Bearer ${apiKeys[0]?.key_prefix || 'vr_live_...'}" \\
  "https://vatrate.eu/api/v1/rate?country=DE&type=saas&customer=business"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
