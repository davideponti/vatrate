import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'API Reference',
  description: 'VATRate API documentation. Get EU VAT rates for any country, product type, and customer type.',
};

const sections = [
  {
    id: 'rate',
    title: 'GET /api/v1/rate',
    desc: 'Get the VAT rate for a specific transaction.',
    params: [
      { name: 'country', req: true, desc: '2-letter country code (e.g., DE, FR, IT)' },
      { name: 'type', req: false, desc: 'Product type: saas, ebooks, online_courses, digital_services' },
      { name: 'customer', req: false, desc: 'consumer (default) or business' },
      { name: 'vat_number', req: false, desc: 'VAT number for B2B validation' },
    ],
    example: '/api/v1/rate?country=DE&type=saas&customer=consumer',
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
}`,
  },
  {
    id: 'rates',
    title: 'GET /api/v1/rates',
    desc: 'Get all VAT rates for a country.',
    params: [
      { name: 'country', req: true, desc: '2-letter country code (e.g., IT)' },
    ],
    example: '/api/v1/rates?country=IT',
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
  "oss_enabled": true,
  "oss_threshold": { "amount": 10000, "currency": "EUR" }
}`,
  },
  {
    id: 'products',
    title: 'POST /api/v1/products',
    desc: 'Classify a product description to determine applicable VAT.',
    params: [
      { name: 'country', req: true, desc: '2-letter country code' },
      { name: 'description', req: true, desc: 'Product description (e.g., "cloud accounting software")' },
    ],
    example: `POST /api/v1/products
Body: { "country": "IT", "description": "abbonamento mensile software contabilità cloud" }`,
    response: `{
  "product_type": "saas",
  "classification": "digital_service",
  "confidence": 0.95,
  "b2b": { "rate": 0, "mechanism": "reverse_charge" },
  "b2c": { "rate": 22, "mechanism": "standard" },
  "note": "Cloud accounting software classified as SaaS (electronic service)"
}`,
  },
  {
    id: 'oss',
    title: 'GET /api/v1/oss-threshold',
    desc: 'Check if your total EU B2C digital sales exceed the €10k OSS threshold.',
    params: [
      { name: 'home_country', req: true, desc: 'Your home country (2-letter code)' },
      { name: 'sales_XX', req: false, desc: 'Sales per country (e.g., sales_fr=8000&sales_de=5000)' },
    ],
    example: '/api/v1/oss-threshold?home_country=IT&sales_fr=8000&sales_de=5000',
    response: `{
  "home_country": "IT",
  "total_b2c_digital_sales": 13000,
  "threshold": 10000,
  "threshold_exceeded": true,
  "countries_exceeding": ["FR", "DE"],
  "oss_required": true,
  "note": "Total €13,000 exceeds €10,000 threshold. OSS registration required.",
  "action": "Register for OSS in Italy..."
}`,
  },
  {
    id: 'alerts',
    title: 'GET /api/v1/alerts',
    desc: 'Get upcoming VAT rate changes across EU countries.',
    params: [],
    example: '/api/v1/alerts',
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
      },
      "impact": "SaaS B2C rate changes from 20% to 22%."
    }
  ],
  "last_checked": "2026-04-06"
}`,
  },
];

export default function DocsPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
            <Link href="/docs" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600, fontSize: 15 }}>Docs</Link>
            <Link href="/pricing" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>Pricing</Link>
            <Link href="/login" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>Sign In</Link>
            <Link href="/signup" style={{
              padding: '8px 20px',
              background: '#2563eb',
              color: 'white',
              borderRadius: 8,
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 600,
            }}>
              Sign Up
            </Link>
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

      <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        {/* Sidebar */}
        <nav style={{
          width: 240,
          flexShrink: 0,
          padding: '40px 24px',
          borderRight: '1px solid #e5e7eb',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', color: '#9ca3af', margin: '0 0 16px', letterSpacing: 1 }}>
            Endpoints
          </h3>
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} style={{
              display: 'block',
              padding: '8px 0',
              color: '#4b5563',
              textDecoration: 'none',
              fontSize: 14,
              fontFamily: 'monospace',
            }}>
              {s.title}
            </a>
          ))}
        </nav>

        {/* Content */}
        <main style={{ flex: 1, padding: '40px 48px', maxWidth: 800 }}>
          <h1 style={{ fontSize: 36, fontWeight: 800, margin: '0 0 8px' }}>
            API Reference
          </h1>
          <p style={{ color: '#6b7280', fontSize: 17, margin: '0 0 48px', lineHeight: 1.6 }}>
            Get accurate EU VAT rates for any country, product type, and customer type.
            Base URL: <code style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>https://vatrate.eu</code>
          </p>

          {sections.map((section) => (
            <div key={section.id} id={section.id} style={{ marginBottom: 48 }}>
              <h2 style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'monospace',
                margin: '0 0 8px',
                color: '#2563eb',
              }}>
                {section.title}
              </h2>
              <p style={{ color: '#6b7280', margin: '0 0 16px', lineHeight: 1.6 }}>{section.desc}</p>

              {section.params.length > 0 && (
                <>
                  <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Parameters</h3>
                  <div style={{
                    background: '#f9fafb',
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    overflow: 'hidden',
                    marginBottom: 16,
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: '#f3f4f6' }}>
                          <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Parameter</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Required</th>
                          <th style={{ padding: '10px 16px', textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.params.map((p) => (
                          <tr key={p.name} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600 }}>{p.name}</td>
                            <td style={{ padding: '10px 16px' }}>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: 4,
                                fontSize: 12,
                                background: p.req ? '#fef2f2' : '#f3f4f6',
                                color: p.req ? '#dc2626' : '#6b7280',
                              }}>
                                {p.req ? 'Required' : 'Optional'}
                              </span>
                            </td>
                            <td style={{ padding: '10px 16px', color: '#6b7280' }}>{p.desc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              <div style={{ marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Example Request</h3>
                <div style={{
                  background: '#1e293b',
                  color: '#e2e8f0',
                  borderRadius: 8,
                  padding: 16,
                  fontFamily: 'monospace',
                  fontSize: 13,
                  lineHeight: 1.7,
                  overflow: 'auto',
                }}>
                  {section.example}
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, margin: '0 0 8px' }}>Response</h3>
                <div style={{
                  background: '#0f172a',
                  color: '#e2e8f0',
                  borderRadius: 8,
                  padding: 16,
                  fontFamily: 'monospace',
                  fontSize: 13,
                  lineHeight: 1.7,
                  overflow: 'auto',
                }}>
                  {section.response}
                </div>
              </div>
            </div>
          ))}

          {/* Getting Started Section */}
          <div style={{ marginTop: 48, padding: 32, background: '#eff6ff', borderRadius: 16, border: '1px solid #bfdbfe' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>
              Getting Started
            </h2>
            <ol style={{ lineHeight: 2, fontSize: 15, margin: 0, paddingLeft: 20 }}>
              <li><strong>No API key required</strong> for the free tier (100 req/day per IP)</li>
              <li>Make a GET request to <code style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: 4, fontSize: 13 }}>/api/v1/rate?country=DE&type=saas</code></li>
              <li>Parse the JSON response and apply the VAT rate in your checkout</li>
              <li>For higher limits, <Link href="/pricing" style={{ color: '#2563eb' }}>subscribe to a paid plan</Link></li>
            </ol>
          </div>
        </main>
      </div>

      <footer style={{
        borderTop: '1px solid #e5e7eb',
        padding: '24px',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 14,
      }}>
        © 2026 VATRate. Open source EU VAT data for developers.
      </footer>
    </div>
  );
}
