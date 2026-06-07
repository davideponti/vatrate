import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Simple CSRF protection for dashboard API routes.
 * Uses Double Submit Cookie pattern:
 * - A CSRF token is set as a cookie (httpOnly: false so JS can read it)
 * - The same token must be sent in X-CSRF-Token header
 * - Server compares the two
 *
 * For API routes that use session cookies (dashboard), call validateCsrf().
 * For public API routes (API key auth), CSRF doesn't apply.
 */

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_BYTE_LENGTH = 32;

/**
 * Generate a CSRF token and set it as a cookie.
 * Call this on login/session creation to establish the token.
 */
export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_BYTE_LENGTH).toString('hex');
}

/**
 * Set the CSRF token cookie on a response.
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // JS needs to read it to set the header
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7 days (same as session)
    path: '/',
  });
}

/**
 * Validate a CSRF token from the request header against the cookie.
 * Returns 403 if invalid, null if valid.
 *
 * Usage in dashboard routes:
 * ```ts
 * const csrfError = validateCsrf(request);
 * if (csrfError) return csrfError;
 * ```
 */
export function validateCsrf(request: NextRequest): NextResponse | null {
  // Only validate mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null;
  }

  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return NextResponse.json(
      {
        error: 'CSRF_ERROR',
        message: 'Missing CSRF token. Refresh the page and try again.',
        status: 403,
      },
      { status: 403 },
    );
  }

  // Constant-time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) {
    return NextResponse.json(
      {
        error: 'CSRF_ERROR',
        message: 'Invalid CSRF token.',
        status: 403,
      },
      { status: 403 },
    );
  }

  const valid = crypto.timingSafeEqual(
    Buffer.from(cookieToken, 'utf8'),
    Buffer.from(headerToken, 'utf8'),
  );

  if (!valid) {
    return NextResponse.json(
      {
        error: 'CSRF_ERROR',
        message: 'Invalid CSRF token. Refresh the page and try again.',
        status: 403,
      },
      { status: 403 },
    );
  }

  return null;
}
