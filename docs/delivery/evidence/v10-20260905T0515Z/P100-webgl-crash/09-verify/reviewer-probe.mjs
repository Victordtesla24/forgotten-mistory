#!/usr/bin/env node
/**
 * reviewer-probe.mjs — independent P100 verification probe.
 *
 * Written by the reviewer, not copied from the author's probe-glforce.mjs.
 * Same browser flags (real Chrome, software WebGL forced on) and the same
 * ?gl=force query, but it additionally records, at each hold point, which
 * Scene slots are within the IntersectionObserver's 50% rootMargin — the
 * number that decides how many canvases may legitimately be alive at once.
 *
 * Usage: node reviewer-probe.mjs <baseUrl> <width> <height> <outFile>
 * Exit code is always 0 unless the browser itself fails: the JSON is the evidence.
 */
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const [, , baseUrl, wArg, hArg, outFile] = process.argv;
if (!baseUrl || !wArg || !hArg || !outFile) {
  console.error('usage: node reviewer-probe.mjs <baseUrl> <width> <height> <outFile>');
  process.exit(2);
}
const width = Number(wArg);
const height = Number(hArg);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ channel: 'chrome', args });
const context = await browser.newContext({ viewport: { width, height } });
const page = await context.newPage();

const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', (err) => pageErrors.push(String(err?.message ?? err)));
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

// Snapshot the DOM: canvases, hero h1, section ids, error-shell text, and how
// many scene slots sit inside the observer's half-viewport lead-in.
const snapshot = () =>
  page.evaluate(() => {
    const h1 = document.querySelector('#hero h1');
    const margin = window.innerHeight * 0.5;
    const slots = Array.from(document.querySelectorAll('section[id]')).map((section) => {
      const slot = section.querySelector('[aria-hidden="true"]');
      if (!slot) return null;
      const r = slot.getBoundingClientRect();
      return {
        section: section.id,
        withinRootMargin: r.bottom > -margin && r.top < window.innerHeight + margin,
        hasCanvas: Boolean(slot.querySelector('canvas')),
      };
    }).filter(Boolean);
    return {
      canvases: document.querySelectorAll('canvas').length,
      heroH1Present: Boolean(h1),
      heroH1Text: h1 ? h1.textContent.trim() : null,
      sectionIds: Array.from(document.querySelectorAll('section[id]')).map((s) => s.id),
      slotsWithinRootMargin: slots.filter((s) => s.withinRootMargin).map((s) => s.section),
      slotsWithCanvas: slots.filter((s) => s.hasCanvas).map((s) => s.section),
      bodyHead: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 220),
    };
  });

const url = `${baseUrl}/?gl=force`;
const response = await page.goto(url, { waitUntil: 'load', timeout: 60000 });

await sleep(4000);
const atHero = await snapshot();

await page.evaluate(() => {
  const el = document.querySelector('#experience');
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
});
await sleep(4000);
const atExperience = await snapshot();

// One more: the whole page scrolled through, to see if anything downstream trips
// the boundary after both scenes have had their turn.
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await sleep(2000);
const atEnd = await snapshot();

const report = {
  probe: 'P100 reviewer re-probe — ?gl=force, hold at #hero, hold at #experience, scroll to end',
  url,
  viewport: { width, height },
  chromium: { channel: 'chrome', args },
  httpStatus: response ? response.status() : null,
  atHero,
  atExperience,
  atEnd,
  errorShellShowing: !atHero.heroH1Present,
  pageErrors,
  consoleErrors,
  pageErrorCount: pageErrors.length,
  consoleErrorCount: consoleErrors.length,
  recordedAt: new Date().toISOString(),
};

writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

await context.close();
await browser.close();
