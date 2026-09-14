/**
 * Basco Sports – Admin console seed rows and derivations.
 *
 * Screens backed by a real table read it through `useAdminTable` and only fall
 * back to the seeds here when that table is empty or unreachable. Screens with
 * no table behind them (content, campaigns, CRM, AI studio) are local-only and
 * show a `DemoNotice` saying so.
 *
 * Seeded from Basco's own catalog (`src/data/products.ts`) so nothing is lorem,
 * and deliberately deterministic — no `Date.now()` / `Math.random()` at module
 * scope — because the admin shell renders on the edge while panels render in
 * the browser, and both must agree on the first paint.
 */
import { products as catalogProducts, categories as catalogCategories, journalPosts, coupons } from '@/data/products';
import {
  toCatalogProduct,
  type AdminProduct,
  type CatalogProduct,
  type AdminOrder,
  type AdminOrderItem,
  type AdminUser,
  type AdminReview,
  type OrderStatus,
} from '@/lib/admin/types';

/** Anchor "now" for every demo date so SSR and client agree. */
export const DEMO_TODAY = '2026-09-13T09:00:00.000Z';

/** ISO timestamp `n` days before DEMO_TODAY, with a stable hour offset. */
export function daysAgo(n: number): string {
  return new Date(new Date(DEMO_TODAY).getTime() - n * 86_400_000 - ((n * 7) % 12) * 3_600_000).toISOString();
}

export function formatMoney(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 2 }).format(value);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

/**
 * Catalog seed. Only shown when the live `products` table has nothing to read
 * (empty or unreachable) so the console never renders blank; every row that
 * does come back from the table is used as-is.
 */
export const catalogSeed: CatalogProduct[] = catalogProducts.map((p) =>
  toCatalogProduct({
    ...p,
    sku: `BS-${p.id.toUpperCase()}`,
    cost: Math.round(p.price * 0.55 * 100) / 100,
    readiness: 'COMMERCE_READY',
    sourceType: 'IN_HOUSE',
    fulfillment: 'IN_HOUSE',
    inventorySource: 'MANUAL',
    lowStockThreshold: 5,
    isActive: true,
    createdAt: DEMO_TODAY,
    updatedAt: DEMO_TODAY,
  })
);

/** The storefront's sport collections, in navigation order. */
export const SPORT_CATEGORIES = catalogCategories.filter((c) => c.slug !== 'deals');

/** Sport collections with counts, in storefront navigation order. */
export function categoriesWithCounts(products: AdminProduct[]) {
  return SPORT_CATEGORIES.map((c) => ({
    ...c,
    count: products.filter((p) => p.category === c.slug).length,
    active: products.filter((p) => p.category === c.slug && p.isActive).length,
  }));
}

