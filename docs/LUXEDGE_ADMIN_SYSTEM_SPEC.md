# Luxedge Admin System — Feature Spec + Inventory

Source: `github.com/8002salman-ai/luxedge-website` (cloned read-only, commit `bffcb4b`).
Purpose: complete inventory of the Luxedge admin system and a feature spec, so the
same capabilities can be evaluated/ported into Basco Sports (Next.js App Router).

Stack of source: **Vite + React 19 SPA + React Router 7 + Zustand + Tailwind 4**,
serverless API functions under `api/` (Vercel), **Cloudflare Worker** for
SEO/storefront, **Supabase** (Postgres + Auth + Storage) as the database.

> Scope note: this document is an inventory + spec, not a line-by-line audit.
> Panel internals were derived from source headers, section headings, tab/label
> definitions, API call sites and migrations. Counts marked "approx" are from
> file sizes/line counts.

---

## 1. Executive summary

The Luxedge admin is a **single-page, lazy-loaded admin bundle** mounted at
`/admin/*`, guarded by a Supabase-JWT role check, backed by ~60 serverless API
routes and ~31 SQL migrations. It is far broader than a store CRUD panel: it is
an **AI-assisted commerce operations console** covering:

- Catalog + Product editor (9 tabs incl. Commerce/SEO)
- Orders, fulfillment, invoicing
- Promotions, coupons, campaigns, Gift Drop giveaways
- Customers/Users, Categories, Reviews
- Blog CMS + Media (YouTube) Hub
- SEO Engine, Marketing Generator, Marketing & Traffic, Email Marketing, CRM
- AI Studio (AI Hub, AI Import, Variant Gen, Product Scout, Product Research, Listing Task)
- AI Control Center (provider keys, feature switches, routing, spend control)
- Hermes / Salman OS intelligence (research-only ingestion)
- System: CJ supplier, Payments (multi-provider), Shipping (Shippo), Settings, Listing Playbook

Approx size: **~1.2 MB of admin UI code**; `AdminSection.tsx` alone is ~428 KB /
6,277 lines and inlines many route panels. `CatalogAdmin.tsx` ~196 KB,
`ProductScout.tsx` ~107 KB.

---

## 2. Navigation map (sidebar)

Extracted from `src/admin/AdminSection.tsx` (`sections` array, lines ~76–133).

| Section | Item | Route | Source file |
|---|---|---|---|
| **Overview** | Dashboard | `/admin` | `AdminSection.tsx` (`ADashboard`, L277) |
| **Catalog** | Products | `/admin/products` | `CatalogAdmin.CatalogProductsPage` (L161) |
| | Promotions | `/admin/promotions` | `CatalogAdmin.CatalogPromotionsPage` (L2875) |
| | Gift Drop | `/admin/gift-drop` | `GiftDropAdmin.tsx` |
| | Campaigns | `/admin/campaigns` | `CampaignManager.tsx` |
| | Orders | `/admin/orders` | `AdminSection.tsx` (`AOrders`, L923) |
| | Users | `/admin/users` | `AdminSection.tsx` (`AUsers`, L1757) |
| | Categories | `/admin/categories` | `AdminSection.tsx` (`ACategories`, L1774) |
| | Reviews | `/admin/reviews` | `AdminSection.tsx` (`AReviews`, L1886) |
| | Blog Posts | `/admin/blogs` | `BlogManager.tsx` |
| **Media** | Media Hub | `/admin/media` | `MediaManager.tsx` |
| **Marketing** | SEO Engine | `/admin/seo-engine` | `AdminSection.tsx` (`ASEOEngine`, L3439) |
| | Marketing Gen | `/admin/marketing` | `AdminSection.tsx` (`AMarketingGen`, L2271) |
| | Marketing & Traffic | `/admin/marketing-traffic` | `AdminSection.tsx` (`AMarketingTraffic`, L5818) |
| | Email Marketing | `/admin/email-marketing` | `AdminSection.tsx` (`AEmailMarketing`, L5546) |
| | CRM (Leads) | `/admin/crm` | `AdminSection.tsx` (`ACRM`, L5377) |
| **AI Studio** | Variant Gen | `/admin/variant-gen` | `AdminSection.tsx` (`AVariantGen`, L4276) |
| | AI Hub | `/admin/ai` | `AdminSection.tsx` (`AAIHub`, L4955) |
| | AI Import | `/admin/ai-import` | `AdminSection.tsx` (`AAIImport`, L5364) → `AIImportPanel.tsx` |
| | Listing Task | `/admin/listing-task` | `ListingTaskAdmin.tsx` |
| | Product Scout | `/admin/scout` | `ProductScout.tsx` |
| | Product Research | `/admin/product-research` | `ProductResearch.tsx` |
| | AI Control | `/admin/ai-control` | `AiControlCenter.tsx` |
| | AI Intelligence | `/admin/hermes-intel` | `HermesIntel.tsx` |
| **System** | CJ Supplier | `/admin/cj-setup` | `CJSetup.tsx` |
| | Payments | `/admin/payments` | `PaymentsSetup.tsx` |
| | Settings | `/admin/settings` | `AdminSection.tsx` (`ASettings`, L1932) |
| | Listing Playbook | `/admin/settings/listing-playbook` | `ListingPlaybookAdmin.tsx` |

