import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { createSession } from '@/lib/session';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/v1/auth/login
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

  try {
    // Find user (include password_hash for verification)
    const { data: user, error: userError } = await getSupabaseClient()
      .from('users')
      .select('id, email, plan, requests_limit, password_hash')
      .eq('email', email.toLowerCase())
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Invalid email or password.', status: 401 },
        { status: 401 },
      );
    }

    // Verify password
    const passwordHash = hashPassword(password);

    if (!user.password_hash || user.password_hash !== passwordHash) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Invalid email or password.', status: 401 },
        { status: 401 },
      );
    }

    // Get API keys for this user
    const { data: apiKeys } = await getSupabaseClient()
      .from('api_keys')
      .select('key_prefix, environment, is_active, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('revoked_at', null)
      .order('created_at', { ascending: false })
      .limit(1);

    // Create web session token (valid for 7 days)
    const sessionToken = await createSession(user.id);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          plan: user.plan,
          requests_limit: user.requests_limit,
        },
        api_keys: apiKeys || [],
        token: sessionToken,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred.', status: 500 },
      { status: 500 },
    );
  }
}
