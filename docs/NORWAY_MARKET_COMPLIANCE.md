# Norway market compliance

**Checked:** 2026-08-27 · **Status:** architecture ready; live sales BLOCKED until VOEC registration.

## VOEC — what applies

From the Norwegian Tax Administration (Skatteetaten): foreign online stores selling low-value goods (below **NOK 3,000 per item**) to Norwegian consumers can register in the **VOEC register** and charge Norwegian VAT (25%) at the point of sale. VOEC goods move without ordinary customs clearance charges for the customer; goods at or above NOK 3,000 per item stay in the ordinary import regime where the customer pays import VAT/clearance on arrival.

- Source: https://www.skatteetaten.no/en/business-and-organisation/vat-and-duties/vat/foreign/e-commerce-voec/ (checked 2026-08-27)
- Sending goods under the scheme: https://www.skatteetaten.no/en/business-and-organisation/vat-and-duties/vat/foreign/e-commerce-voec/sending-goods-under-the-voec-scheme/ (checked 2026-08-27)

## Implementation status

| Requirement | Status |
|---|---|
| Market config (NO / NOK / VAT at checkout mode) | Done in `src/config/markets.ts` |
| Per-item NOK 3,000 threshold check at checkout | Not yet — must gate before enabling (a mixed cart needs per-item evaluation, not cart-total) |
| VOEC number collection/remittance | OWNER ACTION: register at Skatteetaten; store the VOEC number in business config |
| Carrier data transfer (VOEC reference on shipment) | Pending carrier agreement |
| Customer-facing disclosure (before checkout) | Done — honest pending wording; switches to VAT-inclusive after registration |
| Norwegian-language product warnings (GPSR) | Pending GPSR data |

## Do not enable checkout for NO until

1. VOEC registration complete and number recorded,
2. checkout collects 25% VAT on eligible items and excludes non-eligible items (≥ NOK 3,000) from the scheme,
3. carrier can carry VOEC references on labels/customs data,
4. GPSR product data exists for every EU/EEA-offered SKU.
