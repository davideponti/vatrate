import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for EU VAT rates API. Free tier available.',
};

const plans = [
  {
    name: 'Open Source',
    price: '€0',
    period: 'forever',
    description: 'For developers exploring EU VAT.',
    features: [
      'JSON access via GitHub',
      '100 API requests/day',
      'Community support',
      'Open source data',
    ],
    cta: 'Get Started',
    href: '/docs',
    highlighted: false,
  },
  {
    name: 'API Basic',
    price: '€19',
    period: '/month',
    description: 'For startups and small projects.',
    features: [
      '1,000 API requests/month',
      'Auto-updated rates',
      'Email support',
      'OSS threshold checker',
    ],
    cta: 'Subscribe',
    href: '#',
    highlighted: true,
  },
  {
    name: 'API Pro',
    price: '€49',
    period: '/month',
    description: 'For growing businesses.',
    features: [
      '10,000 API requests/month',
      'Product classification',
      'Rate alerts',
      'Priority support',
    ],
    cta: 'Subscribe',
    href: '#',
    highlighted: false,
  },
  {
    name: 'Enterprise',
    price: '€149',
    period: '/month',
    description: 'For scale and compliance teams.',
    features: [
      '100,000 API requests/month',
      'Country-specific alerts',
      'Webhook integration',
      'SLA 99.9%',
      'Dedicated support',
    ],
    cta: 'Contact Us',
    href: '#',
    highlighted: false,
  },
];

export default function PricingPage() {
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
            <Link href="/docs" style={{ color: '#4b5563', textDecoration: 'none' }}>Docs</Link>
            <Link href="/pricing" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>Pricing</Link>
            <Link href="/dashboard" style={{ color: '#4b5563', textDecoration: 'none' }}>Dashboard</Link>
          </nav>
        </div>
      </header>

      <section style={{ padding: '80px 24px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: '0 0 12px' }}>
            Simple, transparent pricing
          </h1>
          <p style={{ color: '#6b7280', fontSize: 18, margin: 0 }}>
            Free to start. Pay as you grow. No hidden fees.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 24,
        }}>
          {plans.map((plan) => (
            <div key={plan.name} style={{
              padding: 32,
              background: plan.highlighted ? '#2563eb' : 'white',
              borderRadius: 16,
              border: plan.highlighted ? 'none' : '1px solid #e5e7eb',
              color: plan.highlighted ? 'white' : 'inherit',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {plan.highlighted && (
                <div style={{
                  position: 'absolute',
                  top: -12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#f59e0b',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: 20,
                  fontSize: 13,
                  fontWeight: 600,
                }}>
                  Most Popular
                </div>
              )}
              <h3 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>{plan.name}</h3>
              <div style={{ margin: '16px 0' }}>
                <span style={{ fontSize: 40, fontWeight: 800 }}>{plan.price}</span>
                <span style={{ fontSize: 14, opacity: 0.7 }}> {plan.period}</span>
              </div>
              <p style={{
                fontSize: 14,
                opacity: 0.8,
                margin: '0 0 24px',
                lineHeight: 1.5,
              }}>
                {plan.description}
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 32px',
                flex: 1,
              }}>
                {plan.features.map((f) => (
                  <li key={f} style={{
                    padding: '6px 0',
                    fontSize: 14,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span>✓</span> {f}
                  </li>
                ))}
              </ul>
              <a href={plan.href}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '12px',
                  borderRadius: 10,
                  background: plan.highlighted ? 'white' : '#2563eb',
                  color: plan.highlighted ? '#2563eb' : 'white',
                  textDecoration: 'none',
                  fontWeight: 600,
                  fontSize: 15,
                }}>
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 60,
          padding: 32,
          background: '#f9fafb',
          borderRadius: 16,
          border: '1px solid #e5e7eb',
          textAlign: 'center',
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
            Need a custom plan?
          </h3>
          <p style={{ color: '#6b7280', fontSize: 15, margin: '0 0 16px' }}>
            We offer white-label solutions, Shopify apps, and platform integrations.
          </p>
          <a href="mailto:hello@vatrate.eu"
            style={{
              color: '#2563eb',
              fontWeight: 600,
              fontSize: 15,
            }}>
            hello@vatrate.eu
          </a>
        </div>
      </section>

      <footer style={{
        borderTop: '1px solid #e5e7eb',
        padding: '24px',
        textAlign: 'center',
        color: '#6b7280',
        fontSize: 14,
        marginTop: 'auto',
      }}>
        © 2026 VATRate. Open source EU VAT data for developers.
      </footer>
    </div>
  );
}
