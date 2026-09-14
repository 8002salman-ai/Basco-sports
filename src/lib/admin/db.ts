/**
 * Basco Sports – Admin Data Layer
 *
 * Ported from the Luxedge admin system (8002salman-ai/luxedge-website,
 * src/services/db.ts) and adapted for Basco Sports (Next.js).
 *
 * Single interface for admin persistence:
 *  - localStorage adapter (active by default – demo mode, no DB needed)
 *  - Supabase adapter (PostgREST – activates when
 *    NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set)
 *
 * SECURITY: this module never holds secrets. The Supabase anon key is
 * client-safe by design (RLS protects the tables); the service-role key
 * stays server-side. HTTP itself (headers, JSON envelope, error slicing,
 * timeout) is delegated to the shared lib/supabase-rest.ts core. The schema
 * the Supabase adapter expects is defined in supabase/migrations/0001_admin_schema.sql.
 */

import { createRestClient, isRows, type RestResult } from '@/lib/supabase-rest';

export type DbMode = 'local' | 'supabase' | 'unconfigured';

export interface DbConnectionResult {
  ok: boolean;
  mode: DbMode;
  detail?: string;
}

export interface DbAdapter {
  mode: DbMode;
  list<T>(table: string, opts?: { orderBy?: string; limit?: number }): Promise<T[]>;
  get<T>(table: string, id: string): Promise<T | null>;
  /** First row matching `column = value`, or null. */
  findFirst<T>(table: string, column: string, value: string): Promise<T | null>;
  insert<T extends { id: string }>(table: string, row: T): Promise<T>;
  /** Insert a row whose PK is NOT `id` (e.g. store_settings.key). */
  insertRaw<T>(table: string, row: T): Promise<T>;
  update<T extends { id: string }>(table: string, id: string, patch: Partial<T>): Promise<T | null>;
  /** Update the first row where `column = value` (tables whose PK is not `id`). */
  updateBy<T>(table: string, column: string, value: string, patch: Partial<T>): Promise<T | null>;
  remove(table: string, id: string): Promise<void>;
  /** Honest connectivity check – never claims success it cannot prove. */
  testConnection(): Promise<DbConnectionResult>;
}

const KEY_PREFIX = 'basco_admin_v1';

// ---------------------------------------------------------------------------
// Local storage adapter (demo mode – no DB configured)
// ---------------------------------------------------------------------------
export class LocalStorageAdapter implements DbAdapter {
  readonly mode: DbMode = 'local';
  private storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

  constructor(storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>) {
    this.storage = storage ?? (typeof window !== 'undefined' ? window.localStorage : nullStorage);
  }

  private key(table: string): string {
    return `${KEY_PREFIX}:${table}`;
  }

  private read<T>(table: string): T[] {
    try {
      const raw = this.storage.getItem(this.key(table));
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }

  private write<T>(table: string, rows: T[]): void {
    this.storage.setItem(this.key(table), JSON.stringify(rows));
  }

  async list<T>(table: string, opts?: { orderBy?: string; limit?: number }): Promise<T[]> {
    let rows = this.read<T>(table);
    if (opts?.orderBy) {
      const [col, dir] = opts.orderBy.split(' ');
      rows = [...rows].sort((a: any, b: any) => {
        const av = a?.[col];
        const bv = b?.[col];
        if (av == null || bv == null) return 0;
        const cmp = typeof av === 'number' ? av - bv : String(av).localeCompare(String(bv));
        return dir === 'desc' ? -cmp : cmp;
      });
    }
    if (opts?.limit) rows = rows.slice(0, opts.limit);
    return rows;
  }

  async get<T>(table: string, id: string): Promise<T | null> {
    return (await this.list<T>(table)).find((r: any) => r.id === id) ?? null;
  }

  async findFirst<T>(table: string, column: string, value: string): Promise<T | null> {
    return (await this.list<T>(table)).find((r: any) => String(r?.[column]) === String(value)) ?? null;
  }

  async insert<T extends { id: string }>(table: string, row: T): Promise<T> {
    const rows = this.read<T>(table);
    if (!rows.some((r) => r.id === row.id)) rows.push(row);
    this.write(table, rows);
    return row;
  }

  async insertRaw<T>(table: string, row: T): Promise<T> {
    return this.insert(table as any, row as any);
  }

  async update<T extends { id: string }>(table: string, id: string, patch: Partial<T>): Promise<T | null> {
    const rows = this.read<T>(table);
    const idx = rows.findIndex((r) => (r as any).id === id);
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch } as T;
    this.write(table, rows);
    return rows[idx];
  }

