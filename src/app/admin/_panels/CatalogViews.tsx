'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import {
  Plus, Upload, Package, WarningCircle, Tag, Ticket, Megaphone,
  PencilSimple, Eye, CheckCircle,
} from '@phosphor-icons/react';
import { Badge, Button, Card, DataNotice, DemoNotice, PageHeader, ProgressBar, StatCard, StatGrid, Toggle, Toolbar, SELECT_CLS, Notice, KeyValue } from '@/components/admin/ui';
import { DataTable, type Column } from '@/components/admin/table';
import {
  catalogSeed, categoriesWithCounts, SPORT_CATEGORIES, formatMoney, formatDate,
  storeOffers, adsReadiness, demoCoupons,
} from '@/features/admin/demo/data';
import { READINESS_TONE, SOURCE_TONE, MARGIN_FLOOR, toCatalogProduct, type AdminProduct, type CatalogProduct, type Readiness } from '@/lib/admin/types';
import { useAdminTable } from '@/hooks/use-admin-table';

const READINESS_FILTERS: (Readiness | 'all')[] = ['all', 'COMMERCE_READY', 'REVIEW_REQUIRED', 'BLOCKED', 'DRAFT'];
const ISSUE_FILTERS = ['none', 'cost-unknown', 'shipping-unknown', 'low-margin', 'stock-unknown', 'image-incomplete'] as const;

