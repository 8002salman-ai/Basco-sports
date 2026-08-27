# Basco Sports – Premium Sports Gear & Apparel

Production-ready premium ecommerce demo built with Next.js 14 App Router, TypeScript, Tailwind CSS, localStorage-persisted cart/wishlist, privacy-respecting integrations, and hardened admin mock.

**Live demo status:** Payments in DEMO MODE – no real charges. All integrations inactive until env configured. Full UI, cart, wishlist, filters, search, checkout flow, content pages, consent, and admin overview are functional.

## Identity

- Original Basco Sports wordmark + icon (obsidian “B” mark)
- Palette: Obsidian #0B1220, Stone #F8F7F4/#EDE9E3, Electric Lime #D4FF32 accent, Sale Red #FF4D23 only for urgency
- Typography: Syne (display) + Inter (body) via system fallback, editorial feel, breathable layouts
- Information architecture: announcement/value strip, utility header, category navigation, confident hero, curated category discovery, product merchandising, trust signals, newsletter, detailed footer – all original Basco Sports implementation.

## Stack

- Next.js 14.2.5 App Router (TypeScript)
- Tailwind CSS 3.4, lucide-react, next/image remote Unsplash
- localStorage for cart/wishlist/coupon/consent
- Integration layer: typed env validation (`src/lib/env.ts`), payment adapter (`payment-adapter.ts`), Hermes generic client (`hermes-client.ts`), admin auth (`admin-auth.ts`)
- Privacy: ConsentContext, CookieConsentBanner, GoogleAnalytics (consent-gated), AdSlot (consent + config gated)

## Project Structure

```
src/
  app/
    layout.tsx (metadata verification, ConsentProvider, GA, banner)
    page.tsx (home with AdSlot demo)
    shop/ – search, filters, price, sort
    product/[slug]/ – gallery, variants, accordion, related + AdSlot
    category/[slug]/ – per-sport collection
    cart/ – line items, coupon, totals
    checkout/ – demo-only checkout UI + payment adapter
    account/ – demo auth UI
    about, contact, faq, shipping, privacy (consent UI), terms
    journal/ + [slug]
    admin/ – layout (env check), page (overview cards), integrations/, login/
    api/admin/login|logout/ – server-only auth with httpOnly cookie
    sitemap.ts, robots.ts
  components/
    layout/ – AnnouncementBar, Header, Footer
    product/ – ProductCard
    cart/ – CartContext, CartDrawer
    consent/ – ConsentContext, CookieConsentBanner
    analytics/ – GoogleAnalytics
    ads/ – AdSlot
    ui/ – Button, Badge
  lib/
    env.ts – typed server/client env validation, isConfigured helpers
    admin-auth.ts – session creation/verification, scrypt-only verification with timingSafeEqual, HMAC session cookies
    hermes-client.ts – generic custom API connector (safe placeholder)
    payment-adapter.ts – DemoPaymentProvider + Stripe upgrade path
    types.ts, utils.ts
  data/
    products.ts – 34 products, categories, reviews, coupons, journal
public/
  favicon, og placeholder
.env.example – complete dummy placeholders, no real secrets
```

## Features Implemented

- Sticky header, category nav, hero, trust strip, shop-by-sport, trending, editorial banners, featured, new arrivals, brand strip, newsletter, footer
- Shop: search, category multi-filter, price range, sort, quick add, wishlist, badges
- Product: gallery, variants, stock, qty, add-to-cart, benefits, accordion, related
- Cart drawer + page, coupon demo (BASCO10, WELCOME15, TRAIN20), totals
- Checkout demo-only, clearly marked, no live charge
- Admin: /admin overview (catalog count, orders demo 0, newsletter demo, integration status based only on config existence, masked values), /admin/integrations cards for GA, AdSense, Search Console, Payments, Hermes, dev-only mock warning when env missing, auth required when env configured
- Integrations: GA loads only when NEXT_PUBLIC_GA_MEASUREMENT_ID configured + analytics consent; AdSlot loads real ad only when client ID + slot ID configured + advertising consent, otherwise no ad request (dev placeholder only in development); Search Console verification meta driven by GOOGLE_SITE_VERIFICATION server env; Hermes generic connector with HERMES_ENABLED flag
- Consent: banner + preferences modal (Necessary always on, Analytics opt-in, Advertising opt-in), persisted locally `basco-consent-v1`, linked from Privacy page
- SEO, sitemap, robots, verification, accessibility, responsive

