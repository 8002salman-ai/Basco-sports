'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkle, ArrowsClockwise, ArrowUpRight } from '@phosphor-icons/react';
import { Badge, Button, Card, KeyValue, Notice, PageHeader, Spinner, StatCard, StatGrid } from '@/components/admin/ui';

interface HealthResult {
  ok: boolean;
  notConfigured?: boolean;
  status?: number;
  data?: unknown;
  error?: string | null;
}

export function HermesPanel() {
  const [health, setHealth] = useState<HealthResult | null>(null);
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/hermes/health', { cache: 'no-store' });
      const json = (await res.json()) as HealthResult;
      setHealth(json);
    } catch (e) {
      setHealth({ ok: false, error: (e as Error).message || 'Health check failed' });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const state = !health ? 'checking' : health.notConfigured ? 'unconfigured' : health.ok ? 'connected' : 'offline';

  return (
    <div className="space-y-4">
      <PageHeader
        title="Hermes Connector"
        subtitle="Live status of the research connector that feeds AI Intelligence."
        actions={
          <>
            <Link href="/admin/hermes-intel"><Button variant="secondary">Intelligence screens <ArrowUpRight size={13} weight="bold" /></Button></Link>
            <Button onClick={check} disabled={checking}><ArrowsClockwise size={14} weight="bold" /> {checking ? 'Checking…' : 'Re-check'}</Button>
          </>
        }
      />

      <StatGrid cols={3}>
        <StatCard label="Connector" value={state === 'connected' ? 'Connected' : state === 'unconfigured' ? 'Not configured' : state === 'offline' ? 'Offline' : 'Checking'} hint="GET /api/hermes/health" tone={state === 'connected' ? 'emerald' : state === 'offline' ? 'rose' : 'amber'} icon={<Sparkle size={15} weight="bold" />} />
        <StatCard label="Last response" value={health?.status ?? '—'} hint="upstream HTTP status" tone="blue" />
        <StatCard label="Mode" value="Research only" hint="can never activate a listing" tone="violet" />
      </StatGrid>

      <Card title="Connector status" actions={<Badge tone={state === 'connected' ? 'green' : state === 'unconfigured' ? 'amber' : 'red'}>{state}</Badge>}>
        {!health ? (
          <Spinner label="Checking…" />
        ) : health.notConfigured ? (
          <div className="space-y-3">
            <Notice tone="amber">
              <strong>Hermes not configured.</strong> Set <code className="bg-white/70 px-1 rounded">HERMES_ENABLED=true</code>,{' '}
              <code className="bg-white/70 px-1 rounded">HERMES_BASE_URL</code> and <code className="bg-white/70 px-1 rounded">HERMES_API_KEY</code> in Basco’s own deployment environment to connect.
            </Notice>
            <p className="text-[12px] text-gray-600 leading-relaxed">
              This storefront is a Hermes <em>consumer</em>: it proxies <code className="bg-gray-100 px-1 rounded">/health</code> and{' '}
              <code className="bg-gray-100 px-1 rounded">/v1/orders</code> through the connector. Expose the Hermes Agent API at a public HTTPS URL, then point{' '}
              <code className="bg-gray-100 px-1 rounded">HERMES_BASE_URL</code> at it. See README → Hermes + Salman OS.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <Notice tone={health.ok ? 'green' : 'red'}>
              {health.ok ? <>Connected — the Hermes API responded {health.status ?? 'OK'}.</> : <>Health check failed{health.status ? ` (HTTP ${health.status})` : ''}: {health.error || 'unknown error'}.</>}
            </Notice>
            {health.data ? (
              <pre className="rounded-xl bg-gray-900 text-gray-100 p-4 text-[11px] overflow-auto max-h-72">{JSON.stringify(health.data, null, 2)}</pre>
            ) : null}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card title="Proxy endpoints" bodyClass="p-4 space-y-2.5">
          {[
            { href: '/api/hermes/health', target: 'HERMES_BASE_URL/health' },
            { href: '/api/hermes/orders', target: 'HERMES_BASE_URL/v1/orders' },
          ].map((e) => (
            <a key={e.href} href={e.href} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[12px] text-gray-700 hover:text-gray-900">
              <ArrowUpRight size={13} className="text-gray-400" />
              <code className="font-mono">{e.href}</code>
              <span className="text-gray-400">→ {e.target}</span>
            </a>
          ))}
        </Card>

        <Card title="Contract" bodyClass="p-4">
          <KeyValue
            items={[
              { label: 'Direction', value: 'Storefront consumes; Hermes never pushes listings' },
              { label: 'Auth', value: 'Bearer key, server-side only' },
              { label: 'Suggestions', value: 'Draft-only, with confidence + sources' },
              { label: 'Budget', value: 'Counts against the AI monthly budget' },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}
