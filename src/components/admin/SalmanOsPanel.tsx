'use client';

/**
 * Basco Sports – Salman OS / Hermes Panel
 *
 * One compact panel showing the Salman OS / AI-backend status and the
 * AI owner module cards. Salman OS is authoritative for its model routing —
 * this UI NEVER fabricates model state locally; it displays exactly what the
 * server proxy reports (CONNECTED / OFFLINE / WAITING).
 *
 * WAITING = "AI BACKEND — WAITING FOR SALMAN OS" (server env not configured
 * yet). A routine job paused by the router (FREE model unavailable) is shown
 * exactly as "PAUSED — FREE MODEL UNAVAILABLE" — never treated as a commerce
 * failure. Commerce never depends on this panel.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Robot, Warning, CheckCircle, XCircle, ArrowClockwise, Play, Hourglass, Pause, PlayCircle,
} from '@phosphor-icons/react';
import { Badge, Button, Card, Notice, PageHeader } from '@/components/admin/ui';
import {
  fetchSalmanOsStatus,
  fetchSalmanOsJobs,
  runSalmanOsJob,
  pauseSalmanOsJob,
  resumeSalmanOsJob,
} from '@/features/salman-os/browserClient';
import { SALMAN_OS_MODULE_IDS } from '@/features/salman-os/types';
import type { SalmanOsStatus, SalmanOsJob, SalmanOsJobKind } from '@/features/salman-os/types';

// ---------------------------------------------------------------------------
// Module cards
// ---------------------------------------------------------------------------

const MODULES: { kind: SalmanOsJobKind; label: string; hint: string }[] = [
  { kind: 'PRODUCT_RESEARCH', label: 'Product Research', hint: 'Find and rank product opportunities' },
  { kind: 'SEO', label: 'SEO', hint: 'Search-optimize titles, descriptions and pages' },
  { kind: 'FREE_MARKETING', label: 'Free Marketing', hint: 'Free channels and content angles' },
  { kind: 'FREE_LISTINGS', label: 'Free Listings', hint: 'Directories and free product listings' },
  { kind: 'MARKET_RESEARCH', label: 'Market Research', hint: 'Market evidence and positioning' },
  { kind: 'MARKETING_IDEAS', label: 'Marketing Ideas', hint: 'Campaign and content concepts' },
  { kind: 'ADS_INTELLIGENCE', label: 'Ads Intelligence', hint: 'Paid-channel readiness (deferred)' },
  { kind: 'CATALOG_QA', label: 'Catalog QA', hint: 'Catalog quality and commerce-truth checks' },
];

const JOB_STATUS_STYLE: Record<string, string> = {
  QUEUED: 'bg-blue-100 text-blue-700',
  RUNNING: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  FAILED: 'bg-red-100 text-red-600',
  PAUSED: 'bg-gray-100 text-gray-600',
};

function stateBadge(s: SalmanOsStatus) {
  if (s.state === 'CONNECTED') {
    return <Badge tone="green"><CheckCircle size={13} weight="bold" /> CONNECTED</Badge>;
  }
  if (s.state === 'OFFLINE') {
    return <Badge tone="red"><XCircle size={13} weight="bold" /> OFFLINE</Badge>;
  }
  return <Badge tone="amber"><Hourglass size={13} weight="bold" /> WAITING</Badge>;
}

// ---------------------------------------------------------------------------
// Panel
// ---------------------------------------------------------------------------

export function SalmanOsPanel() {
  const [status, setStatus] = useState<SalmanOsStatus | null>(null);
  const [jobs, setJobs] = useState<SalmanOsJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<{ kind?: SalmanOsJobKind; toggle?: string } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [s, j] = await Promise.all([fetchSalmanOsStatus(), fetchSalmanOsJobs()]);
    setStatus(s);
    setJobs(j);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const run = async (kind: SalmanOsJobKind) => {
    setBusy({ kind });
    const r = await runSalmanOsJob(kind);
    setBusy(null);
    if (r.ok) {
      // toast omitted — UI shows status badge
    } else if (r.paused) {
      // PAUSED — FREE MODEL UNAVAILABLE — not a failure
    }
    await refresh();
  };

  const toggle = async (kind: SalmanOsJobKind, action: 'pause' | 'resume') => {
    const moduleId = SALMAN_OS_MODULE_IDS[kind];
    setBusy({ kind, toggle: action });
    const r = action === 'pause' ? await pauseSalmanOsJob(moduleId) : await resumeSalmanOsJob(moduleId);
    setBusy(null);
    await refresh();
    if (!r.ok) {
      // error handled by refresh → state update
    }
  };

  const waiting = !status || status.state === 'WAITING';
  const connected = status?.state === 'CONNECTED';
  const pausedModules = new Set(status?.live?.pausedModules ?? []);

  const moduleState = (kind: SalmanOsJobKind): { status?: string; paused: boolean } => {
    const moduleId = SALMAN_OS_MODULE_IDS[kind];
    const job = jobs.find((j) => j.kind === kind);
    const paused = pausedModules.has(moduleId) || job?.status === 'PAUSED';
    return { status: job?.status, paused };
  };

  return (
    <div className="space-y-4">
      {/* Status card */}
      <div className={`rounded-xl border p-4 ${waiting ? 'bg-amber-50/60 border-amber-200' : status?.state === 'CONNECTED' ? 'bg-green-50/60 border-green-200' : 'bg-red-50/60 border-red-200'}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Robot size={18} className={waiting ? 'text-amber-600 mt-0.5' : 'text-blue-600 mt-0.5'} />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-sm text-gray-900">SALMAN OS / HERMES</h2>
                {status ? stateBadge(status) : <span className="text-[10px] text-gray-400">loading…</span>}
              </div>
              <p className="text-[11px] text-gray-600 mt-1.5">
                Project: <b>basco-sports</b> · Environment: <b>{status?.project.environment ?? 'PREVIEW'}</b> · Free-first: <b>{status?.project.freeFirst ? 'ON' : 'OFF'}</b> · Contract: <b>v{status?.contractVersion ?? '1.0'}</b>
              </p>
              <p className="text-[11px] text-gray-500 mt-1">{status?.reason ?? 'Checking…'}</p>

              {status?.live && (
                <div className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[11px] text-gray-700">
                  {status.live.bridge !== undefined && <p>Bridge: <b>{status.live.bridge || '—'}</b></p>}
                  {status.live.scheduler !== undefined && <p>Scheduler: <b>{status.live.scheduler || '—'}</b></p>}
                  {status.live.freeModel !== undefined && <p>Free model: <b>{status.live.freeModel || '—'}</b></p>}
                  {status.live.defaultModel !== undefined && <p>Default model: <b>{status.live.defaultModel || '—'}</b></p>}
                  {status.live.currentTaskModel !== undefined && <p>Current task model: <b>{status.live.currentTaskModel || '—'}</b></p>}
                  {status.live.lastTaskModel !== undefined && <p>Last task model: <b>{status.live.lastTaskModel || '—'}</b></p>}
                  {status.live.costClass !== undefined && <p>Cost class: <b>{status.live.costClass}</b></p>}
                  {status.live.fallbackUsed !== undefined && <p>Fallback used: <b>{status.live.fallbackUsed ? 'YES' : 'NO'}</b></p>}
                  {status.live.fallbackReason !== undefined && status.live.fallbackReason && <p className="sm:col-span-2">Fallback reason: <b>{status.live.fallbackReason}</b></p>}
                  {status.live.lastSync !== undefined && <p>Last sync: <b>{status.live.lastSync || '—'}</b></p>}
                  {status.live.latestError !== undefined && <p className="text-red-600">Latest error: <b>{status.live.latestError || '—'}</b></p>}
                </div>
              )}
            </div>
          </div>
          <button onClick={() => void refresh()} disabled={loading} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50">
            <ArrowClockwise size={12} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
        {waiting && (
          <Notice tone="amber">
            <Warning size={12} weight="fill" className="inline -mt-0.5" /> AI BACKEND — WAITING FOR SALMAN OS. Commerce continues normally; this is an optional intelligence enhancement.
          </Notice>
        )}
      </div>

      {/* AI owner modules */}
      <Card title="AI Owner Modules">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {MODULES.map((m) => {
            const st = moduleState(m.kind);
            const busyHere = busy?.kind === m.kind;
            return (
              <div key={m.kind} className="bg-white rounded-xl border border-gray-100 p-3.5 flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-bold text-[12px] text-gray-900">{m.label}</p>
                  {st.status && <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${JOB_STATUS_STYLE[st.status] || 'bg-gray-100 text-gray-600'}`}>{st.status}</span>}
                </div>
                <p className="text-[10px] text-gray-500 leading-snug flex-1">{m.hint}</p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => void run(m.kind)}
                    disabled={waiting || busyHere}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={waiting ? 'AI backend not ready yet' : `Run ${m.label}`}
                  >
                    <Play size={10} /> {busyHere && !busy?.toggle ? 'Queuing…' : 'RUN NOW'}
                  </button>
                  {connected && (
                    st.paused ? (
                      <button
                        onClick={() => void toggle(m.kind, 'resume')}
                        disabled={busyHere}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 disabled:opacity-40"
                        title="Resume dispatch"
                      >
                        <PlayCircle size={10} /> {busyHere && busy?.toggle === 'resume' ? '…' : 'RESUME'}
                      </button>
                    ) : (
                      <button
                        onClick={() => void toggle(m.kind, 'pause')}
                        disabled={busyHere}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40"
                        title="Pause future dispatch (running tasks and the bridge are untouched)"
                      >
                        <Pause size={10} /> {busyHere && busy?.toggle === 'pause' ? '…' : 'PAUSE'}
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] text-gray-400">
          PAUSE/RESUME gate future dispatch only — they never stop the bridge or running tasks (Salman OS contract §9). If a routine job reports
          {' '}<b>PAUSED — FREE MODEL UNAVAILABLE</b>, no paid credits were spent; that is policy behavior, not a failure. Model/cost-class values are authoritative from Salman OS — never fabricated locally.
        </p>
      </Card>
    </div>
  );
}
