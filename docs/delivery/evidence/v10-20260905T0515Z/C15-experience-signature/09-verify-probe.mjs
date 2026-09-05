/**
 * Cycle 15 — independent adversarial re-probe (reviewer, not the author).
 *
 * Re-measures every claim in the author's 03-probe.json from a fresh browser,
 * plus the two acceptance lines the author's spec file does not cover:
 *   • the R-c13 MOT-C13-02 comment's `document.getAnimations()` contract, and
 *   • the bars' transform sampled at 100 ms and 1500 ms after the chart lands.
 *
 * Usage: node 09-verify-probe.mjs   (server must already serve out/ on :5601)
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.PROBE_BASE_URL || 'http://127.0.0.1:5601';
const GOLD = 'rgb(201, 168, 76)';

const GL_ARGS = [
  '--no-sandbox',
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

const scaleXReader = `(el) => {
  const v = getComputedStyle(el).transform;
  if (!v || v === 'none') return 1;
  const m = v.match(/matrix\\(([^)]+)\\)/);
  return m ? parseFloat(m[1].split(',')[0]) : 1;
}`;

async function ready(page) {
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/** Arms an in-page sampler, scrolls the chart in, returns what it recorded. */
async function sampleEntry(page) {
  await page.evaluate((src) => {
    const scaleX = eval(src);
    const field = document.querySelector('#experience [data-track-field]');
    const bars = () => Array.from(document.querySelectorAll('#experience [class*="trackBar"]'));
    const store = (r) => { window.__revBeat = r; };
    if (!field) { store({ error: 'no track field' }); return; }
    const start = () => {
      const t0 = performance.now();
      let at100 = null;
      let at1500 = null;
      let settledAt = null;
      let minObserved = Infinity;
      let frames = 0;
      // The animation contract from the R-c13 MOT-C13-02 comment, sampled the
      // instant the section commits — getAnimations() is empty once finished.
      const anims = document.getAnimations().filter((a) => {
        const t = a.effect && a.effect.target;
        const el = t && (t.element || t);
        return el && el.nodeType === 1 && document.querySelector('#experience').contains(el);
      }).map((a) => ({
        type: a.constructor.name,
        prop: a.transitionProperty || a.animationName || null,
        duration: a.effect.getTiming().duration,
        easing: a.effect.getTiming().easing,
        kfEasing: (a.effect.getKeyframes()[0] || {}).easing || null,
        delay: a.effect.getTiming().delay,
      }));
      const tick = () => {
        frames += 1;
        const elapsed = performance.now() - t0;
        const cur = bars();
        for (const b of cur) minObserved = Math.min(minObserved, scaleX(b));
        if (at100 === null && elapsed >= 100 && cur.length) {
          at100 = { elapsed: Math.round(elapsed), scales: cur.map(scaleX) };
        }
        if (at1500 === null && elapsed >= 1500 && cur.length) {
          at1500 = {
            elapsed: Math.round(elapsed),
            scales: cur.map(scaleX),
            transforms: cur.map((b) => getComputedStyle(b).transform),
          };
        }
        if (settledAt === null && cur.length && cur.every((b) => scaleX(b) >= 0.999)) {
          settledAt = Math.round(elapsed);
        }
        if (elapsed >= 1700) {
          store({ rows: cur.length, at100, at1500, settledAt, minObserved, frames, anims });
          return;
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (field.hasAttribute('data-entered')) { start(); return; }
    const mo = new MutationObserver(() => {
      if (field.hasAttribute('data-entered')) { mo.disconnect(); start(); }
    });
    mo.observe(field, { attributes: true, attributeFilter: ['data-entered'] });
  }, scaleXReader);

  await page.locator('#experience [data-chart]').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => Boolean(window.__revBeat), null, { timeout: 20000 });
  return page.evaluate(() => window.__revBeat);
}

async function sectionFacts(page, gold) {
  return page.evaluate((goldRgb) => {
    const section = document.querySelector('#experience');
    const props = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor',
      'borderBottomColor', 'borderLeftColor', 'outlineColor', 'stroke', 'fill'];
    const goldHits = [];
    for (const el of Array.from(section.querySelectorAll('*')).concat(section)) {
      for (const pseudo of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pseudo || undefined);
        for (const p of props) {
          if (String(cs[p] || '').includes(goldRgb)) {
            goldHits.push(`${el.tagName}.${el.className}${pseudo || ''} ${p}`);
          }
        }
      }
    }
    const canvases = Array.from(section.querySelectorAll('canvas')).map((c) => ({
      w: c.clientWidth, h: c.clientHeight,
    }));
    const ph = section.querySelector('[data-playhead]');
    const phCS = ph ? getComputedStyle(ph) : null;
    const chart = section.querySelector('[data-chart]');
    const chartRect = chart ? chart.getBoundingClientRect() : null;
    const years = Array.from(section.querySelectorAll('[class*="trackYears"]')).map((el) => {
      const r = el.getBoundingClientRect();
      return { right: Math.round(r.right), width: Math.round(r.width), display: getComputedStyle(el).display };
    });
    const barFill = Array.from(section.querySelectorAll('[class*="trackBar"]')).map((b) => {
      const cs = getComputedStyle(b, '::before');
      return { bg: cs.backgroundColor, opacity: cs.opacity };
    });
    return {
      goldHits,
      canvases,
      playhead: ph ? { color: phCS.color, right: Math.round(ph.getBoundingClientRect().right) } : null,
      chartRight: chartRect ? Math.round(chartRect.right) : null,
      years,
      barFill,
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    };
  }, gold);
}

