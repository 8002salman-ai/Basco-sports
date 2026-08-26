'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles, RefreshCw, ExternalLink } from 'lucide-react';

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

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] leading-none">Hermes Intel</h1>
          <p className="mt-1.5 text-[13px] text-obsidian/60">
            Research &amp; intelligence connector – live status from <code className="bg-stone-100 px-1 rounded">/api/hermes/health</code>
          </p>
        </div>
        <button
          onClick={check}
          disabled={checking}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full border text-[13px] disabled:opacity-50"
        >
          <RefreshCw size={14} className={checking ? 'animate-spin' : ''} /> {checking ? 'Checking…' : 'Re-check'}
        </button>
      </div>

      <div className="mt-6 bg-white rounded-[16px] border p-6">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-lime-400" />
          <span className="text-[13px] font-semibold">Connector status</span>
        </div>

        {!health ? (
          <div className="mt-4 text-[13px] text-obsidian/50">Checking…</div>
        ) : health.notConfigured ? (
          <div className="mt-4">
            <div className="rounded-[12px] bg-amber-50 border border-amber-200 p-4 text-[13px] text-amber-800">
              <span className="font-semibold">Hermes not configured.</span> Set{' '}
              <code className="bg-white/70 px-1 rounded">HERMES_ENABLED=true</code>,{' '}
              <code className="bg-white/70 px-1 rounded">HERMES_BASE_URL</code> and{' '}
              <code className="bg-white/70 px-1 rounded">HERMES_API_KEY</code> in the deployment env (Vercel / Cloudflare
              Pages dashboard) to connect.
            </div>
            <div className="mt-3 text-[13px] text-obsidian/60 leading-relaxed">
              <p>
                <strong>How to wire (see README → Hermes + Salman OS):</strong> expose the Hermes Agent HTTP API at a
                public HTTPS URL (e.g. cloudflared tunnel from the Salman OS bridge host), then point{' '}
                <code className="bg-stone-100 px-1 rounded">HERMES_BASE_URL</code> at it. This storefront is a Hermes{' '}
                <em>consumer</em> — it proxies <code className="bg-stone-100 px-1 rounded">/health</code> and{' '}
                <code className="bg-stone-100 px-1 rounded">/v1/orders</code> through the connector.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <div className="rounded-[12px] bg-emerald-50 border border-emerald-200 p-4 text-[13px] text-emerald-800">
              <span className="font-semibold">Connected</span> – Hermes API responded {health.status ?? 'OK'}.
            </div>
            {health.data ? (
              <pre className="mt-3 rounded-[12px] bg-obsidian text-stone-100 p-4 text-[12px] overflow-auto max-h-72">
                {JSON.stringify(health.data, null, 2)}
              </pre>
            ) : null}
          </div>
        )}
      </div>

      <div className="mt-4 bg-white rounded-[16px] border p-6">
        <div className="text-[13px] font-semibold">Available proxy endpoints</div>
        <div className="mt-3 space-y-2 text-[13px]">
          <a href="/api/hermes/health" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-obsidian/70 hover:text-obsidian">
            <ExternalLink size={13} /> /api/hermes/health <span className="text-obsidian/40">→ {`HERMES_BASE_URL`}/health</span>
          </a>
          <a href="/api/hermes/orders" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-obsidian/70 hover:text-obsidian">
            <ExternalLink size={13} /> /api/hermes/orders <span className="text-obsidian/40">→ {`HERMES_BASE_URL`}/v1/orders</span>
          </a>
        </div>
      </div>
    </div>
  );
}
