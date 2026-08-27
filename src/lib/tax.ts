/**
 * Basco Sports – Jurisdiction-aware tax & duties engine
 *
 * Modes live in src/config/markets.ts. This module computes what can be
 * HONESTLY shown to the shopper today:
 * - nothing is presented as "calculated at checkout" unless this engine
 *   actually calculates it;
 * - markets whose registrations (VOEC, UK VAT, EU OSS/IOSS, US nexus) are not
 *   complete show an honest pending/DAP disclosure instead of invented numbers.
 */
import { getMarket, DutyMode, TaxMode } from '@/config/markets';

export interface TaxSummary {
  /** Tax line to display in cart/checkout, or null when no line is shown. */
  taxLineLabel: string | null;
  taxLineAmountUSD: number | null;
  taxLineNote: string | null;
  /** Duties/taxes messaging shown near the total, BEFORE payment commitment. */
  dutiesDisclosure: string | null;
  /** True when this market requires honest "charges may apply on arrival" wording. */
  requiresDapDisclosure: boolean;
  /** Registration gates that must clear before live tax collection turns on. */
  registrationBlockers: string[];
}

const US_NEXUS_DONE = false;   // set true after state-by-state nexus review + tax engine config
const UK_VAT_REGISTERED = false; // set true after HMRC VAT registration
const NO_VOEC_REGISTERED = false; // set true after Skatteetaten VOEC registration
const EU_OSS_IOSS_READY = false; // set true after OSS/IOSS registration via member state

export function taxSummaryFor(destinationCountry: string, taxableUSD: number): TaxSummary {
  const market = getMarket(destinationCountry);
  if (!market) {
    return {
      taxLineLabel: null, taxLineAmountUSD: null, taxLineNote: null,
      dutiesDisclosure: 'Import duties, taxes or carrier clearance charges may be payable upon arrival.',
      requiresDapDisclosure: true,
      registrationBlockers: ['Destination market is not configured.'],
    };
  }
  const blockers: string[] = [];
  switch (market.taxMode) {
    case 'US_SALES_TAX_PENDING': {
      if (!US_NEXUS_DONE) blockers.push('US state sales-tax nexus review and rate configuration pending.');
      return {
        taxLineLabel: blockers.length ? null : 'Sales tax',
        taxLineAmountUSD: blockers.length ? null : null,
        taxLineNote: blockers.length ? 'Applicable sales tax is shown before payment once configured.' : null,
        dutiesDisclosure: null,
        requiresDapDisclosure: false,
        registrationBlockers: blockers,
      };
    }
    case 'VAT_COLLECTED_AT_CHECKOUT': {
      const isUK = market.countryCode === 'GB';
      const registered = isUK ? UK_VAT_REGISTERED : NO_VOEC_REGISTERED;
      if (!registered) {
        blockers.push(isUK
          ? 'UK VAT registration pending – consignments ≤£135 cannot show VAT-inclusive pricing yet.'
          : 'Norway VOEC registration pending – VAT cannot be collected at checkout yet.');
        return {
          taxLineLabel: null, taxLineAmountUSD: null,
          taxLineNote: market.dutiesNote,
          dutiesDisclosure: market.dutiesNote,
          requiresDapDisclosure: true,
          registrationBlockers: blockers,
        };
      }
      return {
        taxLineLabel: isUK ? 'VAT (collected at checkout)' : 'Norwegian VAT (VOEC)',
        taxLineAmountUSD: null, // computed by the payment provider once registered; never invented here
        taxLineNote: market.dutiesNote,
        dutiesDisclosure: null,
        requiresDapDisclosure: false,
        registrationBlockers: [],
      };
    }
    case 'VAT_INCLUSIVE_PENDING': {
      if (!EU_OSS_IOSS_READY) blockers.push('EU OSS/IOSS registration pending via a member state.');
      return {
        taxLineLabel: null, taxLineAmountUSD: null,
        taxLineNote: market.dutiesNote,
        dutiesDisclosure: market.dutiesNote,
        requiresDapDisclosure: true,
        registrationBlockers: blockers,
      };
    }
    case 'IMPORT_TAX_AT_ARRIVAL':
    default:
      return {
        taxLineLabel: null, taxLineAmountUSD: null, taxLineNote: null,
        dutiesDisclosure: market.dutiesNote,
        requiresDapDisclosure: true,
        registrationBlockers: [],
      };
  }
}

export function dutyModeFor(destinationCountry: string): DutyMode | null {
  return getMarket(destinationCountry)?.dutyMode ?? null;
}

export function taxModeFor(destinationCountry: string): TaxMode | null {
  return getMarket(destinationCountry)?.taxMode ?? null;
}
