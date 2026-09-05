/**
 * G-REV 577d45af — independent adversarial re-probe of the flagship-C correction.
 *
 * Method parity with the sibling reviewers' probe.mjs / probe2.mjs: system Chrome,
 * SwiftShader launch args copied verbatim from tests/overhaul/flagship-visibility.spec.ts
 * GL_ARGS, one browser context at a time, every number captured fresh on the LIVE build.
 *
 * Nothing here reuses an implementer number. The two luminance metrics are computed
 * side by side on purpose:
 *   - "repo" reproduces flagship-visibility.spec.ts exactly (scene isolated, coverage
 *     measured at ground+0.06) so the implementer's claim can be reproduced or refuted;
 *   - "composited" measures what a visitor actually receives — the stage as it paints,
 *     with the text plates cut out of the histogram — which is the question F1 asks.
 */
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import { PNG } from '/root/forgotten-mistory/node_modules/pngjs/lib/png.js';
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/root/forgotten-mistory/.claude/worktrees/wf_10845259-86d-1/docs/delivery/evidence/v10-20260905T0515Z/G-REV/577d45af/captures';
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'https://forgotten-mistory.web.app';
const GL_ARGS = ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const LAUNCH = { executablePath: '/usr/bin/google-chrome', args: GL_ARGS };
const results = {};

/* ---------- luminance ---------- */
const chan = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const relLum = (r, g, b) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
function decodeLuma(buf) {
  const png = PNG.sync.read(buf);
  const values = new Float64Array(png.width * png.height);
  for (let i = 0; i < values.length; i += 1) { const o = i * 4; values[i] = relLum(png.data[o], png.data[o + 1], png.data[o + 2]); }
  return { values, width: png.width, height: png.height };
}
/** coverage / peak / motion over a mask (mask=null → whole field) */
function stats(field, ground, mask) {
  let n = 0, hitRepo = 0, hitAbs = 0, max = 0, sum = 0;
  for (let i = 0; i < field.values.length; i += 1) {
    if (mask && !mask[i]) continue;
    const v = field.values[i];
    n += 1; sum += v;
    if (v >= ground + 0.06) hitRepo += 1;
    if (v >= 0.12) hitAbs += 1;
    if (v > max) max = v;
  }
  return { pixels: n, coverageRepo: n ? hitRepo / n : 0, coverageAbs012: n ? hitAbs / n : 0, peak: max, mean: n ? sum / n : 0 };
}
function meanDelta(a, b, mask) {
  const n = Math.min(a.values.length, b.values.length);
  let s = 0, c = 0;
  for (let i = 0; i < n; i += 1) { if (mask && !mask[i]) continue; s += Math.abs(a.values[i] - b.values[i]); c += 1; }
  return c ? s / c : 0;
}

/* ---------- page-side helpers ---------- */
async function settle(page) {
  // Preloader: click its own Skip control (tests/helpers/boot.ts rationale) then wait for page-ready.
  for (const sel of ['button:has-text("Skip")', '[class*="skip" i]', '.preloader button']) {
    try { const el = await page.$(sel); if (el && await el.isVisible()) { await el.click({ timeout: 2000 }); break; } } catch { /* absence recorded by page-ready wait */ }
  }
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 25000 }).catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 20000 });
}
const groundLumIn = (id) => {
  let node = document.getElementById(id);
  while (node) {
    const m = getComputedStyle(node).backgroundColor.match(/rgba?\(([^)]+)\)/);
    if (m) { const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); const a = p.length > 3 ? p[3] : 1; if (a > 0.5) return [p[0], p[1], p[2]]; }
    node = node.parentElement;
  }
  const bm = getComputedStyle(document.body).backgroundColor.match(/rgba?\(([^)]+)\)/);
  return bm ? bm[1].split(/[,\s/]+/).filter(Boolean).map(Number).slice(0, 3) : [0, 0, 0];
};
const ISOLATE = (scene) => {
  const s = document.createElement('style');
  s.id = 'rev-isolate';
  s.textContent = `body *{visibility:hidden!important}[data-scene="${scene}"],[data-scene="${scene}"] *{visibility:visible!important}`;
  document.head.appendChild(s);
};
const UNISOLATE = () => document.getElementById('rev-isolate')?.remove();

/* text-plate rects inside #hero: any element with a painted background alpha>0.15,
   plus every text-bearing leaf's own box (belt and braces). */
