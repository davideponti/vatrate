import type { OssThresholdRequest, OssThresholdResponse } from '@vatrate/shared';
import { COUNTRY_NAMES, OSS_THRESHOLD } from '@vatrate/shared';

const EU_COUNTRY_SALES_FIELDS = [
  'sales_fr', 'sales_de', 'sales_es', 'sales_it', 'sales_at',
  'sales_nl', 'sales_be', 'sales_pl', 'sales_se', 'sales_dk',
  'sales_fi', 'sales_ie', 'sales_pt', 'sales_el', 'sales_lu',
  'sales_hr', 'sales_bg', 'sales_ro', 'sales_hu', 'sales_cz',
  'sales_sk', 'sales_si', 'sales_lt', 'sales_lv', 'sales_ee',
  'sales_cy', 'sales_mt',
];

/**
 * Check if a company has exceeded the OSS threshold.
 */
export function checkOssThreshold(params: OssThresholdRequest): OssThresholdResponse {
  const homeCountry = params.home_country.toUpperCase();
  const homeName = COUNTRY_NAMES[homeCountry] || homeCountry;

  let totalSales = 0;
  const countrySales: { code: string; amount: number }[] = [];

  for (const field of EU_COUNTRY_SALES_FIELDS) {
    const value = params[field];
    if (typeof value === 'number' && value > 0) {
      const countryCode = field.replace('sales_', '').toUpperCase();
      totalSales += value;
      countrySales.push({ code: countryCode, amount: value });
    }
  }

  const threshold = OSS_THRESHOLD.amount;
  const exceeded = totalSales > threshold;
  const countriesExceeding = countrySales
    .filter((c) => c.amount > 0)
    .map((c) => c.code);

  const exceedNames = countriesExceeding
    .slice(0, 3)
    .map((c) => `${COUNTRY_NAMES[c] || c} (${countrySales.find((s) => s.code === c)?.amount}%)`)
    .join(', ');

  const ossNote = exceeded
    ? `Total €${totalSales.toLocaleString()} exceeds €${threshold.toLocaleString()} threshold. OSS registration required.`
    : `Total €${totalSales.toLocaleString()} is below €${threshold.toLocaleString()} threshold. Apply home country (${homeName}) VAT.`;

  const action = exceeded
    ? `Register for OSS in ${homeName} (your home country) to declare VAT for ${exceedNames}`
    : `No action required. Continue applying ${homeName} VAT on all EU B2C digital sales.`;

  return {
    home_country: homeCountry,
    total_b2c_digital_sales: totalSales,
    threshold,
    threshold_exceeded: exceeded,
    countries_exceeding: countriesExceeding,
    oss_required: exceeded,
    note: ossNote,
    action,
  };
}
