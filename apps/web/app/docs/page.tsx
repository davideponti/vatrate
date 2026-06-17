import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'API Reference',
  description: 'VATRate API documentation. Get EU VAT rates for any country, product type, and customer type.',
};

const sections = [
  { id: 'rate', title: 'GET /api/v1/rate', desc: 'Get the VAT rate for a specific transaction.', params: [
    { name: 'country', req: true, desc: '2-letter country code (e.g., DE, FR, IT)' },
    { name: 'type', req: false, desc: 'Product type: saas, ebooks, online_courses, digital_services' },
    { name: 'customer', req: false, desc: 'consumer (default) or business' },
    { name: 'vat_number', req: false, desc: 'VAT number for B2B validation' },
  ], example: '/api/v1/rate?country=DE&type=saas&customer=consumer',
  response: `{
  "country": "DE",
  "country_name": "Germany",
  "product_type": "saas",
  "customer_type": "consumer",
  "rate": 19,
  "mechanism": "standard",
  "currency": "EUR",
  "note": "Umsatzsteuer 19%",
  "oss_applicable": true,
  "oss_threshold": {
    "amount": 10000,
    "currency": "EUR",
    "exceeded": false
  },
  "valid_from": "2024-01-01",
  "last_updated": "2026-04-06"
}` },
  { id: 'rates', title: 'GET /api/v1/rates', desc: 'Get all VAT rates for a country.', params: [
    { name: 'country', req: true, desc: '2-letter country code (e.g., IT)' },
  ], example: '/api/v1/rates?country=IT',
  response: `{
  "country": "IT",
  "country_name": "Italy",
  "vat": {
    "standard": 22,
    "reduced": 10,
    "super_reduced": 4,
    "parking": null,
    "zero": 0
  },
  "rates_by_type": {
    "saas_b2b": 0,
    "saas_b2c": 22,
    "ebooks_b2b": 0,
    "ebooks_b2c": 4,
    "online_courses_b2b": 0,
    "online_courses_b2c": 22
  },
  "oss_enabled": true
}` },
  { id: 'products', title: 'POST /api/v1/products', desc: 'Classify a product description to determine applicable VAT.', params: [
    { name: 'country', req: true, desc: '2-letter country code' },
    { name: 'description', req: true, desc: 'Product description (e.g., "cloud accounting software")' },
  ], example: 'POST /api/v1/products\nBody: { "country": "IT", "description": "abbonamento mensile software contabilità cloud" }',
  response: `{
  "product_type": "saas",
  "classification": "digital_service",
  "confidence": 0.95,
  "b2b": { "rate": 0, "mechanism": "reverse_charge" },
  "b2c": { "rate": 22, "mechanism": "standard" },
  "note": "Cloud accounting software classified as SaaS"
}` },
  { id: 'oss', title: 'GET /api/v1/oss-threshold', desc: 'Check if your total EU B2C digital sales exceed the €10k OSS threshold.', params: [
    { name: 'home_country', req: true, desc: 'Your home country (2-letter code)' },
    { name: 'sales_XX', req: false, desc: 'Sales per country (e.g., sales_fr=8000&sales_de=5000)' },
  ], example: '/api/v1/oss-threshold?home_country=IT&sales_fr=8000&sales_de=5000',
  response: `{
  "home_country": "IT",
  "total_b2c_digital_sales": 13000,
  "threshold": 10000,
  "threshold_exceeded": true,
  "countries_exceeding": ["FR", "DE"],
  "oss_required": true,
  "note": "Total €13,000 exceeds €10,000 threshold.",
  "action": "Register for OSS in Italy..."
}` },
  { id: 'alerts', title: 'GET /api/v1/alerts', desc: 'Get upcoming VAT rate changes across EU countries.', params: [], example: '/api/v1/alerts',
  response: `{
  "alerts": [
    {
      "country": "EE",
      "country_name": "Estonia",
      "change": {
        "from": 20,
        "to": 22,
        "effective_date": "2027-01-01",
        "type": "standard_rate"
      }
    }
  ],
  "last_checked": "2026-04-06"
}` },
];

