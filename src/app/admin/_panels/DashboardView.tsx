'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  CurrencyDollar, ShoppingCart, ChartLineUp, ArrowsClockwise, Package, Plus, Sparkle,
  Stack, MagnifyingGlass, Gift, Warning, FileText, Users, Target, ArrowUpRight,
} from '@phosphor-icons/react';
import { BarChart, Donut } from '@/components/admin/charts';
import { Card, PageHeader, StatCard, StatGrid, Badge, ProgressBar, Button, DataNotice, SectionTitle } from '@/components/admin/ui';
import { DataTable, type Column } from '@/components/admin/table';
import {
  orders as orderSeed, adminReviews, catalogSeed, lowStockOf, paidOrdersOf, revenueIn, revenueSeries,
  orderStatusBreakdown, giftDrop, adminPosts, crmLeads,
  NEWSLETTER_SUBSCRIBERS, ORDER_STATUS_TONE, formatMoney, formatDate, DEMO_TODAY,
} from '@/features/admin/demo/data';
import type { AdminOrder, AdminProduct, AdminReview } from '@/lib/admin/types';
import { useAdminTable, type AdminTableSource } from '@/hooks/use-admin-table';

const RANGES = [
  { key: '7', label: '7 days', buckets: 7, daysEach: 1 },
  { key: '30', label: '30 days', buckets: 10, daysEach: 3 },
  { key: '90', label: '90 days', buckets: 12, daysEach: 8 },
] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  paid: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#10b981',
  cancelled: '#94a3b8',
  refunded: '#f43f5e',
};

const QUICK_ACTIONS = [
  { href: '/admin/ai-import', label: 'Import product', icon: Sparkle, tone: 'linear-gradient(135deg,#8b5cf6,#c026d3)' },
  { href: '/admin/products/new', label: 'Add manual', icon: Plus, tone: 'linear-gradient(135deg,#3b82f6,#22d3ee)' },
  { href: '/admin/marketing', label: 'Generate content', icon: FileText, tone: 'linear-gradient(135deg,#ec4899,#f43f5e)' },
  { href: '/admin/variant-gen', label: 'Create variants', icon: Stack, tone: 'linear-gradient(135deg,#10b981,#14b8a6)' },
  { href: '/admin/seo-engine', label: 'SEO optimise', icon: MagnifyingGlass, tone: 'linear-gradient(135deg,#f59e0b,#fbbf24)' },
  { href: '/admin/hermes-intel', label: 'Intelligence', icon: Target, tone: 'linear-gradient(135deg,#6366f1,#3b82f6)' },
];

