#!/usr/bin/env node
/**
 * Builds a single self-contained contact sheet of the rendered stills so the
 * frames can be reviewed as real pixels rather than described.
 *
 *   node scripts/contact-sheet.mjs [outDir] [htmlPath]
 *
 * The stills are embedded as downscaled JPEG data URIs, so the sheet is one file
 * with no sibling assets — it renders anywhere a single HTML file can be served.
 */
import {readdir, readFile, writeFile} from 'node:fs/promises';
import {basename, resolve} from 'node:path';
import sharp from 'sharp';

const outDir = resolve(process.argv[2] ?? 'out');
const htmlPath = resolve(process.argv[3] ?? 'contact-sheet.html');

/** `frame-150.png` → 150, so the sheet reads in render order. */
const frameOf = (name) => Number(name.match(/(\d+)/)?.[1] ?? 0);

const files = (await readdir(outDir))
  .filter((name) => name.endsWith('.png'))
  .sort((a, b) => frameOf(a) - frameOf(b));

if (files.length === 0) {
  console.error(`No stills in ${outDir}. Render some first (npm run still -- --frame=N).`);
  process.exit(1);
}

const cells = await Promise.all(
  files.map(async (name) => {
    const jpeg = await sharp(resolve(outDir, name)).resize({width: 960}).jpeg({quality: 82}).toBuffer();
    const frame = frameOf(name);
    return `<figure><img src="data:image/jpeg;base64,${jpeg.toString('base64')}" alt="frame ${frame}" /><figcaption>f${frame} · ${basename(name)}</figcaption></figure>`;
  }),
);

await writeFile(
  htmlPath,
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Basco map promo — rendered stills</title>
<style>
  body { margin: 0; background: #070c16; color: #ede9e3; font: 12px/1.4 ui-monospace, monospace; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; }
  figure { margin: 0; position: relative; }
  img { width: 100%; display: block; }
  figcaption { position: absolute; top: 6px; left: 8px; background: #d4ff32; color: #0b1220; padding: 2px 8px; font-weight: 700; }
</style>
</head>
<body>
<div class="grid">
${cells.join('\n')}
</div>
</body>
</html>
`,
);

console.log(`Wrote ${htmlPath} with ${files.length} frame(s): ${files.join(', ')}`);
