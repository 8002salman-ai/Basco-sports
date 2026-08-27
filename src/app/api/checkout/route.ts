import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getServerEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

interface CheckoutItem {
  name: string;
  price: number; // dollars
  quantity: number;
  image?: string;
}

interface CheckoutBody {
  items: CheckoutItem[];
  email?: string;
  couponCode?: string;
  discountPercent?: number;
  successUrl?: string;
  cancelUrl?: string;
}

export async function POST(req: NextRequest) {
  const env = getServerEnv();

  if (!env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { ok: false, error: 'Stripe not configured – set STRIPE_SECRET_KEY in env' },
      { status: 503 },
    );
  }

  let body: CheckoutBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.items?.length) {
    return NextResponse.json({ ok: false, error: 'Cart is empty' }, { status: 400 });
  }

  const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-06-30.basil' as Stripe.LatestApiVersion,
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://basco-sports.vercel.app';
  const successUrl = body.successUrl || `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = body.cancelUrl || `${siteUrl}/checkout?cancelled=true`;

  // Build Stripe line items
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = body.items.map((item) => ({
    price_data: {
      currency: 'usd',
      product_data: {
        name: item.name,
        ...(item.image ? { images: [item.image] } : {}),
      },
      unit_amount: Math.round(item.price * 100), // Stripe expects cents
    },
    quantity: item.quantity,
  }));

  // Add discount if coupon
  const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
  if (body.couponCode && body.discountPercent && body.discountPercent > 0) {
    // Create a coupon for this checkout
    const coupon = await stripe.coupons.create({
      name: body.couponCode,
      percent_off: body.discountPercent,
      duration: 'once',
    });
    discounts.push({ coupon: coupon.id });
  }

  // Calculate subtotal for metadata
  const subtotal = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmt = body.discountPercent ? (subtotal * body.discountPercent) / 100 : 0;
  const tax = (subtotal - discountAmt) * 0.08;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      ...(discounts.length ? { discounts } : {}),
      customer_email: body.email || undefined,
      success_url: successUrl,
      cancel_url: cancelUrl,
      shipping_address_collection: {
        allowed_countries: ['US', 'GB', 'CA', 'AU', 'PK'],
      },
      phone_number_collection: { enabled: true },
      metadata: {
        orderId: `bs_${Date.now()}`,
        coupon: body.couponCode || 'none',
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
      },
      // Automatic tax calculation (optional, requires Stripe Tax setup)
      // automatic_tax: { enabled: true },
    });

    return NextResponse.json({
      ok: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (e) {
    const err = e as Error;
    return NextResponse.json(
      { ok: false, error: err.message || 'Failed to create checkout session' },
      { status: 500 },
    );
  }
}