export function DashboardView() {
  const [range, setRange] = useState<(typeof RANGES)[number]['key']>('30');
  const active = RANGES.find((r) => r.key === range)!;

  const { rows: orders, source: ordersSource, error: ordersError } = useAdminTable<AdminOrder>('orders', orderSeed);
  const { rows: products, source: productsSource, error: productsError } = useAdminTable<AdminProduct>('products', catalogSeed);
  const { rows: reviews } = useAdminTable<AdminReview>('product_reviews', adminReviews);

  // The dashboard reads three tables, so it reports the worst of them.
  const sources: AdminTableSource[] = [ordersSource, productsSource];
  const source: AdminTableSource = sources.includes('loading') ? 'loading' : sources.every((s) => s === 'live') ? 'live' : 'local';
  const error = ordersError ?? productsError;

  const paid = useMemo(() => paidOrdersOf(orders), [orders]);
  const series = useMemo(() => revenueSeries(orders, active.buckets, active.daysEach), [orders, active]);
  const ordersSeries = useMemo(() => {
    const since = (days: number) => new Date(DEMO_TODAY).getTime() - days * 86_400_000;
    return Array.from({ length: active.buckets }, (_, index) => {
      const i = active.buckets - 1 - index;
      const start = i * active.daysEach;
      const count = paid.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t < since(start) && t >= since(start + active.daysEach);
      }).length;
      return { label: `D${start + 1}`, value: count };
    });
  }, [paid, active]);
  const statusBreakdown = useMemo(() => orderStatusBreakdown(orders), [orders]);
  const lowStock = useMemo(() => lowStockOf(products), [products]);

  const revenue = revenueIn(orders, Number(range));
  const orderCount = paid.filter((o) => new Date(o.createdAt).getTime() >= new Date(DEMO_TODAY).getTime() - Number(range) * 86_400_000).length;
  const aov = orderCount ? revenue / orderCount : 0;
  const liveProducts = products.filter((p) => p.isActive).length;

  const recentColumns: Column<AdminOrder>[] = [
    { key: 'number', header: 'Order', cell: (o) => <Link href="/admin/orders" className="font-semibold text-gray-900 hover:underline">{o.orderNumber}</Link>, sortValue: (o) => o.orderNumber },
    { key: 'customer', header: 'Customer', cell: (o) => <span className="text-gray-600">{o.customerName || o.customerEmail}</span>, sortValue: (o) => o.customerName || o.customerEmail },
    { key: 'status', header: 'Status', cell: (o) => <Badge tone={ORDER_STATUS_TONE[o.status]}>{o.status}</Badge>, sortValue: (o) => o.status },
    { key: 'date', header: 'Date', cell: (o) => <span className="text-gray-500">{formatDate(o.createdAt)}</span>, sortValue: (o) => o.createdAt },
    { key: 'total', header: 'Total', align: 'right', cell: (o) => <span className="font-semibold">{formatMoney(o.total)}</span>, sortValue: (o) => o.total },
  ];

  const drafts = adminPosts.filter((p) => p.status !== 'published');

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard"
        subtitle="Revenue, orders and catalog health for Basco Sports."
        actions={<Button variant="secondary" onClick={() => window.location.reload()}><ArrowsClockwise size={14} weight="bold" /> Refresh</Button>}
      />

      <DataNotice source={source} error={error} />

      <StatGrid>
        <StatCard label={`Revenue · ${active.label}`} value={formatMoney(revenue)} hint="excludes refunds" icon={<CurrencyDollar size={15} weight="bold" />} tone="emerald" />
        <StatCard label={`Orders · ${active.label}`} value={orderCount} hint={`${paid.length} paid lifetime`} icon={<ShoppingCart size={15} weight="bold" />} tone="blue" />
        <StatCard label="Average order value" value={formatMoney(aov)} hint="excludes refunds" icon={<ChartLineUp size={15} weight="bold" />} tone="violet" />
        <StatCard label="Products live" value={`${liveProducts} / ${products.length}`} hint="visible on the storefront" icon={<Package size={15} weight="bold" />} tone="amber" />
      </StatGrid>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card
          className="lg:col-span-2"
          title={`Revenue · ${active.label}`}
          actions={
            <div className="flex items-center gap-1">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRange(r.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${range === r.key ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          }
        >
          <BarChart data={series} format={(v) => formatMoney(v)} />
          <div className="mt-4 pt-4 border-t border-gray-100">
            <SectionTitle>Orders per bucket</SectionTitle>
            <BarChart data={ordersSeries} height={90} />
          </div>
        </Card>

        <Card title="Order status">
          <Donut
            centerLabel="Paid revenue"
            centerValue={formatMoney(revenueIn(orders, 30))}
            segments={statusBreakdown.map((s) => ({ label: s.status, value: s.count, color: STATUS_COLORS[s.status] }))}
          />
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card
          className="lg:col-span-2"
          title="Recent orders"
          bodyClass="p-0"
          actions={<Link href="/admin/orders" className="text-[12px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">All orders <ArrowUpRight size={12} weight="bold" /></Link>}
        >
          <DataTable rows={orders.slice(0, 5)} columns={recentColumns} perPage={5} dense empty={{ title: 'No orders yet' }} />
        </Card>

        <div className="space-y-4">
          <Card title="Gift Drop" actions={<Badge tone={giftDrop.active ? 'green' : 'gray'}>{giftDrop.active ? 'live' : 'paused'}</Badge>}>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[26px] font-bold text-gray-900 leading-none">{giftDrop.claimsToday}</div>
                <div className="text-[11px] text-gray-500 mt-1">claims today · cap {giftDrop.perDayCap}</div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-semibold text-gray-900">{giftDrop.total - giftDrop.claimed}</div>
                <div className="text-[11px] text-gray-500">remaining of {giftDrop.total}</div>
              </div>
            </div>
            <ProgressBar className="mt-3" value={(giftDrop.claimed / giftDrop.total) * 100} tone="emerald" />
            <ul className="mt-4 space-y-1.5">
              {giftDrop.productNames.map((n) => (
                <li key={n} className="flex items-center gap-2 text-[12px] text-gray-600"><Gift size={13} className="text-amber-500 shrink-0" /> {n}</li>
              ))}
            </ul>
            <Link href="/admin/gift-drop" className="mt-4 inline-flex h-9 px-3 rounded-lg border border-gray-200 text-[12px] font-semibold items-center hover:bg-gray-50">Open claims ledger</Link>
          </Card>

          <Card title="Needs attention">
            <ul className="space-y-2.5">
              {[
                { href: '/admin/reviews', label: `${reviews.filter((r) => r.status === 'pending').length} reviews awaiting moderation`, tone: 'amber' as const, icon: <FileText size={13} /> },
                { href: '/admin/orders', label: `${orders.filter((o) => o.status === 'paid').length} paid orders to fulfil`, tone: 'blue' as const, icon: <ShoppingCart size={13} /> },
                { href: '/admin/products', label: `${products.filter((p) => p.readiness === 'REVIEW_REQUIRED' || p.readiness === 'BLOCKED').length} products need commerce evidence`, tone: 'red' as const, icon: <Warning size={13} /> },
                { href: '/admin/crm', label: `${crmLeads.filter((l) => l.status === 'new').length} new CRM leads`, tone: 'violet' as const, icon: <Users size={13} /> },
              ].map((row) => (
                <li key={row.href + row.label}>
                  <Link href={row.href} className="flex items-center gap-2 text-[12px] text-gray-700 hover:text-gray-900">
                    <span className="text-gray-400">{row.icon}</span>
                    <span className="flex-1">{row.label}</span>
                    <Badge tone={row.tone}>open</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="Low stock" bodyClass="p-0">
          <div className="divide-y divide-gray-50">
            {!lowStock.length && <p className="px-4 py-3 text-[12px] text-gray-500">Nothing is at or below its own low-stock threshold.</p>}
            {lowStock.slice(0, 5).map((p) => (
              <div key={p.id} className="px-4 py-2.5 flex items-center gap-3">
                <Package size={14} className="text-gray-300 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[12px] font-medium text-gray-800 truncate">{p.name}</div>
                  <div className="text-[10px] text-gray-400">{p.sku} · {p.category}</div>
                </div>
                <div className="w-24 shrink-0">
                  <ProgressBar value={(p.stock / 20) * 100} tone={p.stock <= 5 ? 'rose' : 'amber'} />
                </div>
                <span className={`text-[12px] font-bold w-8 text-right ${p.stock <= 5 ? 'text-rose-600' : 'text-gray-700'}`}>{p.stock}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Publishing queue" actions={<Badge tone={drafts.length ? 'amber' : 'green'}>{drafts.length} pending</Badge>}>
          <ul className="space-y-2.5">
            {drafts.map((p) => (
              <li key={p.id} className="flex items-start gap-2">
                <Badge tone={p.status === 'scheduled' ? 'blue' : 'gray'}>{p.status}</Badge>
                <span className="text-[12px] text-gray-700 leading-snug">{p.title}</span>
              </li>
            ))}
            {!drafts.length && <li className="text-[12px] text-gray-500">Nothing queued — every post is live.</li>}
          </ul>
          <Link href="/admin/blogs" className="mt-4 inline-flex h-9 px-3 rounded-lg border border-gray-200 text-[12px] font-semibold items-center hover:bg-gray-50">Open blog CMS</Link>
        </Card>
      </div>

      <Card title="Quick actions">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            return (
              <Link key={a.href} href={a.href} className="group rounded-xl border border-gray-100 p-3 hover:border-gray-200 hover:shadow-sm transition-all">
                <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: a.tone }}>
                  <Icon size={15} weight="bold" />
                </span>
                <span className="mt-2 block text-[12px] font-semibold text-gray-800">{a.label}</span>
              </Link>
            );
          })}
        </div>
      </Card>

      <Card title="Catalog snapshot">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Products', value: products.length },
            { label: 'Active', value: liveProducts },
            { label: 'Newsletter subscribers', value: NEWSLETTER_SUBSCRIBERS.toLocaleString('en-US') },
            { label: 'Orders (lifetime)', value: orders.length },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{s.label}</div>
              <div className="text-[20px] font-bold text-gray-900 mt-1">{s.value}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
