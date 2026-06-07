import crypto from 'crypto';
import { getSupabaseClient } from './supabase';

const SESSION_EXPIRY_HOURS = 168; // 7 days
const SESSION_BYTE_LENGTH = 32; // 256-bit tokens

/**
 * Hash a session token using SHA-256.
 * Used to store tokens in the DB without exposing the raw token.
 */
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Create a new session for a user.
 * Returns the raw token (to send to the client) after storing its hash in the DB.
 */
export async function createSession(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(SESSION_BYTE_LENGTH).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

  const { error } = await getSupabaseClient().from('sessions').insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt,
  });

  if (error) {
    console.error('Failed to create session:', error);
    throw new Error('Failed to create session');
  }

  return rawToken;
}

/**
 * Validate a session token.
 * Looks up the token hash, checks expiry, and updates last_used_at.
 */
export async function getSession(token: string): Promise<{
  valid: boolean;
  error?: string;
  status?: number;
  userId?: string;
}> {
  if (!token || token.length < 32) {
    return { valid: false, error: 'Invalid session token.', status: 401 };
  }

  const tokenHash = hashToken(token);

  try {
    const { data: session, error: lookupError } = await getSupabaseClient()
      .from('sessions')
      .select('user_id, expires_at')
      .eq('token_hash', tokenHash)
      .single();

    if (lookupError || !session) {
      return { valid: false, error: 'Session not found. Please sign in again.', status: 401 };
    }

    if (new Date(session.expires_at) < new Date()) {
      // Clean up expired session
      await getSupabaseClient().from('sessions').delete().eq('token_hash', tokenHash);
      return { valid: false, error: 'Session expired. Please sign in again.', status: 401 };
    }

    // Update last_used_at asynchronously (don't block the response)
    getSupabaseClient()
      .from('sessions')
      .update({ last_used_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)
      .then(null, () => {});


    return { valid: true, userId: session.user_id };
  } catch (error) {
    console.error('Session lookup error:', error);
    return { valid: false, error: 'Session service error.', status: 500 };
  }
}
