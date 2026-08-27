import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * Real customer review system – FTC Consumer Reviews & Testimonials compliant.
 *
 * GET  /api/reviews?product=<slug>
 *      → approved reviews only (public-safe fields, no emails/order data)
 *        + aggregate { rating, count } for honest rating display.
 *        No database configured → empty result with mode:'unconfigured'.
 *
 * POST /api/reviews
 *      → verified-purchase submission. The order is verified SERVER-SIDE
 *        (order number + exact email match + product actually purchased +
 *        paid/shipped/delivered status) before inserting a 'pending' row.
 *        Nothing is displayed publicly until an admin approves it.
 *
 * No fake/seeded reviews are ever created by this API.
 */

// ---------------------------------------------------------------------------
// Supabase REST helpers (service-role, server-only)
// ---------------------------------------------------------------------------

function svcEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const key = getServerEnv().SUPABASE_SERVICE_ROLE_KEY;
  return { url, key };
}

function svcHeaders(key: string, prefer = ''): Record<string, string> {
  const h: Record<string, string> = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
  if (prefer) h.Prefer = prefer;
  return h;
}

async function sbFetch<T>(url: string, key: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: T | null; error?: string }> {
  try {
    const res = await fetch(url, { ...init, headers: { ...svcHeaders(key, (init?.headers as Record<string, string>)?.Prefer) } });
    const text = await res.text().catch(() => '');
    let data: T | null = null;
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = null;
      }
    }
    if (!res.ok) return { ok: false, status: res.status, data, error: text.slice(0, 300) || `HTTP ${res.status}` };
    return { ok: true, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: null, error: (e as Error).message };
  }
}

interface OrderRow {
  id: string;
  orderNumber: string;
  customerEmail: string;
  status: string;
  items: Array<{ id?: string; productId?: string; name?: string }>;
}

interface ReviewRow {
  id: string;
  productId: string;
  productSlug?: string;
  productName?: string;
  authorName: string;
  rating: number;
  title?: string;
  body: string;
  verifiedPurchase: boolean;
  incentiveDisclosure?: string;
  status: string;
  createdAt: string;
}

/** Public-safe projection – customerEmail / orderId / orderNumber never leave the server. */
function toPublicReview(r: ReviewRow) {
  return {
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    title: r.title || '',
    body: r.body,
    verifiedPurchase: !!r.verifiedPurchase,
    createdAt: r.createdAt,
  };
}

// ---------------------------------------------------------------------------
// GET – approved reviews + aggregate
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = (searchParams.get('product') || '').trim();
  if (!slug) {
    return NextResponse.json({ ok: false, error: 'product query param required' }, { status: 400 });
  }

  const { url, key } = svcEnv();
  if (!url || !key) {
    return NextResponse.json({ ok: true, mode: 'unconfigured', reviews: [], aggregate: { rating: 0, count: 0 } });
  }

  // Resolve product by slug
  const prod = await sbFetch<Array<{ id: string; name: string; slug: string }>>(
    `${url}/rest/v1/products?slug=eq.${encodeURIComponent(slug)}&select=id,name,slug&limit=1`,
    key,
  );
  if (!prod.ok || !prod.data?.length) {
    return NextResponse.json({ ok: true, mode: 'ok', reviews: [], aggregate: { rating: 0, count: 0 } });
  }
  const product = prod.data[0];

  const rows = await sbFetch<ReviewRow[]>(
    `${url}/rest/v1/product_reviews?productId=eq.${encodeURIComponent(product.id)}&status=eq.approved&order=createdAt.desc&limit=100`,
    key,
  );
  const reviews = Array.isArray(rows.data) ? rows.data : [];
  const count = reviews.length;
  const avg = count ? Math.round((reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0) / count) * 10) / 10 : 0;

  return NextResponse.json({
    ok: true,
    mode: 'ok',
    reviews: reviews.map(toPublicReview),
    aggregate: { rating: count ? avg : 0, count },
  });
}

// ---------------------------------------------------------------------------
// POST – verified-purchase submission (goes to moderation queue)
// ---------------------------------------------------------------------------

interface SubmitBody {
  productSlug?: string;
  orderNumber?: string;
  email?: string;
  authorName?: string;
  rating?: number;
  title?: string;
  body?: string;
  incentiveReceived?: boolean;
}

