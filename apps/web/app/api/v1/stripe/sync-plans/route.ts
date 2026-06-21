import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';
import { authError } from '@/lib/api-helpers';

const ALLOWED_PLANS = ['free', 'basic', 'pro', 'enterprise', 'widget'] as const;
type Plan = (typeof ALLOWED_PLANS)[number];

const PLAN_LIMITS: Record<Plan, number> = {
  free: 100,
  basic: 3000,
  pro: 10000,
  enterprise: 100000,
  widget: 50000,
};

function isValidPlan(plan: string | undefined | null): plan is Plan {
  return ALLOWED_PLANS.includes(plan as Plan);
}

function getPlanLimit(plan: Plan): number {
  return PLAN_LIMITS[plan];
}

/**
 * Sync the current user's plan from their active Stripe subscription.
 * POST /api/v1/stripe/sync-plans
 *
 * This is called automatically when the user visits their settings page.
 * It reads the user's active subscriptions from Stripe and updates
 * the local database if a paid plan is found.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return authError(auth);
  }

  const { default: Stripe } = await import('stripe');
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey || stripeSecretKey === 'sk_test_...') {
    return NextResponse.json(
      { synced: false, message: 'Stripe not configured' },
      { status: 200 }
    );
  }

  const stripeClient = new Stripe(stripeSecretKey, {
    apiVersion: '2026-05-27.dahlia',
  });

  try {
    // Get the user's stripe_customer_id
    const { data: user, error } = await getSupabaseClient()
      .from('users')
      .select('id, email, stripe_customer_id, plan, requests_limit')
      .eq('id', auth.userId)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { synced: false, message: 'User not found' },
        { status: 404 }
      );
    }

    // If no stripe_customer_id, try to find one by email
    let stripeCustomerId = user.stripe_customer_id;

    if (!stripeCustomerId && user.email) {
      try {
        const customers = await stripeClient.customers.list({
          email: user.email,
          limit: 1,
        });
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id;
          // Save it for future use
          await getSupabaseClient()
            .from('users')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', auth.userId);
        }
      } catch (e) {
        console.error('[Sync] Error finding Stripe customer by email:', e);
      }
    }

    if (!stripeCustomerId) {
      // No Stripe customer — definitely on free plan
      return NextResponse.json({
        synced: true,
        plan: user.plan,
        requests_limit: user.requests_limit,
        message: 'No Stripe customer found. You are on the free plan.',
      });
    }

    // Fetch active subscriptions from Stripe
    const subscriptions = await stripeClient.subscriptions.list({
      customer: stripeCustomerId,
      status: 'active',
      limit: 10,
    });

    if (subscriptions.data.length === 0) {
      // No active subscriptions — should be free
      if (user.plan !== 'free') {
        await getSupabaseClient()
          .from('users')
          .update({ plan: 'free', requests_limit: 100, updated_at: new Date().toISOString() })
          .eq('id', auth.userId);

        await getSupabaseClient()
          .from('api_keys')
          .update({ plan: 'free', requests_limit: 100 })
          .eq('user_id', auth.userId)
          .eq('is_active', true)
          .is('revoked_at', null);
      }

      return NextResponse.json({
        synced: true,
        plan: 'free',
        requests_limit: 100,
        message: 'No active subscriptions. Downgraded to free.',
      });
    }

    // Extract plan from the first active subscription
    const sub = subscriptions.data[0];
    let plan: string | null = null;

    // Try metadata
    if (sub.metadata?.plan && isValidPlan(sub.metadata.plan)) {
      plan = sub.metadata.plan;
    }

    // Try price metadata
    const price = sub.items?.data?.[0]?.price;
    if (!plan && price?.metadata?.plan && isValidPlan(price.metadata.plan)) {
      plan = price.metadata.plan;
    }

    // Fallback: infer from amount
    if (!plan && price?.unit_amount) {
      const amountMap: Record<number, string> = {
        1900: 'basic',
        4900: 'pro',
        14900: 'enterprise',
      };
      plan = amountMap[price.unit_amount] || null;
    }

    if (!plan || !isValidPlan(plan)) {
      return NextResponse.json({
        synced: false,
        plan: user.plan,
        requests_limit: user.requests_limit,
        message: 'Could not determine plan from subscription.',
      });
    }

    const requestsLimit = getPlanLimit(plan);

    // Update user if plan changed
    if (user.plan !== plan || user.requests_limit !== requestsLimit) {
      await getSupabaseClient()
        .from('users')
        .update({
          plan,
          requests_limit: requestsLimit,
          stripe_customer_id: stripeCustomerId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', auth.userId);

      // Update API keys too
      await getSupabaseClient()
        .from('api_keys')
        .update({ plan, requests_limit: requestsLimit })
        .eq('user_id', auth.userId)
        .eq('is_active', true)
        .is('revoked_at', null);

      console.log(`[Sync] User ${auth.userId} synced to ${plan} (${requestsLimit} reqs/month)`);
    }

    return NextResponse.json({
      synced: true,
      plan,
      requests_limit: requestsLimit,
      message: `Plan synced successfully to ${plan}.`,
    });
  } catch (error) {
    console.error('[Sync] Error syncing plan:', error);
    return NextResponse.json(
      { synced: false, message: 'Failed to sync plan.' },
      { status: 500 }
    );
  }
}
