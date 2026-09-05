// G-REV phase 2 — G-S1 (skills-bench) + hero-scene regression probe on live 9b864752.
// Luminance/coverage/peak/motion method copied from tests/overhaul/flagship-visibility.spec.ts.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import { PNG } from '/root/forgotten-mistory/node_modules/pngjs/lib/png.js';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const BASE = 'https://forgotten-mistory.web.app';
const LAUNCH = {
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
};
const COVERAGE_DELTA = 0.06, COVERAGE_MIN = 0.15, PEAK_MIN = 0.35, MOTION_MIN = 0.004;

const relLum = (r, g, b) => { const c = (v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b); };
function decodeLuma(buf) { const png = PNG.sync.read(buf); const v = new Float64Array(png.width * png.height); for (let i = 0; i < v.length; i++) { const o = i * 4; v[i] = relLum(png.data[o], png.data[o + 1], png.data[o + 2]); } return { values: v, width: png.width, height: png.height }; }
const coverage = (f, g, d) => { let h = 0; for (let i = 0; i < f.values.length; i++) if (f.values[i] >= g + d) h++; return h / f.values.length; };
const peak = (f) => { let m = 0; for (let i = 0; i < f.values.length; i++) if (f.values[i] > m) m = f.values[i]; return m; };
const meanDelta = (a, b) => { const n = Math.min(a.values.length, b.values.length); let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a.values[i] - b.values[i]); return n ? s / n : 0; };

const results = {};
const browser = await chromium.launch(LAUNCH);

async function groundLum(page, id) {
  const rgb = await page.evaluate((sid) => {
    let n = document.getElementById(sid);
    while (n) { const m = getComputedStyle(n).backgroundColor.match(/rgba?\(([^)]+)\)/); if (m) { const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); if ((p.length > 3 ? p[3] : 1) > 0.5) return [p[0], p[1], p[2]]; } n = n.parentElement; }
    const bm = getComputedStyle(document.body).backgroundColor.match(/rgba?\(([^)]+)\)/);
    return bm ? bm[1].split(/[,\s/]+/).filter(Boolean).map(Number).slice(0, 3) : [0, 0, 0];
  }, id);
  return relLum(rgb[0], rgb[1], rgb[2]);
}

const SCAN = () => {
  const out = { total: document.querySelectorAll('canvas').length, bySection: {}, slots: [], detail: [] };
  for (const id of ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen']) {
    const s = document.getElementById(id);
    out.bySection[id] = s ? s.querySelectorAll('canvas').length : 'MISSING';
  }
  out.slots = [...document.querySelectorAll('[data-scene]')].map((el) => { const r = el.getBoundingClientRect(); return { scene: el.dataset.scene, section: el.closest('section')?.id || null, w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top), canvases: el.querySelectorAll('canvas').length, glState: el.dataset.glState || el.getAttribute('data-gl') || null, attrs: [...el.attributes].map((a) => a.name + '=' + a.value).join(' ').slice(0, 200) }; });
  out.detail = [...document.querySelectorAll('canvas')].map((c) => { const r = c.getBoundingClientRect(); let ctx = 'unknown'; try { ctx = c.getContext('webgl2') ? 'webgl2-live' : (c.getContext('webgl') ? 'webgl-live' : 'no-gl'); } catch { ctx = 'ctx-err'; } return { section: c.closest('section')?.id || null, scene: c.closest('[data-scene]')?.dataset?.scene || null, w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height), ctx }; });
  const sk = document.getElementById('skills');
  out.skills = sk ? {
    svgCount: sk.querySelectorAll('svg').length,
    svgVisible: [...sk.querySelectorAll('svg')].map((s) => { const r = s.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), cls: (s.className?.baseVal || '').slice(0, 60) }; }),
    height: Math.round(sk.getBoundingClientRect().height),
    textLen: sk.innerText.trim().length,
    headings: [...sk.querySelectorAll('h2,h3')].map((h) => h.innerText.trim().slice(0, 60)),
  } : 'MISSING';
  return out;
};

// gold nodes inside #skills (mirrors tests/monochrome/gold-semantics.spec.ts goldInSkills)
const GOLD = () => {
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const isGold = (c, sat) => { if (!c || c.a < 0.35) return false; const { r, g, b } = c; const mx = Math.max(r, g, b), mn = Math.min(r, g, b); const chroma = mx - mn; return r > g && g > b && chroma >= (sat ? 40 : 18) && mx >= (sat ? 120 : 70); };
  const sk = document.getElementById('skills');
  if (!sk) return { error: 'no skills' };
  const rows = [];
  for (const el of sk.querySelectorAll('*')) {
    const s = getComputedStyle(el);
    const hits = [];
    for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderLeftColor', 'fill', 'stroke', 'outlineColor']) {
      const c = parse(s[prop] || '');
      if (isGold(c, false)) hits.push({ prop, v: s[prop], sat: isGold(c, true) });
    }
    if (hits.length) rows.push({ tag: el.tagName, cls: (el.className?.toString?.() || el.className?.baseVal || '').slice(0, 70), text: (el.innerText || '').trim().slice(0, 40), hits });
  }
  return { any: rows.length, saturated: rows.filter((r) => r.hits.some((h) => h.sat)).length, nodes: rows };
};

