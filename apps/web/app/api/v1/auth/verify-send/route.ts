import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';
import { rateLimitByIp, rateLimitByEmail } from '@/lib/rate-limit';

function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

/**
 * Hash the verification code before storing it in DB.
 * Prevents exposure of the plain code if the DB is compromised.
 */
function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

// POST /api/v1/auth/verify-send
export async function POST(request: NextRequest) {
  // Rate limit: 3 verification emails per minute per IP
  const rateLimitIpResponse = await rateLimitByIp(request, { max: 3, windowSeconds: 60 });
  if (rateLimitIpResponse) return rateLimitIpResponse;

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
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit by email (3 per 5 minutes)
    const rateLimitEmailResponse = await rateLimitByEmail(normalizedEmail, { max: 3, windowSeconds: 300 });
    if (rateLimitEmailResponse) return rateLimitEmailResponse;

    // Find user - don't reveal if user exists (same as forgot-password)
    const { data: user } = await getSupabaseClient()
      .from('users')
      .select('id, email_verified')
      .eq('email', normalizedEmail)
      .single();

    if (!user) {
      // Return generic success to prevent user enumeration
      return NextResponse.json(
        { message: 'If an account with that email exists, a verification code has been sent.' },
        { status: 200 },
      );
    }

    if (user.email_verified) {
      return NextResponse.json(
        { message: 'If an account with that email exists, a verification code has been sent.' },
        { status: 200 },
      );
    }

    // Generate verification code (valid for 15 minutes)
    const code = generateVerificationCode();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Store HASHED code in database (not plaintext)
    const { error: updateError } = await getSupabaseClient()
      .from('users')
      .update({
        verification_code: codeHash, // now hashed
        verification_expires_at: expiresAt,
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    // Send verification email with plaintext code (user needs to read it)
    await sendEmail({
      to: normalizedEmail,
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
      { message: 'If an account with that email exists, a verification code has been sent.' },
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
