'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ApiKey {
  id: string; name: string; key_prefix: string; environment: string;
  plan: string; requests_used: number; requests_limit: number;
  is_active: boolean; last_used_at: string | null; created_at: string; revoked_at: string | null;
}

const navStyle = {
  header: { padding: '0 32px', background: 'white', borderBottom: '1px solid #f1f5f9' },
  inner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 },
  logo: { fontSize: 20, fontWeight: 800, color: '#2563eb', textDecoration: 'none', letterSpacing: '-0.5px' },
  nav: { display: 'flex', gap: 4, alignItems: 'center', height: '100%' },
  link: (active: boolean) => ({
    padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center',
    color: active ? '#2563eb' : '#64748b', textDecoration: 'none', fontSize: 14,
    fontWeight: active ? 600 : 500, borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
    transition: 'all 0.15s ease',
  }),
  btnGhost: { padding: '8px 16px', background: '#f1f5f9', color: '#0f172a', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, textDecoration: 'none' },
  btnDanger: { padding: '8px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
};

const btnPrimary = { padding: '12px 24px', background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 15, fontWeight: 600, boxShadow: '0 4px 14px rgba(37,99,235,0.3)' };

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [keyName, setKeyName] = useState('');
  const [showForm, setShowForm] = useState(false);

  const getToken = () => localStorage.getItem('vatrate_token');

  useEffect(() => {
    const token = getToken();
    const email = localStorage.getItem('vatrate_user');
    if (!token || !email) { router.push('/login'); return; }
    setUser(email);
    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      const res = await fetch('/api/v1/keys', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.clear(); router.push('/login'); return; }
      if (res.ok) { const d = await res.json(); setApiKeys(d.keys || []); }
    } catch { setError('Failed to load dashboard.'); }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setError('');
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: keyName.trim() || `Key ${apiKeys.length + 1}` }),
      });
      if (res.ok) {
        const d = await res.json();
        setNewKey(d.key.full_key);
        setKeyName(''); setShowForm(false);
        fetchData(token);
      } else {
        const err = await res.json();
        setError(err.message || 'Failed to generate key');
      }
    } catch { setError('Failed to generate API key.'); }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm('Revoke this API key? This cannot be undone.')) return;
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`/api/v1/keys/${keyId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setApiKeys(prev => prev.filter(k => k.id !== keyId));
      else { const err = await res.json(); setError(err.message || 'Failed to revoke'); }
    } catch { setError('Failed to revoke key.'); }
  };

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const logout = () => { localStorage.clear(); router.push('/'); };

  if (loading) return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc'}}>
      <div style={{fontSize: 16, color: '#64748b'}}>Loading...</div>
    </div>
  );

  const activeKeys = apiKeys.filter(k => k.is_active && !k.revoked_at);
  const totalUsed = apiKeys.reduce((s, k) => s + k.requests_used, 0);
  const totalLimit = apiKeys[0]?.requests_limit || 100;

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
      {/* Nav */}
      <header style={navStyle.header}>
        <div style={navStyle.inner}>
          <Link href="/" style={navStyle.logo}>VATRate</Link>
          <nav style={navStyle.nav}>
            <Link href="/dashboard" style={navStyle.link(true)}>Dashboard</Link>
            <Link href="/dashboard/logs" style={navStyle.link(false)}>Logs</Link>
            <Link href="/dashboard/settings" style={navStyle.link(false)}>Settings</Link>
            <a href="https://github.com/davideponti/vatrate" target="_blank" style={navStyle.btnGhost}>GitHub</a>
            <button onClick={logout} style={navStyle.btnDanger}>Logout</button>
          </nav>
        </div>
      </header>

      <div style={{maxWidth: 1000, margin: '0 auto', padding: '40px 24px', width: '100%'}}>
        {/* Header */}
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32}}>
          <div>
            <h1 style={{fontSize: 28, fontWeight: 800, margin: '0 0 4px', color: '#0f172a'}}>Dashboard</h1>
            <p style={{color: '#64748b', margin: 0, fontSize: 15}}>
              Manage your API keys and monitor usage.
            </p>
          </div>
          <button onClick={() => setShowForm(true)} style={btnPrimary}>+ Generate New Key</button>
        </div>

        {error && (
          <div style={{background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 14, marginBottom: 16, border: '1px solid #fecaca'}}>
            {error}
          </div>
        )}

        {/* Key Form */}
        {showForm && (
          <div style={{padding: 20, background: 'white', borderRadius: 12, border: '2px solid #2563eb', marginBottom: 24, boxShadow: '0 4px 12px rgba(37,99,235,0.08)'}}>
            <h3 style={{fontSize: 15, fontWeight: 700, margin: '0 0 12px', color: '#1e40af'}}>Name your API Key</h3>
            <div style={{display: 'flex', gap: 8}}>
              <input type="text" value={keyName} onChange={e => setKeyName(e.target.value)}
                placeholder="My API Key" autoFocus
                style={{flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 15, outline: 'none'}}
                onKeyDown={e => { if (e.key === 'Enter') handleGenerate(); if (e.key === 'Escape') setShowForm(false); }} />
              <button onClick={handleGenerate} style={{padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600}}>Generate</button>
              <button onClick={() => setShowForm(false)} style={{padding: '10px 20px', background: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600}}>Cancel</button>
            </div>
          </div>
        )}

        {/* New Key Display */}
        {newKey && (
          <div style={{padding: 20, background: '#f0fdf4', borderRadius: 12, border: '2px solid #22c55e', marginBottom: 24}}>
            <h3 style={{fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: '#166534'}}>🎉 New API Key Generated</h3>
            <p style={{fontSize: 14, color: '#15803d', margin: '0 0 12px'}}>Save this key now — it will not be shown again!</p>
            <div style={{display: 'flex', gap: 8, alignItems: 'center', background: 'white', padding: '12px 16px', borderRadius: 8, fontFamily: 'monospace', fontSize: 13, border: '1px solid #bbf7d0'}}>
              <span style={{flex: 1, wordBreak: 'break-all'}}>{newKey}</span>
              <button onClick={() => copyKey(newKey, 'new-key')} style={{padding: '6px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap'}}>
                {copiedId === 'new-key' ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        {/* Stats */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32}}>
          {[
            { label: 'Active Keys', value: activeKeys.length, color: '#2563eb' },
            { label: 'API Requests', value: `${totalUsed.toLocaleString()} / ${totalLimit.toLocaleString()}`, color: '#059669' },
            { label: 'Plan', value: apiKeys[0]?.plan || 'free', color: '#d97706' },
            { label: 'Status', value: 'Active', color: '#059669' },
          ].map(s => (
            <div key={s.label} style={{padding: 24, background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
              <div style={{fontSize: 13, color: '#94a3b8', marginBottom: 8, fontWeight: 500}}>{s.label}</div>
              <div style={{fontSize: 26, fontWeight: 800, color: s.color}}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* API Keys */}
        <div style={{background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
          <div style={{padding: '20px 24px', borderBottom: '1px solid #f1f5f9'}}>
            <h2 style={{fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a'}}>Your API Keys</h2>
          </div>
          {activeKeys.length === 0 ? (
            <div style={{padding: '60px 24px', textAlign: 'center', color: '#94a3b8'}}>
              <div style={{fontSize: 40, marginBottom: 12}}>🔑</div>
              <div style={{fontSize: 15, fontWeight: 600, marginBottom: 4}}>No API keys yet</div>
              <div style={{fontSize: 14}}>Click "Generate New Key" to create one.</div>
            </div>
          ) : (
            <div style={{padding: 8}}>
              {activeKeys.map(key => (
                <div key={key.id} style={{padding: 16, margin: 4, background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8}}>
                    <div>
                      <div style={{fontSize: 14, fontWeight: 700, color: '#0f172a'}}>{key.name}</div>
                      <div style={{fontFamily: 'monospace', fontSize: 13, color: '#94a3b8', marginTop: 2}}>{key.key_prefix}...</div>
                    </div>
                    <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                      <span style={{padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, background: key.environment === 'live' ? '#dbeafe' : '#fef3c7', color: key.environment === 'live' ? '#1d4ed8' : '#92400e'}}>{key.environment}</span>
                      <button onClick={() => handleRevoke(key.id)} style={{padding: '4px 10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600}}>Revoke</button>
                    </div>
                  </div>
                  <div style={{fontSize: 12, color: '#94a3b8', display: 'flex', gap: 20}}>
                    <span>Used: {key.requests_used.toLocaleString()} / {key.requests_limit.toLocaleString()}</span>
                    <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                    {key.last_used_at && <span>Last used: {new Date(key.last_used_at).toLocaleDateString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Start */}
        <div style={{background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
          <div style={{padding: '20px 24px', borderBottom: '1px solid #f1f5f9'}}>
            <h2 style={{fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a'}}>Quick Start</h2>
          </div>
          <div style={{padding: 24}}>
            <p style={{fontSize: 14, color: '#64748b', margin: '0 0 12px'}}>Use your API key in the Authorization header:</p>
            <pre style={{background: '#0f172a', color: '#e2e8f0', padding: '16px 20px', borderRadius: 10, fontSize: 13, overflow: 'auto', lineHeight: 1.7, margin: 0}}>
{`curl -H "Authorization: Bearer ${apiKeys[0]?.key_prefix || 'vr_live_...'}" \\
  "https://vatrate.eu/api/v1/rate?country=DE&type=saas&customer=business"`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
