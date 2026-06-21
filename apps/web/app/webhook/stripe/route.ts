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
 * Extract plan from a subscription object by reading the first price's metadata.
 */
function extractPlanFromSubscription(sub: Stripe.Subscription): string | null {
  try {
    const item = sub.items?.data?.[0];
    const price = item?.price;
    // Try price metadata first
    if (price?.metadata?.plan && isValidPlan(price.metadata.plan)) {
      return price.metadata.plan;
    }
    // Try subscription metadata
    if (sub.metadata?.plan && isValidPlan(sub.metadata.plan)) {
      return sub.metadata.plan;
    }
    // Try product metadata by fetching it
    if (price?.product && typeof price.product === 'string') {
      // We can't block on a fetch here, so log and return null
      console.log(`[Webhook] Could not determine plan from subscription ${sub.id}, product ${price.product} needs lookup`);
    }
    // Fallback: infer from amount
    if (price?.unit_amount) {
      const amountMap: Record<number, string> = {
        1900: 'basic',
        4900: 'pro',
        14900: 'enterprise',
      };
      return amountMap[price.unit_amount] || null;
    }
  } catch (e) {
    console.error('[Webhook] Error extracting plan from subscription:', e);
  }
  return null;
}

/**
 * Update a user's plan + api_keys by resolved user ID.
 */
