/**
 * Demo coupon codes – single source of truth.
 *
 * The cart UI validates against this map and the /api/orders/demo endpoint
 * re-validates server-side (the client's discount claim is never trusted),
 * so both sides always agree on discounts and minimums.
 */
export const DEMO_COUPONS: Record<string, { discountPercent: number; minSubtotalUSD: number }> = {
  BASCO10: { discountPercent: 10, minSubtotalUSD: 100 },
  WELCOME15: { discountPercent: 15, minSubtotalUSD: 75 },
  TRAIN20: { discountPercent: 20, minSubtotalUSD: 150 },
};
