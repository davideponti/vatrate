import { NextResponse } from 'next/server';
import { getAlerts } from '@vatrate/api';

export async function GET() {
  const result = getAlerts();
  return NextResponse.json(result, {
    status: 200,
    headers: {
      'Cache-Control': 'public, max-age=3600, s-maxage=7200',
    },
  });
}
