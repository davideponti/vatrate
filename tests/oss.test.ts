import { describe, it, expect } from 'vitest';
import { checkOssThreshold } from '@vatrate/api';

describe('GET /api/v1/oss-threshold', () => {
  it('returns not exceeded when below threshold', () => {
    const result = checkOssThreshold({
      home_country: 'IT',
      sales_fr: 3000,
      sales_de: 2000,
    });
    expect(result.threshold_exceeded).toBe(false);
    expect(result.oss_required).toBe(false);
    expect(result.total_b2c_digital_sales).toBe(5000);
  });

  it('returns exceeded when above threshold', () => {
    const result = checkOssThreshold({
      home_country: 'IT',
      sales_fr: 8000,
      sales_de: 5000,
      sales_es: 2000,
    });
    expect(result.threshold_exceeded).toBe(true);
    expect(result.oss_required).toBe(true);
    expect(result.total_b2c_digital_sales).toBe(15000);
  });

  it('identifies countries exceeding threshold', () => {
    const result = checkOssThreshold({
      home_country: 'IT',
      sales_fr: 12000,
    });
    expect(result.countries_exceeding).toContain('FR');
  });

  it('returns correct action message when exceeded', () => {
    const result = checkOssThreshold({
      home_country: 'IT',
      sales_de: 11000,
    });
    expect(result.action).toContain('Register for OSS');
    expect(result.action).toContain('Italy');
  });

  it('returns correct action when not exceeded', () => {
    const result = checkOssThreshold({
      home_country: 'FR',
      sales_de: 3000,
    });
    expect(result.action).toContain('No action required');
    expect(result.action).toContain('France');
  });

  it('handles no sales data gracefully', () => {
    const result = checkOssThreshold({ home_country: 'IT' });
    expect(result.total_b2c_digital_sales).toBe(0);
    expect(result.threshold_exceeded).toBe(false);
  });

  it('handles exact threshold', () => {
    const result = checkOssThreshold({
      home_country: 'DE',
      sales_fr: 10000,
    });
    expect(result.threshold_exceeded).toBe(false);
    expect(result.oss_required).toBe(false);
  });
});