/** Products at or below their own low-stock threshold, worst first. */
export function lowStockOf(products: AdminProduct[]): AdminProduct[] {
  return products.filter((p) => p.stock <= p.lowStockThreshold).sort((a, b) => a.stock - b.stock);
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

const DEMO_CUSTOMERS = [
  { name: 'Imran Yousaf', email: 'imran.yousaf@example.com' },
  { name: 'Sara Malik', email: 'sara.malik@example.com' },
  { name: 'Daniel Okafor', email: 'd.okafor@example.com' },
  { name: 'Hannah Reid', email: 'hannah.reid@example.com' },
  { name: 'Bilal Ahmed', email: 'bilal.ahmed@example.com' },
  { name: 'Marta Kowalski', email: 'marta.k@example.com' },
  { name: 'Tom Becker', email: 'tom.becker@example.com' },
  { name: 'Ayesha Noor', email: 'ayesha.noor@example.com' },
];

const ORDER_STATUS_CYCLE: OrderStatus[] = [
  'paid', 'shipped', 'delivered', 'paid', 'pending', 'delivered', 'paid',
  'shipped', 'refunded', 'delivered', 'paid', 'cancelled', 'shipped', 'delivered',
  'paid', 'pending',
];

const round2 = (n: number) => Math.round(n * 100) / 100;

export const orders: AdminOrder[] = Array.from({ length: 40 }, (_, i) => {
  const customer = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
  const itemCount = 1 + (i % 3);
  const items: AdminOrderItem[] = Array.from({ length: itemCount }, (_, j) => {
    const p = catalogProducts[(i * 5 + j * 9) % catalogProducts.length];
    const variant = p.variants[0];
    const size = variant?.sizes?.[(i + j) % (variant.sizes.length || 1)];
    return {
      id: `oi-${i + 1}-${j + 1}`,
      productId: p.id,
      name: p.name,
      variantLabel: [variant?.color, size].filter(Boolean).join(' / '),
      quantity: 1 + ((i + j) % 2),
      price: p.price,
    };
  });
  const subtotal = round2(items.reduce((a, it) => a + it.price * it.quantity, 0));
  const discount = i % 5 === 0 ? round2(subtotal * 0.1) : 0;
  const tax = round2((subtotal - discount) * 0.08);
  const createdAt = daysAgo(i * 2 + (i % 3));
  return {
    id: `ord-${1000 + i}`,
    orderNumber: `BS-${String(428_311 + i * 977).slice(-6)}`,
    customerName: customer.name,
    customerEmail: customer.email,
    items,
    subtotal,
    discount,
    tax,
    total: round2(subtotal - discount + tax),
    currency: 'USD',
    coupon: discount ? 'WELCOME15' : undefined,
    status: ORDER_STATUS_CYCLE[i % ORDER_STATUS_CYCLE.length],
    createdAt,
    updatedAt: createdAt,
  };
}).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

export const ORDER_STATUS_TONE: Record<OrderStatus, 'gray' | 'green' | 'amber' | 'red' | 'blue' | 'violet'> = {
  pending: 'amber',
  paid: 'blue',
  shipped: 'violet',
  delivered: 'green',
  cancelled: 'gray',
  refunded: 'red',
};

/** Orders that count as revenue – cancelled and unpaid ones never do. */
export function paidOrdersOf(all: AdminOrder[]): AdminOrder[] {
  return all.filter((o) => o.status !== 'cancelled' && o.status !== 'pending');
}

export function revenueIn(all: AdminOrder[], days: number): number {
  const since = new Date(DEMO_TODAY).getTime() - days * 86_400_000;
  return round2(
    paidOrdersOf(all)
      .filter((o) => new Date(o.createdAt).getTime() >= since && o.status !== 'refunded')
      .reduce((a, o) => a + o.total, 0)
  );
}

/**
 * Bucketed revenue for the dashboard chart, oldest bucket first so the chart
 * reads left-to-right in time.
 */
export function revenueSeries(all: AdminOrder[], buckets: number, daysEach: number): { label: string; value: number }[] {
  return Array.from({ length: buckets }, (_, index) => {
    const i = buckets - 1 - index;
    const start = i * daysEach;
    const value = revenueIn(all, start + daysEach) - revenueIn(all, start);
    return { label: `D${start + 1}`, value: Math.max(0, round2(value)) };
  });
}

export function orderStatusBreakdown(all: AdminOrder[]) {
  return (['pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded'] as OrderStatus[]).map((s) => ({
    status: s,
    count: all.filter((o) => o.status === s).length,
  }));
}

// ---------------------------------------------------------------------------
// Customers / users
// ---------------------------------------------------------------------------

export const adminUsers: AdminUser[] = [
  { id: 'u-owner', email: 'owner@bascosports.com', name: 'Salman Bashir', role: 'admin', createdAt: daysAgo(400) },
  { id: 'u-ops', email: 'ops@bascosports.com', name: 'Ops Desk', role: 'admin', createdAt: daysAgo(180) },
  ...DEMO_CUSTOMERS.map((c, i) => ({
    id: `u-${100 + i}`,
    email: c.email,
    name: c.name,
    role: 'buyer' as const,
    isBlocked: i === 5,
    createdAt: daysAgo(90 - i * 5),
  })),
];

// ---------------------------------------------------------------------------
// Reviews (moderation queue)
// ---------------------------------------------------------------------------

const REVIEW_SEED: { author: string; rating: number; title: string; body: string; status: AdminReview['status'] }[] = [
  { author: 'Imran Y.', rating: 5, title: 'Genuine speed boot', body: 'Played three matches on firm ground. Locked-in fit, no blisters, and the studs hold on wet grass.', status: 'approved' },
  { author: 'Sara M.', rating: 4, title: 'Great jacket, runs slim', body: 'Keeps the rain out on 10k runs. I sized up and it fits perfectly under a base layer.', status: 'approved' },
  { author: 'Daniel O.', rating: 2, title: 'Bat arrived with a mark', body: 'Willow is nice but there was a scuff on the face out of the box. Support sorted it quickly.', status: 'pending' },
  { author: 'Hannah R.', rating: 5, title: 'Best lifting belt I have owned', body: 'Stiff where you need it and comfortable during long squat sessions.', status: 'approved' },
  { author: 'Bilal A.', rating: 3, title: 'Good, not perfect', body: 'Court shoe is grippy but the toe box is narrow for wide feet.', status: 'pending' },
  { author: 'Marta K.', rating: 1, title: 'Wrong size sent', body: 'Ordered a 10, received a 9. Refund processed without fuss, but still a wasted week.', status: 'rejected' },
  { author: 'Tom B.', rating: 5, title: 'Shells are properly waterproof', body: 'Held up through two hours of Scottish drizzle on the ridge.', status: 'approved' },
  { author: 'Ayesha N.', rating: 4, title: 'Lovely kit', body: 'Colour is exactly as pictured and the fabric breathes well.', status: 'pending' },
  { author: 'Imran Y.', rating: 5, title: 'Second pair', body: 'Came back for the stone colourway after the first pair lasted a season.', status: 'approved' },
  { author: 'Hannah R.', rating: 2, title: 'Stitching came loose', body: 'Strap stitching failed after a month of daily use.', status: 'pending' },
];

export const adminReviews: AdminReview[] = REVIEW_SEED.map((r, i) => {
  const product = catalogProducts[(i * 3) % catalogProducts.length];
  const order = orders[(i * 2) % orders.length];
  return {
    id: `rev-${2000 + i}`,
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerEmail: order.customerEmail,
    authorName: r.author,
    rating: r.rating,
    title: r.title,
    body: r.body,
    verifiedPurchase: true,
    status: r.status,
    rejectionReason: r.status === 'rejected' ? 'Review references an order that was refunded.' : undefined,
    moderatedAt: r.status === 'pending' ? undefined : daysAgo(i + 2),
    moderatedBy: r.status === 'pending' ? undefined : 'owner@bascosports.com',
    createdAt: daysAgo(i * 3 + 1),
    updatedAt: daysAgo(i * 2),
  };
});

// ---------------------------------------------------------------------------
// Content – blog + media
// ---------------------------------------------------------------------------

export type PostStatus = 'published' | 'draft' | 'scheduled';

export interface AdminPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  image: string;
  status: PostStatus;
  views: number;
  readTime: string;
  author: string;
  tags: string[];
  seoComplete: boolean;
  updatedAt: string;
}

