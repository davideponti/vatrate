import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import crypto from 'crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/v1/auth/reset-password
export async function POST(request: NextRequest) {
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

  if (password.length < 8) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Password must be at least 8 characters.',
        status: 400,
      },
      { status: 400 },
    );
  }

  try {
    // Hash the provided token and look it up
    const tokenHash = hashToken(token);

    const { data: resetRecord, error: lookupError } = await getSupabaseClient()
      .from('password_reset_tokens')
      .select('id, user_id, expires_at, used_at')
      .eq('token_hash', tokenHash)
      .single();

    if (lookupError || !resetRecord) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'Invalid or expired reset token.', status: 400 },
        { status: 400 },
      );
    }

    // Check if already used
    if (resetRecord.used_at) {
      return NextResponse.json(
        { error: 'INVALID_TOKEN', message: 'This reset link has already been used.', status: 400 },
        { status: 400 },
      );
    }

    // Check if expired
    if (new Date(resetRecord.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'EXPIRED_TOKEN', message: 'This reset link has expired. Please request a new one.', status: 400 },
        { status: 400 },
      );
    }

    // Update the password
    const passwordHash = hashPassword(password);
    const { error: updateError } = await getSupabaseClient()
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', resetRecord.user_id);

    if (updateError) {
      console.error('Failed to update password:', updateError);
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Failed to reset password.', status: 500 },
        { status: 500 },
      );
    }

    // Mark the token as used
    await getSupabaseClient()
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetRecord.id);

    return NextResponse.json(
      { message: 'Password reset successfully. You can now sign in with your new password.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      { status: 500 },
    );
  }
}
