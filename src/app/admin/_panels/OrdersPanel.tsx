'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDb } from '@/lib/admin/db';
import { AdminOrder, ORDER_STATUSES, OrderStatus } from '@/lib/admin/types';
import { DbStatus } from './DbStatus';

export function OrdersPanel() {
  const [rows, setRows] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const db = useMemo(() => getDb(), []);

  const load = useCallback(async () => {
    try {
      const orders = await db.list<AdminOrder>('orders', { orderBy: 'createdAt desc' });
      setRows(orders);
      setLoading(false);
    } catch (e) {
      setError((e as Error).message || 'Failed to load orders');
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void load();
  }, [load]);

  const setStatus = async (id: string, status: OrderStatus) => {
    await db.update<AdminOrder>('orders', id, { status, updatedAt: new Date().toISOString() });
    await load();
  };

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return rows;
    return rows.filter((o) => o.status === statusFilter);
  }, [rows, statusFilter]);

  if (loading) return <div className="py-20 text-center text-[14px] text-obsidian/50">Loading orders…</div>;

  const totals = rows.reduce((acc, o) => acc + o.total, 0);
  const statusColor: Record<OrderStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    paid: 'bg-blue-50 text-blue-700 border-blue-200',
    shipped: 'bg-violet-50 text-violet-700 border-violet-200',
    delivered: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-stone-100 text-stone-500 border-stone-200',
    refunded: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] leading-none">Orders</h1>
          <p className="mt-1.5 text-[13px] text-obsidian/60 flex items-center gap-2">
            <DbStatus /> {rows.length} orders · ${totals.toFixed(2)} total
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-[10px] border border-stone-200 bg-white text-[13px]"
        >
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mt-4 rounded-[12px] bg-red-50 border border-red-200 p-3 text-[13px] text-red-700">{error}</div>
      )}

      {rows.length === 0 && (
        <div className="mt-6 bg-white rounded-[16px] border p-12 text-center text-[13px] text-obsidian/50">
          No orders yet. Place a test order on the storefront – it appears here (demo mode stores it in localStorage).
        </div>
      )}

      <div className="mt-6 space-y-3">
        {filtered.map((o) => (
          <div key={o.id} className="bg-white rounded-[16px] border overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === o.id ? null : o.id)}
              className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-stone-50/60 text-left"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="font-mono text-[13px] font-semibold">{o.orderNumber}</div>
                <div className="hidden sm:block text-[13px] text-obsidian/60 truncate">{o.customerEmail}</div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2.5 py-1 rounded-full border text-[11px] ${statusColor[o.status]}`}>{o.status}</span>
                <span className="text-[13px] font-semibold">${o.total.toFixed(2)}</span>
                <span className="text-[11px] text-obsidian/40">{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
            </button>
            {expanded === o.id && (
              <div className="px-5 pb-5 border-t">
                <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-obsidian/40 font-semibold">Customer</div>
                    <div className="mt-1">{o.customerName || '—'}</div>
                    <div className="text-obsidian/60">{o.customerEmail}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-obsidian/40 font-semibold">Summary</div>
                    <div className="mt-1">
                      Subtotal ${o.subtotal.toFixed(2)}
                      {o.discount > 0 && <span className="text-emerald-600"> · −${o.discount.toFixed(2)}</span>}
                      {o.coupon && <span className="text-obsidian/50"> · {o.coupon}</span>}
                    </div>
                    <div className="text-obsidian/60">Tax ${o.tax.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-obsidian/40 font-semibold">Status</div>
                    <select
                      value={o.status}
                      onChange={(e) => setStatus(o.id, e.target.value as OrderStatus)}
                      className="mt-1 h-9 px-2 rounded-[8px] border border-stone-200 text-[13px] bg-white"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-wider text-obsidian/40 font-semibold">Items</div>
                  <div className="mt-2 space-y-1.5">
                    {o.items.map((it) => (
                      <div key={it.id} className="flex justify-between text-[13px]">
                        <span className="text-obsidian/70">
                          {it.name} {it.variantLabel ? <span className="text-obsidian/40">· {it.variantLabel}</span> : null}{' '}
                          × {it.quantity}
                        </span>
                        <span>${(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
