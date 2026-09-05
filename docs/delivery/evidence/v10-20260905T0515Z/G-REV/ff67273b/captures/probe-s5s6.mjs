// Reviewer probe — live ff67273b, S5 vitrine-field + S6 listen-field.
// Method parity: field measure = tests/overhaul/flagship-visibility.spec.ts
//   (ground = computed background-color luminance of the SECTION, coverage at
//    ground+0.06, peak = max L, motion = mean |dL| over a 1.6 s gap, slot
//    isolated with the spec's own visibility rule).
// Canvas attribution = G-REV/9b864752/captures/probeC-final.mjs (six
//   scroll-and-wait cycles, per-section canvas counts + live GL context probe).
// AA walk = tests/a11y/text-contrast.spec.ts (glyph-masked composite, pixels
//   read under each text node's own rects, after warming every scene slot).
// Gold census = exact palette match from tests/monochrome/gold-semantics.spec.ts.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import { PNG } from '/root/forgotten-mistory/node_modules/pngjs/lib/png.js';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const BASE = 'https://forgotten-mistory.web.app';
const GL_ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-lcd-text'];
const NOGL_ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--disable-lcd-text'];

const COVERAGE_DELTA = 0.06, COVERAGE_MIN = 0.15, PEAK_MIN = 0.35, MOTION_MIN = 0.004;
const FALLBACK_DELTA = 0.04, FALLBACK_COVERAGE_MIN = 0.08;

const SCENES = [
  { section: 'hero', scene: 'hero-atmosphere' },
  { section: 'about', scene: 'about-field' },
  { section: 'experience', scene: 'career-strata' },
  { section: 'skills', scene: 'skills-bench' },
  { section: 'vitrine', scene: 'vitrine-field' },
  { section: 'listen', scene: 'listen-field' },
];
const UNDER_TEST = ['vitrine-field', 'listen-field'];

const SATURATED_GOLD = [[201, 168, 76], [212, 182, 92]];
const ANY_GOLD = [...SATURATED_GOLD, [232, 213, 163], [176, 146, 63]];

function relLum(r, g, b) {
  const c = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
}
function decodeLuma(buf) {
  const png = PNG.sync.read(buf);
  const v = new Float64Array(png.width * png.height);
  for (let i = 0; i < v.length; i++) { const o = i * 4; v[i] = relLum(png.data[o], png.data[o + 1], png.data[o + 2]); }
  return { values: v, width: png.width, height: png.height };
}
const coverage = (f, ground, delta) => { let h = 0; for (let i = 0; i < f.values.length; i++) if (f.values[i] >= ground + delta) h++; return h / f.values.length; };
const peakOf = (f) => { let m = 0; for (let i = 0; i < f.values.length; i++) if (f.values[i] > m) m = f.values[i]; return m; };
const meanDelta = (a, b) => { const n = Math.min(a.values.length, b.values.length); let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a.values[i] - b.values[i]); return n ? s / n : 0; };

async function groundLuminance(page, section) {
  const rgb = await page.evaluate((id) => {
    let node = document.getElementById(id);
    while (node) {
      const m = getComputedStyle(node).backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (m) { const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); const a = p.length > 3 ? p[3] : 1; if (a > 0.5) return [p[0], p[1], p[2]]; }
      node = node.parentElement;
    }
    const bm = getComputedStyle(document.body).backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (bm) { const p = bm[1].split(/[,\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2]]; }
    return [0, 0, 0];
  }, section);
  return relLum(rgb[0], rgb[1], rgb[2]);
}

async function boot(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {});
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 }).catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(800);
}

