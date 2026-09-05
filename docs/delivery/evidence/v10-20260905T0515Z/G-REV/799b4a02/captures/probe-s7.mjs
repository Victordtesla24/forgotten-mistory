// Reviewer probe — live 799b4a02. S7 minivic-viseme stage + resolutionScale (af7355a).
// Method parity:
//   panel open / mute / send / TTFT / request attribution -> G-REV/411650c2/reviewer-probe.mjs
//   field measure (ground+0.06 coverage, peak, 1.6 s motion, slot isolate)
//     -> tests/overhaul/flagship-visibility.spec.ts (via G-REV/ff67273b/captures/probe-s5s6.mjs)
//   scroll-and-wait canvas attribution -> G-REV/9b864752 probeC (six cycles)
//   AA walk -> tests/a11y/text-contrast.spec.ts computed-style walk
// GL args are flagship-visibility.spec.ts's GL_ARGS; --disable-lcd-text for pixel work.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import { PNG } from '/root/forgotten-mistory/node_modules/pngjs/lib/png.js';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const BASE = 'https://forgotten-mistory.web.app';
const QUESTION = 'What did Vikram do at the ATO?';
const ORIGIN_HOST = 'minivicchat-hjdyjsrzvq-uc.a.run.app';
const GL_ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-lcd-text'];
const NOGL_ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--disable-lcd-text'];
const COVERAGE_DELTA = 0.06, COVERAGE_MIN = 0.15, PEAK_MIN = 0.35, MOTION_MIN = 0.004;
const FALLBACK_DELTA = 0.04, FALLBACK_COVERAGE_MIN = 0.08;
const PHASE = process.argv[2] || 'all';

const SCENES = [
  { section: 'hero', scene: 'hero-atmosphere' },
  { section: 'about', scene: 'about-field' },
  { section: 'experience', scene: 'career-strata' },
  { section: 'skills', scene: 'skills-bench' },
  { section: 'vitrine', scene: 'vitrine-field' },
  { section: 'listen', scene: 'listen-field' },
];
const GOLDS = [[201, 168, 76], [212, 182, 92], [232, 213, 163], [176, 146, 63]];

const relLum = (r, g, b) => {
  const c = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
function decode(buf) {
  const png = PNG.sync.read(buf);
  const v = new Float64Array(png.width * png.height);
  for (let i = 0; i < v.length; i++) { const o = i * 4; v[i] = relLum(png.data[o], png.data[o + 1], png.data[o + 2]); }
  return { values: v, width: png.width, height: png.height, data: png.data };
}
const coverage = (f, ground, delta) => { let h = 0; for (let i = 0; i < f.values.length; i++) if (f.values[i] >= ground + delta) h++; return h / f.values.length; };
const peakOf = (f) => { let m = 0; for (let i = 0; i < f.values.length; i++) if (f.values[i] > m) m = f.values[i]; return m; };
const meanOf = (f) => { let s = 0; for (let i = 0; i < f.values.length; i++) s += f.values[i]; return s / f.values.length; };
const meanDelta = (a, b) => { const n = Math.min(a.values.length, b.values.length); let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a.values[i] - b.values[i]); return n ? s / n : 0; };
function goldCensus(f) {
  let exact = 0, warm = 0;
  for (let i = 0; i < f.values.length; i++) {
    const o = i * 4, r = f.data[o], g = f.data[o + 1], b = f.data[o + 2];
    if (GOLDS.some((c) => Math.abs(r - c[0]) <= 10 && Math.abs(g - c[1]) <= 10 && Math.abs(b - c[2]) <= 10)) exact++;
    if (r > 110 && r - b > 40 && r >= g && g > b) warm++;
  }
  return { exactGoldPx: exact, warmPx: warm, totalPx: f.values.length,
    exactGoldPct: +(100 * exact / f.values.length).toFixed(4), warmPct: +(100 * warm / f.values.length).toFixed(4) };
}
const shot = (n, b) => fs.writeFileSync(path.join(OUT, n), b);
const clipOf = (box, vp) => {
  const x = Math.max(0, Math.min(box.x, vp.width - 4)), y = Math.max(0, Math.min(box.y, vp.height - 4));
  return { x, y, width: Math.max(4, Math.min(box.width, vp.width - x)), height: Math.max(4, Math.min(box.height, vp.height - y)) };
};

