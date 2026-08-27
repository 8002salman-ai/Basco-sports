# Basco Sports – global market matrix

**Checked:** 2026-08-27. Source of truth: `src/config/markets.ts`. "Checkout" = live paid orders. Demo browsing remains available everywhere.

| Country | Code | Currency | Checkout | Shipping shown | Tax model | Duty model | Legal region | Compliance status |
|---|---|---|---|---|---|---|---|---|
| United States | US | USD | BLOCKED (launch gate) | Yes | US sales tax – nexus review pending | n/a domestic | US | BLOCKED until gate |
| Norway | NO | NOK | BLOCKED (VOEC registration) | Yes | VAT at checkout planned (VOEC) | DDP pending carrier setup | NORWAY | BLOCKED until VOEC |
| United Kingdom | GB | GBP | BLOCKED (UK VAT registration) | Yes | VAT at checkout planned (≤£135) | DDP pending carrier setup | UK | BLOCKED until VAT reg |
| Spain, Germany, France, Italy, Netherlands, Belgium, Ireland, Austria, Portugal | ES DE FR IT NL BE IE AT PT | EUR | BLOCKED (OSS/IOSS + GPSR) | Yes | VAT inclusive – pending OSS/IOSS | DDP pending | EU | BLOCKED |
| Sweden | SE | SEK | BLOCKED (OSS/IOSS + GPSR) | Yes | VAT inclusive – pending | DDP pending | EU | BLOCKED |
| Denmark | DK | DKK | BLOCKED (OSS/IOSS + GPSR) | Yes | VAT inclusive – pending | DDP pending | EU | BLOCKED |
| Finland | FI | EUR | BLOCKED (OSS/IOSS + GPSR) | Yes | VAT inclusive – pending | DDP pending | EU | BLOCKED |
| Poland | PL | PLN | BLOCKED (OSS/IOSS + GPSR) | Yes | VAT inclusive – pending | DDP pending | EU | BLOCKED |
| Switzerland | CH | CHF | BLOCKED (not configured) | Yes | Import tax at arrival | DAP disclosed | ROW | Not started |
| Canada | CA | CAD | BLOCKED (CBSA/GST-HST comms setup) | Yes | Import tax at arrival | DAP disclosed | CANADA | Not started |
| Australia | AU | AUD | BLOCKED | Yes | Import tax at arrival | DAP disclosed | ROW | Not started |
| New Zealand | NZ | NZD | BLOCKED | Yes | Import tax at arrival | DAP disclosed | ROW | Not started |
| UAE | AE | AED | BLOCKED (GCC review) | Yes* | Import tax at arrival | DAP disclosed | GCC | Review required |
| Qatar | QA | QAR | BLOCKED (GCC review) | Yes* | Import tax at arrival | DAP disclosed | GCC | Review required |
| Saudi Arabia | SA | SAR | BLOCKED (GCC review) | Yes* | Import tax at arrival | DAP disclosed | GCC | Review required |
| Kuwait | KW | KWD | BLOCKED (GCC review) | Yes* | Import tax at arrival | DAP disclosed | GCC | Review required |
| Bahrain | BH | BHD | BLOCKED (GCC review) | Yes* | Import tax at arrival | DAP disclosed | GCC | Review required |
| Oman | OM | OMR | BLOCKED (GCC review) | Yes* | Import tax at arrival | DAP disclosed | GCC | Review required |
| Japan | JP | JPY | BLOCKED | Yes* | Import tax at arrival | DAP disclosed | ROW | Not started |
| Singapore | SG | SGD | BLOCKED | Yes* | Import tax at arrival | DAP disclosed | ROW | Not started |
| Malaysia | MY | MYR | BLOCKED | Yes* | Import tax at arrival | DAP disclosed | ROW | Not started |

\* GCC/ROW destinations display shipping estimates from unverified planning rates; no live booking until a carrier agreement exists (`verified: false` in `src/lib/shipping.ts`).

## Currencies

USD (master, checkout-ready), EUR, GBP, NOK, SEK, DKK, PLN, CHF, CAD, AUD, NZD, AED, QAR, SAR, KWD, BHD, OMR, JPY, SGD, MYR. Only USD is marked `checkoutSupported`; all other display is clearly an estimate. FX rates: `NEXT_PUBLIC_FX_RATES` env JSON or dated baseline (see `src/lib/currency.ts`).

## Global gate

No market flips to READY until: verified seller identity, product compliance evidence for the destination, tax registration (where the model requires it), carrier-verified rates, and the launch gate passing. `npm run launch-check` reports the combined state.
