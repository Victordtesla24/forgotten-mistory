// G-REV probe on the live build carrying ee334cc / 9e41474+3d25643 / 6f4ba6c.
// Method reused from G-REV/e3f0206c/captures/probeB-vitals-firstpaint.mjs; every
// measurement helper is copied verbatim from the specs that own the clause:
//   luminance / columnLuminance / bandMean / brightestWindow / readingColumnFractions
//     -> tests/overhaul/hero-first-paint.spec.ts
//   groundLuminance / isolateScene / slotClip / coverage / peak / meanDelta
//     -> tests/overhaul/flagship-visibility.spec.ts
// GL args are flagship-visibility.spec.ts's GL_ARGS. --disable-lcd-text for pixel work.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import { PNG } from '/root/forgotten-mistory/node_modules/pngjs/lib/png.js';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const BASE = 'https://forgotten-mistory.web.app';
const LAUNCH = {
  executablePath: '/usr/bin/google-chrome',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-lcd-text',
  ],
};
const LAZY_CHUNK = /\/_next\/static\/chunks\/\d+\.[^/]+\.js(\?.*)?$/;
const SCRIM_MIN_DELTA = 0.06;
const LIT_WINDOW_FRACTION = 0.1;
const COVERAGE_DELTA = 0.06;
const COVERAGE_MIN = 0.15;
const PEAK_MIN = 0.35;
const MOTION_MIN = 0.004;
const FALLBACK_DELTA = 0.04;
const FALLBACK_COVERAGE_MIN = 0.08;

