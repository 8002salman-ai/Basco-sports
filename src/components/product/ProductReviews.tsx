'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * Real customer reviews – storefront display + verified-purchase submission.
 *
 * Honest-display guarantees:
 *  - no rating UI is rendered when there are zero approved reviews
 *    (no zeros, no empty stars, no reserved blank space);
 *  - every listed review is a real, order-verified, admin-approved review;
 *  - submissions enter a moderation queue and say so plainly.
 */

interface PublicReview {
  id: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  createdAt: string;
}

interface ReviewsPayload {
  ok: boolean;
  mode?: string;
  reviews: PublicReview[];
  aggregate: { rating: number; count: number };
}

function Stars({ value, size = 'text-[15px]' }: { value: number; size?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={`${size} tracking-[2px] text-amber-500`} aria-label={`${value} out of 5 stars`}>
      {'★'.repeat(rounded)}
      <span className="text-stone-300">{'★'.repeat(5 - rounded)}</span>
    </span>
  );
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className={`text-[26px] leading-none transition-colors ${n <= value ? 'text-amber-500' : 'text-stone-300 hover:text-amber-300'}`}
        >
          ★
        </button>
      ))}
      <span className="ml-2 text-[12px] text-obsidian/50">
        {value ? `${value}/5` : 'Tap to rate'}
      </span>
    </div>
  );
}

const inputCls =
  'w-full h-11 px-3 rounded-[10px] border border-stone-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-obsidian/20';

export default function ProductReviews({ productSlug, productName }: { productSlug: string; productName: string }) {
  const [data, setData] = useState<ReviewsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const [formOpen, setFormOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [incentive, setIncentive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?product=${encodeURIComponent(productSlug)}`, { cache: 'no-store' });
      const json = (await res.json()) as ReviewsPayload;
      setData(json);
    } catch {
      setData({ ok: true, mode: 'error', reviews: [], aggregate: { rating: 0, count: 0 } });
    } finally {
      setLoading(false);
    }
  }, [productSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    if (!rating) {
      setFeedback({ ok: false, message: 'Please select a star rating.' });
      return;
    }
    setSubmitting(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug, orderNumber, email, authorName, rating, title, body, incentiveReceived: incentive }),
      });
      const json = await res.json();
      if (res.ok && json.ok) {
        setFeedback({ ok: true, message: json.message || 'Submitted — pending moderation.' });
        setOrderNumber('');
        setEmail('');
        setAuthorName('');
        setRating(0);
        setTitle('');
        setBody('');
        setIncentive(false);
      } else {
        setFeedback({ ok: false, message: json.error || 'Submission failed. Please try again.' });
      }
    } catch {
      setFeedback({ ok: false, message: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const reviews = data?.reviews ?? [];
  const { rating: aggRating, count: aggCount } = data?.aggregate ?? { rating: 0, count: 0 };

  return (
    <section className="mt-10" aria-label={`Customer reviews for ${productName}`}>
      <div className="rounded-2xl border border-stone-200 p-6 sm:p-8">
        {/* Header – aggregate only when genuine approved reviews exist */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-xl sm:text-2xl">Customer reviews</h2>
          {aggCount > 0 && (
            <div className="flex items-center gap-2" data-testid="aggregate-rating">
              <Stars value={aggRating} />
              <span className="text-[14px] font-semibold">{aggRating.toFixed(1)}</span>
              <span className="text-[13px] text-obsidian/50">
                ({aggCount} verified {aggCount === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          )}
        </div>

        {aggCount === 0 && !loading && (
          <p className="mt-3 text-[13px] text-obsidian/55">
            No verified customer reviews yet for this product. Ratings appear only after real, order-verified customers review it.
          </p>
        )}

        {/* Review list */}
        {reviews.length > 0 && (
          <div className="mt-6 divide-y divide-stone-100">
            {reviews.map((r) => (
              <article key={r.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Stars value={r.rating} />
                  {r.title && <h3 className="text-[14px] font-semibold">{r.title}</h3>}
                </div>
                <p className="mt-2 text-[14px] leading-relaxed text-obsidian/80 whitespace-pre-line">{r.body}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-obsidian/50">
                  <span className="font-medium text-obsidian/70">{r.authorName}</span>
                  <span>{new Date(r.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                  {r.verifiedPurchase && (
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                      ✓ Verified purchase
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {/* Write a review */}
        <div className="mt-8 pt-6 border-t border-stone-100">
          {!formOpen ? (
            <button
              onClick={() => setFormOpen(true)}
              className="h-11 px-6 rounded-[10px] bg-obsidian text-white text-[13px] font-semibold hover:bg-obsidian/85 transition-colors"
            >
              Write a review
            </button>
          ) : (
            <div className="max-w-xl">
              <h3 className="text-[15px] font-semibold">Share your experience</h3>
              <p className="mt-1 text-[12px] text-obsidian/55">
                We verify every review against your order. Your review is published only after moderation, with a
                &ldquo;Verified purchase&rdquo; badge. Your email is never shown.
              </p>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input className={inputCls} placeholder="Order number (e.g. BS-123456)" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
                <input className={inputCls} type="email" placeholder="Email used at checkout" value={email} onChange={(e) => setEmail(e.target.value)} />
                <input className={inputCls} placeholder="Display name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={80} />
                <input className={inputCls} placeholder="Review title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
              </div>

              <div className="mt-3">
                <StarPicker value={rating} onChange={setRating} />
              </div>

              <textarea
                className="mt-3 w-full min-h-[110px] p-3 rounded-[10px] border border-stone-200 bg-white text-[14px] focus:outline-none focus:ring-2 focus:ring-obsidian/20"
                placeholder="What did you like or dislike? (10–2000 characters)"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                maxLength={2000}
              />

              <label className="mt-3 flex items-start gap-2 text-[12px] text-obsidian/60 cursor-pointer">
                <input type="checkbox" checked={incentive} onChange={(e) => setIncentive(e.target.checked)} className="mt-0.5" />
                <span>I received a discount, free product or other incentive for this review (disclosed on publication).</span>
              </label>

              {feedback && (
                <p
                  className={`mt-3 text-[13px] rounded-[10px] px-3 py-2 ${
                    feedback.ok ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'
                  }`}
                  role="status"
                >
                  {feedback.message}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={submit}
                  disabled={submitting}
                  className="h-11 px-6 rounded-[10px] bg-obsidian text-white text-[13px] font-semibold hover:bg-obsidian/85 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting…' : 'Submit review'}
                </button>
                <button onClick={() => setFormOpen(false)} className="h-11 px-4 rounded-[10px] text-[13px] text-obsidian/60 hover:text-obsidian">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
