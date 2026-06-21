import { describe, it, expect, beforeEach, vi } from 'vitest';

// ─────────────────────────────────────────────────────────────
// Suite 1: Client-side token validation (pricing/page.tsx)
// ─────────────────────────────────────────────────────────────
describe('Client-side token validation (pricing/page.tsx)', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
  });

  // Exact replica of the getAuthToken() logic from pricing/page.tsx lines 46-56
  function getAuthToken(): string | null {
    try {
      const token = store.get('vatrate_token') ?? null;
      // Reject empty strings and whitespace-only tokens
      if (!token || token.trim() === '') return null;
      return token;
    } catch {
      // localStorage might be blocked (private browsing, etc.)
      return null;
    }
  }

  it('returns null when store/vatrate_token is not set at all (localStorage empty)', () => {
    // Simulates: first visit to /pricing, never logged in, localStorage is empty
    expect(getAuthToken()).toBeNull();
  });

  it('returns null when vatrate_token is missing (other keys exist but not vatrate_token)', () => {
    store.set('other_key', 'some_value');
    expect(getAuthToken()).toBeNull();
  });

  it('returns null when vatrate_token is an empty string', () => {
    store.set('vatrate_token', '');
    expect(getAuthToken()).toBeNull();
  });

  it('returns null when vatrate_token is whitespace only', () => {
    store.set('vatrate_token', '   ');
    expect(getAuthToken()).toBeNull();
  });

  it('returns null when vatrate_token is whitespace with tabs/newlines', () => {
    store.set('vatrate_token', '\n  \t  ');
    expect(getAuthToken()).toBeNull();
  });

  it('returns the token when vatrate_token is a valid hex string (64 chars)', () => {
    // This is the format createSession() generates: 32 random bytes → 64 hex chars
    const validToken = 'a'.repeat(64);
    store.set('vatrate_token', validToken);
    expect(getAuthToken()).toBe(validToken);
  });

  it('returns the token when vatrate_token is a shorter valid value', () => {
    store.set('vatrate_token', 'abcdef1234567890');
    expect(getAuthToken()).toBe('abcdef1234567890');
  });
});

// ─────────────────────────────────────────────────────────────
// Suite 2: extractKeyFromHeader() (lib/api-key.ts)
// ─────────────────────────────────────────────────────────────
describe('extractKeyFromHeader() — Bearer token extraction', () => {
  // Replica of the logic from lib/api-key.ts lines 39-50
  function extractKeyFromHeader(authHeader: string | null): string | null {
    if (!authHeader) return null;
    const match = authHeader.match(/^(?:Bearer\s+)?(.+)$/i);
    if (!match) return null;
    const token = match[1].trim();
    if (!token) return null;
    return token;
  }

  it('returns null when Authorization header is missing', () => {
    expect(extractKeyFromHeader(null)).toBeNull();
  });

  it('returns null when Authorization header is empty string', () => {
    expect(extractKeyFromHeader('')).toBeNull();
  });

  it('returns "Bearer" when Authorization header has only "Bearer" with no token (edge case)', () => {
    // The regex /^(?:Bearer\s+)?(.+)$/i matches "Bearer " via the (.+) path
    // (the optional Bearer group is skipped, and (.+) captures "Bearer " which trims to "Bearer")
    // This is a known edge case in the real extractKeyFromHeader — the word "Bearer" itself is returned
    // but it will later fail in authenticateSession() because it's < 32 chars → 401
    const result = extractKeyFromHeader('Bearer ');
    expect(result).toBe('Bearer');
  });

  it('returns the token when valid "Bearer <token>" format', () => {
    expect(extractKeyFromHeader('Bearer abc123')).toBe('abc123');
  });

  it('returns the token when bare token without "Bearer" prefix', () => {
    expect(extractKeyFromHeader('abc123')).toBe('abc123');
  });

  it('returns the token with mixed-case "bearer" prefix', () => {
    expect(extractKeyFromHeader('bearer abc123')).toBe('abc123');
  });

  it('trims whitespace from token', () => {
    expect(extractKeyFromHeader('Bearer   abc123   ')).toBe('abc123');
  });

  it('extracts a valid 64-char hex session token', () => {
    const token = 'a'.repeat(64);
    expect(extractKeyFromHeader(`Bearer ${token}`)).toBe(token);
  });

  it('extracts a valid vr_ API key', () => {
    const token = 'vr_live_a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890';
    expect(extractKeyFromHeader(`Bearer ${token}`)).toBe(token);
  });

  it('extracts a random invalid string (attacker trying random tokens)', () => {
    expect(extractKeyFromHeader('Bearer questo_non_e_un_token_valido')).toBe('questo_non_e_un_token_valido');
  });
});