const lum = (r, g, b) => {
  const f = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
function field(buf) {
  const png = PNG.sync.read(buf);
  const values = new Array(png.width * png.height);
  for (let i = 0; i < values.length; i += 1) {
    const o = i * 4;
    values[i] = lum(png.data[o], png.data[o + 1], png.data[o + 2]);
  }
  return { values, width: png.width, height: png.height };
}
const meanOf = (f) => f.values.reduce((a, b) => a + b, 0) / f.values.length;
const coverage = (f, ground, delta) =>
  f.values.filter((v) => v - ground >= delta).length / f.values.length;
const peakOf = (f) => f.values.reduce((m, v) => (v > m ? v : m), 0);
const meanDelta = (a, b) => {
  const n = Math.min(a.values.length, b.values.length);
  let s = 0;
  for (let i = 0; i < n; i += 1) s += Math.abs(a.values[i] - b.values[i]);
  return n === 0 ? 0 : s / n;
};
function columnLuminance(buf) {
  const png = PNG.sync.read(buf);
  const cols = new Array(png.width).fill(0);
  for (let y = 0; y < png.height; y += 1)
    for (let x = 0; x < png.width; x += 1) {
      const o = (y * png.width + x) * 4;
      cols[x] += lum(png.data[o], png.data[o + 1], png.data[o + 2]);
    }
  return cols.map((s) => s / png.height);
}
function bandMean(cols, fromF, toF) {
  const from = Math.max(0, Math.floor(cols.length * fromF));
  const to = Math.min(cols.length, Math.ceil(cols.length * toF));
  let s = 0;
  for (let x = from; x < to; x += 1) s += cols[x];
  return s / Math.max(1, to - from);
}
function brightestWindow(cols, fraction) {
  const width = Math.max(1, Math.round(cols.length * fraction));
  let running = 0;
  for (let x = 0; x < width; x += 1) running += cols[x];
  let best = running;
  let bestStart = 0;
  for (let x = width; x < cols.length; x += 1) {
    running += cols[x] - cols[x - width];
    if (running > best) {
      best = running;
      bestStart = x - width + 1;
    }
  }
  return { mean: best / width, centreFraction: (bestStart + width / 2) / cols.length };
}
const READING_COLUMN = `(() => {
  const hero = document.querySelector('#hero');
  if (!hero) return null;
  const selector = 'h1, h2, p, a, span, li, dt, dd';
  let minX = Infinity, maxX = -Infinity, count = 0;
  for (const el of hero.querySelectorAll(selector)) {
    if (!(el.textContent ?? '').trim()) continue;
    if (el.querySelector(selector)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    minX = Math.min(minX, r.left); maxX = Math.max(maxX, r.right); count += 1;
  }
  return count ? { minX, maxX, count } : null;
})()`;
const GROUND = `(() => {
  let node = document.getElementById('hero');
  while (node) {
    const bg = getComputedStyle(node).backgroundColor;
    const m = bg.match(/rgba?\\(([^)]+)\\)/);
    if (m) { const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
      const a = p.length > 3 ? p[3] : 1; if (a > 0.5) return [p[0], p[1], p[2]]; }
    node = node.parentElement;
  }
  const b = getComputedStyle(document.body).backgroundColor.match(/rgba?\\(([^)]+)\\)/);
  if (b) { const p = b[1].split(/[,\\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2]]; }
  return [0, 0, 0];
})()`;
const ISOLATE = `(() => { const s = document.createElement('style'); s.id='flagship-visibility-isolate';
  s.textContent = 'body * { visibility: hidden !important; } [data-scene="hero-atmosphere"], [data-scene="hero-atmosphere"] * { visibility: visible !important; }';
  document.head.appendChild(s); })()`;
const VITALS_INIT = `
window.__cls = 0; window.__shifts = []; window.__lcp = 0; window.__lcpEl = '';
new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(+e.value.toFixed(5)); } } }).observe({ type: 'layout-shift', buffered: true });
new PerformanceObserver((l) => { const es = l.getEntries(); const e = es[es.length - 1]; window.__lcp = e.startTime;
  const el = e.element; window.__lcpEl = el ? (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\\s+/).slice(0,2).join('.') : '') + (el.tagName==='IMG'? '[src='+(el.currentSrc||el.src).split('/').pop()+']':'') + ' :: ' + (el.textContent||'').replace(/\\s+/g,' ').trim().slice(0,60)) : 'unknown';
  window.__lcpUrl = e.url || ''; }).observe({ type: 'largest-contentful-paint', buffered: true });
`;

const AA_WALK = () => {
    const L = (c) => {
      const f = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
      return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
    };
    const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null;
      const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
    const bgOf = (el) => { let n = el; while (n) { const c = parse(getComputedStyle(n).backgroundColor);
        if (c && c[3] > 0.5) return c; n = n.parentElement; } return [10, 10, 10, 1]; };
    const out = [];
    const hero = document.querySelector('#hero');
    if (!hero) return out;
    for (const el of hero.querySelectorAll('h1,h2,h3,p,a,span,li,dt,dd,button,strong,em,small')) {
      const t = (el.textContent || '').trim(); if (!t) continue;
      if (el.querySelector('h1,h2,h3,p,a,span,li,dt,dd,button,strong,em,small')) continue;
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const st = getComputedStyle(el); if (st.visibility === 'hidden' || st.opacity === '0') continue;
      const fg = parse(st.color); if (!fg) continue;
      const bg = bgOf(el);
      const l1 = L(fg), l2 = L(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const px = parseFloat(st.fontSize); const w = parseInt(st.fontWeight, 10) || 400;
      const large = px >= 24 || (px >= 18.66 && w >= 700);
      out.push({ text: t.replace(/\s+/g, ' ').slice(0, 34), ratio: +ratio.toFixed(2), px: +px.toFixed(1), large, need: large ? 3 : 4.5, cls: (typeof el.className === 'string' ? el.className : '').slice(0, 26) });
    }
    return out.sort((x, y) => x.ratio - y.ratio).slice(0, 10);
  };

const R = {};
const browser = await chromium.launch(LAUNCH);
const shot = (n, b) => fs.writeFileSync(path.join(OUT, n), b);
const clipOf = (box, vw, vh) => {
  const x = Math.max(0, Math.min(box.x, vw - 4));
  const y = Math.max(0, Math.min(box.y, vh - 4));
  return {
    x,
    y,
    width: Math.max(4, Math.min(box.width, vw - x)),
    height: Math.max(4, Math.min(box.height, vh - y)),
  };
};

// ---------- clause 1+2a: GL chunk blocked -> stage bg layers + stage-box luminance ----------
R.chunkBlocked = {};
for (const vp of [
  { w: 1440, h: 900 },
  { w: 390, h: 844 },
]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errs = [];
  const failed = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  page.on('requestfailed', (r) => {
    if (!LAZY_CHUNK.test(r.url())) failed.push(`${r.url().slice(-70)} ${r.failure()?.errorText}`);
  });
  await page.route(LAZY_CHUNK, (r) => r.abort());
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const slot = page.locator('[data-scene="hero-atmosphere"]');
  await slot.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(2000);
  const build = await page.evaluate(
    () => document.querySelector('meta[name="build-commit"]')?.content,
  );
  const bg = await slot.evaluate((el) => {
    const s = getComputedStyle(el);
    return { image: s.backgroundImage, size: s.backgroundSize, position: s.backgroundPosition };
  });
  const canvases = await slot.locator('canvas').count();
  const box = await slot.boundingBox();
  const buf = await page.screenshot({ clip: clipOf(box, vp.w, vp.h) });
  shot(`chunkblocked-stage-${vp.w}.png`, buf);
  shot(`chunkblocked-fold-${vp.w}.png`, await page.screenshot());
  const f = field(buf);
  // first layer of the computed stack
  const firstLayer = bg.image.split(/,(?![^(]*\))/)[0].trim();
  R.chunkBlocked[vp.w] = {
    build,
    canvases,
    firstLayer,
    layerCount: bg.image.split(/,(?![^(]*\))/).length,
    bgSize: bg.size.split(',')[0].trim(),
    bgPos: bg.position.split(',')[0].trim(),
    stageBoxMeanLuma: +meanOf(f).toFixed(4),
    box,
    pageerrors: errs,
    failedRequests: failed,
  };
  console.log(
    `chunk-blocked ${vp.w}: build=${build} first="${firstLayer.slice(0, 60)}" layers=${R.chunkBlocked[vp.w].layerCount} canvases=${canvases} stageLuma=${R.chunkBlocked[vp.w].stageBoxMeanLuma} err=${errs.length} failed=${failed.length}`,
  );
  await ctx.close();
}

// ---------- clause 2b + 8: javaScriptEnabled:false ----------
R.jsBlocked = {};
for (const vp of [
  { w: 1440, h: 900 },
  { w: 390, h: 844 },
]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
    javaScriptEnabled: false,
  });
  const page = await ctx.newPage();
  const failed = [];
  page.on('requestfailed', (r) => failed.push(`${r.url().slice(-70)} ${r.failure()?.errorText}`));
  await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  shot(`jsblocked-fold-${vp.w}.png`, await page.screenshot());
  const slot = page.locator('[data-scene="hero-atmosphere"]');
  const slotCount = await slot.count();
  const box = slotCount ? await slot.first().boundingBox().catch(() => null) : null;
  let stageLuma = null;
  let firstLayer = 'N/A';
  if (box && box.width > 2 && box.height > 2) {
    const buf = await page.screenshot({ clip: clipOf(box, vp.w, vp.h) });
    shot(`jsblocked-stage-${vp.w}.png`, buf);
    stageLuma = +meanOf(field(buf)).toFixed(4);
    firstLayer = (
      await slot.first().evaluate((el) => getComputedStyle(el).backgroundImage)
    ).split(/,(?![^(]*\))/)[0].trim();
  }
  const heroBox = await page.locator('#hero').first().boundingBox().catch(() => null);
  const parts = {
    h1: await page.locator('#hero h1').count(),
    h1text: (await page.locator('#hero h1').first().innerText().catch(() => '')).slice(0, 40),
    statement: await page.locator('#hero p').count(),
    heroActions: await page
      .locator('#hero a[href], #hero [class*="ctionsRow"] a, #hero [class*="ctions"] a')
      .count(),
    photograph: await page.locator('#hero img, #hero picture, #hero video').count(),
  };
  const headings = await page.evaluate(() =>
    ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'].map((id) => {
      const s = document.getElementById(id);
      const h = s?.querySelector('h1, h2');
      return { id, present: !!s, heading: (h?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 46) };
    }),
  );
  const body = (await page.locator('body').innerText().catch(() => 'ERR')) || '';
  R.jsBlocked[vp.w] = {
    slotCount,
    box,
    heroBox,
    stageBoxMeanLuma: stageLuma,
    firstLayer,
    parts,
    headings,
    loadingPortfolio: /Loading portfolio/i.test(body),
    bodyChars: body.replace(/\s+/g, ' ').length,
    failedRequests: failed,
  };
  console.log(
    `js-off ${vp.w}: stageLuma=${stageLuma} first="${firstLayer.slice(0, 55)}" hero=${JSON.stringify(heroBox)} h1="${parts.h1text}" img=${parts.photograph} a=${parts.heroActions} loading=${R.jsBlocked[vp.w].loadingPortfolio} chars=${R.jsBlocked[vp.w].bodyChars} failed=${failed.length}`,
  );
  await ctx.close();
}

