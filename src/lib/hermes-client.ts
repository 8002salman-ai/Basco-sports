/**
 * Basco Sports – Hermes Connector (Generic Custom API)
 * Production-ready placeholder – no external API call in demo.
 * Configured via server env: HERMES_ENABLED, HERMES_BASE_URL, HERMES_API_KEY
 * Do not assume which Hermes service; treat as configurable custom API integration.
 */

import { getServerEnv, isHermesConfigured } from './env';

export interface HermesRequestOptions {
  path: string; // e.g. '/v1/orders' – appended to base URL
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
}

export interface HermesResponse<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  notConfigured?: boolean;
}

/**
 * Generic Hermes client – safe, no secret leakage.
 * Returns notConfigured=true if env not set, rather than throwing.
 * Never logs API key.
 */
export async function hermesRequest<T = unknown>(opts: HermesRequestOptions): Promise<HermesResponse<T>> {
  const env = getServerEnv();

  if (!isHermesConfigured(env)) {
    return {
      ok: false,
      status: 503,
      notConfigured: true,
      error: 'Hermes not configured – set HERMES_ENABLED=true, HERMES_BASE_URL, HERMES_API_KEY in deployment env. See .env.example and README.',
    };
  }

  const baseUrl = env.HERMES_BASE_URL!.replace(/\/$/, '');
  const url = `${baseUrl}${opts.path.startsWith('/') ? opts.path : `/${opts.path}`}`;

  try {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.HERMES_API_KEY}`,
        ...(opts.headers || {}),
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      // Never cache sensitive requests
      cache: 'no-store',
    });

    const contentType = res.headers.get('content-type') || '';
    let data: T | undefined;
    if (contentType.includes('application/json')) {
      data = (await res.json()) as T;
    } else {
      const text = await res.text();
      data = text as unknown as T;
    }

    if (!res.ok) {
      return { ok: false, status: res.status, data, error: `Hermes API error: ${res.status}` };
    }

    return { ok: true, status: res.status, data };
  } catch (err: any) {
    return { ok: false, status: 500, error: err.message || 'Hermes request failed' };
  }
}

// Example typed helpers (inactive until configured)
export async function hermesGetHealth(): Promise<HermesResponse<{ status: string }>> {
  return hermesRequest({ path: '/health', method: 'GET' });
}

export async function hermesListOrders(): Promise<HermesResponse<{ orders: unknown[] }>> {
  return hermesRequest({ path: '/v1/orders', method: 'GET' });
}