// Six scroll-and-wait cycles, probeC style: per-cycle canvas attribution.
async function scrollAndWaitTrace(page, scene, section, cycles = 6, dwell = 1200) {
  const trace = [];
  for (let i = 0; i < cycles; i++) {
    await page.locator(`#${section}`).scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate((s) => document.querySelector(`[data-scene="${s}"]`)?.scrollIntoView({ block: 'center', behavior: 'instant' }), scene);
    await page.waitForTimeout(dwell);
    trace.push(await page.evaluate(([s, sec]) => {
      const slot = document.querySelector(`[data-scene="${s}"]`);
      const r = slot?.getBoundingClientRect();
      const cs = slot ? [...slot.querySelectorAll('canvas')] : [];
      let gl = null;
      if (cs[0]) { try { gl = cs[0].getContext('webgl2') ? 'webgl2-live' : (cs[0].getContext('webgl') ? 'webgl-live' : 'no-gl'); } catch { gl = 'err'; } }
      const secEl = document.getElementById(sec);
      return {
        slotBox: r ? { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) } : null,
        canvasesInSlot: cs.length,
        canvasesInSection: secEl ? secEl.querySelectorAll('canvas').length : -1,
        canvasSize: cs[0] ? { w: cs[0].width, h: cs[0].height } : null,
        gl, totalCanvases: document.querySelectorAll('canvas').length,
      };
    }, [scene, section]));
  }
  return trace;
}

