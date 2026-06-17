import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'VATRate Terms & Conditions — terms of service for using the EU VAT rates API.',
};

export default function TermsPage() {
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
        <h1 style={{fontSize: 36, fontWeight: 800, margin: '0 0 8px', color: '#0f172a', letterSpacing: '-0.5px'}}>Terms & Conditions</h1>
        <p style={{color: '#94a3b8', fontSize: 14, margin: '0 0 48px'}}>Last updated: June 18, 2026</p>

        <div style={{display: 'flex', flexDirection: 'column', gap: 32}}>
          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>1. Acceptance of Terms</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              By accessing or using VATRate (the "Service"), you agree to be bound by these Terms & Conditions. If you do not agree, you may not use the Service. VATRate is operated by an independent developer and provided as-is.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>2. Description of Service</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              VATRate provides an API for retrieving European Union VAT rates, OSS threshold information, and product classification. The data is sourced from open EU data and community contributions. While we strive for accuracy, VAT rates may change and we recommend verifying critical rates with official sources.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>3. User Accounts</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              You are responsible for maintaining the confidentiality of your account credentials and API keys. Any activity under your account is your responsibility. You must notify us immediately of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>4. API Usage Limits</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              Usage is subject to rate limits and plan-specific request quotas as described on our Pricing page. Exceeding these limits may result in throttling or temporary suspension. We reserve the right to modify limits with reasonable notice.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>5. Acceptable Use</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              You agree not to: (a) use the Service for any illegal purpose; (b) attempt to bypass rate limits or security measures; (c) reverse engineer the API or data; (d) use the Service in a way that could harm or impair the experience of other users.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>6. Data Accuracy & Disclaimer</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              VATRate provides VAT data for informational purposes. We do not guarantee that the data is complete, accurate, or up-to-date at all times. Users should verify critical VAT information with official government sources. The Service is provided "as is" without warranties of any kind.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>7. Limitation of Liability</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              To the maximum extent permitted by law, VATRate and its operators shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service, including but not limited to incorrect VAT calculations or business decisions based on our data.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>8. Changes to Terms</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              We reserve the right to modify these terms at any time. Material changes will be notified via email or through the Service. Continued use after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>9. Governing Law</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              These terms shall be governed by Italian law. Any disputes shall be resolved in the courts of Italy.
            </p>
          </section>

          <section>
            <h2 style={{fontSize: 22, fontWeight: 700, margin: '0 0 12px', color: '#0f172a'}}>10. Contact</h2>
            <p style={{color: '#475569', lineHeight: 1.8, fontSize: 15, margin: 0}}>
              For questions about these terms, contact us at <a href="mailto:hello@vatrate.eu" style={{color: '#2563eb', fontWeight: 600}}>hello@vatrate.eu</a>.
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
