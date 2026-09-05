#!/usr/bin/env node
/**
 * probe-glforce.mjs — P100 production incident probe.
 *
 * Loads the built static export in a real Chrome with software WebGL forced on,
 * at ?gl=force (the query the site's own useGLCapability honours to bypass
 * capability sniffing), and records exactly what a visitor on a GPU browser gets:
 * page errors, console errors, how many <canvas> elements were created, and
 * whether app/error.tsx's shell replaced the page.
 *
 * Usage:
 *   node probe-glforce.mjs <baseUrl> <outFile>
 *
 * Exit code is always 0 — the probe reports, it does not judge. The JSON it
 * writes is the evidence.
 */
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://127.0.0.1:5601';
const outFile = process.argv[3];
if (!outFile) {
  console.error('usage: node probe-glforce.mjs <baseUrl> <outFile>');
  process.exit(2);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({
  channel: 'chrome',
  args: [
    '--no-sandbox',
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', (err) => {
  pageErrors.push(String(err && err.message ? err.message : err));
});
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrors.push(msg.text());
});

const url = `${baseUrl}/?gl=force`;
const response = await page.goto(url, { waitUntil: 'load', timeout: 60000 });

// Hold at the hero for 4 s: the hero Scene mounts on near-and-settled, so the
// crash (if any) happens here, before any scrolling.
await sleep(4000);

const hero = await page.evaluate(() => {
  const h1 = document.querySelector('#hero h1');
  return {
    canvases: document.querySelectorAll('canvas').length,
    heroH1Present: Boolean(h1),
    heroH1Text: h1 ? h1.textContent.trim() : null,
    sectionIds: Array.from(document.querySelectorAll('section[id]')).map((s) => s.id),
    bodyHead: (document.body.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 220),
  };
});

// Then scroll to #experience and give its scene the same chance to mount.
await page.evaluate(() => {
  const el = document.querySelector('#experience');
  if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
});
await sleep(4000);

const afterScroll = await page.evaluate(() => ({
  canvases: document.querySelectorAll('canvas').length,
  heroH1Present: Boolean(document.querySelector('#hero h1')),
}));

// app/error.tsx's shell replaces the whole page: no #hero h1 survives it.
const errorShellShowing = !hero.heroH1Present;

const report = {
  probe: 'P100 ?gl=force hero-hold + experience-scroll',
  url,
  viewport: { width: 1440, height: 900 },
  chromium: {
    channel: 'chrome',
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  },
  httpStatus: response ? response.status() : null,
  atHero: {
    holdMs: 4000,
    canvases: hero.canvases,
    heroH1Present: hero.heroH1Present,
    heroH1Text: hero.heroH1Text,
    sectionIds: hero.sectionIds,
    bodyHead: hero.bodyHead,
  },
  atExperience: { holdMs: 4000, canvases: afterScroll.canvases, heroH1Present: afterScroll.heroH1Present },
  errorShellShowing,
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
