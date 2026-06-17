import { NextRequest } from 'next/server';
import { resolveRate } from '@vatrate/api';
import { z } from 'zod';
import { PRODUCT_TYPES } from '@vatrate/shared';
import { authenticateOptional, logUsage } from '@/lib/auth';
import { ERR, apiSuccess, authError, extractClientInfo } from '@/lib/api-helpers';
import { rateLimitByIp } from '@/lib/rate-limit';

const querySchema = z.object({
  country: z.string().min(2).max(2),
  type: z.enum(PRODUCT_TYPES).optional(),
  customer: z.enum(['business', 'consumer']).optional(),
  vat_number: z.string().optional(),
});

/** Max requests per hour for anonymous (no API key) requests */
const ANON_RATE_LIMIT = 10;
const ANON_WINDOW_SECONDS = 3600; // 1 hour

export async function GET(request: NextRequest) {
  const auth = await authenticateOptional(request);

  // If the request has an invalid API key (not just missing), reject it.
  if (!auth.authenticated && !auth.reason) {
    return authError(auth);
  }

  // Anonymous request (no API key): apply IP-based rate limiting.
  if (!auth.authenticated && auth.reason === 'missing') {
    const rateLimitResponse = await rateLimitByIp(request, {
      max: ANON_RATE_LIMIT,
      windowSeconds: ANON_WINDOW_SECONDS,
    });
    if (rateLimitResponse) {
      return ERR.RATE_LIMITED(
        'Rate limit exceeded. Sign up for a free API key at https://vatrate.eu/signup for higher limits.',
      );
    }
  }

  const { searchParams } = new URL(request.url);
  const params = {
    country: searchParams.get('country') || '',
    type: (searchParams.get('type') as z.infer<typeof querySchema>['type']) || undefined,
    customer: (searchParams.get('customer') as z.infer<typeof querySchema>['customer']) || undefined,
    vat_number: searchParams.get('vat_number') || undefined,
  };

  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return ERR.VALIDATION(
      'Invalid parameters. Required: country (2-letter code). Optional: type, customer, vat_number.',
      'https://vatrate.eu/docs/api-reference',
    );
  }

  const result = resolveRate(parsed.data);
  const status = 'error' in result ? result.status : 200;

  // Log usage asynchronously (only for authenticated requests with an API key)
  if (auth.apiKeyId && auth.userId) {
    const client = extractClientInfo(request);
    logUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      endpoint: '/api/v1/rate',
      method: 'GET',
      country: params.country,
      status,
      ip: client.ip,
      userAgent: client.userAgent,
    }).catch(console.error);
  }

  if ('error' in result) {
    return ERR.VALIDATION(result.error, 'https://vatrate.eu/docs/api-reference');
  }

  return apiSuccess(result, 200, {
    'Cache-Control': 'public, max-age=300, s-maxage=600',
  });
}
