/**
 * Basco Sports – /api/salman-os — ONE consolidated route
 *
 * Single dispatch point for the Salman OS AI backend:
 *   GET  ?action=status                 → { status }
 *   GET  ?action=intelligence[&kind=..] → { items, kind }
 *   GET  ?action=jobs                   → { jobs }
 *   POST { action: "run_job", kind }    → dispatch an AI module job
 *   POST { action: "pause_job", module }  → pause a module (contract §5)
 *   POST { action: "resume_job", module } → resume a module (contract §5)
 *
 * Security: admin session required; fail-closed — when Salman OS env is
 * not configured, WAITING is returned and Salman OS is never called.
 * Credentials never leave the server.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifySessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth';
import { SALMAN_OS_MODULE_IDS } from '@/features/salman-os/types';
import type {
  SalmanOsStatus,
  SalmanOsLiveState,
  SalmanOsIntelligenceKind,
  SalmanOsJobKind,
} from '@/features/salman-os/types';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CONTRACT_VERSION = 1;
const PROJECT_SLUG = 'basco-sports' as const;

function env(name: string): string {
  return (process.env[name] || '').trim();
}

function configReady(): boolean {
  return Boolean(env('SALMAN_OS_BASE_URL') && env('SALMAN_OS_TOKEN'));
}

function costClass(raw: unknown): 'FREE' | 'PAID' | 'UNKNOWN' {
  const s = String(raw || '').toUpperCase();
  return s === 'FREE' || s === 'PAID' ? s : 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Salman OS status (local gate — never calls backend)
// ---------------------------------------------------------------------------

function salmanOsStatus(): SalmanOsStatus {
  const reason = !env('SALMAN_OS_BASE_URL')
    ? 'SALMAN OS BASE URL REQUIRED — SALMAN_OS_BASE_URL is not configured in the server environment.'
    : !env('SALMAN_OS_TOKEN')
      ? 'SALMAN OS AUTH PENDING — SALMAN_OS_TOKEN is not configured in the server environment (server-side only).'
      : 'CONFIGURED — awaiting live handshake with Salman OS.';
  return {
    state: configReady() ? 'OFFLINE' : 'WAITING',
    project: { project: PROJECT_SLUG, environment: 'PREVIEW', freeFirst: true },
    reason,
    live: null,
    contractVersion: CONTRACT_VERSION,
    checkedAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Server-to-server fetch (talks to Salman OS backend)
// ---------------------------------------------------------------------------

function endpoint(path: string, project = PROJECT_SLUG): string {
  const base = env('SALMAN_OS_BASE_URL').replace(/\/$/, '');
  return `${base}${path.replace(':project', project)}`;
}

async function sFetch(path: string, init?: RequestInit): Promise<{ ok: boolean; status: number; data: unknown }> {
  const token = env('SALMAN_OS_TOKEN');
  const res = await fetch(endpoint(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
    signal: AbortSignal.timeout(15_000),
  });
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

// ---------------------------------------------------------------------------
// Live status (calls Salman OS backend)
// ---------------------------------------------------------------------------

function unbox(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  return d && typeof d === 'object' && d.data && typeof d.data === 'object'
    ? (d.data as Record<string, unknown>)
    : null;
}

function mapLive(statusData: unknown, overviewData: unknown): SalmanOsLiveState {
  const status = unbox(statusData);
  const overview = unbox(overviewData);
  const envBlock = status?.environment && typeof status.environment === 'object' ? status.environment as Record<string, unknown> : null;
  const hermes = status?.hermes && typeof status.hermes === 'object' ? status.hermes as Record<string, unknown> : null;
  const router = envBlock?.router && typeof envBlock.router === 'object' ? envBlock.router as Record<string, unknown> : null;
  const overviewStatus = overview && typeof overview === 'object' ? overview as Record<string, unknown> : null;

  const live: SalmanOsLiveState = {
    bridge: hermes?.state as string | null,
    scheduler: envBlock?.scheduler as string | null,
    freeModel: router?.current_free_model as string | null,
    defaultModel: router?.default_model as string | null,
    currentTaskModel: router?.current_task_model as string | null,
    lastTaskModel: router?.last_task_model as string | null,
    costClass: costClass(router?.cost_class),
    fallbackUsed: Boolean(router?.fallback_used),
    fallbackReason: router?.fallback_reason as string | null,
    lastSync: overviewStatus?.lastSync as string | null,
    latestError: overviewStatus?.latestError as string | null,
    pausedModules: Array.isArray(envBlock?.pausedModules) ? (envBlock.pausedModules as string[]) : [],
  };
  return live;
}

async function getProjectStatus(): Promise<SalmanOsStatus> {
  if (!configReady()) return salmanOsStatus();
  try {
    const [statusRes, overviewRes] = await Promise.all([
      sFetch('/api/projects/:project/status'),
      sFetch('/api/ops/overview'),
    ]);
    if (!statusRes.ok) {
      return {
        ...salmanOsStatus(),
        state: 'OFFLINE',
        reason: `Salman OS returned HTTP ${statusRes.status}: ${JSON.stringify(statusRes.data).slice(0, 200)}`,
        checkedAt: new Date().toISOString(),
      };
    }
    const statusData = unbox(statusRes.data);
    const backendProject = statusData?.project as string | undefined;
    const backendContract = Number(statusData?.contract_version ?? 0);
    const environment = statusData?.environment && typeof statusData.environment === 'object'
      ? (statusData.environment as Record<string, unknown>).name as string | undefined
      : undefined;

    if (backendProject !== PROJECT_SLUG) {
      return {
        ...salmanOsStatus(),
        state: 'OFFLINE',
        reason: `PROJECT MISMATCH — Salman OS knows '${backendProject}', we sent '${PROJECT_SLUG}'.`,
        checkedAt: new Date().toISOString(),
      };
    }
    if (backendContract !== CONTRACT_VERSION) {
      return {
        ...salmanOsStatus(),
        state: 'OFFLINE',
        reason: `CONTRACT VERSION MISMATCH — backend has v${backendContract}, adapter expects v${CONTRACT_VERSION}.`,
        checkedAt: new Date().toISOString(),
      };
    }
    const displayEnv = (environment || '').toUpperCase() === 'PRODUCTION' ? 'PRODUCTION' : 'PREVIEW';
    return {
      state: 'CONNECTED',
      project: { project: PROJECT_SLUG, environment: displayEnv as 'PREVIEW' | 'PRODUCTION', freeFirst: true },
      reason: 'Live — Salman OS contract v1.0 handshake succeeded.',
      live: mapLive(statusRes.data, overviewRes.data),
      contractVersion: CONTRACT_VERSION,
      checkedAt: new Date().toISOString(),
    };
  } catch (e) {
    return {
      ...salmanOsStatus(),
      state: 'OFFLINE',
      reason: `Salman OS handshake failed: ${(e as Error).message}`,
      checkedAt: new Date().toISOString(),
    };
  }
}

// ---------------------------------------------------------------------------
// Intelligence (read-only)
// ---------------------------------------------------------------------------

async function getIntelligence(kind?: SalmanOsIntelligenceKind): Promise<unknown[]> {
  if (!configReady()) return [];
  const q = kind ? `?kind=${encodeURIComponent(kind)}` : '';
  const res = await sFetch(`/api/projects/:project/intelligence${q}`);
  if (!res.ok) return [];
  const data = unbox(res.data);
  return Array.isArray(data?.items) ? data.items : [];
}

// ---------------------------------------------------------------------------
// Jobs (read/write)
// ---------------------------------------------------------------------------

async function getJobs(): Promise<unknown[]> {
  if (!configReady()) return [];
  const res = await sFetch('/api/projects/:project/jobs');
  if (!res.ok) return [];
  const data = unbox(res.data);
  return Array.isArray(data?.jobs) ? data.jobs : [];
}

async function runJob(kind: SalmanOsJobKind): Promise<unknown> {
  if (!configReady()) return { ok: false, error: 'Salman OS not configured.' };
  const res = await sFetch('/api/projects/:project/jobs/run', {
    method: 'POST',
    body: JSON.stringify({ kind, taskType: kind }),
  });
  if (!res.ok) return { ok: false, error: `Salman OS run failed: HTTP ${res.status}` };
  return unbox(res.data) ?? res.data ?? { ok: true };
}

async function pauseJob(moduleId: string): Promise<unknown> {
  if (!configReady()) return { ok: false, error: 'Salman OS not configured.' };
  const res = await sFetch('/api/projects/:project/jobs/run', {
    method: 'POST',
    body: JSON.stringify({ action: 'pause_module', module: moduleId }),
  });
  if (!res.ok) return { ok: false, error: `Salman OS pause failed: HTTP ${res.status}` };
  return unbox(res.data) ?? res.data ?? { ok: true };
}

async function resumeJob(moduleId: string): Promise<unknown> {
  if (!configReady()) return { ok: false, error: 'Salman OS not configured.' };
  const res = await sFetch('/api/projects/:project/jobs/run', {
    method: 'POST',
    body: JSON.stringify({ action: 'resume_module', module: moduleId }),
  });
  if (!res.ok) return { ok: false, error: `Salman OS resume failed: HTTP ${res.status}` };
  return unbox(res.data) ?? res.data ?? { ok: true };
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

const INTELLIGENCE_KINDS = new Set(['PRODUCT', 'SEO', 'FREE_MARKETING', 'FREE_LISTINGS', 'MARKET', 'MARKETING', 'ADS', 'CATALOG_QA']);
const JOB_KINDS = new Set(Object.keys(SALMAN_OS_MODULE_IDS) as SalmanOsJobKind[]);
const MODULE_IDS = new Set(Object.values(SALMAN_OS_MODULE_IDS));

async function requireAdmin(): Promise<boolean> {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return false;
  const session = await verifySessionToken(token);
  return !!session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get('action') || 'status';

  if (action === 'status') {
    const status = await getProjectStatus();
    return NextResponse.json({ status });
  }
  if (action === 'intelligence') {
    const rawKind = (url.searchParams.get('kind') || '').toUpperCase();
    const kind = INTELLIGENCE_KINDS.has(rawKind) ? (rawKind as SalmanOsIntelligenceKind) : undefined;
    const items = await getIntelligence(kind);
    return NextResponse.json({ items, kind: kind ?? 'all' });
  }
  if (action === 'jobs') {
    const jobs = await getJobs();
    return NextResponse.json({ jobs });
  }
  return NextResponse.json({ error: "action must be 'status', 'intelligence' or 'jobs'" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const status = salmanOsStatus();
  if (status.state === 'WAITING') {
    return NextResponse.json({ error: status.reason }, { status: 503 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const action = String(body.action || '');

  if (action === 'run_job') {
    const kind = String(body.kind || '').toUpperCase() as SalmanOsJobKind;
    if (!JOB_KINDS.has(kind)) {
      return NextResponse.json({ error: `Unknown job kind: ${String(body.kind || '')}` }, { status: 400 });
    }
    const result = await runJob(kind);
    return NextResponse.json(result);
  }

  if (action === 'pause_job' || action === 'resume_job') {
    const moduleId = String(body.module || '');
    if (!MODULE_IDS.has(moduleId)) {
      return NextResponse.json({ error: `Unknown Salman OS module: ${String(body.module || '')}` }, { status: 400 });
    }
    const result = action === 'pause_job' ? await pauseJob(moduleId) : await resumeJob(moduleId);
    return NextResponse.json(result);
  }

  return NextResponse.json({ error: "action must be 'run_job', 'pause_job' or 'resume_job'" }, { status: 400 });
}