// Basic per-IP rate limit (per edge isolate – deterrent, moderation is the real gate)
const rateBucket = new Map<string, { count: number; reset: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateBucket.get(ip);
  if (!entry || entry.reset < now) {
    rateBucket.set(ip, { count: 1, reset: now + 60 * 60 * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 5;
}

export async function POST(req: NextRequest) {
  const { url, key } = svcEnv();
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: 'Reviews require the store database (Supabase) to be configured.' },
      { status: 503 },
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: 'Too many submissions. Please try again later.' }, { status: 429 });
  }

  let body: SubmitBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const productSlug = (body.productSlug || '').trim();
  const orderNumber = (body.orderNumber || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const authorName = (body.authorName || '').trim();
  const rating = Number(body.rating);
  const title = (body.title || '').trim();
  const reviewBody = (body.body || '').trim();

  if (!productSlug || !orderNumber || !email || !authorName || !reviewBody) {
    return NextResponse.json({ ok: false, error: 'All fields (product, order number, email, name, review) are required.' }, { status: 400 });
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: 'Rating must be 1–5 stars.' }, { status: 400 });
  }
  if (reviewBody.length < 10 || reviewBody.length > 2000) {
    return NextResponse.json({ ok: false, error: 'Review must be 10–2000 characters.' }, { status: 400 });
  }
  if (title.length > 150 || authorName.length > 80) {
    return NextResponse.json({ ok: false, error: 'Title or name too long.' }, { status: 400 });
  }

  // 1. Resolve product by slug
  const prod = await sbFetch<Array<{ id: string; name: string; slug: string }>>(
    `${url}/rest/v1/products?slug=eq.${encodeURIComponent(productSlug)}&select=id,name,slug&limit=1`,
    key,
  );
  if (!prod.ok) {
    return NextResponse.json({ ok: false, error: 'Product lookup failed. Try again.' }, { status: 502 });
  }
  if (!prod.data?.length) {
    return NextResponse.json({ ok: false, error: 'Unknown product.' }, { status: 404 });
  }
  const product = prod.data[0];

  // 2. Find the order by number (case-insensitive)
  const ord = await sbFetch<OrderRow[]>(
    `${url}/rest/v1/orders?orderNumber=ilike.${encodeURIComponent(orderNumber)}&select=id,orderNumber,customerEmail,status,items&limit=5`,
    key,
  );
  if (!ord.ok) {
    return NextResponse.json({ ok: false, error: 'Order lookup failed. Try again.' }, { status: 502 });
  }
  const orders = (ord.data || []).filter((o) => o.customerEmail?.toLowerCase() === email);
  if (!orders.length) {
    return NextResponse.json(
      { ok: false, error: 'We could not verify that order. Check the order number and the email used at checkout.' },
      { status: 403 },
    );
  }
  const order = orders.find((o) => ['paid', 'shipped', 'delivered'].includes((o.status || '').toLowerCase()));
  if (!order) {
    return NextResponse.json(
      { ok: false, error: 'Reviews open once an order is confirmed and not cancelled or refunded.' },
      { status: 403 },
    );
  }

  // 3. Verify this product was actually purchased in that order
  //    (productId on newer orders; name match fallback for legacy orders)
  const purchased = (order.items || []).some(
    (it) =>
      (it.productId && it.productId === product.id) ||
      (it.name && it.name.toLowerCase() === product.name.toLowerCase()),
  );
  if (!purchased) {
    return NextResponse.json(
      { ok: false, error: 'This product was not found in that order. Reviews are only for items you purchased.' },
      { status: 403 },
    );
  }

  // 4. One review per order + product
  const dup = await sbFetch<Array<{ id: string }>>(
    `${url}/rest/v1/product_reviews?orderId=eq.${encodeURIComponent(order.id)}&productId=eq.${encodeURIComponent(product.id)}&select=id&limit=1`,
    key,
  );
  if (dup.ok && dup.data?.length) {
    return NextResponse.json({ ok: false, error: 'You have already reviewed this item with this order.' }, { status: 409 });
  }

  // 5. Insert as pending moderation – nothing is public until approved
  const now = new Date().toISOString();
  const row = {
    id: `rev_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`,
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerEmail: email,
    authorName,
    rating,
    title: title || null,
    body: reviewBody,
    verifiedPurchase: true,
    incentiveDisclosure: body.incentiveReceived ? 'Customer disclosed receiving an incentive for this review' : 'none',
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  const ins = await sbFetch<unknown[]>(`${url}/rest/v1/product_reviews`, key, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(row),
  });
  if (!ins.ok) {
    return NextResponse.json({ ok: false, error: 'Could not save review. Please try again.' }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    status: 'pending',
    message: 'Thank you! Your review was submitted and will appear once our team approves it.',
  });
}
