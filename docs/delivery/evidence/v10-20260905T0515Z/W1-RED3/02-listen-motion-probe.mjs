/**
 * W1-RED3 · S-2 — is the listen field's motion floor a product shortfall or a
 * mis-aimed instrument?
 *
 * `tests/overhaul/flagship-visibility.spec.ts` measures mean |dL| between two
 * captures 1.5 s apart and requires >= 0.004. `#listen` measures 0.00107-0.00384.
 * This probe reproduces that measurement and then asks the three questions the
 * verdict turns on, in one browser:
 *
 *   A. Does a longer window move more?  captures at 0 / 1.5 / 3 / 6 / 12 s.
 *   B. Is the moving part of the scene inside the captured box at all?
 *      reports uBand, the slot box, the clip, and where the band lands.
 *   C. How much of the measured delta is the shader and how much is the
 *      per-frame grain / capture noise?  the same pair with the canvas hidden
 *      (slot CSS gradient only) is the static floor.
 *
 * Run: node docs/delivery/evidence/.../02-listen-motion-probe.mjs
 */
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';

const BASE = process.env.PROBE_BASE_URL ?? 'http://127.0.0.1:5620';
const GL_ARGS = [
  '--no-sandbox',
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

function relativeLuminance(r, g, b) {
  const channel = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function decodeLuma(buffer) {
  const png = PNG.sync.read(buffer);
  const values = new Float64Array(png.width * png.height);
  for (let i = 0; i < values.length; i += 1) {
    const o = i * 4;
    values[i] = relativeLuminance(png.data[o], png.data[o + 1], png.data[o + 2]);
  }
  return { values, width: png.width, height: png.height };
}

function meanDelta(a, b) {
  const n = Math.min(a.values.length, b.values.length);
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += Math.abs(a.values[i] - b.values[i]);
  return n === 0 ? 0 : sum / n;
}

function mean(field) {
  let sum = 0;
  for (let i = 0; i < field.values.length; i += 1) sum += field.values[i];
  return sum / field.values.length;
}

function peak(field) {
  let max = 0;
  for (let i = 0; i < field.values.length; i += 1) if (field.values[i] > max) max = field.values[i];
  return max;
}

/** Row-band means, so a static CSS gradient and a moving band can be told apart. */
function rowProfile(field, bands = 10) {
  const out = [];
  const rows = Math.floor(field.height / bands);
  for (let b = 0; b < bands; b += 1) {
    let sum = 0;
    let n = 0;
    for (let y = b * rows; y < (b + 1) * rows; y += 1) {
      for (let x = 0; x < field.width; x += 1) {
        sum += field.values[y * field.width + x];
        n += 1;
      }
    }
    out.push(n ? sum / n : 0);
  }
  return out;
}

async function isolate(page, scene) {
  await page.evaluate((id) => {
    const style = document.createElement('style');
    style.id = 'probe-isolate';
    style.textContent = `
      body * { visibility: hidden !important; }
      [data-scene="${id}"], [data-scene="${id}"] * { visibility: visible !important; }
    `;
    document.head.appendChild(style);
  }, scene);
}

async function hideCanvas(page, scene, hidden) {
  await page.evaluate(
    ({ id, hide }) => {
      document.getElementById('probe-hide-canvas')?.remove();
      if (!hide) return;
      const style = document.createElement('style');
      style.id = 'probe-hide-canvas';
      style.textContent = `[data-scene="${id}"] canvas { visibility: hidden !important; }`;
      document.head.appendChild(style);
    },
    { id: scene, hide: hidden },
  );
}

async function slotClip(page, scene) {
  const slot = page.locator(`[data-scene="${scene}"]`);
  await slot.waitFor({ state: 'attached', timeout: 15000 });
  await slot.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(250);
  const box = await slot.boundingBox();
  const vp = page.viewportSize();
  const x = Math.max(0, Math.min(box.x, vp.width - 4));
  const y = Math.max(0, Math.min(box.y, vp.height - 4));
  return {
    box,
    clip: {
      x,
      y,
      width: Math.max(4, Math.min(box.width, vp.width - x)),
      height: Math.max(4, Math.min(box.height, vp.height - y)),
    },
  };
}

async function run(width, height) {
  const browser = await chromium.launch({ channel: 'chrome', args: GL_ARGS });
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });

  const { box, clip } = await slotClip(page, 'listen-field');
  await page
    .locator('[data-scene="listen-field"] canvas')
    .waitFor({ state: 'attached', timeout: 30000 });
  await page.waitForTimeout(2500);

  // B — where the caliper band sits inside the canvas, and how much of the
  // canvas the capture actually sees.
  const geometry = await page.evaluate(() => {
    const slot = document.querySelector('[data-scene="listen-field"]');
    const caliper = document.querySelector('#listen [class*="caliper"]');
    const section = document.getElementById('listen');
    const sb = section.getBoundingClientRect();
    const cb = caliper ? caliper.getBoundingClientRect() : null;
    const canvas = slot.querySelector('canvas');
    return {
      sectionHeight: sb.height,
      sectionTop: sb.top,
      caliperCentreFraction: cb ? (cb.top + cb.height / 2 - sb.top) / sb.height : null,
      canvasCss: canvas ? { w: canvas.clientWidth, h: canvas.clientHeight } : null,
      canvasAttr: canvas ? { w: canvas.width, h: canvas.height } : null,
      innerHeight: window.innerHeight,
    };
  });

  await isolate(page, 'listen-field');

  // A — the same measurement over a growing window.
  const stamps = [0, 1500, 1500, 3000, 6000];
  const shots = [];
  for (let i = 0; i < stamps.length; i += 1) {
    if (stamps[i]) await page.waitForTimeout(stamps[i]);
    shots.push(decodeLuma(await page.screenshot({ clip })));
  }
  // elapsed: 0, 1.5, 3.0, 6.0, 12.0 s
  const windows = {
    'shader 0.0->1.5s': meanDelta(shots[0], shots[1]),
    'shader 1.5->3.0s': meanDelta(shots[1], shots[2]),
    'shader 0.0->3.0s': meanDelta(shots[0], shots[2]),
    'shader 0.0->6.0s': meanDelta(shots[0], shots[3]),
    'shader 0.0->12.0s': meanDelta(shots[0], shots[4]),
  };

  // C — the static floor: same clip, same 1.5 s, canvas hidden.
  await hideCanvas(page, 'listen-field', true);
  await page.waitForTimeout(400);
  const still0 = decodeLuma(await page.screenshot({ clip }));
  await page.waitForTimeout(1500);
  const still1 = decodeLuma(await page.screenshot({ clip }));
  const staticFloor = meanDelta(still0, still1);
  await hideCanvas(page, 'listen-field', false);

  const report = {
    viewport: `${width}x${height}`,
    slotBox: { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) },
    clip: { x: Math.round(clip.x), y: Math.round(clip.y), w: Math.round(clip.width), h: Math.round(clip.height) },
    capturedShareOfCanvas: +(clip.height / box.height).toFixed(3),
    geometry,
    live: { mean: +mean(shots[0]).toFixed(5), peak: +peak(shots[0]).toFixed(4) },
    cssOnly: { mean: +mean(still0).toFixed(5), peak: +peak(still0).toFixed(4) },
    liveRowProfile: rowProfile(shots[0]).map((v) => +v.toFixed(4)),
    cssRowProfile: rowProfile(still0).map((v) => +v.toFixed(4)),
    motion: Object.fromEntries(Object.entries(windows).map(([k, v]) => [k, +v.toFixed(5)])),
    staticFloor1_5s: +staticFloor.toFixed(5),
    MOTION_MIN: 0.004,
  };
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
}

const width = Number(process.argv[2] ?? 1440);
const height = Number(process.argv[3] ?? 900);
await run(width, height);
