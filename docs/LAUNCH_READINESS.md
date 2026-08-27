# Launch readiness

**Decision:** DO NOT ENABLE LIVE PAYMENTS — BLOCKERS REMAIN.

## P0 blockers

- [ ] Verified legal business/trader name and address
- [ ] Verified support and returns contact
- [ ] Production policies reviewed and consistent with code
- [ ] Shipping countries, delivery basis and delay process configured
- [ ] Tax/customs treatment reviewed
- [ ] Payment provider, webhook and refund operations validated
- [ ] Product evidence matrix completed for every live SKU
- [ ] EU GPSR manufacturer and Responsible Person details completed for EU listings
- [ ] Unsupported third-party marks/certifications and seeded reviews removed
- [ ] Exact-product image rights/provenance verified
- [ ] Accessibility, privacy/consent and security testing completed

## Current technical posture

- Payment mode remains demo-only.
- Demo catalog data and stock imagery must not be treated as production inventory.
- Business identity source is `src/config/business.ts`; null values are intentional launch blockers.
- No technical change in this repository constitutes legal approval.

## Owner sign-off required

The owner must supply verified business identity, markets, tax setup, fulfillment process, supplier evidence, image licenses, safety/conformity documents, and counsel/accounting review where applicable.
