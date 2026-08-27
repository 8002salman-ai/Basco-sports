# Basco Sports privacy data map

**Checked:** 2026-08-27  
**Status:** engineering inventory; confirm with owner and counsel.

| Data / event | Current source or destination | Purpose | Provider / transfer | Retention decision |
|---|---|---|---|---|
| Cart and wishlist | Browser local storage | Store functionality | User device | User-controlled; document exact keys |
| Checkout contact/order details | Checkout UI and order APIs | Demo order flow | Application/Supabase when configured | Owner must define legal/accounting schedule |
| Admin session | HttpOnly cookie | Admin authentication | Application | Session policy; verify rotation/expiry |
| Product/catalog/order data | Local demo data or Supabase adapter | Catalog and operations | Supabase if configured | Owner must define schedule |
| Analytics | Google Analytics only when configured and consented | Analytics | Google; international transfer review | Consent and provider retention settings required |
| Advertising | AdSense only when configured and consented | Advertising | Google; international transfer review | Consent and provider settings required |
| Newsletter | Current UI is demo behavior unless provider configured | Marketing | No production provider confirmed | Do not market until provider and consent evidence exist |
| Payment data | Demo adapter currently; Stripe not enabled | Checkout | No card storage in app expected | Keep demo until payment/legal gates pass |

## Outstanding privacy actions

- Confirm legal controller identity, locations, markets and providers.
- Confirm whether California or other US state thresholds apply.
- Implement and test privacy request intake and request records.
- Define purpose-based retention with accounting/legal owner.
- Maintain cookie inventory and test clean-session network behavior.
- Verify consent withdrawal and marketing unsubscribe behavior.
