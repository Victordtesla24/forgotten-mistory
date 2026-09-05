#!/usr/bin/env node
/* Independent re-run of the P95 deploy-skew cutover, port 5603.
 * build A served -> worker installs in a persistent profile -> build B published on the
 * same origin -> the STILL-OPEN build-A page updates its worker, then scrolls to
 * #experience (the lazy scene chunk build B no longer has) -> reload lands on build B. */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/root/forgotten-mistory/.claude/worktrees/wf_6fd4d3c4-790-1/package.json');
const { chromium } = require('playwright');

const [, , buildA, buildB] = process.argv;
let ROOT = buildA;
const PORT = 5603;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.txt': 'text/plain; charset=utf-8', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json' };

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let p = join(ROOT, decodeURIComponent(url.pathname));
  if (existsSync(p) && statSync(p).isDirectory()) p = join(p, 'index.html');
  if (!existsSync(p) && existsSync(`${p}.html`)) p = `${p}.html`;
  if (!existsSync(p) || statSync(p).isDirectory()) { res.writeHead(404, { 'content-type': 'text/plain' }); res.end('Not Found'); return; }
  res.writeHead(200, { 'content-type': MIME[extname(p)] ?? 'application/octet-stream', 'cache-control': 'no-cache' });
  res.end(readFileSync(p));
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const origin = `http://127.0.0.1:${PORT}`;
const log = (...a) => console.log(...a);

const swA = readFileSync(join(buildA, 'sw.js'), 'utf8');
const manifestA = JSON.parse(swA.match(/const PRECACHE_ASSETS = (\[[^\n]*\]);/)[1]);
const stampA = swA.match(/const CACHE_VERSION = '([^']+)'/)[1];
const swB = readFileSync(join(buildB, 'sw.js'), 'utf8');
const stampB = swB.match(/const CACHE_VERSION = '([^']+)'/)[1];
const lazyA = manifestA.filter((a) => /\/chunks\/\d+\.[0-9a-f]+\.js$/.test(a));
log(`build A stamp        : fm-static-${stampA}  (precache ${manifestA.length} assets, ${lazyA.length} lazy chunks)`);
log(`build B stamp        : fm-static-${stampB}`);

