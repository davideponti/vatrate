import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { generateApiKey } from '@/lib/api-key';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
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

    // Create user with password hash
    const passwordHash = hashPassword(password);
    const { data: newUser, error: userError } = await getSupabaseClient()
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        plan: 'free',
        requests_limit: 30000,
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

    // Generate a token (in production, use proper JWT)
    const token = generateToken();

    // Generate the first API key automatically
    const { fullKey, keyPrefix, keyHash: apiKeyHash } = generateApiKey('live');

    const { error: keyError } = await getSupabaseClient().from('api_keys').insert({
      user_id: newUser.id,
      key_hash: apiKeyHash,
      key_prefix: keyPrefix,
      name: 'My First Key',
      environment: 'live',
      plan: 'free',
      requests_limit: 30000,
    });

    if (keyError) {
      console.error('Failed to create API key:', keyError);
    }

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          plan: newUser.plan,
        },
        api_key: fullKey, // 👈 One-time display
        token,
        message:
          'Account created successfully. Save your API key now — it will not be shown again.',
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
