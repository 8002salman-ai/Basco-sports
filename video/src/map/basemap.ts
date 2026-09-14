import type {LayerSpecification, StyleSpecification} from 'maplibre-gl';

/**
 * Brand basemaps.
 *
 * MapLibre's stock demo style is a rainbow political chart with country labels.
 * It fights the Basco palette, and its labels land on top of the shipping pins.
 * These styles keep the demo's vector source — real coastlines, no API key — but
 * repaint it in brand colour and draw no text at all, so the only type on a plate
 * is the plate's own.
 *
 * Both plates are rendered at a fixed zoom, so line weights are flat values
 * rather than the demo's zoom stops.
 */
const SOURCE = {type: 'vector', url: 'https://demotiles.maplibre.org/tiles/tiles.json'} as const;
/** Glyphs are needed only by the pin labels the zones plate adds. */
const GLYPHS = 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf';

interface Palette {
  sea: string;
  land: string;
  coast: string;
  boundary: string;
  /** The lat/long graticule, or `null` to hide it as noise at continent zoom. */
  graticule: string | null;
  coastWidth: number;
}

const style = (palette: Palette): StyleSpecification => {
  const {sea, land, coast, boundary, graticule, coastWidth} = palette;
  const layers: LayerSpecification[] = [
    {id: 'sea', type: 'background', paint: {'background-color': sea}},
    {
      id: 'graticule',
      type: 'line',
      source: 'maplibre',
      'source-layer': 'geolines',
      filter: ['!=', 'name', 'International Date Line'],
      layout: {visibility: graticule ? 'visible' : 'none'},
      paint: {'line-color': graticule ?? sea, 'line-opacity': 0.5, 'line-dasharray': [2, 5]},
    },
    {
      id: 'land',
      type: 'fill',
      source: 'maplibre',
      'source-layer': 'countries',
      paint: {'fill-color': land},
    },
    {
      id: 'coastline',
      type: 'line',
      source: 'maplibre',
      'source-layer': 'countries',
      paint: {'line-color': coast, 'line-width': coastWidth},
    },
    {
      id: 'boundary',
      type: 'line',
      source: 'maplibre',
      'source-layer': 'countries',
      paint: {'line-color': boundary, 'line-width': 0.7},
    },
  ];

  return {version: 8, glyphs: GLYPHS, sources: {maplibre: SOURCE}, layers};
};

/** Beat one: the earth at night, one step up from the plate background. */
export const GLOBE_BASEMAP = style({
  sea: '#070C16',
  land: '#16264A',
  coast: '#4A7FBF',
  boundary: '#263F66',
  graticule: '#22395C',
  coastWidth: 1.6,
});

/** Beat two: a light editorial map, so the lime pins and dark legend carry it. */
export const ZONES_BASEMAP = style({
  sea: '#E4DFD6',
  land: '#D5CCBC',
  coast: '#A2957F',
  boundary: '#BCB09C',
  graticule: null,
  coastWidth: 1.2,
});