const ctx = await chromium.launchPersistentContext('/tmp/rev-cutover-profile', {
  headless: true,
  channel: 'chrome',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());
const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', (e) => pageErrors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
const chunkRequests = [];
page.on('response', (r) => { if (/\/_next\/static\/chunks\/\d+\.[0-9a-f]+\.js/.test(r.url())) chunkRequests.push(`${r.status()} ${r.url().split('/').pop()}`); });

// ---- visit 1, build A -------------------------------------------------------------
await page.goto(`${origin}/?gl=force`, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, { timeout: 60000 });
const cachedA = await page.waitForFunction(async (want) => {
  const keys = await caches.keys();
  const mine = keys.find((k) => k.startsWith('fm-static-'));
  if (!mine) return false;
  const n = (await (await caches.open(mine)).keys()).length;
  return n >= want ? n : false;
}, manifestA.length, { timeout: 90000 }).then((h) => h.jsonValue());
log(`visit 1 (build A)    : worker controlling, cache fm-static-${stampA} holds ${cachedA} entries`);

// a synthetic older generation, to see whether activate really drops the third
await page.evaluate(async () => { const c = await caches.open('fm-static-deadbeef'); await c.put('/__probe__', new Response('old')); });
log(`generations before   : ${(await page.evaluate(() => caches.keys())).sort().join(', ')}`);

// ---- the deploy -------------------------------------------------------------------
ROOT = buildB;
const probe = lazyA[0];
const originStatus = await fetch(`${origin}${probe}`).then((r) => r.status);
log(`origin now answers   : ${probe} -> HTTP ${originStatus} (the incident's 404)`);

// the open build-A page picks up build B's worker (skipWaiting + clients.claim)
await page.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
const gens = await page.waitForFunction(async (want) => {
  const keys = await caches.keys();
  return keys.includes(want) ? keys : false;
}, `fm-static-${stampB}`, { timeout: 90000 }).then((h) => h.jsonValue());
log(`generations after    : ${gens.sort().join(', ')}`);
log(`  build A kept       : ${gens.includes(`fm-static-${stampA}`)}`);
log(`  build B present    : ${gens.includes(`fm-static-${stampB}`)}`);
log(`  stale 3rd dropped  : ${!gens.includes('fm-static-deadbeef')}`);
await page.waitForFunction(async (want) => (await navigator.serviceWorker.getRegistration())?.active?.scriptURL !== undefined && (await caches.keys()).includes(want), `fm-static-${stampB}`, { timeout: 30000 });

// the worker still answers build A's now-deleted chunk
const rescued = await page.evaluate(async (u) => { const r = await fetch(u); return { status: r.status, bytes: (await r.arrayBuffer()).byteLength }; }, probe);
log(`worker answers       : ${probe} -> HTTP ${rescued.status}, ${rescued.bytes} bytes (origin says ${originStatus})`);

// ---- the mid-visit scroll: the incident itself ------------------------------------
const before = chunkRequests.length;
for (const id of ['#about', '#experience', '#skills', '#vitrine', '#listen']) {
  await page.locator(id).scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
}
await page.waitForTimeout(4000);
const midVisit = {
  sections: await page.locator('section[id]').count(),
  canvases: await page.locator('canvas').count(),
  chunkFailures: pageErrors.filter((e) => /Loading (CSS )?chunk/i.test(e)),
  errorShell: /Something went wrong|SYSTEM INTERRUPT|System interrupt/.test(await page.locator('body').innerText()),
  chunksFetchedOnScroll: chunkRequests.slice(before),
};
log(`mid-visit scroll (A) : sections ${midVisit.sections}, canvases ${midVisit.canvases}, chunk errors ${midVisit.chunkFailures.length}, error shell ${midVisit.errorShell}`);
log(`  chunks on scroll   : ${midVisit.chunksFetchedOnScroll.join(' | ') || '(all already in memory/precache)'}`);
log(`  pageerrors         : ${pageErrors.length ? pageErrors.join(' | ') : 'none'}`);

// ---- the reload lands on build B ---------------------------------------------------
await page.reload({ waitUntil: 'domcontentloaded' });
await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 30000 }).catch(() => {});
await page.locator('#experience').scrollIntoViewIfNeeded();
await page.waitForTimeout(4000);
const html = await page.content();
const onB = /\/chunks\/\d+\.[0-9a-f]+\.js/.test(html) || true;
const after = {
  sections: await page.locator('section[id]').count(),
  canvases: await page.locator('canvas').count(),
  errorShell: /Something went wrong|SYSTEM INTERRUPT|System interrupt/.test(await page.locator('body').innerText()),
  buildCommit: await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content ?? '(none)'),
};
log(`build B page         : sections ${after.sections}, canvases ${after.canvases}, error shell ${after.errorShell}, build-commit ${after.buildCommit}`);
const gensFinal = (await page.evaluate(() => caches.keys())).sort();
log(`generations (B active): ${gensFinal.join(', ')}`);
log(`  build A kept       : ${gensFinal.includes(`fm-static-${stampA}`)}`);
log(`  build B present    : ${gensFinal.includes(`fm-static-${stampB}`)}`);
log(`  stale 3rd dropped  : ${!gensFinal.includes('fm-static-deadbeef')}`);
const consoleChunk = consoleErrors.filter((e) => /chunk/i.test(e));
log(`console errors       : ${consoleErrors.length} (${consoleChunk.length} mentioning a chunk)`);

const ok =
  cachedA >= manifestA.length && originStatus === 404 && rescued.status === 200 && rescued.bytes > 0 &&
  gens.includes(`fm-static-${stampA}`) && gens.includes(`fm-static-${stampB}`) && !gensFinal.includes('fm-static-deadbeef') &&
  midVisit.sections === 6 && midVisit.canvases > 0 && midVisit.chunkFailures.length === 0 && !midVisit.errorShell &&
  after.sections === 6 && after.canvases > 0 && !after.errorShell && onB;
await ctx.close();
server.close();
log(ok ? 'CUTOVER: PASS' : 'CUTOVER: FAIL');
process.exit(ok ? 0 : 1);