const CTX_COUNTER = () => {
  window.__glCount = 0; window.__glCanvases = [];
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const ctx = orig.call(this, type, ...rest);
    if (ctx && /webgl/i.test(String(type)) && !this.__glCounted) {
      this.__glCounted = true; window.__glCount += 1;
      window.__glCanvases.push({ type: String(type), scene: this.closest?.('[data-scene]')?.getAttribute('data-scene') || null });
    }
    return ctx;
  };
  window.__csp = [];
  document.addEventListener('securitypolicyviolation', (e) => window.__csp.push({ d: e.violatedDirective, b: e.blockedURI }));
};

async function groundLum(page, sel) {
  const rgb = await page.evaluate((s) => {
    let node = document.querySelector(s);
    while (node) {
      const m = getComputedStyle(node).backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (m) { const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); const a = p.length > 3 ? p[3] : 1; if (a > 0.5) return [p[0], p[1], p[2]]; }
      node = node.parentElement;
    }
    return [0, 0, 0];
  }, sel);
  return relLum(rgb[0], rgb[1], rgb[2]);
}
async function boot(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {});
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 }).catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(700);
}
const buildOf = (page) => page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.getAttribute('content') || null);

async function fieldMeasure(page, scene, sectionSel, gapMs = 1600, tag = '') {
  const n = await page.locator(`[data-scene="${scene}"]`).count();
  if (!n) return { present: false };
  const ground = await groundLum(page, sectionSel);
  const box = await page.evaluate((s) => { const e = document.querySelector(`[data-scene="${s}"]`); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; }, scene);
  if (!box || box.width < 2 || box.height < 2) return { present: false, box };
  const vp = page.viewportSize();
  const clip = clipOf(box, vp);
  const canvases = await page.locator(`[data-scene="${scene}"] canvas`).count();
  const store = await page.evaluate((s) => { const c = document.querySelector(`[data-scene="${s}"] canvas`); if (!c) return null; const r = c.getBoundingClientRect(); return { bw: c.width, bh: c.height, cssW: +r.width.toFixed(2), cssH: +r.height.toFixed(2), dpr: window.devicePixelRatio }; }, scene);
  await page.waitForTimeout(1200);
  await page.evaluate((s) => {
    document.getElementById('rev-isolate')?.remove();
    const st = document.createElement('style'); st.id = 'rev-isolate';
    st.textContent = `body * { visibility: hidden !important; } [data-scene="${s}"], [data-scene="${s}"] * { visibility: visible !important; }`;
    document.head.appendChild(st);
  }, scene);
  const aBuf = await page.screenshot({ clip });
  const a = decode(aBuf);
  await page.waitForTimeout(gapMs);
  const b = decode(await page.screenshot({ clip }));
  await page.evaluate(() => document.getElementById('rev-isolate')?.remove());
  if (tag) shot(`${tag}-${scene}.png`, aBuf);
  const cov = coverage(a, ground, canvases ? COVERAGE_DELTA : FALLBACK_DELTA);
  const out = {
    present: true, canvases, box: { w: Math.round(box.width), h: Math.round(box.height) }, store,
    ground: +ground.toFixed(4), coverage: +cov.toFixed(4), peak: +peakOf(a).toFixed(4),
    motion: +meanDelta(a, b).toFixed(5), mean: +meanOf(a).toFixed(4), gold: goldCensus(a),
  };
  out.pass = canvases
    ? out.coverage >= COVERAGE_MIN && out.peak >= PEAK_MIN && out.motion >= MOTION_MIN
    : out.coverage >= FALLBACK_COVERAGE_MIN;
  return out;
}

