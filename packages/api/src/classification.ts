import type { ProductType, VatMechanism, CountryVatData, ProductClassificationResponse } from '@vatrate/shared';

/**
 * Simple keyword-based product classification.
 * In V2, this can be replaced with an LLM.
 */
const KEYWORDS: Record<string, { type: ProductType; classification: string; confidence: number }> = {
  // SaaS
  saas: { type: 'saas', classification: 'digital_service', confidence: 0.98 },
  software: { type: 'software', classification: 'digital_service', confidence: 0.95 },
  cloud: { type: 'saas', classification: 'digital_service', confidence: 0.95 },
  subscription: { type: 'saas', classification: 'digital_service', confidence: 0.90 },
  app: { type: 'software', classification: 'digital_service', confidence: 0.80 },
  // E-books
  ebook: { type: 'ebooks', classification: 'digital_service', confidence: 0.95 },
  book: { type: 'ebooks', classification: 'digital_service', confidence: 0.70 },
  pdf: { type: 'ebooks', classification: 'digital_service', confidence: 0.75 },
  publication: { type: 'ebooks', classification: 'digital_service', confidence: 0.80 },
  // Online courses
  course: { type: 'online_courses', classification: 'digital_service', confidence: 0.95 },
  training: { type: 'online_courses', classification: 'digital_service', confidence: 0.90 },
  webinar: { type: 'online_courses', classification: 'digital_service', confidence: 0.95 },
  tutorial: { type: 'online_courses', classification: 'digital_service', confidence: 0.85 },
  // Telecom
  telecom: { type: 'telecom', classification: 'telecom', confidence: 0.95 },
  phone: { type: 'telecom', classification: 'telecom', confidence: 0.85 },
  // Broadcasting
  streaming: { type: 'broadcasting', classification: 'broadcasting', confidence: 0.90 },
  tv: { type: 'broadcasting', classification: 'broadcasting', confidence: 0.85 },
  // Generic digital
  digital: { type: 'digital_services', classification: 'digital_service', confidence: 0.70 },
  download: { type: 'digital_services', classification: 'digital_service', confidence: 0.80 },
};

/** Shape of a product entry for rate lookups during classification */
interface RateEntry {
  rate: number;
  mechanism: VatMechanism;
  condition?: string;
  threshold_oss?: { amount: number; currency: string; note?: string };
}

/**
 * Classify a product description into a VAT product type.
 */
export function classifyProduct(
  description: string,
  countryRateData?: CountryVatData,
): ProductClassificationResponse {
  const lower = description.toLowerCase();
  let bestMatch = {
    type: 'digital_services' as ProductType,
    classification: 'digital_service',
    confidence: 0.5,
  };

  for (const [keyword, mapping] of Object.entries(KEYWORDS)) {
    if (lower.includes(keyword)) {
      if (mapping.confidence > bestMatch.confidence) {
        bestMatch = mapping;
      }
    }
  }

  // If we have country rate data, include actual rates
  const productEntry = (countryRateData as unknown as Record<string, unknown>)?.[bestMatch.type] as
    | { b2b?: RateEntry; b2c?: RateEntry }
    | undefined;
  const fallbackEntry = countryRateData?.digital_services as { b2b?: RateEntry; b2c?: RateEntry } | undefined;

  const entry = productEntry || fallbackEntry;

  const b2b = {
    rate: entry?.b2b?.rate ?? 0,
    mechanism: entry?.b2b?.mechanism ?? 'reverse_charge' as VatMechanism,
  };

  const b2c = {
    rate: entry?.b2c?.rate ?? 20,
    mechanism: entry?.b2c?.mechanism ?? 'standard' as VatMechanism,
  };

  return {
    product_type: bestMatch.type,
    classification: bestMatch.classification,
    confidence: bestMatch.confidence,
    b2b,
    b2c,
    note: `${description} classified as ${bestMatch.classification} (${bestMatch.type})`,
  };
}