// ---------- clause 3 (gl) + 4 + 5 + 6: /?gl=force ----------
R.glforce = {};
for (const vp of [
  { w: 1440, h: 900 },
  { w: 390, h: 844 },
]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  const errs = [];
  const failed = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  page.on('requestfailed', (r) => failed.push(`${r.url().slice(-70)} ${r.failure()?.errorText}`));
  await page.addInitScript(`
    window.__dcl = 0; window.__canvasAt = null;
    document.addEventListener('DOMContentLoaded', () => { window.__dcl = performance.now(); });
    new MutationObserver((m, o) => {
      const c = document.querySelector('[data-scene="hero-atmosphere"] canvas');
      if (c && window.__canvasAt === null) { window.__canvasAt = performance.now(); o.disconnect(); }
    }).observe(document.documentElement, { childList: true, subtree: true });
  `);
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(200);
  shot(`glforce-200ms-${vp.w}.png`, await page.screenshot());
  const slot = page.locator('[data-scene="hero-atmosphere"]');
  await slot
    .locator('canvas')
    .first()
    .waitFor({ state: 'attached', timeout: 45000 })
    .catch(() => {});
  const timing = await page.evaluate(() => ({
    dcl: Math.round(window.__dcl),
    canvasAt: window.__canvasAt === null ? null : Math.round(window.__canvasAt),
  }));
  shot(`glforce-canvasmount-${vp.w}.png`, await page.screenshot());
  await page.waitForTimeout(2500);
  const canvases = await slot.locator('canvas').count();
  const box = await slot.boundingBox();
  const clip = clipOf(box, vp.w, vp.h);
  // scrim (clause 3): capture of the slot as it stands on the page
  const slotBuf = await page.screenshot({ clip });
  shot(`glforce-stage-${vp.w}.png`, slotBuf);
  const rc = await page.evaluate(READING_COLUMN);
  const cols = columnLuminance(slotBuf);
  const column = { from: (rc.minX - box.x) / box.width, to: (rc.maxX - box.x) / box.width, count: rc.count };
  const underType = bandMean(cols, column.from, column.to);
  const lit = brightestWindow(cols, LIT_WINDOW_FRACTION);
  // flagship floors (clause 6): isolated slot, ground-relative
  const groundRgb = await page.evaluate(GROUND);
  const ground = lum(groundRgb[0], groundRgb[1], groundRgb[2]);
  await page.evaluate(ISOLATE);
  await page.waitForTimeout(250);
  const a = field(await page.screenshot({ clip }));
  await page.waitForTimeout(1500);
  const b = field(await page.screenshot({ clip }));
  await page.evaluate(() => document.getElementById('flagship-visibility-isolate')?.remove());
  // AA walk (clause 5)
  const aa = await page.evaluate(AA_WALK);
  R.glforce[vp.w] = {
    build: await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content),
    canvases,
    timing: { ...timing, canvasAfterDcl: timing.canvasAt === null ? null : timing.canvasAt - timing.dcl },
    scrim: {
      column,
      underType: +underType.toFixed(4),
      litMean: +lit.mean.toFixed(4),
      litCentre: +lit.centreFraction.toFixed(3),
      delta: +(lit.mean - underType).toFixed(4),
    },
    flagship: {
      ground: +ground.toFixed(4),
      coverage: +coverage(a, ground, COVERAGE_DELTA).toFixed(4),
      peak: +peakOf(a).toFixed(4),
      motion: +meanDelta(a, b).toFixed(5),
      mean: +meanOf(a).toFixed(4),
    },
    aaWorst10: aa,
    pageerrors: errs,
    failedRequests: failed,
  };
  console.log(
    `gl=force ${vp.w}: canvases=${canvases} dcl=${timing.dcl} canvasAt=${timing.canvasAt} after=${R.glforce[vp.w].timing.canvasAfterDcl}ms scrimΔ=${R.glforce[vp.w].scrim.delta} cov=${R.glforce[vp.w].flagship.coverage} peak=${R.glforce[vp.w].flagship.peak} motion=${R.glforce[vp.w].flagship.motion} worstAA=${aa[0]?.ratio} err=${errs.length} failed=${failed.length}`,
  );
  await ctx.close();
}

