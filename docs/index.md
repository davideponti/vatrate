# VATRate

> 🇪🇺 Open EU VAT rates API — Know your VAT, ship globally.

VATRate is an open-source API that provides accurate VAT rates for all 27 EU countries. It's designed for SaaS companies, e-commerce platforms, and developers who need to calculate the correct VAT for digital services across Europe.

## Features

- **All 27 EU countries** — Standard, reduced, super-reduced, parking, and zero rates
- **Product-specific rates** — SaaS, e-books, online courses, digital services
- **B2B / B2C** — Reverse charge (0%) for B2B, standard rates for B2C
- **OSS threshold** — Check if you exceed the €10k EU threshold
- **Product classification** — AI-powered (keyword-based) product type detection
- **Rate alerts** — Upcoming VAT changes across EU countries
- **Open source** — All data is publicly available on GitHub
- **Free tier** — 100 API requests per day, no API key required

## Quick Start

```bash
# Get the VAT rate for SaaS in Germany (consumer)
curl "https://vatrate.eu/api/v1/rate?country=DE&type=saas&customer=consumer"

# Get all VAT rates for Italy
curl "https://vatrate.eu/api/v1/rates?country=IT"

# Check OSS threshold
curl "https://vatrate.eu/api/v1/oss-threshold?home_country=IT&sales_fr=8000&sales_de=5000"

# Classify a product
curl -X POST "https://vatrate.eu/api/v1/products" \
  -H "Content-Type: application/json" \
  -d '{"country": "IT", "description": "cloud accounting software"}'

# Get upcoming alerts
curl "https://vatrate.eu/api/v1/alerts"
```

## Data Source

All VAT data comes from the [European Commission VAT Rates Database](https://ec.europa.eu/taxation_customs/tedb/vatSearchForm.html). The data is updated weekly via GitHub Actions and community contributions.

## Architecture

```
vatrate/
├── apps/
│   ├── web/          # Next.js app (API + landing + dashboard)
│   └── data/         # VAT rates JSON + validation scripts
├── packages/
│   ├── api/          # Core VAT logic (rates, OSS, classification)
│   └── shared/       # Shared types and constants
├── docs/             # Documentation
├── tests/            # Test suite
└── package.json      # Monorepo root
```

## Open Source

This project is open source. The VAT rates JSON file is the single source of truth. Anyone can:

- Fork the repo and use the JSON directly
- Submit PRs to add missing countries or correct rates
- Self-host the API

**Commercial use**: You're free to use the open data. For the hosted API with higher limits and alerts, see [vatrate.eu](https://vatrate.eu).
