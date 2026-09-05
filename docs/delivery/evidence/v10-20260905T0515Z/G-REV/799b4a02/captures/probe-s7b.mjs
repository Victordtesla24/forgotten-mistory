// Reviewer follow-up probe — three things the first pass could not attribute:
//  (a) GL contexts created by OPENING the panel alone (no scrolling in between,
//      wait until the slot's canvas actually exists) — the first pass counted
//      at +2.5 s, before the lazy scene had mounted, and scrolling afterwards
//      mounted other sections' scenes into the same counter.
//  (b) the stage's OWN motion, isolated with the flagship visibility rule, idle
//      vs while the reply streams — the unisolated stage box also contains the
//      portrait, the legibility gradient and the scan grid, so a raw box delta
//      cannot be credited to the shader.
//  (c) reduced motion with the voice UNMUTED — the 2D mouth is driven by an
//      AnalyserNode on the audio element, so muting it is not a fair test of
//      "the mouth still animates".
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import { PNG } from '/root/forgotten-mistory/node_modules/pngjs/lib/png.js';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const BASE = 'https://forgotten-mistory.web.app';
const Q = 'What did Vikram do at the ATO?';
const GL_ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-lcd-text'];
const relLum = (r, g, b) => { const c = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }; return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b); };
function decode(buf) { const p = PNG.sync.read(buf); const v = new Float64Array(p.width * p.height);
  for (let i = 0; i < v.length; i++) { const o = i * 4; v[i] = relLum(p.data[o], p.data[o + 1], p.data[o + 2]); } return { values: v, width: p.width, height: p.height, data: p.data }; }
const meanOf = (f) => { let s = 0; for (const v of f.values) s += v; return s / f.values.length; };
const peakOf = (f) => { let m = 0; for (const v of f.values) if (v > m) m = v; return m; };
const covOf = (f, g, d) => { let h = 0; for (const v of f.values) if (v >= g + d) h++; return h / f.values.length; };
const dOf = (a, b) => { const n = Math.min(a.values.length, b.values.length); let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a.values[i] - b.values[i]); return n ? s / n : 0; };
const shot = (n, b) => fs.writeFileSync(path.join(OUT, n), b);
const CTR = () => { window.__glCount = 0; const o = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...r) { const c = o.call(this, t, ...r); if (c && /webgl/i.test(String(t)) && !this.__c) { this.__c = true; window.__glCount++; } return c; };
  window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective)); };
async function boot(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {});
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 }).catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 20000 }); await page.waitForTimeout(700);
}
const isolate = (page, on) => page.evaluate((flag) => {
  document.getElementById('rev-iso')?.remove();
  if (!flag) return;
  const st = document.createElement('style'); st.id = 'rev-iso';
  st.textContent = 'body * { visibility: hidden !important; } [data-scene="minivic-viseme"], [data-scene="minivic-viseme"] * { visibility: visible !important; }';
  document.head.appendChild(st);
}, on);
async function stageBox(page) { return page.evaluate(() => { const e = document.querySelector('[data-scene="minivic-viseme"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: Math.max(0, r.x), y: Math.max(0, r.y), width: r.width, height: r.height }; }); }
async function sample(page, clip, ms, every) {
  const t0 = Date.now(); const fr = []; let prev = null, last = null;
  while (Date.now() - t0 < ms) { const b = await page.screenshot({ clip }); const f = decode(b); last = b;
    fr.push({ t: Date.now() - t0, mean: +meanOf(f).toFixed(5), peak: +peakOf(f).toFixed(4), d: prev ? +dOf(prev, f).toFixed(5) : null }); prev = f;
    await page.waitForTimeout(Math.max(20, every - ((Date.now() - t0) % every))); }
  const ds = fr.map((x) => x.d).filter((x) => x !== null);
  return { frames: fr.length, meanMotion: +(ds.reduce((a, b) => a + b, 0) / Math.max(1, ds.length)).toFixed(5),
    maxMotion: +Math.max(...ds).toFixed(5), meanLuma: +(fr.reduce((a, b) => a + b.mean, 0) / fr.length).toFixed(5),
    peak: +Math.max(...fr.map((x) => x.peak)).toFixed(4), lastBuf: last, series: fr };
}
async function primeSend(page, q) {
  await page.evaluate(() => { window.__r = { t0: 0, tF: 0, base: document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]').length };
    document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !window.__r.t0) window.__r.t0 = performance.now(); }, { capture: true });
    new MutationObserver(() => { const r = window.__r; if (!r.t0 || r.tF) return; const b = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]');
      if (b.length > r.base && (b[b.length - 1].textContent || '').trim()) r.tF = performance.now(); }).observe(document.body, { childList: true, subtree: true, characterData: true }); });
  const i = page.locator('[data-testid="minivic-input"]'); await i.click(); await i.fill(q);
}
// Fires the send with the keyboard, which does not require the (isolated) input
// to be visible, and returns the time to the first visible token.
async function fireSend(page) {
  await page.keyboard.press('Enter');
  try { await page.waitForFunction(() => window.__r.tF > 0, null, { timeout: 40000 }); return Math.round(await page.evaluate(() => window.__r.tF - window.__r.t0)); } catch { return null; }
}
async function send(page, q) { await primeSend(page, q); return fireSend(page); }
async function openPanel(page, waitForCanvas) {
  await page.waitForFunction(() => { const b = document.querySelector('[data-testid="minivic-toggle"]'); return Boolean(b) && Object.keys(b).some((k) => k.startsWith('__react')); }, null, { timeout: 60000 });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.waitForTimeout(1500);
  const before = await page.evaluate(() => ({ gl: window.__glCount, canvases: document.querySelectorAll('canvas').length }));
  await page.locator('[data-testid="minivic-toggle"]').evaluate((el) => el.click());
  await page.locator('[data-testid="minivic-panel"]').waitFor({ state: 'visible', timeout: 30000 });
  if (waitForCanvas) await page.waitForFunction(() => document.querySelectorAll('[data-scene="minivic-viseme"] canvas').length > 0, null, { timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(3000);
  const after = await page.evaluate(() => ({ gl: window.__glCount, canvases: document.querySelectorAll('canvas').length }));
  return { before, after, extraGl: after.gl - before.gl, extraCanvas: after.canvases - before.canvases };
}
const R = {};
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: GL_ARGS });

