#!/usr/bin/env node
/**
 * hero_plane_dominance.mjs — the Stage-Plane Dominance (SPD) instrument.
 *
 * Binding definition: docs/architecture/HERO-FOLD-v2.md §3 (t_g2_h1 / t_h2_01).
 * "The plane dominates" has to be a number a probe can print, or the next
 * reviewer overturns it the way ADV-1451Z overturned "flagship". This file is
 * that number. It is imported by `tests/overhaul/hero-plane-dominance.spec.ts`
 * (TC-HERO-PLANE-01 / -02) and runs standalone against any served build:
 *
 *   node scripts/validate/hero_plane_dominance.mjs --base http://127.0.0.1:5636
 *   node scripts/validate/hero_plane_dominance.mjs --base https://forgotten-mistory.web.app \
 *        --out docs/delivery/evidence/<run>/<lane>/spd.json
 *
 * ## The measure, exactly as §3.1 writes it
 *
 *   - Capture the fold at deviceScaleFactor 1: W × H = the viewport. Every
 *     pixel gets WCAG relative luminance L from its sRGB bytes (the same helper
 *     `tests/overhaul/flagship-visibility.spec.ts` reasons in).
 *   - Ground  G  = the 10th-percentile L of the fold. A percentile, never the
 *     declared background-color: it survives a poster change and needs no DOM.
 *   - Light mass  m = max(0, L − G)  per pixel.
 *   - Ink set  I  = the union, read from the live DOM, of
 *       (a) every text-leaf rect in the fold — one rect per line box, from the
 *           text nodes' own Range client rects (falling back to the element's
 *           box when a text node has no line boxes);
 *       (b) every media rect — `img`, `video`, `svg`;
 *       (c) every element whose computed background-color alpha ≥ 0.5 — the
 *           plates;
 *     each dilated by 8 px and clipped to the fold.
 *   - Plane set  P  = fold ∖ I.
 *
 *       SPD = Σ_P m / Σ_fold m                      PLANE-1  ≥ 0.75 (ship ≥ 0.78)
 *       Σ_fold m / (W·H)                            PLANE-2  ≥ 0.045
 *
 * PLANE-2 is the floor that stops a black fold scoring 1.0: the frame has to be
 * lit before it can be dominant.
 *
 * ## One reading of (c) that the brief leaves implicit, made explicit here
 *
 * `body`, `#hero` and every ancestor of the stage slot paint an opaque ink
 * ground; read literally, rule (c) would put the whole fold into I and SPD would
 * be identically 0 on every build. The plates the brief means are the elements
 * painted *over* the plane. So the **ground chain** — the stage slot
 * `[data-scene="hero-atmosphere"]`, its ancestors, and its descendants (the
 * canvas and the poster still) — is the plane by definition and is never ink.
 * Everything else in the viewport that meets (a), (b) or (c) is ink, including
 * the fixed navigation and any launcher: the fold is the screen the reader
 * opens on, not `#hero` alone. Every excluded rect is printed with its reason so
 * a reviewer can re-derive I rather than trust it.
 *
 * Pseudo-elements (`::before` / `::after`) cannot be enumerated from the DOM and
 * are not in I. The one that matters, `.stage::after`, belongs to the ground
 * chain anyway.
 *
 * ## Two paths, four widths
 *
 * `/?gl=force` with the shader settled (a canvas attached inside the slot, then
 * a wait), and the `prefers-reduced-motion: reduce` still (no canvas mounts —
 * that is `Scene`'s contract — so the frame is the poster plus the CSS). A
 * reader without a GPU gets the same set piece or the claim is false.
 *
 * No top-level `await` in this module: the spec is CJS-transpiled by Playwright
 * and loads this file through Node 22's `require(esm)`, which refuses async
 * modules. The CLI runs from `main()` behind an is-entry-point guard.
 */

import { pathToFileURL } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