Extra routes not always in the sidebar: `/admin/products/new`,
`/admin/products/edit/:id` (both → `CatalogAdmin.CatalogProductEditor`, L1731),
`/admin/shipping` (`ShippingSetup.tsx`), `/admin/salman-os` (`SalmanOsPanel.tsx`),
`*` → redirect `/admin`.

Mobile nav keys: Home, Listings, Add, Orders, More ("More" opens the full sections drawer).

---

## 3. Access control & auth

### Browser side
- `useAuthStore` (Zustand, `src/store/authStore.ts`): holds `user`, `isAuthenticated`,
  `isAdmin`, `ready`. `isAdmin = user.role === 'admin'`.
- `ProtectedRoute requireAdmin` wraps `/admin/*`; `AdminLayout` also redirects
  to `/admin/login` until hydrated when `!user || !isAdmin`.
- The admin chunk is `lazy()`-imported so storefront bundle stays small.
- No demo/plaintext admin fallback; password is sent once to Supabase.

### Server side (`api/_lib/auth.ts`, `api/_lib/jwt.ts`)
Contract:
- no `Authorization` header → **401**
- invalid/expired/tampered token → **401**
- valid token, `app_metadata.role !== 'admin'` → **403**
- verification not configured → **503 (fail closed)** — never open

Two verification strategies, both read the admin claim from the **verified** token:
1. Local HS256 verification when `SUPABASE_JWT_SECRET` is set (only HS256 accepted,
   timing-safe compare, `exp` enforced).
2. Remote `GET {SUPABASE_URL}/auth/v1/user` when JWT secret absent but
   `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` exist, then check
   `app_metadata.role === 'admin'`.

`requireAdmin(req,res)` is the standard guard used by admin API routes.

---

## 4. Panel feature specs

### 4.1 Dashboard (`ADashboard`)
Real data only (no sample rows). KPI cards link into their sections, a 7/30/90-day
revenue & orders bar chart, recent orders (max 5), order-status breakdown, low-stock
list, Gift Drop live card (claims today / remaining), publishing queue (draft count),
and a quick-actions grid (Import Product, Add Manual, Generate Content, Create
Variants, SEO Optimize, Hermes).
Data: gift-drop state, order stats (paid-only aggregates via `_lib/orders-stats`),
catalog list.

### 4.2 Products — Catalog list (`CatalogProductsPage`, ~1,570 lines)
- DB-backed list from `features/catalog/repository`.
- Columns include readiness, source, margin, species (DOG/CAT/etc.), image status,
  LIVE customer-visibility + per-row reason.
- Filters: readiness state, source type (CJ/KONG/OTHER), species, category,
  image-status, and issue filters (source-unknown, cost-unknown, shipping-unknown,
  low-margin, stock-unknown).
