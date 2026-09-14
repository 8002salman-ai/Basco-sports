'use client';

import { useMemo, useState } from 'react';
import {
  Package, CreditCard, Truck, BookBookmark, CheckCircle, WarningCircle, ShieldCheck, MagnifyingGlass,
} from '@phosphor-icons/react';
import {
  Badge, Button, Card, DemoNotice, EmptyState, Field, INPUT_CLS, KeyValue, Notice,
  PageHeader, ProgressBar, SELECT_CLS, SectionTitle, StatCard, StatGrid, Tabs, Toggle, Toolbar,
} from '@/components/admin/ui';
import { DataTable, type Column } from '@/components/admin/table';
import {
  CJ_STATUS, LISTING_PLAYBOOK, PAYMENT_PROVIDERS, SHIPPING_ZONES, catalogSeed, formatMoney,
} from '@/features/admin/demo/data';
import type { AdminProduct } from '@/lib/admin/types';
import { useAdminTable } from '@/hooks/use-admin-table';

export function CjSetupView() {
  const { rows: products } = useAdminTable<AdminProduct>('products', catalogSeed);
  const [key, setKey] = useState('');
  const [tested, setTested] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(
    () => (query.trim() ? products.filter((p) => p.name.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 5) : []),
    [products, query]
  );

  return (
    <div className="space-y-4">
      <PageHeader title="CJ Supplier" subtitle="Supplier key management, what CJ enables, and a test search." />
      <DemoNotice>Supplier keys belong in Basco’s own server environment — the field below only demonstrates the flow.</DemoNotice>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" title="Connection" actions={<Badge tone={CJ_STATUS.connected ? 'green' : 'gray'}>{CJ_STATUS.connected ? 'connected' : 'not linked'}</Badge>}>
          <KeyValue
            items={[
              { label: 'Account', value: CJ_STATUS.account },
              { label: 'Stored key', value: CJ_STATUS.maskedKey },
              { label: 'Products linked', value: `${products.filter((p) => p.sourceType === 'CJ').length} of ${products.length}` },
              { label: 'Last sync', value: `${Math.round((Date.now() - new Date(CJ_STATUS.lastSync).getTime()) / 86_400_000)} days ago` },
            ]}
          />
          <div className="mt-4 grid sm:grid-cols-[1fr_auto] gap-2 items-end">
            <Field label="API key" hint="Never stored in the browser in a live environment — sent straight to the server.">
              <input type="password" className={INPUT_CLS} value={key} onChange={(e) => setKey(e.target.value)} placeholder="••••••••••••" />
            </Field>
            <Button variant="secondary" onClick={() => setTested(true)} disabled={!key.trim()}>Save & test</Button>
          </div>
          {tested && <div className="mt-3"><Notice tone="amber">Nothing was saved: this clone has no server route for supplier keys. The validation flow is what you are looking at.</Notice></div>}
        </Card>

        <Card title="What CJ enables">
          <ul className="space-y-2 text-[12px] text-gray-700">
            {['Supplier price and stock sync', 'Shipping cost evidence for the readiness gate', 'Product Scout sourcing runs', 'Batch listing imports'].map((t) => (
              <li key={t} className="flex items-start gap-2"><CheckCircle size={14} weight="fill" className="text-emerald-500 mt-px shrink-0" />{t}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Test search">
        <Toolbar className="mb-3">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search the catalog the way a supplier search would…" aria-label="Test search" className="h-10 px-3 rounded-lg border border-gray-200 text-[13px] w-full sm:w-80" />
        </Toolbar>
        {results.length === 0 ? (
          <EmptyState title={query ? 'No matches' : 'Search to preview results'} hint="Results here are matched against your own catalog; a live supplier search returns candidates instead." icon={<MagnifyingGlass size={16} />} />
        ) : (
          <div className="divide-y divide-gray-50">
            {results.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center gap-3">
                <Package size={15} className="text-gray-300 shrink-0" />
                <span className="text-[12px] text-gray-800 flex-1 truncate">{p.name}</span>
                <span className="text-[11px] text-gray-500">{p.cost === null ? 'cost unknown' : `${formatMoney(p.cost)} cost`}</span>
                <Badge tone="blue">{p.sourceType}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export function PaymentsView() {
  const [providers, setProviders] = useState(PAYMENT_PROVIDERS);
  const [zeroOrders, setZeroOrders] = useState(true);

  return (
    <div className="space-y-4">
      <PageHeader title="Payments" subtitle="Multi-provider overview with masked keys and health, plus $0 giveaway order handling." />
      <DemoNotice>No payment keys are stored in this environment. Basco runs demo-mode checkout until its own keys are added.</DemoNotice>

      <StatGrid cols={4}>
        <StatCard label="Providers enabled" value={providers.filter((p) => p.enabled).length} hint={`of ${providers.length} known`} icon={<CreditCard size={15} weight="bold" />} tone="blue" />
        <StatCard label="Live mode" value="off" hint="demo charges only" icon={<WarningCircle size={15} weight="bold" />} tone="amber" />
        <StatCard label="$0 orders" value={zeroOrders ? 'allowed' : 'blocked'} hint="gift-drop claims" icon={<CheckCircle size={15} weight="bold" />} tone="emerald" />
        <StatCard label="Secrets in browser" value={0} hint="always zero" icon={<ShieldCheck size={15} weight="bold" />} tone="violet" />
      </StatGrid>

      <Card title="Providers" bodyClass="p-0">
        <div className="divide-y divide-gray-50">
          {providers.map((p) => (
            <div key={p.id} className="px-4 py-3 flex items-center gap-3 flex-wrap">
              <span className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400"><CreditCard size={15} /></span>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-semibold text-gray-900">{p.name}</div>
                <div className="text-[11px] text-gray-500">{p.note} · mode {p.mode}</div>
              </div>
              <span className="font-mono text-[11px] text-gray-400">{p.maskedKey}</span>
              <Toggle on={p.enabled} onChange={(v) => setProviders(providers.map((x) => (x.id === p.id ? { ...x, enabled: v } : x)))} label={p.enabled ? 'Enabled' : 'Off'} />
            </div>
          ))}
        </div>
      </Card>

      <Card title="Free-gift orders">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[13px] font-medium text-gray-900">Allow $0 orders</div>
            <div className="text-[11px] text-gray-500">Gift-drop claims bypass the payment step entirely — no card, no charge, still a real order row.</div>
          </div>
          <Toggle on={zeroOrders} onChange={setZeroOrders} label={zeroOrders ? 'Allowed' : 'Blocked'} />
        </div>
      </Card>

      <Card title="Webhook health" bodyClass="p-0">
        <div className="divide-y divide-gray-50">
          {[
            { id: 'wh-1', label: 'Payments webhook', state: 'not configured' },
            { id: 'wh-2', label: 'Refund notifications', state: 'not configured' },
            { id: 'wh-3', label: 'Gift-drop claim ledger', state: 'local demo' },
          ].map((w) => (
            <div key={w.id} className="px-4 py-2.5 flex items-center gap-3">
              <span className="text-[12px] text-gray-800 flex-1">{w.label}</span>
              <Badge tone={w.state === 'local demo' ? 'blue' : 'gray'}>{w.state}</Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export function ShippingView() {
  const [zones, setZones] = useState(SHIPPING_ZONES);
  const [calc, setCalc] = useState({ zone: SHIPPING_ZONES[0].id, weight: 1.2, subtotal: 120 });

  const zone = zones.find((z) => z.id === calc.zone) ?? zones[0];
  const rate = calc.subtotal >= zone.freeOver ? 0 : zone.rate + Math.max(0, Math.ceil(calc.weight - 1)) * 2.5;

  const columns: Column<(typeof SHIPPING_ZONES)[number]>[] = [
    { key: 'zone', header: 'Zone', cell: (z) => <span className="font-medium text-gray-900">{z.zone}</span>, sortValue: (z) => z.zone },
    { key: 'carrier', header: 'Carrier', cell: (z) => <span className="text-gray-600">{z.carrier}</span>, sortValue: (z) => z.carrier },
    { key: 'rate', header: 'Base rate', align: 'right', cell: (z) => <span className="font-semibold">{formatMoney(z.rate)}</span>, sortValue: (z) => z.rate },
    { key: 'free', header: 'Free over', align: 'right', cell: (z) => <span className="text-gray-600">{formatMoney(z.freeOver)}</span>, sortValue: (z) => z.freeOver },
    { key: 'eta', header: 'ETA', cell: (z) => <span className="text-gray-600">{z.eta}</span>, sortValue: (z) => z.eta },
  ];

  return (
    <div className="space-y-4">
      <PageHeader title="Shipping" subtitle="Zone rates, free-shipping thresholds, sender identity and who pays duties." />
      <DemoNotice>Live carrier rates need Basco’s own shipping account. The zone table and the rate calculator below work locally.</DemoNotice>

      <StatGrid cols={4}>
        <StatCard label="Zones" value={zones.length} hint="worldwide coverage" icon={<Truck size={15} weight="bold" />} tone="blue" />
        <StatCard label="Cheapest base" value={formatMoney(Math.min(...zones.map((z) => z.rate)))} hint="UK tracked" icon={<CheckCircle size={15} weight="bold" />} tone="emerald" />
        <StatCard label="Slowest ETA" value="9 days" hint="rest of world" icon={<WarningCircle size={15} weight="bold" />} tone="amber" />
        <StatCard label="Duties payer" value="Customer" hint="shown before payment" icon={<ShieldCheck size={15} weight="bold" />} tone="violet" />
      </StatGrid>

      <Card title="Zones" bodyClass="p-4">
        <DataTable rows={zones} columns={columns} perPage={6} empty={{ title: 'No zones configured' }} />
        <div className="mt-3">
          <Button variant="secondary" onClick={() => setZones([...zones, { id: `ship-${zones.length + 1}`, zone: 'New zone', carrier: 'Carrier', rate: 0, freeOver: 0, eta: '—' }])}>
            Add zone
          </Button>
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Rate calculator">
          <div className="grid sm:grid-cols-3 gap-3">
            <Field label="Zone">
              <select className={SELECT_CLS + ' w-full'} value={calc.zone} onChange={(e) => setCalc({ ...calc, zone: e.target.value })}>
                {zones.map((z) => <option key={z.id} value={z.id}>{z.zone}</option>)}
              </select>
            </Field>
            <Field label="Weight (kg)"><input type="number" step="0.1" className={INPUT_CLS} value={calc.weight} onChange={(e) => setCalc({ ...calc, weight: Number(e.target.value) })} /></Field>
            <Field label="Cart subtotal"><input type="number" className={INPUT_CLS} value={calc.subtotal} onChange={(e) => setCalc({ ...calc, subtotal: Number(e.target.value) })} /></Field>
          </div>
          <div className="mt-4 rounded-xl bg-gray-50 p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Estimated shipping</div>
            <div className="text-[22px] font-bold text-gray-900">{rate === 0 ? 'Free' : formatMoney(rate)}</div>
            <div className="text-[11px] text-gray-500">
              {zone.carrier} · {zone.eta}{calc.subtotal >= zone.freeOver ? ` · free over ${formatMoney(zone.freeOver)}` : ` · free over ${formatMoney(zone.freeOver)} not reached`}
            </div>
          </div>
        </Card>

        <Card title="Sender & billing">
          <KeyValue
            items={[
              { label: 'Sender', value: 'Basco Sports, Returns Dept.' },
              { label: 'Country', value: 'United Kingdom' },
              { label: 'Who pays duties', value: 'Customer, shown before payment' },
              { label: 'Returns window', value: '30 days' },
            ]}
          />
          <div className="mt-3"><Notice tone="blue">Duties and taxes are shown before payment in every market — no surprise charges at the door.</Notice></div>
        </Card>
      </div>
    </div>
  );
}

export function ListingPlaybookView() {
  const { rows, save: upsert } = useAdminTable('playbook', LISTING_PLAYBOOK);
  const { rows: products } = useAdminTable<AdminProduct>('products', catalogSeed);
  const [tab, setTab] = useState<'rules' | 'automation'>('rules');

  const enforced = rows.filter((r) => r.enforced).length;
  const ready = products.filter((p) => p.readiness === 'COMMERCE_READY').length;
  const coverage = products.length ? Math.round((ready / products.length) * 100) : 0;

  return (
    <div className="space-y-4">
      <PageHeader title="Listing Playbook" subtitle="Rules applied to every import so supplier text never reaches customers unreviewed." />
      <DemoNotice>Rules apply locally to the AI Import and Listing Task screens in this clone.</DemoNotice>

      <StatGrid cols={3}>
        <StatCard label="Rules" value={rows.length} hint="global listing policy" icon={<BookBookmark size={15} weight="bold" />} tone="blue" />
        <StatCard label="Enforced" value={enforced} hint={`${rows.length - enforced} optional`} icon={<CheckCircle size={15} weight="bold" />} tone="emerald" />
        <StatCard label="Applies to" value="All sources" hint="imports, scout and batch tasks" icon={<ShieldCheck size={15} weight="bold" />} tone="violet" />
      </StatGrid>

      <Card bodyClass="p-0">
        <div className="px-3">
          <Tabs
            tabs={[
              { key: 'rules', label: 'Global listing rules', badge: rows.length },
              { key: 'automation', label: 'Import automation' },
            ]}
            active={tab}
            onChange={(k) => setTab(k as 'rules' | 'automation')}
          />
        </div>
        <div className="p-4">
          {tab === 'rules' ? (
            <div className="space-y-2.5">
              {rows.map((r) => (
                <div key={r.id} className="flex items-center gap-3 flex-wrap rounded-xl border border-gray-100 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-gray-900">{r.rule}</div>
                    <div className="text-[11px] text-gray-500">{r.scope}</div>
                  </div>
                  <Badge tone={r.enforced ? 'green' : 'gray'}>{r.enforced ? 'enforced' : 'advisory'}</Badge>
                  <Toggle on={r.enforced} onChange={(v) => upsert({ ...r, enforced: v })} />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <SectionTitle>Import automation preset</SectionTitle>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Auto-publish when ready">
                  <select className={SELECT_CLS + ' w-full'} defaultValue="off">
                    <option value="off">Off — always review first</option>
                    <option value="safe">On for rows with full evidence</option>
                  </select>
                </Field>
                <Field label="Minimum margin to auto-publish">
                  <input type="number" className={INPUT_CLS} defaultValue={45} />
                </Field>
              </div>
              <div>
                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                  <span>Evidence coverage across the catalog</span>
                  <span className="font-semibold text-gray-700">{coverage}%</span>
                </div>
                <ProgressBar value={coverage} tone="emerald" />
              </div>
              <Notice tone="blue">AI can draft listings, but only this playbook and a human decision can make a row customer-visible.</Notice>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