const PLATE_RECTS = () => {
  const hero = document.getElementById('hero');
  if (!hero) return [];
  const out = [];
  for (const el of hero.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
    const a = m ? (m[1].split(/[,\s/]+/).filter(Boolean).map(Number)[3] ?? 1) : 0;
    const hasBg = a > 0.15;
    const isTextLeaf = el.children.length === 0 && (el.innerText || '').trim().length > 1;
    if (!hasBg && !isTextLeaf) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    out.push({ x: r.left, y: r.top, w: r.width, h: r.height, why: hasBg ? 'plate' : 'text' });
  }
  return out;
};

/* ---------- AA walk (algorithm parity with tests/a11y/text-contrast.spec.ts) ---------- */
const COLLECT = () => {
  const out = [];
  const cssPath = (el) => {
    const parts = []; let node = el;
    while (node && node !== document.body && parts.length < 6) {
      let part = node.tagName.toLowerCase();
      if (node.id) { part += `#${node.id}`; parts.unshift(part); break; }
      const cls = Array.from(node.classList).slice(0, 2).join('.');
      if (cls) part += `.${cls}`;
      parts.unshift(part); node = node.parentElement;
    }
    return parts.join(' > ');
  };
  const effOpacity = (el) => { let o = 1, n = el; while (n && n !== document.documentElement) { o *= parseFloat(getComputedStyle(n).opacity) || 0; n = n.parentElement; } return o; };
  const vw = innerWidth, vh = innerHeight;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let tn;
  while ((tn = walker.nextNode())) {
    const text = (tn.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length < 2) continue;
    const el = tn.parentElement; if (!el) continue;
    if (el.closest('script,style,noscript,template,[hidden],[aria-hidden="true"]')) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility !== 'visible' || cs.display === 'none') continue;
    if (!el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true })) continue;
    const opacity = effOpacity(el); if (opacity < 0.05) continue;
    const box = el.getBoundingClientRect(); if (box.width <= 1 || box.height <= 1) continue;
    const range = document.createRange(); range.selectNodeContents(tn);
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1);
    if (!rects.length) continue;
    const points = [];
    for (const r of rects.slice(0, 3)) {
      const y = r.top + r.height / 2;
      for (const f of [0.15, 0.5, 0.85]) { const x = r.left + r.width * f; if (x >= 0 && x < vw && y >= 0 && y < vh) points.push([Math.round(x), Math.round(y)]); }
    }
    if (!points.length) continue;
    const secEl = el.closest('section[id]');
    out.push({ path: cssPath(el), text: text.slice(0, 48), color: cs.color, opacity, fontSize: parseFloat(cs.fontSize), fontWeight: parseInt(cs.fontWeight, 10) || 400, points, section: secEl ? secEl.id : 'chrome' });
  }
  return out;
};
const MASK = (on) => {
  document.getElementById('rev-glyph-mask')?.remove();
  if (!on) return;
  const s = document.createElement('style'); s.id = 'rev-glyph-mask';
  s.textContent = '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important;transition:none!important}';
  document.head.appendChild(s);
};
function parseColor(v) { const m = /rgba?\(([^)]+)\)/.exec(v || ''); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
const composite = (fg, a, bg) => [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a)));
function contrast(a, b) { const la = relLum(a[0], a[1], a[2]), lb = relLum(b[0], b[1], b[2]); const hi = Math.max(la, lb), lo = Math.min(la, lb); return (hi + 0.05) / (lo + 0.05); }
function samplePng(buf, points, dpr = 1) {
  const png = PNG.sync.read(buf);
  return points.map(([x, y]) => {
    const px = Math.min(png.width - 1, Math.max(0, Math.round(x * dpr)));
    const py = Math.min(png.height - 1, Math.max(0, Math.round(y * dpr)));
    const o = (py * png.width + px) * 4;
    return [png.data[o], png.data[o + 1], png.data[o + 2]];
  });
}

