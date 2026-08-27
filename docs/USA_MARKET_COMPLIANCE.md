# USA market compliance

**Checked:** 2026-08-27 · **Status:** default storefront market; live sales BLOCKED by launch gate + sales-tax nexus review.

## Federal ecommerce rules (applicable at launch)

| Rule | Source (checked 2026-08-27) | Status |
|---|---|---|
| Mail, Internet, Telephone Order Merchandise Rule — shipping promises need a reasonable basis; delays need notice + consent/refund | https://www.ftc.gov/legal-library/browse/rules/mail-internet-or-telephone-order-merchandise-rule | Shipping engine shows verified-flagged estimates only; no promise until carrier agreement |
| Consumer Reviews & Testimonials Rule — no fake/seeded reviews or ratings | https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials | All seeded ratings/review counts zeroed; reviews array emptied; launch-check blocks reintroduction |
| Textile/Wool/Care labeling — fiber content, origin, RN, care instructions on apparel listings/labels | https://www.ftc.gov/news-events/topics/tools-consumers/apparel-labeling | Pending supplier data per SKU (matrix tracks) |
| Made in USA standard | ftc.gov Made in USA guidance | No origin claims anywhere in catalog |

## State sales tax

`taxMode: US_SALES_TAX_PENDING`. No tax is collected or displayed as calculated until a state-by-state nexus review is done and a rate engine (or provider auto-tax) is configured. The checkout copy states sales tax appears before payment once configured. Applicability of state privacy laws (CCPA/CPRA etc.) is documented as *undetermined — small early-stage seller* in PRIVACY_DATA_MAP.md and must be reassessed as thresholds are approached. No generic Prop 65 warnings were added; warnings require actual product compliance inputs.

## CPSC

Applicability per SKU (children's items, apparel flammability, helmets/protective gear) is tracked in PRODUCT_COMPLIANCE_MATRIX.md; no children's SKUs are currently listed. CPSIA evidence and the 2026 CPSC eFiling rule applicability must be checked per SKU before listing any regulated product.

## Do not enable US checkout until

1. business identity verified (gate), 2. sales-tax nexus review + collection configured, 3. shipping methods carrier-verified, 4. SKU-level textile/origin/care data present, 5. image provenance recorded.
