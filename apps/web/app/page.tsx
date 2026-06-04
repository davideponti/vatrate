import Link from 'next/link';

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
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
            <Link href="/" style={{ color: '#2563eb', textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>Home</Link>
            <Link href="/docs" style={{ color: '#4b5563', textDecoration: 'none', fontSize: 15 }}>Docs</Link>
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

      {/* Hero */}
      <section style={{
        padding: '100px 24px 80px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #eff6ff 0%, #fafafa 100%)',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h1 style={{
            fontSize: 52,
            fontWeight: 800,
            lineHeight: 1.15,
            margin: '0 0 20px',
            color: '#1a1a2e',
          }}>
            Know your VAT.<br />
            <span style={{ color: '#2563eb' }}>Ship globally.</span>
          </h1>
          <p style={{
            fontSize: 20,
            color: '#6b7280',
            lineHeight: 1.6,
            margin: '0 0 40px',
            maxWidth: 600,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}>
            Open-source EU VAT rates API. One endpoint for all 27 EU countries.
            SaaS, e-books, online courses, digital services. B2B and B2C.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/docs"
              style={{
                padding: '14px 32px',
                background: '#2563eb',
                color: 'white',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 600,
              }}>
              Get Started Free
            </a>
            <code style={{
              padding: '14px 24px',
              background: '#1e293b',
              color: '#e2e8f0',
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'monospace',
              display: 'inline-flex',
              alignItems: 'center',
            }}>
              GET /api/v1/rate?country=DE&type=saas&customer=consumer
            </code>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 32,
        }}>
          {[
            {
              emoji: '🇪🇺',
              title: 'All 27 EU Countries',
              desc: 'Complete VAT data for every EU member state, including reduced and super-reduced rates.',
            },
            {
              emoji: '🔄',
              title: 'Reverse Charge B2B',
              desc: 'Automatic 0% VAT for B2B transactions with valid VAT number. Fully compliant.',
            },
            {
              emoji: '📊',
              title: 'OSS Threshold Checker',
              desc: 'Know when you exceed the €10k threshold and need OSS registration.',
            },
            {
              emoji: '🔮',
              title: 'Product Classification',
              desc: 'AI-powered classification: SaaS, e-books, online courses, and more.',
            },
            {
              emoji: '📦',
              title: 'Open Source Data',
              desc: 'All VAT data is open source on GitHub. Verified, transparent, community-driven.',
            },
            {
              emoji: '⚡',
              title: 'Edge-Ready API',
              desc: 'Built on Next.js + Vercel Edge. Sub-100ms response times globally.',
            },
          ].map((feature, i) => (
            <div key={i} style={{
              padding: 32,
              background: 'white',
              borderRadius: 16,
              border: '1px solid #e5e7eb',
            }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>{feature.emoji}</div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>{feature.title}</h3>
              <p style={{ color: '#6b7280', lineHeight: 1.6, margin: 0, fontSize: 15 }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Example API Response */}
      <section style={{
        padding: '80px 24px',
        background: '#1e293b',
        color: 'white',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 12px', textAlign: 'center' }}>
            One API Call. Any Country.
          </h2>
          <p style={{ color: '#94a3b8', textAlign: 'center', margin: '0 0 40px', fontSize: 17 }}>
            Get VAT rates for any product type, customer type, and country.
          </p>
          <div style={{
            background: '#0f172a',
            borderRadius: 12,
            padding: 24,
            border: '1px solid #334155',
          }}>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12, fontFamily: 'monospace' }}>
              {`// GET /api/v1/rate?country=IT&type=saas&customer=consumer`}
            </div>
            <pre style={{
              margin: 0,
              fontFamily: 'monospace',
              fontSize: 14,
              lineHeight: 1.7,
              color: '#e2e8f0',
            }}>
{`{
  "country": "IT",
  "country_name": "Italy",
  "product_type": "saas",
  "customer_type": "consumer",
  "rate": 22,
  "mechanism": "standard",
  "currency": "EUR",
  "note": "IVA al 22% (aliquota normale)",
  "oss_applicable": true,
  "oss_threshold": {
    "amount": 10000,
    "currency": "EUR",
    "exceeded": false,
    "note": "If total EU B2C digital sales < €10k/year..."
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '80px 24px', maxWidth: 1000, margin: '0 auto' }}>
        <h2 style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', margin: '0 0 48px' }}>
          How It Works
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {[
            { step: '1', title: 'Make a request', desc: 'Call the API with country, product type, and customer type.' },
            { step: '2', title: 'Get accurate rates', desc: 'Receive the correct VAT rate, mechanism, and OSS info.' },
            { step: '3', title: 'Apply in your checkout', desc: 'Use the response to charge the correct VAT in any EU country.' },
            { step: '4', title: 'Scale across EU', desc: 'From €0/mo (free tier) to €149/mo (enterprise). No hidden costs.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: '#2563eb',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 18,
                flexShrink: 0,
              }}>
                {item.step}
              </div>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>{item.title}</h3>
                <p style={{ color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{
        padding: '80px 24px',
        textAlign: 'center',
        background: 'linear-gradient(180deg, #fafafa 0%, #eff6ff 100%)',
      }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 16px' }}>
            Start shipping with confidence
          </h2>
          <p style={{ color: '#6b7280', fontSize: 17, margin: '0 0 32px', lineHeight: 1.6 }}>
            Open source data. Free API tier. No credit card required.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/docs"
              style={{
                padding: '14px 32px',
                background: '#2563eb',
                color: 'white',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 600,
              }}>
              Read the Docs
            </a>
            <a href="/pricing"
              style={{
                padding: '14px 32px',
                background: 'white',
                color: '#2563eb',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 16,
                fontWeight: 600,
                border: '2px solid #2563eb',
              }}>
              See Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #e5e7eb',
        padding: '40px 24px',
        background: 'white',
        marginTop: 'auto',
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ color: '#6b7280', fontSize: 14 }}>
            © 2026 VATRate. Open source EU VAT data. Made with ❤️ for developers.
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <a href="/docs" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>Docs</a>
            <a href="https://github.com/davideponti/vatrate" target="_blank" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>GitHub</a>

            <Link href="/pricing" style={{ color: '#6b7280', textDecoration: 'none', fontSize: 14 }}>Pricing</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
