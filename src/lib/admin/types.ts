/**
 * Basco Sports – Admin panel types (data layer rows)
 * Mirrors the Luxedge admin data model, adapted to Basco's product shape.
 */

import type { Product } from '@/lib/types';

// ---------------------------------------------------------------------------
// Catalog row (public.products) – the storefront Product plus the listing
// workflow fields the admin console edits. Storefront and console read the
// same table, so this is the one product contract.
// ---------------------------------------------------------------------------

export type Readiness = 'COMMERCE_READY' | 'REVIEW_REQUIRED' | 'BLOCKED' | 'DRAFT';
export type SourceType = 'CJ' | 'KONG' | 'IN_HOUSE' | 'OTHER';
export type ImageStatus = 'COMPLETE' | 'INCOMPLETE' | 'MISSING_ALT';

export interface AdminProduct extends Product {
  isActive: boolean;
  updatedAt: string;
  createdAt: string;
  sku: string;
  /** Supplier cost. Null means unknown – never guessed. */
  cost: number | null;
  readiness: Readiness;
  sourceType: SourceType;
  fulfillment: 'SUPPLIER' | 'IN_HOUSE';
  inventorySource: 'SUPPLIER_SYNC' | 'MANUAL';
  lowStockThreshold: number;
  supplierUrl?: string | null;
}

/** What the screens render: the row plus what is derived from it. */
export interface CatalogProduct extends AdminProduct {
  /** Null when cost is unknown, so the UI can say so instead of inventing 0%. */
  margin: number | null;
  imageStatus: ImageStatus;
}

/** The listing playbook's auto-publish margin floor. */
export const MARGIN_FLOOR = 45;

export const READINESS_TONE: Record<Readiness, 'green' | 'amber' | 'red' | 'gray'> = {
  COMMERCE_READY: 'green',
  REVIEW_REQUIRED: 'amber',
  BLOCKED: 'red',
  DRAFT: 'gray',
};

export const SOURCE_TONE: Record<SourceType, 'blue' | 'violet' | 'gray'> = {
  CJ: 'blue',
  KONG: 'violet',
  IN_HOUSE: 'gray',
  OTHER: 'gray',
};

/** Gross margin percent, or null when the supplier cost is unknown. */
function marginOf(cost: number | null, price: number): number | null {
  if (cost == null || !price) return null;
  return Math.round(((price - cost) / price) * 1000) / 10;
}

/** Gallery completeness – stored nowhere, derived from the image list. */
function imageStatusOf(images: string[]): ImageStatus {
  if (!images.length) return 'INCOMPLETE';
  return images.length > 1 ? 'COMPLETE' : 'MISSING_ALT';
}

export function toCatalogProduct(row: AdminProduct): CatalogProduct {
  return { ...row, margin: marginOf(row.cost, row.price), imageStatus: imageStatusOf(row.images) };
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
  /** Storefront approval: an unapproved account sees no orders. */
  verified?: boolean;
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
