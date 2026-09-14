import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServiceRest, isRows } from '@/lib/supabase-rest';
import { generatePbkdf2Hash, verifyPasswordPbkdf2 } from '@/lib/admin-auth';
import {
  CUSTOMER_COOKIE_OPTIONS,
  CUSTOMER_SESSION_COOKIE,
  createCustomerSession,
  customerAuthConfigured,
  verifyCustomerSession,
} from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  const rest = getServiceRest();
  if (!rest || !customerAuthConfigured()) {
    return NextResponse.json({ ok: false, error: 'This action is not available right now.' }, { status: 503 });
  }

  // ── 1. Verify the caller is signed in ──────────────────────────────
  const token = cookies().get(CUSTOMER_SESSION_COOKIE)?.value;
  const session = token ? await verifyCustomerSession(token) : null;
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Please sign in to change your password.' }, { status: 401 });
  }

  // ── 2. Parse and validate input ────────────────────────────────────
  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 });
  }

  const currentPassword = body.currentPassword || '';
  const newPassword = body.newPassword || '';

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ ok: false, error: 'Both current and new password are required.' }, { status: 400 });
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { ok: false, error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
      { status: 400 },
    );
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ ok: false, error: 'New password must be different from the current one.' }, { status: 400 });
  }

  // ── 3. Fetch the user row (password_hash + session_version) ────────
  interface UserRow {
    id: string;
    password_hash: string | null;
    session_version: number;
  }
  const found = await rest.request<UserRow[]>(
    `users?select=id,password_hash,session_version&id=eq.${encodeURIComponent(session.userId)}&limit=1`,
  );
  if (!found.ok || !isRows<UserRow>(found.data) || !found.data[0]?.password_hash) {
    return NextResponse.json({ ok: false, error: 'Account not found.' }, { status: 401 });
  }
  const user = found.data[0];
  const currentHash = user.password_hash as string; // narrowed by the guard above

  // ── 4. Verify current password ─────────────────────────────────────
  const { ok } = await verifyPasswordPbkdf2(currentPassword, currentHash);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Current password is incorrect.' }, { status: 403 });
  }

  // ── 5. Hash new password, bump session_version, write both ──────────
  const newPasswordHash = await generatePbkdf2Hash(newPassword);
  const newVersion = user.session_version + 1;

  const patchRes = await rest.request(
    `users?id=eq.${encodeURIComponent(user.id)}`,
    {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        password_hash: newPasswordHash,
        session_version: newVersion,
        updatedAt: new Date().toISOString(),
      }),
    },
  );
  if (!patchRes.ok) {
    return NextResponse.json({ ok: false, error: 'Could not update password. Please try again.' }, { status: 500 });
  }

  // ── 6. Issue a fresh session token at the new version ───────────────
  //    The old cookie is replaced, so this browser keeps access while every
  //    other browser/device is signed out (their tokens carry the old version
  //    and will be rejected by verifyCustomerSession).
  const newToken = await createCustomerSession({
    id: user.id,
    email: session.email,
    name: session.name || undefined,
    sessionVersion: newVersion,
  });
  if (!newToken) {
    return NextResponse.json({ ok: false, error: 'Could not create session.' }, { status: 500 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(CUSTOMER_SESSION_COOKIE, newToken, CUSTOMER_COOKIE_OPTIONS);
  return res;
}
