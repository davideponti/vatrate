<div align="center">
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
  </p>
</div>

## ✨ Features

- **All 27 EU countries** — Standard, reduced, super-reduced, parking, zero rates
- **Product-specific** — SaaS, e-books, online courses, digital services
- **B2B / B2C** — Reverse charge (0%) for B2B, standard rates for B2C
- **OSS threshold** — Check if you exceed the €10k EU threshold
- **Product classification** — AI-powered (keyword-based) product type detection
- **Rate alerts** — Upcoming VAT changes across EU countries
- **Free tier** — 100 API requests/month, no API key required
- **Managed dashboard** — API key management, usage logs, team management

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
| Free | €0 | 100/month | Hobby projects |
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

- **Frontend**: Next.js 14 (App Router), TypeScript
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Auth**: Custom JWT + email verification codes
- **Payments**: Stripe
- **Email**: Resend (transactional emails)
- **Data**: Scraped from EU Commission VAT Database

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
2. Create a feature branch
3. Commit your changes
4. Push to your fork
5. Open a Pull Request

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
