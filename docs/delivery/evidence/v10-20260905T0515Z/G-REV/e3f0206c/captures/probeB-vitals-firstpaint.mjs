// G-REV phase 3 — CLS/LCP cold loads + G-H2a first paint on live.
// Luminance helper is the one in tests/overhaul/hero-first-paint.spec.ts
// (WCAG relative luminance over every pixel of a PNG); the WebGL-chunk block is
// that file's LAZY_CHUNK regex verbatim. The JS-blocked pass is the acceptance
// clause as written, measured as written.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import { PNG } from '/root/forgotten-mistory/node_modules/pngjs/lib/png.js';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const BASE = 'https://forgotten-mistory.web.app';
const LAUNCH = { executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
const LAZY_CHUNK = /\/_next\/static\/chunks\/\d+\.[^/]+\.js(\?.*)?$/;

const lum = (r, g, b) => { const f = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
function meanLuminance(buf) { const png = PNG.sync.read(buf); let s = 0; const n = png.width * png.height; for (let i = 0; i < n; i += 1) { const o = i * 4; s += lum(png.data[o], png.data[o + 1], png.data[o + 2]); } return s / n; }

const VITALS_INIT = `
window.__cls = 0; window.__shifts = []; window.__lcp = 0;
new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(+e.value.toFixed(5)); } } }).observe({ type: 'layout-shift', buffered: true });
new PerformanceObserver((l) => { const es = l.getEntries(); window.__lcp = es[es.length - 1].startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
`;

const results = { vitals: {}, jsBlocked: {}, chunkBlocked: {}, glforce: {}, deferred: {}, pointer: {}, reducedStage: {} };
const browser = await chromium.launch(LAUNCH);

// ---------- 1. CLS / LCP, 3 cold loads per viewport ----------
for (const vp of [{ w: 1280, h: 720 }, { w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const key = `${vp.w}x${vp.h}`; results.vitals[key] = [];
  for (let i = 0; i < 3; i += 1) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    await ctx.addInitScript(VITALS_INIT);
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
    await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(5000);
    const v = await page.evaluate(() => ({ cls: +window.__cls.toFixed(5), shifts: window.__shifts, lcp: Math.round(window.__lcp), build: document.querySelector('meta[name="build-commit"]')?.content }));
    results.vitals[key].push({ ...v, pageerrors: errs });
    await ctx.close();
    console.log(`vitals ${key} load${i + 1}: cls=${v.cls} lcp=${v.lcp}ms shifts=${JSON.stringify(v.shifts)} build=${v.build} err=${errs.length}`);
  }
}

// ---------- 2. G-H2a (a) JavaScript BLOCKED — the acceptance clause verbatim ----------
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(1500);
  const shot = await page.screenshot();
  fs.writeFileSync(path.join(OUT, `jsblocked-${vp.w}.png`), shot);
  const luma = meanLuminance(shot);
  // Is anything of the hero actually on screen? Locators work without JS.
  const slotCount = await page.locator('[data-scene="hero-atmosphere"]').count();
  let slotBox = null; try { slotBox = await page.locator('[data-scene="hero-atmosphere"]').first().boundingBox(); } catch { slotBox = null; }
  const heroBox = await page.locator('#hero').first().boundingBox().catch(() => null);
  const visibleText = await page.locator('body').innerText().catch(() => 'ERR');
  results.jsBlocked[vp.w] = { viewportMeanLuma: +luma.toFixed(4), slotCount, slotBox, heroBox, bodyText: (visibleText || '').replace(/\s+/g, ' ').slice(0, 200) };
  let slotLuma = null;
  if (slotBox && slotBox.width > 0 && slotBox.height > 0) {
    const clip = { x: Math.max(0, slotBox.x), y: Math.max(0, slotBox.y), width: Math.min(slotBox.width, vp.w), height: Math.min(slotBox.height, vp.h) };
    slotLuma = +meanLuminance(await page.screenshot({ clip })).toFixed(4);
  }
  results.jsBlocked[vp.w].stageBoxMeanLuma = slotLuma;
  await ctx.close();
  console.log(`js-blocked ${vp.w}: viewportLuma=${luma.toFixed(4)} stageBoxLuma=${slotLuma} slots=${slotCount} slotBox=${JSON.stringify(slotBox)} heroBox=${JSON.stringify(heroBox)} text="${results.jsBlocked[vp.w].bodyText.slice(0, 80)}"`);
}

// ---------- 3. G-H2a (a') the lane's own method: JS on, WebGL chunk blocked ----------
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.route(LAZY_CHUNK, (r) => r.abort());
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const slot = page.locator('[data-scene="hero-atmosphere"]');
  await slot.waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const canvases = await slot.locator('canvas').count();
  const bg = await slot.evaluate((el) => getComputedStyle(el).backgroundImage.slice(0, 160)).catch(() => 'ERR');
  const shot = await slot.screenshot();
  fs.writeFileSync(path.join(OUT, `chunkblocked-${vp.w}.png`), shot);
  const luma = +meanLuminance(shot).toFixed(4);
  const box = await slot.boundingBox();
  results.chunkBlocked[vp.w] = { canvases, meanLuma: luma, box, backgroundImage: bg, hasUrlLayer: /url\(/.test(bg) };
  await ctx.close();
  console.log(`chunk-blocked ${vp.w}: canvases=${canvases} slotLuma=${luma} box=${JSON.stringify(box)} url()=${/url\(/.test(bg)} bg=${bg.slice(0, 60)}`);
}

// ---------- 4. G-H2a (b) /?gl=force — hero canvas ms after DOMContentLoaded ----------
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const started = Date.now();
  let ms = null;
  try { await page.locator('[data-scene="hero-atmosphere"] canvas').first().waitFor({ state: 'attached', timeout: 15000 }); ms = Date.now() - started; } catch { ms = 'TIMEOUT>15000'; }
  // TC-03 shape: every other [data-scene] must still hold zero canvases here.
  const bySlot = await page.evaluate(() => [...document.querySelectorAll('[data-scene]')].map((el) => ({ scene: el.getAttribute('data-scene'), canvases: el.querySelectorAll('canvas').length })));
  results.glforce[vp.w] = { canvasAfterDclMs: ms, bySlot, pageerrors: errs };
  await ctx.close();
  console.log(`gl=force ${vp.w}: heroCanvasAfterDcl=${ms}ms slots=${JSON.stringify(bySlot)} err=${errs.length}`);
}

// ---------- 5. normal (non-forced) load: what SwiftShader headless gives ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const started = Date.now();
  let ms = null;
  try { await page.locator('[data-scene="hero-atmosphere"] canvas').first().waitFor({ state: 'attached', timeout: 15000 }); ms = Date.now() - started; } catch { ms = 'TIMEOUT>15000'; }
  await page.waitForTimeout(3000);
  const after = await page.evaluate(() => [...document.querySelectorAll('[data-scene]')].map((el) => ({ scene: el.getAttribute('data-scene'), canvases: el.querySelectorAll('canvas').length })));
  results.glforce.normal1440 = { canvasAfterDclMs: ms, bySlotAfter5s: after };
  await ctx.close();
  console.log(`normal 1440: heroCanvasAfterDcl=${ms} after=${JSON.stringify(after)}`);
}

