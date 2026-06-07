import { NextRequest } from 'next/server';
import { resolveRate } from '@vatrate/api';
import { z } from 'zod';
import { PRODUCT_TYPES } from '@vatrate/shared';
import { authenticateRequest, logUsage } from '@/lib/auth';
import { ERR, apiSuccess, extractClientInfo } from '@/lib/api-helpers';

const querySchema = z.object({
  country: z.string().min(2).max(2),
  type: z.enum(PRODUCT_TYPES).optional(),
  customer: z.enum(['business', 'consumer']).optional(),
  vat_number: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return ERR.UNAUTHORIZED();
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

  // Log usage asynchronously
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