const AA_WALK = (sections) => {
  const L = (c) => { const f = (v) => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const bgOf = (el) => { let n = el; while (n) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c[3] > 0.5) return c; n = n.parentElement; } return [10, 10, 10, 1]; };
  const out = [];
  for (const id of sections) {
    const root = document.getElementById(id); if (!root) continue;
    for (const el of root.querySelectorAll('h1,h2,h3,p,a,span,li,dt,dd,button,strong,em,small')) {
      const t = (el.textContent || '').trim(); if (!t) continue;
      if (el.querySelector('h1,h2,h3,p,a,span,li,dt,dd,button,strong,em,small')) continue;
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
      const st = getComputedStyle(el); if (st.visibility === 'hidden' || st.opacity === '0') continue;
      const fg = parse(st.color); if (!fg) continue;
      const bg = bgOf(el); const l1 = L(fg), l2 = L(bg);
      const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      const px = parseFloat(st.fontSize), w = parseInt(st.fontWeight, 10) || 400;
      const large = px >= 24 || (px >= 18.66 && w >= 700);
      out.push({ section: id, text: t.replace(/\s+/g, ' ').slice(0, 30), ratio: +ratio.toFixed(2), px: +px.toFixed(1), need: large ? 3 : 4.5 });
    }
  }
  const below = out.filter((o) => o.ratio < o.need);
  return { nodes: out.length, below: below.length, worst: out.sort((x, y) => x.ratio / x.need - y.ratio / y.need).slice(0, 5), belowList: below.slice(0, 8) };
};

