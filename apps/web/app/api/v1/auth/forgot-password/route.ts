import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';
import { rateLimitByIp } from '@/lib/rate-limit';

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://vatrate.eu',
  'https://www.vatrate.eu',
  'https://vatrate.vercel.app',
];

function getValidOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') || 'vatrate.eu';

  // First check if origin is in allowed list
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  // Then check host header
  if (host.includes('localhost') || host.includes('vatrate.eu') || host.includes('vercel.app')) {
    return `https://${host}`;
  }
  // Safe default
  return 'https://vatrate.eu';
}

// POST /api/v1/auth/forgot-password
export async function POST(request: NextRequest) {
  // Rate limit: 3 requests per minute per IP
  const rateLimitResponse = await rateLimitByIp(request, { max: 3, windowSeconds: 60 });
  if (rateLimitResponse) return rateLimitResponse;


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

    // Find user by email (don't reveal if user exists)
    const { data: user } = await getSupabaseClient()
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (!user) {
      // Return success anyway to not reveal if email exists
      return NextResponse.json(
        { message: 'If an account with that email exists, a password reset link has been sent.' },
        { status: 200 },
      );
    }

    // Generate reset token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Store token hash in DB
    await getSupabaseClient().from('password_reset_tokens').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    // Build reset link with token as query parameter (NOT in URL path)
    // per ridurre esposizione in log server, cronologia browser e Referer header
    const origin = getValidOrigin(request);
    const resetLink = `${origin}/reset-password?token=${rawToken}`;

    // Send email
    await sendEmail({
      to: normalizedEmail,
      subject: 'Reset your VATRate password',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Reset your password</h2>
          <p style="color: #374151; font-size: 16px; line-height: 1.5;">
            You requested a password reset for your VATRate account. Click the button below to reset your password:
          </p>
          <a href="${resetLink}" style="
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 14px 28px;
            border-radius: 8px;
            text-decoration: none;
            font-size: 16px;
            font-weight: 600;
            margin: 24px 0;
          ">Reset Password</a>
          <p style="color: #6b7280; font-size: 14px;">
            This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    return NextResponse.json(
      { message: 'If an account with that email exists, a password reset link has been sent.' },
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
