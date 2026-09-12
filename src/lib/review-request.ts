/**
 * Basco Sports – Post-delivery review request email (neutral, FTC-compliant)
 *
 * Trigger: an order transitions to status 'delivered' (admin panel status
 * change today; fulfillment webhooks can reuse the same helpers later).
 *
 * Guarantees:
 *  - ONE review request per order, ever. The claim is race-safe: a conditional
 *    PATCH on orders.reviewRequestSentAt (…&reviewRequestSentAt=is.null) can
 *    only succeed for one concurrent caller.
 *  - NEVER sends for demo orders (id prefix 'demo_order') or while payments
 *    are not live (COMMERCE_LIVE !== 'true').
 *  - NEVER sends when the email provider is not configured. If a send fails
 *    after claiming, the claim is RELEASED so a future retry is possible.
 *  - Wording is a neutral question ("How was your experience with this
 *    product?"). Never asks for 5 stars, positive reviews, or conditioned
 *    rewards. No incentives exist in this system, so none are offered.
 *
 * FTC Consumer Reviews & Testimonials Rule: no fake reviews, no incentivized
 * reviews, no suppression of negative feedback — a review request must never
 * imply that a positive review is expected or rewarded.
 */

import { isEmailConfigured, sendRawEmail } from './email';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://basco-sports.vercel.app';

// ---------------------------------------------------------------------------
// Supabase REST helpers (service-role, server-only, Edge-compatible)
// ---------------------------------------------------------------------------

interface SbResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

function svcEnv(): { url: string | undefined; key: string | undefined } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, ''),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };
}

async function sb<T>(path: string, init?: RequestInit): Promise<SbResult<T>> {
  const { url, key } = svcEnv();
  if (!url || !key) return { ok: false, status: 0, data: null, error: 'Supabase not configured' };
  try {
    const res = await fetch(`${url}/rest/v1/${path}`, {
      ...init,
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...((init?.headers as Record<string, string>) || {}),
      },
    });
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

interface OrderLike {
  id: string;
  orderNumber: string | null;
  customerEmail: string | null;
  customerName?: string | null;
  status: string | null;
  items?: Array<{ productId?: string; name?: string; variantLabel?: string; quantity?: number }> | null;
}

async function fetchOrder(orderId: string): Promise<OrderLike | null> {
  const res = await sb<OrderLike[]>(
    `orders?id=eq.${encodeURIComponent(orderId)}&select=id,orderNumber,customerEmail,customerName,status,items&limit=1`,
  );
  return res.ok && Array.isArray(res.data) && res.data.length ? res.data[0] : null;
}

async function fetchProductSlugs(productIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!productIds.length) return map;
  const list = productIds.map((id) => `"${id}"`).join(',');
  const res = await sb<Array<{ id: string; slug: string }>>(
    `products?id=in.${encodeURIComponent(list)}&select=id,slug&limit=50`,
  );
  if (res.ok && Array.isArray(res.data)) {
    for (const row of res.data) map.set(row.id, row.slug);
  }
  return map;
}

/**
 * Race-safe claim: sets reviewRequestSentAt only if it is still NULL.
 * Returns true only for the single caller that wins the claim.
 */
async function claimReviewRequest(orderId: string): Promise<boolean> {
  const res = await sb<unknown[]>(`orders?id=eq.${encodeURIComponent(orderId)}&reviewRequestSentAt=is.null`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ reviewRequestSentAt: new Date().toISOString() }),
  });
  return res.ok && Array.isArray(res.data) && res.data.length === 1;
}

/** Release a claim after a failed send so a future delivery transition can retry. */
async function releaseReviewRequestClaim(orderId: string): Promise<void> {
  await sb(`orders?id=eq.${encodeURIComponent(orderId)}&reviewRequestSentAt=not.is.null`, {
    method: 'PATCH',
    body: JSON.stringify({ reviewRequestSentAt: null }),
  });
}

// ---------------------------------------------------------------------------
// Email content builder (pure – wording is asserted by docs/tests)
// ---------------------------------------------------------------------------

export interface ReviewRequestItem {
  name: string;
  slug?: string;
  variantLabel?: string;
}

/** Escape customer-controlled text before interpolating it into the HTML email. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface ReviewRequestContent {
  subject: string;
  html: string;
}

/** The exact neutral question required by policy. */
export const NEUTRAL_REVIEW_QUESTION = 'How was your experience with this product?';