async function openPanel(page) {
  await page.waitForFunction(() => { const b = document.querySelector('[data-testid="minivic-toggle"]'); return Boolean(b) && Object.keys(b).some((k) => k.startsWith('__react')); }, null, { timeout: 60000 });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.waitForTimeout(400);
  const before = await page.evaluate(() => ({ gl: window.__glCount, canvases: document.querySelectorAll('canvas').length }));
  await page.locator('[data-testid="minivic-toggle"]').evaluate((el) => el.click());
  const panel = page.locator('[data-testid="minivic-panel"]');
  await panel.waitFor({ state: 'visible', timeout: 30000 });
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => ({ gl: window.__glCount, canvases: document.querySelectorAll('canvas').length, list: window.__glCanvases }));
  return { before, after };
}
async function mute(page) {
  const btn = page.locator('[data-testid="minivic-panel"]').getByRole('button', { name: 'Mute voice' });
  if (await btn.count()) { await btn.first().click(); return true; }
  return false;
}
// Sample the stage box every `every` ms for `ms`; returns per-frame stats + motion.
async function sampleStage(page, ms, every, tagPrefix) {
  const box = await page.evaluate(() => { const e = document.querySelector('[data-scene="minivic-viseme"]'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  if (!box) return { present: false };
  const clip = clipOf(box, page.viewportSize());
  const frames = [];
  const t0 = Date.now();
  let prev = null, firstBuf = null, lastBuf = null;
  while (Date.now() - t0 < ms) {
    const buf = await page.screenshot({ clip });
    const f = decode(buf);
    if (!firstBuf) firstBuf = buf;
    lastBuf = buf;
    frames.push({ t: Date.now() - t0, mean: +meanOf(f).toFixed(5), peak: +peakOf(f).toFixed(4), d: prev ? +meanDelta(prev, f).toFixed(5) : null });
    prev = f;
    const left = every - (Date.now() - t0) % every;
    await page.waitForTimeout(Math.max(20, left));
  }
  if (tagPrefix) { shot(`${tagPrefix}-first.png`, firstBuf); shot(`${tagPrefix}-last.png`, lastBuf); }
  const ds = frames.map((f) => f.d).filter((v) => v !== null);
  const gr = await groundLum(page, '[data-scene="minivic-viseme"]');
  const lastF = decode(lastBuf);
  return {
    present: true, box: { w: Math.round(box.width), h: Math.round(box.height) }, frames: frames.length,
    meanMotion: ds.length ? +(ds.reduce((a, b) => a + b, 0) / ds.length).toFixed(5) : null,
    maxMotion: ds.length ? +Math.max(...ds).toFixed(5) : null,
    meanLumaFirst: frames[0]?.mean, meanLumaLast: frames[frames.length - 1]?.mean,
    peakMax: +Math.max(...frames.map((f) => f.peak)).toFixed(4),
    coverage: +coverage(lastF, gr, COVERAGE_DELTA).toFixed(4), ground: +gr.toFixed(4),
    gold: goldCensus(lastF), samples: frames,
  };
}
async function sendAndTime(page, question) {
  await page.evaluate(() => {
    window.__rev = { t0: 0, tFirst: 0, baseline: document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]').length };
    document.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !window.__rev.t0) window.__rev.t0 = performance.now(); }, { capture: true });
    new MutationObserver(() => {
      const r = window.__rev; if (!r.t0 || r.tFirst) return;
      const bots = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]');
      if (bots.length <= r.baseline) return;
      if ((bots[bots.length - 1].textContent || '').trim().length > 0) r.tFirst = performance.now();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  const input = page.locator('[data-testid="minivic-input"]');
  await input.fill(question);
  await input.press('Enter');
  let ttft = null;
  try { await page.waitForFunction(() => window.__rev.tFirst > 0, null, { timeout: 40000 }); ttft = Math.round(await page.evaluate(() => window.__rev.tFirst - window.__rev.t0)); } catch { ttft = null; }
  return ttft;
}

const R = { site: BASE, startedAt: new Date().toISOString() };
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: GL_ARGS });

// ---------- PHASE A: panel at ?gl=force, 1440 and 390 ----------
if (PHASE === 'all' || PHASE === 'panel') {
R.panel = {};
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  await ctx.addInitScript(CTX_COUNTER);
  const page = await ctx.newPage();
  const rec = { pageerrors: [], consoleErrors: [], chat: [], tts: [] };
  page.on('pageerror', (e) => rec.pageerrors.push(String(e).slice(0, 200)));
  page.on('console', (m) => { if (m.type() === 'error') rec.consoleErrors.push(m.text().slice(0, 200)); });
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes(ORIGIN_HOST)) rec.chat.push({ kind: 'chat:origin', phase: rec.phase, m: r.method(), at: Date.now() });
    else if (/\/api\/chat/.test(u)) rec.chat.push({ kind: 'chat:hosting', phase: rec.phase, m: r.method(), at: Date.now() });
    else if (/\/api\/tts|elevenlabs/.test(u)) rec.tts.push(u.slice(0, 80));
  });
  rec.phase = 'load';
  await boot(page, `${BASE}/?gl=force&rev=${Date.now()}`);
  rec.build = await buildOf(page);
  rec.phase = 'open';
  const counts = await openPanel(page);
  rec.glBefore = counts.before; rec.glAfter = counts.after;
  rec.glExtra = counts.after.gl - counts.before.gl;
  rec.muted = await mute(page);
  // scroll-and-wait canvas attribution, six cycles (panel is fixed; the page still moves)
  rec.trace = [];
  for (let i = 0; i < 6; i++) {
    await page.evaluate((k) => window.scrollTo(0, window.innerHeight * (1.2 + k * 0.6)), i);
    await page.waitForTimeout(700);
    rec.trace.push(await page.evaluate(() => {
      const slot = document.querySelector('[data-scene="minivic-viseme"]');
      const cs = slot ? [...slot.querySelectorAll('canvas')] : [];
      let gl = null;
      if (cs[0]) { try { gl = cs[0].getContext('webgl2') ? 'webgl2-live' : (cs[0].getContext('webgl') ? 'webgl-live' : 'no-gl'); } catch { gl = 'err'; } }
      const panel = document.querySelector('[data-testid="minivic-panel"]');
      const r = slot?.getBoundingClientRect();
      return { slotCanvases: cs.length, panelCanvases: panel ? panel.querySelectorAll('canvas').length : -1,
        totalCanvases: document.querySelectorAll('canvas').length, gl,
        store: cs[0] ? { bw: cs[0].width, bh: cs[0].height } : null,
        box: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
        glCount: window.__glCount };
    }));
  }
  shot(`panel-${vp.w}-open.png`, await page.screenshot());
  // idle baseline: 3 s of the stage with nothing streaming
  rec.idle = await sampleStage(page, 3000, 200, `panel-${vp.w}-idle`);
  // send #1 (muted) + 3 s of sampling from the keypress
  rec.phase = 'send1';
  const chatBefore = rec.chat.length;
  const sendT0 = Date.now();
  const ttftP = sendAndTime(page, QUESTION);
  const streaming = await sampleStage(page, 3000, 200, `panel-${vp.w}-streaming`);
  rec.streaming = streaming;
  rec.ttft1 = await ttftP;
  rec.chatOnSend1 = rec.chat.slice(chatBefore);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="minivic-loading"]').length === 0, null, { timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(500);
  rec.replyLen = await page.evaluate(() => { const b = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]'); return b.length ? (b[b.length - 1].textContent || '').trim().length : 0; });
  rec.sendWall1 = Date.now() - sendT0;
  // two more sends for the P50 (1440 only)
  rec.ttfts = [rec.ttft1];
  rec.chatPerSend = [rec.chatOnSend1.length];
  if (vp.w === 1440) {
    for (let k = 0; k < 2; k++) {
      rec.phase = `send${k + 2}`;
      const before = rec.chat.length;
      const t = await sendAndTime(page, QUESTION);
      rec.ttfts.push(t);
      await page.waitForFunction(() => document.querySelectorAll('[data-testid="minivic-loading"]').length === 0, null, { timeout: 40000 }).catch(() => {});
      await page.waitForTimeout(400);
      rec.chatPerSend.push(rec.chat.slice(before).length);
    }
  }
  // isolated field measure of the stage (R2 parity)
  rec.field = await fieldMeasure(page, 'minivic-viseme', '[data-testid="minivic-panel"]', 1600, `panel-${vp.w}-field`);
  rec.csp = await page.evaluate(() => window.__csp);
  R.panel[vp.w] = rec;
  console.log(`panel ${vp.w}: build=${rec.build} glExtra=${rec.glExtra} slotCanvas=${rec.trace.map((t) => t.slotCanvases).join('>')} idleMotion=${rec.idle.meanMotion} streamMotion=${rec.streaming.meanMotion} ttfts=${rec.ttfts} chat/send=${rec.chatPerSend} err=${rec.pageerrors.length} csp=${rec.csp.length}`);
  await ctx.close();
}
}

