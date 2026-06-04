# Examples

## E-commerce Checkout

```typescript
// Calculate VAT for a customer based on their country
async function calculateCheckoutVat(customerCountry: string, cartItems: any[]) {
  // Determine if customer is business or consumer (e.g., by VAT number field)
  const customerType = cartItems.some(item => item.isBusiness) ? 'business' : 'consumer';

  // Get VAT rate
  const res = await fetch(
    `https://vatrate.eu/api/v1/rate?country=${customerCountry}&type=saas&customer=${customerType}`
  );
  const vatData = await res.json();

  // Apply to cart
  let subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  let vatAmount = subtotal * (vatData.rate / 100);
  let total = subtotal + vatAmount;

  return {
    subtotal,
    vatRate: vatData.rate,
    vatAmount,
    total,
    mechanism: vatData.mechanism,
    vatNote: vatData.note,
  };
}
```

## Subscription Platform

```typescript
// Determine VAT for a recurring subscription
async function getSubscriptionVat(companyCountry: string, customerCountry: string, customerType: string) {
  if (customerType === 'business') {
    // B2B: Reverse charge — 0% VAT
    const res = await fetch(
      `https://vatrate.eu/api/v1/rate?country=${customerCountry}&type=saas&customer=business`
    );
    return res.json();
  }

  if (customerCountry === companyCountry) {
    // B2C domestic: Apply home country VAT
    const res = await fetch(
      `https://vatrate.eu/api/v1/rate?country=${companyCountry}&type=saas&customer=consumer`
    );
    return res.json();
  }

  // B2C cross-border EU: Check OSS threshold
  const ossRes = await fetch(
    `https://vatrate.eu/api/v1/oss-threshold?home_country=${companyCountry}`
  );
  const ossData = await ossRes.json();

  if (!ossData.threshold_exceeded) {
    // Below threshold: Apply home country VAT
    const res = await fetch(
      `https://vatrate.eu/api/v1/rate?country=${companyCountry}&type=saas&customer=consumer`
    );
    return res.json();
  }

  // Above threshold: Apply customer's country VAT
  const res = await fetch(
    `https://vatrate.eu/api/v1/rate?country=${customerCountry}&type=saas&customer=consumer`
  );
  return res.json();
}
```

## React Component

```tsx
import { useState, useEffect } from 'react';

export function VatDisplay({ country, type }: { country: string; type: string }) {
  const [vatData, setVatData] = useState(null);

  useEffect(() => {
    fetch(`/api/v1/rate?country=${country}&type=${type}&customer=consumer`)
      .then(r => r.json())
      .then(setVatData);
  }, [country, type]);

  if (!vatData) return <div>Loading...</div>;

  return (
    <div>
      <p>Country: {vatData.country_name}</p>
      <p>VAT Rate: {vatData.rate}%</p>
      <p>Mechanism: {vatData.mechanism}</p>
      {vatData.oss_applicable && (
        <p>OSS threshold: €{vatData.oss_threshold.amount}</p>
      )}
    </div>
  );
}
```

## OSS Threshold Monitoring

```typescript
// Monthly check: Have we exceeded the OSS threshold?
async function monthlyOssCheck(homeCountry: string) {
  // Aggregate sales from your database
  const sales = {
    sales_de: 4500,
    sales_fr: 3200,
    sales_es: 2800,
    sales_it: 1500,
    sales_nl: 900,
  };

  const params = new URLSearchParams({ home_country: homeCountry });
  Object.entries(sales).forEach(([key, value]) => {
    params.append(key, String(value));
  });

  const res = await fetch(
    `https://vatrate.eu/api/v1/oss-threshold?${params.toString()}`
  );
  const data = await res.json();

  if (data.oss_required) {
    // Send alert to finance team
    console.warn(data.action);
    // Register for OSS or adjust pricing
  }

  return data;
}
```
