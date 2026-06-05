import { NextRequest, NextResponse } from 'next/server';
import { classifyProduct, getCountryData } from '@vatrate/api';
import { z } from 'zod';
import { authenticateRequest, logUsage } from '@/lib/auth';

const bodySchema = z.object({
  country: z.string().min(2).max(2),
  description: z.string().min(3).max(500),
});

export async function POST(request: NextRequest) {
  // Authenticate
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: auth.error, status: auth.status },
      { status: auth.status! },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Invalid JSON body.',
        status: 400,
      },
      { status: 400 },
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: parsed.error.issues.map((i) => i.message).join(', '),
        status: 400,
      },
      { status: 400 },
    );
  }

  const countryData = getCountryData(parsed.data.country);
  const result = classifyProduct(parsed.data.description, countryData);

  // Log usage asynchronously
  if (auth.authenticated && auth.apiKeyId && auth.userId) {
    logUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      endpoint: '/api/v1/products',
      method: 'POST',
      country: parsed.data.country,
      status: 200,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
    }).catch(console.error);
  }

  return NextResponse.json(result, {
    status: 200,
  });
}
