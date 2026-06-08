import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { generateApiKey } from '@/lib/api-key';
import { authenticateRequest } from '@/lib/auth';
import { rateLimitBySession } from '@/lib/rate-limit';
import { ERR, apiSuccess, authError } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return authError(auth);
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

    return apiSuccess({ keys });
  } catch (error) {
    console.error('Failed to fetch API keys:', error);
    return ERR.INTERNAL('Failed to fetch API keys.');
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return authError(auth);
  }

  // Rate limit: max 10 API key creations per hour per session
  const rateLimitResponse = await rateLimitBySession(request, { max: 10, windowSeconds: 3600 });
  if (rateLimitResponse) return rateLimitResponse;

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
    const requestsLimit = user?.requests_limit || 100;

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
    return ERR.INTERNAL('Failed to generate API key.');
  }
}
