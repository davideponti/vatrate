'use client';

import { useState, useEffect } from 'react';

interface WidgetConfig {
  theme?: 'light' | 'dark';
  country?: string;
  type?: 'saas' | 'ebooks' | 'online_courses' | 'digital_services';
  showTitle?: boolean;
}

/**
 * Embeddable VAT rate widget.
 * Usage: <VatRateWidget country="DE" type="saas" />
 */
export function VatRateWidget({ theme = 'light', country = 'DE', type = 'saas', showTitle = true }: WidgetConfig) {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch(`/api/v1/rate?country=${country}&type=${type}&customer=consumer`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setRate(data.rate);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error');
      } finally {
        setLoading(false);
      }
    }
    fetchRate();
  }, [country, type]);

  const isDark = theme === 'dark';
  const bg = isDark ? '#1e293b' : 'white';
  const text = isDark ? '#f1f5f9' : '#1a1a2e';
  const muted = isDark ? '#94a3b8' : '#6b7280';
  const accent = '#2563eb';

  return (
    <div style={{
      padding: 20,
      borderRadius: 12,
      background: bg,
      border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: text,
      minWidth: 200,
    }}>
      {showTitle && (
        <div style={{ fontSize: 13, color: muted, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
          VAT Rate — {country}
        </div>
      )}
      {loading && (
        <div style={{ height: 40, display: 'flex', alignItems: 'center', color: muted, fontSize: 14 }}>
          Loading...
        </div>
      )}
      {error && (
        <div style={{ height: 40, display: 'flex', alignItems: 'center', color: '#ef4444', fontSize: 14 }}>
          {error}
        </div>
      )}
      {!loading && !error && rate !== null && (
        <div>
          <div style={{
            fontSize: 36,
            fontWeight: 800,
            color: accent,
            lineHeight: 1,
          }}>
            {rate}%
          </div>
          <div style={{ fontSize: 13, color: muted, marginTop: 4 }}>
            {type.replace('_', ' ')} — Consumer
          </div>
          <div style={{
            marginTop: 12,
            padding: '6px 12px',
            background: isDark ? '#0f172a' : '#f3f4f6',
            borderRadius: 6,
            fontSize: 12,
            color: muted,
          }}>
            {type === 'saas' ? 'Digital service' : type} — standard rate
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Vanilla JS embed script generator.
 */
export function generateEmbedScript(config: WidgetConfig): string {
  return `
<!-- VATRate Widget -->
<div id="vatrate-widget"></div>
<script>
  (function() {
    var s = document.createElement('script');
    s.src = 'https://vatrate.eu/widget.js';
    s.setAttribute('data-country', '${config.country || 'DE'}');
    s.setAttribute('data-type', '${config.type || 'saas'}');
    s.setAttribute('data-theme', '${config.theme || 'light'}');
    document.currentScript.parentNode.insertBefore(s, document.currentScript);
  })();
</script>
<!-- End VATRate Widget -->
  `.trim();
}