async function fieldMeasure(page, scene, section, gapMs = 1600) {
  const slot = page.locator(`[data-scene="${scene}"]`);
  if ((await slot.count()) === 0) return { present: false, reason: 'no slot' };
  const ground = await groundLuminance(page, section);
  await page.evaluate((s) => document.querySelector(`[data-scene="${s}"]`)?.scrollIntoView({ block: 'center', behavior: 'instant' }), scene);
  await page.waitForTimeout(600);
  const box = await page.evaluate((s) => { const e = document.querySelector(`[data-scene="${s}"]`); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, scene);
  if (!box || box.width < 2 || box.height < 2) return { present: false, reason: 'no box', box };
  const vp = page.viewportSize();
  const x = Math.max(0, Math.min(box.x, vp.width - 4)), y = Math.max(0, Math.min(box.y, vp.height - 4));
  const clip = { x, y, width: Math.max(4, Math.min(box.width, vp.width - x)), height: Math.max(4, Math.min(box.height, vp.height - y)) };
  const canvases = await page.locator(`[data-scene="${scene}"] canvas`).count();
  await page.waitForTimeout(2500);
  await page.evaluate((s) => {
    const st = document.createElement('style'); st.id = 'flagship-visibility-isolate';
    st.textContent = `body * { visibility: hidden !important; } [data-scene="${s}"], [data-scene="${s}"] * { visibility: visible !important; }`;
    document.head.appendChild(st);
  }, scene);
  const a = decodeLuma(await page.screenshot({ clip }));
  await page.waitForTimeout(gapMs);
  const bBuf = await page.screenshot({ clip });
  const b = decodeLuma(bBuf);
  await page.evaluate(() => document.getElementById('flagship-visibility-isolate')?.remove());
  return {
    present: true, canvases, clip: { w: Math.round(clip.width), h: Math.round(clip.height) },
    ground: +ground.toFixed(4),
    coverage: +coverage(a, ground, COVERAGE_DELTA).toFixed(4),
    peak: +peakOf(a).toFixed(4),
    motion: +meanDelta(a, b).toFixed(5),
    fallbackCoverage: +coverage(a, ground, FALLBACK_DELTA).toFixed(4),
    png: bBuf,
  };
}

const MASK = `*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important;transition:none!important}`;
const ch = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const lum2 = ([r, g, b]) => 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
const ratioOf = (a, b) => { const l1 = lum2(a), l2 = lum2(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

// AA walk over one section — repo method: warm every scene, mask glyphs, read
// the composited ground under each text node's own rects.
async function aaWalk(page, sectionId) {
  for (const s of SCENES) {
    const el = page.locator(`[data-scene="${s.scene}"]`);
    if ((await el.count()) === 0) continue;
    await el.first().evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' })).catch(() => {});
    await page.waitForTimeout(700);
  }
  await page.locator(`#${sectionId}`).scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(1500);
  const rows = [];
  // Walk the section in viewport-sized steps so every text node is measured on-screen.
  const steps = await page.evaluate((id) => {
    const s = document.getElementById(id); if (!s) return [];
    const r = s.getBoundingClientRect(); const top = r.top + scrollY;
    const out = []; for (let y = top - 60; y < top + r.height; y += innerHeight * 0.7) out.push(y);
    return out;
  }, sectionId);
  for (const yy of steps) {
    await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), yy);
    await page.waitForTimeout(900);
    const nodes = await page.evaluate((id) => {
      const sec = document.getElementById(id); if (!sec) return [];
      const out = [];
      for (const el of sec.querySelectorAll('*')) {
        if (el.children.length) continue;
        const t = (el.textContent || '').trim(); if (t.length < 2) continue;
        const cs = getComputedStyle(el);
        if (cs.visibility !== 'visible' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (r.bottom < 4 || r.top > innerHeight - 4) continue;
        const pts = [];
        for (const fx of [0.1, 0.3, 0.5, 0.7, 0.9]) for (const fy of [0.3, 0.5, 0.7]) pts.push([r.left + r.width * fx, r.top + r.height * fy]);
        out.push({ text: t.slice(0, 44), cls: (el.className?.toString?.() || '').slice(0, 46), color: cs.color, fontSize: parseFloat(cs.fontSize), fontWeight: parseInt(cs.fontWeight, 10) || 400, pts });
      }
      return out;
    }, sectionId);
    if (!nodes.length) continue;
    await page.evaluate((css) => { const st = document.createElement('style'); st.id = '__mask'; st.textContent = css; document.head.appendChild(st); }, MASK);
    const shot = await page.screenshot({ animations: 'disabled' });
    await page.evaluate(() => document.getElementById('__mask')?.remove());
    const all = nodes.flatMap((n) => n.pts);
    const px = await page.evaluate(async ([b64, pts]) => {
      const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
      const sc = img.naturalWidth / window.innerWidth;
      return pts.map(([a, b]) => { const d = x.getImageData(Math.min(c.width - 1, Math.round(a * sc)), Math.min(c.height - 1, Math.round(b * sc)), 1, 1).data; return [d[0], d[1], d[2]]; });
    }, [shot.toString('base64'), all]);
    let cur = 0;
    for (const n of nodes) {
      const m = n.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
      const fg = m ? [+m[1], +m[2], +m[3]] : [255, 255, 255];
      const alpha = m && m[4] !== undefined ? +m[4] : 1;
      const mine = px.slice(cur, cur + n.pts.length); cur += n.pts.length;
      let worst = Infinity, wbg = null;
      for (const bg of mine) {
        const flat = alpha < 1 ? [fg[0] * alpha + bg[0] * (1 - alpha), fg[1] * alpha + bg[1] * (1 - alpha), fg[2] * alpha + bg[2] * (1 - alpha)] : fg;
        const r = ratioOf(flat, bg); if (r < worst) { worst = r; wbg = bg; }
      }
      const need = (n.fontSize >= 24 || (n.fontSize >= 18.66 && n.fontWeight >= 700)) ? 3 : 4.5;
      const key = n.text + '|' + n.cls;
      const prev = rows.find((r) => r.key === key);
      const row = { key, text: n.text, cls: n.cls, fg: `rgb(${fg.join(',')})`, bg: `rgb(${wbg.join(',')})`, px: n.fontSize, need, ratio: +worst.toFixed(2), pass: worst >= need };
      if (prev) { if (row.ratio < prev.ratio) Object.assign(prev, row); } else rows.push(row);
    }
  }
  rows.sort((a, b) => a.ratio - b.ratio);
  return { total: rows.length, fails: rows.filter((r) => !r.pass), worstTen: rows.slice(0, 10) };
}

const GOLD_CENSUS = ({ palette, scopeId }) => {
  const parse = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 }; };
  const hit = (s) => { const c = parse(s); if (!c || c.a === 0) return false; return palette.some((g) => Math.abs(c.rgb[0] - g[0]) <= 1 && Math.abs(c.rgb[1] - g[1]) <= 1 && Math.abs(c.rgb[2] - g[2]) <= 1); };
  const scope = scopeId ? document.getElementById(scopeId) : document.body;
  if (!scope) return { error: 'no scope ' + scopeId };
  const rows = [];
  for (const el of scope.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) continue;
    const via = [];
    for (const p of ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'fill', 'stroke', 'outlineColor']) if (hit(s[p])) via.push(p + '=' + s[p]);
    if (!via.length) continue;
    const a = el.closest('a');
    rows.push({ tag: el.tagName, cls: (el.className?.toString?.() || el.className?.baseVal || '').slice(0, 60), text: (el.textContent || '').trim().slice(0, 50), href: a?.getAttribute('href') || null, via: via.join(' | '), isRepoUrl: !!(a && /^https?:\/\/(www\.)?github\.com\//.test(a.getAttribute('href') || '')) });
  }
  return { count: rows.length, nodes: rows };
};

const out = { probedAt: new Date().toISOString(), base: BASE, buildCommit: null, contexts: {} };

function hook(page, bag) {
  page.on('pageerror', (e) => bag.pageerrors.push(String(e.message || e).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') bag.consoleErrors.push(m.text().slice(0, 220)); });
  page.on('requestfailed', (r) => bag.requestFailed.push(`${r.url().slice(0, 140)} :: ${r.failure()?.errorText}`));
}

// ---------- A: /?gl=force at 1440 and 390 ----------
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const label = `glforce-${vp.w}`;
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: GL_ARGS });
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const bag = { pageerrors: [], consoleErrors: [], requestFailed: [] };
  hook(page, bag);
  await boot(page, `${BASE}/?gl=force`);
  out.buildCommit ||= await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content || null);

  const rec = { errors: bag, traces: {}, fields: {}, aa: {}, gold: {} };
  for (const s of SCENES.filter((x) => UNDER_TEST.includes(x.scene))) {
    rec.traces[s.scene] = await scrollAndWaitTrace(page, s.scene, s.section).catch((e) => ({ error: String(e).slice(0, 160) }));
  }
  // Field measure: both under test at both widths; the other four spot-checked at 1440.
  const toMeasure = vp.w === 1440 ? SCENES : SCENES.filter((x) => UNDER_TEST.includes(x.scene));
  for (const s of toMeasure) {
    const m = await fieldMeasure(page, s.scene, s.section).catch((e) => ({ present: false, reason: String(e).slice(0, 160) }));
    if (m.png) { fs.writeFileSync(path.join(OUT, `${label}-${s.scene}.png`), m.png); delete m.png; }
    rec.fields[s.scene] = m;
  }
  for (const sec of ['vitrine', 'listen']) rec.aa[sec] = await aaWalk(page, sec).catch((e) => ({ error: String(e).slice(0, 160) }));
  rec.gold.vitrineAny = await page.evaluate(GOLD_CENSUS, { palette: ANY_GOLD, scopeId: 'vitrine' });
  rec.gold.listenAny = await page.evaluate(GOLD_CENSUS, { palette: ANY_GOLD, scopeId: 'listen' });
  rec.gold.pageAny = await page.evaluate(GOLD_CENSUS, { palette: ANY_GOLD, scopeId: null });
  rec.gold.pageSaturated = await page.evaluate(GOLD_CENSUS, { palette: SATURATED_GOLD, scopeId: null });
  out.contexts[label] = rec;
  console.log(`[${label}] done errors=${bag.pageerrors.length}/${bag.requestFailed.length} vit=${JSON.stringify(rec.fields['vitrine-field'] && { c: rec.fields['vitrine-field'].coverage, p: rec.fields['vitrine-field'].peak, m: rec.fields['vitrine-field'].motion })} lis=${JSON.stringify(rec.fields['listen-field'] && { c: rec.fields['listen-field'].coverage, p: rec.fields['listen-field'].peak, m: rec.fields['listen-field'].motion })}`);
  await ctx.close(); await browser.close();
  fs.writeFileSync(path.join(OUT, 'probe-s5s6.json'), JSON.stringify(out, null, 1));
}

