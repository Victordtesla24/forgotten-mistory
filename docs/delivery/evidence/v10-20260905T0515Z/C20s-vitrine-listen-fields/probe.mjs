/**
 * The scene probe for c20's two fields: with GL forced on this GPU-less host,
 * walk #vitrine and #listen into view and record what actually mounts — canvas
 * count, the slot's aria state, the section's own drawings, and the trace-on
 * timings MOT-C13-03 is measured against. Also records the reduced-motion and
 * no-WebGL frames, and writes the four screenshots the evidence dir keeps.
 *
 * Run: node docs/delivery/evidence/<run>/C20s-vitrine-listen-fields/probe.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const SHOTS = join(HERE, '08-screens');
const BASE = process.env.PROBE_BASE_URL ?? 'http://127.0.0.1:5602';

const ARGS = [
  '--no-sandbox',
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

const NO_WEBGL = () => {
  const original = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function patched(id, ...rest) {
    if (id === 'webgl' || id === 'webgl2' || id === 'experimental-webgl') return null;
    return original.call(this, id, ...rest);
  };
};

/** What the two sections report about themselves, in the page. */
const READ = () => {
  const section = (id) => {
    const root = document.querySelector(id);
    if (!root) return { present: false };
    const canvases = root.querySelectorAll('canvas');
    const slot = root.querySelector('[data-lit-index], [data-close]');
    return {
      present: true,
      canvases: canvases.length,
      svgs: root.querySelectorAll('svg').length,
      slotAriaHidden: slot ? slot.closest('[aria-hidden="true"]') !== null : null,
      slotZ: slot ? getComputedStyle(slot).zIndex : null,
      state: slot
        ? (slot.getAttribute('data-lit-index') ?? slot.getAttribute('data-close'))
        : null,
    };
  };

  const rail = document.querySelector('#vitrine ol');
  const plate = document.querySelector('#vitrine ol li');
  const strokes = plate ? Array.from(plate.querySelectorAll('[class*="stroke"]')) : [];
  const delays = strokes.map((el) => parseFloat(getComputedStyle(el).transitionDelay) * 1000);
  const label = plate ? plate.querySelector('[class*="label"]') : null;

  return {
    vitrine: section('#vitrine'),
    listen: section('#listen'),
    rail: rail
      ? { scrollBehavior: getComputedStyle(rail).scrollBehavior, scrollWidth: rail.scrollWidth, clientWidth: rail.clientWidth }
      : null,
    trace: {
      strokes: strokes.length,
      duration: strokes[0] ? parseFloat(getComputedStyle(strokes[0]).transitionDuration) * 1000 : null,
      firstDelays: delays.slice(0, 4),
      lastDelay: delays.length ? Math.max(...delays) : null,
      steps: delays.slice(1).map((d, i) => Number((d - delays[i]).toFixed(3))),
      labelDelay: label ? parseFloat(getComputedStyle(label).transitionDelay) * 1000 : null,
    },
  };
};

async function settle(page, id) {
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 }).catch(() => {});
  await page.locator(id).scrollIntoViewIfNeeded();
  await page.waitForTimeout(2600);
}

// System Chrome, as playwright.config.ts uses off CI: this host has no
// downloaded headless shell.
const browser = await chromium.launch({ channel: 'chrome', args: ARGS });
mkdirSync(SHOTS, { recursive: true });
const report = { base: BASE, at: new Date().toISOString(), frames: {} };

for (const [width, height] of [[1440, 900], [390, 844]]) {
  for (const id of ['#vitrine', '#listen']) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await settle(page, id);
    report.frames[`gl-force ${id} ${width}`] = await page.evaluate(READ);
    await page.locator(id).screenshot({ path: join(SHOTS, `gl-force-${id.slice(1)}-${width}.png`) });
    await context.close();
  }
}

// Reduced motion, and no WebGL at all — the two paths the scene must not be
// needed on. One frame each, at 1440.
for (const [name, options, init] of [
  ['reduced-motion', { reducedMotion: 'reduce' }, null],
  ['no-gl', {}, NO_WEBGL],
]) {
  for (const id of ['#vitrine', '#listen']) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
    const page = await context.newPage();
    if (init) await page.addInitScript(init);
    await settle(page, id);
    report.frames[`${name} ${id} 1440`] = await page.evaluate(READ);
    await page.locator(id).screenshot({ path: join(SHOTS, `${name}-${id.slice(1)}-1440.png`) });
    await context.close();
  }
}

await browser.close();
writeFileSync(join(HERE, '03-probe.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
