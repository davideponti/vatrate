import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { verifyPassword, hashPassword } from '@/lib/password';
import { authenticateRequest, isValidPassword } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';
import { ERR, apiSuccess, authError } from '@/lib/api-helpers';

// PUT /api/v1/user/password
export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return authError(auth);
  }

  // CSRF protection for session-based requests (not API key requests)
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer vr_')) {
    const csrfError = validateCsrf(request);
    if (csrfError) return csrfError;
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return ERR.VALIDATION('Invalid JSON body.');
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return ERR.VALIDATION('Current password and new password are required.');
  }

  if (!isValidPassword(newPassword)) {
    return ERR.VALIDATION(
      'New password must be at least 8 characters with uppercase, lowercase, and a number.',
    );
  }

  try {
    // Get user's current password hash
    const { data: user, error: userError } = await getSupabaseClient()
      .from('users')
      .select('password_hash')
      .eq('id', auth.userId)
      .single();

    if (userError || !user?.password_hash) {
      return ERR.NOT_FOUND('User not found.');
    }

    // Verify current password with bcrypt
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return ERR.INVALID_CREDENTIALS();
    }

    // Hash new password with bcrypt
    const newPasswordHash = await hashPassword(newPassword);

    // Update password
    const { error: updateError } = await getSupabaseClient()
      .from('users')
      .update({
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auth.userId);

    if (updateError) throw updateError;

    // Invalidate all sessions except current
    const sessionToken = request.cookies.get('session')?.value;
    if (sessionToken) {
      const crypto = await import('crypto');
      const currentTokenHash = crypto.default
        .createHash('sha256')
        .update(sessionToken)
        .digest('hex');

      // Delete all sessions for user except current one
      await getSupabaseClient()
        .from('sessions')
        .delete()
        .eq('user_id', auth.userId)
        .neq('token_hash', currentTokenHash);
    }

    return apiSuccess({ message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Password change error:', error);
    return ERR.INTERNAL('Failed to update password.');
  }
}