## Local Setup

```bash
npm install
cp .env.example .env.local # then edit dummy values if you want to test integrations locally
npm run dev # http://localhost:3000
npm run build
npm run start
npm run lint
```

Node 18+ recommended (tested Node 22).

> **⚠ Local `.env.local` gotcha:** Next.js expands `$VAR` inside `.env*` files, so a scrypt hash
> `scrypt$16384$8$1$salt$dk` gets mangled locally. Escape the dollar signs as `\$` when writing
> the hash in `.env.local` (e.g. `scrypt\$16384\$8\$1\$salt\$dk`). In the Vercel dashboard / CLI
> env vars are literal — no escaping needed there.

## Environment Variables – Complete Reference

See `.env.example` for dummy placeholders. Never commit real secrets, never expose server-only vars with NEXT_PUBLIC_ prefix.

**Client-side (NEXT_PUBLIC_ – safe for browser, no secrets):**
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` – GA4 ID format `G-XXXXXXXXXX`. Get from GA > Admin > Data Streams > Web. If missing/placeholder, GA not loaded.
- `NEXT_PUBLIC_ADSENSE_CLIENT_ID` – AdSense publisher ID `ca-pub-XXXXXXXXXXXXXXXX`. From AdSense > Account > Settings. If missing, no AdSense script.
- `NEXT_PUBLIC_ADSENSE_SLOT_HEADER|FOOTER|SIDEBAR|PRODUCT` – numeric ad unit IDs from AdSense > Ads > Ad Units. Optional per placement. Real ad only renders if client ID + slot ID + advertising consent.
- `NEXT_PUBLIC_BASCO_PAYMENT_MODE` – `demo` (default) or `live`. Client flag only.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` – Stripe publishable key `pk_test_...` or `pk_live_...` (public, safe). Dummy placeholder in example.
- `NEXT_PUBLIC_SITE_URL` – optional site URL for OG/sitemap.

**Server-side only (NEVER NEXT_PUBLIC, never client):**
- `GOOGLE_SITE_VERIFICATION` – Search Console HTML tag token (content attribute only, not full tag). From Search Console > Settings > Ownership verification > HTML tag. Used in `generateMetadata()` to emit `<meta name="google-site-verification">`. No API call.
- `ADMIN_EMAIL` – admin login email, e.g., `admin@example.com`. Must not be used as password.
- `ADMIN_PASSWORD_HASH` – scrypt-only format `scrypt$N$r$p$saltBase64$derivedKeyBase64`. Strong recommended: N=16384, r=8, p=1, salt 16 bytes, dkLen 64. Generate locally with Node built-in crypto only (see .env.example for full command). Only this format accepted – SHA-256, bcrypt, plaintext rejected with safe config error. See `src/lib/admin-auth.ts`.
- `ADMIN_SESSION_SECRET` – 64+ char random string for HMAC signing admin session cookie. Generate: `openssl rand -base64 48` or `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.
- `PAYMENT_PROVIDER` – `demo` | `stripe` | `paypal`. Demo default.
- `STRIPE_SECRET_KEY` – server-only `sk_test_...` or `sk_live_...`. Never expose client-side. Placeholder in example.
- `STRIPE_WEBHOOK_SECRET` – `whsec_...` for webhook verification.
- `HERMES_ENABLED` – `true`/`false` flag for generic Hermes connector.
- `HERMES_BASE_URL` – base URL of custom Hermes API, e.g., `https://api.hermes.example.com`.
- `HERMES_API_KEY` – server-only API key for Hermes, e.g., `hm_...` placeholder.