async function aaWalk(page, label, sections) {
  const total = await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    scrollTo(0, 0); return h;
  });
  await page.waitForTimeout(2500);
  const vh = page.viewportSize().height;
  const failures = [], all = [], seen = new Set();
  for (let top = 0; top < total; top += vh) {
    await page.evaluate((y) => scrollTo(0, y), top);
    await page.waitForTimeout(900);
    const nodes = (await page.evaluate(COLLECT)).filter((n) => sections.includes(n.section));
    const fresh = nodes.filter((n) => !seen.has(`${n.path}|${n.text}`));
    if (!fresh.length) continue;
    await page.evaluate(MASK, true);
    const png = await page.screenshot({ fullPage: false, animations: 'disabled' });
    await page.evaluate(MASK, false);
    const pts = fresh.flatMap((n) => n.points);
    const pix = samplePng(png, pts);
    let cur = 0;
    for (const node of fresh) {
      seen.add(`${node.path}|${node.text}`);
      const fg = parseColor(node.color);
      const samples = pix.slice(cur, cur + node.points.length); cur += node.points.length;
      if (!fg) continue;
      let worst = Infinity, wbg = [0, 0, 0], wfg = fg.slice(0, 3);
      for (const bg of samples) { const painted = composite(fg, fg[3] * node.opacity, bg); const r = contrast(painted, bg); if (r < worst) { worst = r; wbg = bg; wfg = painted; } }
      const large = node.fontSize >= 24 || (node.fontSize >= 18.66 && node.fontWeight >= 700);
      const need = large ? 3 : 4.5;
      const rec = { selector: node.path, text: node.text, section: node.section, fg: `rgb(${wfg.join(',')})`, bg: `rgb(${wbg.join(',')})`, fontSize: node.fontSize, fontWeight: node.fontWeight, large, need, ratio: Math.round(worst * 100) / 100 };
      all.push(rec);
      if (worst < need) failures.push(rec);
    }
  }
  await page.evaluate(() => scrollTo(0, 0));
  all.sort((a, b) => a.ratio - b.ratio);
  failures.sort((a, b) => a.ratio - b.ratio);
  const below45 = all.filter((r) => r.ratio < 4.5);
  results[label] = { ...(results[label] || {}), aa: { nodes: all.length, failuresAA: failures.length, failures: failures.slice(0, 15), worstTen: all.slice(0, 10), below4_5Count: below45.length, below4_5: below45.slice(0, 12) } };
  console.log(`[${label}] AA nodes=${all.length} failAA=${failures.length} below4.5=${below45.length} worst=${all[0] ? all[0].ratio : 'n/a'}`);
}

function wire(page, bag) {
  bag.pageerrors = []; bag.failed = []; bag.consoleErr = [];
  page.on('pageerror', (e) => bag.pageerrors.push(String(e).slice(0, 400)));
  page.on('requestfailed', (r) => bag.failed.push({ url: r.url(), err: r.failure()?.errorText }));
  page.on('console', (m) => { if (m.type() === 'error') bag.consoleErr.push(m.text().slice(0, 300)); });
}

