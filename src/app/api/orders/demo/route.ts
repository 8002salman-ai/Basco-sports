import { NextRequest, NextResponse } from 'next/server';
import { products } from '@/data/products';
import { getServerEnv } from '@/lib/env';
import { createOrder } from '@/lib/orders';
import type { AdminOrderItem } from '@/lib/admin/types';
import { DEMO_COUPONS } from '@/lib/coupons';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * Public demo-order endpoint.
 *
 * Demo checkout used to insert full order rows through /api/admin/db, whose
 * auth gate is anonymous whenever admin env is unset — so anyone could list
 * orders, wipe products, or insert arbitrary rows. This endpoint gives demo
 * checkout its own door: the browser sends only { email, items, coupon } and
 * the server derives everything else — ids, catalog prices, totals, status —
 * from trusted sources. Only `demo_order_*` rows can be created here.
 */

interface DemoOrderInput {
  email?: string;
  items?: { productId?: string; color?: string; size?: string; quantity?: number }[];
  coupon?: string;
}

const MAX_QUANTITY_PER_LINE = 10;
const MAX_LINES = 25;

export async function POST(req: NextRequest) {
  const serverEnv = getServerEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (serverEnv.SUPABASE_SERVICE_ROLE_KEY && supabaseUrl) {
    return insertDemoOrder(req, supabaseUrl, serverEnv.SUPABASE_SERVICE_ROLE_KEY);
  }

  // No DB configured → persist nothing (matches the old getDb() behavior,
  // which fell back to localStorage). The client keeps its local copy.
  return NextResponse.json({ ok: true, persisted: false });
}

async function insertDemoOrder(req: NextRequest, supabaseUrl: string, serviceRoleKey: string): Promise<NextResponse> {
  let body: DemoOrderInput;
  try {
    body = (await req.json()) as DemoOrderInput;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    return NextResponse.json({ ok: false, error: 'Valid email required' }, { status: 400 });
  }

  const rawItems = Array.isArray(body.items) ? body.items : [];
  if (rawItems.length === 0 || rawItems.length > MAX_LINES) {
    return NextResponse.json({ ok: false, error: `Order must contain 1–${MAX_LINES} items` }, { status: 400 });
  }

  // Prices resolve from the server-side catalog only — client price claims are ignored.
  const items: Omit<AdminOrderItem, 'id'>[] = [];
  for (let idx = 0; idx < rawItems.length; idx++) {
    const raw = rawItems[idx];
    const product = products.find((p) => p.id === raw.productId);
    if (!product) return NextResponse.json({ ok: false, error: `Unknown product: ${raw.productId}` }, { status: 400 });

    const qty = Math.floor(Number(raw.quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > MAX_QUANTITY_PER_LINE) {
      return NextResponse.json({ ok: false, error: `Invalid quantity for ${product.name}` }, { status: 400 });
    }

    items.push({
      productId: product.id,
      name: product.name,
      variantLabel: [raw.color, raw.size].filter(Boolean).join(' / ') || undefined,
      quantity: qty,
      price: product.price,
    });
  }

  const subtotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

  // Coupon re-validated server-side, including the minimum-subtotal rule.
  let discount = 0;
  let couponCode: string | undefined;
  const couponInput = typeof body.coupon === 'string' ? body.coupon.trim().toUpperCase() : '';
  if (couponInput) {
    const def = DEMO_COUPONS[couponInput];
    if (!def || subtotal < def.minSubtotalUSD) {
      return NextResponse.json({ ok: false, error: 'Invalid or inapplicable coupon' }, { status: 400 });
    }
    discount = (subtotal * def.discountPercent) / 100;
    couponCode = couponInput;
  }

  const { persisted } = await createOrder(
    {
      customerEmail: email,
      items,
      subtotal,
      discount,
      tax: 0,
      total: subtotal - discount,
      currency: 'usd',
      status: 'paid',
      coupon: couponCode,
      id: `demo_order_${Date.now()}`,
    },
    { supabaseUrl, serviceRoleKey },
    { emailOnPersistOnly: true },
  );

  return NextResponse.json({ ok: true, persisted });
}
