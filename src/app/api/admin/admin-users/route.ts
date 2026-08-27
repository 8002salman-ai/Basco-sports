import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerEnv, isAdminConfigured } from '@/lib/env';
import { verifySessionToken, ADMIN_SESSION_COOKIE, generatePbkdf2Hash, type AdminRole } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * Admin user management API.
 * GET    — list all admin users
 * POST   — create new admin user
 * PATCH  — update admin user (role, active, password)
 * DELETE — delete admin user (soft delete: set is_active=false)
 * 
 * Only 'owner' role can manage users.
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

export async function GET(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || session.role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'Unauthorized — owner only' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 503 });
  }

  try {
    const resp = await fetch(`${sb.url}/rest/v1/admin_users?select=id,email,name,role,is_active,created_at,updated_at&order=created_at.desc`, {
      headers: headers(sb.key),
    });
    const users = await resp.json();
    // Strip password_hash from response
    const safeUsers = users.map((u: any) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      is_active: u.is_active,
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));
    return NextResponse.json({ ok: true, data: safeUsers });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to load users' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || session.role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'Unauthorized — owner only' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 503 });
  }

  let body: { email?: string; password?: string; name?: string; role?: AdminRole };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const name = (body.name || '').trim() || email;
  const role: AdminRole = body.role === 'owner' ? 'owner' : 'admin';

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Email and password required' }, { status: 400 });
  }

  if (password.length < 4) {
    return NextResponse.json({ ok: false, error: 'Password must be at least 4 characters' }, { status: 400 });
  }

  // Check if email already exists
  try {
    const checkResp = await fetch(`${sb.url}/rest/v1/admin_users?email=eq.${encodeURIComponent(email)}&select=id`, {
      headers: headers(sb.key),
    });
    const existing = await checkResp.json();
    if (existing && existing.length > 0) {
      return NextResponse.json({ ok: false, error: 'Email already exists' }, { status: 409 });
    }
  } catch {
    // Continue even if check fails
  }

  // Hash password
  const passwordHash = await generatePbkdf2Hash(password);

  // Insert user
  try {
    const resp = await fetch(`${sb.url}/rest/v1/admin_users`, {
      method: 'POST',
      headers: {
        ...headers(sb.key),
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        email,
        password_hash: passwordHash,
        name,
        role,
        is_active: true,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      return NextResponse.json({ ok: false, error: `Failed to create user: ${err}` }, { status: 500 });
    }

    const [newUser] = await resp.json();
    return NextResponse.json({
      ok: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        is_active: newUser.is_active,
        created_at: newUser.created_at,
      },
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || session.role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'Unauthorized — owner only' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 503 });
  }

  let body: { id?: string; role?: AdminRole; is_active?: boolean; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ ok: false, error: 'User ID required' }, { status: 400 });
  }

  // Prevent owner from deactivating themselves
  if (body.is_active === false) {
    const checkResp = await fetch(`${sb.url}/rest/v1/admin_users?id=eq.${body.id}&select=email,role`, {
      headers: headers(sb.key),
    });
    const target = await checkResp.json();
    if (target?.[0]?.email === session.email) {
      return NextResponse.json({ ok: false, error: 'Cannot deactivate your own account' }, { status: 400 });
    }
  }

  // Prevent demoting the last owner
  if (body.role === 'admin') {
    const checkResp = await fetch(`${sb.url}/rest/v1/admin_users?role=eq.owner&select=id`, {
      headers: headers(sb.key),
    });
    const owners = await checkResp.json();
    if (owners && owners.length <= 1) {
      const targetResp = await fetch(`${sb.url}/rest/v1/admin_users?id=eq.${body.id}&select=role`, {
        headers: headers(sb.key),
      });
      const target = await targetResp.json();
      if (target?.[0]?.role === 'owner') {
        return NextResponse.json({ ok: false, error: 'Cannot demote the last owner' }, { status: 400 });
      }
    }
  }

  const patch: Record<string, any> = { updated_at: new Date().toISOString() };
  if (body.role) patch.role = body.role;
  if (body.is_active !== undefined) patch.is_active = body.is_active;
  if (body.name) patch.name = body.name;
  if (body.password) {
    if (body.password.length < 4) {
      return NextResponse.json({ ok: false, error: 'Password must be at least 4 characters' }, { status: 400 });
    }
    patch.password_hash = await generatePbkdf2Hash(body.password);
  }

  try {
    const resp = await fetch(`${sb.url}/rest/v1/admin_users?id=eq.${body.id}`, {
      method: 'PATCH',
      headers: {
        ...headers(sb.key),
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(patch),
    });

    if (!resp.ok) {
      return NextResponse.json({ ok: false, error: 'Failed to update user' }, { status: 500 });
    }

    const [updated] = await resp.json();
    return NextResponse.json({
      ok: true,
      data: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        is_active: updated.is_active,
        created_at: updated.created_at,
      },
    });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session || session.role !== 'owner') {
    return NextResponse.json({ ok: false, error: 'Unauthorized — owner only' }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ ok: false, error: 'Database not configured' }, { status: 503 });
  }

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ ok: false, error: 'User ID required' }, { status: 400 });
  }

  // Prevent deleting yourself
  const checkResp = await fetch(`${sb.url}/rest/v1/admin_users?id=eq.${body.id}&select=email,role`, {
    headers: headers(sb.key),
  });
  const target = await checkResp.json();
  if (target?.[0]?.email === session.email) {
    return NextResponse.json({ ok: false, error: 'Cannot delete your own account' }, { status: 400 });
  }

  // Prevent deleting the last owner
  if (target?.[0]?.role === 'owner') {
    const ownersResp = await fetch(`${sb.url}/rest/v1/admin_users?role=eq.owner&select=id`, {
      headers: headers(sb.key),
    });
    const owners = await ownersResp.json();
    if (owners && owners.length <= 1) {
      return NextResponse.json({ ok: false, error: 'Cannot delete the last owner' }, { status: 400 });
    }
  }

  // Soft delete: deactivate
  try {
    const resp = await fetch(`${sb.url}/rest/v1/admin_users?id=eq.${body.id}`, {
      method: 'PATCH',
      headers: {
        ...headers(sb.key),
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ is_active: false, updated_at: new Date().toISOString() }),
    });

    if (!resp.ok) {
      return NextResponse.json({ ok: false, error: 'Failed to delete user' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: 'Failed to delete user' }, { status: 500 });
  }
}
