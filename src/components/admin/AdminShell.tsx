'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  SquaresFour, Package, Plus, ShoppingCart, List, X, ArrowLeft, SignOut,
  MagnifyingGlass, ShieldCheck, Tag, Gift, Users as UsersIcon, TreeStructure,
  Star, FileText, YoutubeLogo, Megaphone, TrendUp, PaperPlaneRight, Stack,
  Robot, Target, Cpu, Sparkle, CreditCard, GearSix, BookBookmark, Truck,
} from '@phosphor-icons/react';

type NavIcon = React.ComponentType<Record<string, unknown>>;
interface NavItem { href: string; icon: NavIcon; label: string; g: string; dot: string; ownerOnly?: boolean }
interface NavSection { title: string; items: NavItem[] }

const GRADIENTS = {
  blue: 'linear-gradient(135deg,#3b82f6,#22d3ee)',
  violet: 'linear-gradient(135deg,#8b5cf6,#a855f7)',
  pink: 'linear-gradient(135deg,#ec4899,#f43f5e)',
  amber: 'linear-gradient(135deg,#f59e0b,#fbbf24)',
  rose: 'linear-gradient(135deg,#f472b6,#e879f9)',
  emerald: 'linear-gradient(135deg,#10b981,#14b8a6)',
  indigo: 'linear-gradient(135deg,#6366f1,#3b82f6)',
  orange: 'linear-gradient(135deg,#f59e0b,#f97316)',
  yellow: 'linear-gradient(135deg,#eab308,#f59e0b)',
  sky: 'linear-gradient(135deg,#0ea5e9,#06b6d4)',
  red: 'linear-gradient(135deg,#ef4444,#f97316)',
  fuchsia: 'linear-gradient(135deg,#d946ef,#ec4899)',
  cyan: 'linear-gradient(135deg,#06b6d4,#2563eb)',
  teal: 'linear-gradient(135deg,#0d9488,#0891b2)',
  purple: 'linear-gradient(135deg,#9333ea,#c026d3)',
  crimson: 'linear-gradient(135deg,#f43f5e,#fb923c)',
  slate: 'linear-gradient(135deg,#94a3b8,#64748b)',
  stripe: 'linear-gradient(135deg,#635bff,#8b5cf6)',
};

const SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { href: '/admin', icon: SquaresFour, label: 'Dashboard', g: GRADIENTS.blue, dot: '#38bdf8' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { href: '/admin/products', icon: Package, label: 'Products', g: GRADIENTS.violet, dot: '#a78bfa' },
      { href: '/admin/promotions', icon: Tag, label: 'Promotions', g: GRADIENTS.pink, dot: '#f472b6' },
      { href: '/admin/gift-drop', icon: Gift, label: 'Gift Drop', g: GRADIENTS.amber, dot: '#fbbf24' },
      { href: '/admin/campaigns', icon: Gift, label: 'Campaigns', g: GRADIENTS.rose, dot: '#f9a8d4' },
      { href: '/admin/orders', icon: ShoppingCart, label: 'Orders', g: GRADIENTS.emerald, dot: '#34d399' },
      { href: '/admin/users', icon: UsersIcon, label: 'Users', g: GRADIENTS.indigo, dot: '#818cf8' },
      { href: '/admin/categories', icon: TreeStructure, label: 'Categories', g: GRADIENTS.orange, dot: '#fbbf24' },
      { href: '/admin/reviews', icon: Star, label: 'Reviews', g: GRADIENTS.yellow, dot: '#facc15' },
      { href: '/admin/blogs', icon: FileText, label: 'Blog Posts', g: GRADIENTS.sky, dot: '#38bdf8' },
    ],
  },
  {
    title: 'Media',
    items: [
      { href: '/admin/media', icon: YoutubeLogo, label: 'Media Hub', g: GRADIENTS.red, dot: '#f87171' },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { href: '/admin/seo-engine', icon: MagnifyingGlass, label: 'SEO Engine', g: GRADIENTS.blue, dot: '#818cf8' },
      { href: '/admin/marketing', icon: Megaphone, label: 'Marketing Gen', g: GRADIENTS.fuchsia, dot: '#e879f9' },
      { href: '/admin/marketing-traffic', icon: TrendUp, label: 'Marketing & Traffic', g: GRADIENTS.cyan, dot: '#22d3ee' },
      { href: '/admin/email-marketing', icon: PaperPlaneRight, label: 'Email Marketing', g: GRADIENTS.sky, dot: '#60a5fa' },
      { href: '/admin/crm', icon: UsersIcon, label: 'CRM (Leads)', g: GRADIENTS.emerald, dot: '#4ade80' },
    ],
  },
  {
    title: 'AI Studio',
    items: [
      { href: '/admin/variant-gen', icon: Stack, label: 'Variant Gen', g: GRADIENTS.violet, dot: '#c084fc' },
      { href: '/admin/ai', icon: Robot, label: 'AI Hub', g: GRADIENTS.indigo, dot: '#818cf8' },
      { href: '/admin/ai-import', icon: Robot, label: 'AI Import', g: GRADIENTS.purple, dot: '#c084fc' },
      { href: '/admin/listing-task', icon: List, label: 'Listing Task', g: GRADIENTS.blue, dot: '#60a5fa' },
      { href: '/admin/scout', icon: Target, label: 'Product Scout', g: GRADIENTS.crimson, dot: '#fb7185' },
      { href: '/admin/product-research', icon: TrendUp, label: 'Product Research', g: GRADIENTS.teal, dot: '#2dd4bf' },
      { href: '/admin/ai-control', icon: Cpu, label: 'AI Control', g: GRADIENTS.sky, dot: '#60a5fa' },
      { href: '/admin/hermes-intel', icon: Sparkle, label: 'AI Intelligence', g: GRADIENTS.blue, dot: '#a78bfa' },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/admin/cj-setup', icon: Package, label: 'CJ Supplier', g: GRADIENTS.emerald, dot: '#34d399' },
      { href: '/admin/payments', icon: CreditCard, label: 'Payments', g: GRADIENTS.stripe, dot: '#a78bfa' },
      { href: '/admin/shipping', icon: Truck, label: 'Shipping', g: GRADIENTS.cyan, dot: '#22d3ee' },
      { href: '/admin/settings', icon: GearSix, label: 'Settings', g: GRADIENTS.slate, dot: '#cbd5e1' },
      { href: '/admin/settings/listing-playbook', icon: BookBookmark, label: 'Listing Playbook', g: GRADIENTS.blue, dot: '#60a5fa' },
      { href: '/admin/team', icon: ShieldCheck, label: 'Team', g: GRADIENTS.slate, dot: '#cbd5e1', ownerOnly: true },
    ],
  },
];

