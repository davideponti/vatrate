import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';
import { ERR, apiSuccess } from '@/lib/api-helpers';

// GET /api/v1/logs
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return ERR.UNAUTHORIZED();
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = parseInt(searchParams.get('offset') || '0');
    const keyId = searchParams.get('key_id');

    let query = getSupabaseClient()
      .from('api_logs')
      .select('id, method, path, status_code, ip_address, user_agent, response_time_ms, api_key_id, created_at', { count: 'exact' })
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (keyId) {
      query = query.eq('api_key_id', keyId);
    }

    const { data: logs, error, count } = await query;

    if (error) throw error;

    return apiSuccess({
      logs: logs || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Failed to fetch API logs:', error);
    return ERR.INTERNAL('Failed to fetch API logs.');
  }
}
