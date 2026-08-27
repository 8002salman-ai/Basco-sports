/**
 * Basco Sports – International shipping engine
 *
 * All rates/times come from configuration below. NOTHING here may invent
 * delivery windows: each method carries an explicit `basis` note and a
 * `verified` flag. Unverified methods are rendered as ranges WITHOUT promises
 * and are not bookable until an operator sets verified=true after carrier
 * agreement.
 *
 * Safe failure: if no method covers a destination, quoteShipping returns []
 * and checkout must show "Shipping is currently unavailable to this destination."
 */
import { getMarket, ShippingZoneId } from '@/config/markets';

export type ServiceLevel = 'STANDARD_INTERNATIONAL' | 'EXPRESS_INTERNATIONAL';

export interface ShippingMethodConfig {
  id: ServiceLevel;
  label: string;
  /** Shown to customers. Must be TRUE. */
  description: string;
  /** Days in transit AFTER dispatch. Dispatch/processing time is separate. */
  transitDaysMin: number;
  transitDaysMax: number;
  /** Has Basco agreed this with a carrier in writing? Until then: estimate only, not bookable. */
  verified: boolean;
  /** Where does this timing come from? Recorded for audit. */
  basis: string;
  /** USD master prices per zone. A missing zone = method not offered there. */
  priceUSD: Partial<Record<ShippingZoneId, number>>;
}

/**
 * CONFIG PLACEHOLDER – operator must replace with agreed carrier rates.
 * Prices below are internal planning defaults: they are NOT live bookable
 * rates, so `verified` stays false and checkout keeps payment frozen.
 */
export const shippingMethods: ShippingMethodConfig[] = [
  {
    id: 'STANDARD_INTERNATIONAL',
    label: 'Standard International',
    description: 'Tracked international delivery. Dispatch within 2–4 business days after order confirmation.',
    transitDaysMin: 7, transitDaysMax: 14, verified: false,
    basis: 'PLANNING DEFAULT – pending written carrier agreement; replace before enabling checkout.',
    priceUSD: { US: 12.95, UK: 12.95, EU: 14.95, NORWAY: 14.95, CANADA: 16.95, GCC: 19.95, REST_OF_WORLD: 19.95 },
  },
  {
    id: 'EXPRESS_INTERNATIONAL',
    label: 'Express International',
    description: 'Tracked express international delivery. Priority dispatch within 1–2 business days.',
    transitDaysMin: 3, transitDaysMax: 7, verified: false,
    basis: 'PLANNING DEFAULT – pending written carrier agreement; replace before enabling checkout.',
    priceUSD: { US: 29.95, UK: 29.95, EU: 32.95, NORWAY: 32.95, CANADA: 34.95, GCC: 39.95, REST_OF_WORLD: 39.95 },
  },
];

export interface ShippingQuote {
  id: ServiceLevel;
  label: string;
  description: string;
  priceUSD: number;
  /** Customer-facing estimate window; wording stays "Estimated" – never a promise. */
  estimateText: string;
  verified: boolean;
}

export function processingDaysFor(zone: ShippingZoneId): { min: number; max: number } {
  // Operational baseline used on /shipping; adjust with real warehouse data.
  return zone === 'GCC' || zone === 'REST_OF_WORLD' ? { min: 2, max: 4 } : { min: 1, max: 3 };
}

export function quoteShipping(destinationCountry: string, orderSubtotalUSD: number): ShippingQuote[] {
  const market = getMarket(destinationCountry);
  if (!market || !market.shippingEnabled) return [];
  const zone = market.defaultShippingZone;
  const quotes: ShippingQuote[] = [];
  for (const method of shippingMethods) {
    const price = method.priceUSD[zone];
    if (price === undefined) continue;
    quotes.push({
      id: method.id,
      label: method.label,
      description: method.description,
      priceUSD: price,
      estimateText: `Estimated ${method.transitDaysMin}–${method.transitDaysMax} business days in transit`,
      verified: method.verified,
    });
  }
  // Free standard shipping incentive stays a STORE POLICY decision, not an invented carrier rate.
  if (orderSubtotalUSD >= 100) {
    const std = quotes.find((q) => q.id === 'STANDARD_INTERNATIONAL');
    if (std) std.priceUSD = 0;
  }
  return quotes;
}

export function shippingUnavailableMessage(destinationCountry: string): string {
  const market = getMarket(destinationCountry);
  return market
    ? `Shipping is currently unavailable to ${market.countryName}.`
    : 'Shipping is currently unavailable to this destination.';
}
