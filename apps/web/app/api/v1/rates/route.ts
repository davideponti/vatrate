import { NextRequest } from 'next/server';
import { getCountryRates } from '@vatrate/api';
import { authenticateRequest, logUsage } from '@/lib/auth';
import { ERR, apiSuccess, extractClientInfo } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return ERR.UNAUTHORIZED();
  }

  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country');

  if (!country || country.length !== 2) {
    return ERR.VALIDATION(
      'Required: country (2-letter code, e.g., ?country=IT)',
      'https://vatrate.eu/docs/api-reference',
    );
  }

  const result = getCountryRates(country);

  if (!result) {
    return ERR.NOT_FOUND(`Country '${country}' not found.`);
  }

  // Log usage asynchronously
  if (auth.apiKeyId && auth.userId) {
    const client = extractClientInfo(request);
    logUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      endpoint: '/api/v1/rates',
      method: 'GET',
      country,
      status: 200,
      ip: client.ip,
      userAgent: client.userAgent,
    }).catch(console.error);
  }

  return apiSuccess(result, 200, {
    'Cache-Control': 'public, max-age=600, s-maxage=1800',
  });
}