  async updateBy<T>(table: string, column: string, value: string, patch: Partial<T>): Promise<T | null> {
    const rows = this.read<T>(table);
    const idx = rows.findIndex((r) => String((r as any)?.[column]) === String(value));
    if (idx === -1) return null;
    rows[idx] = { ...rows[idx], ...patch } as T;
    this.write(table, rows);
    return rows[idx];
  }

  async remove(table: string, id: string): Promise<void> {
    this.write(table, this.read(table).filter((r: any) => r.id !== id));
  }

  async testConnection(): Promise<DbConnectionResult> {
    return { ok: true, mode: 'local', detail: 'localStorage adapter (active)' };
  }
}

const nullStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

// ---------------------------------------------------------------------------
// Supabase adapter (PostgREST over fetch – activates only when configured)
// ---------------------------------------------------------------------------
export class SupabaseAdapter implements DbAdapter {
  readonly mode: DbMode = 'supabase';
  private rest: ReturnType<typeof createRestClient>;

  constructor(url: string, anonKey: string, authToken?: string | null) {
    // The bearer token (service-role in admin proxies) overrides the anon key
    // for Authorization while apikey stays the anon key, matching PostgREST.
    this.rest = createRestClient(url, anonKey);
    this.authToken = authToken ?? null;
  }

  private authToken: string | null;

  private endpoint(table: string, id?: string): string {
    return `${table}${id ? `?id=eq.${encodeURIComponent(id)}` : ''}`;
  }

  /** Shared-core request with the adapter's legacy contract: Prefer header on
   *  every call, HTTP/transport failures THROWN (routes depend on try/catch). */
  private async run<T>(path: string, init?: RequestInit): Promise<T> {
    const headers: Record<string, string> = { Prefer: 'return=representation' };
    if (this.authToken) headers.Authorization = `Bearer ${this.authToken}`;
    if (init?.headers) Object.assign(headers, init.headers);
    const res = await this.rest.request<T>(path, { ...init, headers });
    if (!res.ok) throw new Error(`Supabase ${res.status}: ${res.error || 'request failed'}`);
    return (res.data ?? ([] as unknown)) as T;
  }

  async list<T>(table: string, opts?: { orderBy?: string; limit?: number }): Promise<T[]> {
    const params = new URLSearchParams();
    if (opts?.orderBy) {
      // PostgREST needs dot notation (col.desc) – the panels pass 'col desc'.
      params.set('order', opts.orderBy.replace(/\s+(asc|desc)$/i, '.$1'));
    }
    if (opts?.limit) params.set('limit', String(opts.limit));
    const qs = params.toString();
    const rows = await this.run<T[]>(qs ? `${table}?${qs}` : table);
    return isRows<T>(rows) ? rows : [];
  }

  async get<T>(table: string, id: string): Promise<T | null> {
    const rows = await this.run<T[]>(this.endpoint(table, id));
    return isRows<T>(rows) && rows.length ? rows[0] : null;
  }

  async findFirst<T>(table: string, column: string, value: string): Promise<T | null> {
    const rows = await this.run<T[]>(`${table}?${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`);
    return isRows<T>(rows) && rows.length ? rows[0] : null;
  }

  async insert<T extends { id: string }>(table: string, row: T): Promise<T> {
    const rows = await this.run<T[]>(this.endpoint(table), {
      method: 'POST',
      body: JSON.stringify(row),
    });
    return isRows<T>(rows) && rows.length ? rows[0] : row;
  }

  async insertRaw<T>(table: string, row: T): Promise<T> {
    const rows = await this.run<T[]>(this.endpoint(table), {
      method: 'POST',
      body: JSON.stringify(row),
    });
    return isRows<T>(rows) && rows.length ? rows[0] : row;
  }

