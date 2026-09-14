import { NextRequest, NextResponse } from 'next/server';
import { getServiceRest, isRows } from '@/lib/supabase-rest';
import { generatePbkdf2Hash } from '@/lib/admin-auth';
import {
  CUSTOMER_COOKIE_OPTIONS,
  CUSTOMER_SESSION_COOKIE,
  createCustomerSession,
  customerAuthConfigured,
} from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * Create a storefront account.
 *
 * Orders are linked to a customer by email alone (public.orders has no user
 * foreign key), so an open signup would let anyone claim someone else's email
 * and read their order history. Instead the caller must prove the email is
 * theirs: the order number that was emailed with a real order for that same
 * address. Verification happens here, server-side, against the orders table.
 */

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** Keeps the value safe to put in a PostgREST filter. */
const ORDER_NUMBER_RE = /^[A-Za-z0-9-]{4,40}$/;

interface SignupInput {
  email?: string;
  password?: string;
  name?: string;
  orderNumber?: string;
}

export async function POST(req: NextRequest) {
  const rest = getServiceRest();
  if (!rest || !customerAuthConfigured()) {
    return NextResponse.json({ ok: false, error: 'Accounts are not available right now.' }, { status: 503 });
  }

  let body: SignupInput;
  try {
    body = (await req.json()) as SignupInput;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const name = (body.name || '').trim();
  const orderNumber = (body.orderNumber || '').trim();

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }
  if (!ORDER_NUMBER_RE.test(orderNumber)) {
    return NextResponse.json(
      { ok: false, error: 'Enter the order number from your confirmation email (for example BS-123456).' },
      { status: 400 },
    );
  }

  // Proof of purchase: the order number and the email must belong to the same
  // order. The email is matched exactly — as a pattern, an address containing
  // '%' or '_' would claim an order that is not its own. The order number may
  // use a pattern safely: ORDER_NUMBER_RE above excludes every wildcard
  // character, so `ilike` here only buys case-insensitivity.
  const proof = await rest.request<{ orderNumber: string }[]>(
    `orders?select=orderNumber&orderNumber=ilike.${encodeURIComponent(orderNumber)}` +
      `&customerEmail=eq.${encodeURIComponent(email)}&limit=1`,
  );
  if (!proof.ok) {
    return NextResponse.json({ ok: false, error: 'Could not verify your order right now. Try again.' }, { status: 503 });
  }
  if (!isRows(proof.data) || proof.data.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: `We could not find order ${orderNumber} for ${email}. Use the number from your confirmation email, or the address you ordered with.`,
      },
      { status: 403 },
    );
  }

  // The console's Users panel writes the same table, so a row may already exist
  // for this email. With no credential on it, the proof of purchase above is
  // exactly what lets its owner claim it — anything else would leave that
  // customer permanently unable to sign in.
  const existing = await rest.request<{ id: string; name: string | null; password_hash: string | null; isBlocked: boolean | null }[]>(
    `users?select=id,name,password_hash,isBlocked&email=eq.${encodeURIComponent(email)}&limit=1`,
  );
  const claimable = existing.ok && isRows(existing.data) ? existing.data[0] : undefined;

  if (claimable?.isBlocked) {
    return NextResponse.json(
      { ok: false, error: 'This account is blocked. Contact support@basco-sports.com.' },
      { status: 403 },
    );
  }
  if (claimable?.password_hash) {
    return NextResponse.json(
      { ok: false, error: 'An account already exists for this email. Sign in instead.' },
      { status: 409 },
    );
  }

  const passwordHash = await generatePbkdf2Hash(password);
  const id = claimable?.id || `user_${crypto.randomUUID()}`;
  const stored = claimable
    ? await rest.request(`users?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ password_hash: passwordHash, name: name || undefined, updatedAt: new Date().toISOString() }),
      })
    : await rest.request('users', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ id, email, name: name || null, password_hash: passwordHash, updatedAt: new Date().toISOString() }),
      });

  if (!stored.ok) {
    // 409 = another request created this email between the check and the write.
    if (stored.status === 409) {
      return NextResponse.json(
        { ok: false, error: 'An account already exists for this email. Sign in instead.' },
        { status: 409 },
      );
    }
    return NextResponse.json({ ok: false, error: 'Could not create the account. Try again.' }, { status: 503 });
  }

  const token = await createCustomerSession({ id, email, name: name || claimable?.name || undefined });
  if (!token) {
    return NextResponse.json({ ok: false, error: 'Could not create the session.' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true, email });
  res.cookies.set(CUSTOMER_SESSION_COOKIE, token, CUSTOMER_COOKIE_OPTIONS);
  return res;
}
