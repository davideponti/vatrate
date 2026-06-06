import crypto from 'crypto';
import { getSupabaseClient } from './supabase';

export interface SessionResult {
  valid: boolean;
  userId?: string;
  error?: string;
  status?: number;
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Create a web session for a user.
 * Returns the session token (plaintext) to be stored in localStorage.
 */
export async function createSession(userId: string): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  // Delete old sessions for this user
  await getSupabaseClient()
    .from('sessions')
    .delete()
    .eq('user_id', userId);

  // Store new session
  const { error } = await getSupabaseClient()
    .from('sessions')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

  if (error) {
    console.error('Failed to create session:', error);
    throw new Error('Failed to create session.');
  }

  return token;
}

/**
 * Validate a session token from the Authorization header.
 */
export async function getSession(token: string): Promise<SessionResult> {
  if (!token) {
    return { valid: false, error: 'No session token provided.', status: 401 };
  }

  const tokenHash = hashToken(token);

  try {
    const { data: session, error } = await getSupabaseClient()
      .from('sessions')
      .select('id, user_id, expires_at')
      .eq('token_hash', tokenHash)
      .single();

    if (error || !session) {
      return { valid: false, error: 'Invalid session token.', status: 401 };
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await getSupabaseClient()
        .from('sessions')
        .delete()
        .eq('id', session.id);
      return { valid: false, error: 'Session expired. Please sign in again.', status: 401 };
    }

    return { valid: true, userId: session.user_id };
  } catch (error) {
    console.error('Session validation error:', error);
    return { valid: false, error: 'Authentication service error.', status: 500 };
  }
}

/**
 * Destroy a session (logout).
 */
export async function destroySession(token: string): Promise<void> {
  const tokenHash = hashToken(token);
  await getSupabaseClient()
    .from('sessions')
    .delete()
    .eq('token_hash', tokenHash);
}
