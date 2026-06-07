import { NextRequest } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';
import { ERR, apiSuccess } from '@/lib/api-helpers';

interface PlanInfo {
  label: string;
  price: number;
}

const PLAN_INFO: Record<string, PlanInfo> = {
  free: { label: 'Free', price: 0 },
  basic: { label: 'API Basic', price: 19 },
  pro: { label: 'API Pro', price: 49 },
  enterprise: { label: 'Enterprise', price: 149 },
};

// GET /api/v1/user/profile
export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return ERR.UNAUTHORIZED();
  }

  try {
    const { data: user, error } = await getSupabaseClient()
      .from('users')
      .select('id, email, plan, requests_limit, stripe_customer_id, created_at, updated_at')
      .eq('id', auth.userId)
      .single();

    if (error || !user) {
      return ERR.NOT_FOUND('User not found.');
    }

    // Get total API keys count
    const { count: apiKeysCount } = await getSupabaseClient()
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .eq('is_active', true)
      .is('revoked_at', null);

    // Get usage stats
    const { data: usageData } = await getSupabaseClient()
      .from('api_keys')
      .select('requests_used, requests_limit')
      .eq('user_id', auth.userId)
      .eq('is_active', true)
      .is('revoked_at', null);

    const totalUsed = usageData?.reduce((sum, k) => sum + (k.requests_used || 0), 0) || 0;
    const totalLimit = usageData?.[0]?.requests_limit || user.requests_limit || 100;

    const plan = PLAN_INFO[user.plan] || PLAN_INFO.free;

    return apiSuccess({
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        plan_label: plan.label,
        plan_price: plan.price,
        requests_limit: totalLimit,
        requests_used: totalUsed,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
      api_keys_count: apiKeysCount || 0,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return ERR.INTERNAL('Failed to fetch profile.');
  }
}
