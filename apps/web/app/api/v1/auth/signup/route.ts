import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateVerificationCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// POST /api/v1/auth/signup
export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Invalid JSON body.', status: 400 },
      { status: 400 },
    );
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Email and password are required.', status: 400 },
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
    // Check if user already exists
    const { data: existingUser } = await getSupabaseClient()
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        {
          error: 'CONFLICT',
          message: 'An account with this email already exists.',
          status: 409,
        },
        { status: 409 },
      );
    }

    // Generate verification code (valid for 15 minutes)
    const code = generateVerificationCode();
    const verificationExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    // Create user with password hash (unverified)
    const passwordHash = hashPassword(password);
    const { data: newUser, error: userError } = await getSupabaseClient()
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        plan: 'free',
        requests_limit: 100, // Free tier: 100 requests/month
        email_verified: false,
        verification_code: code,
        verification_expires_at: verificationExpiresAt,
      })
      .select('id, email, plan, requests_limit, created_at')
      .single();

    if (userError || !newUser) {
      console.error('Failed to create user:', userError);
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Failed to create account.', status: 500 },
        { status: 500 },
      );
    }

    // Send verification email
    try {
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
              This code expires in 15 minutes. If you didn't sign up, you can safely ignore this email.
            </p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send verification email, but user was created:', emailError);
    }

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          plan: newUser.plan,
        },
        message: 'Account created. Please check your email for a verification code to activate your account.',
        email_verified: false,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      { status: 500 },
    );
  }
}