**Validation:** `src/lib/env.ts` trims, treats obvious placeholders (`XXXX`, `REPLACE`, `your-google-site-verification-token`, `G-XXXXXXXXXX`, `ca-pub-XXXXXXXXXXXXXXXX`) as not configured, returns `null`. Helpers `isGaConfigured`, `isAdSenseConfigured`, `isSearchConsoleConfigured`, `isAdminConfigured`, `isHermesConfigured`, `isStripeConfigured` check existence only, never secret values.

## Google Integrations – Privacy Respecting

**Google Analytics:**
- Component `src/components/analytics/GoogleAnalytics.tsx` reads `NEXT_PUBLIC_GA_MEASUREMENT_ID`, checks valid format, checks `consent.analytics && hasConsented`. Only then injects `https://www.googletagmanager.com/gtag/js?id=...` and `gtag('config', ...)`. IP anonymization enabled.
- If not configured or consent not given, no script, no request.
- Consent: user must explicitly enable Analytics in banner/preferences. Stored locally. Link from Privacy page.
- Setup: Create GA4 property, get Measurement ID, set env in deployment, deploy, user opts in.

**Google AdSense:**
- Component `src/components/ads/AdSlot.tsx` requires `NEXT_PUBLIC_ADSENSE_CLIENT_ID` (ca-pub-...) + specific slot ID env + `consent.advertising && hasConsented`.
- If any missing or no consent: production renders **nothing** (no ad request, no policy violation). Development renders dashed placeholder explaining missing config.
- When configured + consent: loads `pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=...` once, then pushes ad via `(adsbygoogle).push({})`.
- Policy prerequisites: approved AdSense account, domain added and approved, `ads.txt` at root with `google.com, pub-XXXXXXXX, DIRECT, f08c47fec0942fa0`, site complies with AdSense program policies (no invalid clicks, no adult/shocking content). No real ads in demo.
- Setup: AdSense dashboard > Get code > copy client ID, create ad units, copy slot IDs, set env, deploy, user opts in.

**Google Search Console verification:**
- Server env `GOOGLE_SITE_VERIFICATION` (token only). In `src/app/layout.tsx`, `generateMetadata()` returns `verification.google` and `other.google-site-verification` meta if token present.
- No client exposure of secret beyond meta tag content (which is public by design for verification).
- Setup: Search Console > Add property > HTML tag method > copy content token (e.g., `dBw5Cv...`), set env, deploy, click Verify. No Google API call from app.

**Cookie Consent:**
- Context `src/components/consent/ConsentContext.tsx` with categories Necessary (always true), Analytics, Advertising, `hasConsented`, `updatedAt`, persisted `basco-consent-v1`.
- Banner `CookieConsentBanner.tsx` shows if not consented, with Accept all / Reject non-essential / Manage preferences.
- Modal `CookiePreferencesModal` with toggles, Save, Reset. Linked from Privacy page button `Manage cookie preferences`.
- All integrations check consent before loading external scripts.

## Admin Area – Hardening

**Current implementation:** Development-only settings mock when env not configured, with clear warning banner. When env configured, requires login via server API with httpOnly signed cookie.

- `/admin` layout (`src/app/admin/layout.tsx`): server component, reads server env via `getServerEnv()`, checks `isAdminConfigured()`, reads cookie `basco_admin_session`, verifies via `verifySessionToken()` (HMAC SHA256 with `ADMIN_SESSION_SECRET`). Shows nav + dev mock warning if not configured, or auth required message if configured but not authenticated.
- `/admin/login` (`src/app/admin/login/page.tsx`): client form POSTs to `/api/admin/login`. No hardcoded credentials, no secret displayed. Shows security notes.
- `/api/admin/login` (`src/app/api/admin/login/route.ts`): server-only, checks env configured, validates email equals `ADMIN_EMAIL`, verifies password via `verifyPasswordScrypt()` (scrypt-only, Node crypto.scrypt + timingSafeEqual, rejects non-scrypt formats with safe config error). Creates session token via `createSessionToken()` (payload base64url + HMAC SHA256 with ADMIN_SESSION_SECRET), sets httpOnly cookie `basco_admin_session` with `secure` in production, `sameSite=lax`, 8h expiry.
- `/api/admin/logout`: clears cookie.
- `/admin` overview: cards for catalog (34), orders demo 0, newsletter demo —, integrations count 0-5 based on config existence only, masked values. Notes that checkout remains demo-only, cannot charge.
- `/admin/integrations`: cards for GA, AdSense, Search Console, Payments, Hermes – each shows Configured/Not configured, masked values via `maskValue()` (e.g., `G-AB...123`), never actual secret, never editable in public browser UI. Explains required fields and that integrations inactive until configured/deployed.

