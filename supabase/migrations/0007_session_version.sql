-- session_version lets password changes invalidate all outstanding tokens.
-- Each signed token carries the version it was issued with; verifyCustomerSession
-- checks the DB value. On password change we bump the column, so every old token
-- (with the previous number) is rejected without a server-side session store.
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS session_version integer NOT NULL DEFAULT 1;
