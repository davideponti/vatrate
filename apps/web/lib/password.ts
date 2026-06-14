import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 13;

/**
 * Hash a password using bcrypt (slow hash, built-in salt).
 * This replaces the old SHA-256 hashing which was vulnerable to rainbow tables.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash using constant-time comparison.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
