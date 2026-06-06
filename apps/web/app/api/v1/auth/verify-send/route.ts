import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// POST /api/v1/auth/verify-send
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
    const { data: user } = await getSupabaseClient()
      .from('users')
      .select('id, email_verified')
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

    // Generate verification code (valid for 15 minutes)
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store code in database
    const { error: updateError } = await getSupabaseClient()
      .from('users')
      .update({
        verification_code: code,
        verification_expires_at: expiresAt,
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Send verification email
    await sendEmail({
      to: email,
      subject: 'Verify your VATRate account',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Verify your email</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            Thanks for signing up for VATRate. Use the code below to verify your email address:
          </p>
          <div style="
            background: #eff6ff;
            border: 2px solid #2563eb;
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
          ">
            <span style="
              font-size: 36px;
              font-weight: 800;
              letter-spacing: 8px;
              color: #1e40af;
              font-family: monospace;
            ">${code}</span>
          </div>
          <p style="color: #6b7280; font-size: 14px;">
            This code expires in 15 minutes. If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: 'Verification code sent.', expires_at: expiresAt },
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to send verification code:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to send verification code.', status: 500 },
      { status: 500 },
    );
  }
}
