import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getSupabaseClient } from '@/lib/supabase';
import { generateApiKey } from '@/lib/api-key';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

async function getStripeClient(): Promise<Stripe> {
  const { default: Stripe } = await import('stripe');
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
  return new Stripe(stripeSecretKey, {
    apiVersion: '2026-05-27.dahlia',
  });
}


/** Allowed metadata keys for plan */
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

function getPlanLimit(plan: string | undefined | null): number {
  if (isValidPlan(plan)) return PLAN_LIMITS[plan];
  return 1000;
}

/**
 * Stripe webhook handler with signature verification.
 * Processes subscription events to manage API keys and user plans.
 */
export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripeClient = await getStripeClient();
    event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Invalid Stripe signature:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const eventType = event.type;

  switch (eventType) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const stripeCustomerId = session.customer as string;
      const plan = session.metadata?.plan || 'basic';
      const sessionEmail = session.customer_details?.email || session.customer_email || undefined;

      console.log(`✅ Checkout completed: ${session.id} for ${sessionEmail || stripeCustomerId}`);

      if (!sessionEmail && !stripeCustomerId) {
        console.error('No email or customer ID in session');
        break;
      }

      const requestsLimit = getPlanLimit(plan);

      try {
        let userId: string | null = null;

        // 1) Try to find user by email (for sessions created with customer_email)
        if (sessionEmail) {
          const { data: existingUser } = await getSupabaseClient()
            .from('users')
            .select('id')
            .eq('email', sessionEmail.toLowerCase())
            .single();

          if (existingUser) {
            userId = existingUser.id;
          }
        }

        // 2) Fallback: try to find user by stripe_customer_id (for sessions created with customer)
        if (!userId && stripeCustomerId) {
          const { data: userByCustomer } = await getSupabaseClient()
            .from('users')
            .select('id')
            .eq('stripe_customer_id', stripeCustomerId)
            .single();

          if (userByCustomer) {
            userId = userByCustomer.id;
          }
        }

        // 3) Verify user_id in metadata if present — prevents session hijacking
        const metadataUserId = session.metadata?.user_id;
        if (metadataUserId && userId && metadataUserId !== userId) {
          console.warn(
            `⚠️ Checkout session ${session.id}: metadata.user_id (${metadataUserId}) ` +
            `doesn't match resolved user (${userId}). Could be a session mismatch.`
          );
        }

        if (userId) {
          // Update existing user's plan
          const updateData: Record<string, unknown> = {
            plan,
            requests_limit: requestsLimit,
            updated_at: new Date().toISOString(),
          };
          if (stripeCustomerId) {
            updateData.stripe_customer_id = stripeCustomerId;
          }

          await getSupabaseClient()
            .from('users')
            .update(updateData)
            .eq('id', userId);

          // Also update existing active API keys with the new plan
          await getSupabaseClient()
            .from('api_keys')
            .update({ plan, requests_limit: requestsLimit })
            .eq('user_id', userId)
            .eq('is_active', true)
            .is('revoked_at', null);

          console.log(`📦 Plan upgraded for user ${userId}: ${plan} (${requestsLimit} reqs/month)`);
        } else if (sessionEmail) {
          // Create new user
          const { data: newUser } = await getSupabaseClient()
            .from('users')
            .insert({
              email: sessionEmail.toLowerCase(),
              stripe_customer_id: stripeCustomerId || null,
              plan,
              requests_limit: requestsLimit,
              email_verified: true,
            })
            .select('id')
            .single();

          if (!newUser) {
            console.error('Failed to create user');
            break;
          }
          userId = newUser.id;
        } else {
          console.error('Cannot resolve user — no email and no matching stripe_customer_id');
          break;
        }

        // Generate and store API key
        const { keyPrefix, keyHash } = generateApiKey('live');

        await getSupabaseClient().from('api_keys').insert({
          user_id: userId,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          name: 'Auto-generated',
          environment: 'live',
          plan,
          requests_limit: requestsLimit,
        });

        console.log(`🔑 API key generated for user ${userId}: ${keyPrefix}...`);
      } catch (error) {
        console.error('Failed to process checkout:', error);
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const scId = invoice.customer as string;
      console.log(`💰 Invoice paid: ${invoice.id}`);

      try {
        await getSupabaseClient()
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', scId);
      } catch (error) {
        console.error('Failed to update invoice status:', error);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const scId = subscription.customer as string;
      console.log(`❌ Subscription deleted: ${subscription.id}`);

      try {
        const { data: user } = await getSupabaseClient()
          .from('users')
          .select('id')
          .eq('stripe_customer_id', scId)
          .single();

        if (user) {
          await getSupabaseClient()
            .from('users')
            .update({ plan: 'free', requests_limit: 100 })
            .eq('id', user.id);

          await getSupabaseClient()
            .from('api_keys')
            .update({ is_active: false, revoked_at: new Date().toISOString() })
            .eq('user_id', user.id);
        }
      } catch (error) {
        console.error('Failed to process subscription deletion:', error);
      }
      break;
    }

    default: {
      console.log(`📬 Unhandled event type: ${eventType}`);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
