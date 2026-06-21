'use client';

interface PricingCardsProps {
  onSelect?: (planId: string) => void;
}

const plans = [
  {
    id: 'free',
    name: 'Open Source',
    price: '€0',
    description: 'For developers exploring EU VAT.',
    features: ['JSON access via GitHub', '100 API req/day', 'Community support'],
    cta: 'Get Started',
  },
  {
    id: 'basic',
    name: 'API Basic',
    price: '€19',
    description: 'For startups and small projects.',
    features: ['3,000 API requests/month', 'Auto-updated rates', 'Email support', 'OSS threshold checker'],
    cta: 'Subscribe',
    popular: true,
  },
  {
    id: 'pro',
    name: 'API Pro',
    price: '€49',
    description: 'For growing businesses.',
    features: ['10,000 API requests/month', 'Product classification', 'Rate alerts', 'Priority support'],
    cta: 'Subscribe',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '€149',
    description: 'For scale and compliance teams.',
    features: ['100,000 API requests/month', 'Country-specific alerts', 'Webhook integration', 'SLA 99.9%', 'Dedicated support'],
    cta: 'Subscribe',
  },
];

export function PricingCards({ onSelect }: PricingCardsProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: 20,
    }}>
      {plans.map((plan) => (
        <div key={plan.id} style={{
          padding: 28,
          borderRadius: 16,
          background: plan.popular ? '#2563eb' : 'white',
          border: plan.popular ? 'none' : '1px solid #e5e7eb',
          color: plan.popular ? 'white' : 'inherit',
          position: 'relative',
        }}>
          {plan.popular && (
            <div style={{
              position: 'absolute',
              top: -10,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#f59e0b',
              color: 'white',
              padding: '4px 14px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
            }}>
              Popular
            </div>
          )}
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px' }}>{plan.name}</h3>
          <div style={{ fontSize: 32, fontWeight: 800, margin: '12px 0' }}>{plan.price}</div>
          <p style={{
            fontSize: 14,
            opacity: 0.8,
            margin: '0 0 20px',
            lineHeight: 1.5,
          }}>
            {plan.description}
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', fontSize: 14 }}>
            {plan.features.map((f) => (
              <li key={f} style={{ padding: '4px 0', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>✓</span> {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => onSelect?.(plan.id)}
            style={{
              width: '100%',
              padding: 12,
              borderRadius: 10,
              border: 'none',
              background: plan.popular ? 'white' : '#2563eb',
              color: plan.popular ? '#2563eb' : 'white',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
            }}>
            {plan.cta}
          </button>
        </div>
      ))}
    </div>
  );
}
