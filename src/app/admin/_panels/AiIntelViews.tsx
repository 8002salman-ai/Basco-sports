'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Target, Sparkle, CheckCircle, WarningCircle, Trash, Prohibit, Eye, Robot,
  CurrencyDollar, ShieldCheck, ArrowUpRight,
} from '@phosphor-icons/react';
import {
  Badge, Button, Card, DemoNotice, Drawer, EmptyState, Field, INPUT_CLS, KeyValue,
  Notice, PageHeader, ProgressBar, SELECT_CLS, SectionTitle, StatCard, StatGrid, Tabs, Toggle, Toolbar,
} from '@/components/admin/ui';
import { DataTable, type Column } from '@/components/admin/table';
import { Donut, Sparkline } from '@/components/admin/charts';
import {
  CONFIDENCE_TONE, INTEL_TABS, aiFeatureSwitches, aiTaskRouting, catalogQaCounts, ownerAttention,
  researchSources, researchTrends, scoutCandidates, scoutRunStats, spendControl, intelItems,
  type IntelItem, type IntelTab, type ScoutCandidate,
} from '@/features/admin/demo/ai';
import { marketDemand } from '@/features/admin/demo/marketing';
import { DEFAULT_AI_PROVIDERS, loadAIProviders, loadProviderSettings, resolveProviderChain, saveAIProviders } from '@/features/ai/providers';
import type { AIProvider } from '@/features/ai/types';
import { useAdminTable } from '@/hooks/use-admin-table';
import { SalmanOsPanel } from '@/components/admin/SalmanOsPanel';

// ---------------------------------------------------------------------------
// Product Scout
// ---------------------------------------------------------------------------

