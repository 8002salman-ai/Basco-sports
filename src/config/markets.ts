/**
 * Basco Sports – Global Market Configuration
 *
 * SINGLE SOURCE OF TRUTH for country/currency/legal-region behavior.
 * Do NOT scatter jurisdiction logic across components; import from here.
 *
 * RULES (non-negotiable):
 * - USD is the master currency; product master prices are stored in USD.
 * - supportedCountries / shippingEnabledCountries / checkoutEnabledCountries
 *   are maintained SEPARATELY. A country may be visible but not yet open.
 * - No tax/duty rates here are fabricated for production use. Modes describe
 *   HOW a market is handled; actual amounts require configured, verified rates
 *   and remain disabled until then.
 * - Fulfillment origin is internal operational data. Customer-facing pages use
 *   neutral wording (see /shipping). Customs documents must always be truthful.
 */

export type LegalRegion = 'US' | 'UK' | 'EU' | 'NORWAY' | 'CANADA' | 'GCC' | 'REST_OF_WORLD';

/** How consumption taxes are handled for this market. */
export type TaxMode =
  | 'NONE_CALCULATED'          // no tax collected by us yet (must be disclosed)
  | 'US_SALES_TAX_PENDING'     // nexus review required before live collection
  | 'VAT_COLLECTED_AT_CHECKOUT'// UK £135 / NO VOEC-style in-price VAT (registration required first)
  | 'VAT_INCLUSIVE_PENDING'    // EU OSS/IOSS – requires registration before enablement
  | 'IMPORT_TAX_AT_ARRIVAL';   // DAP – customer pays on import

/** How customs duties are handled for this market. */
export type DutyMode =
  | 'NO_DUTIES_DATA'           // duty amount unknown – must disclose possible charges
  | 'DDP_PENDING_SETUP'        // duties-paid intended but carrier setup not verified
  | 'DAP_DISCLOSED'            // duties payable on arrival, disclosed before checkout
  | 'DUTIES_INCLUSIVE';        // duties calculated at checkout (requires landed-cost engine)

export interface CurrencyConfig {
  code: string;
  symbol: string;
  /** Number of fraction digits used by the currency (JPY = 0). */
  fractionDigits: number;
  /** Price points used for commercial rounding, ascending. Last one wins. */
  pricePoints: number[];
  /** True once verified FX rates + checkout support exist. Otherwise display is estimate-only. */
  checkoutSupported: boolean;
}

export interface MarketConfig {
  countryCode: string;   // ISO 3166-1 alpha-2
  countryName: string;
  flagEmoji: string;
  currency: string;      // default currency code
  locale: string;        // BCP-47 for Intl formatting
  checkoutEnabled: boolean;
  shippingEnabled: boolean;
  taxMode: TaxMode;
  dutyMode: DutyMode;
  defaultShippingZone: ShippingZoneId;
  legalRegion: LegalRegion;
  requiresEUCompliance?: boolean;
  requiresUKCompliance?: boolean;
  requiresNorwayCompliance?: boolean;
  requiresUSCompliance?: boolean;
  /** Short customer-facing duties/taxes note, or null when a market-specific one is not yet approved. */
  dutiesNote: string | null;
}

export type ShippingZoneId = 'US' | 'UK' | 'EU' | 'NORWAY' | 'CANADA' | 'GCC' | 'REST_OF_WORLD';