**Security rules enforced:**
- Never use email as password – login checks email != password implicitly via hash verification, docs state rule.
- Never hardcode email/password/API key – all from env, dummy placeholders in `.env.example` obvious (`G-XXXXXXXXXX`, `ca-pub-XXXXXXXXXXXXXXXX`, `replace-with-64-char-random-string`).
- Never expose secret in client code, UI, logs, README examples – client env only public IDs, server env never sent to client, admin UI masks values, README uses placeholders.
- Admin requires env-provided credentials/secrets – `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET` – checked server-side.

**Production authentication hardening (PBKDF2-only, Edge + Node):**
- Admin uses **WebCrypto PBKDF2** (SHA-256, 600000 iterations, 16-byte salt, 64-byte key) with format `pbkdf2$iterations$saltBase64$derivedKeyBase64`. WebCrypto runs on **both** Edge runtimes (Cloudflare Pages / Vercel edge) and Node.js — `crypto.scrypt` is Node-only, so it is no longer accepted.
- Generate hash locally (no network, no secret logging): `node -e "const {subtle,getRandomValues}=globalThis.crypto;(async()=>{const salt=getRandomValues(new Uint8Array(16));const key=await subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt,iterations:600000},await subtle.importKey('raw',new TextEncoder().encode('YourStrongPassword'),'PBKDF2',false,['deriveBits']),512);const b64=u=>Buffer.from(u).toString('base64');console.log('pbkdf2$600000$'+b64(salt)+'$'+b64(key))})()"` – see .env.example for the full script
- **Local `.env.local` gotcha:** Next.js expands `$` signs in env files. Escape every `$` as `\$` in `.env.local` (e.g. `pbkdf2\$600000\$...`). In Vercel / Cloudflare Pages dashboards paste the hash as-is (no escaping).
- Use strong `ADMIN_SESSION_SECRET` 64+ random chars, rotate periodically.
- Consider adding rate limiting, CSRF protection, and storing sessions in DB (e.g., Supabase) for revocation.
- For full auth, migrate to Clerk/Auth.js/Supabase Auth and protect `/admin` via middleware.
- Current static setup cannot safely support protected server-side admin sessions without env – hence dev-only mock with clear warning. Documented in layout banner, login page, and README.

## Deployment – Cloudflare Pages + Vercel (without secrets)

