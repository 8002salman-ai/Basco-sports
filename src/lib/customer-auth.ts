/**
 * Basco Sports – Customer accounts (server-only).
 *
 * /account used to be a client-side mock: any email "signed in" to a
 * placeholder dashboard. This is the real thing — a pbkdf2 credential on
 * public.users, an httpOnly signed session cookie, and orders read from the
 * session's own email.
 *
 * Hashing and the session primitives are shared with the admin console
 * (src/lib/admin-auth.ts owns the pbkdf2 format and the HMAC signer). Session
 * signing keeps one deliberate difference: the signature covers a
 * customer-scoped domain string, so an admin cookie can never satisfy this
 * verifier and a customer cookie can never satisfy the admin one, even though
 * both are signed with the deployment's session secret.
 */

import { getServerEnv } from './env';
import { bytesToB64Url, b64UrlToBytes, hmacSha256, timingSafeEqualBytes } from './admin-auth';

export const CUSTOMER_SESSION_COOKIE = 'basco_customer_session';
export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/** Everything signed under this prefix is a customer session, and only that. */
const SIGNING_DOMAIN = 'basco-customer-v1';

export interface CustomerSession {
  userId: string;
  email: string;
  name?: string;
  exp: number;
}

export const CUSTOMER_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: CUSTOMER_SESSION_MAX_AGE,
};

/** The deployment's one signing secret; the domain string separates the cookies. */
function sessionSecret(): string | null {
  return getServerEnv().ADMIN_SESSION_SECRET;
}

export function customerAuthConfigured(): boolean {
  return !!sessionSecret();
}

export async function createCustomerSession(user: { id: string; email: string; name?: string }): Promise<string | null> {
  const secret = sessionSecret();
  if (!secret) return null;
  const payload: CustomerSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + CUSTOMER_SESSION_MAX_AGE,
  };
  const body = bytesToB64Url(new TextEncoder().encode(JSON.stringify(payload)));
  return `${body}.${await hmacSha256(secret, `${SIGNING_DOMAIN}.${body}`)}`;
}

export async function verifyCustomerSession(token: string): Promise<CustomerSession | null> {
  const secret = sessionSecret();
  if (!secret || !token) return null;

  const [body, signature] = token.split('.');
  if (!body || !signature) return null;

  const expected = await hmacSha256(secret, `${SIGNING_DOMAIN}.${body}`);
  if (!timingSafeEqualBytes(new TextEncoder().encode(signature), new TextEncoder().encode(expected))) return null;

  try {
    const payload = JSON.parse(new TextDecoder().decode(b64UrlToBytes(body))) as CustomerSession;
    if (!payload.userId || !payload.email || !payload.exp) return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
