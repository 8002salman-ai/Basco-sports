import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerEnv, isAdminConfigured } from '@/lib/env';
import { verifySessionToken, ADMIN_SESSION_COOKIE, generatePbkdf2Hash } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * Migration endpoint: Creates admin_users table and seeds initial admin accounts.
 * Run once to set up multi-user auth.
 */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServerEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return { url, key };
}

function headers(key: string) {
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // Allow unauthenticated if admin not configured (dev mode)
  const serverEnv = getServerEnv();
  const configured = isAdminConfigured(serverEnv);
  if (!session && configured) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 503 });
  }

  const results: string[] = [];
  const errors: string[] = [];

  // Step 1: Check if admin_users table exists
  try {
    const checkResp = await fetch(`${sb.url}/rest/v1/admin_users?select=id&limit=1`, {
      headers: headers(sb.key),
    });
    
    if (checkResp.ok) {
      results.push('✅ admin_users table already exists');
      
      // Check if seed data exists
      const usersResp = await fetch(`${sb.url}/rest/v1/admin_users?select=email&limit=10`, {
        headers: headers(sb.key),
      });
      const users = await usersResp.json();
      results.push(`📊 Found ${users.length} admin users`);
      
      return NextResponse.json({ ok: true, results, errors });
    }
  } catch {
    // Table doesn't exist, need to create it
  }

  // Step 2: Create admin_users table using Supabase SQL Editor
  // Since we can't run raw SQL via REST, we'll use the table creation approach
  // The user needs to run the migration SQL manually in Supabase dashboard
  
  results.push('⚠️ admin_users table does not exist');
  results.push('');
  results.push('Please run this SQL in Supabase SQL Editor:');
  results.push('https://supabase.com/dashboard/project/ljzpwkzdudnyowzkzgtc/sql/new');
  results.push('');
  results.push(`CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users (email);`);

  return NextResponse.json({ ok: false, results, errors, sqlNeeded: true });
}

export async function GET(req: NextRequest) {
  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const resp = await fetch(`${sb.url}/rest/v1/admin_users?select=id,email,name,role,is_active,created_at&order=created_at.desc`, {
      headers: headers(sb.key),
    });
    
    if (!resp.ok) {
      return NextResponse.json({ ok: false, error: 'Table does not exist', tableExists: false });
    }
    
    const users = await resp.json();
    return NextResponse.json({ ok: true, data: users, tableExists: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to check table', tableExists: false });
  }
}