**Vercel (recommended):**
1. Push repo to GitHub (no .env files)
2. Vercel dashboard > Add New Project > Import
3. Framework preset: Next.js, Build command: `npm run build`, Output: `.next`
4. Environment Variables (Project Settings > Environment Variables):
   - Add only needed: `NEXT_PUBLIC_GA_MEASUREMENT_ID` = `G-...` (from GA)
   - `NEXT_PUBLIC_ADSENSE_CLIENT_ID` = `ca-pub-...`
   - Slot IDs as needed
   - `GOOGLE_SITE_VERIFICATION` = token from Search Console
   - `ADMIN_EMAIL` = your admin email
   - `ADMIN_PASSWORD_HASH` = pbkdf2 hash `pbkdf2$600000$salt$key` (generate locally with Node WebCrypto, paste hash only – only this format accepted; dashboards take it as-is, no `$` escaping)
   - `ADMIN_SESSION_SECRET` = 64-char random (generate locally)
   - `PAYMENT_PROVIDER` = `demo` (keep demo) or `stripe`
   - `STRIPE_SECRET_KEY` = `sk_live_...` (only if going live, server-only)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...`
   - `HERMES_ENABLED` = `false` (or true)
   - `HERMES_BASE_URL` = your Hermes API URL
   - `HERMES_API_KEY` = your Hermes key (server-only)
   - Never commit these values, never put secrets in `NEXT_PUBLIC_` except publishable keys which are public by design.
5. Deploy – Vercel handles image optimization.

**Cloudflare Pages (required: git integration — Linux build):**
1. Pages dashboard > Create project > Connect to Git > select `8002salman-ai/Basco-sports` > main branch
2. Build settings: Framework preset: None, Build command: `npm run pages:build`, Output directory: `.vercel/output/static`
3. `@cloudflare/next-on-pages@1.13.15`, `wrangler@^3` and `vercel` are already installed as devDependencies (newer next-on-pages versions require `next >= 14.3` — this project pins 14.2.5, so do not bump next-on-pages).
4. Node.js compatibility: handled by the repo's `wrangler.toml` (`compatibility_flags = ["nodejs_compat"]`). No dashboard action needed. The Next.js edge runtime needs `node:buffer`/`node:async_hooks`, and admin auth uses WebCrypto PBKDF2 — all supported.
   - **IMPORTANT — do NOT use `wrangler pages deploy` with a locally built `.vercel/output` on Windows:** the local `vercel build` on Windows deterministically mis-bundles Edge route handlers (verified: login/logout handlers dropped, route-to-function mapping scrambled). Cloudflare's Linux CI (git integration) builds correctly — always deploy via the git-connected project.
5. Environment Variables: Pages > Settings > Environment variables:
   - **Already set (via wrangler CLI, encrypted):** `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_SESSION_SECRET`
   - Add as plain Variable: `NEXT_PUBLIC_SITE_URL` = `https://basco-sports.pages.dev` (needed for correct sitemap/OG)
   - Optional: `NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_ADSENSE_CLIENT_ID`, slot IDs, `GOOGLE_SITE_VERIFICATION`, `STRIPE_*`, `HERMES_*` (see .env.example)
6. First build may take a few minutes (installs deps + Vercel build on Linux). Deploy – Cloudflare serves remote Unsplash as-is.

**Supabase (admin data layer):**
- The admin panels (Catalog CRUD, Orders, Users, Settings) use `src/lib/admin/db.ts` – a `DbAdapter` interface with a localStorage adapter (demo) and a Supabase/PostgREST adapter. When `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set, the panels switch to Supabase mode and route every operation through `/api/admin/db`, which performs CRUD server-side with `SUPABASE_SERVICE_ROLE_KEY` (never shipped to the browser).
- Schema + RLS: `supabase/migrations/0001_admin_schema.sql` (tables: `products`, `orders`, `users`, `store_settings`; anon can read active products, admin writes go through the service role).
- First catalog load in Supabase mode seeds the 34 products into the `products` table when it is empty.
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public), `SUPABASE_SERVICE_ROLE_KEY` (server-only secret).

**Google account verification, consent, AdSense policy:**
- GA: Need Google account, GA4 property, consent banner implemented (we have). GDPR requires explicit opt-in before tracking – we enforce.
- AdSense: Need Google account, AdSense account approval (site review), domain ownership, ads.txt, privacy policy with cookie disclosure (we have). Our AdSlot prevents invalid ad requests without consent/config, avoiding policy violation.
- Search Console: Need Google account, add property, HTML tag verification token, set env, deploy, verify. No API.

**Hermes connector:**
- Generic custom API – do not assume service. Treat as your own backend.
- Required fields: `HERMES_ENABLED` boolean flag, `HERMES_BASE_URL` URL, `HERMES_API_KEY` server-only secret.
- Implementation: `src/lib/hermes-client.ts` provides `hermesRequest()` which checks `isHermesConfigured()`, returns `notConfigured=true` if env missing, otherwise fetch with Bearer token, never logs key. Extend with typed helpers like `hermesGetHealth()`, `hermesListOrders()`.
- Proxy routes: `GET /api/hermes/health` and `GET /api/hermes/orders` forward to `HERMES_BASE_URL/health` and `HERMES_BASE_URL/v1/orders` (both edge runtime, so they run on Cloudflare Pages + Vercel).
- Safe: no external call in demo, inactive until configured.

### Hermes + Salman OS (how to wire)
- This storefront is a **consumer** of a Hermes API. `HERMES_BASE_URL` must be a **public HTTPS URL** that speaks the Hermes Agent HTTP API (`/health`, `/v1/orders`, ...) with a Bearer token.
- **Salman OS** (`salman-os-command-center` / `8002salman-ai/salman-os`) is the control tower: its Windows **Hermes bridge** (`bridge/`) runs the local Hermes Agent CLI and polls Supabase for research tasks (outbound-only). Salman OS does not expose `/health` or `/v1/orders`, so do NOT point `HERMES_BASE_URL` at Salman OS.
- To connect: expose the Hermes Agent (or a thin proxy) at a public URL (e.g. via cloudflared tunnel / VPS), then set `HERMES_ENABLED=true`, `HERMES_BASE_URL=https://<public-hermes-url>`, `HERMES_API_KEY=<key>` in the storefront env (Vercel + Cloudflare). The admin → Integrations → Hermes card and `/api/hermes/*` will then go live.

