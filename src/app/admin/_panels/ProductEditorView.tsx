'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, FloppyDisk, Plus, Trash, Sparkle, CheckCircle, WarningCircle,
  Image as ImageIcon, Tag, Stack, MagnifyingGlass, CurrencyDollar, Cube, Truck, Storefront,
} from '@phosphor-icons/react';
import {
  Badge, Button, Card, DataNotice, Field, INPUT_CLS, KeyValue, Notice, PageHeader,
  ProgressBar, ScoreRing, SectionTitle, Tabs, TEXTAREA_CLS, SELECT_CLS,
} from '@/components/admin/ui';
import { analyzeSeo } from '@/features/admin/demo/marketing';
import { buildVariantMatrix, buildLocalExtraction } from '@/features/admin/demo/ai';
import { catalogSeed, SPORT_CATEGORIES, formatMoney } from '@/features/admin/demo/data';
import { READINESS_TONE, MARGIN_FLOOR, toCatalogProduct, type AdminProduct, type CatalogProduct } from '@/lib/admin/types';
import { useAdminTable } from '@/hooks/use-admin-table';

const TABS = [
  { key: 'general', label: 'General', required: true },
  { key: 'pricing', label: 'Pricing', required: true },
  { key: 'inventory', label: 'Inventory' },
  { key: 'shipping', label: 'Shipping' },
  { key: 'images', label: 'Images', required: true },
  { key: 'variants', label: 'Variants' },
  { key: 'promotions', label: 'Promotions' },
  { key: 'commerce', label: 'Commerce' },
  { key: 'seo', label: 'SEO' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

function blankDraft(): CatalogProduct {
  const now = new Date().toISOString();
  return toCatalogProduct({
    id: '',
    slug: '',
    name: '',
    brand: 'Basco Equipment',
    category: 'football',
    categories: ['football'],
    price: 0,
    badges: [],
    rating: 0,
    reviewCount: 0,
    stock: 0,
    description: '',
    features: [],
    specifications: {},
    variants: [],
    defaultVariantIndex: 0,
    images: [],
    sku: '',
    cost: null,
    readiness: 'DRAFT',
    sourceType: 'IN_HOUSE',
    fulfillment: 'IN_HOUSE',
    inventorySource: 'MANUAL',
    lowStockThreshold: 5,
    isActive: false,
    createdAt: now,
    updatedAt: now,
  });
}

export function ProductEditorView({ productId }: { productId?: string }) {
  const router = useRouter();
  const { rows, save: persist, source, error } = useAdminTable<AdminProduct>('products', catalogSeed);
  const [draft, setDraft] = useState<CatalogProduct | null>(null);
  const [tab, setTab] = useState<TabKey>('general');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [variantNotice, setVariantNotice] = useState<string | null>(null);

  const existing = productId ? rows.find((r) => r.id === productId) : undefined;
  const loading = source === 'loading';

  // Rows arrive after mount, so seed the draft once they do.
  useEffect(() => {
    if (draft) return;
    if (loading) return;
    if (productId && !existing) return;
    setDraft(existing ? toCatalogProduct(existing) : blankDraft());
  }, [loading, existing, productId, draft]);

  const seo = useMemo(() => {
    if (!draft) return null;
    const keyword = draft.name ? draft.name.toLowerCase().split(' ')[0] : '';
    return analyzeSeo({
      title: draft.name ? `${draft.name} | Basco Sports` : '',
      metaDescription: draft.description.slice(0, 160),
      focusKeyword: keyword,
      body: draft.description,
      imageCount: draft.images.length,
      imagesWithAlt: draft.images.length,
    });
  }, [draft]);

  if (!draft) {
    return (
      <div className="py-20 text-center text-[13px] text-gray-500">
        {productId && !loading ? 'That product no longer exists.' : 'Loading editor…'}
      </div>
    );
  }

  /** Every edit goes through here so margin and image status stay in step. */
  const set = <K extends keyof AdminProduct>(key: K, value: AdminProduct[K]) =>
    setDraft((d) => (d ? toCatalogProduct({ ...d, [key]: value }) : d));

  const save = async () => {
    const id = draft.id || draft.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40) || `p-${Date.now()}`;
    // margin and imageStatus are derived, so they are never sent to the table.
    const { margin, imageStatus, ...row } = draft;
    setSaving(true);
    setSaveError(null);
    const ok = await persist({
      ...row,
      id,
      slug: draft.slug || id,
      sku: draft.sku || `BS-${id.toUpperCase()}`,
      isActive: draft.readiness === 'COMMERCE_READY',
      updatedAt: new Date().toISOString(),
    });
    setSaving(false);
    if (ok) router.push('/admin/products');
    else setSaveError('The product could not be saved — see the status above.');
  };

  const generateVariants = () => {
    const sizes = draft.variants[0]?.sizes?.length ? draft.variants[0].sizes : ['S', 'M', 'L', 'XL'];
    const colors = draft.variants.length ? draft.variants.map((v) => v.color) : ['Obsidian'];
    const { variants, duplicates } = buildVariantMatrix(sizes, colors);
    set('variants', variants.map((v) => ({
      color: v.attributes.Color,
      colorHex: draft.variants.find((x) => x.color === v.attributes.Color)?.colorHex || '#0B1220',
      sizes: [v.attributes.Size],
      images: [],
    })));
    setVariantNotice(`Generated ${variants.length} combinations${duplicates ? `, skipped ${duplicates} duplicates` : ''} — deterministic local math, no provider call.`);
  };

  const fillDraftFromExtraction = () => {
    const extracted = buildLocalExtraction(draft.supplierUrl || 'https://example.com', 0);
    setDraft((d) =>
      d
        ? toCatalogProduct({
            ...d,
            name: extracted.title,
            description: extracted.longDescription,
            price: extracted.sellingPrice,
            cost: extracted.costPrice,
            stock: extracted.stock,
            features: extracted.features,
            specifications: extracted.specifications,
            images: extracted.images,
            supplierUrl: extracted.supplierUrl,
          })
        : d
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/admin/products" className="text-[12px] text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"><ArrowLeft size={13} /> Products</Link>
        <span className="text-gray-300">/</span>
        <span className="text-[12px] text-gray-700 font-medium truncate max-w-[16rem]">{draft.name || 'New product'}</span>
      </div>

      <PageHeader
        title={productId ? 'Edit product' : 'New product'}
        subtitle={draft.sku || 'Unsaved draft'}
        actions={
          <>
            {!productId && (
              <Button variant="secondary" onClick={fillDraftFromExtraction} title="Fill the draft from a local AI-import extraction">
                <Sparkle size={14} weight="bold" /> Fill from AI import
              </Button>
            )}
            <Button onClick={save} disabled={saving}><FloppyDisk size={14} weight="bold" /> {saving ? 'Saving…' : 'Save product'}</Button>
          </>
        }
      />

      <DataNotice source={source} error={error} />
      {saveError && <Notice tone="red">{saveError}</Notice>}

      <div className="grid lg:grid-cols-[1fr_300px] gap-4 items-start">
        <Card bodyClass="p-0" className="overflow-hidden">
          <div className="px-3">
            <Tabs tabs={TABS.map((t) => ({ ...t }))} active={tab} onChange={(k) => setTab(k as TabKey)} />
          </div>
          <div className="p-4 space-y-4">
            {tab === 'general' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Product name" required>
                  <input className={INPUT_CLS} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="Apex Flight FG Football Boot" />
                  {/* Sport drives storefront collections — one place, no mirror table. */}
                </Field>
                <Field label="Brand">
                  <input className={INPUT_CLS} value={draft.brand} onChange={(e) => set('brand', e.target.value)} />
                </Field>
                <Field label="Sport" hint="Storefront navigation and catalog filters read this.">
                  <select className={SELECT_CLS + ' w-full'} value={draft.category} onChange={(e) => set('category', e.target.value as AdminProduct['category'])}>
                    {SPORT_CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select className={SELECT_CLS + ' w-full'} value={draft.readiness} onChange={(e) => set('readiness', e.target.value as AdminProduct['readiness'])}>
                    {(['DRAFT', 'REVIEW_REQUIRED', 'COMMERCE_READY', 'BLOCKED'] as const).map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ').toLowerCase()}</option>)}
                  </select>
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Description" required>
                    <textarea rows={6} className={TEXTAREA_CLS} value={draft.description} onChange={(e) => set('description', e.target.value)} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Features" hint="One per line.">
                    <textarea rows={4} className={TEXTAREA_CLS} value={draft.features.join('\n')} onChange={(e) => set('features', e.target.value.split('\n').filter(Boolean))} />
                  </Field>
                </div>
              </div>
            )}

            {tab === 'pricing' && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  <Field label="Selling price" required>
                    <input type="number" className={INPUT_CLS} value={draft.price} onChange={(e) => set('price', Number(e.target.value))} />
                  </Field>
                  <Field label="Compare-at price">
                    <input type="number" className={INPUT_CLS} value={draft.compareAtPrice ?? ''} onChange={(e) => set('compareAtPrice', e.target.value ? Number(e.target.value) : undefined)} />
                  </Field>
                  <Field label="Supplier cost" hint="Leave blank when unknown.">
                    <input type="number" className={INPUT_CLS} value={draft.cost ?? ''} onChange={(e) => set('cost', e.target.value === '' ? null : Number(e.target.value))} />
                  </Field>
                </div>
                <div className="rounded-xl border border-gray-100 p-3">
                  <SectionTitle>Margin</SectionTitle>
                  <div className="flex items-center gap-3">
                    <div className="flex-1"><ProgressBar value={Math.max(0, Math.min(100, draft.margin ?? 0))} tone={draft.margin !== null && draft.margin >= MARGIN_FLOOR ? 'emerald' : draft.margin !== null && draft.margin >= 30 ? 'amber' : 'rose'} /></div>
                    <span className="text-[13px] font-bold text-gray-900 w-16 text-right">{draft.margin === null ? '—' : `${draft.margin}%`}</span>
                  </div>
                  <p className="mt-2 text-[11px] text-gray-500">
                    The listing playbook blocks auto-publish below {MARGIN_FLOOR}% margin, and refuses to guess at all while the supplier cost is unknown.
                    {draft.cost !== null && ` Gross profit per unit: ${formatMoney(Math.max(0, draft.price - draft.cost))}.`}
                  </p>
                </div>
              </div>
            )}

            {tab === 'inventory' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Quantity on hand">
                  <input type="number" className={INPUT_CLS} value={draft.stock} onChange={(e) => set('stock', Number(e.target.value))} />
                </Field>
                <Field label="Low-stock threshold" hint="Dashboard low-stock list uses this.">
                  <input type="number" className={INPUT_CLS} value={draft.lowStockThreshold} onChange={(e) => set('lowStockThreshold', Number(e.target.value))} />
                </Field>
                <Field label="Inventory source">
                  <select className={SELECT_CLS + ' w-full'} value={draft.inventorySource} onChange={(e) => set('inventorySource', e.target.value as AdminProduct['inventorySource'])}>
                    <option value="MANUAL">Manual</option>
                    <option value="SUPPLIER_SYNC">Supplier sync</option>
                  </select>
                </Field>
                <Card className="sm:col-span-2" title="Stock ledger">
                  <ul className="space-y-2 text-[12px]">
                    <li className="flex justify-between"><span className="text-gray-500">Opening balance</span><span className="font-semibold">{draft.stock + 12}</span></li>
                    <li className="flex justify-between"><span className="text-gray-500">Sold (30 days)</span><span className="font-semibold text-rose-600">−9</span></li>
                    <li className="flex justify-between"><span className="text-gray-500">Restocked</span><span className="font-semibold text-emerald-600">+3</span></li>
                    <li className="flex justify-between border-t border-gray-100 pt-2"><span className="text-gray-700 font-medium">On hand</span><span className="font-bold">{draft.stock}</span></li>
                  </ul>
                </Card>
              </div>
            )}

            {tab === 'shipping' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Fulfilment method">
                  <select className={SELECT_CLS + ' w-full'} value={draft.fulfillment} onChange={(e) => set('fulfillment', e.target.value as AdminProduct['fulfillment'])}>
                    <option value="IN_HOUSE">In-house</option>
                    <option value="SUPPLIER">Supplier</option>
                  </select>
                </Field>
                <Field label="EAN / GTIN" hint="Required before a product can be advertised.">
                  <input className={INPUT_CLS} placeholder="—" />
                </Field>
                <Field label="Country of origin">
                  <input className={INPUT_CLS} value={draft.compliance?.countryOfOrigin ?? ''} onChange={(e) => set('compliance', { ...draft.compliance, complianceStatus: draft.compliance?.complianceStatus ?? 'REVIEW_REQUIRED', countryOfOrigin: e.target.value })} />
                </Field>
                <Field label="Shipping weight">
                  <input className={INPUT_CLS} value={draft.specifications.Weight ?? ''} onChange={(e) => set('specifications', { ...draft.specifications, Weight: e.target.value })} />
                </Field>
                <div className="sm:col-span-2">
                  <Notice tone="amber">Shipping cost evidence is what the playbook uses to allow auto-publishing. Unknown shipping keeps this row at <strong>review required</strong>.</Notice>
                </div>
              </div>
            )}

            {tab === 'images' && (
              <div className="space-y-4">
                <SectionTitle icon={<ImageIcon size={13} />}>Gallery</SectionTitle>
                {draft.images.length === 0 && <p className="text-[12px] text-gray-500">No images yet — at least one image is required before a product can go live.</p>}
                <div className="grid sm:grid-cols-2 gap-3">
                  {draft.images.map((src, i) => (
                    <div key={src + i} className="flex items-center gap-3 rounded-xl border border-gray-100 p-3">
                      <Image src={src} alt="" width={48} height={48} className="w-12 h-12 rounded-lg object-cover bg-gray-100" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold text-gray-600">ALT text</div>
                        <input className="w-full text-[12px] mt-0.5 border-0 p-0 focus:outline-none" defaultValue={draft.name} aria-label={`ALT text for image ${i + 1}`} />
                      </div>
                      <button type="button" onClick={() => set('images', draft.images.filter((_, x) => x !== i))} className="p-1.5 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50" aria-label="Remove image"><Trash size={14} /></button>
                    </div>
                  ))}
                </div>
                <Button variant="secondary" onClick={fillDraftFromExtraction}><Plus size={14} weight="bold" /> Import supplier images</Button>
              </div>
            )}

            {tab === 'variants' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <SectionTitle icon={<Stack size={13} />}>Variant matrix</SectionTitle>
                  <Button variant="secondary" onClick={generateVariants}><Sparkle size={14} weight="bold" /> Generate matrix</Button>
                </div>
                {variantNotice && <Notice tone="green">{variantNotice}</Notice>}
                {draft.variants.length === 0 ? (
                  <p className="text-[12px] text-gray-500">No variants — this product sells as a single option.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-100">
                          {['Colour', 'Hex', 'Sizes', ''].map((h) => <th key={h} scope="col" className="py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>)}
                        </tr>
                      </thead>
                      <tbody>
                        {draft.variants.map((v, i) => (
                          <tr key={`${v.color}-${i}`} className="border-b border-gray-50 last:border-0">
                            <td className="py-2 text-[12px] text-gray-800">{v.color}</td>
                            <td className="py-2"><span className="inline-flex items-center gap-1.5 text-[11px] text-gray-500"><span className="w-3.5 h-3.5 rounded border border-gray-200" style={{ background: v.colorHex }} />{v.colorHex}</span></td>
                            <td className="py-2 text-[12px] text-gray-600">{(v.sizes || []).join(', ') || '—'}</td>
                            <td className="py-2 text-right">
                              <button type="button" onClick={() => set('variants', draft.variants.filter((_, x) => x !== i))} className="p-1.5 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50" aria-label={`Remove ${v.color}`}><Trash size={13} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {tab === 'promotions' && (
              <div className="space-y-4">
                <SectionTitle icon={<Tag size={13} />}>Per-product promotions</SectionTitle>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Product-level discount">
                    <select className={SELECT_CLS + ' w-full'} defaultValue="none">
                      <option value="none">None</option>
                      <option value="10">10% off</option>
                      <option value="15">15% off</option>
                      <option value="20">20% off</option>
                    </select>
                  </Field>
                  <Field label="Eligible for gift drop">
                    <select className={SELECT_CLS + ' w-full'} defaultValue="no">
                      <option value="no">No</option>
                      <option value="yes">Yes — can be claimed at $0</option>
                    </select>
                  </Field>
                </div>
                <p className="text-[12px] text-gray-500">Bundle and coupon rules live on the Promotions screen; this tab only carries product-level overrides.</p>
              </div>
            )}

            {tab === 'commerce' && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { label: 'Supply', value: draft.sourceType, ok: draft.sourceType !== 'OTHER', icon: <Cube size={14} /> },
                    { label: 'Economics', value: draft.margin === null ? 'cost unknown' : `${draft.margin}% margin`, ok: draft.margin !== null && draft.margin >= MARGIN_FLOOR, icon: <CurrencyDollar size={14} /> },
                    { label: 'Evidence', value: draft.fulfillment === 'IN_HOUSE' ? 'In-house verified' : 'Supplier docs on file', ok: draft.fulfillment === 'IN_HOUSE', icon: <CheckCircle size={14} /> },
                    { label: 'Risks', value: draft.readiness === 'BLOCKED' ? 'Blocked' : 'None open', ok: draft.readiness !== 'BLOCKED', icon: <WarningCircle size={14} /> },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl border border-gray-100 p-3">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">{s.icon}{s.label}</div>
                      <div className="mt-1.5 text-[13px] font-semibold text-gray-900">{s.value}</div>
                      <div className="mt-1"><Badge tone={s.ok ? 'green' : 'amber'}>{s.ok ? 'pass' : 'attention'}</Badge></div>
                    </div>
                  ))}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Source type">
                    <select className={SELECT_CLS + ' w-full'} value={draft.sourceType} onChange={(e) => set('sourceType', e.target.value as AdminProduct['sourceType'])}>
                      {['CJ', 'KONG', 'IN_HOUSE', 'OTHER'].map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </Field>
                  <Field label="Supplier URL">
                    <input className={INPUT_CLS} value={draft.supplierUrl ?? ''} onChange={(e) => set('supplierUrl', e.target.value)} />
                  </Field>
                </div>

                <Card title="Final readiness" bodyClass="p-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={READINESS_TONE[draft.readiness]}>{draft.readiness.replace(/_/g, ' ').toLowerCase()}</Badge>
                    <span className="text-[12px] text-gray-600">
                      {draft.readiness === 'COMMERCE_READY'
                        ? 'Sellable on the storefront, sitemap and ad feed.'
                        : 'Not customer-visible. Resolve the flags above, then set readiness to commerce ready.'}
                    </span>
                  </div>
                </Card>

                <Card title="AI intelligence" actions={<Badge tone="violet">read-only</Badge>} bodyClass="p-3">
                  <p className="text-[12px] text-gray-600">
                    Research signals can suggest pricing and copy, but they can never change readiness — that stays a human decision.
                  </p>
                  <div className="mt-3">
                    <KeyValue
                      cols={2}
                      items={[
                        { label: 'Sources', value: draft.supplierUrl ? '1 supplier page' : 'none' },
                        { label: 'Risks', value: draft.margin === null ? 'Supplier cost unknown' : draft.margin < MARGIN_FLOOR ? 'Margin below playbook floor' : 'None flagged' },
                        { label: 'Social proof', value: draft.reviewCount ? `${draft.rating}★ from ${draft.reviewCount} reviews` : 'No reviews yet' },
                      ]}
                    />
                  </div>
                </Card>
              </div>
            )}

            {tab === 'seo' && seo && (
              <div className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Meta title" hint={`${seo.titleLength} characters — aim for 45–60.`}>
                    <input className={INPUT_CLS} value={draft.name ? `${draft.name} | Basco Sports` : ''} readOnly />
                  </Field>
                  <Field label="Slug">
                    <input className={INPUT_CLS} value={draft.slug} onChange={(e) => set('slug', e.target.value)} />
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Meta description" hint={`${seo.metaLength} characters — aim for 120–158.`}>
                      <textarea rows={3} className={TEXTAREA_CLS} value={draft.description.slice(0, 160)} readOnly />
                    </Field>
                  </div>
                </div>

                <Card title="Live SEO analysis" bodyClass="p-4">
                  <div className="flex items-start gap-5 flex-wrap">
                    <ScoreRing value={seo.overall} label="Overall" size={72} />
                    <div className="flex-1 min-w-[16rem] space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Readability', value: seo.readability },
                          { label: 'Keyword density', value: Math.min(100, seo.keywordDensity * 40) },
                          { label: 'Title length', value: seo.titleLength >= 45 && seo.titleLength <= 60 ? 100 : 55 },
                          { label: 'Image ALT', value: seo.missingAlt === 0 ? 100 : 40 },
                        ].map((m) => (
                          <div key={m.label}>
                            <div className="flex items-center justify-between text-[11px] text-gray-500"><span>{m.label}</span><span className="font-semibold text-gray-700">{Math.round(m.value)}</span></div>
                            <ProgressBar className="mt-1" value={m.value} />
                          </div>
                        ))}
                      </div>
                      <ul className="space-y-1.5">
                        {seo.issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-[12px]">
                            <span className={issue.type === 'good' ? 'text-emerald-500' : issue.type === 'warning' ? 'text-amber-500' : 'text-rose-500'}>
                              {issue.type === 'good' ? <CheckCircle size={13} weight="fill" /> : <WarningCircle size={13} weight="fill" />}
                            </span>
                            <span className="text-gray-700">{issue.msg}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-gray-400">Scored locally from the fields above — no provider call, so it works with no keys configured.</p>
                </Card>

                <Card title="SERP preview" bodyClass="p-4">
                  <div className="text-[12px] text-emerald-700">bascosports.com › product › {draft.slug || 'slug'}</div>
                  <div className="text-[16px] text-blue-700 leading-snug mt-0.5">{draft.name ? `${draft.name} | Basco Sports` : 'Product title'}</div>
                  <div className="text-[12px] text-gray-600 mt-0.5">{draft.description.slice(0, 158) || 'Meta description preview…'}</div>
                </Card>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-4">
          <Card title="Readiness checklist" bodyClass="p-3">
            <ul className="space-y-2">
              {[
                { label: 'General details', done: !!draft.name && !!draft.description },
                { label: 'Pricing set', done: draft.price > 0 },
                { label: 'At least one image', done: draft.images.length > 0 },
                { label: 'Supplier evidence', done: draft.sourceType !== 'OTHER' },
                { label: `Margin over ${MARGIN_FLOOR}%`, done: draft.margin !== null && draft.margin >= MARGIN_FLOOR },
              ].map((c) => (
                <li key={c.label} className="flex items-center gap-2 text-[12px]">
                  <span className={c.done ? 'text-emerald-500' : 'text-gray-300'}>{c.done ? <CheckCircle size={14} weight="fill" /> : <WarningCircle size={14} />}</span>
                  <span className={c.done ? 'text-gray-700' : 'text-gray-500'}>{c.label}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Visibility" bodyClass="p-3">
            <div className="flex items-center gap-2 text-[12px]">
              <Storefront size={15} className="text-gray-400" />
              {draft.isActive ? <span className="text-emerald-600 font-semibold">Live on storefront</span> : <span className="text-gray-600">Hidden from customers</span>}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[12px] text-gray-600">
              <Truck size={15} className="text-gray-400" /> {draft.fulfillment === 'IN_HOUSE' ? 'Ships in-house' : 'Ships from supplier'}
            </div>
            <div className="mt-3 flex items-center gap-2 text-[12px] text-gray-600">
              <MagnifyingGlass size={15} className="text-gray-400" /> SEO score {seo?.overall ?? 0}/100
            </div>
          </Card>

          <Card title="Preview" bodyClass="p-3">
            {draft.images[0] ? (
              <Image src={draft.images[0]} alt="" width={240} height={160} className="w-full h-32 rounded-lg object-cover bg-gray-100" />
            ) : (
              <div className="w-full h-32 rounded-lg bg-gray-50 flex items-center justify-center text-[11px] text-gray-400">No image</div>
            )}
            <div className="mt-2 text-[13px] font-medium text-gray-900 truncate">{draft.name || 'Untitled product'}</div>
            <div className="text-[12px] text-gray-500">{formatMoney(draft.price)}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
