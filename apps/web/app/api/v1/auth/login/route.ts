import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { verifyPassword } from '@/lib/password';
import { createSession } from '@/lib/session';
import { rateLimitByIp } from '@/lib/rate-limit';
import { isValidPassword } from '@/lib/auth';
import { generateCsrfToken, setCsrfCookie } from '@/lib/csrf';

// POST /api/v1/auth/login
export async function POST(request: NextRequest) {
  // Rate limit: 10 login attempts per minute per IP
  const rateLimitResponse = await rateLimitByIp(request, { max: 10, windowSeconds: 60 });
  if (rateLimitResponse) return rateLimitResponse;


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

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Find user by email
    const { data: user, error: userError } = await getSupabaseClient()
      .from('users')
      .select('id, email, password_hash, email_verified, plan, failed_login_attempts, locked_until')
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user || !user.password_hash) {
      // Return generic error to not reveal if email exists
      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.', status: 401 },
        { status: 401 },
      );
    }

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remainingMinutes = Math.ceil(
        (new Date(user.locked_until).getTime() - Date.now()) / 60000,
      );
      return NextResponse.json(
        {
          error: 'ACCOUNT_LOCKED',
          message: `Account temporarily locked. Try again in ${remainingMinutes} minute(s).`,
          status: 429,
        },
        { status: 429 },
      );
    }

    // Verify password with bcrypt
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      // Increment failed attempts
      const newAttempts = (user.failed_login_attempts || 0) + 1;
      const lockMinutes = Math.min(15 * Math.pow(2, newAttempts - 5), 60);
      const lockUntil =
        newAttempts >= 5
          ? new Date(Date.now() + lockMinutes * 60 * 1000).toISOString()
          : null;

      await getSupabaseClient()
        .from('users')
        .update({
          failed_login_attempts: newAttempts,
          locked_until: lockUntil,
        })
        .eq('id', user.id);

      return NextResponse.json(
        { error: 'INVALID_CREDENTIALS', message: 'Invalid email or password.', status: 401 },
        { status: 401 },
      );
    }

    // Reset failed attempts on successful login
    await getSupabaseClient()
      .from('users')
      .update({ failed_login_attempts: 0, locked_until: null })
      .eq('id', user.id);

    // Create session
    const token = await createSession(user.id);

    // Determine redirect based on plan and verification
    let redirectTo = '/dashboard';

    const response = NextResponse.json(
      {
        message: 'Login successful.',
        redirect_to: redirectTo,
        user: { email: user.email },
        token,
      },
      { status: 200 },
    );

    // Set session cookie (sameSite: 'strict' prevents CSRF)
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    // Set CSRF token cookie for dashboard API protection
    const csrfToken = generateCsrfToken();
    setCsrfCookie(response, csrfToken);

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      { status: 500 },
    );
  }
}
