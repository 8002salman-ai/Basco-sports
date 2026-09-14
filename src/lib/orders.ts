/**
 * Basco Sports – Order pipeline (server-only).
 *
 * ONE seam for turning a confirmed purchase into an AdminOrder row: id and
 * order-number derivation, item normalization, timestamps, persistence and
 * the confirmation email. Both /api/orders/demo and the Stripe webhook build
 * their candidate here, so their rows can't drift apart (e.g. Stripe items
 * used to omit productId, silently breaking verified-review checks).
 *
 * Prices/totals are NOT recomputed here — each caller derives them from a
 * trusted source (catalog for demo, Stripe session for webhook) and passes
 * them in; this module owns identity and side effects.
 */

import { SupabaseAdapter } from '@/lib/admin/db';
import type { AdminOrder, AdminOrderItem } from '@/lib/admin/types';
import { sendOrderConfirmation } from '@/lib/email';

/** A caller-derived candidate order; identity, line ids and timestamps are owned here. */
export type CandidateOrder = Omit<AdminOrder, 'id' | 'orderNumber' | 'createdAt' | 'updatedAt' | 'items'> & {
  id?: string;
  orderNumber?: string;
  createdAt?: string;
  updatedAt?: string;
  items: Omit<AdminOrderItem, 'id'>[];
};

export interface CreateOrderDeps {
  supabaseUrl: string;
  serviceRoleKey: string;
}

export interface CreateOrderResult {
  order: AdminOrder | null;
  persisted: boolean;
}

function orderNumberFor(orderId: string): string {
  return `BS-${orderId.slice(-6)}`;
}

/**
 * Normalize and persist a candidate order, then send the confirmation email.
 *
 * - id: caller-provided or `bs_order_<ms>`; orderNumber derived from it.
 * - items: every line gets `${orderId}-${index}`; timestamps are set here.
 * - Never throws: a failed insert returns { persisted: false }.
 * - With emailOnPersistOnly (demo), the email is skipped when the row isn't
 *   persisted; otherwise (webhook) it fires either way.
 */
export async function createOrder(
  candidate: CandidateOrder,
  deps: CreateOrderDeps,
  opts?: { emailOnPersistOnly?: boolean },
): Promise<CreateOrderResult> {
  const now = new Date().toISOString();
  const id = candidate.id?.trim() || `bs_order_${Date.now()}`;
  const items: AdminOrderItem[] = candidate.items.map((item, idx) => ({
    ...item,
    id: `${id}-${idx}`,
  }));
  const order: AdminOrder = {
    ...candidate,
    id,
    orderNumber: candidate.orderNumber || orderNumberFor(id),
    items,
    createdAt: candidate.createdAt || now,
    updatedAt: now,
  };

  const adapter = new SupabaseAdapter(deps.supabaseUrl, deps.serviceRoleKey, deps.serviceRoleKey);
  let persisted = true;
  try {
    await adapter.insert('orders', order);
  } catch (err) {
    persisted = false;
    console.error(`Order ${order.orderNumber} not persisted:`, (err as Error).message);
  }

  if (persisted || !opts?.emailOnPersistOnly) {
    // Fire-and-forget: a dead email provider must never fail a paid order.
    void sendOrderConfirmation({
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      items: order.items.map(({ name, quantity, price, variantLabel }) => ({ name, quantity, price, variantLabel })),
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      total: order.total,
      currency: order.currency,
      coupon: order.coupon,
      createdAt: order.createdAt,
    }).catch(() => {});
  }

  return { order, persisted };
}
