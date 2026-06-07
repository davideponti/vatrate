import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';

// POST /api/v1/stripe/portal
// Creates a Stripe Customer Portal session for managing subscriptions
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: auth.error, status: auth.status },
      { status: auth.status },
    );
  }

  try {
    const { data: user } = await getSupabaseClient()
      .from('users')
      .select('email, stripe_customer_id')
      .eq('id', auth.userId)
      .single();

    if (!user || !user.email) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'User not found.', status: 404 },
        { status: 404 },
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey || stripeSecretKey === 'sk_test_...') {
      // Stripe not configured yet - redirect to pricing page
      return NextResponse.json({
        redirect_url: '/pricing',
        message: 'Stripe is not configured. Please set up Stripe keys.',
      }, { status: 200 });
    }

    const { default: Stripe } = await import('stripe');
    const stripeClient = new Stripe(stripeSecretKey, {
      apiVersion: '2026-05-27.dahlia',
    });

    let stripeCustomerId = user.stripe_customer_id;

    // If user doesn't have a Stripe customer ID, create one
    if (!stripeCustomerId) {
      const customer = await stripeClient.customers.create({
        email: user.email,
        metadata: {
          user_id: auth.userId || '',
        },
      });
      stripeCustomerId = customer.id;

      // Save Stripe customer ID
      await getSupabaseClient()
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', auth.userId);
    }

    // Create a Customer Portal session
    const session = await stripeClient.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${request.nextUrl.origin}/dashboard/settings`,
    });

    return NextResponse.json({
      redirect_url: session.url,
    }, { status: 200 });
  } catch (error) {
    console.error('Stripe portal error:', error);
    return NextResponse.json(
      { error: 'STRIPE_ERROR', message: 'Failed to create portal session.', status: 500 },
      { status: 500 },
    );
  }
}
