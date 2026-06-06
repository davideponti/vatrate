'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ApiLog {
  id: string;
  method: string;
  path: string;
  status_code: number;
  ip_address: string | null;
  user_agent: string | null;
  response_time_ms: number | null;
  api_key_id: string | null;
  created_at: string;
}

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
}

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedKey, setSelectedKey] = useState<string>('');
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const pageSize = 50;

  useEffect(() => {
    const token = localStorage.getItem('vatrate_token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchKeys(token);
    fetchLogs(token);
  }, [router]);

  const fetchKeys = async (token: string) => {
    try {
      const res = await fetch('/api/v1/keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setApiKeys(data.keys || []);
      }
    } catch (err) {
      console.error('Failed to fetch keys:', err);
    }
  };

  const fetchLogs = async (token: string, newOffset = 0) => {
    setLoading(true);
    setError('');

    try {
      let url = `/api/v1/logs?limit=${pageSize}&offset=${newOffset}`;
      if (selectedKey) {
        url += `&key_id=${selectedKey}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.removeItem('vatrate_user');
        localStorage.removeItem('vatrate_token');
        router.push('/login');
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setOffset(newOffset);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Failed to fetch logs');
      }
    } catch (err) {
      setError('Failed to fetch logs.');
    }
    setLoading(false);
  };

  const handleFilterChange = (keyId: string) => {
    setSelectedKey(keyId);
    const token = localStorage.getItem('vatrate_token');
    if (token) {
      setOffset(0);
      setLoading(true);
      let url = `/api/v1/logs?limit=${pageSize}&offset=0`;
      if (keyId) url += `&key_id=${keyId}`;
      fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(r => r.json()).then(data => {
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  };

  const handleNextPage = () => {
    const token = localStorage.getItem('vatrate_token');
    if (token) fetchLogs(token, offset + pageSize);
  };

  const handlePrevPage = () => {
    const token = localStorage.getItem('vatrate_token');
    if (token) fetchLogs(token, Math.max(0, offset - pageSize));
  };

  const handleLogout = () => {
    localStorage.removeItem('vatrate_user');
    localStorage.removeItem('vatrate_token');
    router.push('/');
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return '#2563eb';
      case 'POST': return '#059669';
      case 'PUT': return '#d97706';
      case 'DELETE': return '#dc2626';
      case 'PATCH': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return '#059669';
    if (code >= 300 && code < 400) return '#d97706';
    if (code >= 400) return '#dc2626';
    return '#6b7280';
  };

  const getKeyName = (keyId: string | null) => {
    if (!keyId) return '—';
    const key = apiKeys.find(k => k.id === keyId);
    return key ? key.name : 'Unknown Key';
  };

  const formatTime = (ms: number | null) => {
    if (ms === null) return '—';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

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
            <Link href="/dashboard" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>Dashboard</Link>
            <Link href="/dashboard/logs" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>Logs</Link>
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
          </nav>
        </div>
      </header>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 4px' }}>API Logs</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>
              Monitor all API requests made with your keys.
            </p>
          </div>
        </div>

        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 8, fontSize: 14, marginBottom: 16 }}>
            {error}
          </div>
        )}

        {/* Filters */}
        <div style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          marginBottom: 20,
          padding: 16,
          background: 'white',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
        }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: '#4b5563' }}>Filter by key:</label>
          <select
            value={selectedKey}
            onChange={(e) => handleFilterChange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid #e5e7eb',
              fontSize: 14,
              outline: 'none',
              minWidth: 200,
            }}
          >
            <option value="">All API Keys</option>
            {apiKeys.map((key) => (
              <option key={key.id} value={key.id}>
                {key.name} ({key.key_prefix}...)
              </option>
            ))}
          </select>
          <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 'auto' }}>
            {total} total requests
          </span>
        </div>

        {/* Logs Table */}
        <div style={{
          background: 'white',
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
        }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#9ca3af' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No logs yet</div>
              <div style={{ fontSize: 14 }}>
                API requests will appear here once you start making calls with your keys.
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Method</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Path</th>
                    <th style={{ textAlign: 'center', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Status</th>
                    <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Time</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Key</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>IP</th>
                    <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: 600, color: '#374151' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '10px 16px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '2px 8px',
                          borderRadius: 4,
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'white',
                          background: getMethodColor(log.method),
                        }}>
                          {log.method}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontSize: 13, color: '#374151', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.path}
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                        <span style={{
                          fontWeight: 700,
                          color: getStatusColor(log.status_code),
                        }}>
                          {log.status_code}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right', color: '#6b7280', fontSize: 13 }}>
                        {formatTime(log.response_time_ms)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280' }}>
                        {getKeyName(log.api_key_id)}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280', fontFamily: 'monospace' }}>
                        {log.ip_address || '—'}
                      </td>
                      <td style={{ padding: '10px 16px', fontSize: 13, color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > pageSize && (
            <div style={{
              padding: '12px 16px',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 14,
              color: '#6b7280',
            }}>
              <span>
                Showing {offset + 1}–{Math.min(offset + pageSize, total)} of {total}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handlePrevPage}
                  disabled={offset === 0}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: offset === 0 ? '#f9fafb' : 'white',
                    color: offset === 0 ? '#d1d5db' : '#374151',
                    cursor: offset === 0 ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  ← Previous
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={offset + pageSize >= total}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 6,
                    border: '1px solid #e5e7eb',
                    background: offset + pageSize >= total ? '#f9fafb' : 'white',
                    color: offset + pageSize >= total ? '#d1d5db' : '#374151',
                    cursor: offset + pageSize >= total ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
