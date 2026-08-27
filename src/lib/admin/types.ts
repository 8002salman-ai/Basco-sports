/**
 * Basco Sports – Admin panel types (data layer rows)
 * Mirrors the Luxedge admin data model, adapted to Basco's product shape.
 */

import type { Product } from '@/lib/types';

/** Product row in admin storage – Product plus admin-only flags. */
export interface AdminProduct extends Product {
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface AdminOrderItem {
  id: string;
  /** Catalog product id (present on orders saved after review-system rollout; legacy orders may omit it). */
  productId?: string;
  name: string;
  variantLabel?: string;
  quantity: number;
  price: number;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerEmail: string;
  customerName?: string;
  items: AdminOrderItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: OrderStatus;
  coupon?: string;
  createdAt: string;
  updatedAt: string;
}

export type AdminUserRole = 'admin' | 'buyer';

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: AdminUserRole;
  isBlocked?: boolean;
  createdAt: string;
}

export interface StoreSettings {
  key: string;
  storeName: string;
  supportEmail: string;
  currency: string;
  announcement?: string;
  paymentProvider: string;
  // Cloudflare integration
  cloudflareApiToken?: string;
  cloudflareAccountId?: string;
  cloudflareR2Endpoint?: string;
  cloudflareR2AccessKeyId?: string;
  cloudflareR2SecretAccessKey?: string;
  cloudflareR2BucketName?: string;
  cloudflarePagesProject?: string;
  // Supabase integration
  supabaseProjectUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  supabaseDbPassword?: string;
  supabaseProjectRef?: string;
  updatedAt: string;
}

export const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'];

// ---------------------------------------------------------------------------
// Product reviews (real customer reviews – FTC-compliant pipeline)
// ---------------------------------------------------------------------------

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface AdminReview {
  id: string;
  productId: string;
  productSlug?: string;
  productName?: string;
  orderId?: string;
  orderNumber?: string;
  customerEmail?: string;
  authorName: string;
  rating: number;
  title?: string;
  body: string;
  verifiedPurchase: boolean;
  incentiveDisclosure?: string;
  status: ReviewStatus;
  rejectionReason?: string;
  moderatedAt?: string;
  moderatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export const REVIEW_STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected'];

/** Recompute the aggregate rating for a product from its approved reviews. */
export function aggregateApprovedReviews(reviews: AdminReview[]): { rating: number; reviewCount: number } {
  const approved = reviews.filter((r) => r.status === 'approved');
  if (!approved.length) return { rating: 0, reviewCount: 0 };
  const sum = approved.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
  return { rating: Math.round((sum / approved.length) * 10) / 10, reviewCount: approved.length };
}
