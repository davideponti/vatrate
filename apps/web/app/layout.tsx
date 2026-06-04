import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: {
    default: 'VATRate — Open EU VAT Rates API',
    template: '%s | VATRate',
  },
  description:
    'Open-source EU VAT rates API. Get accurate VAT rates for all 27 EU countries, SaaS, e-books, online courses, and digital services. Free tier available.',
  keywords: [
    'VAT', 'EU VAT', 'VAT API', 'VAT rates', 'sales tax', 'European VAT',
    'OSS threshold', 'reverse charge', 'SaaS VAT', 'digital services VAT',
  ],
  openGraph: {
    title: 'VATRate — Open EU VAT Rates API',
    description: 'Know your VAT, ship globally. Open-source EU VAT rates for developers.',
    url: 'https://vatrate.eu',
    siteName: 'VATRate',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VATRate — Open EU VAT Rates API',
    description: 'Know your VAT, ship globally. Open-source EU VAT rates for developers.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
        margin: 0,
        padding: 0,
        backgroundColor: '#fafafa',
        color: '#1a1a2e',
      }}>
        {children}
      </body>
    </html>
  );
}
