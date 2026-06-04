import { describe, it, expect } from 'vitest';
import { getAlerts } from '@vatrate/api';

describe('GET /api/v1/alerts', () => {
  it('returns alerts array', () => {
    const result = getAlerts();
    expect(Array.isArray(result.alerts)).toBe(true);
    expect(result.alerts.length).toBeGreaterThan(0);
  });

  it('has valid alert structure', () => {
    const result = getAlerts();
    for (const alert of result.alerts) {
      expect(alert.country).toMatch(/^[A-Z]{2}$/);
      expect(alert.country_name).toBeTruthy();
      expect(alert.change.from).toBeGreaterThan(0);
      expect(alert.change.to).toBeGreaterThan(0);
      expect(alert.change.effective_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('includes last_checked date', () => {
    const result = getAlerts();
    expect(result.last_checked).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
