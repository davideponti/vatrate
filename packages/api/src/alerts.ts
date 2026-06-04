import type { VatAlert, AlertsResponse } from '@vatrate/shared';
import { COUNTRY_NAMES } from '@vatrate/shared';

/**
 * Hardcoded upcoming VAT changes.
 * In production, this would be populated by a GitHub Action scraping EU sources weekly.
 */
const UPCOMING_CHANGES: VatAlert[] = [
  {
    country: 'EE',
    country_name: 'Estonia',
    change: {
      from: 20,
      to: 22,
      effective_date: '2027-01-01',
      type: 'standard_rate',
    },
    impact: 'SaaS B2C rate in Estonia changes from 20% to 22%. Update your pricing.',
  },
  {
    country: 'BE',
    country_name: 'Belgium',
    change: {
      from: 6,
      to: 9,
      effective_date: '2026-07-01',
      type: 'reduced_rate',
    },
    impact: 'Reduced VAT rate on e-books in Belgium changes from 6% to 9%.',
  },
  {
    country: 'HU',
    country_name: 'Hungary',
    change: {
      from: 27,
      to: 25,
      effective_date: '2027-01-01',
      type: 'standard_rate',
    },
    impact: 'Standard VAT rate in Hungary decreases from 27% to 25%.',
  },
];

/**
 * Get upcoming VAT alerts.
 */
export function getAlerts(): AlertsResponse {
  return {
    alerts: UPCOMING_CHANGES,
    last_checked: new Date().toISOString().split('T')[0],
  };
}
