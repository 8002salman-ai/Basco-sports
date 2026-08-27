import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv } from '@/lib/env';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * Public order lookup API. Customers enter email or order number
 * to see their order status. No auth required — but limited to
 * matching orders only (email must match exactly).
 */

async function supabaseQuery(table: string, params?: string): Promise<any[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];
  const qs = params ? `?${params}` : '';
  const res = await fetch(`${url}/rest/v1/${table}${qs}`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

export async function GET(req: NextRequest) {
  const env = getServerEnv();

  if (!env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ ok: false, error: 'DB not configured' }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get('q') || '').trim();

  if (!query) {
    return NextResponse.json({ ok: false, error: 'Provide email or order number (q=...)' }, { status: 400 });
  }

  try {
    const allOrders = await supabaseQuery('orders', 'order=createdAt.desc&limit=50');

    // Filter to matching orders
    const matched = allOrders.filter((o: any) => {
      const byNumber = o.orderNumber?.toLowerCase() === query.toLowerCase();
      const byId = o.id?.toLowerCase() === query.toLowerCase();
      const byEmail = o.customerEmail?.toLowerCase() === query.toLowerCase();
      return byNumber || byId || byEmail;
    });

    // Return only safe fields (no internal IDs, no payment details)
    const safe = matched.map((o) => ({
      orderNumber: o.orderNumber,
      status: o.status,
      items: o.items?.map((it: any) => ({
        name: it.name,
        quantity: it.quantity,
        price: it.price,
        variantLabel: it.variantLabel,
      })),
      subtotal: o.subtotal,
      discount: o.discount,
      tax: o.tax,
      total: o.total,
      currency: o.currency,
      coupon: o.coupon,
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    }));

    return NextResponse.json({ ok: true, data: safe, count: safe.length });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: (e as Error).message || 'Lookup failed' },
      { status: 500 },
    );
  }
}