/* ---------- hero stage measurement ---------- */
async function heroStage(page, label, tag) {
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForSelector('canvas[data-scene="hero-atmosphere"], [data-scene="hero-atmosphere"] canvas', { timeout: 25000 }).catch(() => {});
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    /* inlined: page-side helpers cannot close over module scope */
    const groundLumIn = (id) => {
      let node = document.getElementById(id);
      while (node) {
        const m = getComputedStyle(node).backgroundColor.match(/rgba?\(([^)]+)\)/);
        if (m) { const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); const a = p.length > 3 ? p[3] : 1; if (a > 0.5) return [p[0], p[1], p[2]]; }
        node = node.parentElement;
      }
      const bm = getComputedStyle(document.body).backgroundColor.match(/rgba?\(([^)]+)\)/);
      return bm ? bm[1].split(/[,\s/]+/).filter(Boolean).map(Number).slice(0, 3) : [0, 0, 0];
    };
    const PLATE_RECTS = () => {
      const hero = document.getElementById('hero');
      if (!hero) return [];
      const out = [];
      for (const el of hero.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        const m = cs.backgroundColor.match(/rgba?\(([^)]+)\)/);
        const parts = m ? m[1].split(/[,\s/]+/).filter(Boolean).map(Number) : null;
        const a = parts ? (parts.length > 3 ? parts[3] : 1) : 0;
        const hasBg = a > 0.15;
        const isTextLeaf = el.children.length === 0 && (el.innerText || '').trim().length > 1;
        if (!hasBg && !isTextLeaf) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        out.push({ x: r.left, y: r.top, w: r.width, h: r.height, why: hasBg ? 'plate' : 'text', bg: cs.backgroundColor, cls: el.className.toString().slice(0, 40) });
      }
      return out;
    };
    const slot = document.querySelector('[data-scene="hero-atmosphere"]');
    const canvas = slot ? slot.querySelector('canvas') : null;
    const hero0 = document.getElementById('hero');
    const stage = hero0 ? ([...hero0.querySelectorAll('*')].find((e) => /stage/i.test(e.className.toString())) || null) : null;
    const r = slot ? slot.getBoundingClientRect() : null;
    let after = null;
    if (stage) { const cs = getComputedStyle(stage, '::after'); after = { content: cs.content, backgroundImage: cs.backgroundImage.slice(0, 700), backgroundColor: cs.backgroundColor, display: cs.display, opacity: cs.opacity, height: cs.height, width: cs.width }; }
    return {
      slotFound: !!slot, canvasFound: !!canvas,
      slotRect: r ? { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) } : null,
      canvasSize: canvas ? { w: canvas.width, h: canvas.height } : null,
      stageClass: stage ? stage.className.toString().slice(0, 120) : null,
      stageAfter: after,
      ground: groundLumIn('hero'),
      plates: PLATE_RECTS(),
      heroMedia: (() => { const hero = document.getElementById('hero'); if (!hero) return []; return [...hero.querySelectorAll('canvas,img,video')].map((m) => { const b = m.getBoundingClientRect(); return { tag: m.tagName, w: Math.round(b.width), h: Math.round(b.height), area: Math.round(b.width * b.height), cov: +(b.width * b.height / (innerWidth * innerHeight)).toFixed(4), src: (m.currentSrc || m.getAttribute('src') || '').split('/').pop() }; }).sort((a, b) => b.area - a.area); })(),
    };
  });
  const groundL = relLum(info.ground[0], info.ground[1], info.ground[2]);
  const clip = info.slotRect && info.slotRect.w > 2 && info.slotRect.h > 2
    ? { x: Math.max(0, info.slotRect.x), y: Math.max(0, info.slotRect.y), width: Math.min(info.slotRect.w, page.viewportSize().width), height: Math.min(info.slotRect.h, page.viewportSize().height - Math.max(0, info.slotRect.y)) }
    : null;

  /* (a) composited — what the visitor sees, plates cut out of the histogram */
  const c1 = await page.screenshot({ clip, animations: 'disabled' });
  await page.waitForTimeout(1000);
  const c2 = await page.screenshot({ clip, animations: 'disabled' });
  fs.writeFileSync(path.join(OUT, `${tag}-hero-composited.png`), c1);
  const f1 = decodeLuma(c1), f2 = decodeLuma(c2);
  const mask = new Uint8Array(f1.values.length).fill(1);
  if (clip) {
    for (const p of info.plates) {
      const x0 = Math.max(0, Math.floor(p.x - clip.x)), x1 = Math.min(f1.width, Math.ceil(p.x - clip.x + p.w));
      const y0 = Math.max(0, Math.floor(p.y - clip.y)), y1 = Math.min(f1.height, Math.ceil(p.y - clip.y + p.h));
      for (let y = y0; y < y1; y += 1) for (let x = x0; x < x1; x += 1) mask[y * f1.width + x] = 0;
    }
  }
  const composited = { ...stats(f1, groundL, mask), motion: meanDelta(f1, f2, mask), maskedOutPct: +(1 - mask.reduce((a, b) => a + b, 0) / mask.length).toFixed(4) };
  const compositedNoMask = { ...stats(f1, groundL, null), motion: meanDelta(f1, f2, null) };

  /* (b) repo method — scene isolated, exactly as flagship-visibility.spec.ts measures it */
  await page.evaluate(ISOLATE, 'hero-atmosphere');
  await page.waitForTimeout(400);
  const i1 = await page.screenshot({ clip, animations: 'disabled' });
  await page.waitForTimeout(1500);
  const i2 = await page.screenshot({ clip, animations: 'disabled' });
  await page.evaluate(UNISOLATE);
  fs.writeFileSync(path.join(OUT, `${tag}-hero-isolated.png`), i1);
  const g1 = decodeLuma(i1), g2 = decodeLuma(i2);
  const isolated = { ...stats(g1, groundL, null), motion: meanDelta(g1, g2, null) };

  results[label] = { ...(results[label] || {}), heroStage: { ...info, plates: info.plates.length, plateSample: info.plates.slice(0, 6), groundLum: +groundL.toFixed(4), clip, composited, compositedNoMask, isolated } };
  console.log(`[${label}] hero isolated cov(repo)=${(isolated.coverageRepo * 100).toFixed(1)}% peak=${isolated.peak.toFixed(3)} motion=${isolated.motion.toFixed(4)} | composited cov(>0.12)=${(composited.coverageAbs012 * 100).toFixed(1)}% peak=${composited.peak.toFixed(3)} motion=${composited.motion.toFixed(4)}`);
}

