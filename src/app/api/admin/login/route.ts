import { NextRequest, NextResponse } from 'next/server';
import { getServerEnv, isAdminConfigured } from '@/lib/env';
import { verifyPasswordScrypt, isScryptHashFormat, createSessionToken, ADMIN_SESSION_COOKIE, ADMIN_SESSION_MAX_AGE } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

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

  // Security: only scrypt$N$r$p$salt$dk format accepted – SHA-256/bcrypt removed
  if (!isScryptHashFormat(storedHash)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Admin password hash misconfigured. ADMIN_PASSWORD_HASH must be in format scrypt$N$r$p$saltBase64$derivedKeyBase64. Generate with: node -e "const c=require(\'crypto\'); const salt=c.randomBytes(16); c.scrypt(\'YourStrongPassword\',salt,64,{N:16384,r:8,p:1},(e,k)=>{console.log(`scrypt$16384$8$1$${salt.toString(\'base64\')}$${k.toString(\'base64\')}`)})" – See .env.example and README. No SHA-256, bcrypt, or plaintext accepted.',
      },
      { status: 500 }
    );
  }

  const { ok } = await verifyPasswordScrypt(password, storedHash);

  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 });
  }

  const token = createSessionToken(email);
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