- Actions: edit, quick add (`/admin/products/new`), auto-listing toggle
  ("auto-publish products that become commerce-ready"), CSV import, per-product
  interest stats, seller-chosen column order persisted server-side
  (`/api/admin/table-columns`).
- Stats endpoint: `/api/admin/product-stats`.

### 4.3 Product editor (`CatalogProductEditor`, ~1,140 lines)
Tabs (`EditorTab`), required tabs marked:
`general (req) · pricing (req) · inventory · shipping · images (req) · variants · promotions · commerce · seo`
- **General**: identity, category, brand, description, status.
- **Pricing**: price/compare-at, cost/margin inputs.
- **Inventory**: quantity, ledger, low-stock threshold.
- **Shipping**: weight/dimensions, shipping info.
- **Images**: gallery upload (`/api/upload-image`), image status, alt text.
- **Variants**: sizes/colors matrix, activate/deactivate, low-stock threshold.
- **Promotions**: per-product coupon/offer rules.
- **Commerce**: SUPPLY / ECONOMICS / EVIDENCE / RISKS / FINAL READINESS; editable
  `source_type`, `inventory_source`, `fulfillment_method`, `supplier_url`; plus an
  **AI Intelligence research panel** (read-only confidence, source URLs, risks,
  SEO/marketing opportunity — can never override readiness).
- **SEO**: title/description/slug/canonical/keywords/ALT, JSON-LD structured data,
  social SEO (OG/Twitter/Pinterest), AI content fields (premium title, short/luxury
  description, care, warranty, shipping info), live SEO analysis (score circles,
  issues, internal-link suggestions).
- Easy-create endpoint: `/api/admin/products`.

### 4.4 Orders (`AOrders`)
- Real orders from `luxedge_orders` with authoritative paid-only stats:
  Total Orders, Revenue, Needs Fulfilment, Shipped/Delivered.
- Order list, status lifecycle (paid / awaiting_payment / refunded /
  partially_refunded / shipped / delivered / etc.), detail + fulfillment actions,
  invoice/receipt printing (`LUXEDGE — INVOICE` layout).
- ERP sync status per order (`/api/admin/erp`).
- Orders source endpoint: `/api/checkout?action=orders`.

### 4.5 Users (`AUsers`)
Customer/user management over the Supabase-backed customer records (list, inspect,
role/state). Backed by storefront `customers` table.

### 4.6 Categories (`ACategories`)
Create/rename/delete categories (used by storefront nav + catalog filters).

### 4.7 Reviews (`AReviews`)
Review moderation (approve/reject/delete), linked to product reviews data.

### 4.8 Promotions (`CatalogPromotionsPage`)
- Free Shipping Strategy (threshold rules).
- Coupons (codes, caps).
- Store Offers.
- Ads / Feed Readiness (what blocks Merchant Center / ads).

### 4.9 Gift Drop (`GiftDropAdmin`) & Campaigns (`CampaignManager`)
- Gift Drop: genuine $0 giveaways with a real claims ledger, campaign config
  (active, total, remaining, per-day caps), claims list.
- Campaigns: multi-campaign manager (create/edit by slug), gift-eligible products
  with per-product discount caps, claims ledger. Public state via `/api/gift-drop`,
  `/api/campaigns`; admin via `/api/admin/gift-drop`, `/api/admin/campaigns`.

### 4.10 Blog Manager (`BlogManager`, ~44 KB)
Full CMS over Supabase `blog_cms`: create/edit posts, draft/publish/unpublish,
preview, per-post view counts (`/api/admin/blog-stats`), auto-generate + save SEO
for posts missing/incomplete SEO (never overwrites complete SEO), AI-assisted
writing. n8n/Hermes automation surface: `/api/blog-automation`.

### 4.11 Media Hub (`MediaManager`, ~31 KB)
YouTube-centric media catalog mirroring the blog CMS security model: create/edit
videos, slug, YouTube id/url, duration (ISO-8601), tags, status, related products/
articles/videos, search, delete confirm. Automatic YouTube import and "last synced"
stamp via `/api/media/sync`, `/api/media/status`, stats via `/api/admin/media-stats`,
real media generation via `/api/media/generate`.

