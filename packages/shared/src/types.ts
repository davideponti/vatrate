import type {
  CountryCode,
  CustomerType,
  ProductType,
  VatMechanism,
} from './constants';

// ─── VAT Rate Structure ─────────────────────────────────────

export interface VatRates {
  standard: number;
  reduced: number;
  super_reduced: number | null;
  parking: number | null;
  zero: number;
}

export interface B2BInfo {
  rate: number;
  mechanism: VatMechanism;
  condition?: string;
}

export interface B2CInfo {
  rate: number;
  mechanism: VatMechanism;
  threshold_oss?: OssThresholdInfo;
}

export interface OssThresholdInfo {
  amount: number;
  currency: string;
  note?: string;
}

export interface ProductVatInfo {
  classification: string;
  b2b: B2BInfo;
  b2c: B2CInfo;
  note?: string;
}

export interface CountryVatData {
  name: string;
  code: CountryCode;
  currency: string;
  vat: VatRates;
  digital_services: ProductVatInfo;
  saas: ProductVatInfo;
  ebooks?: ProductVatInfo;
  online_courses?: ProductVatInfo;
  notes?: string;
  valid_from: string;
  last_change: string;
}

export interface VatRatesDatabase {
  schema_version: string;
  last_updated: string;
  source: string;
  countries: Record<string, CountryVatData>;
}

// ─── API Request / Response ─────────────────────────────────

export interface RateQueryParams {
  country: string;
  type?: ProductType;
  customer?: CustomerType;
  vat_number?: string;
}

export interface RateResponse {
  country: string;
  country_name: string;
  product_type: string;
  customer_type: string;
  rate: number;
  mechanism: VatMechanism;
  currency: string;
  note: string;
  vat_number_valid?: boolean;
  oss_applicable?: boolean;
  oss_threshold?: {
    amount: number;
    currency: string;
    exceeded: boolean;
    note: string;
  };
  valid_from: string;
  last_updated: string;
}

export interface RatesResponse {
  country: string;
  country_name: string;
  vat: VatRates;
  rates_by_type: Record<string, number>;
  oss_enabled: boolean;
  oss_threshold: {
    amount: number;
    currency: string;
  };
}

export interface ProductClassificationRequest {
  country: string;
  description: string;
}

export interface ProductClassificationResponse {
  product_type: ProductType;
  classification: string;
  confidence: number;
  b2b: B2BInfo;
  b2c: B2CInfo;
  note: string;
}

export interface OssThresholdRequest {
  home_country: string;
  sales_fr?: number;
  sales_de?: number;
  sales_es?: number;
  sales_it?: number;
  sales_at?: number;
  sales_nl?: number;
  sales_be?: number;
  sales_pl?: number;
  sales_se?: number;
  [key: string]: string | number | undefined;
}

export interface OssThresholdResponse {
  home_country: string;
  total_b2c_digital_sales: number;
  threshold: number;
  threshold_exceeded: boolean;
  countries_exceeding: string[];
  oss_required: boolean;
  note: string;
  action: string;
}

export interface VatAlert {
  country: string;
  country_name: string;
  change: {
    from: number;
    to: number;
    effective_date: string;
    type: string;
  };
  impact: string;
}

export interface AlertsResponse {
  alerts: VatAlert[];
  last_checked: string;
}

// ─── Error Response ─────────────────────────────────────────

export interface ApiError {
  error: string;
  message: string;
  status: number;
  docs?: string;
}