/** Master currency list. Extend freely; products always price in USD. */
export const currencies: Record<string, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', fractionDigits: 2, pricePoints: [19, 25, 35, 45, 55, 69, 75, 89, 95, 99, 0], checkoutSupported: true },
  EUR: { code: 'EUR', symbol: '€', fractionDigits: 2, pricePoints: [19, 25, 35, 45, 55, 69, 75, 89, 95, 99, 0], checkoutSupported: false },
  GBP: { code: 'GBP', symbol: '£', fractionDigits: 2, pricePoints: [15, 19, 25, 35, 45, 55, 69, 75, 89, 95, 0], checkoutSupported: false },
  NOK: { code: 'NOK', symbol: 'kr', fractionDigits: 0, pricePoints: [199, 249, 299, 349, 449, 549, 699, 899, 950, 1190, 0], checkoutSupported: false },
  SEK: { code: 'SEK', symbol: 'kr', fractionDigits: 0, pricePoints: [199, 249, 299, 349, 449, 549, 699, 899, 950, 1190, 0], checkoutSupported: false },
  DKK: { code: 'DKK', symbol: 'kr', fractionDigits: 0, pricePoints: [129, 169, 199, 249, 299, 379, 479, 599, 649, 799, 0], checkoutSupported: false },
  PLN: { code: 'PLN', symbol: 'zł', fractionDigits: 2, pricePoints: [79, 99, 129, 169, 199, 249, 329, 399, 429, 549, 0], checkoutSupported: false },
  CHF: { code: 'CHF', symbol: 'CHF', fractionDigits: 2, pricePoints: [19, 25, 35, 45, 55, 69, 75, 89, 95, 99, 0], checkoutSupported: false },
  CAD: { code: 'CAD', symbol: 'C$', fractionDigits: 2, pricePoints: [25, 29, 39, 49, 59, 79, 89, 99, 119, 129, 0], checkoutSupported: false },
  AUD: { code: 'AUD', symbol: 'A$', fractionDigits: 2, pricePoints: [29, 35, 45, 55, 65, 85, 95, 105, 125, 139, 0], checkoutSupported: false },
  NZD: { code: 'NZD', symbol: 'NZ$', fractionDigits: 2, pricePoints: [29, 35, 45, 55, 65, 85, 95, 105, 125, 139, 0], checkoutSupported: false },
  AED: { code: 'AED', symbol: 'AED', fractionDigits: 2, pricePoints: [69, 89, 125, 165, 199, 249, 329, 399, 429, 499, 0], checkoutSupported: false },
  QAR: { code: 'QAR', symbol: 'QAR', fractionDigits: 2, pricePoints: [69, 89, 125, 165, 199, 249, 329, 399, 429, 499, 0], checkoutSupported: false },
  SAR: { code: 'SAR', symbol: 'SAR', fractionDigits: 2, pricePoints: [69, 89, 125, 165, 199, 249, 329, 399, 429, 499, 0], checkoutSupported: false },
  KWD: { code: 'KWD', symbol: 'KWD', fractionDigits: 3, pricePoints: [5.5, 6.5, 9.5, 12.5, 15.5, 19.5, 25.5, 29.5, 34.5, 39.5, 0], checkoutSupported: false },
  BHD: { code: 'BHD', symbol: 'BHD', fractionDigits: 3, pricePoints: [6.5, 7.5, 9.5, 12.5, 15.5, 19.5, 25.5, 29.5, 34.5, 39.5, 0], checkoutSupported: false },
  OMR: { code: 'OMR', symbol: 'OMR', fractionDigits: 3, pricePoints: [6.5, 7.5, 9.5, 12.5, 15.5, 19.5, 25.5, 29.5, 34.5, 39.5, 0], checkoutSupported: false },
  JPY: { code: 'JPY', symbol: '¥', fractionDigits: 0, pricePoints: [1900, 2490, 2990, 3490, 4490, 5490, 6990, 8990, 9500, 11900, 0], checkoutSupported: false },
  SGD: { code: 'SGD', symbol: 'S$', fractionDigits: 2, pricePoints: [25, 29, 39, 49, 59, 79, 89, 99, 119, 129, 0], checkoutSupported: false },
  MYR: { code: 'MYR', symbol: 'RM', fractionDigits: 2, pricePoints: [79, 99, 129, 169, 199, 249, 329, 399, 429, 499, 0], checkoutSupported: false },
};

const EU_NON_EUR: Partial<Record<string, string>> = { SE: 'SEK', DK: 'DKK', PL: 'PLN' };

function euMarket(cc: string, name: string, flag: string, checkout: boolean): MarketConfig {
  return {
    countryCode: cc, countryName: name, flagEmoji: flag,
    currency: EU_NON_EUR[cc] ?? 'EUR', locale: `en-${cc}`,
    checkoutEnabled: checkout, shippingEnabled: checkout,
    taxMode: 'VAT_INCLUSIVE_PENDING', dutyMode: 'DDP_PENDING_SETUP',
    defaultShippingZone: 'EU', legalRegion: 'EU', requiresEUCompliance: true,
    dutiesNote: 'Import VAT and duties are being finalized for this market. Final charges are shown before payment; nothing is added after you order.',
  };
}

