-- 0003_admin_users.sql
-- Multi-user admin auth: owner + admin roles with different permissions

-- Admin users table (separate from storefront 'users' table)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed Salman (owner) and Khurram (admin)
INSERT INTO admin_users (email, password_hash, name, role, is_active) VALUES
  ('8002salman@gmail.com', 'pbkdf2$600000$x44zMNg1nyH1PQeBhLZbNg==$G/+Rzl9HjzZ/jaxaIsvprcrnU09gFpYkjSURxC1hevs=', 'Salman Bashir', 'owner', true),
  ('k@basco-sports.com', 'pbkdf2$600000$jxU2P0aNTrimG6RckGmBTA==$78Mf1OpHwgLvQGKJ/2lII8MSTmlcHubDInm3pn6TIq4=', 'Khurram', 'admin', true)
ON CONFLICT (email) DO NOTHING;

-- Index for fast login lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users (role);

-- RLS: only service-role can access (via DB proxy)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Allow anon read (for login endpoint via service role)
CREATE POLICY "admin_users_service_only" ON admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
