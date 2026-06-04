import { NextRequest, NextResponse } from 'next/server';
import { getCountryRates } from '@vatrate/api';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  if (!country || country.length !== 2) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Required: country (2-letter code, e.g., ?country=IT)',
        status: 400,
        docs: 'https://vatrate.eu/docs/api-reference',
      },
      { status: 400 },
    );
  }

  const result = getCountryRates(country);

  if (!result) {
    return NextResponse.json(
      {
        error: 'NOT_FOUND',
        message: `Country '${country}' not found.`,
        status: 404,
      },
      { status: 404 },
    );
  }

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=600, s-maxage=1800',
    },
  });
}