// ---------- clause 3 (still) + 5 + 6 still: reduced-motion, plain / ----------
R.reduced = {};
for (const vp of [
  { w: 1440, h: 900 },
  { w: 390, h: 844 },
]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  const errs = [];
  const failed = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  page.on('requestfailed', (r) => failed.push(`${r.url().slice(-70)} ${r.failure()?.errorText}`));
  await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const slot = page.locator('[data-scene="hero-atmosphere"]');
  const box = await slot.boundingBox();
  const clip = clipOf(box, vp.w, vp.h);
  const buf = await page.screenshot({ clip });
  shot(`reduced-stage-${vp.w}.png`, buf);
  const firstLayer = (await slot.evaluate((el) => getComputedStyle(el).backgroundImage))
    .split(/,(?![^(]*\))/)[0]
    .trim();
  const rc = await page.evaluate(READING_COLUMN);
  const cols = columnLuminance(buf);
  const column = { from: (rc.minX - box.x) / box.width, to: (rc.maxX - box.x) / box.width, count: rc.count };
  const underType = bandMean(cols, column.from, column.to);
  const lit = brightestWindow(cols, LIT_WINDOW_FRACTION);
  const groundRgb = await page.evaluate(GROUND);
  const ground = lum(groundRgb[0], groundRgb[1], groundRgb[2]);
  await page.evaluate(ISOLATE);
  await page.waitForTimeout(250);
  const a = field(await page.screenshot({ clip }));
  await page.evaluate(() => document.getElementById('flagship-visibility-isolate')?.remove());
  const aa = await page.evaluate(AA_WALK);
  R.reduced[vp.w] = {
    canvases: await slot.locator('canvas').count(),
    firstLayer,
    aaWorst10: aa,
    scrim: {
      column,
      underType: +underType.toFixed(4),
      litMean: +lit.mean.toFixed(4),
      litCentre: +lit.centreFraction.toFixed(3),
      delta: +(lit.mean - underType).toFixed(4),
    },
    still: {
      ground: +ground.toFixed(4),
      coverage: +coverage(a, ground, FALLBACK_DELTA).toFixed(4),
      mean: +meanOf(a).toFixed(4),
      peak: +peakOf(a).toFixed(4),
    },
    pageerrors: errs,
    failedRequests: failed,
  };
  console.log(
    `reduced ${vp.w}: canvases=${R.reduced[vp.w].canvases} first="${firstLayer.slice(0, 50)}" scrimΔ=${R.reduced[vp.w].scrim.delta} stillCov=${R.reduced[vp.w].still.coverage} err=${errs.length} failed=${failed.length}`,
  );
  await ctx.close();
}

fs.writeFileSync(path.join(OUT, 'probe-gh2.json'), JSON.stringify(R, null, 2));
await browser.close();
console.log('DONE phase 1');
