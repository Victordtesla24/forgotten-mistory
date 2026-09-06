// G-A3 independent live reviewer probe (FRESH identity).
// Measures on LIVE https://forgotten-mistory.web.app/#about whether the
// data-scene="about-field" GL shader responds to the active dimension, and
// whether the site's gold accent leaks into the shader.
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'node:fs';

const LIVE_URL = process.env.URL || 'https://forgotten-mistory.web.app/';
const OUT = new URL('.', import.meta.url).pathname; // captures/ dir
const EXE = '/opt/ms-playwright/chromium-1234/chrome-linux64/chrome';

const GOLDS = [
  [0xc9, 0xa8, 0x4c], // gold
  [0xd4, 0xb6, 0x5c], // goldLight
  [0xe8, 0xd5, 0xa3], // goldPale
];

function decode(buf) {
  return PNG.sync.read(buf);
}
// Fraction of opaque pixels that are near a gold tone (accent leak).
function goldStats(png) {
  const { data, width, height } = png;
  let opaque = 0, gold = 0;
  for (let i = 0; i < width * height; i++) {
    const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
    if (a < 24) continue;
    opaque++;
    for (const [gr, gg, gb] of GOLDS) {
      if (Math.abs(r - gr) < 26 && Math.abs(g - gg) < 26 && Math.abs(b - gb) < 26) { gold++; break; }
    }
  }
  return { opaque, gold, goldFrac: opaque ? gold / opaque : 0 };
}
// Fraction of pixels that differ meaningfully between two same-size PNGs.
function diffFrac(a, b) {
  const n = Math.min(a.data.length, b.data.length) / 4;
  let diff = 0, lit = 0;
  for (let i = 0; i < n; i++) {
    const dr = Math.abs(a.data[i*4] - b.data[i*4]);
    const dg = Math.abs(a.data[i*4+1] - b.data[i*4+1]);
    const db = Math.abs(a.data[i*4+2] - b.data[i*4+2]);
    const da = Math.abs(a.data[i*4+3] - b.data[i*4+3]);
    if (dr + dg + db + da > 30) diff++;
    if (a.data[i*4+3] > 24 || b.data[i*4+3] > 24) lit++;
  }
  return { diffFrac: diff / n, changedOfLit: lit ? diff / lit : 0 };
}

const run = async () => {
  const browser = await chromium.launch({
    executablePath: EXE,
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--no-sandbox'],
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console:' + m.text()); });

  await page.goto(LIVE_URL, { waitUntil: 'networkidle', timeout: 60000 });

  const buildCommit = await page.$eval('meta[name="build-commit"]', (m) => m.getAttribute('content')).catch(() => null);

  // Bring #about into view.
  await page.evaluate(() => document.querySelector('#about')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1500);

  const canvas = await page.waitForSelector('[data-scene="about-field"] canvas, canvas', { timeout: 20000 }).catch(() => null);
  // Prefer the exact scene mount.
  const sceneCanvas = await page.$('[data-scene="about-field"] canvas');
  const target = sceneCanvas || canvas;
  const hasScene = !!(await page.$('[data-scene="about-field"]'));

  // WebGL sanity: does the about canvas have a live GL context and non-trivial size?
  const glInfo = await page.evaluate(() => {
    const host = document.querySelector('[data-scene="about-field"]');
    const c = host?.querySelector('canvas') || document.querySelector('canvas');
    if (!c) return { canvas: false };
    const gl = c.getContext('webgl2') || c.getContext('webgl');
    return { canvas: true, w: c.width, h: c.height, hasGL: !!gl, lost: gl ? gl.isContextLost() : null };
  });

  // Enumerate the dimension list items and their answered/sourced state from DOM.
  const items = await page.$$eval('#about [data-active], #about ol li', (els) =>
    els.map((el, i) => ({ i, text: (el.textContent || '').trim().slice(0, 40) })),
  ).catch(() => []);

  // Hide the SVG compass overlay so canvas screenshots isolate the shader only
  // (the accent legitimately lives in the SVG chrome; we must not sample it).
  await page.addStyleTag({ content: '#about svg{opacity:0 !important;visibility:hidden !important} [data-scene="about-field"] svg{display:none !important}' });
  await page.waitForTimeout(200);

  const shots = [];
  const readAxis = () => page.evaluate(() => {
    const f = document.querySelector('#about [data-axis]');
    return f ? f.getAttribute('data-axis') : null;
  });

  async function snap(label) {
    await page.waitForTimeout(1200); // let ramp-in + rotation ease settle
    const axis = await readAxis();
    const file = `${OUT}shot-${label}.png`;
    const buf = target ? await target.screenshot({ path: file }) : await page.screenshot({ path: file });
    const png = decode(buf);
    const gs = goldStats(png);
    shots.push({ label, axis, file: file.split('/').pop(), size: { w: png.width, h: png.height }, ...gs });
    return png;
  }

  // Rest state (no hover): move mouse away.
  await page.mouse.move(5, 5);
  const rest = await snap('rest');

  // Hover several list items to drive `active` to different dimensions.
  const lis = await page.$$('#about ol li');
  const picks = [];
  for (const idx of [0, 2, 4, 6, 8]) {
    if (lis[idx]) picks.push(idx);
  }
  const pngs = {};
  for (const idx of picks) {
    await lis[idx].hover().catch(() => {});
    pngs[idx] = await snap(`hover-${idx}`);
  }
  await page.mouse.move(5, 5);

  // Pairwise responsiveness diffs vs rest and between two hovered states.
  const diffs = [];
  for (const idx of picks) {
    diffs.push({ pair: `rest->hover-${idx}`, ...diffFrac(rest, pngs[idx]) });
  }
  if (picks.length >= 2) {
    diffs.push({ pair: `hover-${picks[0]}->hover-${picks[picks.length-1]}`, ...diffFrac(pngs[picks[0]], pngs[picks[picks.length-1]]) });
  }

  const report = { url: LIVE_URL, buildCommit, hasScene, glInfo, itemsCount: lis.length, shots, diffs, errors: errors.slice(0, 20) };
  fs.writeFileSync(`${OUT}probe-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
};
run().catch((e) => { console.error('PROBE_FAIL', e); process.exit(3); });
