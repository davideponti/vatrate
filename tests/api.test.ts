import { describe, it, expect } from 'vitest';
import { resolveRate, getCountryRates, getDatabaseMeta } from '@vatrate/api';

describe('GET /api/v1/rate', () => {
  it('returns correct rate for DE SaaS consumer', () => {
    const result = resolveRate({ country: 'DE', type: 'saas', customer: 'consumer' });
    if ('error' in result) throw new Error(result.message);
    expect(result.rate).toBe(19);
    expect(result.mechanism).toBe('standard');
    expect(result.country_name).toBe('Germany');
  });

  it('returns reverse charge for DE SaaS business', () => {
    const result = resolveRate({ country: 'DE', type: 'saas', customer: 'business', vat_number: 'DE123456789' });
    if ('error' in result) throw new Error(result.message);
    expect(result.rate).toBe(0);
    expect(result.mechanism).toBe('reverse_charge');
  });

  it('returns correct rate for IT ebooks consumer', () => {
    const result = resolveRate({ country: 'IT', type: 'ebooks', customer: 'consumer' });
    if ('error' in result) throw new Error(result.message);
    expect(result.rate).toBe(4);
    expect(result.country_name).toBe('Italy');
  });

  it('returns correct rate for FR SaaS consumer', () => {
    const result = resolveRate({ country: 'FR', type: 'saas', customer: 'consumer' });
    if ('error' in result) throw new Error(result.message);
    expect(result.rate).toBe(20);
  });

  it('returns 404 for unknown country', () => {
    const result = resolveRate({ country: 'XX', type: 'saas' });
    if (!('error' in result)) throw new Error('Expected error');
    expect(result.status).toBe(404);
  });

  it('includes OSS info for B2C', () => {
    const result = resolveRate({ country: 'FR', type: 'saas', customer: 'consumer' });
    if ('error' in result) throw new Error(result.message);
    expect(result.oss_applicable).toBe(true);
    expect(result.oss_threshold).toBeDefined();
    expect(result.oss_threshold?.amount).toBe(10000);
  });

  it('handles lowercase country codes', () => {
    const result = resolveRate({ country: 'de', type: 'saas', customer: 'consumer' });
    if ('error' in result) throw new Error(result.message);
    expect(result.rate).toBe(19);
  });

  it('validates VAT number format', () => {
    const result = resolveRate({ country: 'DE', type: 'saas', customer: 'business', vat_number: 'DE123456789' });
    if ('error' in result) throw new Error(result.message);
    expect(result.vat_number_valid).toBe(true);
  });

  it('returns invalid for bad VAT number', () => {
    const result = resolveRate({ country: 'DE', type: 'saas', customer: 'business', vat_number: '123' });
    if ('error' in result) throw new Error(result.message);
    expect(result.vat_number_valid).toBe(false);
  });

  it('defaults to digital_services for unknown product type', () => {
    const result = resolveRate({ country: 'DE', type: 'saas', customer: 'consumer' });
    if ('error' in result) throw new Error(result.message);
    expect(result.rate).toBe(19);
  });
});

describe('GET /api/v1/rates', () => {
  it('returns all rates for a country', () => {
    const result = getCountryRates('IT');
    expect(result).not.toBeNull();
    expect(result!.vat.standard).toBe(22);
    expect(result!.rates_by_type.saas_b2b).toBe(0);
    expect(result!.rates_by_type.saas_b2c).toBe(22);
  });

  it('returns null for unknown country', () => {
    const result = getCountryRates('XX');
    expect(result).toBeNull();
  });
});

describe('Database metadata', () => {
  it('returns schema version', () => {
    const meta = getDatabaseMeta();
    expect(meta.schema_version).toBe('1.0.0');
    expect(meta.source).toContain('European Commission');
  });
});

describe('All 27 EU countries', () => {
  const countries = ['AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'];

  for (const country of countries) {
    it(`${country} has valid SaaS rates`, () => {
      const result = resolveRate({ country, type: 'saas', customer: 'consumer' });
      if ('error' in result) throw new Error(`Failed for ${country}: ${result.message}`);
      expect(result.rate).toBeGreaterThanOrEqual(0);
      expect(typeof result.rate).toBe('number');
    });

    it(`${country} has reverse charge for B2B`, () => {
      const result = resolveRate({ country, type: 'saas', customer: 'business' });
      if ('error' in result) throw new Error(`Failed for ${country}: ${result.message}`);
      expect(result.rate).toBe(0);
      expect(result.mechanism).toBe('reverse_charge');
    });
  }
});