### 4.12 SEO Engine (`ASEOEngine`, ~837 lines)
Tabbed SEO workbench: `SEO · Schema · Social · Content · Analysis · Preview`.
Per-page SEO fields (title, meta, keywords, slug, canonical, focus/secondary
keywords, image ALT/title/caption), JSON-LD builder, social SEO, AI content
generation, live SEO analysis (overall score, readability, keyword density, meta
and title length checks, missing-ALT, issues & recommendations, internal-link
suggestions), SERP/social preview.

### 4.13 Marketing Generator (`AMarketingGen`, ~1,168 lines)
Generators for Google Ads (RSA headlines ≤30, descriptions ≤90, display/final URL,
callouts, sitelinks) with ad preview; Meta Ads (FB/IG) with preview; Social posts
(Instagram, Facebook, X thread, LinkedIn, Pinterest, TikTok script); Email marketing
(A/B subject lines, email preview, send via `/api/email/send`); Video scripts &
YouTube; Media Studio (generate real images/videos via `/api/media/generate`);
Copy Vault (saved snippets).

### 4.14 Marketing & Traffic (`AMarketingTraffic`, ~272 lines)
Marketing/traffic configuration and dashboards (AdSense enable toggle and related
marketing config via `src/lib/marketing`).
Note: `TrafficDashboard.tsx` and `AdSenseEarnings.tsx` exist as components
(first-party traffic + real AdSense earnings API `/api/adsense`).

### 4.15 Email Marketing (`AEmailMarketing`, ~272 lines)
Email routing/sending setup (Cloudflare Email Routing addresses), Omnisend
connection status (`/api/omnisend/status`), and a written email playbook.
Management endpoints: `/api/email/routes`, `/api/email/send`, `/api/email/status`.

### 4.16 CRM (`ACRM`, ~169 lines)
Leads captured from storefront conversion tools (welcome popup, WhatsApp, AI chat,
newsletter) with search/filter and status. Endpoints: `/api/crm/list` (admin),
plus public `/api/crm/lead|welcome|subscribe|assistant`.

### 4.17 Variant Gen (`AVariantGen`, ~680 lines)
4-step variant wizard: `1. Product → 2. Attributes → 3. Matrix → 4. Done`.
Generates color/size combinations, dedupes, sets status/inventory/low-stock
thresholds, summary tiles (total, duplicates, active, low stock).

### 4.18 AI Hub (`AAIHub`, ~409 lines)
Central AI operations: provider list/status, model selection, content generators,
links into SEO Engine / Variant Generator / AI Import. Backed by
`/api/ai/{status,generate,test,openrouter-credits}` and
`features/ai/providers` + `features/ai/pricing`.

### 4.19 AI Import (`AIImportPanel`, ~54 KB)
Paste a product URL → server fetches the page (`/api/fetch-page`, SSRF-guarded),
AI researches/structures a listing, then a **Review & Edit** step (never opens a
blank review and never allows saving insufficient evidence) before creating the
product. Applies Listing Playbook rules. Supplier image import via
`/api/import-images`.

### 4.20 Listing Task (`ListingTaskAdmin`, ~21 KB)
Compose a **batch import command**: source platform
(`AliExpress · Amazon · eBay · Shopify · CJ · Other`), URL, count, category,
pricing mode/rule; validate; run batch import; view results. Shared logic in
`features/catalog/listingTask` (`normalizeListingTask`, `validateListingTask`,
`parseListingTaskText`, `applyPricingRule`, `LISTING_TASK_CATEGORIES`).

### 4.21 Product Scout (`ProductScout`, ~107 KB)
Automated sourcing pipeline with candidate stats: Candidates, Shortlisted,
Approved, Published, Rejected, Scout Runs. Evidence panel per candidate
(title, supplier price, shipping cost/days, availability, rating, origin,
category, sizes). Runs through supplier APIs (CJ) with point-budget safety.

