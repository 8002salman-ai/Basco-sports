import {useEffect, useRef} from 'react';
import {AbsoluteFill, Easing, continueRender, delayRender, interpolate} from 'remotion';
import * as turf from '@turf/turf';
import type {GeoJSONSource, Map} from 'maplibre-gl';
import {BRAND, PLATES} from '../brand';
import {SHIPPING_ZONES} from '../zones';
import {ZONES_BASEMAP} from '../map/basemap';
import {useFrozenMap} from '../map/useFrozenMap';

const LIME = BRAND.lime;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Each zone's pin gets a staggered slice of the drop window. */
const PIN_STAGGER = 0.16;
const PIN_RAMP = 0.24;

const zoneData = (pinProgress: number) => {
  const points = SHIPPING_ZONES.map((zone, index) => {
    const elapsed = clamp01((pinProgress - index * PIN_STAGGER) / PIN_RAMP);
    // Radius overshoots slightly so the pin reads as dropped, not faded in.
    const pop = interpolate(elapsed, [0, 1], [0, 1], {
      easing: Easing.out(Easing.back(1.6)),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    // Both ramps are front-loaded. A pin is opaque well before it finishes
    // growing, and its name only arrives once it has landed, so no frame shows a
    // pale half-drawn dot or an illegible ghost of a label over the map.
    const opacity = interpolate(elapsed, [0, 0.45], [0, 1], {
      easing: Easing.out(Easing.quad),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    const labelOpacity = interpolate(elapsed, [0.7, 1], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    // Neighbouring hubs put their labels on opposite sides of the pin: London
    // and Frankfurt are ~100px apart at this zoom, so both-below would collide.
    const above = index % 2 === 1;
    return turf.point(zone.hub, {
      name: zone.name,
      radius: 6 + 16 * pop,
      opacity,
      labelOpacity,
      labelAnchor: above ? 'bottom' : 'top',
      labelOffset: [0, above ? -1.3 : 1.3],
    });
  });

  return turf.featureCollection(points);
};

const decorate = (map: Map) => {
  map.addSource('zones', {type: 'geojson', data: zoneData(0)});

  map.addLayer({
    id: 'zone-pins',
    type: 'circle',
    source: 'zones',
    paint: {
      'circle-radius': ['get', 'radius'],
      'circle-color': LIME,
      'circle-opacity': ['get', 'opacity'],
      'circle-stroke-color': BRAND.obsidian,
      'circle-stroke-width': 5,
      'circle-stroke-opacity': ['get', 'opacity'],
    },
  });

  map.addLayer({
    id: 'zone-names',
    type: 'symbol',
    source: 'zones',
    layout: {
      'text-field': ['get', 'name'],
      'text-size': 42,
      'text-anchor': ['get', 'labelAnchor'],
      'text-offset': ['get', 'labelOffset'],
      'text-allow-overlap': true,
      'text-ignore-placement': true,
    },
    paint: {
      'text-color': BRAND.obsidian,
      'text-halo-color': BRAND.stone,
      'text-halo-width': 4,
      'text-opacity': ['get', 'labelOpacity'],
    },
  });
};

/**
 * Beat two: a modest reframe across the shipping footprint, with the camera
 * frozen and only the GeoJSON pin data animated.
 *
 * `progress` drives the CSS plate transform, `pinProgress` the pins. Once the
 * pins have settled the beat stops taking render handles, so the remaining
 * frames cost nothing but a transform. The basemap draws no text, so the pin
 * names are the only type on the map and cannot collide with a country label.
 */
export const ZonesPlate: React.FC<{progress: number; pinProgress: number}> = ({progress, pinProgress}) => {
  const {containerRef, map} = useFrozenMap({
    style: ZONES_BASEMAP,
    center: PLATES.zones.center,
    zoom: PLATES.zones.zoom,
    decorate,
  });

  const appliedRef = useRef<number | null>(null);

  useEffect(() => {
    // Memoise on the drop's *value*, not on a phase of it. A phase would be
    // reached on the first frame of a multi-frame render — where `pinProgress`
    // is 0 — and every later frame would then be skipped, leaving the pins
    // invisible for the whole shot. `remotion still` hides that, because there
    // the frame being exported is the first frame rendered.
    //
    // Keying on the value keeps the animation, and still does no work on the
    // ~85 frames after the last pin lands.
    if (!map || appliedRef.current === pinProgress) {
      return;
    }
    appliedRef.current = pinProgress;

    const handle = delayRender('Zones plate frame');
    const source = map.getSource('zones') as GeoJSONSource | undefined;
    source?.setData(zoneData(pinProgress));
    map.once('idle', () => continueRender(handle));
    // `setData` may decide the source is already current and schedule nothing,
    // which would leave the handle open and stall the render. Force the pass
    // that produces the `idle` we are waiting for.
    map.triggerRepaint();
  }, [map, pinProgress]);

  const {width, height} = PLATES.zones;
  const easing = Easing.inOut(Easing.cubic);
  const scale = interpolate(progress, [0, 1], [PLATES.zones.scaleFrom, 1], {
    easing,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const [endLng, endLat] = PLATES.zones.center;
  const [fromLng, fromLat] = PLATES.zones.centerFrom;
  const center: [number, number] = [
    interpolate(progress, [0, 1], [fromLng, endLng], {easing}),
    interpolate(progress, [0, 1], [fromLat, endLat], {easing}),
  ];

  // `project` needs the loaded map; before that the plate centre is exact anyway
  // because the camera sits at the plate's centre until the first frame is due.
  const projected = map ? map.project(center) : {x: width / 2, y: height / 2};

  return (
    <AbsoluteFill style={{backgroundColor: BRAND.stone, overflow: 'hidden'}}>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          transform: `translate(${960 - projected.x * scale}px, ${540 - projected.y * scale}px) scale(${scale})`,
          transformOrigin: '0 0',
        }}
      />
    </AbsoluteFill>
  );
};
