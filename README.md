

## ✨ Why VATRate?

Building across the EU means dealing with **27 different VAT systems**, each with multiple rates (standard, reduced, super-reduced, parking, zero), special rules for digital services, OSS thresholds, and B2B reverse charge.

VATRate gives you one clean API that handles all of it — so you can focus on your product, not on tax compliance.

| Without VATRate | With VATRate |
|---|---|
| Maintain a spreadsheet of 27 countries | `GET /api/v1/rate?country=DE&type=saas&customer=consumer` |
| Track rate changes manually | Automatic updates + alerts |
| B2B reverse charge logic per country | Handled automatically |
| OSS threshold calculations | Built-in checker |
| Product classification research | AI-powered keyword detection |

---

## 🚀 Quick Start

### 1. Try it — no API key needed

```bash
curl "https://vatrate.eu/api/v1/rate?country=FR&type=ebooks&customer=consumer"
```

### 2. Sign up for your free API key

```bash
# https://vatrate.eu/signup → 100 requests/month free
```

### 3. Use it in your code

```javascript
// JavaScript / TypeScript
const response = await fetch(
  'https://vatrate.eu/api/v1/rate?country=DE&type=saas&customer=business&vat_number=DE123456789',
  { headers: { Authorization: 'Bearer vr_live_YOUR_KEY' } }
);
const data = await response.json();
// { "rate": 0, "mechanism": "reverse_charge", ... }
```

```python
# Python
import requests
vat = requests.get('https://vatrate.eu/api/v1/rate',
  params={'country': 'DE', 'type': 'saas', 'customer': 'consumer'}).json()
print(f"VAT rate: {vat['rate']}%")  # 19%
```

### 4. Embed in your website

```html
<div id="vatrate-widget"></div>
<script src="https://vatrate.eu/widget.js"
  data-country="DE" data-type="saas" data-theme="light">
</script>
```

---

## 📚 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/rate` | Get VAT rate for a specific transaction |
| `GET` | `/api/v1/rates` | Get all VAT rates for a country |
| `POST` | `/api/v1/products` | Classify a product by description |
| `GET` | `/api/v1/oss-threshold` | Check if you exceed the €10k EU threshold |
| `GET` | `/api/v1/alerts` | Get upcoming VAT rate changes |
| `GET` | `/api/v1/keys` | List your API keys |
| `POST` | `/api/v1/keys` | Generate a new API key |
| `DELETE` | `/api/v1/keys/:id` | Revoke an API key |
| `GET` | `/api/v1/logs` | View your API usage logs |
| `GET` | `/api/v1/user/profile` | Get user profile & stats |

