'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDb } from '@/lib/admin/db';
import { AdminUser } from '@/lib/admin/types';
import { DbStatus } from './DbStatus';

export function UsersPanel() {
  const [rows, setRows] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const db = useMemo(() => getDb(), []);

  const load = useCallback(async () => {
    try {
      const users = await db.list<AdminUser>('users', { orderBy: 'createdAt desc' });
      setRows(users);
      setLoading(false);
    } catch (e) {
      setError((e as Error).message || 'Failed to load users');
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void load();
  }, [load]);

  const setBlocked = async (u: AdminUser, isBlocked: boolean) => {
    await db.update<AdminUser>('users', u.id, { isBlocked });
    await load();
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((u) => u.email.toLowerCase().includes(q) || (u.name || '').toLowerCase().includes(q));
  }, [rows, query]);

  if (loading) return <div className="py-20 text-center text-[14px] text-obsidian/50">Loading users…</div>;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] leading-none">Users</h1>
          <p className="mt-1.5 text-[13px] text-obsidian/60 flex items-center gap-2">
            <DbStatus /> {rows.length} users
          </p>
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users…"
          className="h-10 px-4 rounded-[10px] border border-stone-200 bg-white text-[13px] focus:outline-none focus:ring-2 focus:ring-lime-300 w-full max-w-xs"
        />
      </div>

      {error && (
        <div className="mt-4 rounded-[12px] bg-red-50 border border-red-200 p-3 text-[13px] text-red-700">{error}</div>
      )}

      {rows.length === 0 ? (
        <div className="mt-6 bg-white rounded-[16px] border p-12 text-center text-[13px] text-obsidian/50">
          No users yet. When Supabase auth is configured (NEXT_PUBLIC_SUPABASE_URL + anon key), storefront sign-ups appear
          here via the <code className="bg-stone-100 px-1 rounded">users</code> table.
        </div>
      ) : (
        <div className="mt-6 bg-white rounded-[16px] border overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b bg-stone-50 text-[11px] tracking-wider uppercase text-obsidian/50">
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold hidden sm:table-cell">Name</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold hidden md:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-stone-50/60">
                  <td className="px-4 py-3 text-[13px]">{u.email}</td>
                  <td className="px-4 py-3 text-[13px] hidden sm:table-cell">{u.name || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-[11px] ${u.role === 'admin' ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-stone-50 text-stone-600 border-stone-200'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {u.isBlocked ? (
                      <button onClick={() => setBlocked(u, false)} className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 text-[11px] hover:bg-red-100">
                        Blocked – unblock
                      </button>
                    ) : (
                      <button onClick={() => setBlocked(u, true)} className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] hover:bg-emerald-100">
                        Active – block
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[12px] text-obsidian/50 hidden md:table-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