const MOBILE_NAV: { key: string; label: string; href?: string; icon: NavIcon }[] = [
  { key: 'home', label: 'Home', href: '/admin', icon: SquaresFour },
  { key: 'products', label: 'Listings', href: '/admin/products', icon: Package },
  { key: 'add', label: 'Add', href: '/admin/products/new', icon: Plus },
  { key: 'orders', label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { key: 'more', label: 'More', icon: List },
];

export interface AdminSessionInfo {
  name: string;
  email: string;
  role: 'owner' | 'admin' | string;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/admin') return pathname === '/admin';
  if (href === '/admin/products') {
    return pathname.startsWith('/admin/products') && !pathname.startsWith('/admin/products/new') && !pathname.startsWith('/admin/products/edit');
  }
  if (href === '/admin/settings') {
    return pathname === '/admin/settings';
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({ session, children }: { session: AdminSessionInfo | null; children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobSide, setMobSide] = useState(false);

  const visibleSections = SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items.filter((it) => !it.ownerOnly || session?.role === 'owner'),
  }));

  const Sidebar = ({ mobile }: { mobile?: boolean }) => (
    <aside
      className={`flex flex-col shrink-0 ${mobile ? 'w-full h-full' : 'w-60 h-screen sticky top-0 hidden lg:flex'}`}
      style={{ background: 'linear-gradient(180deg, #0b1120 0%, #111c34 55%, #0b1120 100%)', boxShadow: 'inset -1px 0 0 rgba(255,255,255,0.04)' }}
    >
      <div className="px-3.5 py-4 border-b border-white/[0.06] flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-obsidian font-black text-sm shadow-lg shadow-blue-900/40" style={{ background: 'linear-gradient(135deg,#D4FF32,#a3e635)' }}>B</div>
        <div className="leading-tight">
          <span className="font-bold text-sm text-white tracking-tight block">Basco Sports</span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-slate-500 font-medium">Admin Console</span>
        </div>
        {mobile && (
          <button onClick={() => setMobSide(false)} className="ml-auto p-1.5 hover:bg-white/10 rounded-lg" aria-label="Close menu">
            <X size={14} className="text-slate-400" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-4 overflow-y-auto">
        {visibleSections.map((sec) => (
          <div key={sec.title}>
            <p className="px-2.5 mb-1 text-[9px] font-bold uppercase tracking-[0.18em] text-slate-600">{sec.title}</p>
            <div className="space-y-0.5">
              {sec.items.map((l) => {
                const active = isActive(pathname, l.href);
                const Icon = l.icon;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMobSide(false)}
                    className={`group relative flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[12px] font-medium transition-all duration-200 ${active ? 'text-white' : 'text-slate-400 hover:text-white'}`}
                    style={active ? { background: 'linear-gradient(90deg, rgba(59,130,246,0.22), rgba(139,92,246,0.10))', boxShadow: 'inset 0 0 0 1px rgba(99,102,241,0.25)' } : undefined}
                  >
                    {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ background: 'linear-gradient(180deg,#60a5fa,#a78bfa)' }} />}
                    <span
                      className={`w-[26px] h-[26px] min-w-[26px] min-h-[26px] rounded-md flex items-center justify-center text-white transition-all duration-200 ${active ? 'scale-105' : 'opacity-90 group-hover:scale-105 group-hover:opacity-100'}`}
                      style={{ background: l.g, boxShadow: active ? `0 2px 10px ${l.dot}40` : '0 1px 4px rgba(0,0,0,0.3)' }}
                    >
                      <Icon size={13} weight="bold" />
                    </span>
                    {l.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-2 border-t border-white/[0.06] space-y-0.5">
        <Link href="/" className="flex items-center gap-2 text-[11px] text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors">
          <span className="w-[26px] h-[26px] rounded-md bg-white/5 flex items-center justify-center"><ArrowLeft size={12} /></span>Store
        </Link>
        <form action="/api/admin/logout" method="POST">
          <button type="submit" className="flex items-center gap-2 text-[11px] text-red-400 hover:text-red-300 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 w-full transition-colors">
            <span className="w-[26px] h-[26px] rounded-md bg-red-500/10 flex items-center justify-center"><SignOut size={12} /></span>Logout
          </button>
        </form>
      </div>
    </aside>
  );

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      <Sidebar />
      {mobSide && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobSide(false)} />
          <div className="absolute left-0 top-0 h-full w-64"><Sidebar mobile /></div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between gap-3 px-4 lg:px-6 z-40">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setMobSide(true)} className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg" aria-label="Open menu"><List size={18} /></button>
            <div className="hidden md:flex items-center gap-2 bg-gray-100/80 border border-gray-200 rounded-lg px-3 py-1.5 w-64">
              <MagnifyingGlass size={13} className="text-gray-400" />
              <input placeholder="Search…" className="bg-transparent text-xs outline-none w-full placeholder:text-gray-400" />
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="hidden sm:flex items-center gap-1.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />Live
            </span>
            <Link href="/admin/team" className="relative p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700 transition-colors" aria-label="Team">
              <ShieldCheck size={16} />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)' }} />
            </Link>
            <div className="flex items-center gap-2 pl-1.5 border-l border-gray-200">
              <span className="text-xs font-medium text-gray-700 hidden sm:block">{session?.name || 'Admin'}</span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md shadow-blue-500/20 ring-2 ring-white" style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                {String(session?.name || 'A').charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto min-w-0 p-3 pb-24 lg:p-5" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>{children}</main>

        <nav
          className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur border-t border-gray-200 shadow-[0_-4px_20px_rgba(15,23,42,0.08)]"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Admin quick navigation"
        >
          <div className="grid grid-cols-5 max-w-lg mx-auto">
            {MOBILE_NAV.map((it) => {
              if (it.key === 'more') {
                return (
                  <button key="more" type="button" onClick={() => setMobSide(true)} className="flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium text-gray-500 hover:text-gray-800 min-h-[52px]">
                    <span className="p-1.5"><List size={20} /></span>
                    More
                  </button>
                );
              }
              const on =
                it.key === 'home' ? pathname === '/admin'
                : it.key === 'products' ? (pathname.startsWith('/admin/products') && !pathname.startsWith('/admin/products/new'))
                : it.key === 'add' ? pathname.startsWith('/admin/products/new')
                : it.key === 'orders' ? pathname.startsWith('/admin/orders')
                : false;
              const Icon = it.icon;
              return (
                <Link key={it.key} href={it.href || '/admin'} className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] min-h-[52px] ${on ? 'text-blue-600 font-semibold' : 'text-gray-500 font-medium hover:text-gray-700'}`}>
                  <span className={`px-3 py-1 rounded-xl ${on ? 'bg-blue-50' : ''}`}><Icon size={20} weight={on ? 'bold' : 'regular'} /></span>
                  {it.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
