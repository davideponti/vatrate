import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { verifyPassword, hashPassword } from '@/lib/password';
import { authenticateRequest, isValidPassword } from '@/lib/auth';
import { validateCsrf } from '@/lib/csrf';

// PUT /api/v1/user/password
export async function PUT(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: auth.error, status: auth.status },
      { status: auth.status! },
    );
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
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Invalid JSON body.', status: 400 },
      { status: 400 },
    );
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'Current password and new password are required.',
        status: 400,
      },
      { status: 400 },
    );
  }

  if (!isValidPassword(newPassword)) {
    return NextResponse.json(
      {
        error: 'VALIDATION_ERROR',
        message: 'New password must be at least 8 characters with uppercase, lowercase, and a number.',
        status: 400,
      },
      { status: 400 },
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
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'User not found.', status: 404 },
        { status: 404 },
      );
    }

    // Verify current password with bcrypt
    const isValid = await verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'INVALID_PASSWORD', message: 'Current password is incorrect.', status: 401 },
        { status: 401 },
      );
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

    return NextResponse.json(
      { message: 'Password updated successfully.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update password.', status: 500 },
      { status: 500 },
    );
  }
}
