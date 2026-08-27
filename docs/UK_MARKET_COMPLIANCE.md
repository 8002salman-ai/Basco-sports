# UK market compliance

**Checked:** 2026-08-27 · **Status:** architecture ready; live sales BLOCKED until HMRC VAT registration and owner review.

## VAT — overseas seller rules

From GOV.UK: goods sent from overseas and sold directly to UK consumers with a consignment value of **£135 or less** require the overseas seller to register for and charge UK VAT at the point of sale. Above £135, VAT (and any duties) are collected at import from the customer. The £135 limit applies to the total consignment, not per item.

- Source: https://www.gov.uk/guidance/vat-and-overseas-goods-sold-directly-to-customers-in-the-uk (checked 2026-08-27)
- Consumer tax/duty view: https://www.gov.uk/goods-sent-from-abroad/tax-and-duty (checked 2026-08-27)

## No fake UK presence

The demo-era "London" branding and any UK establishment implication have been removed. Basco Sports may sell to UK customers from abroad without pretending to operate a UK office, showroom or warehouse. Any future real UK establishment changes this and triggers separate registrations.

## Implementation status

| Requirement | Status |
|---|---|
| Market config (GB / GBP / VAT-at-checkout mode) | Done |
| £135 consignment-threshold logic at checkout | Not yet — must gate before enabling (consignment value, not per-item) |
| HMRC VAT registration | OWNER ACTION |
| 14-day cancellation rights wording | Done on /returns (statutory section) |
| PECR-compliant cookie consent | Present; runtime verification task listed in LAUNCH_READINESS |
| Consumer Rights Act conformity wording | Present on /returns and /terms |
| UK-targeted marketing rules (PECR) | No UK marketing until owner review |

## Do not enable checkout for GB until

1. HMRC VAT registration complete (≤£135 route) and number recorded,
2. consignment-value VAT logic implemented and tested,
3. carrier declaration data truthful (dispatch country PK today),
4. product safety/labeling data present per SKU.
