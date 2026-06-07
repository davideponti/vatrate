import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { hashPassword } from '@/lib/password';
import { rateLimitByIp } from '@/lib/rate-limit';
import { isValidPassword } from '@/lib/auth';

function isValidEmail(email: string): boolean {
  // RFC 5322 simplified email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// POST /api/v1/auth/signup
export async function POST(request: NextRequest) {
  // Rate limit: 5 signups per minute per IP
  const rateLimitResponse = await rateLimitByIp(request, { max: 5, windowSeconds: 60 });
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

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Invalid email format.', status: 400 },
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

  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    const { data: existingUser } = await getSupabaseClient()
      .from('users')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'CONFLICT', message: 'An account with this email already exists.', status: 409 },
        { status: 409 },
      );
    }

    // Hash password with bcrypt
    const passwordHash = await hashPassword(password);

    const { error: insertError } = await getSupabaseClient().from('users').insert({
      email: normalizedEmail,
      password_hash: passwordHash,
      plan: 'free',
      requests_limit: 100,
    });

    if (insertError) throw insertError;

    return NextResponse.json(
      { message: 'Account created successfully.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create account. Please try again.', status: 500 },
      { status: 500 },
    );
  }
}
