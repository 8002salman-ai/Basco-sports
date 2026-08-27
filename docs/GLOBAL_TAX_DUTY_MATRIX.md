# Basco Sports – tax & duty matrix

**Checked:** 2026-08-27. Implementation: `src/lib/tax.ts` + `taxMode/dutyMode` in `src/config/markets.ts`.

| Region | Model | Customer sees | Blocker before live collection | Official source (checked 2026-08-27) |
|---|---|---|---|---|
| USA | `US_SALES_TAX_PENDING` | "Applicable sales tax is shown before payment once configured." No tax line until nexus is configured. | State-by-state nexus review + rate engine | FTC business guidance (ftc.gov) |
| EU | `VAT_INCLUSIVE_PENDING` | Honest note: VAT/duties being finalized; final charges shown before payment, nothing added after ordering | OSS/IOSS registration via a member state; GPSR data per SKU | EUR-Lex Reg. 2023/988; Your Europe consumer pages |
| UK | `VAT_COLLECTED_AT_CHECKOUT` (≤£135 consignments, once registered) | Pending note until registration | HMRC VAT registration; >£135 consignments = import VAT/duties on arrival | GOV.UK "VAT and overseas goods sold directly to customers in the UK" |
| Norway | `VAT_COLLECTED_AT_CHECKOUT` (VOEC, goods < NOK 3,000/item) | Pending note until registration; >NOK 3,000 items = import VAT on arrival | Skatteetaten VOEC registration; per-item threshold checks at checkout | Skatteetaten VOEC pages |
| Canada | `IMPORT_TAX_AT_ARRIVAL` | "Canadian GST/HST, duties and carrier brokerage may be payable on arrival." | CBSA-aligned messaging review before any DDP promise | CBSA (cbsa-asfc.gc.ca) |
| GCC | `IMPORT_TAX_AT_ARRIVAL` + `DAP_DISCLOSED` | "Import duties, taxes and carrier clearance charges may be payable on arrival." | Per-country customs/tax review before checkout opens | National customs authorities (per-country review) |
| Rest of world | `IMPORT_TAX_AT_ARRIVAL` + `DAP_DISCLOSED` | DAP disclosure before checkout | Carrier DDP options review | n/a (per-destination) |

## Hard rules encoded

1. Nothing is labelled "calculated at checkout" unless this engine actually calculates it — today it calculates nothing, so it says nothing.
2. DAP markets show the duties disclosure on the product page, in the cart drawer and at checkout BEFORE the payment button — never only in Terms.
3. No DDP promise anywhere until duties are actually collected and remitted for that market.
4. Order summary always separates Subtotal / Discount / Shipping / Taxes (when a real tax line exists) / Duties disclosure / Total. No mandatory fee may appear after the customer commits.
5. Tax amounts are never invented — the engine returns `null` amounts until a registration flag is set and a real rate source is wired.
