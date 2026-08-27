-- ============================================================================
-- BASCO SPORTS – Real customer review system (FTC-compliant)
-- Used by:
--   * POST /api/reviews        (verified-purchase submission, moderation queue)
--   * GET  /api/reviews        (public approved reviews + aggregate rating)
--   * /admin/reviews           (moderation panel)
--
-- Compliance model (FTC Consumer Reviews & Testimonials Rule):
--   * every review is linked to a real order  -> verifiedPurchase
--   * nothing is displayed until an admin approves it -> status='approved'
--   * customer email / order internals are NEVER exposed publicly
--   * incentive disclosure is recorded per review
--   * NO seeded/fabricated reviews may ever be inserted into this table
--
-- Run in the Supabase SQL editor (Dashboard → SQL → paste → Run).
-- ============================================================================

create table if not exists public.product_reviews (
  id text primary key,
  "productId" text not null,                -- products.id
  "productSlug" text,
  "productName" text,

  -- Verified purchase linkage (private – never returned by public API)
  "orderId" text,
  "orderNumber" text,
  "customerEmail" text,

  "authorName" text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  body text not null,

  "verifiedPurchase" boolean not null default false,
  "incentiveDisclosure" text not null default 'none',

  -- pending | approved | rejected
  status text not null default 'pending',
  "rejectionReason" text,
  "moderatedAt" timestamptz,
  "moderatedBy" text,

  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create index if not exists product_reviews_product_status_idx
  on public.product_reviews ("productId", status);

create index if not exists product_reviews_order_idx
  on public.product_reviews ("orderId");

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.product_reviews enable row level security;

-- Storefront may read APPROVED reviews only
drop policy if exists "reviews_anon_read_approved" on public.product_reviews;
create policy "reviews_anon_read_approved" on public.product_reviews
  for select to anon using (status = 'approved');

-- Admin role (auth.jwt() ->> 'role' = 'admin') gets full CRUD
drop policy if exists "reviews_admin_all" on public.product_reviews;
create policy "reviews_admin_all" on public.product_reviews
  for all to authenticated
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');

-- NOTE: there is deliberately NO anon INSERT policy.
-- All submissions go through POST /api/reviews, which verifies the order
-- server-side with the service-role key before inserting a 'pending' row.
