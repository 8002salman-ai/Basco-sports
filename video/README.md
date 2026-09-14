# Basco Sports — map promo video

Standalone Remotion project (own `package.json`, nothing here is imported by the
storefront or by `deploy`).

- **Technique:** MapLibre GL JS + Turf (the `remotion-maps` technique that needs
  no API key).
- **Shot:** globe → shipping footprint → brand lockup. 1920×1080, 30fps, 10s.

## Layout

```
src/brand.ts                 palette, copy, beat timeline, plate cameras
src/zones.ts                 shipping zones + the store's football mark paths
src/map/basemap.ts           the two brand basemaps (globe / zones)
src/map/useFrozenMap.ts      the plate hook: camera set once, plus worker + sky
src/plates/GlobePlate.tsx    beat one
src/plates/ZonesPlate.tsx    beat two, including the shipping pins
src/BascoGlobePromo.tsx      composition: beats, cross-dissolve, captions, lockup
scripts/sync-map-worker.mjs  vendors MapLibre's worker into public/ before bundling
scripts/contact-sheet.mjs    builds contact-sheet.html from rendered PNGs
```

## Why it is built out of fixed plates

The technique's render-stability rules say a moving 2D basemap jitters if the
renderer camera moves per frame, and that a plate must be rendered at the most
zoomed-in framing of its beat so CSS scale only ever moves *down* from `1`. Those
two rules set the architecture:

| Beat | Frames | Plate | Camera | Motion |
| --- | --- | --- | --- | --- |
| Globe | 0–108 | 2304×1296, globe projection, zoom 2.6 | frozen | CSS scale 0.86 → 1 |
| Dissolve | 108–126 | — | — | opacity cross-dissolve |
| Zones | 126–252 | 4096×2304, mercator, zoom 3 | frozen | CSS scale 0.88 → 1, pan 22°E → 4°W, latitude 38° → 43°N |
| Dip | 258–276 | — | — | map fades to the lockup's dark plate |
| Lockup | 276–300 | — | — | type fades in once the map is gone |

A single continuous zoom from a globe to a city street is not possible under
those rules: the plate would have to be several times the 4096 px render-buffer
limit and would be enlarged past its native resolution. Splitting the shot into
plates with a deliberate dissolve is the technique's own prescribed answer.

Each plate's camera is set once with `jumpTo()` before `continueRender()`, and
never touched again. Geographic animation is GeoJSON + paint properties only
(the zone pins), which the technique allows. The map is fully opaque-off before
the lockup type arrives, so no frame shows the legend and the wordmark at once.

## Basemap

The stock MapLibre demo style is a rainbow political chart with country labels:
it fights the Basco palette and its labels land on top of the shipping pins.
`src/map/basemap.ts` keeps the demo's keyless vector source and real coastlines
but repaints it in brand colour and draws **no text**, so the pin names are the
only type on the map. It also drops the demo's `crimea` layer.

The globe adds a `sky` (see `ATMOSPHERE` in `src/map/useFrozenMap.ts`) whose
`sky-color` matches the plate background, so the atmosphere reads as a glow on
the sphere's limb rather than a coloured box around it.

## Data

`src/zones.ts` mirrors the store's own shipping-zone table — the same zone
names, carriers and delivery estimates the admin console shows. Hub cities are
used only to place a pin; no delivery claim is invented. Copy is taken from the
storefront (`Free shipping over $100`, `30-day returns`, the meta description).

## Render

```bash
npm install
npm run typecheck
npm run compositions        # confirms BascoGlobePromo is registered
npm run still -- --frame=215 out/frame-215.png
npm run render              # out/basco-globe-promo.mp4
npm run studio              # interactive
```

`remotion.config.ts` pins `--gl=angle` and `--concurrency=1`, so a manual
invocation behaves the same as the npm script.

## Reviewing frames

Do not trust a still to prove an animated plate works.

```bash
npm run still -- --frame=215 out/frame-215.png   # one frame, rendered first
npm run sheet -- out contact-sheet.html           # contact sheet of out/*.png
```

A still renders its target frame as the *first* frame of a fresh page, so any
per-frame map update that is keyed on a phase — rather than on the animated
value — looks correct in stills and is missing from the export. To check what
the video actually contains, pull frames back out of the mp4:

```bash
FF=node_modules/@remotion/compositor-win32-x64-msvc
"$FF/ffprobe.exe" -v error -show_entries stream=nb_frames,width,height -of default=nw=1 out/basco-globe-promo.mp4
"$FF/ffmpeg.exe" -v error -i out/basco-globe-promo.mp4 -ss 7.1667 -frames:v 1 -y out/decoded/n215.png
```

`-ss` must come *after* `-i` for a frame-accurate seek.

## Known deviations

- **Typeface.** The web brand uses Syne for display type. The video renders
  headless and does not fetch webfonts, so it uses a geometric system stack.
  Loading Syne locally (or via `@remotion/google-fonts`) would close this.
- **Projection.** MapLibre's globe projection is used for the opening beat; it
  is a real globe, not a pitched/banked 3D camera (that would need CesiumJS).
- **Basemap data.** The plates still read MapLibre's public demo tiles at render
  time, so a render needs network access. Self-hosting those tiles (or vendoring
  Natural Earth geometry) would remove that dependency.
