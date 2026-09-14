import {useEffect, useRef, useState} from 'react';
import {continueRender, delayRender, staticFile} from 'remotion';
import * as maplibregl from 'maplibre-gl';
import type {Map, StyleSpecification} from 'maplibre-gl';

/**
 * Point MapLibre at the worker copy vendored into `public/` by
 * `scripts/sync-map-worker.mjs`. The worker parses styles and tiles on its own
 * thread; loading it from our own origin keeps it off the network, where a CDN
 * without CORS headers would leave the map hanging forever.
 */
const installWorkerUrl = () => {
  maplibregl.setWorkerUrl(staticFile('maplibre-gl-csp-worker.js'));
};

/**
 * Space and limb glow around the globe. `sky-color` matches the plate
 * background so the atmosphere reads as a glow on the sphere's edge rather than
 * a coloured box around it.
 */
const ATMOSPHERE = {
  'sky-color': '#070C16',
  'horizon-color': '#1E3C6B',
  'fog-color': '#070C16',
  'sky-horizon-blend': 0.6,
  'horizon-fog-blend': 0.7,
  'fog-ground-blend': 0.5,
  'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 6, 0.4, 9, 0] as never,
};

export interface FrozenPlateOptions {
  style: StyleSpecification;
  center: [number, number];
  zoom: number;
  /** Globe projection for the sphere; mercator otherwise. */
  globe?: boolean;
  /** Adds sources/layers with their frame-0 state, before the plate is released. */
  decorate?: (map: Map) => void;
}

/**
 * A MapLibre plate whose camera is set once and never moved again.
 *
 * Animated scenes move the plate with CSS transforms instead of calling
 * `jumpTo()` per frame: per-frame camera moves make the renderer resample tiles
 * differently each frame, which is what makes a 2D basemap shimmer. Keeping the
 * camera frozen is the whole point of this hook.
 */
export const useFrozenMap = ({style, center, zoom, globe, decorate}: FrozenPlateOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<Map | null>(null);
  const optionsRef = useRef({style, center, zoom, globe, decorate});
  optionsRef.current = {style, center, zoom, globe, decorate};

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const options = optionsRef.current;
    const handle = delayRender(options.globe ? 'Loading globe plate' : 'Loading map plate');

    installWorkerUrl();

    const instance = new maplibregl.Map({
      container: containerRef.current,
      style: options.style,
      center: options.center,
      zoom: options.zoom,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
      canvasContextAttributes: {preserveDrawingBuffer: true},
    });

    instance.on('load', () => {
      // Projection and sky are style-dependent, so they wait for the style.
      if (options.globe) {
        instance.setProjection({type: 'globe'});
        instance.setSky(ATMOSPHERE);
      }
      options.decorate?.(instance);
      instance.jumpTo({center: options.center, zoom: options.zoom});
      instance.once('idle', () => {
        setMap(instance);
        continueRender(handle);
      });
    });

    // Deliberately no map.remove() here — it interferes with Remotion's render
    // lifecycle, and the plate lives for the whole composition.
  }, []);

  return {containerRef, map};
};