### 4.22 Product Research (`ProductResearch`, ~18 KB)
Market research dashboards: source breakdown, trending pet products; uses served
AI/market intelligence data.

### 4.23 AI Control Center (`AiControlCenter`, ~18 KB)
Owner's AI governance page:
- Master Switches
- Control Mode · Cost · Second Opinion
- AI Providers (keys/status)
- Feature-Level AI Switches
- Task Routing Matrix
- Owner Attention Queue
Persists provider keys via `/api/admin/ai-keys` (stored in `app_settings` as
`AI_KEY_<PROVIDER>`), server-side only.

### 4.24 AI Intelligence / Hermes (`HermesIntel`, ~41 KB)
Research-only intelligence from Hermes/Salman OS. Tabs:
`Products · SEO · Free Marketing · Free Listings · Market · Marketing · Ads · Catalog QA`.
Product suggestions carry confidence (insufficient_data → possible → promising →
strong), source URLs, risks, SEO/marketing opportunity. Actions: CREATE DRAFT
(never auto-activates), assess ads readiness, review note, delete. Catalog QA =
deterministic live commerce-truth counts. Intake: `/api/hermes/ingest`.

### 4.25 Salman OS panel (`SalmanOsPanel`, ~13 KB)
Connection status card (CONNECTED/OFFLINE/WAITING + project · env · free-first),
8 AI Owner Modules with RUN NOW / VIEW RESULTS and pause/resume, contract version,
live bridge/scheduler/model/cost/fallback fields. Backed by consolidated
`/api/salman-os` (`GET ?action=status|intelligence|jobs`, `POST run_job|pause_job|resume_job`).

### 4.26 CJ Supplier Setup (`CJSetup`, ~18 KB)
CJ API key management (stored in `app_settings` key `CJ_API_KEY`, server-side only),
what CJ enables, a test search, quick links. Endpoints: `/api/admin/cj-key`,
`/api/suppliers/cj`.

### 4.27 Payments (`PaymentsSetup`, ~24 KB)
Multi-provider payment management. Provider status overview (masked keys, health),
key management, `$0` free-gift orders handling. Providers implemented in
`api/_lib/providers-*`: **Stripe, PayPal, Square, Braintree, Authorize.Net,
Payoneer**, plus `none` ("No Payment Required"). Endpoints:
`/api/admin/payments`, `/api/admin/payment-keys`.

### 4.28 Shipping Setup (`ShippingSetup`, ~11 KB)
Shippo API key, sender address, capabilities, shipping billing (who pays).
Endpoints: `/api/shippo` (validate/rates), `_lib/shippo`.

### 4.29 Settings (`ASettings`, ~339 lines)
General store settings, integrations and configuration.

### 4.30 Listing Playbook (`ListingPlaybookAdmin`, ~18 KB)
Rules applied to every import: Global listing rules + Import automation preset.

---

## 5. API inventory (`api/`, ~60 non-test routes)

Auth column: **admin** = `adminAuth/requireAdmin`; **svc** = service-role secret
server-side; **public** = no admin token.

### Admin endpoints
| Route | Methods | Purpose |
|---|---|---|
| `/api/admin/ai-keys` | GET/POST | Manage AI provider keys (`AI_KEY_<PROVIDER>`) |
| `/api/admin/auto-list` | GET/POST | Toggle auto-publish of commerce-ready products |
| `/api/admin/blog-stats` | GET | Per-post view counts |
| `/api/admin/campaigns` | GET | Campaign registry + claims |
| `/api/admin/cj-key` | GET/POST | CJ API key read/write |
| `/api/admin/erp` | GET | Embani ERP sync (server-side only) |
| `/api/admin/gift-drop` | GET | Gift Drop config + claims ledger |
| `/api/admin/media-stats` | GET | Per-video view counts |
| `/api/admin/payment-keys` | GET/POST | Stripe secret + webhook secret |
| `/api/admin/payments` | GET | Multi-provider status overview |
| `/api/admin/product-stats` | GET | Per-product interest stats |
| `/api/admin/products` | POST | One-shot easy product create |
| `/api/admin/table-columns` | GET/POST | Persist seller column order |

