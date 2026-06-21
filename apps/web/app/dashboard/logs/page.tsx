'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ApiLog {
  id: string; method: string; path: string; status_code: number;
  ip_address: string | null; user_agent: string | null;
  response_time_ms: number | null; api_key_id: string | null; created_at: string;
}
interface ApiKey { id: string; name: string; key_prefix: string; }

const nh = { header: { padding: '0 32px', background: 'white', borderBottom: '1px solid #f1f5f9' },
  inner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 },
  logo: { fontSize: 20, fontWeight: 800, color: '#2563eb', textDecoration: 'none', letterSpacing: '-0.5px' },
  nav: { display: 'flex', gap: 4, alignItems: 'center', height: '100%' },
  link: (a: boolean) => ({ padding: '0 16px', height: '100%', display: 'flex', alignItems: 'center', color: a ? '#2563eb' : '#64748b', textDecoration: 'none', fontSize: 14, fontWeight: a ? 600 : 500, borderBottom: a ? '2px solid #2563eb' : '2px solid transparent', transition: 'all 0.15s ease' }),
  bg: { padding: '8px 16px', background: '#f1f5f9', color: '#0f172a', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, textDecoration: 'none' },
  bd: { padding: '8px 16px', background: '#fef2f2', color: '#dc2626', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600 },
};

