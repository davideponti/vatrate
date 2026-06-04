# Getting Started with VATRate

## Prerequisites

You only need `curl` or any HTTP client to use the API. No registration required for the free tier.

## Free Tier (No API Key)

The free tier allows up to **100 API requests per day** from the same IP address. No API key is needed.

```bash
curl "https://vatrate.eu/api/v1/rate?country=DE&type=saas&customer=consumer"
```

## Getting an API Key

For higher limits, subscribe to a paid plan:

1. Go to [vatrate.eu/pricing](https://vatrate.eu/pricing)
2. Choose a plan (Basic, Pro, or Enterprise)
3. Complete payment via Stripe
4. Your API key will be generated automatically
5. Use the key in your requests:

```bash
curl "https://vatrate.eu/api/v1/rate?country=FR&type=ebooks&customer=consumer" \
  -H "Authorization: Bearer vr_live_your_key_here"
```

## Integration Examples

### Node.js / TypeScript

```typescript
async function getVatRate(country: string, type: string, customer: string) {
  const res = await fetch(
    `https://vatrate.eu/api/v1/rate?country=${country}&type=${type}&customer=${customer}`
  );
  return res.json();
}

// Use in your checkout
const vat = await getVatRate('DE', 'saas', 'consumer');
console.log(`German VAT for SaaS: ${vat.rate}%`); // 19%
```

### Python

```python
import requests

def get_vat_rate(country, product_type, customer):
    url = f"https://vatrate.eu/api/v1/rate"
    params = {
        "country": country,
        "type": product_type,
        "customer": customer
    }
    response = requests.get(url, params=params)
    return response.json()

vat = get_vat_rate("DE", "saas", "consumer")
print(f"German VAT for SaaS: {vat['rate']}%")
```

### PHP

```php
<?php
$response = file_get_contents(
    'https://vatrate.eu/api/v1/rate?country=DE&type=saas&customer=consumer'
);
$data = json_decode($response, true);
echo "German VAT: " . $data['rate'] . "%";
```

### Shopify / Liquid

```liquid
{% assign vat_response = "https://vatrate.eu/api/v1/rate?country=DE&type=saas&customer=consumer" | url_fetch %}
{% assign vat = vat_response | parse_json %}
VAT Rate: {{ vat.rate }}%
```

## Error Handling

The API returns standard HTTP status codes:

| Status | Meaning |
|--------|---------|
| 200 | Success |
| 400 | Bad request (missing or invalid parameters) |
| 404 | Country not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

Error responses follow this format:

```json
{
  "error": "NOT_FOUND",
  "message": "Country 'XX' not found. Supported: AT, BE, BG, ...",
  "status": 404,
  "docs": "https://vatrate.eu/docs/api-reference"
}
```

## Rate Limits

| Plan | Limit |
|------|-------|
| Free | 100 requests/day per IP |
| Basic (€19/mo) | 1,000 requests/month |
| Pro (€49/mo) | 10,000 requests/month |
| Enterprise (€149/mo) | 100,000 requests/month |

## Embed Widget

Add a VAT rate display to your website with one line of HTML:

```html
<div id="vatrate-widget"></div>
<script src="https://vatrate.eu/widget.js"
  data-country="DE"
  data-type="saas"
  data-theme="light">
</script>
```

The widget supports `data-country`, `data-type`, and `data-theme` (light/dark) attributes.
