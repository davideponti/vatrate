import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseClient } from '@/lib/supabase';
import { generateApiKey } from '@/lib/api-key';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * Stripe webhook handler.
 * Processes subscription events to manage API keys.
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
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

      try {
        // Check if user exists
        const { data: existingUser } = await getSupabaseClient()
          .from('users')
          .select('id')
          .eq('email', email)
          .single();

        let userId: string;

        const limits: Record<string, number> = {
          basic: 1000,
          pro: 10000,
          enterprise: 100000,
          widget: 50000,
        };

        if (existingUser) {
          userId = existingUser.id;
          await getSupabaseClient()
            .from('users')
            .update({
              plan,
              requests_limit: limits[plan] || 1000,
              stripe_customer_id: stripeCustomerId,
            })
            .eq('id', userId);
        } else {
          const { data: newUser } = await getSupabaseClient()
            .from('users')
            .insert({
              email,
              stripe_customer_id: stripeCustomerId,
              plan,
              requests_limit: 1000,
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
          requests_limit: limits[plan] || 1000,
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
