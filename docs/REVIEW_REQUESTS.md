# Post-Delivery Review Request Emails

Automatic, **neutral** review-request email sent once after an order is
delivered. FTC Consumer Reviews & Testimonials Rule compliant.

Status: implemented and tested end-to-end. **Dormant by design** until both
gates below are enabled — demo orders are never emailed.

---

## How it works

1. An order status is set to `delivered` (admin panel → Orders, or any update
   flowing through the admin DB proxy: `update` / `updateBy`).
2. `src/lib/review-request.ts` runs its guards, then claims a one-per-order
   token and sends the email via Resend.

Claim marker: `orders.reviewRequestSentAt` (migration
`supabase/migrations/0003_review_requests.sql`, already applied to the
production Supabase project).

## Gates (all must pass before any email is sent)

| Gate | Meaning |
|---|---|
| `COMMERCE_LIVE=true` | Live-commerce flag (same gate as live payments). Not set → nothing is ever sent, demo orders can't be emailed. |
| `RESEND_API_KEY` configured | No key → no send. |
| Order status is exactly `delivered` | Only delivered orders qualify. |
| Order has a customer email | Obvious. |
| Order id is not `demo_order*` | Belt-and-braces exclusion of demo-checkout orders. |
| `reviewRequestSentAt` is NULL | Race-safe claim: conditional PATCH `…&reviewRequestSentAt=is.null` — exactly one concurrent caller can win. |

Failure semantics: if the send itself fails after the claim was won, the claim
is **released** (`reviewRequestSentAt` back to NULL) so a future
delivered-transition can retry. The admin action that changed the status
**never fails** because of the email (all hook errors are swallowed).

## Wording rules (enforced by tests, not by hope)

The email contains exactly one ask — the neutral question:

> **How was your experience with this product?**

Subject: `How was your Basco Sports order <orderNumber>?`

Forbidden in any rendered content (automated source assertions run on every
change): asking for 5 stars, "positive review", rewards/gifts/discounts for
reviewing, or any incentive. No incentive program exists, so none is offered.
Each product links to its product page ("Share your feedback") where the
verified-purchase review form lives; reviews then pass through the normal
moderation queue regardless of star rating.

Footer states: "You will receive at most one review request per order." —
true by the claim mechanism.

## Test evidence (2026-08-28, local dev + production Supabase)

| Test | Result |
|---|---|
| Wording assertions (neutral question present; no 5-star/reward/positive-review language in rendered content) | PASS |
| Demo mode (`COMMERCE_LIVE` unset): delivered order → no claim, no send (`reviewRequestSentAt` stays NULL) | PASS |
| Live mode + invalid Resend key: claim taken → send fails → claim **released** (retry possible) | PASS |
| Already-claimed order: re-trigger → no second send, marker unchanged | PASS |
| Server log shows the real Resend call attempt (`Email send failed`) | PASS |
| Admin order update succeeds even while the email path is failing | PASS |

## Enabling in production (when launch gate passes)

1. Set `COMMERCE_LIVE=true` in Vercel env (only after `npm run launch-check`
   passes — see `docs/LAUNCH_READINESS.md`).
2. Set `RESEND_API_KEY` (and optionally `EMAIL_FROM` — must be a verified
   Resend sender domain).
3. Redeploy. Orders that transition to `delivered` after that point will
   receive exactly one request each. Orders delivered *before* the flag is
   enabled can be triggered by re-saving their status (the claim is per-order).

## Files

- `src/lib/review-request.ts` — guards, claim/release, email builder, hooks
- `src/lib/email.ts` — `sendRawEmail` / `isEmailConfigured` exports
- `src/app/api/admin/db/route.ts` — hook on `orders` `update`/`updateBy`
- `supabase/migrations/0003_review_requests.sql` — claim column
