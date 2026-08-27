/**
 * Basco Sports – Email Notification System (Resend)
 *
 * Server-only, Edge-compatible. Uses Resend API for transactional emails.
 * Set RESEND_API_KEY in env to enable. Without it, emails are logged but not sent.
 *
 * From address must be verified in Resend dashboard (or use onboarding domain).
 */

import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || 'Basco Sports <orders@basco-sports.vercel.app>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://basco-sports.vercel.app';

let resendClient: Resend | null = null;

function getClient(): Resend | null {
  if (!RESEND_API_KEY) return null;
  if (!resendClient) {
    resendClient = new Resend(RESEND_API_KEY);
  }
  return resendClient;
}

// ─── Types ──────────────────────────────────────────────────────────

export interface OrderEmailData {
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  items: { name: string; quantity: number; price: number; variantLabel?: string }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  coupon?: string;
  createdAt: string;
}

export interface ShippingEmailData {
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Email Templates ────────────────────────────────────────────────

function orderConfirmationHtml(data: OrderEmailData): string {
  const itemsHtml = data.items.map((item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;">
        ${item.name}${item.variantLabel ? ` <span style="color:#999;">(${item.variantLabel})</span>` : ''}
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#666;text-align:center;">×${item.quantity}</td>
      <td style="padding:12px 0;border-bottom:1px solid #f0f0f0;font-size:14px;color:#333;text-align:right;font-weight:500;">${formatPrice(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">

    <!-- Header -->
    <div style="background:#0B1220;padding:32px 40px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">BASCO SPORTS</div>
    </div>

    <!-- Body -->
    <div style="padding:40px;">

      <!-- Success badge -->
      <div style="text-align:center;margin-bottom:32px;">
        <div style="width:64px;height:64px;background:#ECFDF5;border-radius:50%;display:inline-block;line-height:64px;">
          <span style="font-size:32px;">✓</span>
        </div>
        <h1 style="margin:16px 0 8px;font-size:24px;color:#0B1220;">Order Confirmed!</h1>
        <p style="margin:0;color:#666;font-size:14px;">Thank you for your purchase${data.customerName ? `, ${data.customerName}` : ''}.</p>
      </div>

      <!-- Order info -->
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;">
        <table style="width:100%;font-size:13px;">
          <tr>
            <td style="color:#666;padding:4px 0;">Order Number</td>
            <td style="font-weight:600;text-align:right;padding:4px 0;">${data.orderNumber}</td>
          </tr>
          <tr>
            <td style="color:#666;padding:4px 0;">Date</td>
            <td style="text-align:right;padding:4px 0;">${formatDate(data.createdAt)}</td>
          </tr>
          <tr>
            <td style="color:#666;padding:4px 0;">Email</td>
            <td style="text-align:right;padding:4px 0;">${data.customerEmail}</td>
          </tr>
        </table>
      </div>

      <!-- Items -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="border-bottom:2px solid #0B1220;">
            <th style="padding:8px 0;text-align:left;font-size:12px;text-transform:uppercase;color:#999;letter-spacing:0.5px;">Item</th>
            <th style="padding:8px 0;text-align:center;font-size:12px;text-transform:uppercase;color:#999;letter-spacing:0.5px;">Qty</th>
            <th style="padding:8px 0;text-align:right;font-size:12px;text-transform:uppercase;color:#999;letter-spacing:0.5px;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="border-top:2px solid #f0f0f0;padding-top:16px;">
        <table style="width:100%;font-size:14px;">
          <tr><td style="padding:4px 0;color:#666;">Subtotal</td><td style="text-align:right;padding:4px 0;">${formatPrice(data.subtotal)}</td></tr>
          ${data.discount > 0 ? `<tr><td style="padding:4px 0;color:#16a34a;">Discount${data.coupon ? ` (${data.coupon})` : ''}</td><td style="text-align:right;padding:4px 0;color:#16a34a;">-${formatPrice(data.discount)}</td></tr>` : ''}
          <tr><td style="padding:4px 0;color:#666;">Tax</td><td style="text-align:right;padding:4px 0;">${formatPrice(data.tax)}</td></tr>
          <tr><td style="padding:12px 0 0;font-size:18px;font-weight:700;border-top:2px solid #0B1220;">Total</td><td style="text-align:right;padding:12px 0 0;font-size:18px;font-weight:700;border-top:2px solid #0B1220;">${formatPrice(data.total)}</td></tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${SITE_URL}/track" style="display:inline-block;padding:14px 32px;background:#0B1220;color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;">Track Your Order</a>
      </div>

      <!-- Footer -->
      <div style="text-align:center;padding-top:24px;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#999;">Questions? Reply to this email or visit <a href="${SITE_URL}/contact" style="color:#0B1220;">basco-sports.com/contact</a></p>
        <p style="margin:8px 0 0;font-size:11px;color:#ccc;">© ${new Date().getFullYear()} Basco Sports. All rights reserved.</p>
      </div>

    </div>
  </div>
</body>
</html>`;
}

function shippingUpdateHtml(data: ShippingEmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;">

    <div style="background:#0B1220;padding:32px 40px;text-align:center;">
      <div style="font-size:28px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;">BASCO SPORTS</div>
    </div>

    <div style="padding:40px;text-align:center;">
      <h1 style="margin:0 0 8px;font-size:24px;color:#0B1220;">Your order has shipped! 🚚</h1>
      <p style="margin:0 0 24px;color:#666;font-size:14px;">Order ${data.orderNumber}${data.customerName ? ` for ${data.customerName}` : ''}</p>

      ${data.trackingNumber ? `
      <div style="background:#f9fafb;border-radius:12px;padding:20px;margin-bottom:24px;text-align:left;">
        <div style="font-size:13px;color:#666;margin-bottom:4px;">Tracking Number</div>
        <div style="font-size:16px;font-weight:600;font-family:monospace;">${data.trackingNumber}</div>
        ${data.estimatedDelivery ? `<div style="font-size:13px;color:#666;margin-top:12px;">Estimated delivery: <strong>${data.estimatedDelivery}</strong></div>` : ''}
      </div>
      ` : ''}

      ${data.trackingUrl ? `
      <a href="${data.trackingUrl}" style="display:inline-block;padding:14px 32px;background:#0B1220;color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;">Track Package</a>
      ` : `
      <a href="${SITE_URL}/track" style="display:inline-block;padding:14px 32px;background:#0B1220;color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:600;">Track Order</a>
      `}

      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #f0f0f0;">
        <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} Basco Sports</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ─── Send Functions ─────────────────────────────────────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const client = getClient();
  if (!client) {
    console.log(`📧 [DEV] Email not sent (no RESEND_API_KEY): To=${to}, Subject=${subject}`);
    return false;
  }

  try {
    const { error } = await client.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('❌ Email send failed:', error);
      return false;
    }

    console.log(`✅ Email sent: To=${to}, Subject=${subject}`);
    return true;
  } catch (err) {
    console.error('❌ Email error:', err);
    return false;
  }
}

/**
 * Send order confirmation email.
 */
export async function sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
  return sendEmail(
    data.customerEmail,
    `Order Confirmed – ${data.orderNumber} | Basco Sports`,
    orderConfirmationHtml(data),
  );
}

/**
 * Send shipping update email.
 */
export async function sendShippingUpdate(data: ShippingEmailData): Promise<boolean> {
  return sendEmail(
    data.customerEmail,
    `Your order ${data.orderNumber} has shipped! | Basco Sports`,
    shippingUpdateHtml(data),
  );
}

/**
 * Check if email is configured.
 */
export function isEmailConfigured(): boolean {
  return !!RESEND_API_KEY;
}