const styles = {
  header: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', padding: '20px 32px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(229,231,235,0.5)', position: 'sticky' as const, top: 0, zIndex: 50 },
  headerInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo: { fontSize: 22, fontWeight: 800, color: '#2563eb', textDecoration: 'none', letterSpacing: '-0.5px' },
  nav: { display: 'flex', gap: 8, alignItems: 'center' },
  navLink: { padding: '8px 16px', color: '#4b5563', textDecoration: 'none', fontSize: 14, fontWeight: 500, borderRadius: 8 },
  navLinkActive: { padding: '8px 16px', color: '#2563eb', textDecoration: 'none', fontSize: 14, fontWeight: 600, borderRadius: 8 },
  btnPrimary: { padding: '10px 20px', background: '#2563eb', color: 'white', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, boxShadow: '0 1px 3px rgba(37,99,235,0.3)' },
  sidebar: { width: 240, flexShrink: 0, padding: '40px 24px', borderRight: '1px solid #f1f5f9', position: 'sticky' as const, top: 80, height: 'calc(100vh - 80px)', overflowY: 'auto' as const },
  sidebarSection: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const, color: '#94a3b8', margin: '0 0 16px', letterSpacing: 1 },
  sidebarLink: { display: 'block', padding: '8px 0', color: '#64748b', textDecoration: 'none', fontSize: 13, fontFamily: 'monospace', transition: 'color 0.15s ease' },
  main: { flex: 1, padding: '40px 48px', maxWidth: 800 },
  footer: { borderTop: '1px solid #f1f5f9', padding: '32px 24px', textAlign: 'center' as const, color: '#94a3b8', fontSize: 14, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
};