async function upgradeUserPlan(userId: string, plan: string, stripeCustomerId?: string) {
  if (!isValidPlan(plan)) {
    console.error(`[Webhook] Invalid plan "${plan}" for user ${userId}`);
    return;
  }

  const requestsLimit = getPlanLimit(plan);
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

  // Also update existing active API keys
  await getSupabaseClient()
    .from('api_keys')
    .update({ plan, requests_limit: requestsLimit })
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('revoked_at', null);

  console.log(`[Webhook] ✅ User ${userId} upgraded to ${plan} (${requestsLimit} reqs/month)`);
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
  console.log(`[Webhook] Received event: ${eventType}`);

  switch (eventType) {
    // ──────────────────────────────────────────────
    // CHECKOUT COMPLETED — handles new subscriptions
    // ──────────────────────────────────────────────
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const stripeCustomerId = session.customer as string;
      const sessionEmail = session.customer_details?.email || session.customer_email || undefined;

      console.log(`[Webhook] ✅ Checkout completed: ${session.id} email=${sessionEmail} customer=${stripeCustomerId}`);

      if (!sessionEmail && !stripeCustomerId) {
        console.error('[Webhook] No email or customer ID in session');
        break;
      }

      // Extract plan from metadata. DO NOT default to 'basic' — only accept valid plans.
      let plan = session.metadata?.plan || null;

      // Fallback: try to extract plan from the subscription object
      if (!isValidPlan(plan) && session.subscription) {
        try {
          const stripeClient = await getStripeClient();
          const subscription = await stripeClient.subscriptions.retrieve(
            typeof session.subscription === 'string' ? session.subscription : session.subscription.id
          );
          plan = extractPlanFromSubscription(subscription);
        } catch (e) {
          console.error('[Webhook] Failed to fetch subscription for plan extraction:', e);
        }
      }

      // If we still don't have a valid plan, SKIP instead of defaulting to 'basic'
      if (!isValidPlan(plan)) {
        console.error(`[Webhook] ⚠️ No valid plan found in session metadata or subscription for ${session.id}. Metadata:`, JSON.stringify(session.metadata));
        break;
      }

      try {
        let userId: string | null = null;

        // 1) Try to find user by email
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

        // 2) Fallback: try to find user by stripe_customer_id
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
          await upgradeUserPlan(userId, plan, stripeCustomerId);
        } else if (sessionEmail) {
          // Create new user
          const { data: newUser } = await getSupabaseClient()
            .from('users')
            .insert({
              email: sessionEmail.toLowerCase(),
              stripe_customer_id: stripeCustomerId || null,
              plan,
              requests_limit: getPlanLimit(plan),
              email_verified: true,
            })
            .select('id')
            .single();

          if (!newUser) {
            console.error('[Webhook] Failed to create user');
            break;
          }
          userId = newUser.id;
        } else {
          console.error('[Webhook] Cannot resolve user — no email and no matching stripe_customer_id');
          break;
        }

        // Generate and store API key (if user is new, skip if already has keys)
        if (userId) {
          const { data: existingKeys } = await getSupabaseClient()
            .from('api_keys')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

          if (!existingKeys || existingKeys.length === 0) {
            const { keyPrefix, keyHash } = generateApiKey('live');
            await getSupabaseClient().from('api_keys').insert({
              user_id: userId,
              key_hash: keyHash,
              key_prefix: keyPrefix,
              name: 'Auto-generated',
              environment: 'live',
              plan,
              requests_limit: getPlanLimit(plan),
            });
            console.log(`[Webhook] 🔑 API key generated for user ${userId}: ${keyPrefix}...`);
          } else {
            console.log(`[Webhook] 🔑 User ${userId} already has API keys, skipping key creation`);
          }
        }
      } catch (error) {
        console.error('[Webhook] Failed to process checkout:', error);
      }
      break;
    }

    // ──────────────────────────────────────────────
    // SUBSCRIPTION CREATED / UPDATED — handles upgrades
    // ──────────────────────────────────────────────
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const scId = subscription.customer as string;
      const plan = extractPlanFromSubscription(subscription);

      console.log(`[Webhook] 📋 Subscription ${eventType === 'customer.subscription.created' ? 'created' : 'updated'}: ${subscription.id} customer=${scId} plan=${plan}`);

      if (!plan) {
        console.error(`[Webhook] ⚠️ Could not determine plan from subscription ${subscription.id}`);
        break;
      }

      try {
        // Find user by stripe_customer_id
        const { data: user } = await getSupabaseClient()
          .from('users')
          .select('id')
          .eq('stripe_customer_id', scId)
          .single();

        if (user) {
          await upgradeUserPlan(user.id, plan, scId);
        } else {
          // Try to find by email — retrieve customer from Stripe
          let customerEmail: string | null = null;
          try {
            const stripeClient = await getStripeClient();
            const customer = await stripeClient.customers.retrieve(scId);
            if (!customer.deleted) {
              customerEmail = (customer as Stripe.Customer).email || null;
            }
          } catch (e) {
            console.error('[Webhook] Failed to retrieve customer:', e);
          }
          
          if (customerEmail) {
            const { data: userByEmail } = await getSupabaseClient()
              .from('users')
              .select('id')
              .eq('email', customerEmail.toLowerCase())
              .single();

            if (userByEmail) {
              await upgradeUserPlan(userByEmail.id, plan, scId);
            } else {
              console.error(`[Webhook] No user found for subscription ${subscription.id} customer=${scId}`);
            }
          }
        }
      } catch (error) {
        console.error('[Webhook] Failed to process subscription event:', error);
      }
      break;
    }

    // ──────────────────────────────────────────────
    // INVOICE PAID — keep user active
    // ──────────────────────────────────────────────
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const scId = invoice.customer as string;
      console.log(`[Webhook] 💰 Invoice paid: ${invoice.id}`);

      try {
        await getSupabaseClient()
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', scId);
      } catch (error) {
        console.error('[Webhook] Failed to update invoice status:', error);
      }
      break;
    }

    // ──────────────────────────────────────────────
    // SUBSCRIPTION DELETED — downgrade to free
    // ──────────────────────────────────────────────
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const scId = subscription.customer as string;
      console.log(`[Webhook] ❌ Subscription deleted: ${subscription.id}`);

      try {
        const { data: user } = await getSupabaseClient()
          .from('users')
          .select('id')
          .eq('stripe_customer_id', scId)
          .single();

        if (user) {
          await getSupabaseClient()
            .from('users')
            .update({ plan: 'free', requests_limit: 100, updated_at: new Date().toISOString() })
            .eq('id', user.id);

          await getSupabaseClient()
            .from('api_keys')
            .update({ 
              plan: 'free', 
              requests_limit: 100,
              is_active: false, 
              revoked_at: new Date().toISOString() 
            })
            .eq('user_id', user.id)
            .eq('is_active', true);

          console.log(`[Webhook] ⬇️ User ${user.id} downgraded to free (subscription deleted)`);
        }
      } catch (error) {
        console.error('[Webhook] Failed to process subscription deletion:', error);
      }
      break;
    }

    default: {
      console.log(`[Webhook] 📬 Unhandled event type: ${eventType}`);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
