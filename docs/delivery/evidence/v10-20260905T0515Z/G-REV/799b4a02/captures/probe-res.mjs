// Reviewer probe — live 799b4a02, af7355a resolutionScale regression sweep + R2 tally.
// Method parity: field measure = tests/overhaul/flagship-visibility.spec.ts
// (ground = section computed background luminance, coverage at ground+0.06,
//  peak = max L, motion = mean |dL| over a 1.6 s gap, slot isolated with the
//  spec's own visibility rule); canvas attribution by six scroll-and-wait
//  cycles (G-REV/9b864752 probeC); AA walk = computed-style walk over the
//  named sections on both the still path and ?gl=force.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import { PNG } from '/root/forgotten-mistory/node_modules/pngjs/lib/png.js';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const BASE = 'https://forgotten-mistory.web.app';
const GL_ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-lcd-text'];
const COVERAGE_DELTA = 0.06, COVERAGE_MIN = 0.15, PEAK_MIN = 0.35, MOTION_MIN = 0.004;
const FALLBACK_DELTA = 0.04, FALLBACK_COVERAGE_MIN = 0.08;
const LAZY_CHUNK = /\/_next\/static\/chunks\/\d+\.[^/]+\.js(\?.*)?$/;
const SCENES = [
  { section: 'hero', scene: 'hero-atmosphere', scaled: true },
  { section: 'about', scene: 'about-field', scaled: true },
  { section: 'experience', scene: 'career-strata', scaled: true },
  { section: 'skills', scene: 'skills-bench', scaled: false },
  { section: 'vitrine', scene: 'vitrine-field', scaled: false },
  { section: 'listen', scene: 'listen-field', scaled: false },
];
const GOLDS = [[201, 168, 76], [212, 182, 92], [232, 213, 163], [176, 146, 63]];

const relLum = (r, g, b) => { const c = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }; return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b); };
function decode(buf) { const png = PNG.sync.read(buf); const v = new Float64Array(png.width * png.height);
  for (let i = 0; i < v.length; i++) { const o = i * 4; v[i] = relLum(png.data[o], png.data[o + 1], png.data[o + 2]); }
  return { values: v, width: png.width, height: png.height, data: png.data }; }
const coverage = (f, g, d) => { let h = 0; for (let i = 0; i < f.values.length; i++) if (f.values[i] >= g + d) h++; return h / f.values.length; };
const peakOf = (f) => { let m = 0; for (let i = 0; i < f.values.length; i++) if (f.values[i] > m) m = f.values[i]; return m; };
const meanOf = (f) => { let s = 0; for (let i = 0; i < f.values.length; i++) s += f.values[i]; return s / f.values.length; };
const meanDelta = (a, b) => { const n = Math.min(a.values.length, b.values.length); let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a.values[i] - b.values[i]); return n ? s / n : 0; };
function goldCensus(f) { let e = 0, w = 0;
  for (let i = 0; i < f.values.length; i++) { const o = i * 4, r = f.data[o], g = f.data[o + 1], b = f.data[o + 2];
    if (GOLDS.some((c) => Math.abs(r - c[0]) <= 10 && Math.abs(g - c[1]) <= 10 && Math.abs(b - c[2]) <= 10)) e++;
    if (r > 110 && r - b > 40 && r >= g && g > b) w++; }
  return { exactGoldPct: +(100 * e / f.values.length).toFixed(4), warmPct: +(100 * w / f.values.length).toFixed(4) }; }
// banding: count distinct quantised luminance levels + mean |second difference| along a row band
function bandingStats(f) {
  const levels = new Set();
  for (let i = 0; i < f.values.length; i += 7) levels.add(Math.round(f.values[i] * 255));
  const y = Math.floor(f.height / 2);
  let s = 0, n = 0;
  for (let x = 2; x < f.width - 2; x++) {
    const a = f.values[y * f.width + x - 2], b = f.values[y * f.width + x], c = f.values[y * f.width + x + 2];
    s += Math.abs(a - 2 * b + c); n++;
  }
  return { distinctLevels: levels.size, midRowRoughness: n ? +(s / n).toFixed(6) : null };
}
const shot = (n, b) => fs.writeFileSync(path.join(OUT, n), b);
const clipOf = (box, vp) => { const x = Math.max(0, Math.min(box.x, vp.width - 4)), y = Math.max(0, Math.min(box.y, vp.height - 4));
  return { x, y, width: Math.max(4, Math.min(box.width, vp.width - x)), height: Math.max(4, Math.min(box.height, vp.height - y)) }; };