export function ScoutView() {
  const { rows, save: upsert, remove } = useAdminTable<ScoutCandidate>('scout', scoutCandidates);
  const [state, setState] = useState<'all' | ScoutCandidate['state']>('all');
  const [open, setOpen] = useState<ScoutCandidate | null>(null);

  const shown = state === 'all' ? rows : rows.filter((c) => c.state === state);
  const current = open ? rows.find((c) => c.id === open.id) ?? open : null;

  const columns: Column<ScoutCandidate>[] = [
    { key: 'title', header: 'Candidate', cell: (c) => <div className="min-w-0"><div className="font-medium text-gray-900 truncate max-w-[240px]">{c.title}</div><div className="text-[10px] text-gray-400">{c.supplier} · {c.origin}</div></div>, sortValue: (c) => c.title },
    { key: 'price', header: 'Supplier', align: 'right', cell: (c) => <span className="text-gray-700">${c.supplierPrice.toFixed(2)}</span>, sortValue: (c) => c.supplierPrice },
    { key: 'shipping', header: 'Shipping', align: 'right', cell: (c) => <span className="text-gray-600">{c.shippingCost ? `$${c.shippingCost.toFixed(2)}` : 'Free'}</span>, sortValue: (c) => c.shippingCost },
    { key: 'eta', header: 'ETA', cell: (c) => <span className="text-gray-600 text-[11px]">{c.shippingDays}</span>, sortValue: (c) => c.shippingDays },
    { key: 'confidence', header: 'Confidence', cell: (c) => <Badge tone={CONFIDENCE_TONE[c.confidence]}>{c.confidence.replace(/_/g, ' ')}</Badge>, sortValue: (c) => c.confidence },
    { key: 'state', header: 'Pipeline', cell: (c) => <Badge tone={c.state === 'published' ? 'green' : c.state === 'approved' ? 'blue' : c.state === 'rejected' ? 'red' : c.state === 'shortlisted' ? 'violet' : 'gray'}>{c.state}</Badge>, sortValue: (c) => c.state },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Product Scout"
        subtitle="Sourcing pipeline with a points budget. Candidates only ever become drafts."
        actions={<Button variant="secondary" onClick={() => upsert({ ...rows[0], id: `scout-${Date.now()}`, state: 'candidate', confidence: 'possible' })}><Sparkle size={14} weight="bold" /> Run scout</Button>}
      />
      <DemoNotice>Supplier APIs are not called here. The pipeline states, evidence panel and points budget behave as they do live.</DemoNotice>

      <StatGrid cols={5}>
        <StatCard label="Candidates" value={scoutRunStats.candidates} hint={`${scoutRunStats.runsToday} runs today`} icon={<Target size={15} weight="bold" />} tone="blue" />
        <StatCard label="Shortlisted" value={scoutRunStats.shortlisted} hint="awaiting a decision" tone="violet" icon={<Sparkle size={15} weight="bold" />} />
        <StatCard label="Approved" value={scoutRunStats.approved} hint="ready to list" tone="emerald" icon={<CheckCircle size={15} weight="bold" />} />
        <StatCard label="Published" value={scoutRunStats.published} hint="live in the catalog" tone="amber" icon={<Eye size={15} weight="bold" />} />
        <StatCard label="Rejected" value={scoutRunStats.rejected} hint="kept for the record" tone="rose" icon={<Prohibit size={15} weight="bold" />} />
      </StatGrid>

      <Card title="Points budget">
        <div className="flex items-center gap-3">
          <div className="flex-1"><ProgressBar value={(scoutRunStats.pointsUsed / scoutRunStats.pointsBudget) * 100} tone="violet" /></div>
          <span className="text-[12px] font-semibold text-gray-800">{scoutRunStats.pointsUsed} / {scoutRunStats.pointsBudget} points</span>
        </div>
        <p className="mt-2 text-[11px] text-gray-500">Each supplier search reserves points atomically, so a stalled run cannot double-spend the budget.</p>
      </Card>

      <Card>
        <Toolbar className="mb-3">
          <select className={SELECT_CLS} value={state} onChange={(e) => setState(e.target.value as 'all' | ScoutCandidate['state'])} aria-label="Filter by pipeline state">
            {['all', 'candidate', 'shortlisted', 'approved', 'published', 'rejected'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All states' : s}</option>)}
          </select>
        </Toolbar>
        <DataTable
          rows={shown}
          columns={columns}
          perPage={10}
          onRowClick={setOpen}
          empty={{ title: 'No candidates in this state', hint: 'Run a scout pass to populate the pipeline.', icon: <Target size={16} /> }}
          rowActions={(c) => (
            <div className="flex items-center justify-end gap-1">
              <button type="button" onClick={() => upsert({ ...c, state: 'approved' })} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" aria-label={`Approve ${c.title}`} title="Approve"><CheckCircle size={14} /></button>
              <button type="button" onClick={() => upsert({ ...c, state: 'rejected' })} className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50" aria-label={`Reject ${c.title}`} title="Reject"><Prohibit size={14} /></button>
              <button type="button" onClick={() => remove(c.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50" aria-label={`Delete ${c.title}`} title="Delete"><Trash size={14} /></button>
            </div>
          )}
        />
      </Card>

      <Drawer
        open={!!current}
        onClose={() => setOpen(null)}
        title={current?.title ?? 'Candidate'}
        footer={current && (
          <>
            <Button variant="secondary" onClick={() => { upsert({ ...current, state: 'shortlisted' }); setOpen(null); }}>Shortlist</Button>
            <Button
              onClick={() => {
                upsert({ ...current, state: 'approved' });
                setOpen(null);
              }}
              disabled={current.confidence === 'insufficient_data'}
              title={current.confidence === 'insufficient_data' ? 'Not enough evidence for a draft' : 'Create a review-required draft'}
            >
              <Sparkle size={14} weight="bold" /> Create draft
            </Button>
          </>
        )}
      >
        {current && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge tone={CONFIDENCE_TONE[current.confidence]}>{current.confidence.replace(/_/g, ' ')}</Badge>
              <Badge tone="blue">{current.sport}</Badge>
              <Badge tone="gray">{current.availability}</Badge>
            </div>
            <KeyValue cols={2} items={current.evidence} />
            <Notice tone="blue">Creating a draft never activates a listing — the product arrives as <strong>review required</strong> and still needs pricing and evidence sign-off.</Notice>
            <div className="text-[12px] text-gray-500">
              Rating {current.rating} · {current.orders} orders on the supplier page
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Product Research
// ---------------------------------------------------------------------------

export function ProductResearchView() {
  const [term, setTerm] = useState('');

  const filtered = useMemo(
    () => researchTrends.filter((t) => t.keyword.toLowerCase().includes(term.trim().toLowerCase())),
    [term]
  );

  const columns: Column<(typeof researchTrends)[number]>[] = [
    { key: 'keyword', header: 'Keyword', cell: (t) => <span className="font-medium text-gray-900">{t.keyword}</span>, sortValue: (t) => t.keyword },
    { key: 'demand', header: 'Demand', align: 'right', cell: (t) => <span className="font-semibold text-gray-800">{t.demand}</span>, sortValue: (t) => t.demand },
    { key: 'competition', header: 'Competition', align: 'right', cell: (t) => <span className={t.competition > 60 ? 'text-rose-600' : 'text-gray-600'}>{t.competition}</span>, sortValue: (t) => t.competition },
    { key: 'trend', header: 'Trend', cell: (t) => <Sparkline data={t.trend} /> },
    { key: 'sport', header: 'Sport', cell: (t) => <Badge tone="violet">{t.keyword.split(' ').pop()}</Badge> },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Product Research" subtitle="Market research dashboards: source breakdown and trending demand." />
      <DemoNotice>Research data is local demo fixture — no market API is queried in this environment.</DemoNotice>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card title="Source breakdown">
          <Donut segments={researchSources} centerLabel="Signals" centerValue={String(researchSources.reduce((a, s) => a + s.value, 0))} />
        </Card>
        <Card
          className="lg:col-span-2"
          title="Trending demand"
          actions={
            <input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Filter keywords…" aria-label="Filter trending demand" className="h-9 px-3 rounded-lg border border-gray-200 text-[12px] w-full sm:w-56" />
          }
        >
          <DataTable rows={filtered} columns={columns} search={term} perPage={6} dense empty={{ title: 'No keywords match', hint: 'Try a different term.' }} />
        </Card>
      </div>

      <Card title="Market demand">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {marketDemand.map((m) => (
            <div key={m.id} className="rounded-xl border border-gray-100 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{m.market}</div>
              <div className="mt-1 text-[13px] font-semibold text-gray-900">{m.keyword}</div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                <span>{m.volume.toLocaleString('en-US')} searches</span>
                <Badge tone={m.competition === 'High' ? 'red' : m.competition === 'Medium' ? 'amber' : 'green'}>{m.competition}</Badge>
              </div>
              <div className="mt-1 text-[11px] text-gray-400">CPC ${m.cpc.toFixed(2)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Control Centre
// ---------------------------------------------------------------------------

export function AiControlView() {
  const [providers, setProviders] = useState<AIProvider[]>(DEFAULT_AI_PROVIDERS);
  const [loaded, setLoaded] = useState(false);
  const [features, setFeatures] = useState(aiFeatureSwitches);
  const [controlMode, setControlMode] = useState(spendControl.controlMode);
  const [freeFirst, setFreeFirst] = useState(spendControl.freeFirst);
  const [secondOpinion, setSecondOpinion] = useState(spendControl.secondOpinion);

  // Provider enablement is real client config — persisted exactly like the live console.
  useEffect(() => {
    setProviders(loadAIProviders());
    setLoaded(true);
  }, []);

  const settings = loadProviderSettings();
  const chain = resolveProviderChain(providers, settings);

  const updateProviders = (next: AIProvider[]) => {
    setProviders(next);
    saveAIProviders(next);
  };

  return (
    <div className="space-y-4">
      <PageHeader title="AI Control" subtitle="Owner governance: master switches, provider routing, feature switches and spend." />
      <DemoNotice>Provider keys are never entered or stored in the browser. Enablement and routing below persist locally; the keys themselves belong in Basco’s own server environment.</DemoNotice>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="Master switches">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
              <div>
                <div className="text-[13px] font-semibold text-gray-900">Free-first routing</div>
                <div className="text-[11px] text-gray-500">Prefer free models and fall back only when a task fails.</div>
              </div>
              <Toggle on={freeFirst} onChange={setFreeFirst} />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 p-3">
              <div>
                <div className="text-[13px] font-semibold text-gray-900">Second opinion on listings</div>
                <div className="text-[11px] text-gray-500">A second provider reviews pricing and risk before approval.</div>
              </div>
              <Toggle on={secondOpinion} onChange={setSecondOpinion} />
            </div>
            <Field label="Control mode">
              <select className={SELECT_CLS + ' w-full'} value={controlMode} onChange={(e) => setControlMode(e.target.value as typeof controlMode)}>
                <option value="Free-first">Free-first — cheapest possible</option>
                <option value="Balanced">Balanced — quality per task</option>
                <option value="Quality-first">Quality-first — best model wins</option>
              </select>
            </Field>
          </div>
        </Card>

        <Card title="Spend control">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Monthly budget</div>
          <div className="text-[22px] font-bold text-gray-900">${spendControl.spent.toFixed(2)} <span className="text-[13px] text-gray-400 font-medium">of ${spendControl.monthlyBudget}</span></div>
          <ProgressBar className="mt-2" value={(spendControl.spent / spendControl.monthlyBudget) * 100} tone="emerald" />
          <div className="mt-3 space-y-1.5 text-[12px]">
            <div className="flex justify-between"><span className="text-gray-500">Primary</span><span className="font-semibold text-gray-800">{chain.primary?.name ?? 'none'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Fallback</span><span className="font-semibold text-gray-800">{chain.fallback?.name ?? 'none'}</span></div>
          </div>
        </Card>
      </div>

      {/* SALMAN OS / HERMES — AI BACKEND */}
      <SalmanOsPanel />

      <Card title="AI providers" actions={<Badge tone={loaded ? 'green' : 'gray'}>{loaded ? 'config loaded' : 'loading'}</Badge>} bodyClass="p-0">
        <div className="divide-y divide-gray-50">
          {providers.map((p) => (
            <div key={p.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
              <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><Robot size={15} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-gray-900">{p.name}</div>
                <div className="text-[11px] text-gray-500 truncate">{p.models.length} models · default {p.defaultModel}</div>
              </div>
              {p.isDefault && <Badge tone="violet">default</Badge>}
              <Badge tone="gray">key: not linked</Badge>
              <Toggle on={p.enabled} onChange={(v) => updateProviders(providers.map((x) => (x.id === p.id ? { ...x, enabled: v } : x)))} label={p.enabled ? 'Enabled' : 'Off'} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Feature-level switches" bodyClass="p-0">
        <div className="divide-y divide-gray-50">
          {features.map((f) => (
            <div key={f.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium text-gray-900">{f.label}</div>
                <div className="text-[11px] text-gray-500">{f.description}</div>
              </div>
              <Badge tone="blue">{f.task}</Badge>
              <span className="text-[11px] text-gray-400">{f.provider}</span>
              <Toggle on={f.enabled} onChange={(v) => setFeatures(features.map((x) => (x.id === f.id ? { ...x, enabled: v } : x)))} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Task routing matrix" bodyClass="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  {['Task', 'Primary', 'Fallback', 'Model'].map((h) => <th key={h} scope="col" className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {aiTaskRouting.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-4 py-2 text-[12px] text-gray-800">{r.task}</td>
                    <td className="px-4 py-2 text-[12px] text-gray-600">{r.primary}</td>
                    <td className="px-4 py-2 text-[12px] text-gray-600">{r.fallback}</td>
                    <td className="px-4 py-2 text-[11px] font-mono text-gray-500">{r.model}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Owner attention queue">
          <ul className="space-y-2.5">
            {ownerAttention.map((a) => (
              <li key={a.id} className="flex items-start gap-2.5">
                <span className={`mt-0.5 ${a.severity === 'red' ? 'text-rose-500' : a.severity === 'amber' ? 'text-amber-500' : 'text-blue-500'}`}>
                  {a.severity === 'blue' ? <ShieldCheck size={15} /> : <WarningCircle size={15} weight="fill" />}
                </span>
                <div>
                  <div className="text-[12px] text-gray-800">{a.label}</div>
                  <div className="text-[11px] text-gray-500">{a.hint}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI Intelligence (Hermes) — research only
// ---------------------------------------------------------------------------

export function HermesIntelView() {
  const { rows, save: upsert, remove } = useAdminTable<IntelItem>('intel', intelItems);
  const [tab, setTab] = useState<IntelTab>('products');

  const shown = rows.filter((i) => i.tab === tab);

  return (
    <div className="space-y-4">
      <PageHeader title="AI Intelligence" subtitle="Research-only intelligence from Hermes / Salman OS. Nothing here can activate a listing." />
      <DemoNotice>Intake is local fixture data. Confidence levels, source links, risk flags and the draft-only rule are the real contract.</DemoNotice>

      <Card bodyClass="p-0">
        <div className="px-3">
          <Tabs
            tabs={INTEL_TABS.map((t) => ({ key: t.key, label: t.label, badge: rows.filter((i) => i.tab === t.key).length }))}
            active={tab}
            onChange={(k) => setTab(k as IntelTab)}
          />
        </div>
      </Card>

      {tab === 'catalog-qa' ? (
        <Card title="Catalog QA — deterministic live truth">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Active', value: catalogQaCounts.active },
              { label: 'Draft', value: catalogQaCounts.draft },
              { label: 'Blocked', value: catalogQaCounts.blocked },
              { label: 'Missing cost', value: catalogQaCounts.missingCost },
              { label: 'Missing shipping', value: catalogQaCounts.missingShipping },
              { label: 'Unknown source', value: catalogQaCounts.unknownSource },
              { label: 'Low margin', value: catalogQaCounts.lowMargin },
              { label: 'Needs review', value: catalogQaCounts.draft + catalogQaCounts.blocked },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-gray-100 p-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{s.label}</div>
                <div className="text-[20px] font-bold text-gray-900 mt-1">{s.value}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-gray-500">These counts come straight from the catalog's readiness model, not from a model's guess.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {shown.length === 0 && <EmptyState title="Nothing in this tab" hint="New intelligence arrives from the Hermes intake." icon={<Sparkle size={16} />} />}
          {shown.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[13px] font-semibold text-gray-900">{item.title}</span>
                    <Badge tone={CONFIDENCE_TONE[item.confidence]}>{item.confidence.replace(/_/g, ' ')}</Badge>
                    {item.state === 'draft-created' && <Badge tone="green">draft created</Badge>}
                    {item.state === 'dismissed' && <Badge tone="gray">dismissed</Badge>}
                  </div>
                  <p className="mt-1.5 text-[12px] text-gray-600 leading-relaxed">{item.summary}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                    <span>Opportunity: {item.opportunity}</span>
                    <span>Sources: {item.sources.join(', ')}</span>
                  </div>
                  {item.risks.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {item.risks.map((r) => <li key={r} className="text-[11px] text-amber-700 flex items-center gap-1.5"><WarningCircle size={12} weight="fill" />{r}</li>)}
                    </ul>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="secondary"
                    className="h-9 px-3"
                    disabled={item.confidence === 'insufficient_data' || item.state === 'draft-created'}
                    title={item.confidence === 'insufficient_data' ? 'Not enough evidence' : 'Create a review-required draft'}
                    onClick={() => upsert({ ...item, state: 'draft-created' })}
                  >
                    <Sparkle size={13} weight="bold" /> Create draft
                  </Button>
                  <Button variant="ghost" className="h-9 px-3" onClick={() => upsert({ ...item, state: 'dismissed' })}>Dismiss</Button>
                  <button type="button" onClick={() => remove(item.id)} className="p-1.5 rounded-lg text-gray-300 hover:text-rose-600 hover:bg-rose-50" aria-label={`Delete ${item.title}`} title="Delete"><Trash size={14} /></button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card title="Intake">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[12px] text-gray-600">Hermes / Salman OS intake is research-only. Suggestions arrive with confidence, sources and risks — never as live listings.</span>
          <Link href="/admin/hermes" className="text-[12px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1">Connector settings <ArrowUpRight size={12} weight="bold" /></Link>
        </div>
      </Card>

      <Card title="Currency" bodyClass="p-3">
        <Notice tone="blue">
          <CurrencyDollar size={13} className="inline -mt-0.5" /> Research costs count against the same monthly budget as generation, so a research-heavy week cannot silently overspend.
        </Notice>
      </Card>

      <SectionTitle>Confidence scale</SectionTitle>
      <div className="flex flex-wrap gap-2">
        {(['insufficient_data', 'possible', 'promising', 'strong'] as const).map((c) => (
          <span key={c} className="inline-flex items-center gap-2 rounded-xl border border-gray-100 px-3 py-2 text-[11px] text-gray-600">
            <Badge tone={CONFIDENCE_TONE[c]}>{c.replace(/_/g, ' ')}</Badge>
            {c === 'insufficient_data' ? 'cannot create a draft' : c === 'strong' ? 'safe to draft immediately' : 'draft with review'}
          </span>
        ))}
      </div>
    </div>
  );
}