// ---------- PHASE B: reduced motion, 1440 ----------
if (PHASE === 'all' || PHASE === 'reduced') {
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  await ctx.addInitScript(CTX_COUNTER);
  const page = await ctx.newPage();
  const rec = { pageerrors: [] };
  page.on('pageerror', (e) => rec.pageerrors.push(String(e).slice(0, 200)));
  await boot(page, `${BASE}/?gl=force&rev=${Date.now()}`);
  rec.build = await buildOf(page);
  const counts = await openPanel(page);
  rec.glExtra = counts.after.gl - counts.before.gl;
  rec.muted = await mute(page);
  rec.slotCanvases = await page.locator('[data-scene="minivic-viseme"] canvas').count();
  rec.panelCanvases = await page.locator('[data-testid="minivic-panel"] canvas').count();
  rec.mouthCanvas = await page.evaluate(() => {
    const cs = [...document.querySelectorAll('[data-testid="minivic-panel"] canvas')].filter((c) => c.width === 200 && c.height === 100);
    return cs.length ? { w: cs[0].width, h: cs[0].height, present: true } : { present: false };
  });
  shot('reduced-1440-panel.png', await page.screenshot());
  // sample the 2D mouth canvas pixels over 1 s during a reply
  await page.evaluate(() => {
    window.__mouth = [];
    const c = [...document.querySelectorAll('[data-testid="minivic-panel"] canvas')].find((x) => x.width === 200 && x.height === 100);
    if (!c) return;
    const g = c.getContext('2d');
    window.__mouthTimer = setInterval(() => {
      try {
        const d = g.getImageData(0, 0, c.width, c.height).data;
        let sum = 0, nz = 0;
        for (let i = 0; i < d.length; i += 4) { const v = d[i] + d[i + 1] + d[i + 2]; sum += v; if (d[i + 3] > 8 && v > 12) nz++; }
        window.__mouth.push({ t: Math.round(performance.now()), sum, nz });
      } catch (e) { window.__mouth.push({ err: String(e).slice(0, 80) }); }
    }, 100);
  });
  const ttft = await sendAndTime(page, QUESTION);
  await page.waitForTimeout(1400);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="minivic-loading"]').length === 0, null, { timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => { clearInterval(window.__mouthTimer); return window.__mouth; });
  const sums = m.filter((x) => typeof x.sum === 'number').map((x) => x.sum);
  const uniq = new Set(sums).size;
  rec.ttft = ttft;
  rec.mouthSamples = m.length; rec.mouthUniqueSums = uniq;
  rec.mouthMin = sums.length ? Math.min(...sums) : null; rec.mouthMax = sums.length ? Math.max(...sums) : null;
  rec.mouthNzRange = m.filter((x) => typeof x.nz === 'number').map((x) => x.nz);
  rec.mouthSeries = m.slice(0, 60);
  rec.slotCanvasesAfterSend = await page.locator('[data-scene="minivic-viseme"] canvas').count();
  rec.replyLen = await page.evaluate(() => { const b = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]'); return b.length ? (b[b.length - 1].textContent || '').trim().length : 0; });
  rec.csp = await page.evaluate(() => window.__csp);
  shot('reduced-1440-after-reply.png', await page.screenshot());
  R.reduced = rec;
  console.log(`reduced: slotCanvases=${rec.slotCanvases}/${rec.slotCanvasesAfterSend} panelCanvases=${rec.panelCanvases} mouthUnique=${rec.mouthUniqueSums}/${rec.mouthSamples} reply=${rec.replyLen} err=${rec.pageerrors.length}`);
  await ctx.close();
}
}
await browser.close();

