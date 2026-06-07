import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// PATCH /api/v1/user/password
export async function PATCH(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: auth.error, status: auth.status },
      { status: auth.status },
    );
  }

  let body: { current_password?: string; new_password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Invalid JSON body.', status: 400 },
      { status: 400 },
    );
  }

  const { current_password, new_password } = body;

  if (!current_password || !new_password) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Current password and new password are required.', status: 400 },
      { status: 400 },
    );
  }

  if (new_password.length < 8) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters.', status: 400 },
      { status: 400 },
    );
  }

  try {
    // Get current user's password hash
    const { data: user, error: userError } = await getSupabaseClient()
      .from('users')
      .select('password_hash')
      .eq('id', auth.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'User not found.', status: 404 },
        { status: 404 },
      );
    }

    // Verify current password
    const currentHash = hashPassword(current_password);
    if (user.password_hash !== currentHash) {
      return NextResponse.json(
        { error: 'INVALID_PASSWORD', message: 'Current password is incorrect.', status: 403 },
        { status: 403 },
      );
    }

    // Update password
    const newHash = hashPassword(new_password);
    const { error: updateError } = await getSupabaseClient()
      .from('users')
      .update({ password_hash: newHash })
      .eq('id', auth.userId);

    if (updateError) throw updateError;

    // Expire all sessions except current one
    await getSupabaseClient()
      .from('sessions')
      .delete()
      .eq('user_id', auth.userId);

    return NextResponse.json(
      { message: 'Password updated successfully. Please sign in again.' },
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