### AI
| Route | Methods | Purpose |
|---|---|---|
| `/api/ai/generate` | POST | Provider-agnostic text generation |
| `/api/ai/status` | GET | Which providers have keys (booleans) |
| `/api/ai/test` | POST | Server-side provider connection test |
| `/api/ai/openrouter-credits` | GET | OpenRouter credit balance |
| `/api/salman-os` | GET/POST | Consolidated Salman OS backend proxy |

### Catalog / supplier / media
| Route | Methods | Purpose |
|---|---|---|
| `/api/suppliers/cj` | POST (+GET) | CJ Dropshipping proxy |
| `/api/import-images` | (admin) | Download supplier images → storage |
| `/api/upload-image` | (admin) | Upload one base64 image |
| `/api/media/generate` | (admin) | Generate real image/video → `product-media` bucket |
| `/api/media/sync` | POST/PATCH | Auto YouTube import/upsert |
| `/api/media/status` | GET | Last sync stamp |
| `/api/fetch-page` | (admin) | Credential-backed page fetch (SSRF-guarded) |
| `/api/google-feed` | GET | Google Merchant Center product feed |
| `/api/merch-stats` | GET | Public merchandising aggregate |
| `/api/img-proxy` | GET | External image proxy (CORS bypass) |

### Blog / CRM / email
| Route | Methods | Purpose |
|---|---|---|
| `/api/blog-automation` | GET/POST/PATCH | n8n/Hermes blog create/publish |
| `/api/crm/assistant` | POST | Public storefront AI assistant |
| `/api/crm/lead` | POST | Public lead capture |
| `/api/crm/list` | GET | Admin CRM leads |
| `/api/crm/subscribe` | POST | Public newsletter signup |
| `/api/crm/welcome` | POST | Public welcome-popup coupon |
| `/api/email/routes` | GET/POST/DELETE | Cloudflare email routing addresses |
| `/api/email/send` | POST | Send from `sales@luxedge.us` |
| `/api/email/status` | GET | Cloudflare email setup status |
| `/api/omnisend/status` | GET | Omnisend key/connection status |

### Commerce / payments / shipping
| Route | Methods | Purpose |
|---|---|---|
| `/api/checkout` | POST/GET | Server-authoritative Stripe Checkout Session + status; also `?action=orders` |
| `/api/checkout-onsite` | POST/GET | Stripe PaymentElement + PaymentIntent on-site flow |
| `/api/webhook` | POST | Stripe webhook (payment-status aware, idempotent) |
| `/api/webhook-paypal` / `-square` / `-braintree` | POST | Other provider webhooks |
| `/api/shippo` | POST | Address validation / rates |
| `/api/adsense` | GET/POST | Real AdSense earnings |
| `/api/market-demand/google-ads` | POST | Admin Google Ads market-demand proxy |
| `/api/market-intel/trends` | GET/POST | Hermes trends job queue |
| `/api/hermes/ingest` | GET/POST | Research-only intelligence intake |
| `/api/gift-drop` / `/api/campaigns` | GET | Public campaign state |

### Shared server libs (`api/_lib/`)
`auth`, `jwt`, `supabase`, `checkout`, `stripe`, `shippo`, `cj`, `providers`,
`payment-providers`, `providers-{authorize-net,braintree,payoneer,paypal,square}`,
`campaigns`, `gift-drop`, `googleAds`, `orders-stats`, `ssrf`.

---

## 6. Database (Supabase migrations 0001–0031)

