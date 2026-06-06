import Link from 'next/link';

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  header: {
    padding: '20px 32px',
    background: 'rgba(255,255,255,0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(229,231,235,0.5)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
  },
  headerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    fontSize: 22,
    fontWeight: 800,
    color: '#2563eb',
    textDecoration: 'none',
    letterSpacing: '-0.5px',
  },
  logoAccent: {
    color: '#1e293b',
  },
  nav: {
    display: 'flex',
    gap: 8,
    alignItems: 'center',
  },
  navLink: {
    padding: '8px 16px',
    color: '#4b5563',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 500,
    borderRadius: 8,
    transition: 'all 0.15s ease',
  },
  navLinkActive: {
    padding: '8px 16px',
    color: '#2563eb',
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    borderRadius: 8,
  },
  btnPrimary: {
    padding: '10px 20px',
    background: '#2563eb',
    color: 'white',
    borderRadius: 10,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 1px 3px rgba(37,99,235,0.3)',
  },
  btnOutline: {
    padding: '10px 20px',
    background: 'transparent',
    color: '#1e293b',
    borderRadius: 10,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    border: '2px solid #e5e7eb',
    transition: 'all 0.15s ease',
  },
  btnGhost: {
    padding: '8px 16px',
    background: '#f3f4f6',
    color: '#1e293b',
    borderRadius: 8,
    textDecoration: 'none',
    fontSize: 14,
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  hero: {
    padding: '120px 32px 100px',
    textAlign: 'center' as const,
    position: 'relative' as const,
    overflow: 'hidden',
    background: 'linear-gradient(180deg, #eff6ff 0%, #f8fafc 40%, #ffffff 100%)',
  },
  heroBg: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(37,99,235,0.03) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(37,99,235,0.03) 0%, transparent 50%)',
    backgroundSize: '100% 100%',
    pointerEvents: 'none' as const,
  },
  heroContent: {
    maxWidth: 800,
    margin: '0 auto',
    position: 'relative' as const,
    zIndex: 1,
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 14px',
    background: 'white',
    borderRadius: 100,
    border: '1px solid #e5e7eb',
    fontSize: 13,
    fontWeight: 600,
    color: '#6b7280',
    marginBottom: 24,
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  },
  heroTitle: {
    fontSize: 56,
    fontWeight: 800,
    lineHeight: 1.1,
    margin: '0 0 20px',
    color: '#0f172a',
    letterSpacing: '-1.5px',
  },
  heroGradient: {
    background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSub: {
    fontSize: 18,
    color: '#64748b',
    lineHeight: 1.7,
    margin: '0 auto 40px',
    maxWidth: 600,
  },
  heroCtas: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center' as const,
    flexWrap: 'wrap' as const,
  },
  codeBlock: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 24px',
    background: '#0f172a',
    color: '#e2e8f0',
    borderRadius: 12,
    fontSize: 14,
    fontFamily: '"SF Mono", "Fira Code", "Fira Mono", monospace',
    border: '1px solid #1e293b',
    marginTop: 40,
  },
  codeDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#22c55e',
    display: 'inline-block',
    marginRight: 8,
  },
  section: {
    padding: '100px 32px',
    maxWidth: 1200,
    margin: '0 auto',
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: 800,
    textAlign: 'center' as const,
    margin: '0 0 16px',
    color: '#0f172a',
    letterSpacing: '-0.5px',
  },
  sectionSub: {
    fontSize: 17,
    color: '#64748b',
    textAlign: 'center' as const,
    margin: '0 auto 60px',
    maxWidth: 600,
    lineHeight: 1.7,
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: 24,
  },
  featureCard: {
    padding: 32,
    background: 'white',
    borderRadius: 16,
    border: '1px solid #f1f5f9',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: 16,
    display: 'block',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 700,
    margin: '0 0 8px',
    color: '#0f172a',
  },
  featureDesc: {
    color: '#64748b',
    lineHeight: 1.7,
    margin: 0,
    fontSize: 15,
  },
  darkSection: {
    padding: '100px 32px',
    background: '#0f172a',
    color: 'white',
  },
  responseCard: {
    background: '#0a0f1e',
    borderRadius: 16,
    padding: 32,
    border: '1px solid #1e293b',
    maxWidth: 720,
    margin: '0 auto',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
  },
  responseLine: {
    color: '#64748b',
    fontSize: 13,
    marginBottom: 16,
    fontFamily: '"SF Mono", "Fira Code", monospace',
  },
  responseJson: {
    margin: 0,
    fontFamily: '"SF Mono", "Fira Code", monospace',
    fontSize: 13.5,
    lineHeight: 1.8,
    color: '#e2e8f0',
  },
  stepsContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 24,
    maxWidth: 700,
    margin: '0 auto',
  },
  step: {
    display: 'flex',
    gap: 20,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 18,
    flexShrink: 0,
    boxShadow: '0 4px 6px rgba(37,99,235,0.2)',
  },
  stepContent: {
    paddingTop: 4,
  },
  stepTitle: {
    margin: '0 0 4px',
    fontSize: 18,
    fontWeight: 700,
    color: '#0f172a',
  },
  stepDesc: {
    color: '#64748b',
    margin: 0,
    lineHeight: 1.6,
    fontSize: 15,
  },
  ctaSection: {
    padding: '100px 32px',
    textAlign: 'center' as const,
    background: 'linear-gradient(135deg, #eff6ff 0%, #f0f0ff 50%, #faf5ff 100%)',
  },
  ctaCard: {
    maxWidth: 600,
    margin: '0 auto',
    padding: '48px 40px',
    background: 'white',
    borderRadius: 24,
    border: '1px solid rgba(229,231,235,0.5)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.02), 0 10px 40px rgba(37,99,235,0.05)',
  },
  footer: {
    borderTop: '1px solid #f1f5f9',
    padding: '48px 32px 32px',
    background: '#fafafa',
  },
  footerInner: {
    maxWidth: 1200,
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: 32,
  },
  footerCol: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: '#0f172a',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  footerLink: {
    color: '#64748b',
    textDecoration: 'none',
    fontSize: 14,
    transition: 'color 0.15s ease',
  },
  footerBottom: {
    maxWidth: 1200,
    margin: '32px auto 0',
    paddingTop: 24,
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: 12,
    fontSize: 13,
    color: '#94a3b8',
  },
};