/* ---------- runs ---------- */
async function run(label, { url, viewport, reducedMotion, doHero, doAA, sections, perf }) {
  const browser = await chromium.launch(LAUNCH);
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: reducedMotion ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const bag = {}; wire(page, bag);
  if (perf) {
    await page.addInitScript(() => {
      window.__lcp = null; window.__cls = 0;
      new PerformanceObserver((l) => { const e = l.getEntries(); const last = e[e.length - 1]; window.__lcp = { startTime: last.startTime, size: last.size, element: last.element ? (last.element.tagName + '.' + (last.element.className || '').toString().slice(0, 60)) : null, url: last.url || null }; }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
  }
  const t0 = Date.now();
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch((e) => ({ err: String(e) }));
  await settle(page);
  await page.waitForTimeout(2000);
  const base = await page.evaluate(() => ({
    build: document.querySelector('meta[name="build-commit"]')?.content || null,
    canvases: document.querySelectorAll('canvas').length,
    heroCanvases: document.querySelectorAll('#hero canvas').length,
    scenes: [...document.querySelectorAll('[data-scene]')].map((e) => e.dataset.scene),
    heroH1: document.querySelector('#hero h1')?.innerText?.trim().slice(0, 80) || null,
    heroH1Visible: (() => { const h = document.querySelector('#hero h1'); if (!h) return false; const r = h.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(h).visibility === 'visible'; })(),
    heroTextLeaves: (() => { const hero = document.getElementById('hero'); if (!hero) return 0; return [...hero.querySelectorAll('*')].filter((e) => e.children.length === 0 && (e.innerText || '').trim().length > 1).length; })(),
    navWordmark: (() => { const n = document.querySelector('nav'); if (!n) return null; const t = [...n.querySelectorAll('*')].filter((e) => e.children.length === 0 && (e.innerText || '').trim().length > 1).map((e) => e.innerText.trim().slice(0, 30)); return t.slice(0, 6); })(),
  }));
  results[label] = { label, url, viewport, reducedMotion: !!reducedMotion, status: resp?.status?.() ?? null, loadMs: Date.now() - t0, base };
  if (doHero) await heroStage(page, label, label);
  if (doAA) await aaWalk(page, label, sections);
  if (perf) {
    await page.waitForTimeout(3000);
    const p = await page.evaluate(() => ({ lcp: window.__lcp, cls: window.__cls, nav: (() => { const n = performance.getEntriesByType('navigation')[0]; return n ? { domContentLoaded: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), responseEnd: Math.round(n.responseEnd) } : null; })() }));
    results[label].perf = p;
    console.log(`[${label}] LCP=${p.lcp ? Math.round(p.lcp.startTime) + 'ms ' + p.lcp.element : 'null'} CLS=${p.cls}`);
  }
  await page.screenshot({ path: path.join(OUT, `${label}-fold.png`) });
  results[label].pageerrors = bag.pageerrors;
  results[label].failedRequests = bag.failed;
  results[label].consoleErrors = bag.consoleErr;
  console.log(`[${label}] build=${base.build} canvases=${base.canvases} heroCanvas=${base.heroCanvases} pageerrors=${bag.pageerrors.length} failedReq=${bag.failed.length}`);
  await ctx.close(); await browser.close();
}

const stage = process.argv[2] || 'all';
try {
  if (stage === 'a') {
    await run('390-glforce', { url: BASE + '/?gl=force', viewport: { width: 390, height: 844 }, doHero: true, doAA: true, sections: ['hero', 'about', 'experience', 'chrome'] });
  }
  if (stage === 'b') {
    await run('1440-glforce', { url: BASE + '/?gl=force', viewport: { width: 1440, height: 900 }, doHero: true, doAA: true, sections: ['hero', 'about', 'experience', 'chrome'] });
  }
  if (stage === 'c') {
    await run('1440-still', { url: BASE + '/', viewport: { width: 1440, height: 900 }, doHero: true, doAA: true, sections: ['hero', 'about', 'experience', 'chrome'] });
  }
  if (stage === 'd') {
    await run('390-still', { url: BASE + '/', viewport: { width: 390, height: 844 }, doHero: true, doAA: true, sections: ['hero', 'about', 'experience', 'chrome'] });
  }
  if (stage === 'e') {
    await run('390-reduced', { url: BASE + '/?gl=force', viewport: { width: 390, height: 844 }, reducedMotion: true, doHero: true });
    await run('1440-reduced', { url: BASE + '/?gl=force', viewport: { width: 1440, height: 900 }, reducedMotion: true, doHero: true });
  }
  if (stage === 'f') {
    await run('1280-perf', { url: BASE + '/', viewport: { width: 1280, height: 720 }, perf: true });
  }
} catch (e) {
  results.fatal = String(e).slice(0, 1000);
  console.error('FATAL', e);
}
fs.writeFileSync(path.join(OUT, `probe3-${stage}.json`), JSON.stringify(results, null, 2));
console.log('WROTE probe3-' + stage + '.json');
