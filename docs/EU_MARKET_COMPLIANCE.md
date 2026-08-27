# EU market compliance

**Checked:** 2026-08-27 · **Status:** architecture ready; live sales BLOCKED until OSS/IOSS registration + GPSR data per SKU.

## VAT & customs

- Distance sales of goods imported from outside the EU to consumers rely on the **Import One-Stop-Shop (IOSS)** for consignments up to €150, or ordinary import VAT above that; intra-EU distance sales use **OSS** once registered in one member state. Registration is an owner action via a member state portal.
- Low-value customs changes are in flux for 2026 (Commission proposals to remove the €150 duty exemption are progressing; final application dates must be re-verified against official sources before enabling EU checkout — do not rely on pre-2026 assumptions).
- Sources: https://eur-lex.europa.eu/eli/reg/2023/988/oj/eng (GPSR), https://europa.eu/youreurope/citizens/consumers/shopping/shopping-consumer-rights/index_en.htm (checked 2026-08-27).

## GPSR product gate

Implemented in the product model (`src/lib/types.ts`): manufacturer identity/address/email, EU Responsible Person, product identification (model/GTIN), safety warnings, compliance documents, market availability and `complianceStatus`. A product without required GPSR data must not be purchasable in the EU — enforced via `marketAvailability.EU = false` defaults and the compliance gate (see PRODUCT_COMPLIANCE_MATRIX.md). Never invent a Responsible Person.

## Consumer rights implemented

- 14-day statutory withdrawal section on /returns with model wording and refund rules (separate from voluntary 30-day policy).
- Pre-contract information on checkout: items, prices, shipping, taxes/duties treatment, delivery estimate, seller identity, policy links, "Pay now" button.
- Statutory legal guarantee separated from any commercial warranty on /warranty and /returns.

## Do not enable EU checkout until

1. OSS/IOSS registration complete (owner action), 2. VAT/duty presentation switched from pending-disclosure to real calculation with a verified rate source, 3. GPSR data approved per SKU (manufacturer + responsible person + warnings), 4. 2026 low-value customs treatment re-verified on official sources, 5. footwear/textile labeling data stored where applicable.
