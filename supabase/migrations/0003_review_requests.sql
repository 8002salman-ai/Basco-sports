-- ============================================================================
-- BASCO SPORTS – Post-delivery review request support
--
-- "reviewRequestSentAt" doubles as:
--   * the ONE-per-order dedup marker (never email twice), and
--   * the race-safe claim token: src/lib/review-request.ts claims it with a
--     conditional PATCH (...&reviewRequestSentAt=is.null), so concurrent
--     triggers can never double-send.
--
-- No emails are sent while COMMERCE_LIVE is not 'true' (demo orders are
-- never emailed) and while RESEND_API_KEY is absent.
--
-- Run in the Supabase SQL editor (Dashboard → SQL → paste → Run),
-- or apply directly via a Postgres connection.
-- ============================================================================

alter table public.orders add column if not exists "reviewRequestSentAt" timestamptz;