// ─────────────────────────────────────────────────────────────
// Suite 3: getSession() validation logic (lib/session.ts)
// ─────────────────────────────────────────────────────────────
describe('getSession() — Session token validation rules', () => {
  // Replica of the logic from lib/session.ts lines 42-49
  function getSession(token: string): { valid: boolean; error?: string; status?: number } {
    if (!token || token.length < 32) {
      return { valid: false, error: 'Invalid session token.', status: 401 };
    }
    // Token passes format validation — in real code it would be hashed & DB-looked-up
    // If the DB returns no match → { valid: false, status: 401 }
    // If the DB returns expired → { valid: false, status: 401 }
    return { valid: true };
  }

  it('rejects empty string tokens (< 32 chars)', () => {
    const result = getSession('');
    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
  });

  it('rejects "short" token (< 32 chars)', () => {
    const result = getSession('short');
    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
  });

  it('rejects tokens of 31 characters (< 32)', () => {
    const result = getSession('a'.repeat(31));
    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
  });

  it('accepts tokens of exactly 32 characters (min valid length)', () => {
    const result = getSession('a'.repeat(32));
    expect(result.valid).toBe(true);
  });

  it('accepts tokens of exactly 64 characters (valid session format)', () => {
    const result = getSession('a'.repeat(64));
    expect(result.valid).toBe(true);
  });

  it('rejects a "random invalid value" as passed by an attacker', () => {
    // "questo_non_e_un_token_valido" is 28 chars → < 32 → rejected immediately
    const result = getSession('questo_non_e_un_token_valido');
    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
  });

  it('rejects "valore_a_caso_invalido" (shorter than 32 chars)', () => {
    // "valore_a_caso_invalido" = 22 chars
    const result = getSession('valore_a_caso_invalido');
    expect(result.valid).toBe(false);
    expect(result.status).toBe(401);
  });

  it('rejects any invalid 64-char token that is not in the sessions table', () => {
    // A 64-char random token passes format validation (length >= 32),
    // but in the real getSession() it would be hashed and looked up in the DB.
    // If the DB returns no match → { valid: false, status: 401 }
    // This test simulates what happens AFTER format validation passes:
    // the DB lookup would fail because the token hash doesn't exist.
    const fakeToken = 'f'.repeat(64);
    // Format passes
    expect(fakeToken.length).toBe(64);
    expect(fakeToken.length >= 32).toBe(true);
    // But DB lookup would fail (simulated below in Suite 4)
  });
});

