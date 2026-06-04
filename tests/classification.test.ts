import { describe, it, expect } from 'vitest';
import { classifyProduct } from '@vatrate/api';
import { getCountryData } from '@vatrate/api';

describe('POST /api/v1/products', () => {
  it('classifies SaaS product', () => {
    const result = classifyProduct('cloud accounting software subscription');
    expect(['saas', 'software']).toContain(result.product_type);
    expect(result.classification).toBe('digital_service');
    expect(result.confidence).toBeGreaterThanOrEqual(0.9);
  });

  it('classifies e-book product', () => {
    const result = classifyProduct('e-book about programming');
    expect(result.product_type).toBe('ebooks');
  });

  it('classifies online course', () => {
    const result = classifyProduct('web development course');
    expect(result.product_type).toBe('online_courses');
  });

  it('classifies generic digital product with lower confidence', () => {
    const result = classifyProduct('digital download package');
    expect(result.confidence).toBeLessThanOrEqual(0.8);
  });

  it('includes country-specific rates when country data provided', () => {
    const countryData = getCountryData('IT');
    const result = classifyProduct('cloud accounting software', countryData);
    expect(result.b2c.rate).toBe(22);
    expect(result.b2b.rate).toBe(0);
  });
});
