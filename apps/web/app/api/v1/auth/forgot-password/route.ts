import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
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
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
        { status: 500 },
      );
    }

    // Build reset link
    const origin = request.headers.get('origin') || 'https://vatrate.eu';
    const resetLink = `${origin}/reset-password/${resetToken}`;

    // Send email via SMTP from noreply@vatrate.eu
    try {
      await sendEmail({
        type: 'transactional',
        to: user.email,
        subject: 'Reset your VATRate password',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <div style="font-size: 28px; font-weight: 700; color: #2563eb; margin-bottom: 24px;">VATRate</div>
            <h1 style="font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #1a1a2e;">Reset your password</h1>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              You requested a password reset for your VATRate account. Click the button below to set a new password. This link expires in 1 hour.
            </p>
            <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background: #2563eb; color: white; text-decoration: none; border-radius: 10px; font-size: 16px; font-weight: 600; margin-bottom: 24px;">
              Reset Password
            </a>
            <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0 0 8px;">
              Or copy and paste this link into your browser:
            </p>
            <p style="color: #6b7280; font-size: 13px; word-break: break-all; font-family: monospace; background: #f9fafb; padding: 12px; border-radius: 8px; margin: 0 0 24px;">
              ${resetLink}
            </p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
              If you didn't request this password reset, you can safely ignore this email.
            </p>
          </div>
        `,
      });
      console.log(`📧 Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      // Token is stored but email failed - for production, retry or notify admin
    }

    return NextResponse.json(
      {
        message:
          'If an account with that email exists, a password reset link has been sent.',
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
