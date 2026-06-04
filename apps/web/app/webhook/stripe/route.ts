import { NextRequest, NextResponse } from 'next/server';

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
      console.log(`✅ Checkout completed: ${session.id} for ${session.customer_email}`);
      // TODO: Generate API key and store in Supabase
      break;
    }
    case 'invoice.paid': {
      const invoice = body.data.object;
      console.log(`💰 Invoice paid: ${invoice.id}`);
      // TODO: Update request limit for customer
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = body.data.object;
      console.log(`❌ Subscription deleted: ${subscription.id}`);
      // TODO: Revoke API key
      break;
    }
    default: {
      console.log(`📬 Unhandled event type: ${eventType}`);
    }
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