async function run(label, { width, height, url, reducedMotion, scrollTo, waitMs = 2500 }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const bag = { console: [], pageerrors: [], failed: [] };
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') bag.console.push({ type: m.type(), text: m.text().slice(0, 250) }); });
  page.on('pageerror', (e) => bag.pageerrors.push(String(e).slice(0, 500)));
  page.on('requestfailed', (r) => bag.failed.push({ url: r.url(), err: r.failure()?.errorText }));
  const status = (await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }))?.status();
  await page.waitForTimeout(1200);
  const preScroll = await page.evaluate(SCAN);
  if (scrollTo) {
    await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ block: 'center', behavior: 'instant' }), scrollTo);
    await page.waitForTimeout(waitMs);
  }
  const scan = await page.evaluate(SCAN);
  const gold = await page.evaluate(GOLD);
  const rec = { label, status, url, width, height, reducedMotion: !!reducedMotion, ...bag, preScrollCanvases: preScroll.total, preScrollSlots: preScroll.slots, scan, gold };

  // luminance of the skills-bench slot, if it exists
  const slot = page.locator('[data-scene="skills-bench"]');
  if (await slot.count()) {
    const ground = await groundLum(page, 'skills');
    await slot.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await page.waitForTimeout(400);
    await page.evaluate(() => { const s = document.createElement('style'); s.id = 'iso'; s.textContent = 'body * { visibility: hidden !important; } [data-scene="skills-bench"], [data-scene="skills-bench"] * { visibility: visible !important; }'; document.head.appendChild(s); });
    const box = await slot.boundingBox();
    if (box) {
      const clip = { x: Math.max(0, Math.min(box.x, width - 4)), y: Math.max(0, Math.min(box.y, height - 4)) };
      clip.width = Math.max(4, Math.min(box.width, width - clip.x));
      clip.height = Math.max(4, Math.min(box.height, height - clip.y));
      const a = await page.screenshot({ clip, path: path.join(OUT, `${label}-benchfield-t0.png`) });
      await page.waitForTimeout(1000);
      const b = await page.screenshot({ clip, path: path.join(OUT, `${label}-benchfield-t1.png`) });
      const fa = decodeLuma(a), fb = decodeLuma(b);
      rec.field = { ground: +ground.toFixed(4), clip, coverage: +coverage(fa, ground, COVERAGE_DELTA).toFixed(4), peak: +peak(fa).toFixed(4), motion: +meanDelta(fa, fb).toFixed(6), gates: {} };
      rec.field.gates = { coverage: rec.field.coverage >= COVERAGE_MIN, peak: rec.field.peak >= PEAK_MIN, motion: rec.field.motion >= MOTION_MIN };
    }
    await page.evaluate(() => document.getElementById('iso')?.remove());
  } else rec.field = null;

  await page.evaluate(() => document.getElementById('skills')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUT, `${label}-skills.png`) });
  await ctx.close();
  results[label] = rec;
  console.log(`${label}: st=${status} err=${bag.pageerrors.length} totalCanvas=${scan.total} skillsCanvas=${scan.bySection.skills} heroCanvas=${scan.bySection.hero} slots=${scan.slots.map((s) => s.scene + ':' + s.canvases).join(',')} svg=${scan.skills.svgCount} gold(any/sat)=${gold.any}/${gold.saturated} field=${rec.field ? JSON.stringify(rec.field.gates) + ' cov=' + rec.field.coverage + ' pk=' + rec.field.peak + ' mo=' + rec.field.motion : 'NO-SLOT'}`);
}

await run('1440-glforce', { width: 1440, height: 900, url: `${BASE}/?gl=force`, scrollTo: 'skills' });
await run('390-glforce', { width: 390, height: 844, url: `${BASE}/?gl=force`, scrollTo: 'skills' });
await run('1440-reduced', { width: 1440, height: 900, url: `${BASE}/?gl=force`, reducedMotion: true, scrollTo: 'skills' });
await run('1440-normal', { width: 1440, height: 900, url: `${BASE}/`, scrollTo: 'skills' });

await browser.close();
fs.writeFileSync(path.join(OUT, 'probeB-gl.json'), JSON.stringify(results, null, 2));
console.log('WROTE probeB-gl.json');