/** PLANE-1 — the plane carries three quarters of everything the eye is pulled toward. */
export const SPD_MIN = 0.75;
/** PLANE-3 — the shipping margin; `filter: grayscale()` (t_g2_h6) re-weights channels. */
export const SPD_SHIP = 0.78;
/** PLANE-2 — the frame must be lit before it can be dominant. */
export const LIT_FLOOR = 0.045;
/** Ground is the 10th-percentile luminance of the fold. */
export const GROUND_PERCENTILE = 0.1;
/** Every ink rect grows by this much on every side before it is subtracted. */
export const DILATE_PX = 8;
/** An element is a plate when its computed background-color alpha reaches this. */
export const PLATE_ALPHA_MIN = 0.5;

/** The four widths §3.2 names, in the order the brief lists them. */
export const VIEWPORTS = Object.freeze([
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 834, height: 1194 },
  { width: 390, height: 844 },
]);

/**
 * The two paths. `gl` is the shader; `still` is what a reader with reduced
 * motion — or no GPU — is served.
 */
export const PATHS = Object.freeze([
  { id: 'gl', label: '/?gl=force (shader, settled)', url: '/?gl=force', reducedMotion: false },
  { id: 'still', label: 'prefers-reduced-motion still', url: '/', reducedMotion: true },
]);

/**
 * The software rasteriser, enabled explicitly — this host has no GPU and
 * `?gl=force` only lifts the application's guard. `--disable-lcd-text` keeps
 * subpixel colour fringing out of a luminance measurement.
 */
export const GL_ARGS = Object.freeze([
  '--no-sandbox',
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
  '--disable-lcd-text',
]);

/** Relative luminance (WCAG) of one 8-bit sRGB triple. */
export function relativeLuminance(r, g, b) {
  const channel = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/**
 * @typedef {{ values: Float64Array, width: number, height: number }} LumaField
 */

/**
 * Decode a PNG capture to a per-pixel luminance field (row-major).
 * @param {Buffer} buffer
 * @returns {LumaField}
 */
export function decodeLuma(buffer) {
  const png = PNG.sync.read(buffer);
  const values = new Float64Array(png.width * png.height);
  for (let i = 0; i < values.length; i += 1) {
    const o = i * 4;
    values[i] = relativeLuminance(png.data[o], png.data[o + 1], png.data[o + 2]);
  }
  return { values, width: png.width, height: png.height };
}

/**
 * The `p`-quantile of a field by exact sort (nearest-rank on a sorted copy).
 * @param {Float64Array} values
 * @param {number} p in [0, 1]
 */
export function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = Float64Array.from(values).sort();
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor(p * (sorted.length - 1))));
  return sorted[idx];
}

/**
 * @typedef {{ kind: 'text' | 'media' | 'plate', tag: string, handle: string, text: string,
 *             alpha: number | null, x: number, y: number, w: number, h: number }} InkRect
 */

/**
 * Runs **inside the page** (`page.evaluate(collectInkRects, opts)`), so it must
 * be self-contained: no closure over module scope. Returns every ink rect in the
 * viewport, un-dilated, clipped to the fold, with the reason it is ink.
 *
 * @param {{ alphaMin: number }} opts
 * @returns {{ width: number, height: number, canvases: number, groundChain: string[], rects: InkRect[] }}
 */
