// rev-56ffed3e-w1 — independent adversarial live probe (read-only, throwaway)
// Live subject only: https://forgotten-mistory.web.app/
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const OUT = path.resolve('.');
const BASE = 'https://forgotten-mistory.web.app/';
const results = { sha: null, passes: [], generatedAt: new Date().toISOString() };

const srgb = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return +((hi + 0.05) / (lo + 0.05)).toFixed(2); };
const parseRGB = (s) => { const m = String(s).match(/-?[\d.]+/g) || []; return [+m[0] || 0, +m[1] || 0, +m[2] || 0, m[3] === undefined ? 1 : +m[3]]; };

async function chromaOf(buf) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  let max = 0, gt2 = 0, gt4 = 0, sat025 = 0, sat025NonGold = 0;
  const nonGoldSamples = [];
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const c = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    if (c > max) max = c;
    if (c > 2) gt2++;
    if (c > 4) gt4++;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    const s = mx === 0 ? 0 : d / mx;
    if (s > 0.25) {
      sat025++;
      let h = 0;
      if (d !== 0) {
        if (mx === r) h = 60 * ((((g - b) / d) % 6 + 6) % 6);
        else if (mx === g) h = 60 * (((b - r) / d) + 2);
        else h = 60 * (((r - g) / d) + 4);
      }
      if (h < 0) h += 360;
      if (!(h >= 35 && h <= 60)) { sat025NonGold++; if (nonGoldSamples.length < 6) nonGoldSamples.push({ r, g, b, h: +h.toFixed(1), s: +s.toFixed(3) }); }
    }
  }
  return {
    w: info.width, h: info.height, pixels: n, maxChroma: max,
    pxChromaGT2: gt2, pxChromaGT4: gt4,
    pctChromaLE4: +(100 * (n - gt4) / n).toFixed(4),
    pctChromaLE2: +(100 * (n - gt2) / n).toFixed(4),
    pxSatGT025: sat025, pxSatGT025NonGoldHue: sat025NonGold,
    pctSatGT025: +(100 * sat025 / n).toFixed(4), nonGoldSamples,
  };
}

