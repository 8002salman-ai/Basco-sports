/**
 * Basco Sports – Supabase REST (PostgREST) client – server-only.
 *
 * ONE core for every server-side Supabase REST call: service headers,
 * JSON envelope, error slicing and timeout live here instead of being
 * re-implemented per route.
 *
 * - `serviceRest()` – env-bound (NEXT_PUBLIC_SUPABASE_URL + service-role key);
 *   use for internal server code (review requests, order lookups, …).
 * - `createRestClient(url, key)` – explicit credentials; the admin
 *   `SupabaseAdapter` delegates its HTTP here too.
 *
 * Envelope: { ok, status, data, error? } — `ok:false` never throws;
 * callers decide. Status 0 = transport failure (network/timeout/unconfigured).
 */

export interface RestResult<T> {
  ok: boolean;
  status: number; // HTTP status, or 0 when not configured / transport failed
  data: T | null;
  error?: string;
}

const REST_TIMEOUT_MS = 10_000;

function trimTrailingSlash(value: string | undefined): string | undefined {
  return value?.replace(/\/$/, '') || undefined;
}

function sliceError(text: string, status: number): string {
  return text.slice(0, 300) || `HTTP ${status}`;
}

function parseJson(text: string): unknown | null {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** True when rows are array-shaped, so `length` checks are safe everywhere. */
export function isRows<T>(data: unknown): data is T[] {
  return Array.isArray(data);
}

export interface RestClient {
  /** Path/query after `/rest/v1/`, e.g. `orders?id=eq.1&select=*`. */
  request<T = unknown>(path: string, init?: RequestInit): Promise<RestResult<T>>;
}

export function createRestClient(baseUrl: string, apiKey: string): RestClient {
  const url = trimTrailingSlash(baseUrl);
  return {
    async request<T>(path: string, init?: RequestInit): Promise<RestResult<T>> {
      try {
        const res = await fetch(`${url}/rest/v1/${path}`, {
          ...init,
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...((init?.headers as Record<string, string>) || {}),
          },
          signal: AbortSignal.timeout(REST_TIMEOUT_MS),
        });
        const text = await res.text().catch(() => '');
        const data = parseJson(text) as T | null;
        if (!res.ok) return { ok: false, status: res.status, data, error: sliceError(text, res.status) };
        return { ok: true, status: res.status, data };
      } catch (e) {
        return { ok: false, status: 0, data: null, error: (e as Error).message || 'Supabase request failed' };
        // status 0: unconfigured, network failure or timeout — callers treat it as "no data"
      }
    },
  };
}

/**
 * Env-bound service-role client. Returns null when Supabase is not configured
 * (callers answer their own "not configured" / skip branch).
 */
export function getServiceRest(): RestClient | null {
  const url = trimTrailingSlash(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || undefined;
  if (!url || !key) return null;
  return createRestClient(url, key);
}
