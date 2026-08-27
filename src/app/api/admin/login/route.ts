import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv, isAdminConfigured } from '@/lib/env';
import { verifyAdminPassword, isPbkdf2HashFormat, createSessionToken, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const serverEnv = getServerEnv();

  if (!isAdminConfigured(serverEnv)) {
    return NextResponse.json(
      { ok: false, error: 'Admin not configured. Set ADMIN_SESSION_SECRET in deployment env.' },
      { status: 503 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Email and password required' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = serverEnv.SUPABASE_SERVICE_ROLE_KEY;

  // Try multi-user DB auth first (admin_users table)
  if (supabaseUrl && serviceKey) {
    try {
      const resp = await fetch(`${supabaseUrl}/rest/v1/admin_users?email=eq.${encodeURIComponent(email)}&select=*`, {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (resp.ok) {
        const users = await resp.json();
        if (users && users.length > 0) {
          const user = users[0];

          if (!user.is_active) {
            return NextResponse.json({ ok: false, error: 'Account is disabled' }, { status: 403 });
          }

          const storedHash = user.password_hash;
          if (isPbkdf2HashFormat(storedHash)) {
            const { ok } = await verifyAdminPassword(password, storedHash);
            if (ok) {
              const role = user.role as 'owner' | 'admin';
              const token = await createSessionToken(email, user.name || email, role);
              if (token) {
                // Update last login (best effort)
                fetch(`${supabaseUrl}/rest/v1/admin_users?email=eq.${encodeURIComponent(email)}`, {
                  method: 'PATCH',
                  headers: {
                    'apikey': serviceKey,
                    'Authorization': `Bearer ${serviceKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                  },
                  body: JSON.stringify({ updated_at: new Date().toISOString() }),
                }).catch(() => {});

                const res = NextResponse.json({ ok: true, message: 'Authenticated', role });
                res.cookies.set(ADMIN_SESSION_COOKIE, token, {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  path: '/',
                  maxAge: ADMIN_SESSION_MAX_AGE,
                });
                return res;
              }
            }
          }
        }
      }
    } catch {
      // admin_users table may not exist yet — fall back to env-based auth
    }
  }

  // Fallback: legacy single-user env-based auth
  if (email !== serverEnv.ADMIN_EMAIL) {
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
  }

  const storedHash = serverEnv.ADMIN_PASSWORD_HASH!;

  if (!isPbkdf2HashFormat(storedHash)) {
    return NextResponse.json(
      { ok: false, error: 'Admin password hash misconfigured.' },
      { status: 500 }
    );
  }

  const { ok } = await verifyAdminPassword(password, storedHash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await createSessionToken(email, email, 'owner');
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Failed to create session' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, message: 'Authenticated', role: 'owner' });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return res;
}