function gccMarket(cc: string, name: string, flag: string, currency: string): MarketConfig {
  return {
    countryCode: cc, countryName: name, flagEmoji: flag, currency, locale: `en-${cc}`,
    checkoutEnabled: false, shippingEnabled: false,
    taxMode: 'IMPORT_TAX_AT_ARRIVAL', dutyMode: 'DAP_DISCLOSED',
    defaultShippingZone: 'GCC', legalRegion: 'GCC',
    dutiesNote: 'Import duties, taxes and carrier clearance charges may be payable on arrival.',
  };
}

function rowMarket(cc: string, name: string, flag: string, currency: string, checkout: boolean): MarketConfig {
  return {
    countryCode: cc, countryName: name, flagEmoji: flag, currency, locale: `en-${cc}`,
    checkoutEnabled: checkout, shippingEnabled: checkout,
    taxMode: 'IMPORT_TAX_AT_ARRIVAL', dutyMode: 'DAP_DISCLOSED',
    defaultShippingZone: 'REST_OF_WORLD', legalRegion: 'REST_OF_WORLD',
    dutiesNote: 'Import duties, taxes or carrier clearance charges may be payable upon arrival.',
  };
}

/**
 * Markets visible to shoppers. Tier-1 (US, NO, UK, EU core) get full config now;
 * others can be switched on per-market by flipping the flags once their
 * tax/duty/shipping setup is verified. Add countries freely – architecture
 * supports 100+; every country MUST have an entry here before checkout accepts it.
 */
export const markets: Record<string, MarketConfig> = {
  // ── Tier 1: United States (default) ──
  US: {
    countryCode: 'US', countryName: 'United States', flagEmoji: '🇺🇸', currency: 'USD', locale: 'en-US',
    checkoutEnabled: false, // demo-only until launch gate passes
    shippingEnabled: true, taxMode: 'US_SALES_TAX_PENDING', dutyMode: 'NO_DUTIES_DATA',
    defaultShippingZone: 'US', legalRegion: 'US', requiresUSCompliance: true,
    dutiesNote: 'No customs charges for domestic US delivery. Applicable sales tax is shown before payment once configured.',
  },
  // ── Tier 1: Norway ──
  NO: {
    countryCode: 'NO', countryName: 'Norway', flagEmoji: '🇳🇴', currency: 'NOK', locale: 'en-GB',
    checkoutEnabled: false, shippingEnabled: true,
    taxMode: 'VAT_COLLECTED_AT_CHECKOUT', // requires VOEC registration before enablement
    dutyMode: 'DDP_PENDING_SETUP',
    defaultShippingZone: 'NORWAY', legalRegion: 'NORWAY', requiresNorwayCompliance: true,
    dutiesNote: 'For eligible low-value orders (under NOK 3,000 per item) Norwegian VAT (25%) is included at checkout once Basco Sports is VOEC-registered. Above that, or until registration is complete, import VAT and clearance may be payable on arrival.',
  },
  // ── Tier 1: United Kingdom ──
  GB: {
    countryCode: 'GB', countryName: 'United Kingdom', flagEmoji: '🇬🇧', currency: 'GBP', locale: 'en-GB',
    checkoutEnabled: false, shippingEnabled: true,
    taxMode: 'VAT_COLLECTED_AT_CHECKOUT', // requires UK VAT registration for ≤£135 consignments
    dutyMode: 'DDP_PENDING_SETUP',
    defaultShippingZone: 'UK', legalRegion: 'UK', requiresUKCompliance: true,
    dutiesNote: 'For consignments up to £135, UK VAT is collected at checkout once Basco Sports completes UK VAT registration. Above £135, import VAT and duties may be payable on arrival.',
  },
  // ── Tier 1: European Union ──
  ...Object.fromEntries([
    ['ES', 'Spain', '🇪🇸'], ['DE', 'Germany', '🇩🇪'], ['FR', 'France', '🇫🇷'],
    ['IT', 'Italy', '🇮🇹'], ['NL', 'Netherlands', '🇳🇱'], ['BE', 'Belgium', '🇧🇪'],
    ['IE', 'Ireland', '🇮🇪'], ['AT', 'Austria', '🇦🇹'], ['PT', 'Portugal', '🇵🇹'],
    ['SE', 'Sweden', '🇸🇪'], ['DK', 'Denmark', '🇩🇰'], ['FI', 'Finland', '🇫🇮'],
    ['PL', 'Poland', '🇵🇱'],
  ].map(([cc, name, flag]) => [cc, euMarket(cc, name, flag, false)])),
  // ── Tier 2 ──
  CH: rowMarket('CH', 'Switzerland', '🇨🇭', 'CHF', false),
  CA: {
    ...rowMarket('CA', 'Canada', '🇨🇦', 'CAD', false),
    defaultShippingZone: 'CANADA', legalRegion: 'CANADA',
    dutiesNote: 'Canadian GST/HST, duties and carrier brokerage charges may be payable on arrival for orders shipped from outside Canada.',
  } as MarketConfig,
  AU: rowMarket('AU', 'Australia', '🇦🇺', 'AUD', false),
  NZ: rowMarket('NZ', 'New Zealand', '🇳🇿', 'NZD', false),
  // ── GCC (config prepared; checkout opens per-country after review) ──
  AE: gccMarket('AE', 'United Arab Emirates', '🇦🇪', 'AED'),
  QA: gccMarket('QA', 'Qatar', '🇶🇦', 'QAR'),
  SA: gccMarket('SA', 'Saudi Arabia', '🇸🇦', 'SAR'),
  KW: gccMarket('KW', 'Kuwait', '🇰🇼', 'KWD'),
  BH: gccMarket('BH', 'Bahrain', '🇧🇭', 'BHD'),
  OM: gccMarket('OM', 'Oman', '🇴🇲', 'OMR'),
  // ── Asia-Pacific (visible; not yet open) ──
  JP: rowMarket('JP', 'Japan', '🇯🇵', 'JPY', false),
  SG: rowMarket('SG', 'Singapore', '🇸🇬', 'SGD', false),
  MY: rowMarket('MY', 'Malaysia', '🇲🇾', 'MYR', false),
};

