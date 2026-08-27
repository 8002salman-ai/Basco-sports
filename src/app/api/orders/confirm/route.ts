import { NextRequest, NextResponse } from 'next/server';
import { sendOrderConfirmation, type OrderEmailData } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * Send order confirmation email. Called by checkout page after
 * the order is saved to DB (demo or Stripe webhook).
 */

export async function POST(req: NextRequest) {
  let body: OrderEmailData;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  if (!body.orderNumber || !body.customerEmail) {
    return NextResponse.json({ ok: false, error: 'orderNumber and customerEmail required' }, { status: 400 });
  }

  try {
    const sent = await sendOrderConfirmation(body);
    return NextResponse.json({ ok: true, sent });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message || 'Email failed' },
      { status: 500 },
    );
  }
}
