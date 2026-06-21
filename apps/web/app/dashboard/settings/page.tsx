'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  email: string;
  plan: string;
  plan_label: string;
  plan_price: number;
  requests_limit: number;
  requests_used: number;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
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

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid #e2e8f0',
  fontSize: 15, outline: 'none', boxSizing: 'border-box' as const,
  transition: 'all 0.15s ease', background: '#f8fafc',
};

const planBadge: Record<string, { bg: string; color: string; label: string }> = {
  free: { bg: '#f1f5f9', color: '#64748b', label: 'Free' },
  basic: { bg: '#dbeafe', color: '#1d4ed8', label: 'API Basic' },
  pro: { bg: '#fef3c7', color: '#92400e', label: 'API Pro' },
  enterprise: { bg: '#ede9fe', color: '#5b21b6', label: 'Enterprise' },
};

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Portal state
  const [portalLoading, setPortalLoading] = useState(false);

  const getToken = () => localStorage.getItem('vatrate_token');

  useEffect(() => {
    const token = getToken();
    const email = localStorage.getItem('vatrate_user');
    if (!token || !email) { router.push('/login'); return; }
    setUser(email);
    fetchProfile(token);
  }, [router]);

  const fetchProfile = async (token: string) => {
    try {
      const res = await fetch('/api/v1/user/profile', { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { localStorage.clear(); router.push('/login'); return; }
      if (res.ok) { const d = await res.json(); setProfile(d.user); }
    } catch { setError('Failed to load profile.'); }
    setLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/v1/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(data.message || 'Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Log out after password change (sessions expired)
        setTimeout(() => {
          localStorage.clear();
          router.push('/login');
        }, 2000);
      } else {
        setError(data.message || 'Failed to update password.');
      }
    } catch {
      setError('Network error.');
    }
    setPasswordLoading(false);
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    setError('');
    try {
      const res = await fetch('/api/v1/stripe/portal', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else {
        setError(data.message || 'Failed to open subscription manager.');
      }
    } catch {
      setError('Network error.');
    }
    setPortalLoading(false);
  };

  const logOut = () => { localStorage.clear(); router.push('/'); };

  if (loading) return (
    <div style={{minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc'}}>
      <div style={{fontSize: 16, color: '#64748b'}}>Loading...</div>
    </div>
  );

  const plan = profile ? (planBadge[profile.plan] || planBadge.free) : planBadge.free;
  const isFreePlan = profile?.plan === 'free' || !profile;
  const hasPrice = profile && profile.plan_price > 0;
  const formattedDate = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
      {/* Nav */}
      <header style={navStyle.header}>
        <div style={navStyle.inner}>
          <Link href="/" style={navStyle.logo}>VATRate</Link>
          <nav style={navStyle.nav}>
            <Link href="/dashboard" style={navStyle.link(false)}>Dashboard</Link>
            <Link href="/dashboard/logs" style={navStyle.link(false)}>Logs</Link>
            <Link href="/dashboard/settings" style={navStyle.link(true)}>Settings</Link>
            <Link href="/docs" style={navStyle.link(false)}>Docs</Link>
            <Link href="/pricing" style={navStyle.link(false)}>Pricing</Link>
            <a href="https://github.com/davideponti/vatrate" target="_blank" style={navStyle.btnGhost}>GitHub</a>
            <button onClick={logOut} style={navStyle.btnDanger}>Logout</button>
          </nav>
        </div>
      </header>

      <div style={{maxWidth: 720, margin: '0 auto', padding: '40px 24px', width: '100%'}}>
        <h1 style={{fontSize: 28, fontWeight: 800, margin: '0 0 4px', color: '#0f172a'}}>Settings</h1>
        <p style={{color: '#64748b', margin: '0 0 32px', fontSize: 15}}>
          Manage your account, password, and subscription.
        </p>

        {error && (
          <div style={{background: '#fef2f2', color: '#dc2626', padding: '12px 16px', borderRadius: 10, fontSize: 14, marginBottom: 16, border: '1px solid #fecaca'}}>
            {error}
          </div>
        )}
        {success && (
          <div style={{background: '#f0fdf4', color: '#15803d', padding: '12px 16px', borderRadius: 10, fontSize: 14, marginBottom: 16, border: '1px solid #bbf7d0'}}>
            {success}
          </div>
        )}

        {/* Subscription Section */}
        <div style={{background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
          <div style={{padding: '20px 24px', borderBottom: '1px solid #f1f5f9'}}>
            <h2 style={{fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a'}}>Subscription & Plan</h2>
          </div>
          <div style={{padding: 24}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12}}>
              <div>
                <div style={{fontSize: 13, color: '#94a3b8', marginBottom: 4, fontWeight: 500}}>Current Plan</div>
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <span style={{padding: '4px 12px', borderRadius: 6, fontSize: 14, fontWeight: 700, background: plan.bg, color: plan.color}}>
                    {plan.label}
                  </span>
                  {hasPrice && profile && (
                    <span style={{fontSize: 14, color: '#64748b'}}>€{profile.plan_price}/month</span>
                  )}
                </div>
              </div>
              <div style={{textAlign: 'right' as const}}>
                <div style={{fontSize: 13, color: '#94a3b8', marginBottom: 4, fontWeight: 500}}>API Requests</div>
                <div style={{fontSize: 18, fontWeight: 700, color: '#0f172a'}}>
                  {profile?.requests_used.toLocaleString() || 0} / {profile?.requests_limit.toLocaleString() || 100}
                </div>
              </div>
            </div>

            <div style={{display: 'flex', gap: 12, flexWrap: 'wrap'}}>
              {isFreePlan ? (
                <Link href="/pricing" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                  background: 'linear-gradient(135deg, #2563eb, #3b82f6)', color: 'white',
                  borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600,
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                }}>
                  ⬆ Upgrade your plan
                </Link>
              ) : (
                <>
                  <button onClick={handleManageSubscription} disabled={portalLoading} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px',
                    background: '#2563eb', color: 'white', borderRadius: 10, border: 'none',
                    cursor: portalLoading ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600,
                    boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                  }}>
                    {portalLoading ? 'Opening...' : '⚙ Manage Subscription'}
                  </button>
                </>
              )}
            </div>

            {profile && (
              <div style={{marginTop: 20, paddingTop: 20, borderTop: '1px solid #f1f5f9', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}}>
                <div>
                  <div style={{fontSize: 13, color: '#94a3b8', marginBottom: 4, fontWeight: 500}}>Account created</div>
                  <div style={{fontSize: 14, fontWeight: 600, color: '#0f172a'}}>{formattedDate}</div>
                </div>
                <div>
                  <div style={{fontSize: 13, color: '#94a3b8', marginBottom: 4, fontWeight: 500}}>Email</div>
                  <div style={{fontSize: 14, fontWeight: 600, color: '#0f172a'}}>{profile.email}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Password Section */}
        <div style={{background: 'white', borderRadius: 12, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
          <div style={{padding: '20px 24px', borderBottom: '1px solid #f1f5f9'}}>
            <h2 style={{fontSize: 16, fontWeight: 700, margin: 0, color: '#0f172a'}}>Change Password</h2>
          </div>
          <div style={{padding: 24}}>
            <form onSubmit={handlePasswordChange} style={{display: 'flex', flexDirection: 'column', gap: 16}}>
              <div>
                <label style={{fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151'}}>Current Password</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password" required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div>
                <label style={{fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151'}}>New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters" required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <div>
                <label style={{fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 6, color: '#374151'}}>Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password" required
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#2563eb'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </div>
              <button type="submit" disabled={passwordLoading} style={{
                padding: '12px 24px', background: passwordLoading ? '#93c5fd' : 'linear-gradient(135deg, #2563eb, #3b82f6)',
                color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
                cursor: passwordLoading ? 'not-allowed' : 'pointer',
                boxShadow: passwordLoading ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
                alignSelf: 'flex-start',
              }}>
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
