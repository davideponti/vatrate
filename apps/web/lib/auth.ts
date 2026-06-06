import { NextRequest } from 'next/server';
import { getSupabaseClient } from './supabase';
import { extractKeyFromHeader, hashApiKey } from './api-key';
import { getSession } from './session';

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
 * Authenticate a request using either an API key (external API calls)
 * or a session token (web dashboard). Session tokens are identified
 * by not matching the API key format (not starting with "vr_").
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
  const bearerToken = extractKeyFromHeader(authHeader);

  if (!bearerToken) {
    return {
      authenticated: false,
      error:
        'Valid API key required. Get one at https://vatrate.eu/signup. ' +
        'Include it in the Authorization header: Bearer vr_live_<your_key>',
      status: 401,
    };
  }

  // Check if it's a session token (web dashboard) vs API key
  // Session tokens are hex strings (64 chars), API keys start with "vr_"
  if (!bearerToken.startsWith('vr_')) {
    return await authenticateSession(bearerToken);
  }

  return await authenticateApiKey(bearerToken);
}

/**
 * Authenticate using a web session token (from the dashboard).
 */
async function authenticateSession(token: string): Promise<AuthResult> {
  const session = await getSession(token);
  if (!session.valid) {
    return {
      authenticated: false,
      error: session.error || 'Invalid session.',
      status: session.status || 401,
    };
  }

  return {
    authenticated: true,
    userId: session.userId!,
  };
}

/**
 * Authenticate using an API key (vr_live_... or vr_test_...).
 */
async function authenticateApiKey(apiKey: string): Promise<AuthResult> {
  const keyHash = hashApiKey(apiKey);

  try {
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

    if (!apiKeyData.is_active || apiKeyData.revoked_at) {
      return {
        authenticated: false,
        error: 'API key has been revoked. Generate a new one from your dashboard.',
        status: 401,
      };
    }

    if (apiKeyData.expires_at && new Date(apiKeyData.expires_at) < new Date()) {
      return {
        authenticated: false,
        error: 'API key has expired. Generate a new one from your dashboard.',
        status: 401,
      };
    }

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
    const { createHash } = await import('crypto');
    const ipHash = createHash('sha256').update(params.ip).digest('hex').substring(0, 16);

    // Log to usage_logs for stats
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

    // Log to api_logs for the logs page
    await getSupabaseClient().from('api_logs').insert({
      api_key_id: params.apiKeyId,
      user_id: params.userId,
      method: params.method,
      path: params.endpoint,
      status_code: params.status,
      ip_address: params.ip,
      user_agent: params.userAgent.substring(0, 255),
      response_time_ms: null,
    });

    await getSupabaseClient().rpc('increment_api_key_usage_by_id', {
      p_key_id: params.apiKeyId,
    });
  } catch (error) {
    console.error('Failed to log usage:', error);
  }
}
