<div align="center">
  <img src="https://vatrate.eu/og.png" alt="VATRate" width="800" height="auto" style="max-width: 100%; border-radius: 12px" />

  <h1 align="center">VATRate 🇪🇺</h1>
  <p align="center">
    <strong>Open-source EU VAT rates API for developers</strong>
    <br />
    Accurate VAT rates for all 27 EU countries. SaaS, e-books, digital services & more.
    <br />
    <a href="https://vatrate.eu"><strong>vatrate.eu »</strong></a>
    <br />
    <br />
    <a href="https://vatrate.eu/docs">API Reference</a>
    ·
    <a href="https://vatrate.eu/pricing">Pricing</a>
    ·
    <a href="https://github.com/davideponti/vatrate/issues">Report Bug</a>
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License" />
    <img src="https://img.shields.io/badge/PRs-welcome-brightgreen" alt="PRs Welcome" />
    <img src="https://img.shields.io/badge/EU%20Countries-27-1e40af" alt="EU Countries" />
    <img src="https://img.shields.io/badge/uptime-99.9%25-brightgreen" alt="Uptime" />
  </p>
</div>

<br />

## ✨ Features

- **All 27 EU countries** — Standard, reduced, super-reduced, parking, zero rates
- **Product-specific** — SaaS, e-books, online courses, digital services
- **B2B / B2C** — Reverse charge (0%) for B2B, standard rates for B2C
- **OSS threshold** — Check if you exceed the €10k EU threshold
- **Product classification** — AI-powered (keyword-based) product type detection
- **Rate alerts** — Upcoming VAT changes across EU countries
- **Free tier** — 100 API requests/month, no API key required
- **Open source** — All data is publicly available on GitHub
- **Managed dashboard** — API key management, usage logs, team management
- **Webhook support** — Real-time VAT change notifications

## 🚀 Quick Start

```bash
# Get the VAT rate for SaaS in Germany (consumer)
curl "https://vatrate.eu/api/v1/rate?country=DE&type=saas&customer=consumer"

# Response:
# { "country": "DE", "rate": 19, "mechanism": "standard", ... }

# Check OSS threshold
curl "https://vatrate.eu/api/v1/oss-threshold?home_country=IT&sales_fr=8000&sales_de=5000"

# Classify a product
curl -X POST "https://vatrate.eu/api/v1/products" \
  -H "Content-Type: application/json" \
  -d '{"country": "IT", "description": "cloud accounting software"}'
```

## 🧪 Examples

<details>
<summary><strong>Node.js / TypeScript</strong></summary>

```typescript
async function getVatRate(country: string, type: string, customer: string) {
  const res = await fetch(
    `https://vatrate.eu/api/v1/rate?country=${country}&type=${type}&customer=${customer}`
  );
  return res.json();
}

const vat = await getVatRate('DE', 'saas', 'consumer');
console.log(`German VAT for SaaS: ${vat.rate}%`); // 19%
```
</details>

<details>
<summary><strong>Python</strong></summary>

```python
import requests

def get_vat_rate(country, product_type, customer):
    url = "https://vatrate.eu/api/v1/rate"
    params = {"country": country, "type": product_type, "customer": customer}
    return requests.get(url, params=params).json()

vat = get_vat_rate("DE", "saas", "consumer")
print(f"German VAT for SaaS: {vat['rate']}%")
```
</details>

<details>
<summary><strong>PHP</strong></summary>

```php
<?php
$response = file_get_contents(
    'https://vatrate.eu/api/v1/rate?country=DE&type=saas&customer=consumer'
);
$data = json_decode($response, true);
echo "German VAT: " . $data['rate'] . "%";
```
</details>

## 📚 Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/rate` | Get VAT rate for a specific transaction |
| `GET /api/v1/rates` | Get all VAT rates for a country |
| `POST /api/v1/products` | Classify a product description |
| `GET /api/v1/oss-threshold` | Check OSS threshold status |
| `GET /api/v1/alerts` | Get upcoming VAT rate changes |

[Full API Reference →](https://vatrate.eu/docs)

## 💎 Pricing

| Plan | Price | Requests | Best for |
|------|-------|----------|----------|
| Open Source | €0 | 100/month | Hobby projects |
| API Basic | €19/mo | 3,000/month | Startups |
| API Pro | €49/mo | 10,000/month | Growing businesses |
| Enterprise | €149/mo | 100,000/month | Scale & compliance |

[See full pricing →](https://vatrate.eu/pricing)

## 🏗️ Architecture

```
vatrate/
├── apps/
│   ├── web/              # Next.js app (API + landing + dashboard)
│   │   ├── app/          # Pages & API routes
│   │   ├── lib/          # Auth, email, supabase clients
│   │   └── components/   # Reusable UI components
│   └── data/             # VAT rates JSON + scrape/validate scripts
├── packages/
│   ├── api/              # Core VAT logic (rates, OSS, classification)
│   └── shared/           # Shared types and constants
├── supabase/
│   └── migrations/       # Database schema migrations
├── docs/                 # Documentation
└── tests/                # Test suite (vitest)
```

### Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, CSS-in-JS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Auth**: Custom JWT + email verification codes
- **Payments**: Stripe
- **Email**: Resend (transactional emails)
- **Data**: Scraped from EU Commission VAT Database
- **CI/CD**: GitHub Actions

## 🗄️ Database Schema

The Supabase database includes:

- **users** — Accounts with email verification, plan, request limits
- **api_keys** — Hashed API keys with names, environments, usage tracking
- **sessions** — JWT session management
- **password_resets** — Secure password reset tokens
- **email_verifications** — 6-digit verification codes
- **api_logs** — Request logs per API key (method, path, status, timing)

## 🤝 Contributing

Contributions are welcome! Whether it's adding missing VAT rates, fixing bugs, or improving the documentation:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Commit your changes: `git commit -am 'Add cool feature'`
4. Push: `git push origin feat/my-feature`
5. Open a Pull Request

### Data Contributions

VAT rates are stored in `apps/data/vat-rates.json`. To add or correct rates:

1. Edit the JSON file following the schema
2. Run `npm run validate` to check the data
3. Submit a PR with your changes

### Local Development

```bash
# Clone the repo
git clone https://github.com/davideponti/vatrate.git
cd vatrate

# Install dependencies
npm install

# Set up environment variables
cp apps/web/.env.local.example apps/web/.env.local

# Run the development server
npm run dev
```

## 📄 License

This project is open source under the MIT License. You're free to use, modify, and distribute the code.

The VAT rates data is sourced from the [European Commission VAT Rates Database](https://ec.europa.eu/taxation_customs/tedb/vatSearchForm.html).

## 📬 Contact

- Website: [vatrate.eu](https://vatrate.eu)
- Email: [hello@vatrate.eu](mailto:hello@vatrate.eu)
- GitHub Issues: [github.com/davideponti/vatrate/issues](https://github.com/davideponti/vatrate/issues)

---

<div align="center">
  Made with ❤️ for developers across Europe.
  <br />
  🇪🇺 🇦🇹 🇧🇪 🇧🇬 🇭🇷 🇨🇾 🇨🇿 🇩🇰 🇪🇪 🇫🇮 🇫🇷 🇩🇪 🇬🇷 🇭🇺 🇮🇪 🇮🇹 🇱🇻 🇱🇹 🇱🇺 🇲🇹 🇳🇱 🇵🇱 🇵🇹 🇷🇴 🇸🇰 🇸🇮 🇪🇸 🇸🇪
</div>
