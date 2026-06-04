# API Reference

Base URL: `https://vatrate.eu`

## GET /api/v1/rate

Get the VAT rate for a specific transaction.

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `country` | Yes | 2-letter country code (e.g., DE, FR, IT) |
| `type` | No | Product type: `saas`, `ebooks`, `online_courses`, `digital_services` |
| `customer` | No | `consumer` (default) or `business` |
| `vat_number` | No | VAT number for B2B validation |

### Example

```bash
curl "https://vatrate.eu/api/v1/rate?country=DE&type=saas&customer=consumer"
```

### Response

```json
{
  "country": "DE",
  "country_name": "Germany",
  "product_type": "saas",
  "customer_type": "consumer",
  "rate": 19,
  "mechanism": "standard",
  "currency": "EUR",
  "note": "Umsatzsteuer 19%",
  "oss_applicable": true,
  "oss_threshold": {
    "amount": 10000,
    "currency": "EUR",
    "exceeded": false,
    "note": "If total EU B2C digital sales < €10k/year, apply home country VAT"
  },
  "valid_from": "2024-01-01",
  "last_updated": "2026-04-06"
}
```

## GET /api/v1/rates

Get all VAT rates and rate types for a country.

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `country` | Yes | 2-letter country code |

### Example

```bash
curl "https://vatrate.eu/api/v1/rates?country=IT"
```

### Response

```json
{
  "country": "IT",
  "country_name": "Italy",
  "vat": {
    "standard": 22,
    "reduced": 10,
    "super_reduced": 4,
    "parking": null,
    "zero": 0
  },
  "rates_by_type": {
    "saas_b2b": 0,
    "saas_b2c": 22,
    "ebooks_b2b": 0,
    "ebooks_b2c": 4,
    "online_courses_b2b": 0,
    "online_courses_b2c": 22
  },
  "oss_enabled": true,
  "oss_threshold": {
    "amount": 10000,
    "currency": "EUR"
  }
}
```

## POST /api/v1/products

Classify a product description to determine applicable VAT.

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `country` | Yes | 2-letter country code |
| `description` | Yes | Product description |

### Example

```bash
curl -X POST "https://vatrate.eu/api/v1/products" \
  -H "Content-Type: application/json" \
  -d '{"country": "IT", "description": "abbonamento mensile software contabilità cloud"}'
```

### Response

```json
{
  "product_type": "saas",
  "classification": "digital_service",
  "confidence": 0.95,
  "b2b": {
    "rate": 0,
    "mechanism": "reverse_charge"
  },
  "b2c": {
    "rate": 22,
    "mechanism": "standard"
  },
  "note": "cloud accounting software classified as digital_service (saas)"
}
```

## GET /api/v1/oss-threshold

Check if your total EU B2C digital sales exceed the €10k OSS threshold.

### Parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `home_country` | Yes | Your home country (2-letter code) |
| `sales_XX` | No | Sales amount per country (e.g., sales_fr=8000) |

### Example

```bash
curl "https://vatrate.eu/api/v1/oss-threshold?home_country=IT&sales_fr=8000&sales_de=5000&sales_es=3000"
```

### Response

```json
{
  "home_country": "IT",
  "total_b2c_digital_sales": 16000,
  "threshold": 10000,
  "threshold_exceeded": true,
  "countries_exceeding": ["FR", "DE", "ES"],
  "oss_required": true,
  "note": "Total €16,000 exceeds €10,000 threshold. OSS registration required.",
  "action": "Register for OSS in Italy (your home country) to declare VAT for FR, DE, ES"
}
```

## GET /api/v1/alerts

Get upcoming VAT rate changes across EU countries.

### Example

```bash
curl "https://vatrate.eu/api/v1/alerts"
```

### Response

```json
{
  "alerts": [
    {
      "country": "EE",
      "country_name": "Estonia",
      "change": {
        "from": 20,
        "to": 22,
        "effective_date": "2027-01-01",
        "type": "standard_rate"
      },
      "impact": "Your SaaS sold in Estonia: B2C rate changes from 20% to 22%"
    }
  ],
  "last_checked": "2026-04-06"
}
```

## Supported Countries

AT, BE, BG, CY, CZ, DE, DK, EE, EL, ES, FI, FR, HR, HU, IE, IT, LT, LU, LV, MT, NL, PL, PT, RO, SE, SI, SK