// (a) + (b) — GL delta on open, then isolated idle vs streaming, muted and unmuted
for (const vp of [{ w: 1440, h: 900 }]) {
  for (const muted of [true, false]) {
    const key = `${vp.w}-${muted ? 'muted' : 'unmuted'}`;
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    await ctx.addInitScript(CTR);
    const page = await ctx.newPage();
    const rec = { errs: [] };
    page.on('pageerror', (e) => rec.errs.push(String(e).slice(0, 160)));
    await boot(page, `${BASE}/?gl=force&rev=${Date.now()}`);
    rec.build = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content);
    rec.open = await openPanel(page, true);
    if (muted) { const b = page.locator('[data-testid="minivic-panel"]').getByRole('button', { name: 'Mute voice' }); if (await b.count()) { await b.first().click(); rec.muted = true; } }
    rec.slotCanvases = await page.locator('[data-scene="minivic-viseme"] canvas').count();
    const box = await stageBox(page); const clip = { x: box.x, y: box.y, width: Math.min(box.width, vp.w - box.x), height: Math.min(box.height, vp.h - box.y) };
    rec.box = { w: Math.round(box.width), h: Math.round(box.height) };
    rec.ground = await page.evaluate(() => { const p = document.querySelector('[data-testid="minivic-panel"]'); const m = getComputedStyle(p).backgroundColor.match(/rgba?\(([^)]+)\)/); return m ? m[1] : null; });
    await primeSend(page, Q);
    await isolate(page, true);
    const idle = await sample(page, clip, 3000, 200);
    shot(`iso-${key}-idle.png`, idle.lastBuf);
    const p = fireSend(page);
    const stream = await sample(page, clip, 3000, 200);
    shot(`iso-${key}-stream.png`, stream.lastBuf);
    rec.ttft = await p;
    await page.waitForTimeout(2500);
    const after = await sample(page, clip, 2400, 200);
    shot(`iso-${key}-after.png`, after.lastBuf);
    await isolate(page, false);
    delete idle.lastBuf; delete stream.lastBuf; delete after.lastBuf;
    const g = 0.0033;
    const lastIdle = decode(fs.readFileSync(path.join(OUT, `iso-${key}-idle.png`)));
    const lastStream = decode(fs.readFileSync(path.join(OUT, `iso-${key}-stream.png`)));
    rec.idle = { ...idle, coverage: +covOf(lastIdle, g, 0.06).toFixed(4) };
    rec.stream = { ...stream, coverage: +covOf(lastStream, g, 0.06).toFixed(4) };
    rec.after = after;
    rec.ratio = +(stream.meanMotion / Math.max(1e-6, idle.meanMotion)).toFixed(3);
    rec.replyLen = await page.evaluate(() => { const b = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]'); return b.length ? (b[b.length - 1].textContent || '').trim().length : 0; });
    rec.csp = await page.evaluate(() => window.__csp.length);
    R[key] = rec;
    console.log(`${key}: build=${rec.build} extraGL=${rec.open.extraGl} extraCanvas=${rec.open.extraCanvas} slot=${rec.slotCanvases} idle=${idle.meanMotion}/${idle.meanLuma} stream=${stream.meanMotion}/${stream.meanLuma} after=${after.meanMotion}/${after.meanLuma} ratio=${rec.ratio} ttft=${rec.ttft} err=${rec.errs.length}`);
    await ctx.close();
  }
}