// ---------- PHASE C: no-GL panel (separate browser, no swiftshader) ----------
if (PHASE === 'all' || PHASE === 'nogl') {
const plain = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: NOGL_ARGS });
{
  const ctx = await plain.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(CTX_COUNTER);
  const page = await ctx.newPage();
  const rec = { pageerrors: [] };
  page.on('pageerror', (e) => rec.pageerrors.push(String(e).slice(0, 200)));
  await boot(page, `${BASE}/?rev=${Date.now()}`);
  rec.build = await buildOf(page);
  const counts = await openPanel(page);
  rec.glExtra = counts.after.gl - counts.before.gl;
  rec.slotCanvases = await page.locator('[data-scene="minivic-viseme"] canvas').count();
  rec.slotPresent = await page.locator('[data-scene="minivic-viseme"]').count();
  rec.panelParts = await page.evaluate(() => {
    const p = document.querySelector('[data-testid="minivic-panel"]');
    if (!p) return null;
    const q = (s) => Boolean(p.querySelector(s));
    const text = (p.textContent || '').replace(/\s+/g, ' ').trim();
    return { input: q('[data-testid="minivic-input"]'), synthetic: q('[data-testid="minivic-synthetic-label"]'),
      modes: p.querySelectorAll('[data-testid^="minivic-mode-"]').length, buttons: p.querySelectorAll('button').length,
      textLen: text.length, head: text.slice(0, 160), rect: (() => { const r = p.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })() };
  });
  rec.muted = await mute(page);
  rec.ttft = await sendAndTime(page, QUESTION);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="minivic-loading"]').length === 0, null, { timeout: 40000 }).catch(() => {});
  await page.waitForTimeout(600);
  rec.replyLen = await page.evaluate(() => { const b = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]'); return b.length ? (b[b.length - 1].textContent || '').trim().length : 0; });
  rec.aa = await page.evaluate(AA_WALK, ['minivic-panel-aa-noop']);
  shot('nogl-1440-panel.png', await page.screenshot());
  rec.csp = await page.evaluate(() => window.__csp);
  R.nogl = rec;
  console.log(`nogl: slotPresent=${rec.slotPresent} slotCanvases=${rec.slotCanvases} panelTextLen=${rec.panelParts?.textLen} reply=${rec.replyLen} err=${rec.pageerrors.length}`);
  await ctx.close();
}
await plain.close();
}

fs.writeFileSync(path.join(OUT, `probe-s7${PHASE === 'all' ? '' : '-' + PHASE}.json`), JSON.stringify(R, null, 2));
console.log('done', PHASE);
