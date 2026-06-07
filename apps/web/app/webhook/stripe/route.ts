import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseClient } from '@/lib/supabase';
import { generateApiKey } from '@/lib/api-key';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2026-05-27.dahlia',
});


/** Allowed metadata keys for plan */
const ALLOWED_PLANS = ['free', 'basic', 'pro', 'enterprise', 'widget'] as const;
type Plan = (typeof ALLOWED_PLANS)[number];

const PLAN_LIMITS: Record<Plan, number> = {
  free: 100,
  basic: 1000,
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
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Invalid Stripe signature:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const eventType = event.type;

  switch (eventType) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const email = session.customer_email;
      const stripeCustomerId = session.customer as string;
      const plan = session.metadata?.plan || 'basic';

      console.log(`✅ Checkout completed: ${session.id} for ${email}`);

      if (!email) {
        console.error('No email in session');
        break;
      }

      const requestsLimit = getPlanLimit(plan);

      try {
        // Check if user exists
        const { data: existingUser } = await getSupabaseClient()
          .from('users')
          .select('id')
          .eq('email', email.toLowerCase())
          .single();

        let userId: string;

        if (existingUser) {
          userId = existingUser.id;
          await getSupabaseClient()
            .from('users')
            .update({
              plan,
              requests_limit: requestsLimit,
              stripe_customer_id: stripeCustomerId,
            })
            .eq('id', userId);
        } else {
          const { data: newUser } = await getSupabaseClient()
            .from('users')
            .insert({
              email: email.toLowerCase(),
              stripe_customer_id: stripeCustomerId,
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

        console.log(`🔑 API key generated for ${email}: ${keyPrefix}...`);
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

export const config = {
  api: {
    bodyParser: false,
  },
};
