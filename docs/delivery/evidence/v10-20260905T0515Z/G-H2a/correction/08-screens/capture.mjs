/**
 * 08 — the poster, photographed on every path a reader can arrive on.
 *
 *   node docs/delivery/evidence/v10-20260905T0515Z/G-H2a/correction/08-screens/capture.mjs
 *
 * Four contexts per viewport, against the built export on :5622 — JavaScript on
 * (the scene composites over the poster), the WebGL chunk aborted (the poster is
 * the whole picture), JavaScript disabled outright (the acceptance's own clause,
 * measurable since 6f4ba6c removed app/loading.tsx), and prefers-reduced-motion
 * (no canvas mounts at all). Mean WCAG relative luminance is reported over the
 * hero's stage box wherever that box exists, and over the viewport otherwise.
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5622';
const GL_ARGS = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const LAZY_CHUNK = /\/_next\/static\/chunks\/\d+\.[^/]+\.js(\?.*)?$/;

const ch = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
function meanLuminance(buffer) {
  const png = PNG.sync.read(buffer);
  let sum = 0;
  const n = png.width * png.height;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    sum += 0.2126 * ch(png.data[o]) + 0.7152 * ch(png.data[o + 1]) + 0.0722 * ch(png.data[o + 2]);
  }
  return sum / n;
}

const VIEWPORTS = [{ width: 1440, height: 900 }, { width: 390, height: 844 }];
const PATHS = [
  { id: 'js-on', options: {} },
  { id: 'gl-blocked', options: {}, blockChunk: true },
  { id: 'js-off', options: { javaScriptEnabled: false } },
  { id: 'reduced-motion', options: { reducedMotion: 'reduce' } },
];

mkdirSync(HERE, { recursive: true });
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: GL_ARGS });
const results = [];
for (const viewport of VIEWPORTS) {
  for (const path of PATHS) {
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, ...path.options });
    const page = await context.newPage();
    if (path.blockChunk) await page.route(LAZY_CHUNK, (r) => r.abort());
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(path.id === 'js-on' ? 3500 : 1200);

    const slot = page.locator('[data-scene="hero-atmosphere"]');
    const box = await slot.count() ? await slot.boundingBox() : null;
    const target = box ? slot : page;
    const shot = await target.screenshot();
    const file = join(HERE, `hero-${viewport.width}-${path.id}.png`);
    await target.screenshot({ path: file });
    const canvases = await page.locator('#hero canvas').count();
    const bg = box
      ? await slot.evaluate((el) => getComputedStyle(el).backgroundImage)
      : '(no stage box)';
    const row = {
      viewport: `${viewport.width}x${viewport.height}`,
      path: path.id,
      stageBox: box ? `${Math.round(box.width)}x${Math.round(box.height)}` : 'none (viewport measured)',
      heroCanvases: canvases,
      posterLayer: /url\((["']?)[^"')]*\/assets\/[^"')]+\1\)/.test(bg),
      meanLuminance: Number(meanLuminance(shot).toFixed(4)),
      file: `08-screens/hero-${viewport.width}-${path.id}.png`,
    };
    results.push(row);
    console.log(
      `${row.viewport.padEnd(9)} ${row.path.padEnd(15)} box=${row.stageBox.padEnd(26)} ` +
        `canvases=${row.heroCanvases} poster=${row.posterLayer} luma=${row.meanLuminance}`,
    );
    await context.close();
  }
}
await browser.close();
console.log(`\n${JSON.stringify(results, null, 2)}`);
