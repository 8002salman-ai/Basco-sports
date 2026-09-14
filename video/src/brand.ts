/**
 * Basco Sports brand values, taken from the storefront itself
 * (`tailwind.config.ts`, `src/app/layout.tsx`, `src/components/layout/BrandLogo.tsx`)
 * so the video cannot drift from the site.
 */
export const BRAND = {
  obsidian: '#0B1220',
  obsidianDeep: '#070C16',
  lime: '#D4FF32',
  stone: '#EDE9E3',
  sale: '#FF4D23',
  /**
   * The web brand uses Syne for display type. The video runs headless with no
   * guaranteed webfont fetch, so it falls back to a geometric system stack —
   * flagged as a deliberate deviation in README.md.
   */
  display: '"Segoe UI Semibold", "Segoe UI", system-ui, -apple-system, sans-serif',
  body: '"Segoe UI", system-ui, -apple-system, sans-serif',
} as const;

/** Copy reused verbatim from the storefront, never invented. */
export const COPY = {
  badge: 'Worldwide delivery',
  headline: 'Performance gear for every sport',
  /** `src/app/category/[slug]/page.tsx` */
  shipping: 'Free shipping over $100',
  /** `src/app/layout.tsx` meta description */
  returns: '30-day returns',
  mark: 'BASCO SPORTS',
} as const;

/** 1920×1080 at 30fps. */
export const FPS = 30;
export const DURATION_IN_FRAMES = 300;

/** Timeline beats, in frames. */
export const BEATS = {
  brandIn: [0, 24],
  globeHold: [24, 108],
  globeToZones: [108, 126],
  zonesPush: [126, 252],
  pinDrop: [140, 216],
  /** The map dips to the lockup's dark plate before any lockup type appears. */
  plateOut: [258, 276],
  lockupIn: [276, 300],
} as const;

/**
 * Fixed map plates, per the MapLibre technique's render-stability rules: every
 * plate is rendered natively at the most zoomed-in framing of its beat, so CSS
 * scale only ever moves *down* from 1 and the plate can never letterbox or be
 * enlarged past its native resolution.
 */
export const PLATES = {
  globe: {
    /**
     * 1.2× the composition, so the pull-back never runs out of plate. The
     * sphere is centred in it, which keeps the plate covering the whole frame at
     * `scaleFrom` while the CSS pivot stays known without consulting the map.
     */
    width: 2304,
    height: 1296,
    center: [10, 25] as [number, number],
    /**
     * The sphere's apparent diameter grows with the zoom, so this is what makes
     * it a hero rather than a ball in the middle of the frame: ~930px at 1.0,
     * which fits inside the 1080-tall frame with the caption underneath.
     */
    zoom: 2.6,
    scaleFrom: 0.86,
  },
  zones: {
    /**
     * 4096×2304 is the largest plate that stays inside the common WebGL
     * render-buffer limit. The pan and the scale-down both need overscan, and a
     * 3840-wide plate ran out of canvas at the wide end of the push — which
     * showed up as a band of the page background along the plate edge.
     */
    width: 4096,
    height: 2304,
    /**
     * Native camera is the end framing of the push: the whole footprint. The
     * latitude is low enough to lift the New York pin clear of the legend card,
     * which would otherwise sit on top of it.
     */
    center: [-4, 43] as [number, number],
    /** Final view spans ~169° of longitude, so all four hubs stay on screen. */
    zoom: 3,
    /** Leaves each side ~1100px of window inside the plate at the wide end. */
    scaleFrom: 0.88,
    /** Where the push starts, in `[lng, lat]`. */
    centerFrom: [22, 38] as [number, number],
  },
} as const;