export function buildReviewRequestEmail(input: {
  orderNumber: string;
  customerName?: string | null;
  items: ReviewRequestItem[];
}): ReviewRequestContent {
  const itemsHtml = input.items
    .map((item) => {
      const link = item.slug ? `${SITE_URL}/product/${encodeURIComponent(item.slug)}` : '';
      return `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #f0f0f0;">
        <div style="font-size:14px;font-weight:600;color:#0B1220;">${escapeHtml(item.name)}</div>
        ${item.variantLabel ? `<div style="font-size:12px;color:#999;margin-top:2px;">${escapeHtml(item.variantLabel)}</div>` : ''}
        ${
          link
            ? `<a href="${link}" style="display:inline-block;margin-top:10px;padding:9px 18px;background:#0B1220;color:#ffffff;text-decoration:none;border-radius:999px;font-size:12px;font-weight:600;">Share your feedback</a>`
            : ''
        }
      </td>
    </tr>`;
    })
    .join('');

  return {
    subject: `How was your Basco Sports order ${input.orderNumber}?`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">

    <div style="background:#0B1220;padding:32px 40px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">BASCO SPORTS</div>
    </div>

    <div style="padding:40px;">
      <h1 style="margin:0 0 8px;font-size:22px;color:#0B1220;">Your order has been delivered</h1>
      <p style="margin:0;color:#666;font-size:14px;">
        Order <strong>${escapeHtml(input.orderNumber)}</strong> has been delivered${input.customerName ? ` – thank you, ${escapeHtml(input.customerName)}` : ''}.
        We hope everything arrived in good condition.
      </p>

      <div style="background:#f9fafb;border-radius:12px;padding:24px;margin:24px 0;">
        <p style="margin:0 0 4px;font-size:16px;font-weight:600;color:#0B1220;">${NEUTRAL_REVIEW_QUESTION}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#666;">Your honest feedback helps other shoppers and helps us improve.</p>
      </div>

      <table style="width:100%;border-collapse:collapse;">
        ${itemsHtml}
      </table>

      <p style="margin:24px 0 0;font-size:12px;color:#999;">
        You will receive at most one review request per order.
      </p>

      <div style="text-align:center;padding-top:24px;border-top:1px solid #f0f0f0;margin-top:24px;">
        <p style="margin:0;font-size:12px;color:#999;">You're receiving this because of your purchase (order ${escapeHtml(input.orderNumber)}).</p>
        <p style="margin:8px 0 0;font-size:12px;color:#999;">Questions? Reply to this email or visit <a href="${SITE_URL}/contact" style="color:#0B1220;">our contact page</a>.</p>
        <p style="margin:8px 0 0;font-size:11px;color:#ccc;">© ${new Date().getFullYear()} Basco Sports. All rights reserved.</p>
      </div>
    </div>

  </div>
</body>
</html>`,
  };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export type ReviewRequestOutcome =
  | { sent: true }
  | { sent: false; reason: 'commerce-not-live' | 'email-not-configured' | 'order-not-found' | 'not-delivered' | 'no-email' | 'demo-order' | 'already-requested' | 'send-failed-claim-released' | 'error' };

export async function sendReviewRequestForOrder(orderId: string): Promise<ReviewRequestOutcome> {
  try {
    if ((process.env.COMMERCE_LIVE || '').trim().toLowerCase() !== 'true') {
      return { sent: false, reason: 'commerce-not-live' };
    }
    if (!isEmailConfigured()) {
      return { sent: false, reason: 'email-not-configured' };
    }

    const order = await fetchOrder(orderId);
    if (!order) return { sent: false, reason: 'order-not-found' };
    if ((order.status || '').trim().toLowerCase() !== 'delivered') return { sent: false, reason: 'not-delivered' };
    if (!order.customerEmail || !order.customerEmail.includes('@')) return { sent: false, reason: 'no-email' };
    if (order.id.startsWith('demo_order')) return { sent: false, reason: 'demo-order' };

    const claimed = await claimReviewRequest(orderId);
    if (!claimed) return { sent: false, reason: 'already-requested' };

    const productIds = Array.from(
      new Set((order.items || []).map((it) => it.productId).filter((v): v is string => !!v)),
    );
    const slugs = await fetchProductSlugs(productIds);

    const items: ReviewRequestItem[] = (order.items || [])
      .filter((it) => !!it.name)
      .map((it) => ({
        name: it.name as string,
        slug: it.productId ? slugs.get(it.productId) : undefined,
        variantLabel: it.variantLabel,
      }));

    const { subject, html } = buildReviewRequestEmail({
      orderNumber: order.orderNumber || order.id,
      customerName: order.customerName || undefined,
      items,
    });

    const ok = await sendRawEmail(order.customerEmail, subject, html);
    if (!ok) {
      await releaseReviewRequestClaim(orderId);
      return { sent: false, reason: 'send-failed-claim-released' };
    }
    return { sent: true };
  } catch {
    return { sent: false, reason: 'error' };
  }
}

// ---------------------------------------------------------------------------
// Hooks for the admin DB proxy (never throw – admin actions must not fail)
// ---------------------------------------------------------------------------

function patchMarksDelivered(patch: unknown): boolean {
  const status = (patch as { status?: unknown } | null)?.status;
  return typeof status === 'string' && status.trim().toLowerCase() === 'delivered';
}

/** Call after a successful orders update(id, patch). */
export async function maybeSendAfterOrderUpdate(id: unknown, patch: unknown): Promise<void> {
  try {
    if (typeof id !== 'string' || !patchMarksDelivered(patch)) return;
    await sendReviewRequestForOrder(id);
  } catch {
    /* never break the admin action */
  }
}

/** Call after a successful orders updateBy(column, value, patch). */
export async function maybeSendAfterOrderUpdateBy(column: unknown, value: unknown, patch: unknown): Promise<void> {
  try {
    if (typeof column !== 'string' || typeof value !== 'string' || !patchMarksDelivered(patch)) return;
    const res = await sb<Array<{ id: string }>>(
      `orders?${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}&status=eq.delivered&select=id&limit=100`,
    );
    if (!res.ok || !Array.isArray(res.data)) return;
    for (const row of res.data) {
      await sendReviewRequestForOrder(row.id);
    }
  } catch {
    /* never break the admin action */
  }
}