const mc = (m: string) => ({ GET: '#2563eb', POST: '#059669', PUT: '#d97706', DELETE: '#dc2626', PATCH: '#7c3aed' })[m.toUpperCase()] || '#6b7280';
const sc = (c: number) => c >= 200 && c < 300 ? '#059669' : c >= 400 ? '#dc2626' : '#d97706';
const ft = (ms: number | null) => ms === null ? '—' : ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selKey, setSelKey] = useState('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const P = 50;

  useEffect(() => {
    const t = localStorage.getItem('vatrate_token');
    if (!t) { router.push('/login'); return; }
    fetchKeys(t);
    fetchLogs(t);
  }, [router]);

  const fetchKeys = async (t: string) => {
    try {
      const r = await fetch('/api/v1/keys', { headers: { Authorization: `Bearer ${t}` } });
      if (r.ok) setKeys((await r.json()).keys || []);
    } catch {
      // Silently fail - keys filter will just be empty
    }
  };

  const fetchLogs = async (t: string, o = 0) => {
    setLoading(true);
    setError('');
    try {
      let u = `/api/v1/logs?limit=${P}&offset=${o}`;
      if (selKey) u += `&key_id=${selKey}`;
      const r = await fetch(u, { headers: { Authorization: `Bearer ${t}` } });
      if (r.status === 401) { localStorage.clear(); router.push('/login'); return; }
      if (r.ok) { const d = await r.json(); setLogs(d.logs || []); setTotal(d.total || 0); setOffset(o); }
      else { const d = await r.json(); setError(d.message || 'Failed to fetch logs'); }
    } catch {
      setError('Failed to fetch logs.');
    }
    setLoading(false);
  };

  const doFilter = (id: string) => {
    setSelKey(id);
    const t = localStorage.getItem('vatrate_token');
    if (!t) return;
    setOffset(0);
    setLoading(true);
    let u = `/api/v1/logs?limit=${P}&offset=0`;
    if (id) u += `&key_id=${id}`;
    fetch(u, { headers: { Authorization: `Bearer ${t}` } })
      .then(r => r.json())
      .then(d => { setLogs(d.logs || []); setTotal(d.total || 0); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const logout = () => { localStorage.clear(); router.push('/'); };
  const kn = (id: string | null) => { if (!id) return '—'; const k = keys.find(x => x.id === id); return k ? k.name : '?'; };

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
      <header style={nh.header}>
        <div style={nh.inner}>
          <Link href="/" style={nh.logo}>VATRate</Link>
          <nav style={nh.nav}>
            <Link href="/dashboard" style={nh.link(false)}>Dashboard</Link>
            <Link href="/dashboard/logs" style={nh.link(true)}>Logs</Link>
            <Link href="/dashboard/settings" style={nh.link(false)}>Settings</Link>
            <Link href="/docs" style={nh.link(false)}>Docs</Link>
            <Link href="/pricing" style={nh.link(false)}>Pricing</Link>
            <a href="https://github.com/davideponti/vatrate" target="_blank" style={nh.bg}>GitHub</a>
            <button onClick={logout} style={nh.bd}>Logout</button>
          </nav>
        </div>
      </header>

      <div style={{maxWidth: 1000, margin: '0 auto', padding: '40px 24px', width: '100%'}}>
        <div style={{marginBottom: 24}}>
          <h1 style={{fontSize: 28, fontWeight: 800, margin: '0 0 4px', color: '#0f172a'}}>API Logs</h1>
          <p style={{color: '#64748b', margin: 0, fontSize: 15}}>Monitor all API requests made with your keys.</p>
        </div>

        {error && <div style={{background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 14, marginBottom: 16, border: '1px solid #fecaca'}}>{error}</div>}

        {/* Filter */}
        <div style={{display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20, padding: 16, background: 'white', borderRadius: 10, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
          <label style={{fontSize: 14, fontWeight: 600, color: '#374151'}}>Filter by key:</label>
          <select value={selKey} onChange={e => doFilter(e.target.value)} style={{padding: '8px 12px', borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', minWidth: 200, background: '#f8fafc'}}>
            <option value="">All API Keys</option>
            {keys.map(k => <option key={k.id} value={k.id}>{k.name} ({k.key_prefix}...)</option>)}
          </select>
          <span style={{fontSize: 13, color: '#94a3b8', marginLeft: 'auto'}}>{total} total requests</span>
        </div>

        {/* Table */}
        <div style={{background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
          {loading ? (
            <div style={{padding: 40, textAlign: 'center', color: '#64748b', fontSize: 15}}>Loading logs...</div>
          ) : logs.length === 0 ? (
            <div style={{padding: '60px 24px', textAlign: 'center', color: '#94a3b8'}}>
              <div style={{fontSize: 40, marginBottom: 12}}>📊</div>
              <div style={{fontSize: 15, fontWeight: 600, marginBottom: 4}}>No logs yet</div>
              <div style={{fontSize: 14}}>API requests will appear here once you start making calls with your keys.</div>
            </div>
          ) : (
            <div style={{overflowX: 'auto'}}>
              <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 14}}>
                <thead>
                  <tr style={{borderBottom: '1px solid #f1f5f9', background: '#f8fafc'}}>
                    {['Method','Path','Status','Time','Key','IP','Date'].map(h => (
                      <th key={h} style={{textAlign: h === 'Status' || h === 'Time' ? 'center' : 'left', padding: '12px 16px', fontWeight: 600, color: '#374151', fontSize: 13}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {logs.map(l => (
                    <tr key={l.id} style={{borderBottom: '1px solid #f1f5f9'}}>
                      <td style={{padding: '10px 16px'}}>
                        <span style={{display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700, color: 'white', background: mc(l.method)}}>{l.method}</span>
                      </td>
                      <td style={{padding: '10px 16px', fontFamily: 'monospace', fontSize: 13, color: '#374151', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{l.path}</td>
                      <td style={{padding: '10px 16px', textAlign: 'center'}}><span style={{fontWeight: 700, color: sc(l.status_code)}}>{l.status_code}</span></td>
                      <td style={{padding: '10px 16px', textAlign: 'center', color: '#64748b', fontSize: 13}}>{ft(l.response_time_ms)}</td>
                      <td style={{padding: '10px 16px', fontSize: 13, color: '#64748b'}}>{kn(l.api_key_id)}</td>
                      <td style={{padding: '10px 16px', fontSize: 13, color: '#64748b', fontFamily: 'monospace'}}>{l.ip_address || '—'}</td>
                      <td style={{padding: '10px 16px', fontSize: 13, color: '#64748b', whiteSpace: 'nowrap'}}>{new Date(l.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > P && (
            <div style={{padding: '12px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14, color: '#64748b'}}>
              <span>Showing {offset + 1}–{Math.min(offset + P, total)} of {total}</span>
              <div style={{display: 'flex', gap: 8}}>
                <button onClick={() => { const t = localStorage.getItem('vatrate_token'); if (t) fetchLogs(t, Math.max(0, offset - P)); }} disabled={offset === 0} style={{padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: offset === 0 ? '#f8fafc' : 'white', color: offset === 0 ? '#d1d5db' : '#374151', cursor: offset === 0 ? 'not-allowed' : 'pointer', fontSize: 13}}>← Previous</button>
                <button onClick={() => { const t = localStorage.getItem('vatrate_token'); if (t) fetchLogs(t, offset + P); }} disabled={offset + P >= total} style={{padding: '6px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: offset + P >= total ? '#f8fafc' : 'white', color: offset + P >= total ? '#d1d5db' : '#374151', cursor: offset + P >= total ? 'not-allowed' : 'pointer', fontSize: 13}}>Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
