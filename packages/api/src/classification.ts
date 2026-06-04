import type { ProductType, ProductClassificationResponse } from '@vatrate/shared';

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

/**
 * Classify a product description into a VAT product type.
 */
export function classifyProduct(
  description: string,
  countryRateData?: any,
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
  const countryCode = countryRateData?.code || '';
  const productEntry = countryRateData?.[bestMatch.type] || countryRateData?.digital_services;

  const b2b = {
    rate: productEntry?.b2b?.rate ?? 0,
    mechanism: productEntry?.b2b?.mechanism ?? 'reverse_charge' as any,
  };

  const b2c = {
    rate: productEntry?.b2c?.rate ?? 20,
    mechanism: productEntry?.b2c?.mechanism ?? 'standard' as any,
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
