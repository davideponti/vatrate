'use client';

interface RateCardProps {
  country: string;
  countryName: string;
  vat: {
    standard: number;
    reduced: number | null;
    super_reduced: number | null;
    parking: number | null;
    zero: number;
  };
}

/**
 * Displays VAT rates for a country in a card format.
 */
export function RateCard({ country, countryName, vat }: RateCardProps) {
  const rates = [
    { label: 'Standard', rate: vat.standard, color: '#2563eb' },
    { label: 'Reduced', rate: vat.reduced, color: '#059669' },
    { label: 'Super Reduced', rate: vat.super_reduced, color: '#d97706' },
    { label: 'Parking', rate: vat.parking, color: '#7c3aed' },
    { label: 'Zero', rate: vat.zero, color: '#6b7280' },
  ];

  return (
    <div style={{
      padding: 24,
      background: 'white',
      borderRadius: 12,
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
        {countryName}
      </div>
      <div style={{
        fontSize: 13,
        color: '#6b7280',
        marginBottom: 16,
        fontFamily: 'monospace',
      }}>
        {country}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rates.map((r) => (
          r.rate !== null && (
            <div key={r.label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#f9fafb',
              borderRadius: 8,
            }}>
              <span style={{ fontSize: 14, color: '#4b5563' }}>{r.label}</span>
              <span style={{
                fontSize: 18,
                fontWeight: 700,
                color: r.color,
              }}>
                {r.rate}%
              </span>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
