import Link from 'next/link';
import { cookies } from 'next/headers';
import { getServerEnv, isAdminConfigured } from '@/lib/env';
import { verifySessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';

export const adminRuntime = { dynamic: 'force-dynamic' as const, runtime: 'edge' as const };

/**
 * Server-side auth state shared by all admin panel pages.
 * Mirrors the pattern in /admin (overview) – dev mock allowed when
 * env is NOT configured; real login required when it is.
 */
export async function getAdminAuth() {
  const serverEnv = getServerEnv();
  const configured = isAdminConfigured(serverEnv);
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = !!session || !configured;
  return { configured, isAuthenticated };
}

/** Renders login-required / dev-mock gate; children only when allowed. */
export async function AdminPanelGuard({ children }: { children: React.ReactNode }) {
  const { configured, isAuthenticated } = await getAdminAuth();

  if (!isAuthenticated && configured) {
    return (
      <div className="bg-white rounded-[20px] border p-12 text-center">
        <h3 className="font-display text-[22px]">Authentication required</h3>
        <p className="mt-2 text-[14px] text-obsidian/60">
          Admin env is configured. Please log in to manage the panel. Session is httpOnly, signed.
        </p>
        <Link href="/admin/login" className="mt-6 inline-flex h-11 px-6 rounded-full bg-obsidian text-white items-center">
          Go to login
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
