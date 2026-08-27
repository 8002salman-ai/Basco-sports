# Basco Sports – global commerce audit

**Checked:** 2026-08-27 (repo `main` @ 69edb0c + working tree; live: basco-sports.vercel.app)

## Summary

The store was a US-demo storefront with a single hardcoded currency/checkout path. This audit found and this workstream addressed:

| Area | Found | Status |
|---|---|---|
| Currency | USD-only `formatPrice`, no conversion | Currency engine added (USD master, configured FX, commercial rounding, Intl formatting) |
| Country | No concept of destination | Market selector + persisted preference + timezone-only suggestion (no IP/GPS) |
| Shipping | Hardcoded $9.50/“2-4 days”/“Express 1-2 days $18” — fabricated | Zone-based shipping engine, `verified:false` planning rates, honest estimates, safe failure |
| Tax | Fixed 8% “Tax (est.)” for everyone — wrong in every market | Jurisdiction tax engine; nothing shown as calculated until registrations complete; honest DAP/D disclosure |
| Duties | Not handled | Duty modes per market (DDP-pending / DAP-disclosed), disclosed before checkout |
| Fulfillment | Not modeled | Internal routing model (PK active; US/UK/EU/UAE/SUPPLIER_DIRECT scaffolded), priority order fixed, no customer-facing origin claims |
| Demo claims | FIFA Quality Pro, Flyknit/ACC/ZoomX/Cushlon/Dri-FIT ADV/Gore-Tex/Vibram/Polartec/Pittards/CoolMax/Pertex, “Authentic”, fake 2-year warranty, fake compare-at prices, seeded ratings/reviews, fake phone/London branding | Removed/neutralized catalog-wide; reviews emptied; compare-at removed; launch-check enforces |
| Checkout | 3-country hardcoded select, ambiguous button text | Country selector from market config, quotes with estimates, duties disclosure, “Pay now …” button, policy links |
| Legal pages | Demo-only terms/privacy/shipping | Legal centre + 9 policy pages incl. regional sections, effective/updated dates, truthful identity posture |
| Payments | Demo (correct) | Remains demo; `npm run launch-check` gates (currently BLOCKED by identity data) |

## Payment freeze

Checkout still runs in demo mode. `checkoutEnabled` is false for every market in `src/config/markets.ts` until the launch gate passes; the gate currently reports BLOCKED for missing verified business identity (name, address, support email, return address) and EU Responsible Person data.

## Countries configured (selector-visible)

US, NO, GB, ES, DE, FR, IT, NL, BE, IE, AT, PT, SE, DK, FI, PL, CH, CA, AU, NZ, AE, QA, SA, KW, BH, OM, JP, SG, MY. Architecture accepts additional entries without code changes (100+ supported by design; every country must exist in `markets` before checkout accepts it — enforced by `getMarket` returning null otherwise).

## Related docs

- docs/GLOBAL_MARKET_MATRIX.md — per-country table
- docs/GLOBAL_SHIPPING_ARCHITECTURE.md — zones/methods/rates policy
- docs/GLOBAL_TAX_DUTY_MATRIX.md — tax/duty handling per region
- docs/NORWAY_MARKET_COMPLIANCE.md, docs/UK_MARKET_COMPLIANCE.md, docs/EU_MARKET_COMPLIANCE.md, docs/USA_MARKET_COMPLIANCE.md
- docs/LEGAL_COMPLIANCE_AUDIT.md, docs/PRODUCT_COMPLIANCE_MATRIX.md, docs/IP_AND_PRODUCT_CLAIMS_AUDIT.md, docs/PRIVACY_DATA_MAP.md, docs/LAUNCH_READINESS.md
