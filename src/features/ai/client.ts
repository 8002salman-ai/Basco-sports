/**
 * Basco Sports – AI client (secure server proxy), ported from Luxedge.
 *
 * The browser NEVER holds an AI provider API key and NEVER calls a provider
 * endpoint directly. All generation, connection tests and credit checks go
 * through the server routes under /api/admin/ai/*, which read keys from
 * environment variables and keep them out of the browser bundle.
 */

import { loadAIProviders, loadProviderSettings, resolveProviderChain } from './providers';

const API_BASE = '/api/admin/ai';

export interface ProviderStatus {
  id: string;
  name: string;
  configured: boolean;
  model: string;
}

export interface ProviderStatusMap {
  providers: ProviderStatus[];
  backend: 'configured' | 'missing';
}

async function parseJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    throw new Error('AI backend returned a non-JSON response.');
  }
}

function authHeaders(): Record<string, string> {
  // The admin session cookie is sent automatically (same-origin) and checked
  // by the route. No secret is attached by the client.
  return {};
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('AI backend not reachable.');
  }
  const data = await parseJson(res);
  if (!res.ok) {
    const serverMsg = (data as { error?: string }).error;
    const message =
      res.status === 401 || res.status === 403
        ? 'Admin session required — sign in to the admin dashboard and try again.'
        : serverMsg || `AI backend error (HTTP ${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

async function get<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
  } catch {
    throw new Error('AI backend not reachable.');
  }
  const data = await parseJson(res);
  if (!res.ok) {
    const serverMsg = (data as { error?: string }).error;
    const message =
      res.status === 401 || res.status === 403
        ? 'Admin session required — sign in to the admin dashboard and try again.'
        : serverMsg || `AI backend error (HTTP ${res.status})`;
    throw new Error(message);
  }
  return data as T;
}

export interface GenerateResponse {
  text: string;
  provider: string;
  model: string;
  fallbackUsed?: string | null;
}

/** Generate text via the secure server proxy. */
export async function serverGenerate(
  prompt: string,
  providerId: string,
  model: string,
  system?: string,
  fallback?: string
): Promise<GenerateResponse> {
  return post<GenerateResponse>('/generate', { prompt, provider: providerId, model, system, fallback });
}

export async function serverProviderStatus(): Promise<ProviderStatusMap> {
  return get<ProviderStatusMap>('/status');
}

export async function serverTestProvider(providerId: string, model?: string): Promise<{ ok: boolean; message?: string; latencyMs?: number }> {
  return post('/test', { provider: providerId, model });
}

export async function serverOpenRouterCredits(): Promise<{ configured: boolean; credits?: number; error?: string }> {
  return get('/openrouter-credits');
}

/** Call the configured provider chain, falling back through enabled providers. */
export async function callAIProvider(
  prompt: string,
  system?: string
): Promise<{ text: string; provider: string; model: string }> {
  const providers = loadAIProviders();
  const settings = loadProviderSettings();
  const { primary, fallback } = resolveProviderChain(providers, settings);
  const chain = [primary, fallback].filter(Boolean) as { id: string; defaultModel: string }[];
  let lastError: Error | null = null;
  for (const p of chain) {
    try {
      const res = await serverGenerate(prompt, p.id, p.defaultModel, system);
      return { text: res.text, provider: res.provider, model: res.model };
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw lastError || new Error('No AI provider is configured on the server.');
}