async function runPass(browser, { label, width, height, gl }) {
  const url = gl ? BASE + '?gl=force' : BASE;
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageerrors = [], consoleErrors = [], failedReq = [];
  page.on('pageerror', (e) => pageerrors.push(String(e && e.message ? e.message : e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', (r) => failedReq.push(`${r.url()} :: ${r.failure()?.errorText}`));

  await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
  await page.waitForTimeout(2500);

  const rec = { label, url, viewport: `${width}x${height}`, gl: !!gl };
  rec.buildCommit = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content ?? null);
  results.sha = results.sha || rec.buildCommit;

  // ---- canvases / scenes ----
  rec.canvases = await page.evaluate(() => Array.from(document.querySelectorAll('canvas')).map((c) => {
    const r = c.getBoundingClientRect();
    const sec = c.closest('[data-scene]');
    return { scene: sec?.getAttribute('data-scene') ?? null, w: Math.round(r.width), h: Math.round(r.height), section: c.closest('section')?.id ?? null };
  }));
  rec.listenCanvasPresent = rec.canvases.some((c) => c.section === 'listen' || c.scene === 'listen-field');

  // ---- engage plates ----
  rec.engage = await page.evaluate(() => Array.from(document.querySelectorAll('[data-cta=engage]')).map((a) => ({
    section: a.closest('section')?.id ?? null,
    href: a.href,               // decoded by the DOM
    label: (a.textContent || '').replace(/\s+/g, ' ').trim(),
    tag: a.tagName,
    target: a.getAttribute('target'),
  })));

  // ---- R4 CV ----
  rec.cvLinks = await page.evaluate(() => Array.from(document.querySelectorAll('a[href$=".pdf"]')).map((a) => ({
    href: a.href, label: (a.textContent || '').replace(/\s+/g, ' ').trim(), section: a.closest('section')?.id ?? null, download: a.hasAttribute('download'),
  })));

  // ---- hero portrait <picture> ----
  const pic = page.locator('[data-testid="hero-portrait"] picture').first();
  if (await pic.count()) {
    rec.portraitImg = await page.evaluate(() => {
      const img = document.querySelector('[data-testid="hero-portrait"] picture img');
      if (!img) return null;
      const cs = getComputedStyle(img);
      const r = img.getBoundingClientRect();
      return { currentSrc: img.currentSrc, naturalW: img.naturalWidth, naturalH: img.naturalHeight, box: { w: Math.round(r.width), h: Math.round(r.height) }, filter: cs.filter, mixBlendMode: cs.mixBlendMode, opacity: cs.opacity };
    });
    try {
      const buf = await pic.screenshot({ timeout: 20000 });
      fs.writeFileSync(path.join(OUT, `portrait-${label}.png`), buf);
      rec.portraitChroma = await chromaOf(buf);
    } catch (e) { rec.portraitChromaError = String(e.message); }
  }

  // ---- hero video element ----
  rec.heroVideo = await page.evaluate(() => {
    const v = document.querySelector('[data-testid="hero-portrait"] video') || document.querySelector('video');
    if (!v) return null;
    const cs = getComputedStyle(v);
    return { currentSrc: v.currentSrc, src: v.getAttribute('src'), sources: Array.from(v.querySelectorAll('source')).map((s) => s.src || s.getAttribute('src')), preload: v.preload, readyState: v.readyState, videoWidth: v.videoWidth, videoHeight: v.videoHeight, paused: v.paused, filter: cs.filter, display: cs.display, opacity: cs.opacity };
  });

  // ---- hero fold screenshot + chroma ----
  const heroBuf = await page.screenshot({ clip: { x: 0, y: 0, width, height } });
  fs.writeFileSync(path.join(OUT, `hero-${label}.png`), heroBuf);
  rec.heroFoldChroma = await chromaOf(heroBuf);

  // ---- MiniVic dock: before + after scroll ----
  const dockState = async () => page.evaluate(() => {
    const dock = document.querySelector('.minivic-dock');
    const btn = document.querySelector('[data-testid="minivic-toggle"]');
    const pill = document.querySelector('[data-testid="minivic-launcher-label"]');
    if (!dock || !btn) return null;
    const dcs = getComputedStyle(dock), bcs = getComputedStyle(btn);
    const br = btn.getBoundingClientRect();
    const p = pill ? { text: pill.textContent.trim(), display: getComputedStyle(pill).display, visibility: getComputedStyle(pill).visibility, w: Math.round(pill.getBoundingClientRect().width), h: Math.round(pill.getBoundingClientRect().height) } : null;
    const centre = document.elementFromPoint(Math.min(window.innerWidth - 2, br.x + br.width / 2), Math.min(window.innerHeight - 2, br.y + br.height / 2));
    return {
      dockOpacity: dcs.opacity, dockPointerEvents: dcs.pointerEvents, dockDisplay: dcs.display, dockZ: dcs.zIndex,
      btnDisplay: bcs.display, btnVisibility: bcs.visibility, btnRect: { x: Math.round(br.x), y: Math.round(br.y), w: Math.round(br.width), h: Math.round(br.height) },
      inViewport: br.top >= 0 && br.left >= 0 && br.bottom <= window.innerHeight + 1 && br.right <= window.innerWidth + 1,
      pill: p, ariaLabel: btn.getAttribute('aria-label'),
      hitTestIsSelfOrChild: centre ? (centre === btn || btn.contains(centre)) : false,
    };
  });
  rec.minivicFirstFold = await dockState();
  await page.evaluate(() => { const h = document.querySelector('#hero'); window.scrollTo(0, (h ? h.getBoundingClientRect().height : window.innerHeight) + 200); });
  await page.waitForTimeout(1200);
  rec.minivicAfterScroll = await dockState();
  try {
    const btn = page.locator('[data-testid="minivic-toggle"]');
    fs.writeFileSync(path.join(OUT, `minivic-${label}.png`), await btn.screenshot({ timeout: 15000 }));
  } catch (e) { rec.minivicShotError = String(e.message); }

  // ---- vitrine ----
  await page.evaluate(() => document.querySelector('#vitrine')?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1500);
  fs.writeFileSync(path.join(OUT, `vitrine-${label}.png`), await page.screenshot({ clip: { x: 0, y: 0, width, height } }));
  rec.vitrineRestPlates = await page.evaluate(() => {
    const bgOf = (el) => { let n = el; while (n && n !== document.documentElement) { const c = getComputedStyle(n).backgroundColor; const m = c.match(/-?[\d.]+/g); if (m && (m[3] === undefined || +m[3] > 0.6)) return c; n = n.parentElement; } return getComputedStyle(document.body).backgroundColor; };
    const sec = document.querySelector('#vitrine'); if (!sec) return [];
    const nodes = Array.from(sec.querySelectorAll('h3, h4, p, a, li, span, dt, dd')).filter((e) => {
      const r = e.getBoundingClientRect(); const t = (e.textContent || '').trim();
      return t.length > 2 && r.width > 8 && r.height > 6 && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0.05 && e.children.length === 0;
    });
    return nodes.slice(0, 60).map((e) => ({ tag: e.tagName, cls: (e.className || '').toString().slice(0, 40), text: (e.textContent || '').trim().slice(0, 44), color: getComputedStyle(e).color, bg: bgOf(e), fontSize: getComputedStyle(e).fontSize, fontWeight: getComputedStyle(e).fontWeight, opacity: getComputedStyle(e).opacity }));
  });
  rec.vitrineRestPlates = rec.vitrineRestPlates.map((p) => ({ ...p, contrast: ratio(parseRGB(p.color), parseRGB(p.bg)) }));
  rec.vitrineMinContrast = rec.vitrineRestPlates.length ? Math.min(...rec.vitrineRestPlates.map((p) => p.contrast)) : null;

  // ---- listen ----
  await page.evaluate(() => document.querySelector('#listen')?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1500);
  fs.writeFileSync(path.join(OUT, `listen-${label}.png`), await page.screenshot({ clip: { x: 0, y: 0, width, height } }));
  rec.listenCanvasesAtView = await page.evaluate(() => Array.from(document.querySelectorAll('#listen canvas')).map((c) => { const r = c.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), scene: c.closest('[data-scene]')?.getAttribute('data-scene') ?? null }; }));

  rec.pageerrors = pageerrors;
  rec.consoleErrors = consoleErrors;
  rec.failedRequests = failedReq;
  results.passes.push(rec);
  await ctx.close();
}

const browser = await chromium.launch({
  headless: true,
  executablePath: '/usr/bin/google-chrome-stable',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
try {
  for (const p of [
    { label: '1440-normal', width: 1440, height: 900, gl: false },
    { label: '1440-glforce', width: 1440, height: 900, gl: true },
    { label: '390-normal', width: 390, height: 844, gl: false },
    { label: '390-glforce', width: 390, height: 844, gl: true },
  ]) { await runPass(browser, p); console.error('done', p.label); }
} finally { await browser.close(); }
fs.writeFileSync(path.join(OUT, 'probe-results.json'), JSON.stringify(results, null, 2));
console.log('WROTE probe-results.json');
