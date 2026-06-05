import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: auth.error, status: auth.status },
      { status: auth.status },
    );
  }

  const { id: keyId } = params;

  if (!keyId) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'API key ID is required.', status: 400 },
      { status: 400 },
    );
  }

  try {
    // Verify the key belongs to the user
    const { data: existingKey, error: lookupError } = await supabase
      .from('api_keys')
      .select('id, user_id')
      .eq('id', keyId)
      .single();

    if (lookupError || !existingKey) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'API key not found.', status: 404 },
        { status: 404 },
      );
    }

    if (existingKey.user_id !== auth.userId) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'You can only revoke your own API keys.',
          status: 403,
        },
        { status: 403 },
      );
    }

    // Soft delete: set revoked_at instead of actually deleting
    const { error: updateError } = await supabase
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', keyId);

    if (updateError) throw updateError;

    return NextResponse.json(
      { message: 'API key revoked successfully.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to revoke API key.', status: 500 },
      { status: 500 },
    );
  }
}