export function collectInkRects(opts) {
  const alphaMin = opts && typeof opts.alphaMin === 'number' ? opts.alphaMin : 0.5;
  const W = window.innerWidth;
  const H = window.innerHeight;

  const describe = (el) => {
    const tag = el.tagName.toLowerCase();
    const testid = el.getAttribute('data-testid');
    const scene = el.getAttribute('data-scene');
    if (el.id) return `${tag}#${el.id}`;
    if (testid) return `${tag}[data-testid=${testid}]`;
    if (scene) return `${tag}[data-scene=${scene}]`;
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean)[0] : '';
    return cls ? `${tag}.${cls}` : tag;
  };

  const clip = (r) => {
    const x1 = Math.max(0, r.left);
    const y1 = Math.max(0, r.top);
    const x2 = Math.min(W, r.right);
    const y2 = Math.min(H, r.bottom);
    if (x2 <= x1 || y2 <= y1) return null;
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  };

  const alphaOf = (color) => {
    if (!color || color === 'transparent') return 0;
    const m = color.match(/rgba?\(([^)]+)\)/);
    if (!m) return 1;
    const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
    return parts.length > 3 ? parts[3] : 1;
  };

  // The ground chain: the stage slot, everything above it, everything inside it.
  const stage = document.querySelector('[data-scene="hero-atmosphere"]');
  const ground = new Set();
  const groundChain = [];
  if (stage) {
    let n = stage;
    while (n) {
      ground.add(n);
      groundChain.push(describe(n));
      n = n.parentElement;
    }
    stage.querySelectorAll('*').forEach((el) => {
      ground.add(el);
      groundChain.push(describe(el));
    });
  }

  const SKIP_TAGS = new Set(['script', 'style', 'template', 'noscript', 'head', 'meta', 'link', 'title']);
  const MEDIA_TAGS = new Set(['img', 'video', 'svg']);

  /** @type {InkRect[]} */
  const rects = [];
  const push = (kind, el, box, text, alpha) => {
    rects.push({
      kind,
      tag: el.tagName.toLowerCase(),
      handle: describe(el),
      text: (text || '').replace(/\s+/g, ' ').trim().slice(0, 40),
      alpha,
      x: Math.round(box.x * 100) / 100,
      y: Math.round(box.y * 100) / 100,
      w: Math.round(box.w * 100) / 100,
      h: Math.round(box.h * 100) / 100,
    });
  };

  for (const el of Array.from(document.body.querySelectorAll('*'))) {
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) continue;
    if (ground.has(el)) continue;
    const box = clip(el.getBoundingClientRect());
    if (!box) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || cs.opacity === '0') continue;

    if (MEDIA_TAGS.has(tag)) {
      push('media', el, box, el.getAttribute('alt') || el.getAttribute('aria-label') || '', null);
      continue;
    }

    const alpha = alphaOf(cs.backgroundColor);
    if (alpha >= alphaMin) {
      push('plate', el, box, el.textContent || '', alpha);
      // A plate covers its own text; its text leaves are still listed below so
      // the list is a complete derivation of I, not a shortcut.
    }

    const ownsText = Array.from(el.childNodes).some(
      (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0,
    );
    if (!ownsText) continue;
    let lineBoxes = 0;
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType !== Node.TEXT_NODE || !(node.textContent || '').trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of Array.from(range.getClientRects())) {
        const line = clip(r);
        if (!line) continue;
        lineBoxes += 1;
        push('text', el, line, node.textContent || '', null);
      }
    }
    if (lineBoxes === 0) push('text', el, box, el.textContent || '', null);
  }

  return {
    width: W,
    height: H,
    canvases: document.querySelectorAll('#hero canvas').length,
    groundChain,
    rects,
  };
}

/**
 * Dilate an ink rect by `px` on every side and clip it to `width × height`,
 * returning integer pixel bounds `[x0, y0, x1, y1)` or `null` when empty.
 */
export function dilateRect(rect, px, width, height) {
  const x0 = Math.max(0, Math.floor(rect.x - px));
  const y0 = Math.max(0, Math.floor(rect.y - px));
  const x1 = Math.min(width, Math.ceil(rect.x + rect.w + px));
  const y1 = Math.min(height, Math.ceil(rect.y + rect.h + px));
  if (x1 <= x0 || y1 <= y0) return null;
  return [x0, y0, x1, y1];
}

/**
 * Rasterise the dilated ink set into a `width × height` mask (1 = ink).
 * @param {InkRect[]} rects
 */
export function rasterizeInk(rects, width, height, dilate = DILATE_PX) {
  const mask = new Uint8Array(width * height);
  for (const rect of rects) {
    const b = dilateRect(rect, dilate, width, height);
    if (!b) continue;
    const [x0, y0, x1, y1] = b;
    for (let y = y0; y < y1; y += 1) {
      mask.fill(1, y * width + x0, y * width + x1);
    }
  }
  return mask;
}

