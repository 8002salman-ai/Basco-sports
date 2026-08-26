import { NextRequest, NextResponse } from 'next/server';
import { hermesListOrders } from '@/lib/hermes-client';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * GET /api/hermes/orders
 * Proxies to the configured Hermes API /v1/orders endpoint.
 * Returns 503 with a clear message when Hermes env is not configured.
 */
export async function GET(_req: NextRequest) {
  const res = await hermesListOrders();

  if (res.notConfigured) {
    return NextResponse.json(
      { ok: false, notConfigured: true, error: res.error },
      { status: 503 }
    );
  }

  return NextResponse.json(
    { ok: res.ok, status: res.status, data: res.data ?? null, error: res.error ?? null },
    { status: res.ok ? 200 : 502 }
  );
}
