import { NextRequest, NextResponse } from 'next/server';
import { getAlerts } from '@vatrate/api';
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

  const result = getAlerts();

  // Log usage asynchronously
  if (auth.authenticated && auth.apiKeyId && auth.userId) {
    logUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      endpoint: '/api/v1/alerts',
      method: 'GET',
      status: 200,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }).catch(console.error);
  }

  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=7200',
    },
  });
}
