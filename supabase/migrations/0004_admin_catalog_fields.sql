-- ============================================================================
-- BASCO SPORTS – Listing-workflow fields on the product catalog
--
-- The admin console edits a few values that are not part of the storefront's
-- Product contract: supplier cost, sourcing, readiness and stock policy. They
-- live on the same row as the product so the console and the storefront read
-- ONE catalog instead of two.
--
-- Anything derivable (margin from cost/price, image status from images) is
-- deliberately NOT stored — it is computed once in src/lib/admin/types.ts.
--
-- Backfill is deliberately conservative: `cost` starts at 55% of the selling
-- price so the margin rules have an editable starting point rather than an
-- unknown, and `readiness` follows the product's current visibility. Both are
-- meant to be corrected by an operator.
-- ============================================================================

alter table public.products
  add column if not exists sku text not null default '',
  add column if not exists cost numeric,
  add column if not exists readiness text not null default 'DRAFT',
  add column if not exists "sourceType" text not null default 'IN_HOUSE',
  add column if not exists fulfillment text not null default 'IN_HOUSE',
  add column if not exists "inventorySource" text not null default 'MANUAL',
  add column if not exists "lowStockThreshold" integer not null default 5,
  add column if not exists "supplierUrl" text,
  -- Part of the storefront's Product contract that 0001 left out.
  add column if not exists compliance jsonb not null default '{}'::jsonb;

update public.products
   set sku = 'BS-' || upper(id)
 where sku = '';

update public.products
   set cost = round(price * 0.55, 2)
 where cost is null;

update public.products
   set readiness = 'COMMERCE_READY'
 where readiness = 'DRAFT'
   and "isActive";