export default function HomePage() {
  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <Link href="/" style={styles.logo}>
            VAT<span style={styles.logoAccent}>Rate</span>
          </Link>
          <nav style={styles.nav}>
            <Link href="/docs" style={styles.navLink}>Docs</Link>
            <Link href="/pricing" style={styles.navLink}>Pricing</Link>
            <Link href="/login" style={styles.navLink}>Sign In</Link>
            <Link href="/signup" style={styles.btnPrimary}>
              Sign Up Free
            </Link>
            <a href="https://github.com/davideponti/vatrate" target="_blank" rel="noopener noreferrer" style={styles.btnGhost}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{marginRight: 4, verticalAlign: 'middle'}}>
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroBg} />
        <div style={styles.heroContent}>
          <div style={styles.badge}>
            <span style={{color: '#22c55e'}}>●</span> Open Source EU VAT API
          </div>
          <h1 style={styles.heroTitle}>
            Know your VAT.<br />
            <span style={styles.heroGradient}>Ship globally.</span>
          </h1>
          <p style={styles.heroSub}>
            One API endpoint for all 27 EU countries. SaaS, e-books, online courses, 
            and digital services. B2B and B2C. Free to start.
          </p>
          <div style={styles.heroCtas}>
            <Link href="/signup" style={{
              ...styles.btnPrimary,
              padding: '14px 32px',
              fontSize: 16,
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}>
              Get Started Free →
            </Link>
            <Link href="/docs" style={{
              ...styles.btnOutline,
              padding: '14px 32px',
              fontSize: 16,
            }}>
              Read the Docs
            </Link>
          </div>
          <div style={styles.codeBlock}>
            <span><span style={styles.codeDot}></span> GET /api/v1/rate?country=DE&type=saas&customer=consumer</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Everything you need for EU VAT</h2>
        <p style={styles.sectionSub}>
          From rate lookups to OSS threshold checking — one API covers it all.
        </p>
        <div style={styles.featuresGrid}>
          {[
            { emoji: '🇪🇺', title: 'All 27 EU Countries', desc: 'Complete VAT data for every EU member state, including reduced and super-reduced rates.' },
            { emoji: '🔄', title: 'Reverse Charge B2B', desc: 'Automatic 0% VAT for B2B transactions with valid VAT number. Fully EU-compliant.' },
            { emoji: '📊', title: 'OSS Threshold Checker', desc: 'Know instantly when you exceed the €10k threshold and need OSS registration.' },
            { emoji: '🤖', title: 'AI Product Classification', desc: 'Describe any product and get the correct VAT classification with confidence scores.' },
            { emoji: '📦', title: 'Open Source & Transparent', desc: 'All VAT data is open source on GitHub. Community-verified, always up to date.' },
            { emoji: '⚡', title: 'Lightning Fast Edge API', desc: 'Built on Next.js + Vercel Edge. Sub-100ms response times from anywhere in the world.' },
          ].map((f, i) => (
            <div key={i} style={styles.featureCard}>
              <span style={styles.featureEmoji}>{f.emoji}</span>
              <h3 style={styles.featureTitle}>{f.title}</h3>
              <p style={styles.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* API Response Example */}
      <section style={styles.darkSection}>
        <div>
          <h2 style={{...styles.sectionTitle, color: 'white', marginBottom: 12}}>
            One API call. Any country.
          </h2>
          <p style={{...styles.sectionSub, color: '#94a3b8', marginBottom: 48}}>
            Get VAT rates for any product type, customer type, and country in a single request.
          </p>
          <div style={styles.responseCard}>
            <div style={styles.responseLine}>
              <span style={{color: '#22c55e'}}>$</span> curl https://vatrate.eu/api/v1/rate?country=IT&type=saas&customer=consumer
            </div>
            <pre style={styles.responseJson}>
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
    "exceeded": false
  }
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Get started in minutes</h2>
        <p style={styles.sectionSub}>
          No credit card required. Free tier with 3,000 requests/month.
        </p>
        <div style={styles.stepsContainer}>
          {[
            { step: '1', title: 'Sign up for free', desc: 'Create your account and get an API key instantly. No credit card needed.' },
            { step: '2', title: 'Make your first request', desc: 'Call the API with country, product type, and customer type to get the correct VAT rate.' },
            { step: '3', title: 'Integrate in your checkout', desc: 'Use the response to charge the correct VAT in any EU country. Works with any stack.' },
            { step: '4', title: 'Scale across the EU', desc: 'From €0/month to enterprise. Monitor usage, manage keys, and get alerts on rate changes.' },
          ].map((item, i) => (
            <div key={i} style={styles.step}>
              <div style={styles.stepNumber}>{item.step}</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>{item.title}</h3>
                <p style={styles.stepDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.ctaSection}>
        <div style={styles.ctaCard}>
          <h2 style={{fontSize: 28, fontWeight: 800, margin: '0 0 12px', color: '#0f172a'}}>
            Start shipping with confidence
          </h2>
          <p style={{color: '#64748b', fontSize: 16, margin: '0 0 32px', lineHeight: 1.7}}>
            Open source data. Free API tier. No credit card required. 
            Join hundreds of developers using VATRate.
          </p>
          <div style={{display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap'}}>
            <Link href="/signup" style={{
              ...styles.btnPrimary,
              padding: '14px 32px',
              fontSize: 16,
              boxShadow: '0 4px 14px rgba(37,99,235,0.3)',
            }}>
              Get Started Free →
            </Link>
            <Link href="/pricing" style={{
              ...styles.btnOutline,
              padding: '14px 32px',
              fontSize: 16,
            }}>
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerInner}>
          <div style={styles.footerCol}>
            <div style={{fontSize: 18, fontWeight: 800, color: '#2563eb', marginBottom: 8}}>VATRate</div>
            <p style={{color: '#64748b', fontSize: 14, margin: 0, maxWidth: 240, lineHeight: 1.6}}>
              Open-source EU VAT rates API for developers. Know your VAT, ship globally.
            </p>
          </div>
          <div style={styles.footerCol}>
            <div style={styles.footerTitle}>Product</div>
            <Link href="/docs" style={styles.footerLink}>Documentation</Link>
            <Link href="/pricing" style={styles.footerLink}>Pricing</Link>
            <a href="https://github.com/davideponti/vatrate" target="_blank" style={styles.footerLink}>GitHub</a>
          </div>
          <div style={styles.footerCol}>
            <div style={styles.footerTitle}>API</div>
            <Link href="/docs#rate" style={styles.footerLink}>Get VAT Rate</Link>
            <Link href="/docs#rates" style={styles.footerLink}>Country Rates</Link>
            <Link href="/docs#oss" style={styles.footerLink}>OSS Threshold</Link>
            <Link href="/docs#products" style={styles.footerLink}>Classification</Link>
          </div>
          <div style={styles.footerCol}>
            <div style={styles.footerTitle}>Company</div>
            <a href="mailto:hello@vatrate.eu" style={styles.footerLink}>Contact</a>
            <a href="https://github.com/davideponti/vatrate/issues" target="_blank" style={styles.footerLink}>Report Issue</a>
          </div>
        </div>
        <div style={styles.footerBottom}>
          <span>© 2026 VATRate. Open source EU VAT data.</span>
          <span>Made with ❤️ for developers across Europe.</span>
        </div>
      </footer>
    </div>
  );
}
