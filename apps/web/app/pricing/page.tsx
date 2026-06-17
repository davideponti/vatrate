import Link from 'next/link';

const plans = [
  {
    id: 'free', name: 'Free', price: '€0', period: 'forever',
    desc: 'For developers exploring EU VAT.',
    features: ['JSON access via GitHub', '100 API requests/month', 'Community support', 'Open source data'],
    cta: 'Get Started', href: '/signup', highlighted: false,
  },
  {
    id: 'basic', name: 'API Basic', price: '€19', period: '/month',
    desc: 'For startups and small projects.',
    features: ['3,000 API requests/month', 'Auto-updated rates', 'Email support', 'OSS threshold checker'],
    cta: 'Subscribe', href: 'https://buy.stripe.com/4gM4gs8qIbra8ZmcxI7bW01', highlighted: true,
  },
  {
    id: 'pro', name: 'API Pro', price: '€49', period: '/month',
    desc: 'For growing businesses.',
    features: ['10,000 API requests/month', 'Product classification', 'Rate alerts', 'Priority support'],
    cta: 'Subscribe', href: 'https://buy.stripe.com/9B66oAbCU8eYfnKcxI7bW02', highlighted: false,
  },
  {
    id: 'enterprise', name: 'Enterprise', price: '€149', period: '/month',
    desc: 'For scale and compliance teams.',
    features: ['100,000 API requests/month', 'Country-specific alerts', 'Webhook integration', 'SLA 99.9%', 'Dedicated support'],
    cta: 'Subscribe', href: 'https://buy.stripe.com/9B63co5ewbra0sQeFQ7bW03', highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}}>
      <header style={{padding: '20px 32px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(229,231,235,0.5)', position: 'sticky', top: 0, zIndex: 50}}>
        <div style={{maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <Link href="/" style={{fontSize: 22, fontWeight: 800, color: '#2563eb', textDecoration: 'none', letterSpacing: '-0.5px'}}>VAT<span style={{color: '#1e293b'}}>Rate</span></Link>
          <nav style={{display: 'flex', gap: 8, alignItems: 'center'}}>
            <Link href="/docs" style={{padding: '8px 16px', color: '#4b5563', textDecoration: 'none', fontSize: 14, fontWeight: 500, borderRadius: 8}}>Docs</Link>
            <Link href="/pricing" style={{padding: '8px 16px', color: '#2563eb', textDecoration: 'none', fontSize: 14, fontWeight: 600, borderRadius: 8}}>Pricing</Link>
            <Link href="/login" style={{padding: '8px 16px', color: '#4b5563', textDecoration: 'none', fontSize: 14, fontWeight: 500, borderRadius: 8}}>Sign In</Link>
            <Link href="/signup" style={{padding: '10px 20px', background: '#2563eb', color: 'white', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, boxShadow: '0 1px 3px rgba(37,99,235,0.3)'}}>Sign Up Free</Link>
            <a href="https://github.com/davideponti/vatrate" target="_blank" style={{padding: '8px 16px', background: '#f3f4f6', color: '#1e293b', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: 4, verticalAlign: 'middle'}}><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              GitHub
            </a>
          </nav>
        </div>
      </header>

      <section style={{padding: '80px 24px', maxWidth: 1200, margin: '0 auto'}}>
        <div style={{textAlign: 'center', marginBottom: 60}}>
          <div style={{display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'white', borderRadius: 100, border: '1px solid #e5e7eb', fontSize: 13, fontWeight: 600, color: '#6b7280', marginBottom: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.02)'}}>
            <span style={{color: '#22c55e'}}>●</span> Simple, transparent pricing
          </div>
          <h1 style={{fontSize: 40, fontWeight: 800, margin: '0 0 12px', color: '#0f172a', letterSpacing: '-0.5px'}}>Plans for every stage</h1>
          <p style={{color: '#64748b', fontSize: 18, margin: 0, maxWidth: 500, marginLeft: 'auto', marginRight: 'auto'}}>
            Free to start. Pay as you grow. No hidden fees.
          </p>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24}}>
          {plans.map(plan => (
            <div key={plan.name} style={{
              padding: 32, background: plan.highlighted ? '#0f172a' : 'white', borderRadius: 16,
              border: plan.highlighted ? 'none' : '1px solid #f1f5f9', color: plan.highlighted ? 'white' : 'inherit',
              position: 'relative' as const, display: 'flex', flexDirection: 'column' as const,
              boxShadow: plan.highlighted ? '0 25px 50px -12px rgba(0,0,0,0.25)' : '0 1px 3px rgba(0,0,0,0.04)',
            }}>
              {plan.highlighted && (
                <div style={{position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #f59e0b, #eab308)', color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600, boxShadow: '0 2px 4px rgba(245,158,11,0.3)'}}>
                  Most Popular
                </div>
              )}
              <h3 style={{fontSize: 20, fontWeight: 700, margin: '0 0 4px'}}>{plan.name}</h3>
              <div style={{margin: '16px 0'}}>
                <span style={{fontSize: 40, fontWeight: 800}}>{plan.price}</span>
                <span style={{fontSize: 14, opacity: 0.6}}> {plan.period}</span>
              </div>
              <p style={{fontSize: 14, opacity: 0.7, margin: '0 0 24px', lineHeight: 1.5}}>{plan.desc}</p>
              <ul style={{listStyle: 'none', padding: 0, margin: '0 0 32px', flex: 1}}>
                {plan.features.map(f => (
                  <li key={f} style={{padding: '6px 0', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8}}>
                    <span style={{color: '#22c55e'}}>✓</span> {f}
                  </li>
                ))}
              </ul>

              {plan.id === 'free' ? (
                <Link href={plan.href} style={{
                  display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10,
                  background: '#2563eb', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: 15,
                  boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
                }}>
                  {plan.cta}
                </Link>
              ) : (
                <a href={plan.href} target="_blank" rel="noopener noreferrer" style={{
                  display: 'block', textAlign: 'center', padding: '12px', borderRadius: 10,
                  background: plan.highlighted ? 'white' : '#2563eb',
                  color: plan.highlighted ? '#0f172a' : 'white', textDecoration: 'none', fontWeight: 600, fontSize: 15,
                  boxShadow: plan.highlighted ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
                }}>
                  {plan.cta}
                </a>
              )}
            </div>
          ))}
        </div>

        <div style={{marginTop: 60, padding: 32, background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0', textAlign: 'center'}}>
          <h3 style={{fontSize: 18, fontWeight: 700, margin: '0 0 8px', color: '#0f172a'}}>Need a custom plan?</h3>
          <p style={{color: '#64748b', fontSize: 15, margin: '0 0 16px'}}>We offer white-label solutions, Shopify apps, and platform integrations.</p>
          <a href="mailto:hello@vatrate.eu" style={{color: '#2563eb', fontWeight: 600, fontSize: 15}}>hello@vatrate.eu</a>
        </div>
      </section>

      <footer style={{borderTop: '1px solid #f1f5f9', padding: '48px 32px 32px', background: '#fafafa'}}>
        <div style={{maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            <div style={{fontSize: 18, fontWeight: 800, color: '#2563eb', marginBottom: 8}}>VATRate</div>
            <p style={{color: '#64748b', fontSize: 14, margin: 0, maxWidth: 240, lineHeight: 1.6}}>Open-source EU VAT rates API for developers.</p>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            <div style={{fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8}}>Product</div>
            <Link href="/docs" style={{color: '#64748b', textDecoration: 'none', fontSize: 14}}>Documentation</Link>
            <Link href="/pricing" style={{color: '#64748b', textDecoration: 'none', fontSize: 14}}>Pricing</Link>
            <a href="https://github.com/davideponti/vatrate" target="_blank" style={{color: '#64748b', textDecoration: 'none', fontSize: 14}}>GitHub</a>
          </div>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            <div style={{fontSize: 13, fontWeight: 700, color: '#0f172a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8}}>Company</div>
            <a href="mailto:hello@vatrate.eu" style={{color: '#64748b', textDecoration: 'none', fontSize: 14}}>Contact</a>
            <a href="https://github.com/davideponti/vatrate/issues" target="_blank" style={{color: '#64748b', textDecoration: 'none', fontSize: 14}}>Report Issue</a>
            <Link href="/terms" style={{color: '#64748b', textDecoration: 'none', fontSize: 14}}>Terms &amp; Conditions</Link>
            <Link href="/privacy" style={{color: '#64748b', textDecoration: 'none', fontSize: 14}}>Privacy Policy</Link>
          </div>
        </div>
        <div style={{maxWidth: 1200, margin: '32px auto 0', paddingTop: 24, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 13, color: '#94a3b8'}}>
          <span>© 2026 VATRate. Open source EU VAT data.</span>
          <span>Made with ❤️ for developers.</span>
        </div>
      </footer>
    </div>
  );
}
