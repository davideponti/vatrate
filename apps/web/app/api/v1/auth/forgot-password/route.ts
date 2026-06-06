import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import crypto from 'crypto';

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateResetToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// POST /api/v1/auth/forgot-password
export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Invalid JSON body.', status: 400 },
      { status: 400 },
    );
  }

  const { email } = body;

  if (!email) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Email is required.', status: 400 },
      { status: 400 },
    );
  }

  try {
    // Find user
    const { data: user, error: userError } = await getSupabaseClient()
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    // For security, always return success even if email not found
    if (userError || !user) {
      return NextResponse.json(
        {
          message:
            'If an account with that email exists, a password reset link has been sent.',
        },
        { status: 200 },
      );
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = generateResetToken();
    const tokenHash = hashToken(resetToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Delete any existing unused tokens for this user
    await getSupabaseClient()
      .from('password_reset_tokens')
      .delete()
      .eq('user_id', user.id)
      .is('used_at', null);

    // Store the new token hash
    const { error: insertError } = await getSupabaseClient()
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      });

    if (insertError) {
      console.error('Failed to store reset token:', insertError);
      // Still return success to avoid leaking user existence
    }

    // In production, send an email. For MVP, return the reset link directly.
    const resetLink = `${request.headers.get('origin') || 'https://vatrate.eu'}/reset-password/${resetToken}`;

    console.log(`📧 Password reset link for ${user.email}: ${resetLink}`);

    return NextResponse.json(
      {
        message:
          'If an account with that email exists, a password reset link has been sent.',
        // For development convenience, include the reset link (remove in production!)
        reset_link: resetLink,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      { status: 500 },
    );
  }
}
