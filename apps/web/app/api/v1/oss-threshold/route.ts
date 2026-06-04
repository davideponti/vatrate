import { NextRequest, NextResponse } from 'next/server';
import { checkOssThreshold } from '@vatrate/api';
import { z } from 'zod';

const querySchema = z.object({
  home_country: z.string().min(2).max(2),
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const homeCountry = searchParams.get('home_country');

  if (!homeCountry) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Required: home_country (2-letter code, e.g., ?home_country=IT)',
        status: 400,
        docs: 'https://vatrate.eu/docs/api-reference',
      },
      { status: 400 },
    );
  }

  // Build params from all sales_* query params
  const params: Record<string, string | number> = {
    home_country: homeCountry,
  };

  searchParams.forEach((value, key) => {
    if (key.startsWith('sales_')) {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        params[key] = num;
      }
    }
  });

  const result = checkOssThreshold(params as any);

  return NextResponse.json(result, {
    status: 200,
  });
}
