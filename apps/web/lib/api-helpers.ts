import { NextRequest, NextResponse } from 'next/server';

// ──────────────────────────────────────────────
// Shared types
// ──────────────────────────────────────────────

export interface ApiErrorBody {
  error: string;
  message: string;
  status: number;
  docs?: string;
}

export interface ApiSuccessBody<T = unknown> {
  [key: string]: T;
}

// ──────────────────────────────────────────────
// Error responses
// ──────────────────────────────────────────────

export function apiError(
  status: number,
  code: string,
  message: string,
  extra?: { docs?: string },
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { error: code, message, status };
  if (extra?.docs) body.docs = extra.docs;
  return NextResponse.json(body, { status });
}

export const ERR = {
  UNAUTHORIZED: () =>
    apiError(401, 'UNAUTHORIZED', 'Authentication required.'),
  FORBIDDEN: (msg = 'Access denied.') =>
    apiError(403, 'FORBIDDEN', msg),
  NOT_FOUND: (msg = 'Resource not found.') =>
    apiError(404, 'NOT_FOUND', msg),
  CONFLICT: (msg: string) =>
    apiError(409, 'CONFLICT', msg),
  VALIDATION: (msg: string, docs?: string) =>
    apiError(400, 'VALIDATION_ERROR', msg, docs ? { docs } : undefined),
  INVALID_CREDENTIALS: () =>
    apiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.'),
  INTERNAL: (msg = 'An unexpected error occurred.') =>
    apiError(500, 'INTERNAL_ERROR', msg),
  STRIPE_ERROR: (msg = 'Failed to process payment.') =>
    apiError(500, 'STRIPE_ERROR', msg),
  RATE_LIMITED: (msg = 'Too many requests. Try again later.') =>
    apiError(429, 'RATE_LIMITED', msg),
} as const;

/**
 * Return the correct error response based on auth result status.
 * Routes should use this instead of hardcoding ERR.UNAUTHORIZED()
 * so that rate-limit errors (429) are properly propagated.
 */
export function authError(auth: { authenticated: boolean; status?: number; error?: string }): NextResponse {
  if (auth.status === 429) {
    return ERR.RATE_LIMITED(auth.error);
  }
  return apiError(auth.status || 401, 'UNAUTHORIZED', auth.error || 'Authentication required.');
}

// ──────────────────────────────────────────────
// Success responses
// ──────────────────────────────────────────────

export function apiSuccess<T>(
  data: T,
  status = 200,
  headers?: Record<string, string>,
): NextResponse {
  return NextResponse.json(data, {
    status,
    headers: headers as HeadersInit | undefined,
  });
}

// ──────────────────────────────────────────────
// Client info extraction (DRY for IP + User-Agent)
// ──────────────────────────────────────────────

export interface ClientInfo {
  ip: string;
  userAgent: string;
}

export function extractClientInfo(request: NextRequest): ClientInfo {
  return {
    ip:
      request.headers.get('x-forwarded-for') ??
      request.headers.get('x-real-ip') ??
      'unknown',
    userAgent: request.headers.get('user-agent') ?? 'unknown',
  };
}
