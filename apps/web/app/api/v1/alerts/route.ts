import { NextRequest } from 'next/server';
import { getAlerts } from '@vatrate/api';
import { authenticateRequest, logUsage } from '@/lib/auth';
import { ERR, apiSuccess, extractClientInfo } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return ERR.UNAUTHORIZED();
  }

  const result = getAlerts();

  // Log usage asynchronously
  if (auth.apiKeyId && auth.userId) {
    const client = extractClientInfo(request);
    logUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      endpoint: '/api/v1/alerts',
      method: 'GET',
      status: 200,
      ip: client.ip,
      userAgent: client.userAgent,
    }).catch(console.error);
  }

  return apiSuccess(result, 200, {
    'Cache-Control': 'public, max-age=3600, s-maxage=7200',
  });
}