export const adminPosts: AdminPost[] = [
  ...journalPosts.map((p, i) => ({
    id: `post-${i + 1}`,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    category: p.category,
    image: p.image,
    status: 'published' as PostStatus,
    views: 180 + ((i * 271) % 1400),
    readTime: p.readTime,
    author: 'Basco Editorial',
    tags: [p.category.toLowerCase(), 'buying-guide'],
    seoComplete: i % 3 !== 0,
    updatedAt: daysAgo(i * 6 + 2),
  })),
  {
    id: 'post-draft-1',
    slug: 'how-to-choose-football-boots',
    title: 'How to choose football boots for firm ground',
    excerpt: 'Plate stiffness, stud pattern and upper material — what actually matters on FG.',
    category: 'Football',
    image: catalogCategories[0].image,
    status: 'draft',
    views: 0,
    readTime: '6 min',
    author: 'Basco Editorial',
    tags: ['football', 'boots'],
    seoComplete: false,
    updatedAt: daysAgo(1),
  },
  {
    id: 'post-sched-1',
    slug: 'winter-layering-guide',
    title: 'Winter layering for cold-weather running',
    excerpt: 'Three layers, no bulk: a practical system for sub-5°C runs.',
    category: 'Running',
    image: catalogCategories[3].image,
    status: 'scheduled',
    views: 0,
    readTime: '5 min',
    author: 'Basco Editorial',
    tags: ['running', 'apparel'],
    seoComplete: true,
    updatedAt: daysAgo(3),
  },
];

export interface AdminVideo {
  id: string;
  title: string;
  youtubeId: string;
  duration: string;
  status: 'published' | 'draft';
  tags: string[];
  views: number;
  relatedProductIds: string[];
  syncedAt: string;
}

