import { NextRequest } from 'next/server';
import { checkOssThreshold } from '@vatrate/api';
import type { OssThresholdRequest } from '@vatrate/shared';
import { z } from 'zod';
import { authenticateRequest, logUsage } from '@/lib/auth';
import { ERR, apiSuccess, extractClientInfo } from '@/lib/api-helpers';

const querySchema = z.object({
  home_country: z.string().min(2).max(2),
});

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return ERR.UNAUTHORIZED();
  }

  const { searchParams } = new URL(request.url);
  const homeCountry = searchParams.get('home_country');

  if (!homeCountry) {
    return ERR.VALIDATION(
      'Required: home_country (2-letter code, e.g., ?home_country=IT)',
      'https://vatrate.eu/docs/api-reference',
    );
  }

  // Build typed params from all sales_* query params
  const params: OssThresholdRequest = {
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

  const result = checkOssThreshold(params);

  // Log usage asynchronously
  if (auth.apiKeyId && auth.userId) {
    const client = extractClientInfo(request);
    logUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      endpoint: '/api/v1/oss-threshold',
      method: 'GET',
      country: homeCountry,
      status: 200,
      ip: client.ip,
      userAgent: client.userAgent,
    }).catch(console.error);
  }

  return apiSuccess(result);
}
