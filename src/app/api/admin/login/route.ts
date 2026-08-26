import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv, isAdminConfigured } from '@/lib/env';
import { verifyAdminPassword, isPbkdf2HashFormat, createSessionToken, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const serverEnv = getServerEnv();

  if (!isAdminConfigured(serverEnv)) {
    return NextResponse.json(
      { ok: false, error: 'Admin not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH (scrypt format), ADMIN_SESSION_SECRET in deployment env. See .env.example and README.' },
      { status: 503 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = (body.email || '').trim();
  const password = body.password || '';

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Email and password required' }, { status: 400 });
  }

  if (email !== serverEnv.ADMIN_EMAIL) {
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
  }

  const storedHash = serverEnv.ADMIN_PASSWORD_HASH!;

  // Security: only pbkdf2$iterations$saltBase64$derivedKeyBase64 accepted – SHA-256/bcrypt/plaintext rejected
  if (!isPbkdf2HashFormat(storedHash)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Admin password hash misconfigured. ADMIN_PASSWORD_HASH must be pbkdf2$iterations$saltBase64$derivedKeyBase64 (WebCrypto – works on Edge + Node runtimes). Generate with src/lib/admin-auth.ts generatePbkdf2Hash or see README. No SHA-256, bcrypt, or plaintext accepted.',
      },
      { status: 500 }
    );
  }

  const { ok } = await verifyAdminPassword(password, storedHash);

  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await createSessionToken(email);
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Failed to create session – missing ADMIN_SESSION_SECRET' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, message: 'Authenticated' });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return res;
}
