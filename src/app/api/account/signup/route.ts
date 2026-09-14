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
 * Signup is open — no order number — but a new account starts **unapproved**
 * and sees no orders until the store approves it in the admin console. Orders
 * link to a customer by email alone (public.orders has no user foreign key), so
 * that approval is what stops someone registering an address that is not theirs
 * and reading its order history. `verified` is the flag the /account page reads;
 * the console's Users panel is the approval surface.
 *
 * A row can already exist for the email: the console's Users panel creates
 * customers by hand. Claiming that row (instead of inserting a duplicate) is what
 * lets an onboarded customer set a password. Those rows are created approved, so
 * claiming one keeps its `verified` value.
 */

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 200;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignupInput {
  email?: string;
  password?: string;
  name?: string;
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

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, error: 'Enter a valid email address.' }, { status: 400 });
  }
  if (password.length < MIN_PASSWORD_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }

  // Operator-created rows have no credential yet and are approved on creation;
  // anything with a credential or a block is refused. The email is matched
  // exactly — as a pattern, an address containing '%' or '_' would claim a row
  // that is not its own.
  const existing = await rest.request<
    { id: string; name: string | null; password_hash: string | null; isBlocked: boolean | null; verified: boolean | null }[]
  >(`users?select=id,name,password_hash,isBlocked,verified&email=eq.${encodeURIComponent(email)}&limit=1`);
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
  const verified = claimable?.verified === true;
  const stored = claimable
    ? await rest.request(`users?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ password_hash: passwordHash, name: name || undefined, updatedAt: new Date().toISOString() }),
      })
    : await rest.request('users', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        // role 'buyer' is what puts the account in the console's Users panel.
        body: JSON.stringify({
          id,
          email,
          name: name || null,
          role: 'buyer',
          verified: false,
          password_hash: passwordHash,
          updatedAt: new Date().toISOString(),
        }),
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

  const res = NextResponse.json({ ok: true, email, verified });
  res.cookies.set(CUSTOMER_SESSION_COOKIE, token, CUSTOMER_COOKIE_OPTIONS);
  return res;
}