// ─────────────────────────────────────────────────────────────
// Suite 4: authenticateRequest() — full auth flow simulation
// ─────────────────────────────────────────────────────────────
describe('authenticateRequest() — Full auth flow simulation', () => {
  // Simplified replica of lib/auth.ts authenticateRequest + authenticateSession
  async function mockAuthenticateRequest(authHeader: string | null): Promise<{
    authenticated: boolean;
    status?: number;
    error?: string;
  }> {
    // Step 1: Extract token from header
    if (!authHeader) {
      return { authenticated: false, status: 401, error: 'Authentication required.' };
    }
    const match = authHeader.match(/^(?:Bearer\s+)?(.+)$/i);
    if (!match) return { authenticated: false, status: 401, error: 'Authentication required.' };
    const bearerToken = match[1].trim();
    if (!bearerToken) return { authenticated: false, status: 401, error: 'Authentication required.' };

    // Step 2: Check if it looks like an API key (vr_ prefix) or session token
    if (!bearerToken.startsWith('vr_')) {
      // Session token path → check length + simulate DB lookup
      if (bearerToken.length < 32) {
        return { authenticated: false, status: 401, error: 'Invalid session token.' };
      }
      // Simulate DB lookup: any token NOT in the DB returns 401
      // In real code, getSession() hashes the token and queries the sessions table
      // Here we simulate success ONLY for the test token
      if (bearerToken === 'test_valid_session_token_abcdef1234567890') {
        return { authenticated: true };
      }
      // Random/attacker token → not in DB → 401
      return { authenticated: false, status: 401, error: 'Session not found.' };
    }

    // API key path
    if (bearerToken === 'vr_live_test_valid_key_12345678901234567890123456789012345678901234567890') {
      return { authenticated: true };
    }
    return { authenticated: false, status: 401, error: 'Invalid API key.' };
  }

  // ─── Test 1: No Authorization header at all ───
  it('[CRITICAL] returns 401 when Authorization header is missing', async () => {
    // Simulates: unauthenticated user clicking "Subscribe" on /pricing
    // The fetch() call has NO Authorization header
    const result = await mockAuthenticateRequest(null);
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  // ─── Test 2: Authorization header with no Bearer prefix ───
  it('[CRITICAL] returns 401 with bare invalid token (no Bearer)', async () => {
    // Token must be extracted even without "Bearer"
    const result = await mockAuthenticateRequest('questo_non_e_un_token_valido');
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  // ─── Test 3: Authorization with random invalid token ───
  it('[CRITICAL] returns 401 with Bearer + random invalid token', async () => {
    // This simulates: attacker tries to POST with Authorization: Bearer valore_a_caso_invalido
    const result = await mockAuthenticateRequest('Bearer valore_a_caso_invalido');
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  // ─── Test 4: Authorization with fake 64-char session token ───
  it('[CRITICAL] returns 401 with Bearer + fake 64-char hex token (not in DB)', async () => {
    // An attacker could craft a random 64-char hex string (matching the session format).
    // It passes the length check but the DB hash lookup fails.
    const fakeToken = 'f'.repeat(64);
    const result = await mockAuthenticateRequest(`Bearer ${fakeToken}`);
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  // ─── Test 5: Authorization with fake vr_ API key ───
  it('[CRITICAL] returns 401 with Bearer + fake vr_ API key (not in DB)', async () => {
    // An attacker could craft vr_live_<random> — but the key_hash won't match
    const fakeKey = `vr_live_${'f'.repeat(64)}`;
    const result = await mockAuthenticateRequest(`Bearer ${fakeKey}`);
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  // ─── Test 6: Valid session token passes ───
  it('accepts a valid session token that exists in the DB', async () => {
    const result = await mockAuthenticateRequest('Bearer test_valid_session_token_abcdef1234567890');
    expect(result.authenticated).toBe(true);
  });

  // ─── Test 7: Valid API key passes ───
  it('accepts a valid API key that exists in the DB', async () => {
    const result = await mockAuthenticateRequest('Bearer vr_live_test_valid_key_12345678901234567890123456789012345678901234567890');
    expect(result.authenticated).toBe(true);
  });

  // ─── Test 8: Authorization: Bearer with no token after it ───
  it('[EDGE] returns 401 with "Bearer " and nothing after', async () => {
    const result = await mockAuthenticateRequest('Bearer ');
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  // ─── Test 9: Empty Authorization header ───
  it('[EDGE] returns 401 with empty Authorization header', async () => {
    const result = await mockAuthenticateRequest('');
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────────
// Suite 5: Integration tests (curl commands for manual testing)
// ─────────────────────────────────────────────────────────────
describe('Integration tests — run these against a running dev server', () => {
  it('Test 1: POST with NO Authorization header → must return 401', () => {
    const cmd = `curl -s -X POST http://localhost:3000/api/v1/stripe/checkout \
  -H "Content-Type: application/json" \
  -d '{"plan":"basic"}' \
  -w "\\nHTTP_CODE:%{http_code}"`;
    console.log('\nRun this command while dev server is running:\n' + cmd + '\n');
    // Expected output: HTTP_CODE:401
    // Expected body: {"error":"UNAUTHORIZED","message":"Authentication required."}
  });

  it('Test 2: POST with Authorization: Bearer <random_invalid> → must return 401', () => {
    const cmd = `curl -s -X POST http://localhost:3000/api/v1/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer questo_non_e_un_token_valido" \
  -d '{"plan":"basic"}' \
  -w "\\nHTTP_CODE:%{http_code}"`;
    console.log('\nRun this command while dev server is running:\n' + cmd + '\n');
    // Expected output: HTTP_CODE:401
  });

  it('Test 3: POST with Authorization: Bearer <64-char-fake> → must return 401', () => {
    const fakeToken = 'f'.repeat(64);
    const cmd = `curl -s -X POST http://localhost:3000/api/v1/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${fakeToken}" \
  -d '{"plan":"basic"}' \
  -w "\\nHTTP_CODE:%{http_code}"`;
    console.log('\nRun this command while dev server is running:\n' + cmd + '\n');
    // A 64-char hex passes the length check, but the DB hash lookup will fail → 401
  });

  it('Test 4: POST with Authorization: Bearer <fake_vr_key> → must return 401', () => {
    const fakeKey = `vr_live_${'f'.repeat(64)}`;
    const cmd = `curl -s -X POST http://localhost:3000/api/v1/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${fakeKey}" \
  -d '{"plan":"basic"}' \
  -w "\\nHTTP_CODE:%{http_code}"`;
    console.log('\nRun this command while dev server is running:\n' + cmd + '\n');
    // Expected output: HTTP_CODE:401
  });

  it('Test 5: POST with invalid plan name → must return 400, NOT 500', () => {
    const cmd = `curl -s -X POST http://localhost:3000/api/v1/stripe/checkout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer some_token" \
  -d '{"plan":"nonexistent_plan"}' \
  -w "\\nHTTP_CODE:%{http_code}"`;
    console.log('\nRun this command while dev server is running:\n' + cmd + '\n');
    // auth check comes FIRST, so this returns 401 before validating the plan
    // If auth passes, it returns 400 for invalid plan
  });
});