import { NextRequest, NextResponse } from 'next/server';
import { checkOssThreshold } from '@vatrate/api';
import { z } from 'zod';
import { authenticateRequest, logUsage } from '@/lib/auth';

const querySchema = z.object({
  home_country: z.string().min(2).max(2),
});

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
  const homeCountry = searchParams.get('home_country');

  if (!homeCountry) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message:
          'Required: home_country (2-letter code, e.g., ?home_country=IT)',
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

  // Log usage asynchronously
  if (auth.authenticated && auth.apiKeyId && auth.userId) {
    logUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      endpoint: '/api/v1/oss-threshold',
      method: 'GET',
      country: homeCountry,
      status: 200,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }).catch(console.error);
  }

  return NextResponse.json(result, {
    status: 200,
  });
}
