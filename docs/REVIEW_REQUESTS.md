# Post-Delivery Review Request Emails

Automatic, **neutral** review-request email sent once after an order is
delivered. FTC Consumer Reviews & Testimonials Rule compliant.

Status: implemented; behavior verified automatically by `npm test`. **Dormant
by design** until both gates below are enabled — demo orders are never emailed.

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

Forbidden in any rendered content (asserted on every `npm test` run): asking
for 5 stars, "positive review", rewards/gifts/discounts for reviewing, or any
incentive. No incentive program exists, so none is offered.
Each product links to its product page ("Share your feedback") where the
verified-purchase review form lives; reviews then pass through the normal
moderation queue regardless of star rating.

Footer states: "You will receive at most one review request per order." —
true by the claim mechanism.

## Automated verification (`npm test`)

`npm test` runs `scripts/verify-review-request.mjs`, which compiles the real
`src/lib/review-request.ts` chain (with `email.ts` + `supabase-rest.ts`) and
drives it through its lifecycle against a stubbed Supabase REST API and a
local HTTP stand-in for Resend. Any failed assertion exits 1.

| Assertion | Behavior proven |
|---|---|
| Wording & escaping | Neutral question present exactly once; no 5-star / "positive review" / reward / gift / incentive language; order number, customer name, item names and variant labels HTML-escaped; product links slug-derived |
| Gate: `COMMERCE_LIVE` | Off → `commerce-not-live` with zero DB calls and zero emails |
| Guard order | Missing order → `order-not-found`; `shipped` → `not-delivered`; bad email → `no-email`; `demo_order*` id → `demo-order` — the claim is never attempted in any of these cases |
| Happy path | Exactly one email; escaped customer content in the rendered HTML; subject carries the order number; claim marker set |
| One per order | Re-trigger → `already-requested`, no second email |
| Send failure | Claim won → send fails → `send-failed-claim-released`, marker back to NULL; retry then succeeds and re-claims |
| Admin hooks | `update`/`updateBy` with a delivered patch send exactly once; non-delivered patches and garbage input never throw and never send |

The originally documented manual evidence (2026-08-28, local dev + production
Supabase: real Resend call attempt visible in logs, admin order update
succeeding while the email path fails) is covered by the outage/release and
swallowed-hook scenarios above, which now run automatically.

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
- `scripts/verify-review-request.mjs` — automated verification (`npm test`)