/**
 * @typedef {{
 *   width: number, height: number, pixels: number,
 *   ground: number, sumFold: number, sumPlane: number, spd: number,
 *   litDensity: number, inkPixels: number, inkShare: number,
 *   peak: number, dilate: number, rects: InkRect[],
 * }} Dominance
 */

/**
 * The number. Pure: a luminance field plus the DOM's ink rects in, SPD out.
 * @param {LumaField} field
 * @param {InkRect[]} rects
 * @returns {Dominance}
 */
export function planeDominance(field, rects, { dilate = DILATE_PX, groundPercentile = GROUND_PERCENTILE } = {}) {
  const { values, width, height } = field;
  const pixels = width * height;
  const ground = percentile(values, groundPercentile);
  const mask = rasterizeInk(rects, width, height, dilate);
  let sumFold = 0;
  let sumPlane = 0;
  let inkPixels = 0;
  let peak = 0;
  for (let i = 0; i < pixels; i += 1) {
    const L = values[i];
    if (L > peak) peak = L;
    const m = L > ground ? L - ground : 0;
    sumFold += m;
    if (mask[i]) inkPixels += 1;
    else sumPlane += m;
  }
  return {
    width,
    height,
    pixels,
    ground,
    sumFold,
    sumPlane,
    spd: sumFold > 0 ? sumPlane / sumFold : 0,
    litDensity: pixels > 0 ? sumFold / pixels : 0,
    inkPixels,
    inkShare: pixels > 0 ? inkPixels / pixels : 0,
    peak,
    dilate,
    rects,
  };
}

/**
 * Boot the page on one path and bring it to rest so the capture is the frame
 * the reader actually sees. Shared by the spec and the CLI.
 *
 * @param {import('playwright-core').Page} page
 * @param {string} baseURL
 * @param {{ id: string, url: string, reducedMotion: boolean }} route
 * @returns {Promise<{ canvases: number }>}
 */
export async function preparePage(page, baseURL, route) {
  if (route.reducedMotion) await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(new URL(route.url, baseURL).toString(), { waitUntil: 'domcontentloaded' });

  // Dismiss the boot overlay the way tests/helpers/boot.ts does: click the
  // component's own Skip control and let React unmount it. Never `.remove()`.
  const preloader = page.locator('.preloader');
  if (await preloader.isVisible().catch(() => false)) {
    const skip = page.locator('button.preloader-skip');
    if (await skip.isVisible().catch(() => false)) await skip.click({ timeout: 5000 }).catch(() => {});
    await preloader.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 20000 });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});

  const slot = page.locator('[data-scene="hero-atmosphere"]');
  if (route.reducedMotion) {
    // Reduced motion mounts no 3D at all; give the CSS fade (320 ms + steps)
    // and any image decode time to finish before the frame is read.
    await page.waitForTimeout(1500);
  } else {
    await slot.locator('canvas').waitFor({ state: 'attached', timeout: 30000 });
    // The shader's first frames and the entrance (transform-only, ≈1.6 s of
    // staggered steps) both have to land before the boxes are at rest.
    await page.waitForTimeout(3000);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  const canvases = await page.locator('#hero canvas').count();
  return { canvases };
}

/**
 * Photograph the fold and measure it. The page must already be prepared.
 * @param {import('playwright-core').Page} page
 * @returns {Promise<Dominance & { canvases: number, groundChain: string[] }>}
 */
export async function measureFold(
  page,
  { alphaMin = PLATE_ALPHA_MIN, dilate = DILATE_PX, shotPath = '' } = {},
) {
  const dom = await page.evaluate(collectInkRects, { alphaMin });
  const capture = await page.screenshot({ type: 'png', fullPage: false });
  // The very buffer that is measured, when a reviewer wants the pixels too.
  if (shotPath) writeFileSync(shotPath, capture);
  const field = decodeLuma(capture);
  if (field.width !== dom.width || field.height !== dom.height) {
    throw new Error(
      `capture is ${field.width}x${field.height} but the viewport is ${dom.width}x${dom.height} — ` +
        'deviceScaleFactor must be 1 for the DOM rects to address the pixels',
    );
  }
  const result = planeDominance(field, dom.rects, { dilate });
  return { ...result, canvases: dom.canvases, groundChain: dom.groundChain };
}