export const adminVideos: AdminVideo[] = [
  { id: 'vid-1', title: 'Apex Flight FG — on-pitch review', youtubeId: 'dQw4w9WgXcQ', duration: 'PT4M12S', status: 'published', tags: ['football', 'boots'], views: 18420, relatedProductIds: ['p001'], syncedAt: daysAgo(2) },
  { id: 'vid-2', title: 'Heritage willow — how to knock in a bat', youtubeId: 'dQw4w9WgXcQ', duration: 'PT7M03S', status: 'published', tags: ['cricket', 'care'], views: 9310, relatedProductIds: ['p002'], syncedAt: daysAgo(5) },
  { id: 'vid-3', title: 'Court Horizon — fit and break-in', youtubeId: 'dQw4w9WgXcQ', duration: 'PT3M44S', status: 'published', tags: ['basketball'], views: 6120, relatedProductIds: ['p003'], syncedAt: daysAgo(9) },
  { id: 'vid-4', title: 'Aeroflow 2L — waterproof test', youtubeId: 'dQw4w9WgXcQ', duration: 'PT5M28S', status: 'published', tags: ['running', 'outerwear'], views: 4480, relatedProductIds: ['p004'], syncedAt: daysAgo(12) },
  { id: 'vid-5', title: 'Gym essentials: belt fitting guide', youtubeId: 'dQw4w9WgXcQ', duration: 'PT6M10S', status: 'draft', tags: ['gym'], views: 0, relatedProductIds: [], syncedAt: daysAgo(1) },
];

// ---------------------------------------------------------------------------
// Promotions, campaigns, gift drop
// ---------------------------------------------------------------------------

export const storeOffers = [
  { id: 'off-1', name: 'Free worldwide shipping over $150', type: 'Free shipping', threshold: 150, active: true, redemptions: 128 },
  { id: 'off-2', name: '15% off first order (WELCOME15)', type: 'Coupon', threshold: 0, active: true, redemptions: 214 },
  { id: 'off-3', name: 'Seasonal reductions — deals edit', type: 'Price drop', threshold: 0, active: true, redemptions: 76 },
  { id: 'off-4', name: 'Bundle: boot + socks', type: 'Bundle', threshold: 0, active: false, redemptions: 0 },
];

export const adsReadiness = [
  { id: 'ads-1', label: 'GTIN present on all advertised products', ok: false, hint: 'Compliance GTIN missing on 12 rows' },
  { id: 'ads-2', label: 'Shipping & returns pages published', ok: true, hint: '/shipping and /returns are live' },
  { id: 'ads-3', label: 'Return policy length disclosed', ok: true, hint: '30 days disclosed on product pages' },
  { id: 'ads-4', label: 'Prices include tax where required', ok: true, hint: 'US market shows tax at checkout' },
  { id: 'ads-5', label: 'Product images over 800px', ok: true, hint: 'All active rows pass' },
];

export interface DemoCampaign {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'scheduled' | 'ended';
  discountCap: number;
  products: number;
  claimsToday: number;
  claimsTotal: number;
  startsAt: string;
  endsAt: string;
}

export const campaigns: DemoCampaign[] = [
  { id: 'cmp-1', name: 'Gift Drop — Starter Kit', slug: 'starter-kit', status: 'active', discountCap: 100, products: 3, claimsToday: 12, claimsTotal: 348, startsAt: daysAgo(21), endsAt: daysAgo(-9) },
  { id: 'cmp-2', name: 'Back to training', slug: 'back-to-training', status: 'active', discountCap: 20, products: 18, claimsToday: 34, claimsTotal: 1204, startsAt: daysAgo(9), endsAt: daysAgo(-12) },
  { id: 'cmp-3', name: 'Cricket season launch', slug: 'cricket-season', status: 'scheduled', discountCap: 15, products: 9, claimsToday: 0, claimsTotal: 0, startsAt: daysAgo(-5), endsAt: daysAgo(-35) },
  { id: 'cmp-4', name: 'Summer clearance', slug: 'summer-clearance', status: 'ended', discountCap: 35, products: 24, claimsToday: 0, claimsTotal: 2190, startsAt: daysAgo(72), endsAt: daysAgo(18) },
];

