import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import crypto from 'crypto';
import { rateLimitByIp } from '@/lib/rate-limit';

/**
 * Hash the verification code for comparison (must match verify-send).
 */
function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// POST /api/v1/auth/verify-confirm
export async function POST(request: NextRequest) {
  // Rate limit: 10 verification attempts per minute per IP (brute-force protection)
  const rateLimitResponse = await rateLimitByIp(request, { max: 10, windowSeconds: 60 });
  if (rateLimitResponse) return rateLimitResponse;

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
    const normalizedEmail = email.toLowerCase().trim();

    // Find user - don't reveal if user exists
    const { data: user } = await getSupabaseClient()
      .from('users')
      .select('id, email_verified, verification_code, verification_expires_at, failed_login_attempts')
      .eq('email', normalizedEmail)
      .single();

    if (!user) {
      return NextResponse.json(
        { error: 'INVALID_CODE', message: 'Invalid verification code.', status: 400 },
        { status: 400 },
      );
    }

    if (user.email_verified) {
      return NextResponse.json(
        { message: 'Email already verified.' },
        { status: 200 },
      );
    }

    // Check if code expired
    if (user.verification_expires_at && new Date(user.verification_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'EXPIRED_CODE', message: 'Verification code has expired. Request a new one.', status: 400 },
        { status: 400 },
      );
    }

    // Hash the provided code and compare with stored hash
    const codeHash = hashCode(code);

    if (user.verification_code !== codeHash) {
      // Increment failed attempts for audit
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      await getSupabaseClient()
        .from('users')
        .update({ failed_login_attempts: newAttempts })
        .eq('id', user.id);

      return NextResponse.json(
        { error: 'INVALID_CODE', message: 'Invalid verification code.', status: 400 },
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
        failed_login_attempts: 0,
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
