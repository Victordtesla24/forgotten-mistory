/**
 * 09b — the measurements probe 09 got wrong or could not reach.
 *
 * `[class*="rail"]` matches `.railStage` (the field's frame) before `.rail`
 * (the scroller), so probe 09's rail numbers describe the wrong element. This
 * one addresses the scroller by its own hashed class, re-reads MOT-C13-06 at
 * 390 under both motion preferences, reads the rail's own state attributes,
 * and captures the two sections with and without GL at an identical scroll so
 * the field's contribution can be measured in pixels rather than described.
 */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5602';
const ARGS = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const KILL_GL = () => {
  const real = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function patched(type, ...rest) {
    if (typeof type === 'string' && /webgl/i.test(type)) return null;
    return real.call(this, type, ...rest);
  };
};

const railRead = () => {
  const section = document.querySelector('#vitrine');
  const rail = section.querySelector('ol[class*="_rail__"]');
  const field = section.querySelector('[data-lit-index]');
  const cs = rail ? getComputedStyle(rail) : null;
  return {
    railClass: rail ? rail.className : null,
    scrollBehavior: cs ? cs.scrollBehavior : null,
    scrollSnapType: cs ? cs.scrollSnapType : null,
    overflowX: cs ? cs.overflowX : null,
    zIndex: cs ? cs.zIndex : null,
    scrollWidth: rail ? rail.scrollWidth : null,
    clientWidth: rail ? rail.clientWidth : null,
    litIndexAttr: field ? field.getAttribute('data-lit-index') : null,
    fieldZ: field ? getComputedStyle(field).zIndex : null,
    litPlates: [...section.querySelectorAll('[data-lit]')].length,
    litPlateAccession: section.querySelector('[data-lit]')?.textContent?.trim().slice(0, 2) ?? null,
  };
};

const out = {};
const browser = await chromium.launch({ channel: 'chrome', args: ARGS });

for (const [key, vp, reduced] of [
  ['rail1440', { width: 1440, height: 900 }, undefined],
  ['rail390', { width: 390, height: 844 }, undefined],
  ['rail390reduce', { width: 390, height: 844 }, 'reduce'],
  ['rail1440reduce', { width: 1440, height: 900 }, 'reduce'],
]) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: reduced, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load' });
  await page.waitForTimeout(900);
  await page.evaluate(() => document.querySelector('#vitrine')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(2200);
  const atRest = await page.evaluate(railRead);
  // Centre plate 03 and re-read: the lit index must follow the rail, not a clock.
  await page.evaluate(() => {
    const section = document.querySelector('#vitrine');
    const rail = section.querySelector('ol[class*="_rail__"]');
    const plates = [...rail.children];
    const plate = plates[2];
    rail.scrollLeft = plate.offsetLeft - (rail.clientWidth - plate.clientWidth) / 2;
  });
  await page.waitForTimeout(1400);
  const afterCentre = await page.evaluate(railRead);
  out[key] = { viewport: vp, reduced: reduced ?? 'no-preference', atRest, afterCentre };
  await ctx.close();
}

/* The field, in pixels: same build, same viewport, same scroll — GL on, GL off. */
for (const [key, id, vp] of [
  ['vitrine1440', '#vitrine', { width: 1440, height: 900 }],
  ['listen1440', '#listen', { width: 1440, height: 900 }],
  ['vitrine390', '#vitrine', { width: 390, height: 844 }],
  ['listen390', '#listen', { width: 390, height: 844 }],
]) {
  for (const gl of ['on', 'off']) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
    if (gl === 'off') await ctx.addInitScript(KILL_GL);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    await page.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'center', behavior: 'instant' }), id);
    await page.waitForTimeout(2800);
    await page.screenshot({ path: new URL(`./09-screens/${key}-gl-${gl}.png`, import.meta.url).pathname, fullPage: false });
    await ctx.close();
  }
}

await browser.close();
writeFileSync(new URL('./09-verify-probe2.json', import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