export function ProductsView() {
  const { rows, source: dataSource, error } = useAdminTable<AdminProduct>('products', catalogSeed);
  // The table stores the row; the screens show the row plus what is derived from it.
  const products = useMemo(() => rows.map(toCatalogProduct), [rows]);
  const [search, setSearch] = useState('');
  const [readiness, setReadiness] = useState<(typeof READINESS_FILTERS)[number]>('all');
  const [source, setSource] = useState('all');
  const [category, setCategory] = useState('all');
  const [issue, setIssue] = useState<(typeof ISSUE_FILTERS)[number]>('none');
  const [autoListing, setAutoListing] = useState(false);
  const [importNotice, setImportNotice] = useState(false);

  const filtered = useMemo(
    () =>
      products.filter((r) => {
        if (readiness !== 'all' && r.readiness !== readiness) return false;
        if (source !== 'all' && r.sourceType !== source) return false;
        if (category !== 'all' && r.category !== category) return false;
        if (issue === 'low-margin' && r.margin !== null && r.margin >= MARGIN_FLOOR) return false;
        if (issue === 'stock-unknown' && r.stock > 0) return false;
        if (issue === 'image-incomplete' && r.imageStatus === 'COMPLETE') return false;
        if (issue === 'cost-unknown' && r.cost !== null && r.cost > 0) return false;
        if (issue === 'shipping-unknown' && r.fulfillment === 'IN_HOUSE') return false;
        return true;
      }),
    [products, readiness, source, category, issue]
  );

  const stats = useMemo(
    () => ({
      total: products.length,
      ready: products.filter((r) => r.readiness === 'COMMERCE_READY').length,
      needsEvidence: products.filter((r) => r.readiness === 'REVIEW_REQUIRED' || r.readiness === 'BLOCKED').length,
      lowMargin: products.filter((r) => r.margin === null || r.margin < MARGIN_FLOOR).length,
    }),
    [products]
  );

  const columns: Column<CatalogProduct>[] = [
    {
      key: 'product',
      header: 'Product',
      cell: (r) => (
        <div className="flex items-center gap-2.5 min-w-0">
          <Image src={r.images[0]} alt="" width={32} height={32} className="w-8 h-8 rounded-lg object-cover bg-gray-100 shrink-0" />
          <div className="min-w-0">
            <div className="font-medium text-gray-900 truncate max-w-[220px]">{r.name}</div>
            <div className="text-[10px] text-gray-400">{r.sku} · {r.brand}</div>
          </div>
        </div>
      ),
      sortValue: (r) => r.name,
    },
    { key: 'readiness', header: 'Readiness', cell: (r) => <Badge tone={READINESS_TONE[r.readiness]}>{r.readiness.replace(/_/g, ' ').toLowerCase()}</Badge>, sortValue: (r) => r.readiness },
    { key: 'source', header: 'Source', cell: (r) => <Badge tone={SOURCE_TONE[r.sourceType]}>{r.sourceType}</Badge>, sortValue: (r) => r.sourceType },
    { key: 'category', header: 'Sport', cell: (r) => <span className="capitalize text-gray-600">{r.category}</span>, sortValue: (r) => r.category },
    { key: 'cost', header: 'Cost', align: 'right', cell: (r) => <span className="text-gray-600">{r.cost === null ? '—' : formatMoney(r.cost)}</span>, sortValue: (r) => r.cost ?? -1 },
    { key: 'price', header: 'Price', align: 'right', cell: (r) => <span className="font-semibold">{formatMoney(r.price)}</span>, sortValue: (r) => r.price },
    {
      key: 'margin',
      header: 'Margin',
      align: 'right',
      cell: (r) => (
        <div className="flex items-center justify-end gap-2">
          <div className="w-12"><ProgressBar value={Math.max(0, Math.min(100, r.margin ?? 0))} tone={r.margin !== null && r.margin >= MARGIN_FLOOR ? 'emerald' : r.margin !== null && r.margin >= 30 ? 'amber' : 'rose'} /></div>
          <span className={`font-semibold w-10 text-right ${r.margin === null || r.margin < 30 ? 'text-rose-600' : 'text-gray-700'}`}>{r.margin === null ? '—' : `${r.margin}%`}</span>
        </div>
      ),
      sortValue: (r) => r.margin ?? -1,
    },
    { key: 'stock', header: 'Stock', align: 'right', cell: (r) => <span className={r.stock <= 5 ? 'text-rose-600 font-bold' : 'text-gray-700'}>{r.stock}</span>, sortValue: (r) => r.stock },
    { key: 'images', header: 'Images', cell: (r) => <Badge tone={r.imageStatus === 'COMPLETE' ? 'green' : r.imageStatus === 'MISSING_ALT' ? 'amber' : 'gray'}>{r.imageStatus.replace(/_/g, ' ').toLowerCase()}</Badge>, sortValue: (r) => r.imageStatus },
    { key: 'rating', header: 'Rating', align: 'right', cell: (r) => <span className="text-gray-500">{r.reviewCount ? `${r.rating} (${r.reviewCount})` : '—'}</span>, sortValue: (r) => r.rating },
    {
      key: 'live',
      header: 'Customer-visible',
      cell: (r) =>
        r.isActive ? (
          <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle size={13} weight="fill" /> Live</span>
        ) : (
          <span className="text-gray-500" title={`Not live: ${r.readiness.replace(/_/g, ' ').toLowerCase()}`}>
            Hidden — {r.readiness === 'BLOCKED' ? 'blocked evidence' : r.readiness === 'DRAFT' ? 'draft' : 'needs review'}
          </span>
        ),
      sortValue: (r) => (r.isActive ? 1 : 0),
    },
    { key: 'updated', header: 'Updated', cell: (r) => <span className="text-gray-500">{formatDate(r.updatedAt)}</span>, sortValue: (r) => r.updatedAt },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Products"
        subtitle={`${filtered.length} of ${products.length} rows shown`}
        actions={
          <>
            <Button variant="secondary" onClick={() => setImportNotice(true)}><Upload size={14} weight="bold" /> CSV import</Button>
            <Link href="/admin/products/new"><Button><Plus size={14} weight="bold" /> Add product</Button></Link>
          </>
        }
      />

      <DataNotice source={dataSource} error={error} />

      <StatGrid>
        <StatCard label="Catalog rows" value={stats.total} hint="live product table" icon={<Package size={15} weight="bold" />} tone="blue" />
        <StatCard label="Commerce ready" value={stats.ready} delta={`${Math.round((stats.ready / stats.total) * 100)}%`} hint="sellable everywhere" icon={<CheckCircle size={15} weight="bold" />} tone="emerald" />
        <StatCard label="Needs evidence" value={stats.needsEvidence} hint="blocked from auto-publish" icon={<WarningCircle size={15} weight="bold" />} tone="amber" />
        <StatCard label="Below 45% margin" value={stats.lowMargin} hint="playbook floor, or cost unknown" icon={<Tag size={15} weight="bold" />} tone="rose" />
      </StatGrid>

      {importNotice && (
        <Notice tone="blue">
          CSV import in the design clone is a no-op. A real import parses the file server-side and writes through Basco’s own data layer.
          <button type="button" onClick={() => setImportNotice(false)} className="ml-2 underline font-semibold">Dismiss</button>
        </Notice>
      )}

      <Card>
        <Toolbar className="mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, SKU, brand…"
            aria-label="Search products"
            className="h-10 px-3 rounded-lg border border-gray-200 bg-white text-[13px] w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <select className={SELECT_CLS} value={readiness} onChange={(e) => setReadiness(e.target.value as Readiness | 'all')} aria-label="Filter by readiness">
            {READINESS_FILTERS.map((r) => <option key={r} value={r}>{r === 'all' ? 'All readiness' : r.replace(/_/g, ' ').toLowerCase()}</option>)}
          </select>
          <select className={SELECT_CLS} value={source} onChange={(e) => setSource(e.target.value)} aria-label="Filter by source">
            {['all', 'CJ', 'KONG', 'IN_HOUSE', 'OTHER'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All sources' : s}</option>)}
          </select>
          <select className={SELECT_CLS} value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by sport">
            <option value="all">All sports</option>
            {SPORT_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          <select className={SELECT_CLS} value={issue} onChange={(e) => setIssue(e.target.value as (typeof ISSUE_FILTERS)[number])} aria-label="Filter by issue">
            {ISSUE_FILTERS.map((i) => <option key={i} value={i}>{i === 'none' ? 'No issue filter' : i.replace(/-/g, ' ')}</option>)}
          </select>
          <div className="flex-1" />
          <Toggle on={autoListing} onChange={setAutoListing} label="Auto-list ready products" />
        </Toolbar>

        <DataTable
          rows={filtered}
          columns={columns}
          search={search}
          perPage={12}
          empty={{ title: 'No products match these filters', hint: 'Clear a filter to see the rest of the catalog.', icon: <Package size={16} /> }}
          rowActions={(r) => (
            <div className="flex items-center justify-end gap-1">
              <Link href={`/admin/products/edit/${r.id}`} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={`Edit ${r.name}`} title="Edit"><PencilSimple size={14} /></Link>
              <Link href={`/product/${r.slug}`} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={`View ${r.name}`} title="View storefront page"><Eye size={14} /></Link>
            </div>
          )}
        />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Promotions
// ---------------------------------------------------------------------------

export function PromotionsView() {
  const [offers, setOffers] = useState(storeOffers);

  return (
    <div className="space-y-4">
      <PageHeader title="Promotions" subtitle="Free-shipping rules, coupons, store offers and Merchant Center readiness." />
      <DemoNotice />

      <Card title="Free shipping strategy">
        <KeyValue
          items={[
            { label: 'Free-shipping threshold', value: formatMoney(150) },
            { label: 'Applies to', value: 'All markets' },
            { label: 'Excludes', value: 'Oversized cricket bags' },
            { label: 'Duties', value: 'Shown before payment' },
          ]}
        />
        <p className="mt-3 text-[12px] text-gray-500">Shipping is charged at checkout from a zone table — the threshold is a storefront rule, not a discount code.</p>
      </Card>

      <Card title="Coupons" bodyClass="p-0">
        <div className="divide-y divide-gray-50">
          {demoCoupons.map((c) => (
            <div key={c.code} className="px-4 py-3 flex items-center gap-3 flex-wrap">
              <span className="font-mono text-[12px] font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">{c.code}</span>
              <span className="text-[12px] text-gray-600 flex-1 min-w-[12rem]">{c.description}</span>
              <Badge tone="violet">{c.discountPercent}% off</Badge>
              <Badge tone={c.minSubtotal ? 'amber' : 'gray'}>{c.minSubtotal ? `min ${formatMoney(c.minSubtotal)}` : 'no minimum'}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Store offers" actions={<Button variant="secondary" onClick={() => setOffers([...offers, { id: `off-${offers.length + 1}`, name: 'New offer', type: 'Coupon', threshold: 0, active: false, redemptions: 0 }])}><Plus size={14} weight="bold" /> New offer</Button>}>
        <div className="space-y-2.5">
          {offers.map((o) => (
            <div key={o.id} className="flex items-center gap-3 flex-wrap rounded-xl border border-gray-100 px-3 py-2.5">
              <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><Ticket size={15} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-gray-900">{o.name}</div>
                <div className="text-[11px] text-gray-500">{o.type}{o.threshold ? ` · over ${formatMoney(o.threshold)}` : ''}</div>
              </div>
              <span className="text-[11px] text-gray-500">{o.redemptions} redemptions</span>
              <Toggle on={o.active} onChange={(v) => setOffers(offers.map((x) => (x.id === o.id ? { ...x, active: v } : x)))} label={o.active ? 'Active' : 'Paused'} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Ads / feed readiness" actions={<Megaphone size={15} className="text-gray-300" />}>
        <ul className="space-y-2.5">
          {adsReadiness.map((a) => (
            <li key={a.id} className="flex items-start gap-3">
              <span className={`mt-0.5 ${a.ok ? 'text-emerald-500' : 'text-amber-500'}`}>{a.ok ? <CheckCircle size={15} weight="fill" /> : <WarningCircle size={15} weight="fill" />}</span>
              <div>
                <div className="text-[13px] text-gray-800">{a.label}</div>
                <div className="text-[11px] text-gray-500">{a.hint}</div>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export function CategoriesView() {
  const { rows, source, error } = useAdminTable<AdminProduct>('products', catalogSeed);
  const categories = categoriesWithCounts(rows);

  return (
    <div className="space-y-4">
      <PageHeader title="Categories" subtitle="Sport collections used by storefront navigation and catalog filters." />
      <DataNotice source={source} error={error} />

      <Card title="Where these come from">
        <p className="text-[12px] text-gray-600 leading-relaxed">
          A collection is the storefront\u2019s sport list, and every count below is read from the live catalog. A product joins a
          sport through its <span className="font-medium text-gray-800">Sport</span> field in the product editor — there is no
          separate category record to keep in sync.
        </p>
      </Card>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((c) => (
          <Card key={c.slug}>
            <div className="flex items-start gap-3">
              {c.image ? <Image src={c.image} alt="" width={44} height={44} className="w-11 h-11 rounded-xl object-cover bg-gray-100" /> : <span className="w-11 h-11 rounded-xl bg-gray-100" />}
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-gray-900 truncate">{c.name}</div>
                <div className="text-[11px] text-gray-500">/{c.slug}</div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge tone="blue">{c.count} products</Badge>
                  <Badge tone="green">{c.active} live</Badge>
                </div>
              </div>
            </div>
            {c.description && <p className="mt-3 text-[12px] text-gray-500 leading-snug">{c.description}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}
