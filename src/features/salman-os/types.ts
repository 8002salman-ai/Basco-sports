/**
 * Basco Sports – Salman OS Adapter · Types
 *
 * Aligned to the Salman OS contract v1.0.
 * Salman OS is the PRIMARY AI intelligence backend; this module is the ONLY
 * place that talks to it.
 *
 * Runtime readiness does NOT depend on Salman OS being configured.
 * When SALMAN_OS_BASE_URL / SALMAN_OS_TOKEN are not set, the adapter
 * reports WAITING and the UI shows "AI BACKEND — WAITING FOR SALMAN OS".
 * Commerce never depends on this.
 */

/** Overall AI-backend connection state, as reported by the SERVER only. */
export type SalmanOsConnectionState =
  | 'CONNECTED'      // env configured + live handshake succeeded
  | 'OFFLINE'        // env configured but backend unreachable / project unregistered / contract mismatch
  | 'WAITING';       // server env (base URL / token) not yet in place

/** Stable project metadata Basco sends/exposes for Salman OS. */
export interface SalmanOsProjectInfo {
  project: 'basco-sports';
  environment: 'PREVIEW' | 'PRODUCTION';
  freeFirst: boolean;
}

/**
 * Live Salman OS routing state. Values are authoritative from Salman OS —
 * never fabricated locally. All fields optional because the backend may
 * expose a subset; absent = unknown and the UI shows "—".
 */
export interface SalmanOsLiveState {
  bridge?: string | null;
  scheduler?: string | null;
  freeModel?: string | null;
  defaultModel?: string | null;
  currentTaskModel?: string | null;
  lastTaskModel?: string | null;
  costClass?: 'FREE' | 'PAID' | 'UNKNOWN';
  fallbackUsed?: boolean;
  fallbackReason?: string | null;
  lastSync?: string | null;
  latestError?: string | null;
  pausedModules?: string[];
}

/** Safe status payload returned to the admin UI. */
export interface SalmanOsStatus {
  state: SalmanOsConnectionState;
  project: SalmanOsProjectInfo;
  reason: string;
  live: SalmanOsLiveState | null;
  contractVersion: number;
  checkedAt: string;
}

// ---------------------------------------------------------------------------
// Frozen module ids (Salman OS contract §4 + AI_MODULES registry)
// ---------------------------------------------------------------------------

export type SalmanOsJobKind =
  | 'PRODUCT_RESEARCH'
  | 'SEO'
  | 'FREE_MARKETING'
  | 'FREE_LISTINGS'
  | 'MARKET_RESEARCH'
  | 'MARKETING_IDEAS'
  | 'ADS_INTELLIGENCE'
  | 'CATALOG_QA';

export const SALMAN_OS_MODULE_IDS: Record<SalmanOsJobKind, string> = {
  PRODUCT_RESEARCH: 'product_research',
  SEO: 'seo_research',
  FREE_MARKETING: 'free_marketing',
  FREE_LISTINGS: 'free_listing_opportunities',
  MARKET_RESEARCH: 'market_research',
  MARKETING_IDEAS: 'marketing_research',
  ADS_INTELLIGENCE: 'ads_intelligence',
  CATALOG_QA: 'catalog_quality_review',
};

/** Frozen module id → internal kind (reverse lookup). */
export const SALMAN_OS_KIND_BY_MODULE: Record<string, SalmanOsJobKind> = Object.fromEntries(
  Object.entries(SALMAN_OS_MODULE_IDS).map(([kind, moduleId]) => [moduleId, kind as SalmanOsJobKind]),
);

// ---------------------------------------------------------------------------
// Intelligence
// ---------------------------------------------------------------------------

export type SalmanOsIntelligenceKind =
  | 'PRODUCT'
  | 'SEO'
  | 'FREE_MARKETING'
  | 'FREE_LISTINGS'
  | 'MARKET'
  | 'MARKETING'
  | 'ADS'
  | 'CATALOG_QA';

export interface SalmanOsIntelligenceItem {
  id: string;
  kind: SalmanOsIntelligenceKind;
  model?: string | null;
  provider?: string | null;
  costClass?: 'FREE' | 'PAID' | 'UNKNOWN';
  fallbackUsed?: boolean;
  evidence: string[];
  inference: string;
  unknowns: string[];
  confidence?: number | null;
  risk?: string | null;
  sources: string[];
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export type SalmanOsJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PAUSED';

export interface SalmanOsJob {
  id: string;
  kind: SalmanOsJobKind;
  status: SalmanOsJobStatus;
  model?: string | null;
  costClass?: 'FREE' | 'PAID' | 'UNKNOWN';
  fallbackUsed?: boolean;
  createdAt: string;
  completedAt?: string | null;
  error?: string | null;
}

export interface SalmanOsJobRunResult {
  ok: boolean;
  job: SalmanOsJob | null;
  error?: string | null;
  paused?: boolean;
  reason?: string | null;
}

export interface SalmanOsJobToggleResult {
  ok: boolean;
  job: SalmanOsJob | null;
  error?: string | null;
}
