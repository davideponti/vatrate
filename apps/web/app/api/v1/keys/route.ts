import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { generateApiKey } from '@/lib/api-key';
import { authenticateRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: auth.error, status: auth.status },
      { status: auth.status },
    );
  }

  try {
    const { data: keys, error } = await getSupabaseClient()
    .from('api_keys')
      .select(
        'id, name, key_prefix, environment, plan, requests_used, requests_limit, is_active, last_used_at, created_at, revoked_at, expires_at',
      )
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ keys }, { status: 200 });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch API keys.', status: 500 },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: auth.error, status: auth.status },
      { status: auth.status },
    );
  }

  let body: { name?: string; environment?: string };
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const name = body.name || 'Default';
  const environment = body.environment === 'test' ? 'test' : 'live';

  try {
    // Generate the key
    const { fullKey, keyPrefix, keyHash } = generateApiKey(environment);

    // Get user's plan info for requests_limit
    const { data: user } = await getSupabaseClient()
      .from('users')
      .select('plan, requests_limit')
      .eq('id', auth.userId)
      .single();

    const plan = user?.plan || 'free';
    const requestsLimit = user?.requests_limit || 3000;

    // Store the hash (never the full key!)
    const { data: newKey, error: insertError } = await getSupabaseClient()
      .from('api_keys')
      .insert({
        user_id: auth.userId,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        name,
        environment,
        plan,
        requests_limit: requestsLimit,
      })
      .select('id, name, key_prefix, environment, plan, requests_limit, created_at')
      .single();

    if (insertError) throw insertError;

    // Return the full key ONLY on creation (one-time display)
    return NextResponse.json(
      {
        key: {
          ...newKey,
          full_key: fullKey, // 👈 This is the only time the full key is shown
        },
        message: 'Save this key now — it will not be shown again.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Failed to generate API key:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to generate API key.', status: 500 },
      { status: 500 },
    );
  }
}
