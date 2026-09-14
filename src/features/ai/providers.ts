/**
 * Basco Sports – AI provider registry (ported from Luxedge).
 *
 * Client-side provider *configuration* only (id, name, models, enabled,
 * default). API keys are NOT part of this model — they are read from
 * server-side env vars by the /api/admin/ai/* routes.
 */

import type { AIProvider } from './types';

export const DEFAULT_AI_PROVIDERS: AIProvider[] = [
  { id: 'openrouter', name: 'OpenRouter', models: ['minimax/minimax-m3:free', 'nvidia/nemotron-3-super-120b-a12b:free', 'openrouter/free', 'google/gemma-4-31b-it:free', 'z-ai/glm-5.2:free'], defaultModel: 'minimax/minimax-m3:free', enabled: true, isDefault: true },
  { id: 'gemini', name: 'Google Gemini', models: ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest'], defaultModel: 'gemini-3.5-flash', enabled: true, isDefault: false },
  { id: 'deepseek', name: 'DeepSeek', models: ['deepseek-v4-flash', 'deepseek-chat', 'deepseek-reasoner'], defaultModel: 'deepseek-v4-flash', enabled: true, isDefault: false },
  { id: 'openai', name: 'OpenAI', models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'], defaultModel: 'gpt-4o-mini', enabled: false, isDefault: false },
  { id: 'anthropic', name: 'Anthropic Claude', models: ['claude-haiku-4-5-20251001', 'claude-sonnet-4-6'], defaultModel: 'claude-haiku-4-5-20251001', enabled: false, isDefault: false },
];

const PROVIDER_IDS = new Set(DEFAULT_AI_PROVIDERS.map((p) => p.id));

const STORAGE_KEY = 'basco_ai_providers';

/** Strip any secret fields (e.g. legacy apiKey) from a provider object. */
export function sanitizeProvider(p: Partial<AIProvider> & Record<string, unknown>): AIProvider {
  const { apiKey: _legacy, ...rest } = p as AIProvider & { apiKey?: string };
  const def = DEFAULT_AI_PROVIDERS.find((d) => d.id === rest.id) || DEFAULT_AI_PROVIDERS[0];
  return {
    id: (rest.id && PROVIDER_IDS.has(rest.id) ? rest.id : def.id),
    name: rest.name || def.name,
    models: Array.isArray(rest.models) && rest.models.length ? rest.models : def.models,
    defaultModel: rest.defaultModel || def.defaultModel,
    enabled: rest.enabled !== false,
    isDefault: !!rest.isDefault,
  };
}

export function loadAIProviders(storage?: Pick<Storage, 'getItem'>): AIProvider[] {
  try {
    const raw = (storage || window.localStorage).getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_PROVIDERS.map((p) => ({ ...p }));
    const stored = JSON.parse(raw);
    if (!Array.isArray(stored)) return DEFAULT_AI_PROVIDERS.map((p) => ({ ...p }));
    const merged: AIProvider[] = stored.map((p) => sanitizeProvider(p || {}));
    for (const def of DEFAULT_AI_PROVIDERS) {
      if (!merged.some((p) => p.id === def.id)) merged.push({ ...def });
    }
    if (!merged.some((p) => p.enabled)) return DEFAULT_AI_PROVIDERS.map((p) => ({ ...p }));
    return merged;
  } catch {
    return DEFAULT_AI_PROVIDERS.map((p) => ({ ...p }));
  }
}

export function saveAIProviders(providers: AIProvider[], storage?: Pick<Storage, 'setItem'>): void {
  const clean = providers.map((p) => sanitizeProvider(p as AIProvider & Record<string, unknown>));
  (storage || window.localStorage).setItem(STORAGE_KEY, JSON.stringify(clean));
}

/** Resolve the active provider from a list, preferring the default. */
export function resolveActiveProvider(providers: AIProvider[]): AIProvider | null {
  const active = providers.filter((p) => p.enabled);
  if (!active.length) return null;
  return active.find((p) => p.isDefault) || active[0];
}

// ---------------------------------------------------------------------------
// Provider routing settings (default + fallback). Keys are never stored here.
// ---------------------------------------------------------------------------

export interface AIProviderSettings {
  defaultProviderId: string;
  fallbackProviderId: string | null;
}

export const DEFAULT_PROVIDER_SETTINGS: AIProviderSettings = {
  defaultProviderId: 'openrouter',
  fallbackProviderId: null,
};

const PROVIDER_SETTINGS_KEY = 'basco_ai_provider_settings';

export function loadProviderSettings(storage?: Pick<Storage, 'getItem'>): AIProviderSettings {
  try {
    const raw = (storage || (typeof window !== 'undefined' ? window.localStorage : null))?.getItem(PROVIDER_SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_PROVIDER_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<AIProviderSettings>;
    return {
      defaultProviderId:
        typeof parsed.defaultProviderId === 'string' && parsed.defaultProviderId
          ? parsed.defaultProviderId
          : DEFAULT_PROVIDER_SETTINGS.defaultProviderId,
      fallbackProviderId:
        typeof parsed.fallbackProviderId === 'string' && parsed.fallbackProviderId ? parsed.fallbackProviderId : null,
    };
  } catch {
    return { ...DEFAULT_PROVIDER_SETTINGS };
  }
}

export function saveProviderSettings(settings: AIProviderSettings, storage?: Pick<Storage, 'setItem'>): void {
  (storage || (typeof window !== 'undefined' ? window.localStorage : null))?.setItem(
    PROVIDER_SETTINGS_KEY,
    JSON.stringify({ defaultProviderId: settings.defaultProviderId, fallbackProviderId: settings.fallbackProviderId || null })
  );
}

/** Resolve the primary + fallback providers from the enabled list + routing settings. */
export function resolveProviderChain(
  providers: AIProvider[],
  settings: AIProviderSettings
): { primary: AIProvider | null; fallback: AIProvider | null } {
  const enabled = providers.filter((p) => p.enabled);
  const find = (id: string | null) => (id ? enabled.find((p) => p.id === id) || null : null);
  let primary = find(settings.defaultProviderId);
  if (!primary) primary = enabled.find((p) => p.isDefault) || enabled[0] || null;
  let fallback = find(settings.fallbackProviderId);
  if (fallback && fallback.id === primary?.id) fallback = null;
  return { primary, fallback };
}

export function isKnownProviderId(id: string): boolean {
  return PROVIDER_IDS.has(id);
}
