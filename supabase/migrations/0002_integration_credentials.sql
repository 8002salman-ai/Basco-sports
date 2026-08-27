-- ============================================================================
-- BASCO SPORTS – Add integration credential columns to store_settings
-- Stores Cloudflare + Supabase API keys for admin panel editing.
-- ============================================================================

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS "cloudflareApiToken" text,
  ADD COLUMN IF NOT EXISTS "cloudflareAccountId" text,
  ADD COLUMN IF NOT EXISTS "cloudflareR2Endpoint" text,
  ADD COLUMN IF NOT EXISTS "cloudflareR2AccessKeyId" text,
  ADD COLUMN IF NOT EXISTS "cloudflareR2SecretAccessKey" text,
  ADD COLUMN IF NOT EXISTS "cloudflareR2BucketName" text,
  ADD COLUMN IF NOT EXISTS "cloudflarePagesProject" text,
  ADD COLUMN IF NOT EXISTS "supabaseProjectUrl" text,
  ADD COLUMN IF NOT EXISTS "supabaseAnonKey" text,
  ADD COLUMN IF NOT EXISTS "supabaseServiceRoleKey" text,
  ADD COLUMN IF NOT EXISTS "supabaseDbPassword" text,
  ADD COLUMN IF NOT EXISTS "supabaseProjectRef" text;
