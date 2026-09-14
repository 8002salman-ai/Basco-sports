/**
 * Shipping zones, mirrored from the store's own zone table (the admin console's
 * `SHIPPING_ZONES`), with a hub city used only to place the pin on the map.
 * Carrier and ETA text is the store's own wording.
 */
export interface ShippingZone {
  name: string;
  carrier: string;
  eta: string;
  /** `[longitude, latitude]` — MapLibre/GeoJSON order. */
  hub: [number, number];
}

export const SHIPPING_ZONES: ShippingZone[] = [
  {name: 'United Kingdom', carrier: 'Royal Mail Tracked 24', eta: '1–2 days', hub: [-0.1276, 51.5072]},
  {name: 'European Union', carrier: 'DHL Express', eta: '2–4 days', hub: [8.6821, 50.1109]},
  {name: 'United States', carrier: 'UPS Ground', eta: '3–5 days', hub: [-74.006, 40.7128]},
  {name: 'Rest of world', carrier: 'DHL Express', eta: '5–9 days', hub: [55.2708, 25.2048]},
];

/** The Basco football mark, copied from `src/components/layout/BrandLogo.tsx`. */
export const BRAND_MARK_PATHS = {
  ball: 'm20 10.2 6.1 4.5-2.3 7.1h-7.6l-2.3-7.1L20 10.2Z',
  seams:
    'M20 10.2V5.4M13.9 14.7 8 17M26.1 14.7 32 17M16.2 21.8l-3.7 6M23.8 21.8l3.7 6',
};
