import { NextRequest, NextResponse } from 'next/server';
import { resolveRate } from '@vatrate/api';
import { z } from 'zod';
import { authenticateRequest, logUsage } from '@/lib/auth';

const querySchema = z.object({
  country: z.string().min(2).max(2),
  type: z.string().optional(),
  customer: z.enum(['business', 'consumer']).optional(),
  vat_number: z.string().optional(),
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
  const params = {
    country: searchParams.get('country') || '',
    type: searchParams.get('type') || undefined,
    customer: searchParams.get('customer') || undefined,
    vat_number: searchParams.get('vat_number') || undefined,
  };

  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message:
          'Invalid parameters. Required: country (2-letter code). Optional: type, customer, vat_number.',
        status: 400,
        docs: 'https://vatrate.eu/docs/api-reference',
      },
      { status: 400 },
    );
  }

  const params2 = parsed.data as Parameters<typeof resolveRate>[0];
  const result = resolveRate(params2);

  const status = 'error' in result ? result.status : 200;

  // Log usage asynchronously
  if (auth.authenticated && auth.apiKeyId && auth.userId) {
    logUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      endpoint: '/api/v1/rate',
      method: 'GET',
      country: params.country,
      status,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }).catch(console.error);
  }

  if ('error' in result) {
    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=300, s-maxage=600',
    },
  });
}
