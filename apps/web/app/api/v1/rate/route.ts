import { NextRequest, NextResponse } from 'next/server';
import { resolveRate } from '@vatrate/api';
import { z } from 'zod';

const querySchema = z.object({
  country: z.string().min(2).max(2),
  type: z.string().optional(),
  customer: z.enum(['business', 'consumer']).optional(),
  vat_number: z.string().optional(),
});

export async function GET(request: NextRequest) {
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
        message: 'Invalid parameters. Required: country (2-letter code). Optional: type, customer, vat_number.',
        status: 400,
        docs: 'https://vatrate.eu/docs/api-reference',
      },
      { status: 400 },
    );
  }

  const result = resolveRate(parsed.data);

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