// (c) reduced motion, UNMUTED — 0 canvases in the panel + does the 2D mouth animate?
for (const muted of [false, true]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.addInitScript(CTR);
  const page = await ctx.newPage();
  const rec = { errs: [] };
  page.on('pageerror', (e) => rec.errs.push(String(e).slice(0, 160)));
  await boot(page, `${BASE}/?gl=force&rev=${Date.now()}`);
  rec.build = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content);
  rec.open = await openPanel(page, false);
  if (muted) { const b = page.locator('[data-testid="minivic-panel"]').getByRole('button', { name: 'Mute voice' }); if (await b.count()) { await b.first().click(); rec.muted = true; } }
  rec.slotCanvases = await page.locator('[data-scene="minivic-viseme"] canvas').count();
  rec.panelCanvases = await page.locator('[data-testid="minivic-panel"] canvas').count();
  await page.evaluate(() => { window.__m = [];
    const c = [...document.querySelectorAll('[data-testid="minivic-panel"] canvas')].find((x) => x.width === 200 && x.height === 100);
    if (!c) { window.__m.push({ err: 'no mouth canvas' }); return; }
    const g = c.getContext('2d');
    window.__t = setInterval(() => { try { const d = g.getImageData(0, 0, c.width, c.height).data; let s = 0, nz = 0;
      for (let i = 0; i < d.length; i += 4) { const v = d[i] + d[i + 1] + d[i + 2]; s += v; if (d[i + 3] > 8 && v > 12) nz++; }
      window.__m.push({ t: Math.round(performance.now()), s, nz }); } catch (e) { window.__m.push({ err: String(e).slice(0, 60) }); } }, 100); });
  rec.ttft = await send(page, Q);
  await page.waitForTimeout(6000);
  const m = await page.evaluate(() => { clearInterval(window.__t); return window.__m; });
  const sums = m.filter((x) => typeof x.s === 'number').map((x) => x.s);
  rec.mouth = { samples: m.length, unique: new Set(sums).size, min: sums.length ? Math.min(...sums) : null, max: sums.length ? Math.max(...sums) : null,
    nzMax: Math.max(0, ...m.filter((x) => typeof x.nz === 'number').map((x) => x.nz)), err: m.find((x) => x.err)?.err || null };
  rec.slotAfter = await page.locator('[data-scene="minivic-viseme"] canvas').count();
  rec.speakingState = await page.evaluate(() => { const p = document.querySelector('[data-testid="minivic-panel"]'); const t = (p?.textContent || ''); return { speaking: t.includes('Speaking'), online: t.includes('Online'), video: t.includes('On video') }; });
  rec.audio = await page.evaluate(() => { const a = document.querySelector('[data-testid="minivic-audio"]'); return a ? { src: (a.currentSrc || a.src || '').slice(0, 60), paused: a.paused, muted: a.muted, dur: a.duration, ct: a.currentTime } : null; });
  rec.replyLen = await page.evaluate(() => { const b = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]'); return b.length ? (b[b.length - 1].textContent || '').trim().length : 0; });
  shot(`reduced-1440-${muted ? 'muted' : 'unmuted'}.png`, await page.screenshot());
  R[`reduced-${muted ? 'muted' : 'unmuted'}`] = rec;
  console.log(`reduced ${muted ? 'muted' : 'unmuted'}: slot=${rec.slotCanvases}/${rec.slotAfter} panelCanvas=${rec.panelCanvases} mouth=${JSON.stringify(rec.mouth)} audio=${JSON.stringify(rec.audio)} state=${JSON.stringify(rec.speakingState)} err=${rec.errs.length}`);
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'probe-s7b.json'), JSON.stringify(R, null, 2));
console.log('done');
