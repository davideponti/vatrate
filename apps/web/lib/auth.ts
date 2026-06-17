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
  /**
   * Present only when authenticated=false.
   * 'missing' = no Authorization header at all (caller may allow anonymous).
   * undefined = auth header present but invalid/expired/revoked.
   */
  reason?: 'missing';
}

/**
 * Validate password strength consistently across the app.
 * Min 8 chars, at least 1 uppercase, 1 lowercase, 1 number.
 */
export function isValidPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);
}

/**
 * Sanitize a string for database storage - removes HTML tags to prevent stored XSS.
 */
function sanitize(value: string, maxLength: number = 255): string {
  return value
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Strip control characters
    .substring(0, maxLength);
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
 * Authenticate a request, but allow anonymous access when no Authorization header is present.
 *
 * - If no Authorization header → returns `{ authenticated: false, reason: 'missing' }`
 *   (caller may allow anonymous with stricter rate limiting)
 * - If Authorization header present but invalid → returns `{ authenticated: false, status: 4xx }`
 * - If Authorization header valid → returns `{ authenticated: true, ...userData }`
 *
 * Useful for endpoints that want to support "try it without an API key" while still
 * rejecting requests with visibly invalid keys.
 */
export async function authenticateOptional(request: NextRequest): Promise<AuthResult> {
  const authHeader = request.headers.get('authorization');
  const bearerToken = extractKeyFromHeader(authHeader);

  if (!bearerToken) {
    return {
      authenticated: false,
      reason: 'missing',
    };
  }

  // Check if it's a session token (web dashboard) vs API key
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

    // ── Aggregate check: sum requests_used across ALL active keys for this user ──
    // Prevents bypass by generating multiple API keys (each starts at 0 used).
    try {
      const { data: aggregate } = await getSupabaseClient()
        .from('api_keys')
        .select('requests_used')
        .eq('user_id', apiKeyData.user_id)
        .eq('is_active', true)
        .is('revoked_at', null);

      if (aggregate) {
        const totalUsed = aggregate.reduce((sum, key) => sum + (key.requests_used || 0), 0);
        if (totalUsed >= apiKeyData.requests_limit) {
          return {
            authenticated: false,
            error: `Rate limit exceeded (${totalUsed}/${apiKeyData.requests_limit} across all keys). Upgrade your plan at https://vatrate.eu/pricing`,
            status: 429,
            requestsUsed: totalUsed,
            requestsLimit: apiKeyData.requests_limit,
            plan: apiKeyData.plan,
          };
        }
      }
    } catch {
      // If the aggregate query fails, fall back to per-key check only (already passed)
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
 * IP addresses are hashed for privacy (GDPR compliance).
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

    // Sanitize user-agent before storage to prevent XSS
    const sanitizedUserAgent = sanitize(params.userAgent, 255);

    // Log to usage_logs for stats
    await getSupabaseClient().from('usage_logs').insert({
      api_key_id: params.apiKeyId,
      user_id: params.userId,
      endpoint: params.endpoint,
      method: params.method,
      country: params.country || null,
      status: params.status,
      ip_hash: ipHash,
      user_agent: sanitizedUserAgent,
    });

    // Log to api_logs for the logs page
    // IP is hashed for GDPR compliance (same hash used in usage_logs)
    await getSupabaseClient().from('api_logs').insert({
      api_key_id: params.apiKeyId,
      user_id: params.userId,
      method: params.method,
      path: params.endpoint,
      status_code: params.status,
      ip_address: ipHash, // Hashed IP for GDPR compliance (was previously stored in plaintext)
      user_agent: sanitizedUserAgent,
      response_time_ms: null,
    });

    await getSupabaseClient().rpc('increment_api_key_usage_by_id', {
      p_key_id: params.apiKeyId,
    });
  } catch (error) {
    console.error('Failed to log usage:', error);
  }
}