import vatRatesData from '../../../apps/data/vat-rates.json';
import type {
  VatRatesDatabase,
  CountryVatData,
  RateQueryParams,
  RateResponse,
  OssThresholdInfo,
} from '@vatrate/shared';
import type { VatMechanism } from '@vatrate/shared';
import {
  COUNTRY_NAMES,
  COUNTRY_CURRENCIES,
} from '@vatrate/shared';

const db = vatRatesData as VatRatesDatabase;

/**
 * Get country VAT data by country code.
 */
export function getCountryData(code: string): CountryVatData | null {
  return db.countries[code.toUpperCase()] ?? null;
}

/**
 * Get all countries.
 */
export function getAllCountries(): Record<string, CountryVatData> {
  return db.countries;
}

/**
 * Get database metadata.
 */
export function getDatabaseMeta() {
  return {
    schema_version: db.schema_version,
    last_updated: db.last_updated,
    source: db.source,
  };
}

/** Shape of a product entry in the JSON data */
interface ProductEntry {
  classification?: string;
  b2b?: { rate: number; mechanism: VatMechanism; condition?: string };
  b2c?: { rate: number; mechanism: VatMechanism; threshold_oss?: OssThresholdInfo };
  note?: string;
}

/**
 * Resolve the appropriate rate for a given query.
 */
export function resolveRate(params: RateQueryParams): RateResponse | { error: string; message: string; status: number } {
  const countryCode = params.country.toUpperCase();
  const countryData = getCountryData(countryCode);

  if (!countryData) {
    return {
      error: 'NOT_FOUND',
      message: `Country '${params.country}' not found. Supported: ${Object.keys(db.countries).join(', ')}`,
      status: 404,
    };
  }

  const productType = params.type || 'digital_services';
  const customerType = params.customer || 'consumer';

  // Find the right product entry
  const productEntry = countryData[productType as keyof CountryVatData] as ProductEntry | string | undefined;

  if (!productEntry || typeof productEntry === 'string') {
    // Fallback to digital_services for unknown product types
    const fallback = countryData.digital_services as ProductEntry;
    return buildRateResponse(countryData, productType, customerType, fallback, params.vat_number);
  }

  return buildRateResponse(countryData, productType, customerType, productEntry, params.vat_number);
}

function buildRateResponse(
  countryData: CountryVatData,
  productType: string,
  customerType: string,
  productEntry: ProductEntry,
  vatNumber?: string,
): RateResponse {
  const isBusiness = customerType === 'business';
  const rateInfo = isBusiness ? productEntry.b2b : productEntry.b2c;

  if (!rateInfo) {
    return {
      country: countryData.code,
      country_name: countryData.name,
      product_type: productType,
      customer_type: customerType,
      rate: countryData.vat.standard,
      mechanism: 'standard' as VatMechanism,
      currency: countryData.currency,
      note: `No specific ${customerType} rate for ${productType}. Defaulting to standard rate.`,
      valid_from: countryData.valid_from,
      last_updated: db.last_updated,
    };
  }

  const response: RateResponse = {
    country: countryData.code,
    country_name: countryData.name,
    product_type: productType,
    customer_type: customerType,
    rate: rateInfo.rate,
    mechanism: rateInfo.mechanism,
    currency: countryData.currency,
    note: productEntry.note || `Rate: ${rateInfo.rate}% (${rateInfo.mechanism})`,
    valid_from: countryData.valid_from,
    last_updated: db.last_updated,
  };

  // VAT number validation (mock)
  if (vatNumber && isBusiness) {
    response.vat_number_valid = vatNumber.length >= 8 && vatNumber.startsWith(countryData.code);
    if (!response.vat_number_valid) {
      response.note += ' VAT number appears invalid.';
    }
  }

  // OSS info for B2C — check the product entry first, then fall back to digital_services
  if (!isBusiness) {
    const b2cInfo = rateInfo as { rate: number; mechanism: VatMechanism; threshold_oss?: OssThresholdInfo };
    const digitalServicesB2C = countryData.digital_services?.b2c;
    const ossInfo = b2cInfo.threshold_oss || digitalServicesB2C?.threshold_oss;
    if (ossInfo) {
      response.oss_applicable = true;
      response.oss_threshold = {
        amount: ossInfo.amount,
        currency: ossInfo.currency || 'EUR',
        exceeded: false,
        note: ossInfo.note || `If total EU B2C digital sales < €${ossInfo.amount}/year, apply home country VAT`,
      };
    }
  }

  return response;
}

/**
 * Get all rates for a country with B2B/B2C breakdown by product type.
 */
export function getCountryRates(countryCode: string) {
  const code = countryCode.toUpperCase();
  const countryData = getCountryData(code);

  if (!countryData) {
    return null;
  }

  const productTypes = ['saas', 'ebooks', 'online_courses', 'digital_services'] as const;
  const ratesByType: Record<string, number> = {};

  for (const type of productTypes) {
    const entry = countryData[type as keyof CountryVatData] as ProductEntry | string | undefined;
    if (entry && typeof entry !== 'string' && entry.b2b && entry.b2c) {
      ratesByType[`${type}_b2b`] = entry.b2b.rate;
      ratesByType[`${type}_b2c`] = entry.b2c.rate;
    }
  }

  return {
    country: countryData.code,
    country_name: countryData.name,
    vat: countryData.vat,
    rates_by_type: ratesByType,
    oss_enabled: true,
    oss_threshold: {
      amount: 10000,
      currency: 'EUR',
    },
  };
}
