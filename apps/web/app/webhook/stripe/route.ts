import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { generateApiKey } from '@/lib/api-key';

/**
 * Stripe webhook handler.
 * Processes subscription events to manage API keys.
 */
export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const eventType = body.type;

  switch (eventType) {
    case 'checkout.session.completed': {
      const session = body.data.object;
      const email = session.customer_email;
      const stripeCustomerId = session.customer;
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

        if (existingUser) {
          userId = existingUser.id;
          // Update user's plan
          const limits: Record<string, number> = {
            basic: 1000,
            pro: 10000,
            enterprise: 100000,
            widget: 50000,
          };
          await getSupabaseClient()
            .from('users')
            .update({
              plan,
              requests_limit: limits[plan] || 1000,
              stripe_customer_id: stripeCustomerId,
            })
            .eq('id', userId);
        } else {
          // Create new user (with email_verified=true since they paid via Stripe)
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
        const { fullKey, keyPrefix, keyHash } = generateApiKey('live');
        const limits: Record<string, number> = {
          basic: 1000,
          pro: 10000,
          enterprise: 100000,
          widget: 50000,
        };

        await getSupabaseClient().from('api_keys').insert({
          user_id: userId,
          key_hash: keyHash,
          key_prefix: keyPrefix,
          name: 'Auto-generated',
          environment: 'live',
          plan,
          requests_limit: limits[plan] || 1000,
        });

        // TODO: Send email to user with their API key
        console.log(`🔑 API key generated for ${email}: ${keyPrefix}...`);
      } catch (error) {
        console.error('Failed to process checkout:', error);
      }
      break;
    }

    case 'invoice.paid': {
      const invoice = body.data.object;
      const stripeCustomerId = invoice.customer;
      console.log(`💰 Invoice paid: ${invoice.id}`);

      // Update user's status (reset usage, extend expiration, etc.)
      try {
        await getSupabaseClient()
          .from('users')
          .update({ updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', stripeCustomerId);
      } catch (error) {
        console.error('Failed to update invoice status:', error);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = body.data.object;
      const stripeCustomerId = subscription.customer;
      console.log(`❌ Subscription deleted: ${subscription.id}`);

      // Downgrade user to free plan
      try {
        const { data: user } = await getSupabaseClient()
          .from('users')
          .select('id')
          .eq('stripe_customer_id', stripeCustomerId)
          .single();

        if (user) {
          await getSupabaseClient()
            .from('users')
            .update({ plan: 'free', requests_limit: 100 })
            .eq('id', user.id);

          // Revoke all API keys for this user
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
