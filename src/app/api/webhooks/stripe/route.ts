import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerEnv } from '@/lib/env';
import { SupabaseAdapter } from '@/lib/admin/db';
import { sendOrderConfirmation } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * Stripe Webhook Handler
 *
 * Handles checkout.session.completed events to:
 * 1. Verify the webhook signature (prevents spoofing)
 * 2. Save the order to the orders table (Supabase or localStorage)
 * 3. Send confirmation email (future: Resend / SendGrid)
 *
 * Set STRIPE_WEBHOOK_SECRET in env to enable signature verification.
 * Stripe Dashboard → Developers → Webhooks → Add endpoint:
 *   URL: https://your-domain.com/api/webhooks/stripe
 *   Events: checkout.session.completed
 */

export async function POST(req: NextRequest) {
  const env = getServerEnv();

  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ ok: false, error: 'Stripe not configured' }, { status: 503 });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-06-30.basil' as Stripe.LatestApiVersion,
  });

  // Get raw body for signature verification
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event: Stripe.Event;

  // Verify webhook signature if secret is configured
  if (env.STRIPE_WEBHOOK_SECRET && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      const message = (err as Error).message;
      console.error('⚠️ Webhook signature verification failed:', message);
      return NextResponse.json({ ok: false, error: `Webhook Error: ${message}` }, { status: 400 });
    }
  } else {
    // Without webhook secret, parse JSON directly (dev mode only)
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
    }
  }

  // Handle checkout.session.completed
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    try {
      await handleCheckoutComplete(session);
    } catch (err) {
      console.error('Error processing checkout:', err);
      // Return 200 to prevent Stripe retries during dev
    }
  }

  return NextResponse.json({ ok: true, received: true });
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const env = getServerEnv();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!env.SUPABASE_SERVICE_ROLE_KEY || !supabaseUrl) {
    console.warn('DB not configured – order not saved');
    return;
  }

  const adapter = new SupabaseAdapter(supabaseUrl, env.SUPABASE_SERVICE_ROLE_KEY, env.SUPABASE_SERVICE_ROLE_KEY);

  // Fetch line items from Stripe
  const stripe = new Stripe(env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-06-30.basil' as Stripe.LatestApiVersion,
  });

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id);

  const now = new Date().toISOString();
  const orderId = session.metadata?.orderId || `stripe_${Date.now()}`;
  const orderNumber = `BS-${orderId.slice(-6)}`;

  const order = {
    id: orderId,
    orderNumber,
    customerEmail: session.customer_email || session.customer_details?.email || '',
    customerName: session.customer_details?.name || undefined,
    items: lineItems.data.map((item, idx) => ({
      id: `${orderId}-${idx}`,
      name: item.description || item.price?.product?.toString() || `Item ${idx + 1}`,
      quantity: item.quantity || 1,
      price: (item.amount_total || 0) / (item.quantity || 1) / 100, // Convert cents back to dollars
    })),
    subtotal: (session.amount_subtotal || 0) / 100,
    discount: session.total_details?.amount_discount ? session.total_details.amount_discount / 100 : 0,
    tax: session.total_details?.amount_tax ? session.total_details.amount_tax / 100 : 0,
    total: (session.amount_total || 0) / 100,
    currency: session.currency || 'usd',
    status: 'paid' as const,
    coupon: session.metadata?.coupon !== 'none' ? session.metadata?.coupon : undefined,
    createdAt: now,
    updatedAt: now,
  };

  // Save to orders table
  try {
    await adapter.insert('orders', order);
    console.log(`✅ Order ${orderNumber} saved to DB (Stripe checkout)`);
  } catch (err) {
    console.error(`❌ Failed to save order ${orderNumber}:`, err);
  }

  // Send confirmation email
  try {
    await sendOrderConfirmation({
      orderNumber,
      customerEmail: order.customerEmail,
      items: order.items,
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      total: order.total,
      currency: order.currency,
      coupon: order.coupon,
      createdAt: order.createdAt,
    });
  } catch (err) {
    console.warn(`⚠️  Email send failed for ${orderNumber}:`, err);
  }
}
