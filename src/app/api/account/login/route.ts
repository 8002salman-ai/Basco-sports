import { NextRequest, NextResponse } from 'next/server';
import { getServiceRest, isRows } from '@/lib/supabase-rest';
import { verifyPasswordPbkdf2 } from '@/lib/admin-auth';
import {
  CUSTOMER_COOKIE_OPTIONS,
  CUSTOMER_SESSION_COOKIE,
  createCustomerSession,
  customerAuthConfigured,
} from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/** A storefront account row, as stored in public.users. */
interface CustomerUser {
  id: string;
  email: string;
  name: string | null;
  password_hash: string | null;
  isBlocked: boolean | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Same response for a missing account and a wrong password — no enumeration. */
const BAD_CREDENTIALS = { ok: false, error: 'Email or password is incorrect.' };

export async function POST(req: NextRequest) {
  const rest = getServiceRest();
  if (!rest || !customerAuthConfigured()) {
    return NextResponse.json({ ok: false, error: 'Sign-in is not available right now.' }, { status: 503 });
  }

  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!EMAIL_RE.test(email) || !password) {
    return NextResponse.json(BAD_CREDENTIALS, { status: 401 });
  }

  const found = await rest.request<CustomerUser[]>(
    `users?select=id,email,name,password_hash,isBlocked&email=eq.${encodeURIComponent(email)}&limit=1`,
  );
  if (!found.ok) {
    return NextResponse.json({ ok: false, error: 'Sign-in is not available right now.' }, { status: 503 });
  }

  const user = isRows<CustomerUser>(found.data) ? found.data[0] : undefined;
  if (!user?.password_hash) {
    return NextResponse.json(BAD_CREDENTIALS, { status: 401 });
  }

  const { ok } = await verifyPasswordPbkdf2(password, user.password_hash);
  if (!ok) {
    return NextResponse.json(BAD_CREDENTIALS, { status: 401 });
  }

  if (user.isBlocked) {
    return NextResponse.json(
      { ok: false, error: 'This account is blocked. Contact support@basco-sports.com.' },
      { status: 403 },
    );
  }

  // Best effort — a failed timestamp write must not fail a valid sign-in.
  void rest
    .request(`users?id=eq.${encodeURIComponent(user.id)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ lastLoginAt: new Date().toISOString() }),
    })
    .catch(() => {});

  const token = await createCustomerSession({ id: user.id, email: user.email, name: user.name || undefined });
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Could not create the session.' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, email: user.email });
  res.cookies.set(CUSTOMER_SESSION_COOKIE, token, CUSTOMER_COOKIE_OPTIONS);
  return res;
}
