import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { hashPassword } from '@/lib/password';
import { isValidPassword } from '@/lib/auth';
import crypto from 'crypto';
import { rateLimitByIp } from '@/lib/rate-limit';

// POST /api/v1/auth/reset-password
export async function POST(request: NextRequest) {
  // Rate limit: 5 resets per minute per IP
  const rateLimitResponse = await rateLimitByIp(request, { max: 5, windowSeconds: 60 });
  if (rateLimitResponse) return rateLimitResponse;


  let body: { token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Invalid JSON body.', status: 400 },
      { status: 400 },
    );
  }

  const { token, password } = body;

  if (!token || !password) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Token and password are required.', status: 400 },
      { status: 400 },
    );
  }

  if (!isValidPassword(password)) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters with uppercase, lowercase, and a number.',
        status: 400,
      },
      { status: 400 },
    );
  }

  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

  try {
    // Find the token
    const { data: resetToken, error: tokenError } = await getSupabaseClient()
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .single();

    if (tokenError || !resetToken) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Invalid or expired reset token.', status: 400 },
        { status: 400 },
      );
    }

    // Check if already used
    if (resetToken.used_at) {
      return NextResponse.json(
        { error: 'TOKEN_USED', message: 'This reset link has already been used.', status: 400 },
        { status: 400 },
      );
    }

    // Check if expired
    if (new Date(resetToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'TOKEN_EXPIRED', message: 'Reset link has expired. Request a new one.', status: 400 },
        { status: 400 },
      );
    }

    // Hash the new password with bcrypt
    const passwordHash = await hashPassword(password);

    // Update user password
    const { error: updateError } = await getSupabaseClient()
      .from('users')
      .update({
        password_hash: passwordHash,
        failed_login_attempts: 0,
        locked_until: null,
      })
      .eq('id', resetToken.user_id);

    if (updateError) throw updateError;

    // Mark token as used
    await getSupabaseClient()
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id);

    // Invalidate all existing sessions for this user
    await getSupabaseClient()
      .from('sessions')
      .delete()
      .eq('user_id', resetToken.user_id);

    return NextResponse.json(
      { message: 'Password reset successfully. You can now sign in with your new password.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to reset password.', status: 500 },
      { status: 500 },
    );
  }
}
