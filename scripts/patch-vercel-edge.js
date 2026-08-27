/**
 * patch-vercel-edge.js
 *
 * Fixes the @vercel/next edge-function bundling bug seen on Windows: `vercel build`
 * creates SYMLINKS for every edge .func directory (all api/*.func point at
 * api/admin/db.func), so Cloudflare's next-on-pages conversion routes every request
 * to whichever route's bundle lives in that one real directory.
 *
 * The plain `next build` output (.next/server/app/.../route.js|page.js) is CORRECT —
 * each edge route has its own webpack chunk with its own route module. This script:
 *   1. Uses the stripe edge bundle as a template (it has the full edge runtime).
 *   2. For each edge route, swaps in the correct route chunk + entry module + names.
 *   3. Replaces each symlinked .func dir with a real dir holding the patched bundle.
 *
 * Usage: node scripts/patch-vercel-edge.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FUNC_DIR = path.join(ROOT, '.vercel', 'output', 'functions');
const NEXT_DIR = path.join(ROOT, '.next', 'server', 'app');

// --- 1. Template: the real edge bundle (api/admin/db.func is the real dir) ---
const templatePath = path.join(FUNC_DIR, 'api', 'admin', 'db.func', 'index.js');
if (!fs.existsSync(templatePath)) {
  console.error('Template bundle missing — run `npx vercel build` first.');
  process.exit(1);
}
const template = fs.readFileSync(templatePath, 'utf8');
console.log('Template bundle:', path.relative(ROOT, templatePath), `(${template.length} bytes)`);

// --- 2. Locate template chunk boundaries ---
const regIdx = template.indexOf('middleware_app/api/');
if (regIdx === -1) {
  console.error('Template has no API entry — unexpected bundle shape.');
  process.exit(1);
}
let callbackStart = template.lastIndexOf(',t=>{var e=e=>t(t.s=e)', regIdx);
if (callbackStart === -1) callbackStart = template.lastIndexOf(',L=>{var C=u=>L(L.s=u)', regIdx);
if (callbackStart === -1) {
  console.error('Could not find the entry callback in the template bundle.');
  process.exit(1);
}
let moduleMapEnd = callbackStart - 1;
while (moduleMapEnd >= 0 && template[moduleMapEnd] !== '}') moduleMapEnd--;
const pushStartMarker = template.lastIndexOf('.push([[', moduleMapEnd);
const tplChunkId = template.slice(pushStartMarker).match(/\.push\(\[\[(\d+(?:,\d+)*)\]/)[1];
const moduleMapStart = template.indexOf('{', pushStartMarker);
const tplModuleMap = template.slice(moduleMapStart, moduleMapEnd + 1);
console.log('Template route chunk id:', tplChunkId, '| module map:', tplModuleMap.length, 'bytes');

// Top-level module ids defined in the template's SHARED chunks (all chunk pushes
// except the route chunk we replace). Webpack module ids are global, so route
// chunks must NOT redefine these (next-on-pages would emit duplicate identifiers).
function chunkPushKeys(bundle, exceptChunkId) {
  const keys = new Set();
  const re = /\.push\(\[\[(\d+(?:,\d+)*)\],\{/g;
  let m;
  while ((m = re.exec(bundle)) !== null) {
    const ids = m[1].split(',');
    if (ids.includes(String(exceptChunkId))) continue;
    const mapStart = m.index + m[0].length - 1;
    let depth = 0;
    for (let i = mapStart; i < bundle.length; i++) {
      if (bundle[i] === '{') depth++;
      else if (bundle[i] === '}') {
        depth--;
        if (depth === 0) {
          // top-level keys of this chunk: `KEY:(args)=>` or `KEY:param=>`
          const mapStr = bundle.slice(mapStart + 1, i);
          for (const km of mapStr.matchAll(/\b(\d+):(?:[^,{}=]+=>|\([^)]*\)=>)/g)) {
            keys.add(km[1]);
          }
          break;
        }
      }
    }
  }
  return keys;
}
const templateDefinedIds = chunkPushKeys(template, tplChunkId);
console.log('Template shared-chunk module ids:', templateDefinedIds.size);

// Parse a webpack module map into top-level entries: {key, raw}.
function parseModuleMap(mapStr) {
  const entries = [];
  let i = 0;
  while (i < mapStr.length) {
    const keyMatch = mapStr.slice(i).match(/^(\d+):/);
    if (!keyMatch) break;
    const key = keyMatch[1];
    const keyEnd = i + keyMatch[0].length;
    // Body starts at the first '{' after the key.
    const bodyStart = mapStr.indexOf('{', keyEnd);
    if (bodyStart === -1) break;
    let depth = 0;
    let bodyEnd = -1;
    for (let j = bodyStart; j < mapStr.length; j++) {
      if (mapStr[j] === '{') depth++;
      else if (mapStr[j] === '}') {
        depth--;
        if (depth === 0) {
          bodyEnd = j;
          break;
        }
      }
    }
    if (bodyEnd === -1) break;
    let entryEnd = bodyEnd + 1;
    while (entryEnd < mapStr.length && /\s/.test(mapStr[entryEnd])) entryEnd++;
    if (mapStr[entryEnd] === ',') entryEnd++;
    entries.push({ key, raw: mapStr.slice(i, entryEnd) });
    i = entryEnd;
  }
  return entries;
}

// Remove module entries (by id) from a webpack module map string.
function stripModules(moduleMap, idsToStrip) {
  const ids = new Set(idsToStrip);
  const kept = parseModuleMap(moduleMap).filter((e) => !ids.has(e.key));
  return '{' + kept.map((e) => e.raw.replace(/,$/, '')).join(',') + '}';
}

// --- 3. Helpers ---
function extractRouteChunk(nextFile) {
  const src = fs.readFileSync(nextFile, 'utf8');
  const pushMatch = src.match(/\.push\(\[\[(\d+(?:,\d+)*)\],\{/);
  if (!pushMatch) return null;
  const chunkId = pushMatch[1];
  const braceStart = pushMatch.index + pushMatch[0].length - 1;
  let depth = 0;
  let braceEnd = -1;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        braceEnd = i;
        break;
      }
    }
  }
  if (braceEnd === -1) return null;
  const moduleMap = src.slice(braceStart, braceEnd + 1);
  const ids = [...moduleMap.matchAll(/\b(\d+):\(/g)].map((m) => m[1]);
  let routeModuleId = null;
  for (const id of ids) {
    const keyStr = `${id}:(`;
    const keyIdx = moduleMap.indexOf(keyStr);
    if (keyIdx === -1) continue;
    const rest = moduleMap.slice(keyIdx + keyStr.length);
    const next = [...rest.matchAll(/\b(\d+):\(/g)];
    const bodyEnd = next.length ? next[0].index : rest.length;
    if (rest.slice(0, bodyEnd).includes('ComponentMod')) {
      routeModuleId = id;
      break;
    }
  }
  return { chunkId, moduleMap, routeModuleId };
}

function buildRouteBundle(routePath, nextFile) {
  const chunk = extractRouteChunk(nextFile);
  if (!chunk || !chunk.routeModuleId) return null;
  // Drop any module the template already defines (dup ids break func.js generation).
  const deduped = stripModules(chunk.moduleMap, [...templateDefinedIds]);
  let out =
    template.slice(0, pushStartMarker) +
    template
      .slice(pushStartMarker)
      .replace(`[[${tplChunkId}],${tplModuleMap}`, `[[${chunk.chunkId}],${deduped}`);
  out = out.replace(/\(\)=>e\(\d+\)/, `()=>e(${chunk.routeModuleId})`);
  out = out.replace(/("middleware_app)\/api\/[^\"]+("\s*:\s*\w+)/g, `$1${routePath}$2`);
  out = out.replace(/("app)\/api\/[^\"]+("\s*:\s*\w+)/g, `$1${routePath}$2`);
  return out.includes(`middleware_app${routePath}`) ? out : null;
}

function routeToFuncDir(routePath) {
  const segments = routePath.split('/').filter(Boolean);
  if (!segments.length) return null;
  segments.pop(); // route|page
  return segments.length ? `${segments.join('/')}.func` : null;
}

// --- 4. Edge routes ---
const manifest = JSON.parse(
  fs.readFileSync(path.join(NEXT_DIR, '..', 'middleware-manifest.json'), 'utf8')
);
const edgeRoutes = Object.keys(manifest.functions || {});
console.log('Edge routes:', edgeRoutes.length);

// launcher + vc-config template from the real db.func dir
const launcherSrc = fs.readFileSync(path.join(FUNC_DIR, 'api', 'admin', 'db.func', '___next_launcher.cjs'), 'utf8');
const vcTemplate = JSON.parse(
  fs.readFileSync(path.join(FUNC_DIR, 'api', 'admin', 'db.func', '.vc-config.json'), 'utf8')
);

// --- 5. Patch every edge function ---
let patched = 0;
const failed = [];
for (const routePath of edgeRoutes) {
  const nextFile = path.join(NEXT_DIR, routePath.slice(1) + '.js');
  if (!fs.existsSync(nextFile)) {
    failed.push(`${routePath} (no .next file)`);
    continue;
  }
  const funcDirName = routeToFuncDir(routePath);
  if (!funcDirName) {
    failed.push(`${routePath} (no dir)`);
    continue;
  }
  const bundle = buildRouteBundle(routePath, nextFile);
  if (!bundle) {
    failed.push(`${routePath} (build failed)`);
    continue;
  }

  const funcDir = path.join(FUNC_DIR, funcDirName);
  // Remove the symlink (or stale real dir) and create a REAL directory.
  fs.rmSync(funcDir, { recursive: true, force: true });
  fs.mkdirSync(funcDir, { recursive: true });
  fs.writeFileSync(path.join(funcDir, 'index.js'), bundle);
  const cfg = { ...vcTemplate, name: routePath.replace(/^\//, '').replace(/\/route$|\/page$/, '') };
  fs.writeFileSync(path.join(funcDir, '.vc-config.json'), JSON.stringify(cfg, null, 2));
  fs.writeFileSync(path.join(funcDir, '___next_launcher.cjs'), launcherSrc);

  const st = fs.statSync(path.join(funcDir, 'index.js'));
  if (st.isSymbolicLink() || fs.lstatSync(path.join(funcDir, 'index.js')).isSymbolicLink()) {
    failed.push(`${routePath} (still symlink!)`);
    continue;
  }
  console.log(`  patched ${routePath} -> entry ${bundle.match(/\)=>e\((\d+)\)/)?.[1]}`);
  patched++;
}

console.log(`\nDone. Patched ${patched} edge functions.`);
if (failed.length) {
  console.log('Failed:');
  for (const f of failed) console.log('  - ' + f);
}
