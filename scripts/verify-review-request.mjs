#!/usr/bin/env node
/**
 * Basco Sports – Review-request verification (npm test)
 *
 * Makes the wording rules in docs/REVIEW_REQUESTS.md ("enforced by tests,
 * not by hope") true by executing the REAL module:
 *
 *   src/lib/review-request.ts (+ email.ts + supabase-rest.ts) is compiled to
 *   JS in a temp dir and driven through its lifecycle with a stubbed Supabase
 *   REST API and a local HTTP stand-in for Resend.
 *
 * Asserts:
 *   1. Wording: neutral question present; no 5-star / reward / "positive
 *      review" language in rendered content; subject format; footer.
 *   2. Escaping: customer-controlled fields (order number, customer name,
 *      item name, variant label) are HTML-escaped; product links are
 *      slug-derived.
 *   3. Gates: no send unless COMMERCE_LIVE=true, Resend configured, order
 *      delivered, email present, non-demo order.
 *   4. Claim: race-safe one-per-order claim; re-trigger → no second email;
 *      send failure → claim released → retry succeeds; hooks never throw.
 *
 * Ordering matters: the Resend stand-in server starts BEFORE the compiled
 * module is required, because email.ts and the Resend SDK capture env
 * (RESEND_API_KEY / RESEND_BASE_URL) at module-load time.
 *
 * Exit 0 = all pass. Exit 1 on any failure. Leaves no artifacts.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import http from 'node:http';

const root = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'));
const realFetch = globalThis.fetch; // captured before any stubbing
const failures = [];
const ok = (label, cond) => {
  console.log(`  ${cond ? 'ok' : 'FAIL'}: ${label}`);
  if (!cond) failures.push(label);
};

// Compile into the project's gitignored .freebuff/ (NOT the OS temp dir):
// the compiled email.js does require('resend'), which Node resolves upward
// through node_modules — that only works inside the project tree.
const tmpRoot = join(root, '.freebuff');
mkdirSync(tmpRoot, { recursive: true });
const tmp = mkdtempSync(join(tmpRoot, 'verify-review-request-'));
/** @type {import('node:http').Server | null} */
let resendServer = null;
try {
  // 1. Compile the real module chain to CJS (tsc via node — no shell/.cmd shim).
  //    CLI flags, not a temp tsconfig: tsc resolves @types upward from the
  //    tsconfig location, which breaks outside the project root.
  const tscJs = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  execFileSync(process.execPath, [
    tscJs,
    '--outDir', tmp,
    '--rootDir', join(root, 'src'),
    '--module', 'commonjs',
    '--target', 'es2019',
    '--moduleResolution', 'node',
    '--esModuleInterop',
    '--skipLibCheck',
    join(root, 'src/lib/review-request.ts'),
  ], { cwd: root, stdio: 'pipe' });

  const moduleJs = join(tmp, 'lib', 'review-request.js');
  if (!existsSync(moduleJs)) {
    throw new Error(`compiled module not found at ${moduleJs} — did tsc fail?`);
  }

  // 2. Resend stand-in: local HTTP server; START BEFORE require so its port is
  //    known, then point the Resend SDK at it via env (captured at load).
  const resendSends = [];
  const resendState = { value: 'ok' }; // 'ok' | 'fail' (simulated outage)
  resendServer = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      if (resendState.value === 'fail') {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'simulated outage' }));
        return;
      }
      resendSends.push(JSON.parse(Buffer.concat(chunks).toString()));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ id: 'test-email-id' }));
    });
  });
  await new Promise((r) => resendServer.listen(0, '127.0.0.1', r));
  const resendPort = resendServer.address().port;

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const countSends = async (n) => {
    for (let i = 0; i < 20 && resendSends.length < n; i++) await wait(50);
    return resendSends.length;
  };

  // 3. Env BEFORE require (module-load capture in email.ts / Resend SDK).
  const SB_PORT = 54329;
  process.env.COMMERCE_LIVE = 'true';
  process.env.RESEND_API_KEY = 're_test_placeholder_key';
  process.env.RESEND_BASE_URL = `http://127.0.0.1:${resendPort}`;
  process.env.NEXT_PUBLIC_SUPABASE_URL = `http://127.0.0.1:${SB_PORT}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

  const requireFromTmp = createRequire(moduleJs);
  const {
    sendReviewRequestForOrder,
    maybeSendAfterOrderUpdate,
    maybeSendAfterOrderUpdateBy,
    buildReviewRequestEmail,
    NEUTRAL_REVIEW_QUESTION,
  } = requireFromTmp('./review-request.js');

  // 4. Stub the Supabase REST API. Non-Supabase URLs (Resend → our stand-in)
  //    pass through to real fetch.
  const db = { orders: new Map() };

  globalThis.fetch = async (url, init) => {
    const u = String(url);
    if (!u.includes(`127.0.0.1:${SB_PORT}`)) return realFetch(u, init);
    const restPath = u.split('/rest/v1/')[1] || '';
    const table = restPath.split('?')[0];
    const qs = new URLSearchParams(u.split('?')[1] || '');
    const method = init?.method || 'GET';
    if (method === 'GET') {
      let rows = table === 'orders' ? [...db.orders.values()] : [];
      const idEq = qs.get('id');
      if (idEq?.startsWith('eq.')) rows = rows.filter((r) => r.id === idEq.slice(3));
      const statusEq = qs.get('status');
      if (statusEq?.startsWith('eq.')) rows = rows.filter((r) => r.status === statusEq.slice(3));
      return new Response(JSON.stringify(rows), { status: 200 });
    }
    if (method === 'PATCH') {
      const patch = JSON.parse(init.body);
      const claim = qs.get('reviewRequestSentAt') === 'is.null';
      const unclaim = qs.get('reviewRequestSentAt') === 'not.is.null';
      const idEq = (qs.get('id') || '').startsWith('eq.') ? qs.get('id').slice(3) : null;
      const patched = [];
      for (const r of db.orders.values()) {
        if (idEq && r.id !== idEq) continue;
        if (claim && r.reviewRequestSentAt) continue; // race-safe claim: one winner
        if (unclaim && !r.reviewRequestSentAt) continue;
        db.orders.set(r.id, { ...r, ...patch });
        patched.push(db.orders.get(r.id));
      }
      return new Response(JSON.stringify(patched), { status: 200 });
    }
    return new Response(JSON.stringify([]), { status: 200 });
  };

  // ---------------------------------------------------------------------------
  // 5. Wording + escaping (pure builder — no network)
  // ---------------------------------------------------------------------------
  console.log('\nWording & escaping (buildReviewRequestEmail)');
  const content = buildReviewRequestEmail({
    orderNumber: 'BS-000123',
    customerName: 'Jane <b>Doe</b> & Co',
    items: [
      { name: 'Boot <img src=x onerror=alert(1)>', variantLabel: 'Red / "42"', slug: 'apex-flight-boot' },
      { name: 'Plain Item', variantLabel: `Red / '42'` },
    ],
  });

  ok('subject follows "How was your Basco Sports order <n>?"', content.subject === 'How was your Basco Sports order BS-000123?');
  ok('neutral question present exactly once', content.html.split(NEUTRAL_REVIEW_QUESTION).length - 1 === 1);
  const forbidden = [
    ['5 star', /5[- ]?star/i],
    ['positive review', /positive review/i],
    ['reward', /reward/i],
    ['gift', /gift/i],
    ['incentive', /incentiv/i],
  ];
  for (const [label, re] of forbidden) {
    ok(`forbidden wording absent: ${label}`, !re.test(content.html) && !re.test(content.subject));
  }
  ok('footer states one-per-order', content.html.includes('You will receive at most one review request per order.'));
  ok('item name escaped (raw tag absent)', !content.html.includes('<img src=x') && content.html.includes('&lt;img src=x'));
  ok('customer name escaped', content.html.includes('Jane &lt;b&gt;Doe&lt;/b&gt; &amp; Co'));
  ok('variant double-quote escaped', content.html.includes('Red / &quot;42&quot;'));
  ok('variant single-quote escaped', content.html.includes(`Red / &#39;42&#39;`));
  ok('product link derived from slug', content.html.includes('/product/apex-flight-boot'));

  // ---------------------------------------------------------------------------
  // 6. Lifecycle (compiled module against stubs)
  // ---------------------------------------------------------------------------
  console.log('\nGates & lifecycle (compiled module, stubbed Supabase/Resend)');
  const order = (id, over = {}) => ({ id, orderNumber: `BS-${id}`, customerEmail: `${id}@x.co`, status: 'delivered', items: [], ...over });

  // Gate: commerce off
  process.env.COMMERCE_LIVE = 'false';
  const gatedOut = await sendReviewRequestForOrder('g1');
  ok('gate: COMMERCE_LIVE off → commerce-not-live, zero DB calls', gatedOut.sent === false && gatedOut.reason === 'commerce-not-live' && db.orders.size === 0);

  process.env.COMMERCE_LIVE = 'true';
  const missingOut = await sendReviewRequestForOrder('missing');
  ok('guard: missing order → order-not-found', missingOut.reason === 'order-not-found');

  db.orders.set('o2', order('o2', { status: 'shipped' }));
  const shippedOut = await sendReviewRequestForOrder('o2');
  ok('guard: shipped → not-delivered', shippedOut.reason === 'not-delivered');

  db.orders.set('o3', order('o3', { customerEmail: 'nope' }));
  const emailOut = await sendReviewRequestForOrder('o3');
  ok('guard: bad email → no-email', emailOut.reason === 'no-email');

  db.orders.set('demo_order_9', order('demo_order_9'));
  const demoOut = await sendReviewRequestForOrder('demo_order_9');
  ok('guard: demo order → demo-order', demoOut.reason === 'demo-order');

  // Happy path + claim
  db.orders.set('o5', order('o5', {
    customerName: 'Jane <b>Doe</b>',
    items: [{ productId: 'p9', name: 'Boot <img src=x>', variantLabel: 'Red / "42"', quantity: 1 }],
  }));
  const happy = await sendReviewRequestForOrder('o5');
  ok('happy path sends', happy.sent === true);
  ok('claim marker set after send', typeof db.orders.get('o5').reviewRequestSentAt === 'string');
  ok('exactly one email sent', (await countSends(1)) === 1);
  ok('delivered email carries escaped customer content', !!resendSends[0] && resendSends[0].html.includes('Jane &lt;b&gt;Doe&lt;/b&gt;'));
  ok('subject carries the order number', !!resendSends[0] && resendSends[0].subject.includes('BS-o5'));

  // Re-trigger blocked
  const again = await sendReviewRequestForOrder('o5');
  const sendsAfterAgain = await countSends(1);
  ok('re-trigger → already-requested, no second email', again.reason === 'already-requested' && sendsAfterAgain === 1);

  // Send outage → claim released → retry succeeds
  db.orders.set('o6', order('o6'));
  resendState.value = 'fail';
  const outage = await sendReviewRequestForOrder('o6');
  ok('send failure after claim → send-failed-claim-released', outage.reason === 'send-failed-claim-released');
  ok('claim released (marker NULL again)', db.orders.get('o6').reviewRequestSentAt === null);
  resendState.value = 'ok';
  const retry = await sendReviewRequestForOrder('o6');
  ok('retry after release succeeds', retry.sent === true);
  ok('claim re-set on success', !!db.orders.get('o6').reviewRequestSentAt);
  ok('email count after retry is 2', (await countSends(2)) === 2);

  // Hooks never throw; delivered patch triggers exactly once
  await maybeSendAfterOrderUpdate('o7', { status: 'shipped' });
  ok('hook update: non-delivered patch → no fetch/claim', !db.orders.has('o7'));
  db.orders.set('o7', order('o7'));
  await maybeSendAfterOrderUpdate('o7', { status: ' Delivered ' });
  await countSends(3);
  ok('hook update: delivered patch → sent', !!db.orders.get('o7').reviewRequestSentAt && resendSends.length === 3);
  db.orders.set('o8', order('o8'));
  await maybeSendAfterOrderUpdateBy('id', 'o8', { status: 'delivered' });
  await countSends(4);
  ok('hook updateBy: delivered row sent', !!db.orders.get('o8').reviewRequestSentAt && resendSends.length === 4);
  await maybeSendAfterOrderUpdateBy(null, null, { status: 'delivered' });
  await maybeSendAfterOrderUpdate('x', null);
  ok('hook garbage input → no throw, no send', resendSends.length === 4);
} catch (err) {
  console.error('FATAL:', err && err.message ? err.message : err);
  process.exitCode = 1;
} finally {
  // Shut the stand-in down fully BEFORE process.exit — exiting mid-close with
  // open keep-alive sockets trips a libuv assertion on Windows. Destroy the
  // connections first, then await the close itself (race-guarded so a stubborn
  // socket can only delay, never hang, the run).
  if (resendServer) {
    resendServer.closeIdleConnections?.();
    resendServer.closeAllConnections?.();
    await Promise.race([
      new Promise((r) => resendServer.close(r)),
      new Promise((r) => setTimeout(r, 1000)),
    ]);
  }
  rmSync(tmp, { recursive: true, force: true });
}

if (failures.length) process.exitCode = 1;
console.log(failures.length ? `\n${failures.length} FAILURE(S)` : '\nALL PASS');
// Exit naturally once the loop drains (no assertion noise, stdout flushed).
// Unref'd backstop: a stray ref'd handle (e.g. an undici agent) may only delay
// the run, never hang it — and never skip the real exit code.
setTimeout(() => process.exit(process.exitCode === 1 ? 1 : 0), 5000).unref();
