# Basco Sports legal and compliance engineering audit

**Date checked:** 2026-08-27  
**Scope:** repository and `https://basco-sports.vercel.app`  
**Status:** engineering assessment only; not legal advice or attorney approval.

## Executive decision

**DO NOT ENABLE LIVE PAYMENTS — BLOCKERS REMAIN.** The repository currently identifies itself as a demo store and contains unverified product claims, seeded reviews, stock imagery, missing verified business identity, and incomplete market-specific product compliance evidence. Payment mode must remain demo until the launch gate is cleared.

## Findings and implementation

| Rule / jurisdiction | Official source | Applicability | Implementation made | Remaining human/legal/accounting action |
|---|---|---|---|---|
| US shipping promises require a reasonable basis; delays require notice and consent/refund handling | FTC, Mail/Internet/Telephone Order Merchandise Rule: https://www.ftc.gov/legal-library/browse/rules/mail-internet-or-telephone-order-merchandise-rule | Applicable if US orders are accepted | No live payment activation; shipping promises remain launch review items | Confirm fulfillment SLA and implement delay workflow before live commerce |
| US reviews/testimonials must not be fake or misleading | FTC Consumer Reviews and Testimonials Rule: https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials | Applicable to seeded ratings/reviews | Flagged seeded review data and aggregate ratings for removal before launch | Replace only with authentic review process and evidence |
| US textile listings generally disclose fiber, origin, and manufacturer/RN; care labeling applies | FTC Apparel and Labeling: https://www.ftc.gov/news-events/topics/tools-consumers/apparel-labeling | Applicable to apparel/textiles | Product compliance work is blocked pending supplier data | Collect labels, fiber, origin, RN and care instructions per SKU |
| EU online offers need product safety/economic-operator information | EUR-Lex Regulation (EU) 2023/988 (GPSR), including Article 19: https://eur-lex.europa.eu/eli/reg/2023/988/oj/eng | Applicable only if EU listings/targeting are enabled | Central business config created with EU Responsible Person fields; listings must remain blocked until populated | Verify manufacturer and EU Responsible Person evidence per SKU and destination language |
| EU distance sales generally include a 14-day withdrawal right and legal guarantee rights | Your Europe: https://europa.eu/youreurope/citizens/consumers/shopping/shopping-consumer-rights/index_en.htm | Applicable if EU consumers are targeted | Must remain a launch requirement; demo checkout cannot create live contracts | Owner/legal review of withdrawal workflow, exceptions, refunds and guarantee wording |
| UK electronic marketing/cookies require PECR-compliant consent where applicable | UK ICO cookies guidance: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/ | Conditional; UK is not intentionally enabled by this audit | London/demo identity claims identified for removal | Confirm UK targeting/business presence before enabling UK sales |
| Non-essential cookies/tracking require consent and easy withdrawal | ICO: same source above | Applicable wherever analytics/advertising is enabled | Existing consent architecture requires runtime verification before launch | Test clean browser/network and maintain cookie inventory |

## Repository audit snapshot

The catalog currently contains 34 local products with Unsplash image URLs, non-zero ratings/review counts, seeded reviews, compare-at prices, and claims requiring evidence. Examples found include `FIFA Quality Pro`, `Flyknit`, `ACC`, `ZoomX`, `Cushlon`, `Dri-FIT ADV`, `Gore-Tex`, `Vibram`, `Polartec`, `Authentic`, `Portugal` origin, `2 year` warranty, and performance/testing claims. These are not accepted as verified merely because they are in source data.

The footer and metadata also contain demo/placeholder language and unsupported identity-style marketing copy. Existing `/privacy`, `/terms`, and `/shipping` pages explicitly describe demo behavior and are not production policies.

## Mandatory launch gate

Live payments remain disabled until all are true:

- verified legal/trader name, address, support and returns contacts;
- production privacy, terms, cookies, shipping, returns, warranty and safety information;
- shipping countries and delivery basis configured;
- tax/customs review completed;
- payment provider and webhook configuration validated;
- product manufacturer/origin/material/image-rights evidence recorded;
- EU Responsible Person evidence for every EU-available affected SKU;
- unsupported certifications, trademarks, ratings, reviews and scarcity removed;
- accessibility and security verification completed.

## Sources and dates

Official sources above were checked on **2026-08-27**. Rules can change; owner counsel should re-check before launch.
