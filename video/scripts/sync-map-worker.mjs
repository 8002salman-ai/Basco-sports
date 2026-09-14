#!/usr/bin/env node
/**
 * Copies MapLibre's self-contained worker into `public/` so the renderer can
 * load it from the same origin.
 *
 * MapLibre parses styles and vector tiles inside a Web Worker. Its bundled
 * worker is not resolvable through a bundler, and the usual workaround — a blob
 * that imports the worker from a CDN — needs those CDN responses to be
 * CORS-enabled. unpkg's are not, so in a headless render the worker never
 * starts, the style never loads, and the whole composition hangs on
 * `delayRender()`. Serving the shipped CSP worker build from our own origin
 * removes the network from the critical path entirely.
 *
 * Runs before every bundle; `public/maplibre-gl-csp-worker.js` is gitignored.
 */
import {copyFileSync, existsSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, 'node_modules', 'maplibre-gl', 'dist', 'maplibre-gl-csp-worker.js');
const target = join(root, 'public', 'maplibre-gl-csp-worker.js');

if (!existsSync(source)) {
  console.error(`[map-worker] missing ${source} — run npm install first`);
  process.exit(1);
}

mkdirSync(dirname(target), {recursive: true});
copyFileSync(source, target);
console.log('[map-worker] public/maplibre-gl-csp-worker.js ready');