const f4 = (n) => n.toFixed(4);

/**
 * The report a reviewer re-derives from: G, Σ_fold m, Σ_P m, SPD, the PLANE-2
 * density, and every excluded rect with its reason. Never summarised.
 * @param {string} title
 * @param {Dominance & { canvases?: number, groundChain?: string[] }} d
 */
export function formatReport(title, d) {
  const lines = [];
  lines.push(`[hero-plane-dominance] ${title}`);
  lines.push(`  fold W×H            = ${d.width}×${d.height} (${d.pixels} px)  canvases in #hero = ${d.canvases ?? '?'}`);
  lines.push(`  G (10th-pct L)      = ${f4(d.ground)}    peak L = ${f4(d.peak)}`);
  lines.push(`  Σ_fold m            = ${d.sumFold.toFixed(2)}`);
  lines.push(`  Σ_P m               = ${d.sumPlane.toFixed(2)}`);
  lines.push(
    `  SPD = Σ_P/Σ_fold    = ${f4(d.spd)}    PLANE-1 ≥ ${SPD_MIN} ${d.spd >= SPD_MIN ? 'PASS' : 'FAIL'}` +
      `  (ship ≥ ${SPD_SHIP} ${d.spd >= SPD_SHIP ? 'PASS' : 'FAIL'})`,
  );
  lines.push(
    `  Σ_fold m / (W·H)    = ${f4(d.litDensity)}    PLANE-2 ≥ ${LIT_FLOOR} ${d.litDensity >= LIT_FLOOR ? 'PASS' : 'FAIL'}`,
  );
  lines.push(
    `  ink I               = ${d.rects.length} rects, dilated ${d.dilate} px, covering ` +
      `${(d.inkShare * 100).toFixed(2)}% of the fold (${d.inkPixels} px)`,
  );
  if (d.groundChain && d.groundChain.length) {
    lines.push(`  ground chain (never ink): ${d.groundChain.join(' > ')}`);
  }
  d.rects.forEach((r, i) => {
    const n = String(i + 1).padStart(2, '0');
    const kind = r.kind.padEnd(5, ' ');
    const alpha = r.alpha === null ? '' : ` α=${r.alpha}`;
    const text = r.text ? ` "${r.text}"` : '';
    lines.push(
      `    #${n} ${kind} ${r.handle}${alpha}${text}  x=${r.x} y=${r.y} w=${r.w} h=${r.h}`,
    );
  });
  return lines.join('\n');
}

/** Both gates on one result. */
export function gates(d) {
  return {
    plane1: d.spd >= SPD_MIN,
    plane2: d.litDensity >= LIT_FLOOR,
    ship: d.spd >= SPD_SHIP,
  };
}

/* ── CLI ───────────────────────────────────────────────────────────────────── */

function parseArgs(argv) {
  const opt = { base: '', out: '', shots: '', paths: 'gl,still', widths: '' };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--base') opt.base = argv[++i] || '';
    else if (a === '--out') opt.out = argv[++i] || '';
    else if (a === '--shots') opt.shots = argv[++i] || '';
    else if (a === '--paths') opt.paths = argv[++i] || opt.paths;
    else if (a === '--widths') opt.widths = argv[++i] || '';
    else if (a === '--help' || a === '-h') opt.help = true;
  }
  return opt;
}