export default function DocsPage() {
  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#fafafa'}}>
      {/* Nav */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <Link href="/" style={styles.logo}>VAT<span style={{color: '#1e293b'}}>Rate</span></Link>
          <nav style={styles.nav}>
            <Link href="/docs" style={styles.navLinkActive}>Docs</Link>
            <Link href="/pricing" style={styles.navLink}>Pricing</Link>
            <Link href="/login" style={styles.navLink}>Sign In</Link>
            <Link href="/signup" style={styles.btnPrimary}>Sign Up Free</Link>
            <a href="https://github.com/davideponti/vatrate" target="_blank" rel="noopener noreferrer" style={{padding: '8px 16px', background: '#f3f4f6', color: '#1e293b', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <div style={{display: 'flex', maxWidth: 1200, margin: '0 auto', width: '100%', minHeight: 'calc(100vh - 140px)'}}>
        {/* Sidebar */}
        <nav style={styles.sidebar}>
          <div style={styles.sidebarSection}>Endpoints</div>
          {sections.map(s => (
            <a key={s.id} href={`#${s.id}`} style={styles.sidebarLink}>{s.title}</a>
          ))}
          <div style={{...styles.sidebarSection, marginTop: 32}}>Resources</div>
          <a href="https://github.com/davideponti/vatrate" target="_blank" style={styles.sidebarLink}>GitHub Repo</a>
          <a href="https://github.com/davideponti/vatrate/issues" target="_blank" style={styles.sidebarLink}>Report Issue</a>
        </nav>

        {/* Content */}
        <main style={styles.main}>
          <h1 style={{fontSize: 36, fontWeight: 800, margin: '0 0 8px', color: '#0f172a', letterSpacing: '-0.5px'}}>API Reference</h1>
          <p style={{color: '#64748b', fontSize: 16, margin: '0 0 8px', lineHeight: 1.7}}>
            Get accurate EU VAT rates for any country, product type, and customer type.
          </p>
          <p style={{color: '#94a3b8', fontSize: 14, margin: '0 0 48px'}}>
            Base URL: <code style={{background: '#f1f5f9', padding: '2px 8px', borderRadius: 4, color: '#2563eb'}}>https://vatrate.eu</code>
          </p>

          {sections.map(section => (
            <div key={section.id} id={section.id} style={{marginBottom: 48, background: 'white', borderRadius: 16, padding: 32, border: '1px solid #f1f5f9', boxShadow: '0 1px 3px rgba(0,0,0,0.04)'}}>
              <h2 style={{fontSize: 20, fontWeight: 700, fontFamily: 'monospace', margin: '0 0 8px', color: '#2563eb'}}>{section.title}</h2>
              <p style={{color: '#64748b', margin: '0 0 20px', lineHeight: 1.6, fontSize: 15}}>{section.desc}</p>

              {section.params.length > 0 && (
                <>
                  <h3 style={{fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5}}>Parameters</h3>
                  <div style={{background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', overflow: 'hidden', marginBottom: 20}}>
                    <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 14}}>
                      <thead>
                        <tr style={{background: '#f1f5f9'}}>
                          <th style={{padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 13, color: '#475569'}}>Parameter</th>
                          <th style={{padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 13, color: '#475569'}}>Required</th>
                          <th style={{padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', fontWeight: 600, fontSize: 13, color: '#475569'}}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.params.map(p => (
                          <tr key={p.name} style={{borderBottom: '1px solid #f1f5f9'}}>
                            <td style={{padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#0f172a'}}>{p.name}</td>
                            <td style={{padding: '10px 16px'}}>
                              <span style={{
                                padding: '2px 8px', borderRadius: 4, fontSize: 12,
                                background: p.req ? '#fef2f2' : '#f1f5f9',
                                color: p.req ? '#dc2626' : '#64748b',
                                fontWeight: 600,
                              }}>
                                {p.req ? 'Required' : 'Optional'}
                              </span>
                            </td>
                            <td style={{padding: '10px 16px', color: '#64748b'}}>{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <h3 style={{fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5}}>Example Request</h3>
              <div style={{background: '#0f172a', color: '#e2e8f0', borderRadius: 10, padding: 16, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, overflow: 'auto', marginBottom: 20, border: '1px solid #1e293b'}}>
                {section.example}
              </div>

              <h3 style={{fontSize: 13, fontWeight: 700, margin: '0 0 8px', color: '#0f172a', textTransform: 'uppercase', letterSpacing: 0.5}}>Response</h3>
              <div style={{background: '#0a0f1e', color: '#e2e8f0', borderRadius: 10, padding: 16, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, overflow: 'auto', border: '1px solid #1e293b'}}>
                {section.response}
              </div>
            </div>
          ))}

          {/* Getting Started */}
          <div style={{marginTop: 48, padding: 32, background: 'linear-gradient(135deg, #eff6ff, #f0f0ff)', borderRadius: 16, border: '1px solid #dbeafe'}}>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 16px', color: '#0f172a'}}>Getting Started</h2>
            <ol style={{lineHeight: 2.2, fontSize: 15, margin: 0, paddingLeft: 20, color: '#374151'}}>
              <li><strong style={{color: '#0f172a'}}>No API key required</strong> for the free tier (100 req/day per IP)</li>
              <li>Make a GET request to <code style={{background: '#dbeafe', padding: '2px 6px', borderRadius: 4, fontSize: 13}}>/api/v1/rate?country=DE&type=saas</code></li>
              <li>Parse the JSON response and apply the VAT rate in your checkout</li>
              <li>For higher limits, <Link href="/pricing" style={{color: '#2563eb', fontWeight: 600}}>subscribe to a paid plan</Link></li>
            </ol>
          </div>
        </main>
      </div>

      <footer style={{...styles.footer, padding: '24px 32px 32px'}}>
        <div style={{display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 12}}>
          <Link href="/terms" style={{color: '#64748b', textDecoration: 'none', fontSize: 14}}>Terms &amp; Conditions</Link>
          <Link href="/privacy" style={{color: '#64748b', textDecoration: 'none', fontSize: 14}}>Privacy Policy</Link>
        </div>
        © 2026 VATRate. Open source EU VAT data for developers.
      </footer>
    </div>
  );
}
