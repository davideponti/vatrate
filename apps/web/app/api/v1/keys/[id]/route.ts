import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';
import { ERR, apiSuccess } from '@/lib/api-helpers';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return ERR.UNAUTHORIZED();
  }

  const { id: keyId } = await params;

  if (!keyId) {
    return ERR.VALIDATION('API key ID is required.');
  }

  try {
    // Verify the key belongs to the user
    const { data: existingKey, error: lookupError } = await getSupabaseClient()
      .from('api_keys')
      .select('id, user_id')
      .eq('id', keyId)
      .single();

    if (lookupError || !existingKey) {
      return ERR.NOT_FOUND('API key not found.');
    }

    if (existingKey.user_id !== auth.userId) {
      return ERR.FORBIDDEN('You can only revoke your own API keys.');
    }

    // Soft delete: set revoked_at instead of actually deleting
    const { error: updateError } = await getSupabaseClient()
      .from('api_keys')
      .update({
        is_active: false,
        revoked_at: new Date().toISOString(),
      })
      .eq('id', keyId);

    if (updateError) throw updateError;

    return apiSuccess({ message: 'API key revoked successfully.' });
  } catch (error) {
    console.error('Failed to revoke API key:', error);
    return ERR.INTERNAL('Failed to revoke API key.');
  }
}