| # | File | Adds (summary) |
|---|---|---|
| 0001 | initial_schema | V2 core tables (products, suppliers, customers, reviews, ai_providers, agent_jobs/runs/logs, candidates, scores, campaigns, ad tables…) |
| 0002 | auth_rls | Customer-scoped RLS/ownership |
| 0003 | role_grants | Standard Supabase grants on public tables |
| 0004 | reconcile_live | Bring legacy live DB in line with 0001–0003 |
| 0005 | drop_legacy_currency_checks | Drop stale currency/country CHECKs |
| 0006 | products_status_allow_draft | Allow `'draft'` status |
| 0007 | market_intelligence_job_type | Add `MARKET_INTELLIGENCE` job type |
| 0008 | supplier_api_runs | Durable supplier-run ledger + atomic point reservation |
| 0009 | revoke_supplier_runs_mutation | Revoke direct mutation grants |
| 0010 | catalog_management | Merchandising/pricing/inventory/SEO fields; product_images↔variants; promotions |
| 0011 | fix_active_product_image_variant_rls | Anon read of images/variants for ACTIVE products |
| 0012 | hermes_intelligence | 4 research tables (admin-only RLS) |
| 0013 | stripe_orders | Clean `luxedge_orders` table |
| 0014 | order_lifecycle_inventory | Refund columns + `decrement_inventory` RPC |
| 0015 | inventory_reservations | Atomic reservations (reserve/consume/release) |
| 0016 | commerce_readiness | `commerce_readiness`/`source_type`/`inventory_source`/`fulfillment_method`/`supplier_url`/stock/risk fields |
| 0017 | crm_leads | CRM leads table |
| 0018 | app_settings | Key-value admin config store |
| 0019 | crm_newsletter_source | Allow `newsletter` source |
| 0020 | bird_horse_cattle_products | Catalog expansion content |
| 0021 | product_safety_classification | `safety_class` field |
| 0022 | blog_cms | Blog posts source of truth + RLS model |
| 0023 | site_events | First-party analytics events |
| 0024 | site_events_revenue | Revenue/currency on commerce events |
| 0025 | reconcile_out_of_band_catalog_columns | Reconcile live-only columns |
| 0026 | media_videos | YouTube media catalog |
| 0027 | listing_expiry | Optional listing end date |
| 0028 | wishlist_items | Account-backed wishlist |
| 0029 | erp_sync_columns | Per-order ERP sync state |
| 0030 | onsite_checkout_shipping | Product weights + PaymentIntent dedupe |
| 0031 | payment_provider_neutral | Provider-neutral order/payment fields |

Security model seen across admin features: anon reads published/active storefront
data; admin role full access; service-role only server-side; Hermes/research and
`app_settings` admin-restricted; secrets never returned to the browser.

---

## 7. Cross-cutting themes worth copying

1. **Server-authoritative commerce**: the browser never submits prices; checkout
   recomputes from the catalog, reservations prevent oversell, webhooks are
   idempotent and payment-status aware.
2. **Honest commerce-readiness gate**: `ACTIVE` means genuinely sellable
   (readiness model + source/evidence), not just a status flag. Storefront,
   sitemap, feed and admin all derive from one readiness model.
3. **Fail-closed auth**: 401/403/503 with a role claim read only from a verified
   token; no browser-supplied role, no demo fallback.
4. **Secrets server-side only**: AI keys, CJ key, payment keys, Shippo token all
   stored in `app_settings`/env and masked in UI.
5. **AI as assist, not authority**: AI Import has a mandatory review step; Hermes
   suggestions can only CREATE DRAFT; AI can never override readiness.
6. **Admin automation surfaces are token-gated**: ERP, blog-automation, Hermes
   ingest, payments all proxy through admin/service auth.

---

## 8. Basco Sports porting notes

Basco Sports is a different stack (Next.js App Router, edge runtime, custom
`admin-auth` cookie sessions + `admin_users` table with owner/admin roles, its own
`store_settings`), so this is a capability map, not a drop-in.

**Basco already has** (route → equivalent Luxedge panel):
`/admin` Overview · `/admin/catalog` Products · `/admin/orders` Orders ·
`/admin/reviews` Reviews · `/admin/users` Users · `/admin/hermes` AI Intelligence ·
`/admin/integrations` System config · `/admin/settings` Settings ·
`/admin/team` (owner-only) · `/admin/login` + `/api/admin/logout`.

