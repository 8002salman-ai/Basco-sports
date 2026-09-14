'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Sparkle, Robot, Link as LinkIcon, Stack, ListChecks, WarningCircle, CheckCircle,
  ArrowRight, ArrowsClockwise, FloppyDisk,
} from '@phosphor-icons/react';
import {
  Badge, Button, Card, DemoNotice, Field, INPUT_CLS, Notice,
  PageHeader, ProgressBar, SELECT_CLS, StatCard, StatGrid, TEXTAREA_CLS, Toggle,
} from '@/components/admin/ui';
import { DataTable, type Column } from '@/components/admin/table';
import {
  buildLocalExtraction, buildVariantMatrix, importHistory, LISTING_CATEGORIES, LISTING_SOURCES,
  PRICING_MODES, validateListingTask, type ListingSource, type ListingTask,
} from '@/features/admin/demo/ai';
import { DEFAULT_AI_PROVIDERS } from '@/features/ai/providers';
import { catalogSeed, formatDate } from '@/features/admin/demo/data';
import type { AdminProduct } from '@/lib/admin/types';
import { useAdminTable } from '@/hooks/use-admin-table';
import type { AIExtractedProduct, ImportHistoryEntry } from '@/features/ai/types';

export function AiHubView() {
  const [providers] = useState(DEFAULT_AI_PROVIDERS);
  const [model, setModel] = useState(providers[0]?.defaultModel ?? '');
  const [prompt, setPrompt] = useState('');
  const [output, setOutput] = useState<string | null>(null);

  const active = providers.find((p) => p.enabled) ?? providers[0];

  const generate = () => {
    // The clone has no provider key, so this returns a clearly-labelled local draft.
    setOutput(
      [
        `Local draft for: "${prompt.slice(0, 80)}${prompt.length > 80 ? '…' : ''}"`,
        '',
        'Basco Sports never publishes machine text unreviewed. In a live environment this response comes from the provider chain, then lands in the review step of AI Import or the product editor.',
      ].join('\n')
    );
  };

  return (
    <div className="space-y-4">
      <PageHeader title="AI Hub" subtitle="Central AI operations — provider status, model choice and the content generators." />
      <DemoNotice>No AI provider key is linked in this environment, so generators return clearly-labelled local drafts. Everything else on this screen is fully interactive.</DemoNotice>

      <StatGrid cols={4}>
        <StatCard label="Providers configured" value={providers.filter((p) => p.enabled).length} hint={`of ${providers.length} known`} icon={<Robot size={15} weight="bold" />} tone="violet" />
        <StatCard label="Routing" value={active?.name ?? '—'} hint="primary provider" icon={<ArrowsClockwise size={15} weight="bold" />} tone="blue" />
        <StatCard label="Imports this week" value={importHistory.length} hint="extractions recorded" icon={<Sparkle size={15} weight="bold" />} tone="emerald" />
        <StatCard label="Keys stored in browser" value="0" hint="always zero — server-side only" icon={<WarningCircle size={15} weight="bold" />} tone="amber" />
      </StatGrid>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="Content generator">
          <div className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Provider">
                <select className={SELECT_CLS + ' w-full'} value={active?.id} onChange={() => undefined} aria-label="Provider">
                  {providers.filter((p) => p.enabled).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="Model">
                <select className={SELECT_CLS + ' w-full'} value={model} onChange={(e) => setModel(e.target.value)} aria-label="Model">
                  {(active?.models ?? []).map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Prompt">
              <textarea rows={4} className={TEXTAREA_CLS} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Write a 3-paragraph description for the Apex Flight FG boot…" />
            </Field>
            <div className="flex items-center gap-2">
              <Button onClick={generate} disabled={!prompt.trim()}><Sparkle size={14} weight="bold" /> Generate</Button>
              {output && <Button variant="ghost" onClick={() => setOutput(null)}>Clear</Button>}
            </div>
            {output && (
              <pre className="whitespace-pre-wrap rounded-xl bg-gray-50 border border-gray-100 p-3 text-[12px] text-gray-700">{output}</pre>
            )}
          </div>
        </Card>

        <div className="space-y-4">
          <Card title="Generators">
            <ul className="space-y-2">
              {[
                { href: '/admin/ai-import', label: 'AI Import', hint: 'URL → structured listing' },
                { href: '/admin/variant-gen', label: 'Variant Gen', hint: 'colour × size matrix' },
                { href: '/admin/seo-engine', label: 'SEO Engine', hint: 'titles, meta, live analysis' },
                { href: '/admin/marketing', label: 'Marketing Gen', hint: 'ads, social, email' },
              ].map((g) => (
                <li key={g.href}>
                  <Link href={g.href} className="flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2.5 hover:border-gray-200 hover:shadow-sm transition-all">
                    <div className="min-w-0 flex-1">
                      <div className="text-[12px] font-semibold text-gray-800">{g.label}</div>
                      <div className="text-[11px] text-gray-500">{g.hint}</div>
                    </div>
                    <ArrowRight size={13} className="text-gray-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Provider status">
            <div className="space-y-2">
              {providers.map((p) => (
                <div key={p.id} className="flex items-center gap-2 text-[12px]">
                  <span className={`w-1.5 h-1.5 rounded-full ${p.enabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  <span className="text-gray-700 flex-1">{p.name}</span>
                  <Badge tone={p.enabled ? 'green' : 'gray'}>{p.enabled ? 'enabled' : 'off'}</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Import
// ---------------------------------------------------------------------------

type ImportStep = 'source' | 'extracting' | 'review';

export function AiImportView() {
  const [step, setStep] = useState<ImportStep>('source');
  const [source, setSource] = useState('');
  const [sourceType, setSourceType] = useState<'url' | 'html' | 'text'>('url');
  const [provider, setProvider] = useState(DEFAULT_AI_PROVIDERS[0]?.id ?? 'openrouter');
  const [draft, setDraft] = useState<AIExtractedProduct | null>(null);
  const [history, setHistory] = useState<ImportHistoryEntry[]>(importHistory);
  const [created, setCreated] = useState<string | null>(null);
  const [review, setReview] = useState('');

  const startExtraction = () => {
    if (!source.trim()) return;
    setStep('extracting');
    setCreated(null);
    // Local deterministic extraction stands in for the server AI call.
    window.setTimeout(() => {
      setDraft(buildLocalExtraction(source, source.length % catalogSeed.length));
      setStep('review');
      setHistory((prev) => [
        {
          id: `imp-${Date.now()}`,
          source: source.slice(0, 60),
          sourceType,
          date: new Date().toISOString(),
          provider: DEFAULT_AI_PROVIDERS.find((p) => p.id === provider)?.name ?? provider,
          model: DEFAULT_AI_PROVIDERS.find((p) => p.id === provider)?.defaultModel ?? '—',
          productTitle: 'Extracted draft',
          status: 'success',
          importTime: 12.4,
        },
        ...prev,
      ]);
    }, 600);
  };

  const evidenceRows = Object.entries(draft?.evidence ?? {});
  const unknownCritical = evidenceRows.filter(([key, value]) => value === 'UNKNOWN' && (key === 'shipping' || key === 'pricing'));
  const canCreate = !!draft && unknownCritical.length === 0;

  const historyColumns: Column<ImportHistoryEntry>[] = [
    { key: 'source', header: 'Source', cell: (h) => <span className="font-mono text-[11px] text-gray-700 truncate block max-w-[240px]">{h.source}</span>, sortValue: (h) => h.source },
    { key: 'type', header: 'Type', cell: (h) => <Badge tone="blue">{h.sourceType}</Badge>, sortValue: (h) => h.sourceType },
    { key: 'provider', header: 'Provider', cell: (h) => <span className="text-gray-600">{h.provider}</span>, sortValue: (h) => h.provider },
    { key: 'status', header: 'Status', cell: (h) => <Badge tone={h.status === 'success' ? 'green' : h.status === 'partial' ? 'amber' : 'red'}>{h.status}</Badge>, sortValue: (h) => h.status },
    { key: 'time', header: 'Time', align: 'right', cell: (h) => <span className="text-gray-500">{h.importTime}s</span>, sortValue: (h) => h.importTime },
    { key: 'date', header: 'When', cell: (h) => <span className="text-gray-500">{formatDate(h.date)}</span>, sortValue: (h) => h.date },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="AI Import"
        subtitle="Paste a supplier URL, review the extraction, then create a draft. Nothing is published automatically."
        actions={step === 'review' ? <Button variant="secondary" onClick={() => { setStep('source'); setDraft(null); }}>Start over</Button> : undefined}
      />
      <DemoNotice>The extraction step runs locally and deterministically — the review gate, evidence model and risk flags below are the real behaviour a provider-backed run uses.</DemoNotice>

      <div className="flex items-center gap-2 text-[11px]">
        {[
          { key: 'source', label: '1. Source' },
          { key: 'extracting', label: '2. Extract' },
          { key: 'review', label: '3. Review & create' },
        ].map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            {i > 0 && <span className="text-gray-300">→</span>}
            <span className={`px-2.5 py-1 rounded-full font-semibold ${step === s.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-500'}`}>{s.label}</span>
          </div>
        ))}
      </div>

      {step === 'source' && (
        <Card title="Source">
          <div className="grid sm:grid-cols-[200px_1fr] gap-3">
            <Field label="Input type">
              <select className={SELECT_CLS + ' w-full'} value={sourceType} onChange={(e) => setSourceType(e.target.value as 'url' | 'html' | 'text')}>
                <option value="url">Product URL</option>
                <option value="html">Pasted HTML</option>
                <option value="text">Pasted text</option>
              </select>
            </Field>
            <Field label="Provider" hint="Keys stay server-side; the browser never holds one.">
              <select className={SELECT_CLS + ' w-full'} value={provider} onChange={(e) => setProvider(e.target.value)}>
                {DEFAULT_AI_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.defaultModel}</option>)}
              </select>
            </Field>
          </div>
          <div className="mt-3">
            <Field label={sourceType === 'url' ? 'Supplier URL' : 'Content'} required>
              {sourceType === 'url' ? (
                <input className={INPUT_CLS} value={source} onChange={(e) => setSource(e.target.value)} placeholder="https://cjdropshipping.com/product/…" />
              ) : (
                <textarea rows={6} className={TEXTAREA_CLS} value={source} onChange={(e) => setSource(e.target.value)} />
              )}
            </Field>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button onClick={startExtraction} disabled={!source.trim()}><Sparkle size={14} weight="bold" /> Fetch & extract</Button>
            <span className="text-[11px] text-gray-500">The listing playbook is applied to every import.</span>
          </div>
        </Card>
      )}

      {step === 'extracting' && (
        <Card title="Extracting">
          <div className="py-8 text-center">
            <span className="inline-block w-6 h-6 rounded-full border-2 border-gray-200 border-t-violet-500 animate-spin" />
            <p className="mt-3 text-[13px] text-gray-600">Reading the source, structuring fields and scoring confidence…</p>
          </div>
        </Card>
      )}

      {step === 'review' && draft && (
        <>
          {created && <Notice tone="green">Draft created: <strong>{draft.title}</strong> — it lands in the catalog as <strong>review required</strong>, never live. <Link href="/admin/products" className="underline font-semibold">Open products</Link></Notice>}

          <div className="grid lg:grid-cols-[1fr_320px] gap-4 items-start">
            <Card title="Review & edit" bodyClass="p-4 space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Title" required><input className={INPUT_CLS} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></Field>
                <Field label="Brand"><input className={INPUT_CLS} value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} /></Field>
                <Field label="Sport"><input className={INPUT_CLS} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} /></Field>
                <Field label="SKU"><input className={INPUT_CLS} value={draft.sku} onChange={(e) => setDraft({ ...draft, sku: e.target.value })} /></Field>
                <Field label="Cost price"><input type="number" className={INPUT_CLS} value={draft.costPrice} onChange={(e) => setDraft({ ...draft, costPrice: Number(e.target.value) })} /></Field>
                <Field label="Selling price"><input type="number" className={INPUT_CLS} value={draft.sellingPrice} onChange={(e) => setDraft({ ...draft, sellingPrice: Number(e.target.value) })} /></Field>
              </div>
              <Field label="Short description"><textarea rows={3} className={TEXTAREA_CLS} value={draft.shortDescription} onChange={(e) => setDraft({ ...draft, shortDescription: e.target.value })} /></Field>
              <Field label="Features" hint="One per line."><textarea rows={4} className={TEXTAREA_CLS} value={draft.features.join('\n')} onChange={(e) => setDraft({ ...draft, features: e.target.value.split('\n').filter(Boolean) })} /></Field>
              <Field label="Owner notes"><textarea rows={3} className={TEXTAREA_CLS} value={review} onChange={(e) => setReview(e.target.value)} placeholder="Anything you want remembered about this listing…" /></Field>
            </Card>

            <div className="space-y-4 lg:sticky lg:top-4">
              <Card title="Evidence" bodyClass="p-3">
                <div className="space-y-2">
                  {evidenceRows.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between text-[12px]">
                      <span className="text-gray-600 capitalize">{key}</span>
                      <Badge tone={value === 'VERIFIED' ? 'green' : value === 'INFERRED' ? 'amber' : 'gray'}>{value}</Badge>
                    </div>
                  ))}
                </div>
                {unknownCritical.length > 0 && (
                  <div className="mt-3">
                    <Notice tone="amber">
                      Missing evidence: {unknownCritical.map(([k]) => k).join(', ')}. The playbook blocks publishing until these are resolved — you can still keep this as a draft.
                    </Notice>
                  </div>
                )}
              </Card>

              <Card title="Risk flags" bodyClass="p-3">
                {draft.riskFlags?.length ? (
                  <ul className="space-y-1.5">
                    {draft.riskFlags.map((r) => <li key={r} className="flex items-start gap-2 text-[12px] text-gray-700"><WarningCircle size={13} weight="fill" className="text-amber-500 mt-px shrink-0" />{r}</li>)}
                  </ul>
                ) : (
                  <p className="text-[12px] text-emerald-600 flex items-center gap-1.5"><CheckCircle size={13} weight="fill" /> No flags</p>
                )}
              </Card>

              <Card title="Confidence" bodyClass="p-3">
                <div className="space-y-2.5">
                  {Object.entries(draft.confidence).map(([k, v]) => (
                    <div key={k}>
                      <div className="flex items-center justify-between text-[11px] text-gray-500"><span className="capitalize">{k}</span><span className="font-semibold text-gray-700">{Math.round(v * 100)}%</span></div>
                      <ProgressBar className="mt-1" value={v * 100} tone={v > 0.8 ? 'emerald' : v > 0.5 ? 'amber' : 'rose'} />
                    </div>
                  ))}
                </div>
              </Card>

              <Button
                className="w-full"
                disabled={!canCreate || !!created}
                title={canCreate ? 'Create a review-required draft' : 'Resolve the missing evidence first'}
                onClick={() => setCreated(draft.slug)}
              >
                <FloppyDisk size={14} weight="bold" /> {created ? 'Draft created' : 'Create draft'}
              </Button>
              {!canCreate && <p className="text-[11px] text-amber-700 text-center">Insufficient evidence — create draft is blocked until pricing and shipping are verified.</p>}
            </div>
          </div>
        </>
      )}

      <Card title="Import history" bodyClass="p-0">
        <DataTable rows={history} columns={historyColumns} perPage={6} dense search="" empty={{ title: 'No imports yet', hint: 'Run an extraction to see it logged here.', icon: <LinkIcon size={16} /> }} />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant generator — 4-step wizard
// ---------------------------------------------------------------------------

const VARIANT_STEPS = ['Product', 'Attributes', 'Matrix', 'Done'] as const;

export function VariantGenView() {
  const { rows, save: persist } = useAdminTable<AdminProduct>('products', catalogSeed);
  const [step, setStep] = useState(0);
  const [productId, setProductId] = useState(rows[0]?.id ?? '');
  const [colors, setColors] = useState('Obsidian, Lime, Stone');
  const [sizes, setSizes] = useState('S, M, L, XL');
  const [lowStock, setLowStock] = useState(5);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const product = rows.find((p) => p.id === productId);
  const colorList = colors.split(',').map((c) => c.trim()).filter(Boolean);
  const sizeList = sizes.split(',').map((s) => s.trim()).filter(Boolean);
  const matrix = useMemo(() => buildVariantMatrix(sizeList, colorList), [sizes, colors]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyMatrix = async () => {
    if (!product) return;
    const hexes: Record<string, string> = { obsidian: '#0B1220', lime: '#D4FF32', stone: '#EDE9E3', white: '#FFFFFF', red: '#FF4D23' };
    setSaveError(null);
    const ok = await persist({
      ...product,
      variants: colorList.map((c) => ({
        color: c,
        colorHex: hexes[c.toLowerCase()] ?? '#0B1220',
        sizes: sizeList,
        images: [],
      })),
      lowStockThreshold: lowStock,
      updatedAt: new Date().toISOString(),
    });
    if (!ok) {
      setSaveError('The matrix could not be written to the product.');
      return;
    }
    setSaved(true);
    setStep(3);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Variant Gen" subtitle="Generate a colour × size matrix, de-duplicate it, then write it to the product." />
      <DemoNotice>The matrix is computed locally with real combinatorics, so this wizard produces genuine output with no provider key.</DemoNotice>
      {saveError && <Notice tone="red">{saveError}</Notice>}

      <div className="flex items-center gap-2 text-[11px] flex-wrap">
        {VARIANT_STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            {i > 0 && <span className="text-gray-300">→</span>}
            <span className={`px-2.5 py-1 rounded-full font-semibold ${step === i ? 'bg-gray-900 text-white' : step > i ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{i + 1}. {label}</span>
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card title="Choose a product">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {rows.slice(0, 9).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { setProductId(p.id); setStep(1); }}
                className={`text-left rounded-xl border p-3 transition-all ${p.id === productId ? 'border-violet-300 bg-violet-50/40' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="text-[12px] font-semibold text-gray-900 truncate">{p.name}</div>
                <div className="text-[11px] text-gray-500">{p.sku} · {p.variants.length} variant{p.variants.length === 1 ? '' : 's'}</div>
              </button>
            ))}
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card title="Attributes">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Colours" hint="Comma separated."><input className={INPUT_CLS} value={colors} onChange={(e) => setColors(e.target.value)} /></Field>
            <Field label="Sizes" hint="Comma separated."><input className={INPUT_CLS} value={sizes} onChange={(e) => setSizes(e.target.value)} /></Field>
            <Field label="Low-stock threshold"><input type="number" className={INPUT_CLS} value={lowStock} onChange={(e) => setLowStock(Number(e.target.value))} /></Field>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
            <Button onClick={() => setStep(2)} disabled={!colorList.length || !sizeList.length}>Build matrix <ArrowRight size={14} weight="bold" /></Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <>
          <StatGrid cols={4}>
            <StatCard label="Combinations" value={matrix.variants.length} hint="after de-duplication" tone="violet" icon={<Stack size={15} weight="bold" />} />
            <StatCard label="Duplicates skipped" value={matrix.duplicates} hint="identical colour + size" tone="amber" icon={<WarningCircle size={15} weight="bold" />} />
            <StatCard label="Active" value={matrix.variants.length} hint="all enabled by default" tone="emerald" icon={<CheckCircle size={15} weight="bold" />} />
            <StatCard label="Low-stock rule" value={`≤ ${lowStock}`} hint="applied to every variant" tone="blue" icon={<ListChecks size={15} weight="bold" />} />
          </StatGrid>

          <Card title={`Matrix for ${product?.name ?? 'product'}`} bodyClass="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {['Colour', 'Size', 'SKU', 'Status'].map((h) => <th key={h} scope="col" className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {matrix.variants.slice(0, 24).map((v) => (
                    <tr key={v.sku} className="border-b border-gray-50 last:border-0">
                      <td className="px-4 py-2 text-[12px] text-gray-800">{v.attributes.Color}</td>
                      <td className="px-4 py-2 text-[12px] text-gray-600">{v.attributes.Size}</td>
                      <td className="px-4 py-2 text-[11px] font-mono text-gray-500">{v.sku}</td>
                      <td className="px-4 py-2"><Badge tone="green">active</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={applyMatrix}><FloppyDisk size={14} weight="bold" /> Save variants to product</Button>
          </div>
        </>
      )}

      {step === 3 && (
        <Card title="Done">
          <div className="py-6 text-center">
            <CheckCircle size={36} weight="fill" className="text-emerald-500 mx-auto" />
            <p className="mt-3 text-[13px] text-gray-700">
              {saved ? `${matrix.variants.length} variants saved to ${product?.name}.` : 'Wizard complete.'}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="secondary" onClick={() => { setStep(0); setSaved(false); }}>Generate another</Button>
              <Link href="/admin/products"><Button>Open products</Button></Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Listing Task (batch import composer)
// ---------------------------------------------------------------------------

export function ListingTaskView() {
  const { rows, save: upsert } = useAdminTable<ListingTask>('listing-tasks', []);
  const [form, setForm] = useState<{
    source: ListingSource;
    url: string;
    count: number;
    category: string;
    pricingMode: string;
    pricingValue: number;
  }>({ source: 'CJ', url: '', count: 20, category: 'football', pricingMode: PRICING_MODES[0], pricingValue: 2.4 });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [running, setRunning] = useState(false);
  const [playbook, setPlaybook] = useState(true);

  const submit = () => {
    const found = validateListingTask(form);
    setErrors(found);
    if (Object.keys(found).length) return;
    const task: ListingTask = {
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
      source: form.source,
      url: form.url.trim(),
      count: form.count,
      category: form.category,
      pricingMode: form.pricingMode,
      pricingValue: form.pricingValue,
      status: 'running',
      imported: 0,
      failed: 0,
      playbookApplied: playbook,
    };
    upsert(task);
    setRunning(true);
    // Local simulation of the batch runner: no supplier call, no key.
    window.setTimeout(() => {
      upsert({ ...task, status: 'completed', imported: Math.max(0, form.count - 2), failed: 2 });
      setRunning(false);
    }, 900);
  };

  const columns: Column<ListingTask>[] = [
    { key: 'source', header: 'Source', cell: (t) => <Badge tone="blue">{t.source}</Badge>, sortValue: (t) => t.source },
    { key: 'url', header: 'URL', cell: (t) => <span className="font-mono text-[11px] text-gray-600 truncate block max-w-[220px]">{t.url}</span>, sortValue: (t) => t.url },
    { key: 'count', header: 'Requested', align: 'right', cell: (t) => <span className="text-gray-600">{t.count}</span>, sortValue: (t) => t.count },
    { key: 'imported', header: 'Imported', align: 'right', cell: (t) => <span className="font-semibold text-emerald-600">{t.imported}</span>, sortValue: (t) => t.imported },
    { key: 'failed', header: 'Failed', align: 'right', cell: (t) => <span className={t.failed ? 'text-rose-600 font-semibold' : 'text-gray-500'}>{t.failed}</span>, sortValue: (t) => t.failed },
    { key: 'status', header: 'Status', cell: (t) => <Badge tone={t.status === 'completed' ? 'green' : t.status === 'running' ? 'blue' : t.status === 'failed' ? 'red' : 'gray'}>{t.status}</Badge>, sortValue: (t) => t.status },
    { key: 'playbook', header: 'Playbook', cell: (t) => <Badge tone={t.playbookApplied ? 'green' : 'amber'}>{t.playbookApplied ? 'applied' : 'bypassed'}</Badge>, sortValue: (t) => (t.playbookApplied ? 1 : 0) },
    { key: 'created', header: 'Created', cell: (t) => <span className="text-gray-500">{formatDate(t.createdAt)}</span>, sortValue: (t) => t.createdAt },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Listing Task" subtitle="Compose a batch import command, validate it, then run it against a source platform." />
      <DemoNotice>Batch runs are simulated locally — no supplier key is called. Validation, the playbook gate and the results ledger work exactly as they would live.</DemoNotice>

      <Card title="Compose task">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Field label="Source platform" required>
            <select className={SELECT_CLS + ' w-full'} value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as ListingSource })}>
              {LISTING_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Category" required>
            <select className={SELECT_CLS + ' w-full'} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {LISTING_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="How many products" required hint={errors.count}>
            <input type="number" className={INPUT_CLS} value={form.count} onChange={(e) => setForm({ ...form, count: Number(e.target.value) })} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Source URL" required hint={errors.url}>
              <input className={INPUT_CLS} value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://cjdropshipping.com/list/…" />
            </Field>
          </div>
          <Field label="Pricing mode" required>
            <select className={SELECT_CLS + ' w-full'} value={form.pricingMode} onChange={(e) => setForm({ ...form, pricingMode: e.target.value })}>
              {PRICING_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </Field>
          <Field label="Pricing value" required hint={errors.pricingValue}>
            <input type="number" step="0.1" className={INPUT_CLS} value={form.pricingValue} onChange={(e) => setForm({ ...form, pricingValue: Number(e.target.value) })} />
          </Field>
          <div className="flex items-end">
            <Toggle on={playbook} onChange={setPlaybook} label="Apply listing playbook" />
          </div>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="mt-3"><Notice tone="red">Fix {Object.keys(errors).length} field{Object.keys(errors).length === 1 ? '' : 's'} before running: {Object.values(errors).join(' ')}</Notice></div>
        )}

        <div className="mt-4 flex items-center gap-2">
          <Button variant="secondary" onClick={() => setErrors(validateListingTask(form))}><ListChecks size={14} weight="bold" /> Validate</Button>
          <Button onClick={submit} disabled={running}><Sparkle size={14} weight="bold" /> {running ? 'Running…' : 'Run batch import'}</Button>
        </div>
      </Card>

      <Card title="Tasks" bodyClass="p-0">
        <DataTable
          rows={rows}
          columns={columns}
          perPage={8}
          empty={{ title: 'No tasks yet', hint: 'Compose and run a batch import above.', icon: <ListChecks size={16} /> }}
          rowActions={(t) => (
            <button type="button" onClick={() => upsert({ ...t, status: 'queued' })} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100" aria-label={`Re-queue ${t.id}`} title="Re-queue"><ArrowsClockwise size={14} /></button>
          )}
        />
      </Card>
    </div>
  );
}
