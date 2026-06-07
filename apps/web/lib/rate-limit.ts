import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiter con supporto Upstash Redis (serverless-safe) + fallback in-memory.
 *
 * In produzione su Vercel, usare Upstash Redis per rate limiting persistente.
 * In sviluppo o senza Upstash, usa fallback in-memory (non affidabile in serverless).
 *
 * Configurazione:
 *   UPSTASH_REDIS_REST_URL=https://<region>.upstash.io
 *   UPSTASH_REDIS_REST_TOKEN=<token>
 */

interface RateLimitOptions {
  /** Max requests allowed in the window */
  max: number;
  /** Window duration in seconds */
  windowSeconds: number;
}

// ─── In-memory fallback (development only) ───────────────────
const requestCounts = new Map<string, { count: number; resetAt: number }>();

// Clean up old entries every 5 minutes
if (typeof globalThis !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
      if (value.resetAt < now) {
        requestCounts.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref?.();
}

async function checkInMemory(key: string, max: number, windowSeconds: number): Promise<NextResponse | null> {
  const now = Date.now();
  const entry = requestCounts.get(key);

  if (!entry || entry.resetAt < now) {
    requestCounts.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return null;
  }

  entry.count++;

  if (entry.count > max) {
    return NextResponse.json(
      {
        error: 'RATE_LIMITED',
        message: `Too many requests. Try again in ${Math.ceil((entry.resetAt - now) / 1000)} seconds.`,
        status: 429,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((entry.resetAt - now) / 1000)),
          'X-RateLimit-Limit': String(max),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  return null;
}

// ─── Upstash Redis (production) ─────────────────────────────
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || '';
const useUpstash = !!(UPSTASH_URL && UPSTASH_TOKEN);

// Avviso startup: se Upstash non è configurato, il rate limiting non è serverless-safe
if (!useUpstash && typeof console !== 'undefined') {
  console.warn(
    '⚠️ [RATE LIMIT] UPSTASH_REDIS non configurato. ' +
    'Il rate limiting usa fallback in-memory (NON serverless-safe). ' +
    'Configura UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN per produzione su Vercel.\n' +
    'https://upstash.com/docs/redis/overall/getstarted'
  );
}

async function checkUpstash(key: string, max: number, windowSeconds: number): Promise<NextResponse | null> {
  try {
    const windowMs = windowSeconds * 1000;
    const now = Date.now();
    const resetAt = now + windowMs;

    const response = await fetch(`${UPSTASH_URL}/lua/EVALSHA`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        script: `
          local key = KEYS[1]
          local max = tonumber(ARGV[1])
          local window = tonumber(ARGV[2])
          local now = tonumber(ARGV[3])
          
          local count = redis.call("INCR", key)
          if count == 1 then
            redis.call("PEXPIRE", key, window)
          end
          
          if count > max then
            local ttl = redis.call("PTTL", key)
            return {0, tostring(count), tostring(ttl)}
          end
          
          return {1, tostring(count), tostring(0)}
        `,
        keys: [key],
        args: [String(max), String(windowMs), String(now)],
      }),
    });

    if (!response.ok) return null; // fallback silenzioso

    const result = await response.json();
    if (!result?.result?.[0]) {
      const ttl = Math.ceil(parseInt(result?.result?.[2] || '0') / 1000);
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: `Too many requests. Try again in ${ttl} seconds.`,
          status: 429,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(ttl),
            'X-RateLimit-Limit': String(max),
            'X-RateLimit-Remaining': '0',
          },
        },
      );
    }

    return null;
  } catch {
    // Fallback silenzioso a in-memory in caso di errore Upstash
    return checkInMemory(key, max, windowSeconds);
  }
}

// ─── Public API ─────────────────────────────────────────────

/**
 * Get the client IP from the request.
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

/**
 * Apply rate limiting based on IP address.
 * In production con Upstash configurato, usa Redis (serverless-safe).
 * Altrimenti, usa fallback in-memory (solo per sviluppo).
 */
export async function rateLimitByIp(
  request: NextRequest,
  options: Partial<RateLimitOptions> = {},
): Promise<NextResponse | null> {
  const { max, windowSeconds } = { max: 60, windowSeconds: 60, ...options };
  const ip = getClientIp(request);
  const key = `rl:ip:${ip}`;

  if (useUpstash) {
    return checkUpstash(key, max, windowSeconds);
  }

  return checkInMemory(key, max, windowSeconds);
}

/**
 * Apply rate limiting by session token (for dashboard routes).
 */
export async function rateLimitBySession(
  request: NextRequest,
  options: Partial<RateLimitOptions> = {},
): Promise<NextResponse | null> {
  const { max, windowSeconds } = { max: 30, windowSeconds: 60, ...options };
  const sessionToken = request.cookies.get('session')?.value;
  const key = `rl:sid:${sessionToken ? sessionToken.substring(0, 16) : 'anonymous'}`;

  if (useUpstash) {
    return checkUpstash(key, max, windowSeconds);
  }

  return checkInMemory(key, max, windowSeconds);
}

/**
 * Apply rate limiting by API key ID.
 */
export async function rateLimitByKey(
  apiKeyId: string,
  options: Partial<RateLimitOptions> = {},
): Promise<NextResponse | null> {
  const { max, windowSeconds } = { max: 300, windowSeconds: 60, ...options };
  const key = `rl:key:${apiKeyId}`;

  if (useUpstash) {
    return checkUpstash(key, max, windowSeconds);
  }

  return checkInMemory(key, max, windowSeconds);
}

/**
 * Apply rate limiting by email (per auth endpoints).
 */
export async function rateLimitByEmail(
  email: string,
  options: Partial<RateLimitOptions> = {},
): Promise<NextResponse | null> {
  const { max, windowSeconds } = { max: 5, windowSeconds: 300, ...options };
  const emailHash = await cryptoHash(email);
  const key = `rl:email:${emailHash}`;

  if (useUpstash) {
    return checkUpstash(key, max, windowSeconds);
  }

  return checkInMemory(key, max, windowSeconds);
}

async function cryptoHash(input: string): Promise<string> {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(input).digest('hex').substring(0, 16);
}
