import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';

// POST /api/v1/auth/verify-confirm
export async function POST(request: NextRequest) {
  let body: { email?: string; code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Invalid JSON body.', status: 400 },
      { status: 400 },
    );
  }

  const { email, code } = body;

  if (!email || !code) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Email and code are required.', status: 400 },
      { status: 400 },
    );
  }

  try {
    // Find user
    const { data: user } = await getSupabaseClient()
      .from('users')
      .select('id, email_verified, verification_code, verification_expires_at')
      .eq('email', email.toLowerCase())
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'User not found.', status: 404 },
        { status: 404 },
      );
    }

    if (user.email_verified) {
      return NextResponse.json(
        { message: 'Email already verified.' },
        { status: 200 },
      );
    }

    // Check if code matches
    if (user.verification_code !== code) {
      return NextResponse.json(
        { error: 'INVALID_CODE', message: 'Invalid verification code.', status: 400 },
        { status: 400 },
      );
    }

    // Check if code expired
    if (user.verification_expires_at && new Date(user.verification_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'EXPIRED_CODE', message: 'Verification code has expired. Request a new one.', status: 400 },
        { status: 400 },
      );
    }

    // Mark email as verified and clear code
    const { error: updateError } = await getSupabaseClient()
      .from('users')
      .update({
        email_verified: true,
        verification_code: null,
        verification_expires_at: null,
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json(
      { message: 'Email verified successfully.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to verify email:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to verify email.', status: 500 },
      { status: 500 },
    );
  }
}