  async update<T extends { id: string }>(table: string, id: string, patch: Partial<T>): Promise<T | null> {
    return this.updateBy(table, 'id', id, patch);
  }

  async updateBy<T>(table: string, column: string, value: string, patch: Partial<T>): Promise<T | null> {
    const rows = await this.run<T[]>(`${table}?${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
    return isRows<T>(rows) && rows.length ? rows[0] : null;
  }

  async remove(table: string, id: string): Promise<void> {
    await this.run(this.endpoint(table, id), { method: 'DELETE' });
  }

  async testConnection(): Promise<DbConnectionResult> {
    try {
      await this.run<unknown[]>(`${this.endpoint('products')}?limit=1`);
      return { ok: true, mode: 'supabase', detail: 'Supabase reachable (anon read OK)' };
    } catch (e) {
      return { ok: false, mode: 'supabase', detail: (e as Error).message || 'Supabase unreachable' };
    }
  }
}

// ---------------------------------------------------------------------------
// Server proxy adapter (client-side)
// Routes all operations through /api/admin/db, which performs them
// server-side with the SUPABASE_SERVICE_ROLE_KEY (never exposed to the
// browser). Panels keep using the same DbAdapter interface.
// ---------------------------------------------------------------------------
export class ServerProxyAdapter implements DbAdapter {
  readonly mode: DbMode = 'supabase';

  private async callTable<T>(table: string, action: string, payload?: unknown): Promise<T> {
    const res = await fetch('/api/admin/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table, action, payload }),
      cache: 'no-store',
    });
    const json = (await res.json().catch(() => ({}))) as { ok?: boolean; data?: T; error?: string };
    if (!res.ok || !json.ok) {
      throw new Error(json.error || `Admin DB error: ${res.status}`);
    }
    return json.data as T;
  }

  async list<T>(table: string, opts?: { orderBy?: string; limit?: number }): Promise<T[]> {
    const rows = await this.callTable<T[]>(table, 'list', { opts });
    return Array.isArray(rows) ? rows : [];
  }

  async get<T>(table: string, id: string): Promise<T | null> {
    return this.callTable<T | null>(table, 'get', { id });
  }

  async findFirst<T>(table: string, column: string, value: string): Promise<T | null> {
    return this.callTable<T | null>(table, 'findFirst', { column, value });
  }

  async insert<T extends { id: string }>(table: string, row: T): Promise<T> {
    return this.callTable<T>(table, 'insert', { row });
  }

  async insertRaw<T>(table: string, row: T): Promise<T> {
    return this.callTable<T>(table, 'insertRaw', { row });
  }

  async update<T extends { id: string }>(table: string, id: string, patch: Partial<T>): Promise<T | null> {
    return this.callTable<T | null>(table, 'update', { id, patch });
  }

  async updateBy<T>(table: string, column: string, value: string, patch: Partial<T>): Promise<T | null> {
    return this.callTable<T | null>(table, 'updateBy', { column, value, patch });
  }

  async remove(table: string, id: string): Promise<void> {
    await this.callTable(table, 'remove', { id });
  }

  async testConnection(): Promise<DbConnectionResult> {
    try {
      const rows = await this.list('store_settings', { limit: 1 });
      return { ok: true, mode: 'supabase', detail: `Supabase via server proxy (${rows.length} settings rows)` };
    } catch (e) {
      return { ok: false, mode: 'supabase', detail: (e as Error).message || 'Supabase proxy unreachable' };
    }
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
export function resolveDbConfig(): { url: string; anonKey: string } | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

let cachedAdapter: DbAdapter | null = null;

/**
 * Returns the active adapter.
 *  - Supabase configured → ServerProxyAdapter (all ops through /api/admin/db,
 *    service-role key stays server-side)
 *  - otherwise → localStorage (demo)
 */
export function getDb(): DbAdapter {
  if (cachedAdapter) return cachedAdapter;
  cachedAdapter = resolveDbConfig() ? new ServerProxyAdapter() : new LocalStorageAdapter();
  return cachedAdapter;
}

/** Which persistence mode is active – used for honest UI status. */
export function getDbMode(): DbMode {
  return resolveDbConfig() ? 'supabase' : 'local';
}
