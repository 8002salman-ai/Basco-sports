# Basco Sports – global shipping architecture

**Checked:** 2026-08-27. Implementation: `src/lib/shipping.ts`, `src/lib/fulfillment.ts`, `src/config/markets.ts`.

## Zones

US · UK · EU · NORWAY · CANADA · GCC · REST_OF_WORLD. Each market maps to exactly one default zone; zones carry no jurisdiction logic (that lives in `legalRegion`).

## Methods (config, not code)

| Method | Transit (after dispatch) | Status |
|---|---|---|
| Standard International | 7–14 business days est. | Planning default – NOT carrier-verified |
| Express International | 3–7 business days est. | Planning default – NOT carrier-verified |

Rules baked into the engine:

1. Every method carries `verified` and a written `basis`. `verified:false` methods render as estimates only and checkout cannot open while they are unverified.
2. Rates are USD master prices per zone, stored in config. Replacing planning defaults with agreed carrier rates is a config edit, not a code change.
3. Destinations with no covering method get `quoteShipping() → []` and checkout displays "Shipping is currently unavailable to <country>". No invented rates, ever.
4. Customer-facing wording is neutral: "Tracked international delivery", "Estimated X–Y business days in transit", "Fulfilled by Basco Sports". No warehouse claims (US/UK/EU/Pakistan) appear on storefront pages; customs paperwork always states the true dispatch country.
5. Store-level incentives (e.g. free standard shipping over $100) are policy lines applied to quotes, clearly separated from carrier cost.

## Fulfillment routing

Priority is fixed by policy and cannot be reordered by cost: (1) legal eligibility, (2) product compliance approval, (3) inventory at origin, (4) transit time, (5) cost, (6) customs/tax impact. Active origins today: PK hub and supplier-direct (both dispatch from PK, truthfully declared on customs docs). UAE/UK/EU/US origins are scaffolded inactive until inventory genuinely exists there — the code will never claim local stock that doesn't exist.

## Carrier adapters

Deliberately vendor-neutral. DHL/UPS/FedEx/Aramex/EMS or aggregators plug in later behind the same `quoteShipping` interface; none may be enabled without credentials AND an operational agreement, and label/customs data must remain accurate (country of origin ≠ dispatch country ≠ seller country ≠ customer country).