async function main() {
  const opt = parseArgs(process.argv.slice(2));
  if (opt.help || !opt.base) {
    process.stdout.write(
      'usage: node scripts/validate/hero_plane_dominance.mjs --base <url> [--out <json>] ' +
        '[--shots <dir>] [--paths gl,still] [--widths 1440,390]\n',
    );
    process.exit(opt.help ? 0 : 2);
  }
  const wanted = new Set(opt.paths.split(',').map((s) => s.trim()).filter(Boolean));
  const widths = opt.widths
    ? new Set(opt.widths.split(',').map((s) => Number(s.trim())).filter(Boolean))
    : null;
  const routes = PATHS.filter((p) => wanted.has(p.id));
  const viewports = VIEWPORTS.filter((v) => !widths || widths.has(v.width));
  if (opt.shots) mkdirSync(opt.shots, { recursive: true });

  const { chromium } = await import('playwright');
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', args: [...GL_ARGS] });
  } catch (err) {
    process.stderr.write(`system Chrome unavailable (${err.message.split('\n')[0]}); using bundled chromium\n`);
    browser = await chromium.launch({ args: [...GL_ARGS] });
  }

  const started = new Date().toISOString();
  const results = [];
  let red = 0;
  try {
    for (const vp of viewports) {
      for (const route of routes) {
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
          reducedMotion: route.reducedMotion ? 'reduce' : 'no-preference',
        });
        const page = await context.newPage();
        const title = `${vp.width}×${vp.height} ${route.label} @ ${opt.base}`;
        try {
          await preparePage(page, opt.base, route);
          const shotPath = opt.shots
            ? `${opt.shots}/fold-${vp.width}x${vp.height}-${route.id}.png`
            : '';
          const d = await measureFold(page, { shotPath });
          const g = gates(d);
          if (!g.plane1 || !g.plane2) red += 1;
          process.stdout.write(`${formatReport(title, d)}\n\n`);
          results.push({
            viewport: vp,
            path: route.id,
            url: route.url,
            gates: g,
            ground: d.ground,
            sumFold: d.sumFold,
            sumPlane: d.sumPlane,
            spd: d.spd,
            litDensity: d.litDensity,
            inkShare: d.inkShare,
            inkRects: d.rects.length,
            canvases: d.canvases,
            peak: d.peak,
            rects: d.rects,
          });
        } catch (err) {
          red += 1;
          process.stdout.write(`[hero-plane-dominance] ${title}\n  ERROR ${err.message}\n\n`);
          results.push({ viewport: vp, path: route.id, url: route.url, error: err.message });
        } finally {
          await context.close();
        }
      }
    }
  } finally {
    await browser.close();
  }

  const summary = results
    .map((r) =>
      r.error
        ? `${r.viewport.width}x${r.viewport.height} ${r.path}: ERROR`
        : `${r.viewport.width}x${r.viewport.height} ${r.path}: SPD=${f4(r.spd)} ` +
          `lit=${f4(r.litDensity)} G=${f4(r.ground)} ` +
          `${r.gates.plane1 && r.gates.plane2 ? 'PASS' : 'FAIL'}`,
    )
    .join('\n  ');
  process.stdout.write(
    `[hero-plane-dominance] summary (base ${opt.base}, started ${started})\n  ${summary}\n` +
      `[hero-plane-dominance] ${red === 0 ? 'ALL GATES PASS' : `${red}/${results.length} cases RED`}\n`,
  );

  if (opt.out) {
    writeFileSync(
      opt.out,
      JSON.stringify(
        { base: opt.base, started, finished: new Date().toISOString(), thresholds: { SPD_MIN, SPD_SHIP, LIT_FLOOR, DILATE_PX, PLATE_ALPHA_MIN, GROUND_PERCENTILE }, results },
        null,
        2,
      ) + '\n',
    );
    process.stdout.write(`[hero-plane-dominance] wrote ${opt.out}\n`);
  }
  process.exit(red === 0 ? 0 : 1);
}

const isEntry = (() => {
  try {
    return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
  } catch {
    return false;
  }
})();

if (isEntry) {
  main().catch((err) => {
    process.stderr.write(`[hero-plane-dominance] fatal: ${err && err.stack ? err.stack : err}\n`);
    process.exit(2);
  });
}
