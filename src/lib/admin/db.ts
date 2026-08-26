/**
 * Basco Sports – Admin Data Layer
 *
 * Ported from the Luxedge admin system (8002salman-ai/luxedge-website,
 * src/services/db.ts) and adapted for Basco Sports (Next.js).
 *
 * Single interface for admin persistence:
 *  - localStorage adapter (active by default – demo mode, no DB needed)
 *  - Supabase adapter (PostgREST over fetch – activates when
 *    NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set)
 *
 * SECURITY: this module never holds secrets. The Supabase anon key is
 * client-safe by design (RLS protects the tables); the service-role key
 * stays server-side. The schema the Supabase adapter expects is defined in
 * supabase/migrations/0001_admin_schema.sql in this repo.
 */

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
  private url: string;
  private anonKey: string;

  constructor(url: string, anonKey: string) {
    this.url = url.replace(/\/$/, '');
    this.anonKey = anonKey;
  }

  private endpoint(table: string, id?: string): string {
    return `${this.url}/rest/v1/${table}${id ? `?id=eq.${encodeURIComponent(id)}` : ''}`;
  }

  private headers(_method: string): Record<string, string> {
    const h: Record<string, string> = {
      apikey: this.anonKey,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };
    return h;
  }

  private async handle<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  }

  async list<T>(table: string, opts?: { orderBy?: string; limit?: number }): Promise<T[]> {
    const url = new URL(this.endpoint(table));
    if (opts?.orderBy) url.searchParams.set('order', opts.orderBy);
    if (opts?.limit) url.searchParams.set('limit', String(opts.limit));
    const res = await fetch(url.toString(), { headers: this.headers('GET') });
    const rows = await this.handle<T[]>(res);
    return Array.isArray(rows) ? rows : [];
  }

  async get<T>(table: string, id: string): Promise<T | null> {
    const res = await fetch(this.endpoint(table, id), { headers: this.headers('GET') });
    const rows = await this.handle<T[]>(res);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }

  async findFirst<T>(table: string, column: string, value: string): Promise<T | null> {
    const url = new URL(this.endpoint(table));
    url.searchParams.append(column, `eq.${value}`);
    const res = await fetch(url.toString(), { headers: this.headers('GET') });
    const rows = await this.handle<T[]>(res);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }

  async insert<T extends { id: string }>(table: string, row: T): Promise<T> {
    const res = await fetch(this.endpoint(table), {
      method: 'POST',
      headers: this.headers('POST'),
      body: JSON.stringify(row),
    });
    const rows = await this.handle<T[]>(res);
    return rows[0] || row;
  }

  async insertRaw<T>(table: string, row: T): Promise<T> {
    const res = await fetch(this.endpoint(table), {
      method: 'POST',
      headers: this.headers('POST'),
      body: JSON.stringify(row),
    });
    const rows = await this.handle<T[]>(res);
    return rows[0] || row;
  }

  async update<T extends { id: string }>(table: string, id: string, patch: Partial<T>): Promise<T | null> {
    return this.updateBy(table, 'id', id, patch);
  }

  async updateBy<T>(table: string, column: string, value: string, patch: Partial<T>): Promise<T | null> {
    const url = new URL(this.endpoint(table));
    url.searchParams.append(column, `eq.${value}`);
    const res = await fetch(url.toString(), {
      method: 'PATCH',
      headers: this.headers('PATCH'),
      body: JSON.stringify(patch),
    });
    const rows = await this.handle<T[]>(res);
    return Array.isArray(rows) && rows.length ? rows[0] : null;
  }

  async remove(table: string, id: string): Promise<void> {
    await fetch(this.endpoint(table, id), { method: 'DELETE', headers: this.headers('DELETE') });
  }

  async testConnection(): Promise<DbConnectionResult> {
    try {
      const res = await fetch(this.endpoint('products') + '?limit=1', {
        headers: this.headers('GET'),
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        return { ok: false, mode: 'supabase', detail: `Supabase HTTP ${res.status}: ${text.slice(0, 120)}` };
      }
      return { ok: true, mode: 'supabase', detail: 'Supabase reachable (anon read OK)' };
    } catch (e) {
      return { ok: false, mode: 'supabase', detail: (e as Error).message || 'Supabase unreachable' };
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

/** Returns the active adapter. Defaults to localStorage; upgrades to Supabase when configured. */
export function getDb(): DbAdapter {
  if (cachedAdapter) return cachedAdapter;
  const cfg = resolveDbConfig();
  cachedAdapter = cfg ? new SupabaseAdapter(cfg.url, cfg.anonKey) : new LocalStorageAdapter();
  return cachedAdapter;
}

/** Which persistence mode is active – used for honest UI status. */
export function getDbMode(): DbMode {
  return resolveDbConfig() ? 'supabase' : 'local';
}
