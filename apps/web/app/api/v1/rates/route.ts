import { NextRequest, NextResponse } from 'next/server';
import { getCountryRates } from '@vatrate/api';
import { authenticateRequest, logUsage } from '@/lib/auth';

export async function GET(request: NextRequest) {
  // Authenticate
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: auth.error, status: auth.status },
      { status: auth.status! },
    );
  }

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

  // Log usage asynchronously
  if (auth.authenticated && auth.apiKeyId && auth.userId) {
    logUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      endpoint: '/api/v1/rates',
      method: 'GET',
      country,
      status: 200,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }).catch(console.error);
  }

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=600, s-maxage=1800',
    },
  });
}
