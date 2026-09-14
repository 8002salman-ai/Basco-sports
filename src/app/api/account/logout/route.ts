import { NextRequest, NextResponse } from 'next/server';
import { CUSTOMER_COOKIE_OPTIONS, CUSTOMER_SESSION_COOKIE } from '@/lib/customer-auth';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * Sign out. Clears the session cookie and returns to /account, so the plain
 * <form method="post"> in the account page works with JavaScript disabled.
 */
export async function POST(req: NextRequest) {
  const res = NextResponse.redirect(new URL('/account', req.url), 303);
  res.cookies.set(CUSTOMER_SESSION_COOKIE, '', { ...CUSTOMER_COOKIE_OPTIONS, maxAge: 0 });
  return res;
}

export const GET = POST;