[Full API Reference →](https://vatrate.eu/docs)

---

## 💎 Pricing

| Plan | Price | Requests/mo | Best for |
|------|-------|:-----------:|----------|
| **Free** 🆓 | **€0** | 100 | Hobby projects, evaluation |
| **Basic** | **€19/mo** | 3,000 | Startups |
| **Pro** | **€49/mo** | 10,000 | Growing businesses |
| **Enterprise** | **€149/mo** | 100,000 | Scale & compliance |
| **Widget** | **€9/mo** | 50,000 | Embedded widget usage |

[See full pricing →](https://vatrate.eu/pricing)

---

## 🗺️ Features

### 🇪🇺 All 27 EU Countries
Complete VAT data for every member state — standard, reduced, super-reduced, parking, and zero rates.

### 🔄 Automatic Reverse Charge (B2B)
Pass a valid VAT number and get 0% rate with `mechanism: "reverse_charge"`. Fully EU-compliant.

### 📊 OSS Threshold Checker
Know instantly when your cross-border sales exceed €10k and OSS registration becomes mandatory.

### 🤖 AI Product Classification
Describe any product and get the correct VAT classification with confidence scores. E.g., *"cloud accounting software"* → `saas`.

### 🔔 Rate Change Alerts
Pro and Enterprise plans get notified of upcoming VAT rate changes before they take effect.

### 📦 Open Source Data
All VAT rates are publicly available JSON on GitHub. Fork it, use it, contribute corrections.

### ⚡ Edge API
Built on Next.js + Vercel Edge. Sub-100ms response times from anywhere in the world.

### 🔒 Security-First
bcrypt, CSRF protection, rate limiting, CSP, HSTS, and a full security audit. [See SECURITY.md →](SECURITY.md)

---

## 🏗️ Architecture

```
vatrate/
├── apps/
│   ├── web/                  # Next.js 15 App Router (API + landing + dashboard)
│   │   ├── app/
│   │   │   ├── api/v1/       # Versioned REST API (10 endpoints)
│   │   │   └── webhook/      # Stripe webhook handler
│   │   ├── lib/              # Auth, sessions, email, rate limiting, CSRF
│   │   └── components/       # Reusable UI (pricing cards, rate card, widget)
│   └── data/                 # VAT rates JSON + scrape/validate scripts
├── packages/
│   ├── api/                  # Core VAT logic (rate resolution, OSS, classification)
│   └── shared/               # TypeScript types & constants
├── supabase/
│   └── migrations/           # Database schema (6 migrations)
├── docs/                     # Documentation site content
├── tests/                    # Test suite (vitest, 81+ tests)
├── SECURITY.md               # Security architecture docs
├── security-audit.md         # Full security audit report
├── audit-completo.md         # Full project audit (8 categories)
└── package.json              # Turborepo monorepo root
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), React 18, TypeScript |
| **Backend** | Next.js API Routes + Server-side logic (`@vatrate/api`) |
| **Database** | Supabase (PostgreSQL) with Row Level Security |
| **Auth** | Custom bcrypt + SHA-256 sessions + email verification |
| **Payments** | Stripe (checkout, customer portal, webhooks) |
| **Email** | Resend (transactional emails — verify, reset) |
| **Rate Limiting** | In-memory (dev) / Upstash Redis-ready (production) |
| **Hosting** | Vercel (fra1 — Frankfurt, GDPR-compliant) |
| **Monorepo** | Turborepo + npm workspaces |

### Database Schema

| Table | Purpose |
|-------|---------|
| `users` | Accounts with plan, email verification, lockout, rate limits |
| `api_keys` | SHA-256 hashed API keys with usage tracking |
| `sessions` | Session tokens for web dashboard |
| `password_reset_tokens` | Expiring SHA-256 hashed reset tokens |
| `email_verification_codes` | 6-digit codes with 10-minute expiry |
| `usage_logs` | Rate limiting & billing counter |
| `api_logs` | Detailed request log for dashboard |

---

## 🔐 Security

VATRate follows **defense in depth** — every layer has its own security controls.

**HTTP Layer:** CSP, HSTS (1 year, preload ready), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `security.txt`

**Auth Layer:**
- bcrypt (12 rounds) for all passwords
- SHA-256 for API keys, session tokens, reset tokens, verification codes
- CSRF protection via Double Submit Cookie with `crypto.timingSafeEqual`
- Account lockout after 5 failed attempts (exponential backoff)
- User enumeration prevention on all auth endpoints

**Data Layer:**
- Supabase RLS policies on all tables (anon role)
- Input sanitization (HTML tag stripping + Zod validation)
- GDPR-compliant: IP hashing, data minimization, EU server location
- Stripe webhook signature verification (secret key)

[Full security documentation →](SECURITY.md)
[Security audit report →](security-audit.md)

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npx vitest run tests/api.test.ts        # Rate lookup & validation
npx vitest run tests/classification.test.ts  # Product classification
npx vitest run tests/oss.test.ts         # OSS threshold checker
npx vitest run tests/alerts.test.ts      # Rate change alerts
```

**Current coverage (81+ tests):**

| Suite | Tests | Coverage |
|-------|:-----:|:--------:|
| Rate lookup (`resolveRate`) | 10 | ✅ Core logic |
| Country rates (`getCountryRates`) | 2 | ✅ Base validation |
| All 27 EU countries parametric | 54 | ✅ Full matrix |
| Product classification | 5 | ✅ Keyword matching |
| OSS threshold | 7 | ✅ Edge cases |
| Alerts | 3 | ✅ Data integrity |

> **Note:** Auth endpoints and Stripe integration tests are planned but not yet implemented. [See audit →](audit-completo.md)

---

## 🗄️ Data Sources

VAT rates are sourced from the [European Commission VAT Rates Database](https://ec.europa.eu/taxation_customs/tedb/vatSearchForm.html) and maintained via:

1. **Automated scraping** — `apps/data/scripts/scrape-eu.mjs` fetches from EU sources
2. **Manual validation** — `apps/data/scripts/validate.mjs` checks JSON Schema compliance
3. **Community contributions** — Open to PRs for corrections and additions

```bash
# Validate VAT rates data
npm run validate
```

---

## 🤝 Contributing

Contributions are welcome! Whether it's adding missing VAT rates, fixing bugs, or improving documentation:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to your fork (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please make sure your code passes:
- `npm run lint` — TypeScript linting
- `npm run validate` — VAT data validation
- `npm test` — Test suite

---

## 📄 License

This project is **open source** under the MIT License. You're free to use, modify, and distribute the code.

The VAT rates data is sourced from the [European Commission VAT Rates Database](https://ec.europa.eu/taxation_customs/tedb/vatSearchForm.html).

---

## 📬 Contact & Support

| Channel | Where |
|---------|-------|
| **Website** | [vatrate.eu](https://vatrate.eu) |
| **Email** | [info@vatrate.eu](mailto:info@vatrate.eu) |
| **Security** | [security@vatrate.eu](mailto:security@vatrate.eu) — [see policy](SECURITY.md) |
| **Issues** | [github.com/davideponti/vatrate/issues](https://github.com/davideponti/vatrate/issues) |
| **Documentation** | [vatrate.eu/docs](https://vatrate.eu/docs) |

---

## 🇪🇺 What is VATRate?

VATRate is an open-source API that gives developers instant access to accurate EU VAT rates. Instead of manually maintaining a spreadsheet of 27 countries × multiple product types × B2B/B2C, you get one API call.

Built for startups scaling across Europe, by developers who've been through the VAT compliance nightmare ourselves. Free to start, open data, transparent pricing.

---

<div align="center">
  Made with ❤️ for developers across Europe.
  <br />
  🇪🇺 🇦🇹 🇧🇪 🇧🇬 🇭🇷 🇨🇾 🇨🇿 🇩🇰 🇪🇪 🇫🇮 🇫🇷 🇩🇪 🇬🇷 🇭🇺 🇮🇪 🇮🇹 🇱🇻 🇱🇹 🇱🇺 🇲🇹 🇳🇱 🇵🇱 🇵🇹 🇷🇴 🇸🇰 🇸🇮 🇪🇸 🇸🇪
</div>