const report = { base: BASE, generatedAt: new Date().toISOString(), viewports: {} };

// System Chrome: this host carries no Playwright-bundled chromium build.
const browser = await chromium.launch({ channel: 'chrome', args: GL_ARGS });

for (const width of [1440, 390]) {
  const ctx = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
  const page = await ctx.newPage();
  const consoleErrors = [];
  const pageErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
  await ready(page);

  const beat = await sampleEntry(page);
  await page.waitForTimeout(1500);
  const facts = await sectionFacts(page, GOLD);
  const renderer = await page.evaluate(() => {
    const c = document.createElement('canvas');
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    if (!gl) return null;
    const d = gl.getExtension('WEBGL_debug_renderer_info');
    return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'unknown';
  });

  report.viewports[width] = { beat, facts, renderer, consoleErrors, pageErrors };
  await ctx.close();
}

// Label containment across five widths, in one context.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await ready(page);
  report.containment = {};
  for (const width of [390, 834, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await page.locator('#experience').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const f = await sectionFacts(page, GOLD);
    report.containment[width] = {
      chartRight: f.chartRight,
      years: f.years,
      offenders: f.years.filter((y) => y.width > 0 && y.right > f.chartRight - 16).map((y) => y.right),
      scrollWidth: f.scrollWidth,
      innerWidth: f.innerWidth,
    };
  }
  await ctx.close();
}

// Reduced motion.
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
  await ready(page);
  const watcher = page.evaluate((src) => new Promise((resolve) => {
    const scaleX = eval(src);
    let min = Infinity;
    const t0 = performance.now();
    const tick = () => {
      for (const b of Array.from(document.querySelectorAll('#experience [class*="trackBar"]'))) {
        min = Math.min(min, scaleX(b));
      }
      if (performance.now() - t0 >= 2400) { resolve(min); return; }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }), scaleXReader);
  await page.locator('#experience').scrollIntoViewIfNeeded();
  const minScaleX = await watcher;
  const rm = await page.evaluate(() => {
    const section = document.querySelector('#experience');
    const running = document.getAnimations().filter((a) => a.playState === 'running');
    const inSection = running.filter((a) => {
      const t = a.effect && a.effect.target;
      const el = t && (t.element || t);
      return el && el.nodeType === 1 && section.contains(el);
    });
    return {
      runningPageWide: running.length,
      runningInExperience: inSection.length,
      details: inSection.map((a) => ({ prop: a.transitionProperty || a.animationName, dur: a.effect.getTiming().duration })),
      canvasesInExperience: section.querySelectorAll('canvas').length,
      playheads: section.querySelectorAll('[data-playhead]').length,
    };
  });
  report.reducedMotion = { minScaleX, ...rm, consoleErrors };
  await ctx.close();
}

await browser.close();

mkdirSync(HERE, { recursive: true });
writeFileSync(join(HERE, '09-probe.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
