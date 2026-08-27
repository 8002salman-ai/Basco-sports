/**
 * Basco Sports – Internal fulfillment routing model
 *
 * INTERNAL OPERATIONAL SYSTEM. Customer pages use neutral wording
 * ("Fulfilled by Basco Sports", "Tracked International Delivery").
 * Customs docs/invoices must always state the true dispatch country.
 *
 * Routing priority is fixed by policy:
 * 1. legal eligibility of the destination
 * 2. product compliance/approval for that destination
 * 3. available inventory at the origin
 * 4. transit time
 * 5. shipping cost
 * 6. customs/tax impact
 * A cheaper route NEVER overrides 1–3.
 */

export type FulfillmentOrigin = 'PK' | 'US' | 'UK' | 'EU' | 'UAE' | 'SUPPLIER_DIRECT';

export interface FulfillmentLocation {
  id: FulfillmentOrigin;
  dispatchCountry: string;   // ISO code used on customs paperwork – must be truthful
  label: string;             // internal only
  active: boolean;
  /** Eligible destination zones, or 'ALL'. */
  serves: string[] | 'ALL';
}

/**
 * Active origins today: Pakistan fulfilment hub. Others exist in the model so
 * US/UK/EU/UAE stock can be added WITHOUT redesign. No location is advertised
 * as local stock unless inventory genuinely exists there.
 */
export const fulfillmentLocations: FulfillmentLocation[] = [
  { id: 'PK', dispatchCountry: 'PK', label: 'Basco Fulfilment – PK', active: true, serves: 'ALL' },
  { id: 'SUPPLIER_DIRECT', dispatchCountry: 'PK', label: 'Supplier direct (documented per order)', active: true, serves: 'ALL' },
  { id: 'UAE', dispatchCountry: 'AE', label: 'Basco Fulfilment – UAE', active: false, serves: ['GCC'] },
  { id: 'UK', dispatchCountry: 'GB', label: 'Basco Fulfilment – UK', active: false, serves: ['UK', 'EU'] },
  { id: 'EU', dispatchCountry: 'NL', label: 'Basco Fulfilment – EU', active: false, serves: ['EU'] },
  { id: 'US', dispatchCountry: 'US', label: 'Basco Fulfilment – US', active: false, serves: ['US', 'CANADA'] },
];

export interface RouteRequest {
  destinationCountry: string;
  productComplianceApproved: boolean;
  originInventoryAvailable: (origin: FulfillmentOrigin) => boolean;
}

export interface RouteDecision {
  origin: FulfillmentOrigin | null;
  dispatchCountry: string | null;
  reason: string;
}

export function routeOrder(req: RouteRequest): RouteDecision {
  if (!req.productComplianceApproved) {
    return { origin: null, dispatchCountry: null, reason: 'BLOCKED_COMPLIANCE' };
  }
  const candidates = fulfillmentLocations
    .filter((loc) => loc.active)
    .filter((loc) => loc.serves === 'ALL' || loc.serves.length === 0)
    .filter((loc) => req.originInventoryAvailable(loc.id));
  const pick = candidates[0];
  if (!pick) return { origin: null, dispatchCountry: null, reason: 'NO_ELIGIBLE_ORIGIN' };
  return { origin: pick.id, dispatchCountry: pick.dispatchCountry, reason: 'POLICY_ORDER' };
}

/** Neutral customer-facing wording only. Never "Ships from USA" unless stock truly exists there. */
export const CUSTOMER_FACING_FULFILLMENT = 'Fulfilled by Basco Sports • Tracked International Delivery';