async function groundLum(page, id) {
  const rgb = await page.evaluate((s) => { let node = document.getElementById(s);
    while (node) { const m = getComputedStyle(node).backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (m) { const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); const a = p.length > 3 ? p[3] : 1; if (a > 0.5) return [p[0], p[1], p[2]]; } node = node.parentElement; }
    const bm = getComputedStyle(document.body).backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (bm) { const p = bm[1].split(/[,\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2]]; } return [0, 0, 0]; }, id);
  return relLum(rgb[0], rgb[1], rgb[2]);
}
async function boot(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {});
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 }).catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(800);
}
async function trace(page, scene, section, cycles = 6, dwell = 900) {
  const t = [];
  for (let i = 0; i < cycles; i++) {
    await page.evaluate((s) => document.querySelector(`[data-scene="${s}"]`)?.scrollIntoView({ block: 'center', behavior: 'instant' }), scene);
    await page.waitForTimeout(dwell);
    t.push(await page.evaluate(([s, sec]) => {
      const slot = document.querySelector(`[data-scene="${s}"]`);
      const cs = slot ? [...slot.querySelectorAll('canvas')] : [];
      let gl = null; if (cs[0]) { try { gl = cs[0].getContext('webgl2') ? 'webgl2-live' : (cs[0].getContext('webgl') ? 'webgl-live' : 'no-gl'); } catch { gl = 'err'; } }
      const r = slot?.getBoundingClientRect(); const sec2 = document.getElementById(sec);
      return { slot: cs.length, section: sec2 ? sec2.querySelectorAll('canvas').length : -1, gl,
        store: cs[0] ? { bw: cs[0].width, bh: cs[0].height } : null,
        css: r ? { w: +r.width.toFixed(2), h: +r.height.toFixed(2) } : null, dpr: window.devicePixelRatio };
    }, [scene, section]));
  }
  return t;
}
async function fieldMeasure(page, scene, section, tag) {
  if (!(await page.locator(`[data-scene="${scene}"]`).count())) return { present: false };
  const ground = await groundLum(page, section);
  await page.evaluate((s) => document.querySelector(`[data-scene="${s}"]`)?.scrollIntoView({ block: 'center', behavior: 'instant' }), scene);
  await page.waitForTimeout(700);
  const box = await page.evaluate((s) => { const e = document.querySelector(`[data-scene="${s}"]`); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, scene);
  if (!box || box.width < 2 || box.height < 2) return { present: false, box };
  const vp = page.viewportSize(); const clip = clipOf(box, vp);
  const canvases = await page.locator(`[data-scene="${scene}"] canvas`).count();
  const store = await page.evaluate((s) => { const c = document.querySelector(`[data-scene="${s}"] canvas`); if (!c) return null; const r = c.getBoundingClientRect();
    return { bw: c.width, bh: c.height, cssW: +r.width.toFixed(2), cssH: +r.height.toFixed(2), styleW: c.style.width, styleH: c.style.height, dpr: window.devicePixelRatio }; }, scene);
  await page.waitForTimeout(2200);
  await page.evaluate((s) => { document.getElementById('rev-iso')?.remove(); const st = document.createElement('style'); st.id = 'rev-iso';
    st.textContent = `body * { visibility: hidden !important; } [data-scene="${s}"], [data-scene="${s}"] * { visibility: visible !important; }`; document.head.appendChild(st); }, scene);
  const aBuf = await page.screenshot({ clip }); const a = decode(aBuf);
  await page.waitForTimeout(1600);
  const b = decode(await page.screenshot({ clip }));
  await page.evaluate(() => document.getElementById('rev-iso')?.remove());
  if (tag) shot(`${tag}-${scene}.png`, aBuf);
  const cov = coverage(a, ground, canvases ? COVERAGE_DELTA : FALLBACK_DELTA);
  const out = { present: true, canvases, box: { w: Math.round(box.width), h: Math.round(box.height) }, store,
    ground: +ground.toFixed(4), coverage: +cov.toFixed(4), peak: +peakOf(a).toFixed(4), motion: +meanDelta(a, b).toFixed(5),
    mean: +meanOf(a).toFixed(4), gold: goldCensus(a), banding: bandingStats(a) };
  out.pass = canvases ? out.coverage >= COVERAGE_MIN && out.peak >= PEAK_MIN && out.motion >= MOTION_MIN : out.coverage >= FALLBACK_COVERAGE_MIN;
  return out;
}
const AA_WALK = (sections) => {
  const L = (c) => { const f = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const bgOf = (el) => { let n = el; while (n) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c[3] > 0.5) return c; n = n.parentElement; } return [10, 10, 10, 1]; };
  const out = [];
  for (const id of sections) { const root = document.getElementById(id); if (!root) continue;
    for (const el of root.querySelectorAll('h1,h2,h3,p,a,span,li,dt,dd,button,strong,em,small')) {
      const t = (el.textContent || '').trim(); if (!t) continue;
      if (el.querySelector('h1,h2,h3,p,a,span,li,dt,dd,button,strong,em,small')) continue;
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const st = getComputedStyle(el); if (st.visibility === 'hidden' || st.opacity === '0') continue;
      const fg = parse(st.color); if (!fg) continue; const bg = bgOf(el); const l1 = L(fg), l2 = L(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const px = parseFloat(st.fontSize), w = parseInt(st.fontWeight, 10) || 400;
      const large = px >= 24 || (px >= 18.66 && w >= 700);
      out.push({ section: id, text: t.replace(/\s+/g, ' ').slice(0, 30), ratio: +ratio.toFixed(2), px: +px.toFixed(1), need: large ? 3 : 4.5 }); } }
  const below = out.filter((o) => o.ratio < o.need);
  return { nodes: out.length, below: below.length, worst: out.slice().sort((x, y) => x.ratio / x.need - y.ratio / y.need).slice(0, 4), belowList: below.slice(0, 8) };
};

const R = { site: BASE, startedAt: new Date().toISOString() };
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: GL_ARGS });

