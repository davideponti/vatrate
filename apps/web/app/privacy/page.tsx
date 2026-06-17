import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'VATRate Privacy Policy — how we collect, use, and protect your data.',
};

export default function PrivacyPage() {
  return (
    <div style={{minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', background: '#fafafa'}}>
      {/* Header */}
      <header style={{padding: '20px 32px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(229,231,235,0.5)', position: 'sticky', top: 0, zIndex: 50}}>
        <div style={{maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
          <Link href="/" style={{fontSize: 22, fontWeight: 800, color: '#2563eb', textDecoration: 'none', letterSpacing: '-0.5px'}}>VAT<span style={{color: '#1e293b'}}>Rate</span></Link>
          <nav style={{display: 'flex', gap: 8, alignItems: 'center'}}>
            <Link href="/docs" style={{padding: '8px 16px', color: '#4b5563', textDecoration: 'none', fontSize: 14, fontWeight: 500, borderRadius: 8}}>Docs</Link>
            <Link href="/pricing" style={{padding: '8px 16px', color: '#4b5563', textDecoration: 'none', fontSize: 14, fontWeight: 500, borderRadius: 8}}>Pricing</Link>
            <Link href="/signup" style={{padding: '10px 20px', background: '#2563eb', color: 'white', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600, boxShadow: '0 1px 3px rgba(37,99,235,0.3)'}}>Sign Up Free</Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main style={{maxWidth: 800, margin: '0 auto', padding: '60px 32px 80px', width: '100%'}}>
        <h1 style={{fontSize: 36, fontWeight: 800, margin: '0 0 8px', color: '#0f172a', letterSpacing: '-0.5px'}}>Privacy Policy</h1>
        <p style={{color: '#94a3b8', fontSize: 14, margin: '0 0 48px'}}>Last updated: June 18, 2026</p>

        <div style={{display: 'flex', flexDirection: 'column', gap: 32}}>
          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>1. Information We Collect</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              We collect information you provide when creating an account, such as your email address and password. We also collect API usage data including request timestamps, endpoints accessed, IP addresses, and response times for monitoring and improving our Service.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>2. How We Use Your Information</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              We use your information to: (a) provide and maintain the Service; (b) monitor API usage and enforce rate limits; (c) communicate with you about your account, updates, and support; (d) improve and develop new features; (e) detect and prevent abuse or unauthorized access.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>3. Data Storage & Security</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              Your data is stored securely using industry-standard encryption. Passwords are hashed and never stored in plain text. API keys are stored with encryption at rest. We implement security measures in line with best practices for SaaS applications.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>4. Third-Party Services</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              We use the following third-party services: Supabase (database and authentication), Stripe (payment processing), Vercel (hosting and edge functions), and GitHub (open source repository). These services have their own privacy policies and data processing agreements.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>5. Cookies</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              We use essential cookies for authentication and session management. We do not use tracking cookies or third-party advertising cookies. You can control cookie preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>6. Data Retention</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              We retain your account information for as long as your account is active. API logs are retained for up to 90 days. You may request deletion of your account and associated data by contacting us.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>7. Your Rights (GDPR)</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              If you are in the European Union, you have the right to: access your personal data; rectify inaccurate data; request deletion of your data; restrict processing; data portability; and object to processing. To exercise these rights, contact us at hello@vatrate.eu.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>8. Data Controller</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              VATRate is operated by an independent developer. For privacy-related inquiries, contact: <a href="mailto:hello@vatrate.eu" style={{color: '#2563eb', fontWeight: 600}}>hello@vatrate.eu</a>.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>9. Changes to This Policy</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              We may update this Privacy Policy from time to time. Material changes will be communicated via email or through the Service.
            </p>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer style={{borderTop: '1px solid #f1f5f9', padding: '32px 24px', textAlign: 'center', color: '#94a3b8', fontSize: 14}}>
        <div style={{display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 12}}>
          <Link href="/terms" style={{color: '#64748b', textDecoration: 'none', fontSize: 14}}>Terms & Conditions</Link>
          <Link href="/privacy" style={{color: '#64748b', textDecoration: 'none', fontSize: 14}}>Privacy Policy</Link>
        </div>
        <div>© 2026 VATRate. Open source EU VAT data for developers.</div>
      </footer>
    </div>
  );
}