// ---------- B: prefers-reduced-motion at 1440 and 390 (?gl=force) ----------
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const label = `reduced-${vp.w}`;
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: GL_ARGS });
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const bag = { pageerrors: [], consoleErrors: [], requestFailed: [] };
  hook(page, bag);
  await boot(page, `${BASE}/?gl=force`);
  const rec = { errors: bag, sections: {}, stills: {} };
  for (const s of SCENES.filter((x) => UNDER_TEST.includes(x.scene))) {
    await page.locator(`#${s.section}`).scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate((sc) => document.querySelector(`[data-scene="${sc}"]`)?.scrollIntoView({ block: 'center', behavior: 'instant' }), s.scene);
    await page.waitForTimeout(2000);
    rec.sections[s.scene] = await page.evaluate(([sc, sec]) => ({
      canvasesInSection: document.getElementById(sec)?.querySelectorAll('canvas').length ?? -1,
      canvasesInSlot: document.querySelectorAll(`[data-scene="${sc}"] canvas`).length,
      slotPresent: !!document.querySelector(`[data-scene="${sc}"]`),
      totalCanvases: document.querySelectorAll('canvas').length,
    }), [s.scene, s.section]);
    const m = await fieldMeasure(page, s.scene, s.section, 900).catch((e) => ({ present: false, reason: String(e).slice(0, 160) }));
    if (m.png) { fs.writeFileSync(path.join(OUT, `${label}-${s.scene}.png`), m.png); delete m.png; }
    rec.stills[s.scene] = m;
  }
  out.contexts[label] = rec;
  console.log(`[${label}] canvases=${JSON.stringify(Object.entries(rec.sections).map(([k, v]) => [k, v.canvasesInSection]))} still=${JSON.stringify(Object.entries(rec.stills).map(([k, v]) => [k, v.fallbackCoverage]))}`);
  await ctx.close(); await browser.close();
  fs.writeFileSync(path.join(OUT, 'probe-s5s6.json'), JSON.stringify(out, null, 1));
}