// ---------- 6. other scenes still deferred: no canvas before load+idle; canvas after scroll ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  // Neuter requestIdleCallback so pageSettled can never open (TC-02b shape).
  await ctx.addInitScript(() => { window.requestIdleCallback = () => 0; });
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  const held = await page.evaluate(() => [...document.querySelectorAll('[data-scene]')].map((el) => ({ scene: el.getAttribute('data-scene'), canvases: el.querySelectorAll('canvas').length })));
  results.deferred.idleNeutered = held;
  console.log(`idle-neutered: ${JSON.stringify(held)}`);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  results.deferred.beforeScroll = await page.evaluate(() => [...document.querySelectorAll('[data-scene]')].map((el) => ({ scene: el.getAttribute('data-scene'), canvases: el.querySelectorAll('canvas').length })));
  for (const id of ['about', 'experience', 'skills']) {
    await page.evaluate((s) => document.getElementById(s)?.scrollIntoView({ behavior: 'instant', block: 'center' }), id);
    await page.waitForTimeout(2500);
  }
  await page.waitForTimeout(2000);
  results.deferred.afterScroll = await page.evaluate(() => [...document.querySelectorAll('[data-scene]')].map((el) => ({ scene: el.getAttribute('data-scene'), canvases: el.querySelectorAll('canvas').length })));
  console.log(`deferred before=${JSON.stringify(results.deferred.beforeScroll)}`);
  console.log(`deferred after =${JSON.stringify(results.deferred.afterScroll)}`);
  await ctx.close();
}

// ---------- 7. clean pointer-enter / leave on the figure (no prior press) ----------
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const box = await page.evaluate(() => { const f = document.querySelector('#hero figure'); if (!f) return null; const r = f.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(Math.max(6, Math.min(r.top + r.height / 2, innerHeight - 6))) }; });
  const before = await page.evaluate(() => { const v = document.querySelector('#hero video'); return v ? { paused: v.paused, hasSrc: !!v.getAttribute('src') } : 'NO-VIDEO'; });
  await page.mouse.move(box.x, box.y, { steps: 8 });
  await page.waitForTimeout(2500);
  const afterEnter = await page.evaluate(() => { const v = document.querySelector('#hero video'); return v ? { paused: v.paused, currentTime: +v.currentTime.toFixed(2), src: (v.getAttribute('src') || '').split('/').pop() } : 'NO-VIDEO'; });
  const ariaOnHover = await page.evaluate(() => document.querySelector('[data-testid="portrait-control"]')?.getAttribute('aria-pressed'));
  await page.mouse.move(3, 3, { steps: 6 });
  await page.waitForTimeout(1200);
  const afterLeave = await page.evaluate(() => { const v = document.querySelector('#hero video'); return v ? { paused: v.paused } : 'NO-VIDEO'; });
  results.pointer[vp.w] = { box, before, afterEnter, ariaOnHover, afterLeave };
  await ctx.close();
  console.log(`pointer ${vp.w}: before=${JSON.stringify(before)} enter=${JSON.stringify(afterEnter)} aria=${ariaOnHover} leave=${JSON.stringify(afterLeave)}`);
}

// ---------- 8. reduced motion: the stage shows the still, no canvas ----------
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  const slot = page.locator('[data-scene="hero-atmosphere"]');
  const canvases = await slot.locator('canvas').count();
  const shot = await slot.screenshot();
  fs.writeFileSync(path.join(OUT, `reduced-stage-${vp.w}.png`), shot);
  results.reducedStage[vp.w] = { canvases, meanLuma: +meanLuminance(shot).toFixed(4), bg: await slot.evaluate((el) => getComputedStyle(el).backgroundImage.slice(0, 120)) };
  await ctx.close();
  console.log(`reduced ${vp.w}: canvases=${canvases} slotLuma=${results.reducedStage[vp.w].meanLuma}`);
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'probeB-vitals-firstpaint.json'), JSON.stringify(results, null, 2));
console.log('WROTE probeB-vitals-firstpaint.json');