/** Every country a shopper may SEE in the selector. */
export const supportedCountries = Object.values(markets);

/** Countries where shipping rates exist. */
export const shippingEnabledCountries = supportedCountries.filter((m) => m.shippingEnabled);

/** Countries where checkout may legally complete. Recheck at order creation server-side. */
export const checkoutEnabledCountries = supportedCountries.filter((m) => m.checkoutEnabled);

export function getMarket(countryCode: string | null | undefined): MarketConfig | null {
  if (!countryCode) return null;
  return markets[countryCode.toUpperCase()] ?? null;
}

export function isCheckoutEnabled(countryCode: string): boolean {
  return getMarket(countryCode)?.checkoutEnabled ?? false;
}

/** Suggest a market from the browser timezone (privacy-safe: no network, no IP lookup, no GPS). */
export function suggestCountryFromTimeZone(timeZone: string): string | null {
  const city = timeZone.split('/').pop()?.replace(/_/g, ' ') ?? '';
  const cityToCountry: Record<string, string> = {
    Oslo: 'NO', Stockholm: 'SE', Copenhagen: 'DK', Helsinki: 'FI', Madrid: 'ES',
    Berlin: 'DE', Paris: 'FR', Rome: 'IT', Amsterdam: 'NL', Brussels: 'BE',
    Dublin: 'IE', Vienna: 'AT', Lisbon: 'PT', Warsaw: 'PL', Zurich: 'CH',
    Toronto: 'CA', Vancouver: 'CA', 'New York': 'US', 'Los Angeles': 'US',
    Chicago: 'US', Denver: 'US', London: 'GB', Dubai: 'AE', Doha: 'QA',
    Riyadh: 'SA', Kuwait: 'KW', Manama: 'BH', Muscat: 'OM', Tokyo: 'JP',
    Singapore: 'SG', 'Kuala Lumpur': 'MY', Sydney: 'AU', Melbourne: 'AU', Auckland: 'NZ',
  };
  return cityToCountry[city] ?? null;
}

export const DEFAULT_COUNTRY = 'US';
export const DEFAULT_CURRENCY = 'USD';
