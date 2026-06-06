import { NextRequest } from 'next/server';
import { getSupabaseClient } from './supabase';
import { extractKeyFromHeader, hashApiKey } from './api-key';

export interface AuthResult {
  authenticated: boolean;
  error?: string;
  status?: number;
  userId?: string;
  apiKeyId?: string;
  plan?: string;
  requestsUsed?: number;
  requestsLimit?: number;
}

/**
 * Middleware to authenticate an API request using the Authorization header.
 *
 * Flow:
 * 1. Extract Bearer token from Authorization header
 * 2. Hash the key
 * 3. Look up the hash in Supabase
 * 4. Verify the key is active and hasn't exceeded rate limits
 * 5. Log the usage
 *
 * Usage in API routes:
 * ```ts
 * const auth = await authenticateRequest(request);
 * if (!auth.authenticated) {
 *   return NextResponse.json({ error: 'UNAUTHORIZED', message: auth.error }, { status: auth.status });
 * }
 * ```
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');
  const apiKey = extractKeyFromHeader(authHeader);

  if (!apiKey) {
    // If no valid API key, check if it's a free/unauthenticated request (IP-based rate limit)
    // For now, return a specific error
    return {
      authenticated: false,
      error:
        'Valid API key required. Get one at https://vatrate.eu/signup. ' +
        'Include it in the Authorization header: Bearer vr_live_<your_key>',
      status: 401,
    };
  }

  // Hash the key to look it up in the database
  const keyHash = hashApiKey(apiKey);

  try {
    // Look up the key
    const { data: apiKeyData, error: lookupError } = await getSupabaseClient()
      .from('api_keys')
      .select('id, user_id, plan, requests_used, requests_limit, is_active, revoked_at, expires_at')
      .eq('key_hash', keyHash)
      .single();

    if (lookupError || !apiKeyData) {
      return {
        authenticated: false,
        error: 'Invalid API key. Check your key or generate a new one from your dashboard.',
        status: 401,
      };
    }

    // Check if key is active
    if (!apiKeyData.is_active || apiKeyData.revoked_at) {
      return {
        authenticated: false,
        error: 'API key has been revoked. Generate a new one from your dashboard.',
        status: 401,
      };
    }

    // Check if key has expired
    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return {
        authenticated: false,
        error: 'API key has expired. Generate a new one from your dashboard.',
        status: 401,
      };
    }

    // Check rate limit
    if (apiKeyData.requests_used >= apiKeyData.requests_limit) {
      return {
        authenticated: false,
        error: `Rate limit exceeded (${apiKeyData.requests_used}/${apiKeyData.requests_limit}). Upgrade your plan at https://vatrate.eu/pricing`,
        status: 429,
        requestsUsed: apiKeyData.requests_used,
        requestsLimit: apiKeyData.requests_limit,
        plan: apiKeyData.plan,
      };
    }

    return {
      authenticated: true,
      userId: apiKeyData.user_id,
      apiKeyId: apiKeyData.id,
      plan: apiKeyData.plan,
      requestsUsed: apiKeyData.requests_used,
      requestsLimit: apiKeyData.requests_limit,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      authenticated: false,
      error: 'Authentication service error. Please try again later.',
      status: 500,
    };
  }
}

/**
 * Log an API request usage.
 */
export async function logUsage(params: {
  apiKeyId: string;
  userId: string;
  endpoint: string;
  method: string;
  country?: string;
  status: number;
  ip: string;
  userAgent: string;
}): Promise<void> {
  try {
    // Hash the IP for privacy
    const { createHash } = await import('crypto');
    const ipHash = createHash('sha256').update(params.ip).digest('hex').substring(0, 16);

    await getSupabaseClient().from('usage_logs').insert({
      api_key_id: params.apiKeyId,
      user_id: params.userId,
      endpoint: params.endpoint,
      method: params.method,
      country: params.country || null,
      status: params.status,
      ip_hash: ipHash,
      user_agent: params.userAgent.substring(0, 255),
    });

    // Increment the requests_used counter directly using the UUID
    await getSupabaseClient().rpc('increment_api_key_usage_by_id', {
      p_key_id: params.apiKeyId,
    });
  } catch (error) {
    // Don't fail the request if logging fails
    console.error('Failed to log usage:', error);
  }
}
