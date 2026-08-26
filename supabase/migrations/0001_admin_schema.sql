-- ============================================================================
-- BASCO SPORTS – Admin data layer schema
-- Used by src/lib/admin/db.ts (SupabaseAdapter) when
-- NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are configured.
--
-- Pattern (ported from the Luxedge admin system):
--   * anon role can READ active products (storefront catalog)
--   * all writes (admin CRUD) go through the authenticated admin role
--   * no secrets live in this schema
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id text primary key,
  slug text unique not null,
  name text not null,
  brand text not null default 'Basco Equipment',
  category text not null,
  categories text[] not null default '{}',
  price numeric not null default 0,
  "compareAtPrice" numeric,
  badges text[] not null default '{}',
  rating numeric not null default 0,
  "reviewCount" integer not null default 0,
  stock integer not null default 0,
  description text not null default '',
  features text[] not null default '{}',
  specifications jsonb not null default '{}',
  variants jsonb not null default '[]',
  "defaultVariantIndex" integer not null default 0,
  images text[] not null default '{}',
  featured boolean not null default false,
  trending boolean not null default false,
  "newArrival" boolean not null default false,
  "isActive" boolean not null default true,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id text primary key,
  "orderNumber" text not null,
  "customerEmail" text not null,
  "customerName" text,
  items jsonb not null default '[]',
  subtotal numeric not null default 0,
  discount numeric not null default 0,
  tax numeric not null default 0,
  total numeric not null default 0,
  currency text not null default 'USD',
  status text not null default 'paid',
  coupon text,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Users (storefront sign-ups / admin roles)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id text primary key,
  email text unique not null,
  name text,
  role text not null default 'buyer',
  "isBlocked" boolean not null default false,
  "createdAt" timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Store settings (key-value, PK is key)
-- ---------------------------------------------------------------------------
create table if not exists public.store_settings (
  key text primary key,
  "storeName" text not null default 'Basco Sports',
  "supportEmail" text not null default 'support@basco-sports.com',
  currency text not null default 'USD',
  announcement text,
  "paymentProvider" text not null default 'demo',
  "updatedAt" timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.users enable row level security;
alter table public.store_settings enable row level security;

-- Storefront can read active products anonymously
drop policy if exists "products_anon_read_active" on public.products;
create policy "products_anon_read_active" on public.products
  for select to anon using ("isActive" = true);

-- Admin role (set as app_metadata.role = 'admin' on the auth user) gets full CRUD
drop policy if exists "products_admin_all" on public.products;
create policy "products_admin_all" on public.products
  for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "orders_admin_all" on public.orders;
create policy "orders_admin_all" on public.orders
  for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "users_admin_all" on public.users;
create policy "users_admin_all" on public.users
  for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

drop policy if exists "settings_admin_all" on public.store_settings;
create policy "settings_admin_all" on public.store_settings
  for all to authenticated using (auth.jwt() ->> 'role' = 'admin') with check (auth.jwt() ->> 'role' = 'admin');

-- Any authenticated user may read store settings (no secrets in there)
drop policy if exists "settings_auth_read" on public.store_settings;
create policy "settings_auth_read" on public.store_settings
  for select to authenticated using (true);
