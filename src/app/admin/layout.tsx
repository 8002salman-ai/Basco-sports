import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getServerEnv, isAdminConfigured } from '@/lib/env';
import { verifySessionToken, ADMIN_SESSION_COOKIE, type AdminSessionPayload } from '@/lib/admin-auth';

export const metadata: Metadata = {
  title: 'Admin – Basco Sports',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

interface NavItem {
  href: string;
  label: string;
  ownerOnly?: boolean;
}

const NAV_SECTIONS: { title?: string; items: NavItem[] }[] = [
  { items: [{ href: '/admin', label: 'Overview' }] },
  {
    title: 'Commerce',
    items: [
      { href: '/admin/catalog', label: 'Catalog' },
      { href: '/admin/orders', label: 'Orders' },
      { href: '/admin/reviews', label: 'Reviews' },
      { href: '/admin/users', label: 'Store Users' },
    ],
  },
  {
    title: 'Intelligence',
    items: [{ href: '/admin/hermes', label: 'Hermes Intel' }],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/integrations', label: 'Integrations' },
      { href: '/admin/settings', label: 'Settings' },
      { href: '/admin/team', label: 'Team', ownerOnly: true },
    ],
  },
];

function AdminNav({ session }: { session: AdminSessionPayload | null }) {
  return (
    <nav className="bg-obsidian text-white">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-obsidian font-black">B</span>
            </div>
            <span className="font-display font-bold tracking-tight">BASCO ADMIN</span>
          </Link>
          <Link href="/" className="hidden lg:inline-flex px-3 py-1.5 rounded-full text-[13px] hover:bg-white/10">
            ← Storefront
          </Link>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          {session ? (
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full font-bold ${
                session.role === 'owner' ? 'bg-amber-400 text-obsidian' : 'bg-violet-400 text-white'
              }`}>
                {session.role === 'owner' ? '👑 Owner' : '🔧 Admin'}
              </span>
              <span className="px-3 py-1 rounded-full bg-white/10">{session.name}</span>
              <form action="/api/admin/logout" method="POST" className="inline">
                <button type="submit" className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px]">
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link href="/admin/login" className="px-3 py-1 rounded-full bg-lime text-obsidian font-bold">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}

function AdminSidebar({ session }: { session: AdminSessionPayload | null }) {
  return (
    <aside className="hidden md:block w-56 shrink-0">
      <div className="sticky top-6 rounded-[16px] border bg-white p-3">
        {NAV_SECTIONS.map((section, i) => (
          <div key={i} className="mb-2 last:mb-0">
            {section.title && (
              <div className="px-3 pt-2 pb-1 text-[10px] tracking-[0.14em] uppercase text-obsidian/40 font-semibold">
                {section.title}
              </div>
            )}
            {section.items
              .filter(item => !item.ownerOnly || session?.role === 'owner')
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-3 py-2 rounded-[10px] text-[13px] text-obsidian/70 hover:bg-stone-100 hover:text-obsidian"
                >
                  {item.label}
                </Link>
              ))}
          </div>
        ))}
        {session && (
          <div className="mt-3 pt-3 border-t">
            <div className="px-3 py-2 text-[11px] text-obsidian/50">
              Signed in as <span className="font-medium text-obsidian/70">{session.name}</span>
            </div>
            <div className="px-3 text-[10px] text-obsidian/40 mb-2">
              {session.email} • {session.role}
            </div>
            <form action="/api/admin/logout" method="POST">
              <button type="submit" className="w-full px-3 py-2 rounded-[10px] text-[13px] text-red-600 hover:bg-red-50 text-left">
                Log out
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const serverEnv = getServerEnv();
  const configured = isAdminConfigured(serverEnv);

  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isAuthenticated = !!session;

  return (
    <div className="min-h-screen bg-stone-50">
      <AdminNav session={session} />
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!isAuthenticated && configured && (
          <div className="mb-6 rounded-[16px] bg-amber-50 border border-amber-200 p-4 flex gap-3 text-[13px]">
            <span className="font-bold">⚠ Login required:</span>
            <span className="opacity-80">
              Admin access requires authentication. Please log in to access the dashboard.
            </span>
            <Link href="/admin/login" className="ml-auto underline font-semibold">Login →</Link>
          </div>
        )}
        <div className="flex gap-6 items-start">
          {isAuthenticated && <AdminSidebar session={session} />}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  );
}