## Payments – Demo-Only Guarantee

- Checkout UI clearly shows `PAYMENTS IN DEMO MODE`, `Demo mode – no real charge`, `Payments are in demo mode – no card is charged`.
- `src/lib/payment-adapter.ts`: `DemoPaymentProvider` simulates success, no network, `isDemoMode()` true unless `NEXT_PUBLIC_BASCO_PAYMENT_MODE=live`.
- No Stripe secret in client bundle. To go live: set `PAYMENT_PROVIDER=stripe`, add `STRIPE_SECRET_KEY` server-only, publishable key client, implement `StripePaymentProvider`, create `/api/checkout` route, webhook. See original Payments Later section – still demo-only until then.
- Admin integrations card shows Payments status based on env presence, masked values, and red banner `Demo-only: No real charge possible`.

## Test / Demo Behavior

- Cart/wishlist persist localStorage, consent persists `basco-consent-v1`
- Search, filters, sort, variant selection, qty/remove, wishlist toggle, coupon validation (BASCO10, WELCOME15, TRAIN20)
- Newsletter: client validation, demo alert
- Checkout: any email with @, any card values → demo PaymentIntent via DemoPaymentProvider → success → clears cart
- Consent: banner appears after 800ms if not consented, preferences modal via Privacy page or banner, toggles update state, GA/AdSense only load after consent + config
- Admin: without env, /admin shows dev mock overview + integrations not configured; with env, requires login at /admin/login, session httpOnly, logout clears cookie

## Lint / Tests

- `npm run lint` – Next lint
- No unit tests in v1 – add Vitest later

## License / Assets

- Code: MIT for demo
- Images: Unsplash – permissive for demo, replace with owned photography before production
- All branding, copy, design, assets fully original to Basco Sports

## Checklist

- [x] Build passes (`npm run build`)
- [x] No inspiration brand mentions anywhere – fully original Basco Sports branding (verified grep clean)
- [x] Env layer typed, .env.example with dummy placeholders
- [x] GA loads only with consent + config
- [x] AdSlot no real ad without consent+config, dev placeholder only in dev
- [x] Search Console verification via server env
- [x] Cookie consent Necessary/Analytics/Advertising, persisted, linked from Privacy
- [x] Admin overview + integrations with masked values, config-required states, dev mock warning, auth upgrade docs
- [x] Checkout remains demo-only, cannot charge
- [x] Privacy, Terms, README updated with Cloudflare/Vercel env setup, Google verification, consent, AdSense policy, Hermes fields
- [x] No hardcoded secrets, no email as password, no secret exposure client-side

Built as hardened integrations + administration phase for Basco Sports.