// ---------- GL path: all six page scenes, both widths ----------
R.gl = {};
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const rec = { pageerrors: [], consoleErrors: [], fields: {}, traces: {} };
  page.on('pageerror', (e) => rec.pageerrors.push(String(e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') rec.consoleErrors.push(m.text().slice(0, 200)); });
  await boot(page, `${BASE}/?gl=force&rev=${Date.now()}`);
  rec.build = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content);
  for (const s of SCENES) {
    rec.traces[s.scene] = await trace(page, s.scene, s.section, 6, 800);
    rec.fields[s.scene] = await fieldMeasure(page, s.scene, s.section, `glforce-${vp.w}`);
    console.log(`gl ${vp.w} ${s.scene}: canvas=${rec.fields[s.scene].canvases} store=${JSON.stringify(rec.fields[s.scene].store)} cov=${rec.fields[s.scene].coverage} peak=${rec.fields[s.scene].peak} motion=${rec.fields[s.scene].motion} pass=${rec.fields[s.scene].pass}`);
  }
  rec.aa = await page.evaluate(AA_WALK, ['hero', 'about', 'experience']);
  R.gl[vp.w] = rec;
  console.log(`gl ${vp.w} AA: nodes=${rec.aa.nodes} below=${rec.aa.below} err=${rec.pageerrors.length}`);
  await ctx.close();
}

// ---------- still path (no ?gl=force): AA + reduced-motion stills ----------
R.still = {};
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const rec = { pageerrors: [], fields: {} };
  page.on('pageerror', (e) => rec.pageerrors.push(String(e).slice(0, 200)));
  await boot(page, `${BASE}/?rev=${Date.now()}`);
  rec.build = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content);
  rec.aa = await page.evaluate(AA_WALK, ['hero', 'about', 'experience']);
  for (const s of [SCENES[0], SCENES[1], SCENES[2]]) {
    rec.fields[s.scene] = await fieldMeasure(page, s.scene, s.section, `reduced-${vp.w}`);
    console.log(`still ${vp.w} ${s.scene}: canvas=${rec.fields[s.scene].canvases} cov=${rec.fields[s.scene].coverage} mean=${rec.fields[s.scene].mean} pass=${rec.fields[s.scene].pass}`);
  }
  R.still[vp.w] = rec;
  console.log(`still ${vp.w} AA: nodes=${rec.aa.nodes} below=${rec.aa.below} err=${rec.pageerrors.length}`);
  await ctx.close();
}

// ---------- poster path: GL chunk blocked, hero stage luminance ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const rec = { pageerrors: [] };
  page.on('pageerror', (e) => rec.pageerrors.push(String(e).slice(0, 200)));
  await page.route(LAZY_CHUNK, (r) => r.abort());
  await boot(page, `${BASE}/?rev=${Date.now()}`);
  rec.build = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content);
  const slot = page.locator('[data-scene="hero-atmosphere"]');
  await page.waitForTimeout(2200);
  rec.canvases = await slot.locator('canvas').count();
  rec.firstLayer = (await slot.evaluate((el) => getComputedStyle(el).backgroundImage)).split(/,(?![^(]*\))/)[0].trim().slice(0, 90);
  const box = await slot.boundingBox();
  const buf = await page.screenshot({ clip: clipOf(box, page.viewportSize()) });
  shot('poster-1440-stage.png', buf);
  const f = decode(buf);
  rec.stageMeanLuma = +meanOf(f).toFixed(4); rec.stagePeak = +peakOf(f).toFixed(4);
  rec.coverageAt004 = +coverage(f, 0, FALLBACK_DELTA).toFixed(4);
  rec.gold = goldCensus(f);
  R.poster = rec;
  console.log(`poster: canvases=${rec.canvases} mean=${rec.stageMeanLuma} peak=${rec.stagePeak} first=${rec.firstLayer}`);
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'probe-res.json'), JSON.stringify(R, null, 2));
console.log('done');