export const giftDrop = {
  active: true,
  total: 500,
  claimed: 348,
  perDayCap: 25,
  claimsToday: 12,
  productNames: catalogProducts.slice(0, 3).map((p) => p.name),
};

export const giftDropClaims = Array.from({ length: 12 }, (_, i) => {
  const c = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
  return {
    id: `claim-${3000 + i}`,
    customerName: c.name,
    customerEmail: c.email,
    orderNumber: `BS-${String(431_002 + i * 13).slice(-6)}`,
    productName: catalogProducts[i % 3].name,
    claimedAt: daysAgo(i),
  };
});

// ---------------------------------------------------------------------------
// CRM leads
// ---------------------------------------------------------------------------

export type LeadSource = 'welcome' | 'whatsapp' | 'chat' | 'newsletter';
export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';

export interface DemoLead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  interest: string;
  note?: string;
  createdAt: string;
}

const LEAD_SOURCES: LeadSource[] = ['welcome', 'whatsapp', 'chat', 'newsletter'];
const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'quoted', 'won', 'lost'];

export const crmLeads: DemoLead[] = Array.from({ length: 14 }, (_, i) => {
  const c = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
  const product = catalogProducts[(i * 7) % catalogProducts.length];
  return {
    id: `lead-${4000 + i}`,
    name: c.name,
    email: c.email,
    phone: i % 3 === 0 ? `+44 7700 9000${10 + i}` : undefined,
    source: LEAD_SOURCES[i % LEAD_SOURCES.length],
    status: LEAD_STATUSES[i % LEAD_STATUSES.length],
    interest: product.name,
    note: i % 4 === 0 ? 'Asked about EU delivery and duties.' : undefined,
    createdAt: daysAgo(i * 2 + 1),
  };
});

export const NEWSLETTER_SUBSCRIBERS = 1_842;

// ---------------------------------------------------------------------------
// System configuration (demo values — no secrets, no real keys)
// ---------------------------------------------------------------------------

export const PAYMENT_PROVIDERS = [
  { id: 'stripe', name: 'Stripe', enabled: true, mode: 'test', note: 'Card + wallets', maskedKey: 'sk_test_••••••••3f21' },
  { id: 'paypal', name: 'PayPal', enabled: false, mode: 'sandbox', note: 'Buyer protection markets', maskedKey: 'not configured' },
  { id: 'square', name: 'Square', enabled: false, mode: 'sandbox', note: 'US in-person + online', maskedKey: 'not configured' },
  { id: 'none', name: 'No payment required', enabled: true, mode: '—', note: 'Gift-drop $0 orders', maskedKey: '—' },
];

export const SHIPPING_ZONES = [
  { id: 'ship-1', zone: 'United Kingdom', carrier: 'Royal Mail Tracked 24', rate: 4.95, freeOver: 150, eta: '1–2 days' },
  { id: 'ship-2', zone: 'European Union', carrier: 'DHL Express', rate: 12.5, freeOver: 200, eta: '2–4 days' },
  { id: 'ship-3', zone: 'United States', carrier: 'UPS Ground', rate: 9.9, freeOver: 175, eta: '3–5 days' },
  { id: 'ship-4', zone: 'Rest of world', carrier: 'DHL Express', rate: 24, freeOver: 300, eta: '5–9 days' },
];

export const CJ_STATUS = {
  connected: false,
  account: 'not linked',
  maskedKey: 'no key stored',
  lastSync: daysAgo(6),
  note: 'Demo only — link a supplier key in Basco\u2019s own environment to enable live sourcing.',
};

export const LISTING_PLAYBOOK = [
  { id: 'pb-1', rule: 'Never publish without a verified supplier price', enforced: true, scope: 'All sources' },
  { id: 'pb-2', rule: 'Minimum 45% margin before auto-publish', enforced: true, scope: 'Auto-listing' },
  { id: 'pb-3', rule: 'Reject listings without shipping cost evidence', enforced: true, scope: 'Import automation' },
  { id: 'pb-4', rule: 'Map supplier category to a Basco sport', enforced: true, scope: 'Import automation' },
  { id: 'pb-5', rule: 'Block listings with unknown battery/electrical status', enforced: false, scope: 'Safety' },
  { id: 'pb-6', rule: 'Rewrite supplier copy — never publish scraped text', enforced: true, scope: 'AI import' },
];

export const demoCoupons = coupons;