**Luxedge capabilities Basco lacks** (candidates to port, highest value first):
1. **Product editor 9 tabs** (incl. Commerce readiness + SEO) — Basco catalog is
   list-centric; a full editor is the biggest gap.
2. **Promotions / Campaigns / Gift Drop** — coupon + give-away engines.
3. **Blog CMS + Media Hub** — content operations.
4. **AI Studio** — AI Import (URL→listing), Variant Gen, Listing Task, Product
   Scout, Product Research.
5. **AI Control Center** — provider keys + feature switches + routing + spend.
6. **Marketing Generator / SEO Engine / CRM / Email Marketing**.
7. **Payments multi-provider + Shipping (Shippo) + CJ supplier setup**.
8. **Listing Playbook** (import rules).

**Mapping decisions to make before porting**
- Auth: Luxedge uses Supabase `app_metadata.role`; Basco uses cookie sessions +
  `admin_users`. Keep Basco's model and add a `requireAdmin`-style helper (it
  already has `verifySessionToken`) — do not import Supabase JWT auth.
- Data: Luxedge talks to Supabase PostgREST directly from the browser with RLS;
  Basco uses a server `SupabaseAdapter` (`src/lib/admin/db.ts`) + API routes.
  Port panels to Basco's API-route pattern, not direct browser PostgREST.
- UI: Luxedge admin is React Router + Zustand; Basco is Next.js server components
  with client panels. Reuse panel *behavior/spec*, rebuild with Basco's
  components (`src/app/admin/_panels/*`).
- Don't port Luxedge DB migrations verbatim; map each feature to Basco's schema
  (`products`, `store_settings`, `admin_users`, orders) and add only what's needed.

**Suggested phasing**
1. Product editor tabs (general/pricing/inventory/images/variants/promotions/seo).
2. Promotions + Campaigns + Gift Drop.
3. Blog CMS + Media Hub.
4. AI Studio (AI Import, Variant Gen, Listing Task) + AI Control Center.
5. Marketing/SEO/CRM/Email.
6. Payments/Shipping/CJ + Listing Playbook.

---

## 9. Reference — file inventory (source repo)

### Admin components (`src/admin/`)
| File | ~Size | Purpose |
|---|---|---|
| `AdminSection.tsx` | 428 KB / 6,277 L | Admin shell + inlined panels (see §2) |
| `CatalogAdmin.tsx` | 196 KB | Products list, editor (9 tabs), promotions |
| `ProductScout.tsx` | 107 KB | Automated sourcing pipeline |
| `AIImportPanel.tsx` | 54 KB | URL→listing AI import + review |
| `BlogManager.tsx` | 44 KB | Blog CMS |
| `HermesIntel.tsx` | 41 KB | Hermes research intelligence (8 tabs) |
| `CampaignManager.tsx` | 34 KB | Multi-campaign manager |
| `MediaManager.tsx` | 31 KB | YouTube media hub |
| `PaymentsSetup.tsx` | 24 KB | Multi-provider payments |
| `ListingTaskAdmin.tsx` | 21 KB | Batch import task |
| `ListingPlaybookAdmin.tsx` | 18 KB | Import rules |
| `AiControlCenter.tsx` | 18 KB | AI governance |
| `ProductResearch.tsx` | 18 KB | Market research |
| `CJSetup.tsx` | 18 KB | CJ supplier setup |
| `GiftDropAdmin.tsx` | 17 KB | Gift Drop config/ledger |
| `SalmanOsPanel.tsx` | 13 KB | Salman OS connection/modules |
| `AdSenseEarnings.tsx` | 12 KB | Real AdSense earnings |
| `ShippingSetup.tsx` | 11 KB | Shippo config |
| `TrafficDashboard.tsx` | 20 KB | First-party traffic dashboard |
| `__tests__/ADashboard.test.tsx`, `AOrders.test.tsx` | — | Panel tests |

### Serverless API
~60 non-test route files under `api/` plus `worker/{index,seo-meta,sitemap,sitemap-health}.ts`
(Cloudflare Worker for storefront SEO/redirects/sitemap). Full route list in §5.
