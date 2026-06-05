import crypto from 'crypto';

const KEY_PREFIX = 'vr';
const KEY_BYTES = 32; // 256-bit key → 64 hex chars

/**
 * Generate a cryptographically secure API key.
 *
 * Format: `vr_live_<64-hex-chars>` or `vr_test_<64-hex-chars>`
 * Example: `vr_live_a1b2c3d4e5f6...`
 */
export function generateApiKey(environment: 'live' | 'test' = 'live'): {
  fullKey: string;
  keyPrefix: string;
  keyHash: string;
} {
  const randomBytes = crypto.randomBytes(KEY_BYTES);
  const hexPart = randomBytes.toString('hex');
  const fullKey = `${KEY_PREFIX}_${environment}_${hexPart}`;
  const keyPrefix = fullKey.substring(0, 12); // e.g. "vr_live_a1b2"
  const keyHash = hashApiKey(fullKey);

  return { fullKey, keyPrefix, keyHash };
}

/**
 * Hash an API key using SHA-256.
 * We store only the hash in the database, never the full key.
 */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Extract the key from an Authorization header value.
 * Supports: "Bearer vr_live_..." or "vr_live_..."
 */
export function extractKeyFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;

  // Support both "Bearer <key>" and bare key
  const match = authHeader.match(/^(?:Bearer\s+)?(.+)$/i);
  if (!match) return null;

  const key = match[1].trim();
  // Validate key format: vr_live_ or vr_test_ followed by hex chars
  if (!/^vr_(live|test)_[0-9a-f]{64}$/.test(key)) return null;

  return key;
}

/**
 * Validate the format of an API key.
 */
export function isValidKeyFormat(key: string): boolean {
  return /^vr_(live|test)_[0-9a-f]{64}$/.test(key);
}

/**
 * Check if a key is a test key.
 */
export function isTestKey(key: string): boolean {
  return key.startsWith('vr_test_');
}