// ---------- C: plain / (no ?gl=force), AA + hero first paint + gold ----------
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const label = `plain-${vp.w}`;
  const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: NOGL_ARGS });
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const bag = { pageerrors: [], consoleErrors: [], requestFailed: [] };
  hook(page, bag);
  const t0 = Date.now();
  await boot(page, `${BASE}/`);
  const rec = { errors: bag, bootMs: Date.now() - t0, aa: {}, gold: {} };
  rec.hero = await page.evaluate(() => {
    const h = document.getElementById('hero');
    const paint = performance.getEntriesByType('paint').map((p) => [p.name, Math.round(p.startTime)]);
    return { heading: h?.querySelector('h1')?.innerText.trim().slice(0, 60) || null, canvases: h?.querySelectorAll('canvas').length ?? -1, paint, textLen: (h?.innerText || '').trim().length };
  });
  for (const sec of ['vitrine', 'listen']) rec.aa[sec] = await aaWalk(page, sec).catch((e) => ({ error: String(e).slice(0, 160) }));
  rec.gold.vitrineAny = await page.evaluate(GOLD_CENSUS, { palette: ANY_GOLD, scopeId: 'vitrine' });
  rec.gold.listenAny = await page.evaluate(GOLD_CENSUS, { palette: ANY_GOLD, scopeId: 'listen' });
  rec.gold.pageAny = await page.evaluate(GOLD_CENSUS, { palette: ANY_GOLD, scopeId: null });
  out.contexts[label] = rec;
  console.log(`[${label}] boot=${rec.bootMs}ms err=${bag.pageerrors.length} aaFails=${rec.aa.vitrine.fails.length}/${rec.aa.listen.fails.length} goldPage=${rec.gold.pageAny.count}`);
  await ctx.close(); await browser.close();
  fs.writeFileSync(path.join(OUT, 'probe-s5s6.json'), JSON.stringify(out, null, 1));
}

fs.writeFileSync(path.join(OUT, 'probe-s5s6.json'), JSON.stringify(out, null, 1));
console.log('WROTE ' + path.join(OUT, 'probe-s5s6.json'));
