'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getDb } from '@/lib/admin/db';
import { AdminReview, AdminProduct, ReviewStatus, REVIEW_STATUSES, aggregateApprovedReviews } from '@/lib/admin/types';
import { DbStatus } from './DbStatus';

/**
 * Reviews moderation panel.
 * Only admin-approved reviews are ever shown on the storefront (RLS enforces
 * status='approved' for anon reads; the public API reads the same rule).
 * After each moderation action the product's aggregate rating is recomputed
 * from approved reviews only, so catalog ratings always reflect genuine data.
 */
export function ReviewsPanel() {
  const [rows, setRows] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [busy, setBusy] = useState<string | null>(null);

  const db = useMemo(() => getDb(), []);

  const load = useCallback(async () => {
    try {
      const reviews = await db.list<AdminReview>('product_reviews', { orderBy: 'createdAt desc', limit: 200 });
      setRows(reviews);
      setError(null);
    } catch (e) {
      setError((e as Error).message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    void load();
  }, [load]);

  /** Recompute + persist the product aggregate after any moderation change. */
  const syncProductRating = async (productId: string, allRows: AdminReview[]) => {
    try {
      const product = await db.get<Record<string, unknown>>('products', productId);
      if (!product) return; // product may have been deleted – nothing to sync
      const agg = aggregateApprovedReviews(allRows.filter((r) => r.productId === productId));
      await db.update<AdminProduct>('products', productId, { rating: agg.rating, reviewCount: agg.reviewCount, updatedAt: new Date().toISOString() });
    } catch {
      // Non-fatal: aggregate sync failed, review status itself was already saved.
    }
  };

  const moderate = async (review: AdminReview, status: ReviewStatus, rejectionReason?: string) => {
    setBusy(review.id);
    try {
      const now = new Date().toISOString();
      const patch = {
        status,
        rejectionReason: rejectionReason ?? null,
        moderatedAt: now,
        moderatedBy: 'admin',
        updatedAt: now,
      } as unknown as Partial<AdminReview>;
      await db.update<AdminReview>('product_reviews', review.id, patch);
      const fresh = await db.list<AdminReview>('product_reviews', { orderBy: 'createdAt desc', limit: 200 });
      setRows(fresh);
      await syncProductRating(review.productId, fresh);
    } catch (e) {
      setError((e as Error).message || 'Moderation action failed');
    } finally {
      setBusy(null);
    }
  };

  const removeReview = async (review: AdminReview) => {
    if (!window.confirm(`Permanently delete the review by ${review.authorName}? This cannot be undone.`)) return;
    setBusy(review.id);
    try {
      await db.remove('product_reviews', review.id);
      const fresh = rows.filter((r) => r.id !== review.id);
      setRows(fresh);
      await syncProductRating(review.productId, fresh);
    } catch (e) {
      setError((e as Error).message || 'Delete failed');
    } finally {
      setBusy(null);
    }
  };

  const filtered = useMemo(() => (statusFilter === 'all' ? rows : rows.filter((r) => r.status === statusFilter)), [rows, statusFilter]);

  if (loading) return <div className="py-20 text-center text-[14px] text-obsidian/50">Loading reviews…</div>;

  const pendingCount = rows.filter((r) => r.status === 'pending').length;
  const statusColor: Record<ReviewStatus, string> = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-[28px] leading-none">Reviews</h1>
          <p className="mt-1.5 text-[13px] text-obsidian/60 flex items-center gap-2">
            <DbStatus /> {rows.length} total · {pendingCount} awaiting moderation
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-[10px] border border-stone-200 bg-white text-[13px]"
        >
          <option value="pending">Awaiting moderation</option>
          {REVIEW_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
          <option value="all">All</option>
        </select>
      </div>

      {error && (
        <div className="mt-4 rounded-[12px] bg-red-50 border border-red-200 p-3 text-[13px] text-red-700">{error}</div>
      )}

      {rows.length === 0 && (
        <div className="mt-6 bg-white rounded-[16px] border p-12 text-center text-[13px] text-obsidian/50">
          No customer reviews yet. Reviews appear here when customers submit them from a product page (each is verified
          against a real order before it reaches this queue). No seeded or fake reviews exist in this system.
        </div>
      )}

      <div className="mt-6 space-y-3">
        {filtered.map((r) => (
          <div key={r.id} className="bg-white rounded-[16px] border overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-stone-50/60 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[14px] tracking-[1px] text-amber-500 shrink-0">
                  {'★'.repeat(r.rating)}
                  <span className="text-stone-300">{'★'.repeat(5 - r.rating)}</span>
                </span>
                <span className="text-[13px] font-semibold truncate">{r.title || r.productName || r.productId}</span>
                {r.verifiedPurchase && (
                  <span className="hidden sm:inline rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 shrink-0">
                    Verified purchase
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`px-2.5 py-1 rounded-full border text-[11px] ${statusColor[r.status]}`}>{r.status}</span>
                <span className="text-[11px] text-obsidian/40">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
            </button>

            {expanded === r.id && (
              <div className="px-5 pb-5 border-t">
                <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-obsidian/40 font-semibold">Product</div>
                    <div className="mt-1">{r.productName || r.productId}</div>
                    <div className="text-obsidian/50 text-[12px]">{r.productSlug}</div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-obsidian/40 font-semibold">Order verification</div>
                    <div className="mt-1 font-mono text-[12px]">{r.orderNumber || '—'}</div>
                    <div className="text-obsidian/60 text-[12px]">{r.customerEmail || '—'}</div>
                    <div className="text-[12px] mt-0.5">
                      {r.verifiedPurchase ? (
                        <span className="text-emerald-700">✓ Matched to a paid order</span>
                      ) : (
                        <span className="text-red-700">Not order-verified</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-obsidian/40 font-semibold">Disclosure</div>
                    <div className="mt-1 text-[12px]">{r.incentiveDisclosure || 'none'}</div>
                    {r.rejectionReason && <div className="text-red-700 text-[12px] mt-0.5">Reason: {r.rejectionReason}</div>}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-[11px] uppercase tracking-wider text-obsidian/40 font-semibold">Review</div>
                  <p className="mt-2 text-[14px] leading-relaxed whitespace-pre-line">{r.body}</p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {r.status !== 'approved' && (
                    <button
                      disabled={busy === r.id}
                      onClick={() => moderate(r, 'approved')}
                      className="h-9 px-4 rounded-[10px] bg-emerald-600 text-white text-[12px] font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Approve
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      disabled={busy === r.id}
                      onClick={() => {
                        const reason = window.prompt('Rejection reason (kept internally, shown to no one):') || undefined;
                        moderate(r, 'rejected', reason);
                      }}
                      className="h-9 px-4 rounded-[10px] bg-amber-500 text-white text-[12px] font-semibold hover:bg-amber-600 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  )}
                  <button
                    disabled={busy === r.id}
                    onClick={() => removeReview(r)}
                    className="h-9 px-4 rounded-[10px] border border-red-200 text-red-700 text-[12px] font-semibold hover:bg-red-50 disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
