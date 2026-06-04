import { NextRequest, NextResponse } from 'next/server';
import { classifyProduct } from '@vatrate/api';
import { getCountryData } from '@vatrate/api';
import { z } from 'zod';

const bodySchema = z.object({
  country: z.string().min(2).max(2),
  description: z.string().min(3).max(500),
});

export async function POST(request: NextRequest) {
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

  return NextResponse.json(result, {
    status: 200,
  });
}
