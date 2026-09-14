-- ============================================================================
-- BASCO SPORTS – Customer accounts
--
-- /account used to be a client-side mock: any email "signed in" to a
-- placeholder dashboard. Real sign-in needs somewhere to keep a password, so
-- this adds the credential columns to the storefront's existing public.users
-- table — the same table the admin console already manages (Users panel).
--
-- `password_hash` is nullable on purpose: a row created by an operator has no
-- credential until its owner sets one by signing up. The format is the same
-- pbkdf2$iterations$salt$key the admin console uses, so both account types
-- share one verifier (src/lib/admin-auth.ts).
--
-- Nothing here grants a customer anything: role stays 'buyer' (signup never
-- sets it) and isBlocked stays under operator control — the login route now
-- enforces it, so the console's block toggle actually means something.
-- ============================================================================

alter table public.users
  add column if not exists password_hash text,
  add column if not exists "updatedAt" timestamptz not null default now(),
  add column if not exists "lastLoginAt" timestamptz;

-- Orders are matched to an account by email, and the pipeline now stores that
-- address trimmed and lowercased so the read can match exactly. Normalize rows
-- written before that, so an existing customer always sees their own orders.
update public.orders
   set "customerEmail" = lower(trim("customerEmail"))
 where "customerEmail" <> lower(trim("customerEmail"));
