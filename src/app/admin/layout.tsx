import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getServerEnv, isAdminConfigured, getClientEnv, isGaConfigured, isAdSenseConfigured, isSearchConsoleConfigured, isHermesConfigured, isStripeConfigured } from '@/lib/env';
import { verifySessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Admin – Basco Sports',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

function AdminNav({ isConfigured, isAuthenticated }: { isConfigured: boolean; isAuthenticated: boolean }) {
  return (
    <nav className="bg-obsidian text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center"><span className="text-obsidian font-black">B</span></div>
            <span className="font-display font-bold tracking-tight">BASCO ADMIN</span>
            <span className="ml-2 px-2 py-0.5 rounded-full bg-lime text-obsidian text-[10px] font-bold">DEV MOCK</span>
          </Link>
          <div className="hidden lg:flex items-center gap-1 text-[13px]">
            <Link href="/admin" className="px-3 py-1.5 rounded-full hover:bg-white/10">Overview</Link>
            <Link href="/admin/integrations" className="px-3 py-1.5 rounded-full hover:bg-white/10">Integrations</Link>
            <Link href="/" className="px-3 py-1.5 rounded-full hover:bg-white/10">← Storefront</Link>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {isConfigured ? (
            isAuthenticated ? (
              <span className="px-3 py-1 rounded-full bg-white/10">Authenticated • env-protected</span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-amber-400 text-obsidian font-bold">Login required – env configured</span>
            )
          ) : (
            <span className="px-3 py-1 rounded-full bg-amber-200 text-obsidian font-bold">Dev-only mock – no env credentials</span>
          )}
        </div>
      </div>
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const serverEnv = getServerEnv();
  const clientEnv = getClientEnv();
  const configured = isAdminConfigured(serverEnv);

  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? verifySessionToken(token) : null;
  const isAuthenticated = !!session;

  // If admin is configured but not authenticated and not on login page, redirect to login
  // We handle this in page components to allow layout to render nav, but we can pass via headers
  // For simplicity, layout always renders nav + children; pages will check auth

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminNav isConfigured={configured} isAuthenticated={isAuthenticated} />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!configured && (
          <div className="mb-6 rounded-[16px] bg-amber-50 border border-amber-200 p-4 flex gap-3 text-[13px]">
            <span className="font-bold">⚠ Development-only admin mock:</span>
            <span className="opacity-80">
              No ADMIN_EMAIL / ADMIN_PASSWORD_HASH / ADMIN_SESSION_SECRET found in server env. This admin UI is a safe, unprotected mock for local development.
              In production, set those env vars in Vercel / Cloudflare Pages dashboard – ADMIN_PASSWORD_HASH must be scrypt$N$r$p$salt$dk (Node crypto.scrypt, N=16384,r=8,p=1) – and enable secure httpOnly HMAC-signed session cookies.
              Never hardcode credentials, never expose secrets client-side. See README Admin Hardening and .env.example generation command.
            </span>
          </div>
        )}
        {configured && !isAuthenticated && (
          <div className="mb-6 rounded-[16px] bg-blue-50 border border-blue-200 p-4 text-[13px]">
            <span className="font-semibold">Admin env configured – authentication required.</span> Please log in at <Link href="/admin/login" className="underline">/admin/login</Link>. Session is signed with ADMIN_SESSION_SECRET and stored as httpOnly cookie.
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
