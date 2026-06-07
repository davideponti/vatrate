import { NextRequest } from 'next/server';
import { classifyProduct, getCountryData } from '@vatrate/api';
import { z } from 'zod';
import { authenticateRequest, logUsage } from '@/lib/auth';
import { ERR, apiSuccess, extractClientInfo } from '@/lib/api-helpers';

const bodySchema = z.object({
  country: z.string().min(2).max(2),
  description: z.string().min(3).max(500),
});

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return ERR.UNAUTHORIZED();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return ERR.VALIDATION('Invalid JSON body.');
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return ERR.VALIDATION(
      parsed.error.issues.map((i) => i.message).join(', '),
    );
  }

  const countryData = getCountryData(parsed.data.country) ?? undefined;
  const result = classifyProduct(parsed.data.description, countryData);

  // Log usage asynchronously
  if (auth.apiKeyId && auth.userId) {
    const client = extractClientInfo(request);
    logUsage({
      apiKeyId: auth.apiKeyId,
      userId: auth.userId,
      endpoint: '/api/v1/products',
      method: 'POST',
      country: parsed.data.country,
      status: 200,
      ip: client.ip,
      userAgent: client.userAgent,
    }).catch(console.error);
  }

  return apiSuccess(result);
}
