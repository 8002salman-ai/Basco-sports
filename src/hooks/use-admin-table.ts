'use client';

/**
 * Basco Sports – Admin table hook
 *
 * The admin console's single client-side data layer. Reads and writes go
 * through the existing adapter seam (src/lib/admin/db.ts → /api/admin/db →
 * Supabase), so headers, error slicing and the service-role handling stay
 * owned in one place instead of being re-implemented per screen.
 *
 * Per table the hook reports where the rows came from:
 *  - `live`  – the table answered with rows; writes go to the table.
 *  - `local` – the table is empty, missing or unreachable; the screen shows
 *              seed rows and writes stay local, so demo rows are never
 *              inserted into the live table.
 * Screens render that state via `DataNotice` instead of claiming to be live.
 */
import { useCallback, useEffect, useState } from 'react';
import { getDb, LocalStorageAdapter } from '@/lib/admin/db';

export type AdminTableSource = 'loading' | 'live' | 'local';

export interface AdminTable<T> {
  rows: T[];
  source: AdminTableSource;
  /** Why the table could not be read, when it could not. */
  error: string | null;
  /** Returns false (and rolls the optimistic change back) if the write failed. */
  save: (row: T) => Promise<boolean>;
  remove: (id: string) => Promise<boolean>;
}

const localFallback = new LocalStorageAdapter();

export function useAdminTable<T extends { id: string }>(table: string, seed: T[]): AdminTable<T> {
  const [rows, setRows] = useState<T[]>(seed);
  const [source, setSource] = useState<AdminTableSource>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setSource('loading');
      try {
        const liveRows = await getDb().list<T>(table);
        if (cancelled) return;
        setError(null);
        setSource(liveRows.length ? 'live' : 'local');
        setRows(liveRows.length ? liveRows : seed);
      } catch (e) {
        const kept = await localFallback.list<T>(table).catch(() => []);
        if (cancelled) return;
        setError((e as Error).message || 'Admin data layer unreachable');
        setSource('local');
        setRows(kept.length ? kept : seed);
      }
    })();

    return () => {
      cancelled = true;
    };
    // `seed` is a module-level literal per screen, so `table` is the real key.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const save = useCallback(
    async (row: T) => {
      const db = source === 'live' ? getDb() : localFallback;
      const exists = rows.some((r) => r.id === row.id);
      const previous = rows;
      setRows(exists ? rows.map((r) => (r.id === row.id ? row : r)) : [row, ...rows]);
      setError(null);
      try {
        if (exists) await db.update(table, row.id, row);
        else await db.insert(table, row);
        return true;
      } catch (e) {
        setRows(previous);
        setError((e as Error).message || 'Save failed');
        return false;
      }
    },
    [rows, source, table]
  );

  const remove = useCallback(
    async (id: string) => {
      const db = source === 'live' ? getDb() : localFallback;
      const previous = rows;
      setRows(rows.filter((r) => r.id !== id));
      setError(null);
      try {
        await db.remove(table, id);
        return true;
      } catch (e) {
        setRows(previous);
        setError((e as Error).message || 'Delete failed');
        return false;
      }
    },
    [rows, source, table]
  );

  return { rows, source, error, save, remove };
}
