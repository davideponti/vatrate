// ─── Country Codes ───────────────────────────────────────────

export const EU_COUNTRY_CODES = [
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES',
  'FI', 'FR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT',
  'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK',
] as const;

export const EEA_COUNTRY_CODES = [
  ...EU_COUNTRY_CODES,
  'IS', 'LI', 'NO',
] as const;

export const ALL_COUNTRY_CODES = [
  ...EU_COUNTRY_CODES,
  'GB', 'CH', 'NO', 'IS', 'LI',
] as const;

export type EUCountryCode = (typeof EU_COUNTRY_CODES)[number];
export type CountryCode = (typeof ALL_COUNTRY_CODES)[number];

// ─── Product Types ───────────────────────────────────────────

export const PRODUCT_TYPES = [
  'saas',
  'ebooks',
  'online_courses',
  'digital_services',
  'software',
  'telecom',
  'broadcasting',
  'generic_digital',
] as const;

export type ProductType = (typeof PRODUCT_TYPES)[number];

// ─── Customer Types ──────────────────────────────────────────

export const CUSTOMER_TYPES = ['business', 'consumer'] as const;
export type CustomerType = (typeof CUSTOMER_TYPES)[number];

// ─── VAT Mechanisms ──────────────────────────────────────────

export const VAT_MECHANISMS = [
  'standard',
  'reverse_charge',
  'exempt',
  'outside_scope',
] as const;

export type VatMechanism = (typeof VAT_MECHANISMS)[number];

// ─── Plan Types ──────────────────────────────────────────────

export const PLAN_TYPES = ['free', 'basic', 'pro', 'enterprise'] as const;
export type PlanType = (typeof PLAN_TYPES)[number];

// ─── Country Names ───────────────────────────────────────────

export const COUNTRY_NAMES: Record<string, string> = {
  AT: 'Austria',
  BE: 'Belgium',
  BG: 'Bulgaria',
  CY: 'Cyprus',
  CZ: 'Czech Republic',
  DE: 'Germany',
  DK: 'Denmark',
  EE: 'Estonia',
  EL: 'Greece',
  ES: 'Spain',
  FI: 'Finland',
  FR: 'France',
  HR: 'Croatia',
  HU: 'Hungary',
  IE: 'Ireland',
  IT: 'Italy',
  LT: 'Lithuania',
  LU: 'Luxembourg',
  LV: 'Latvia',
  MT: 'Malta',
  NL: 'Netherlands',
  PL: 'Poland',
  PT: 'Portugal',
  RO: 'Romania',
  SE: 'Sweden',
  SI: 'Slovenia',
  SK: 'Slovakia',
  GB: 'United Kingdom',
  CH: 'Switzerland',
  NO: 'Norway',
  IS: 'Iceland',
  LI: 'Liechtenstein',
};

// ─── Currency by Country ─────────────────────────────────────

export const COUNTRY_CURRENCIES: Record<string, string> = {
  AT: 'EUR', BE: 'EUR', BG: 'BGN', CY: 'EUR', CZ: 'CZK',
  DE: 'EUR', DK: 'DKK', EE: 'EUR', EL: 'EUR', ES: 'EUR',
  FI: 'EUR', FR: 'EUR', HR: 'EUR', HU: 'HUF', IE: 'EUR',
  IT: 'EUR', LT: 'EUR', LU: 'EUR', LV: 'EUR', MT: 'EUR',
  NL: 'EUR', PL: 'PLN', PT: 'EUR', RO: 'RON', SE: 'SEK',
  SI: 'EUR', SK: 'EUR',
  GB: 'GBP', CH: 'CHF', NO: 'NOK', IS: 'ISK', LI: 'CHF',
};

// ─── OSS Threshold ──────────────────────────────────────────

export const OSS_THRESHOLD = {
  amount: 10000,
  currency: 'EUR',
  note: 'Below €10k: apply home country VAT for all EU B2C digital sales.',
} as const;

// ─── Rate Limits ─────────────────────────────────────────────

export const RATE_LIMITS: Record<PlanType, { requestsPerDay: number; requestsPerMonth: number }> = {
  free: { requestsPerDay: 100, requestsPerMonth: 0 },
  basic: { requestsPerDay: 0, requestsPerMonth: 1000 },
  pro: { requestsPerDay: 0, requestsPerMonth: 10000 },
  enterprise: { requestsPerDay: 0, requestsPerMonth: 100000 },
};

// ─── MIME types for response ────────────────────────────────

export const ACCEPT_HEADERS = ['application/json', 'text/html'] as const;

// ─── API Version ─────────────────────────────────────────────

export const API_VERSION = 'v1';
export const SCHEMA_VERSION = '1.0.0';
