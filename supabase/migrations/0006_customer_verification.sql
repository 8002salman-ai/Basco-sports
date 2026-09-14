-- 0006_customer_verification.sql
--
-- What this adds
-- --------------
-- Storefront signup no longer demands an order number, so "may this account see
-- order data?" becomes its own fact. Orders link to a customer by email alone
-- (there is no user foreign key), so an approved account is what authorises the
-- /account page to read them.
--
--   verified = false → signed in, but sees "pending approval" and no orders.
--   verified = true  → sees its own orders.
--
-- The approval surface is the admin console's Users panel (owner/admin session,
-- service-role proxy): rows the console creates are approved on creation, and
-- self-signed-up rows wait in the Pending tab.

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT false;

-- Rows that predate open signup were already vouched for: either the console
-- created them (no credential) or the customer proved an order number. Keep them
-- approved so nobody who could see their orders before loses access. New rows
-- take the column default (false) and wait for approval.
UPDATE public.users SET verified = true;
