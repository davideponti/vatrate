import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase';
import { authenticateRequest } from '@/lib/auth';

const PLAN_PRICES: Record<string, { price_id: string; amount: number }> = {
  basic: { price_id: '', amount: 1900 },   // €19
  pro: { price_id: '', amount: 4900 },     // €49
  enterprise: { price_id: '', amount: 14900 }, // €149
};

const PLAN_LIMITS: Record<string, number> = {
  basic: 3000,
  pro: 10000,
  enterprise: 100000,
};

// POST /api/v1/stripe/checkout
export async function POST(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth.authenticated) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'You must be logged in to subscribe.', status: 401 },
      { status: 401 },
    );
  }

  let body: { plan?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Invalid JSON body.', status: 400 },
      { status: 400 },
    );
  }

  const { plan } = body;

  if (!plan || !PLAN_PRICES[plan]) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Invalid plan. Choose basic, pro, or enterprise.', status: 400 },
      { status: 400 },
    );
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey || stripeSecretKey === 'sk_test_...') {
    return NextResponse.json(
      { error: 'STRIPE_NOT_CONFIGURED', message: 'Stripe is not configured yet. Please set STRIPE_SECRET_KEY in .env.local', status: 500 },
      { status: 500 },
    );
  }

  try {
    const stripe = await import('stripe');
    const stripeClient = new stripe.default(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia' as any,
    });

    // Get user info
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

    let stripeCustomerId = user.stripe_customer_id;

    // Create Stripe customer if not exists
    if (!stripeCustomerId) {
      const customer = await stripeClient.customers.create({
        email: user.email,
        metadata: { user_id: auth.userId || '' },
      });
      stripeCustomerId = customer.id;

      await getSupabaseClient()
        .from('users')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', auth.userId);
    }

    const planInfo = PLAN_PRICES[plan];
    const origin = request.nextUrl.origin;

    // Create or get price
    let priceId = planInfo.price_id;

    if (!priceId) {
      // Create a one-time price for this plan
      const product = await stripeClient.products.create({
        name: `VATRate ${plan.charAt(0).toUpperCase() + plan.slice(1)}`,
        description: `${PLAN_LIMITS[plan].toLocaleString()} API requests/month`,
        metadata: { plan },
      });

      const price = await stripeClient.prices.create({
        product: product.id,
        unit_amount: planInfo.amount,
        currency: 'eur',
        recurring: { interval: 'month' },
        metadata: { plan },
      });

      priceId = price.id;
    }

    // Create Checkout Session
    const session = await stripeClient.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        plan,
        user_id: auth.userId || '',
      },
      success_url: `${origin}/dashboard/settings?checkout=success`,
      cancel_url: `${origin}/pricing?canceled=true`,
    });

    return NextResponse.json({
      redirect_url: session.url,
    }, { status: 200 });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'STRIPE_ERROR', message: 'Failed to create checkout session.', status: 500 },
      { status: 500 },
    );
  }
}
