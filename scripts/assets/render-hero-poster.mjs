#!/usr/bin/env node
/**
 * render-hero-poster.mjs — the hero's first paint, rendered from the hero's own shader.
 *
 * `components/sections/Hero/Hero.module.css` `.stage` carries the picture a reader
 * sees before — or instead of — the WebGL canvas: the no-GL path, the
 * reduced-motion path, the JavaScript-disabled path, and the first frames of every
 * normal load. Until this script existed that picture was five CSS gradients: an
 * *impression* of the scene, drawn by hand, that measured 0.053 mean relative
 * luminance at 1440 against the 0.10 the acceptance asks for
 * (docs/delivery/evidence/v10-20260905T0515Z/G-REV/e3f0206c/08-adversarial-review.md).
 *
 * So the poster is not painted. It is *rendered*: this script runs
 * `components/sections/Hero/atmosphere.glsl.ts` — the exact source
 * `HeroAtmosphere.tsx` hands to three — in headless Chrome on SwiftShader, at
 * 3840×2160, and encodes the frame. Change the shader and re-run it, and the still
 * changes with it. There is no step in which a human touches a pixel.
 *
 *     node scripts/assets/render-hero-poster.mjs
 *
 * ── Determinism ────────────────────────────────────────────────────────────────
 * Every uniform is pinned to its *resting* value — the value the live scene holds
 * with no pointer, no scroll and the entrance fade complete:
 *
 *     uPointer   (0, 0)          no cursor on the page
 *     uScroll    (0, 0)          the hero is the top of the document
 *     uIntensity 1               the 1.5 s entrance has finished
 *     uQuality   1               the desktop path (uResolution.x ≥ 900)
 *     uInk/uLight PALETTE.ink900 / PALETTE.white, linearised (see below)
 *     uFigure    FIGURE_UV       the photograph's measured centre at 1440×900
 *     uCopyGuard COPY_GUARD_UV   the fold's measured text union at 1440×900
 *
 * The last two are HERO-SETPIECE-v3 §4.2's uniforms, and §5 requires the still to
 * be rendered *with* them: on the reduced-motion and no-GL paths the poster is
 * the whole of the plane, so a poster rendered without the guard is a different
 * picture from the one a GPU visitor gets. They are pinned here at the values the
 * live page measures at 1440×900 — 16:9, the poster's own aspect — read from the
 * DOM in `docs/delivery/evidence/.../W2-H1/t_w2_h1s1` and re-derived by
 * `tests/a11y/hero-contrast.spec.ts`, which prints the union on every run.
 *
 * That leaves exactly one free variable, `uTime`, and it is chosen by measurement
 * rather than by taste: the script sweeps the shader's slowest breathing cycle at
 * a cheap resolution, computes the mean WCAG relative luminance of every phase,
 * and renders the argmax — *the brightest resting phase*, reproducibly. The sweep
 * and its winner are printed, so a later run that picks a different phase is a
 * visible change in the shader, not a silent one.
 *
 * ── Why the colours are linearised ─────────────────────────────────────────────
 * `HeroAtmosphere` passes `new THREE.Color(PALETTE.ink900)`. three r165 has colour
 * management on by default, so a Color built from an sRGB hex is stored in the
 * Linear-sRGB working space — and this shader is a `ShaderMaterial` that writes
 * `gl_FragColor` itself, with no `<colorspace_fragment>` include, so nothing
 * converts it back on the way out. The bytes that reach the screen are therefore
 * the *linearised* ink and white mixed by `luma`. Reproducing the live frame means
 * reproducing that, so `srgbToLinear()` below is not a correction — it is the
 * pipeline, copied.
 *
 * ── Why raw WebGL rather than three ────────────────────────────────────────────
 * The GLSL is imported from the component's own module (this script copies the
 * `.ts` to a `.mjs` and imports it — the file contains no TypeScript syntax, only
 * two exported template literals, so the copy is byte-identical shader source).
 * The only thing three contributes to this draw is the `position` attribute that
 * `drei`'s `ScreenQuad` supplies, so the script declares that attribute and draws
 * the same screen-filling triangle. Nothing else about the frame is three's.
 */

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { chromium } from '@playwright/test';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');

/** The shader, and the component that owns it. */
const GLSL_SOURCE = join(ROOT, 'components', 'sections', 'Hero', 'atmosphere.glsl.ts');

/** Where the poster lands, and what `.stage` names in its `url()`. */
const OUT_AVIF = join(ROOT, 'public', 'assets', 'hero-atmosphere-poster.avif');

/** The source resolution. 4K so the still holds up on a 2× desktop panel. */
const WIDTH = 3840;
const HEIGHT = 2160;

/** The asset budget the static audit enforces for images (TC-NFR-PERF). */
/**
 * 60 kB, not the audit's 500 kB. HERO-SETPIECE-v3 §9 S2 pins the poster tighter
 * than the general image budget because on the reduced-motion and no-GL paths it
 * *is* the plane, and it is fetched on the critical path of the first fold.
 */
const BUDGET_BYTES = 60 * 1024;

/**
 * The phase sweep. The slowest thing in this shader is `sin(uTime * 0.062 + 1.9)`
 * — a period of about 101 s — but the two pools, which carry most of the frame's
 * brightness, breathe at 0.56 and 0.43 rad/s (11.2 s and 14.6 s). Sweeping 32 s at
 * 0.2 s covers both pools twice and the shafts' own 0.09 rad/s swing through its
 * brightest quarter, which is all the argmax can use.
 */
/**
 * §4.2 uniforms at the poster's aspect, in this shader's uv (origin bottom-left).
 *
 * `FIGURE_UV` is the photograph's centre: the figure renders x 522→1368, y 88→560
 * at 1440×900 (t_w2_h1s1 measurements), so its centre is (945, 324) → uv
 * (0.6563, 0.6400).
 *
 * `COPY_GUARD_UV` is the union of the fold's text rects at the same width —
 * x 96→1030, y 480→860 → uv (0.0667, 0.0444, 0.7153, 0.4667) — the same rect the
 * live page writes into the uniform, so the still and the shader flag the lamp in
 * the same place.
 */
const FIGURE_UV = [0.6563, 0.64];
const COPY_GUARD_UV = [0.0667, 0.0444, 0.7153, 0.4667];

const SWEEP_SECONDS = 32;
const SWEEP_STEP = 0.2;
/** Cheap enough that 161 phases cost less than one 4K frame; same 16:9 aspect. */
const SWEEP_WIDTH = 480;
const SWEEP_HEIGHT = 270;

/**
 * The browser. System Chrome with the software rasteriser explicitly enabled —
 * the same four flags `tests/overhaul/flagship-visibility.spec.ts` launches with,
 * because this host has no GPU and the poster must be the frame the tests measure.
 */
const CHROME = '/usr/bin/google-chrome';
const GL_ARGS = [
  '--no-sandbox',
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

/** sRGB → Linear-sRGB, the transfer function three's ColorManagement applies. */
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** A `#rrggbb` string as the linear-space triple the shader actually receives. */
function linearTriple(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((b) => srgbToLinear(b / 255));
}

/** Load the component's shader source without a TypeScript toolchain in the way. */
async function loadShaders() {
  const tmp = join(ROOT, 'node_modules', '.cache', 'hero-poster');
  mkdirSync(tmp, { recursive: true });
  const copy = join(tmp, 'atmosphere.glsl.mjs');
  copyFileSync(GLSL_SOURCE, copy);
  const mod = await import(`${pathToFileURL(copy).href}?v=${Date.now()}`);
  if (!mod.atmosphereVertexShader || !mod.atmosphereFragmentShader) {
    throw new Error(`${GLSL_SOURCE} did not export both shaders`);
  }
  return mod;
}

/** The capture page: one canvas, one triangle, one fragment program. */
function capturePage(vertexShader, fragmentShader, ink, light, FIGURE_UV, COPY_GUARD_UV) {
  return `<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;padding:0;background:#000;overflow:hidden}
    canvas{display:block}
  </style><canvas id="c"></canvas><script>
  const VERT = ${JSON.stringify(vertexShader)};
  const FRAG = ${JSON.stringify(fragmentShader)};
  const INK = ${JSON.stringify(ink)};
  const LIGHT = ${JSON.stringify(light)};
  const FIGURE = ${JSON.stringify(FIGURE_UV)};
  const GUARD = ${JSON.stringify(COPY_GUARD_UV)};
  const canvas = document.getElementById('c');
  // The same attributes components/gl/GLCanvas.tsx asks the driver for, plus the
  // preserved buffer a screenshot of a canvas needs.
  const gl = canvas.getContext('webgl', {
    antialias: true, alpha: true, stencil: false, preserveDrawingBuffer: true,
  });
  if (!gl) throw new Error('no WebGL context');

  function compile(type, source) {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      throw new Error(gl.getShaderInfoLog(s) || 'shader compile failed');
    }
    return s;
  }
  // three declares the built-in attributes for a ShaderMaterial; drei's ScreenQuad
  // supplies \`position\`. This is the whole of what three contributed to the draw.
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl.VERTEX_SHADER, 'attribute vec3 position;\\n' + VERT));
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || 'program link failed');
  }
  gl.useProgram(program);

  // ScreenQuad's screen-filling triangle, in clip space.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    -1, -1, 0,  3, -1, 0,  -1, 3, 0,
  ]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 3, gl.FLOAT, false, 0, 0);

  const U = (n) => gl.getUniformLocation(program, n);

  window.renderFrame = function (width, height, time, quality) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    gl.viewport(0, 0, width, height);
    gl.uniform1f(U('uTime'), time);
    gl.uniform2f(U('uResolution'), width, height);
    gl.uniform2f(U('uPointer'), 0, 0);   // no cursor
    gl.uniform2f(U('uScroll'), 0, 0);    // the hero is the top of the document
    gl.uniform1f(U('uIntensity'), 1);    // the entrance fade has finished
    gl.uniform1f(U('uQuality'), quality);
    gl.uniform3f(U('uInk'), INK[0], INK[1], INK[2]);
    gl.uniform3f(U('uLight'), LIGHT[0], LIGHT[1], LIGHT[2]);
    gl.uniform2f(U('uFigure'), FIGURE[0], FIGURE[1]);
    gl.uniform4f(U('uCopyGuard'), GUARD[0], GUARD[1], GUARD[2], GUARD[3]);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.finish();
    return true;
  };

  // Mean WCAG relative luminance of what was just drawn, read back off the GPU.
  window.meanLuminance = function () {
    const w = canvas.width, h = canvas.height;
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const ch = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    let sum = 0;
    for (let i = 0; i < w * h; i++) {
      const o = i * 4;
      sum += 0.2126 * ch(px[o]) + 0.7152 * ch(px[o + 1]) + 0.0722 * ch(px[o + 2]);
    }
    return sum / (w * h);
  };
  window.__ready = true;
  <\/script>`;
}

async function main() {
  const { atmosphereVertexShader, atmosphereFragmentShader } = await loadShaders();
  // PALETTE.ink900 / PALETTE.white, read from lib/palette.ts so the poster can
  // never drift off the palette the audit polices.
  const paletteSource = execFileSync('node', ['-e', `
    const src = require('fs').readFileSync('${join(ROOT, 'lib', 'palette.ts')}', 'utf8');
    const pick = (k) => src.match(new RegExp(k + ":\\\\s*'(#[0-9A-Fa-f]{6})'"))[1];
    process.stdout.write(JSON.stringify({ ink900: pick('ink900'), white: pick('white') }));
  `]).toString();
  const palette = JSON.parse(paletteSource);
  const ink = linearTriple(palette.ink900);
  const light = linearTriple(palette.white);

  console.log(`[poster] shader   ${GLSL_SOURCE}`);
  console.log(`[poster] palette  ink900 ${palette.ink900} → linear ${ink.map((v) => v.toFixed(6)).join(', ')}`);
  console.log(`[poster] palette  white  ${palette.white} → linear ${light.map((v) => v.toFixed(6)).join(', ')}`);
  console.log(`[poster] chrome   ${CHROME} ${GL_ARGS.join(' ')}`);

  const browser = await chromium.launch({ executablePath: CHROME, args: GL_ARGS });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => { throw e; });
  console.log(`[poster] uFigure   ${FIGURE_UV.join(', ')}`);
  console.log(`[poster] uCopyGuard ${COPY_GUARD_UV.join(', ')} (uv x0,y0,x1,y1 — the −50% contour is this rect's own boundary)`);
  await page.setContent(capturePage(atmosphereVertexShader, atmosphereFragmentShader, ink, light, FIGURE_UV, COPY_GUARD_UV), {
    waitUntil: 'load',
  });
  await page.waitForFunction('window.__ready === true');

  // ── Phase sweep: find the brightest resting phase, by measurement ───────────
  const sweep = await page.evaluate(
    ({ seconds, step, width, height }) => {
      const out = [];
      for (let t = 0; t <= seconds + 1e-9; t += step) {
        window.renderFrame(width, height, t, 1);
        out.push([Number(t.toFixed(3)), window.meanLuminance()]);
      }
      return out;
    },
    { seconds: SWEEP_SECONDS, step: SWEEP_STEP, width: SWEEP_WIDTH, height: SWEEP_HEIGHT },
  );
  const best = sweep.reduce((a, b) => (b[1] > a[1] ? b : a));
  const worst = sweep.reduce((a, b) => (b[1] < a[1] ? b : a));
  const frame0 = sweep[0];
  console.log(
    `[poster] sweep    ${sweep.length} phases over ${SWEEP_SECONDS}s at ${SWEEP_WIDTH}×${SWEEP_HEIGHT}: ` +
      `min ${worst[1].toFixed(4)} @ t=${worst[0]}s · frame 0 ${frame0[1].toFixed(4)} · ` +
      `max ${best[1].toFixed(4)} @ t=${best[0]}s`,
  );

  // ── The frame ──────────────────────────────────────────────────────────────
  const chosen = best[0];
  await page.evaluate(
    ({ width, height, time }) => window.renderFrame(width, height, time, 1),
    { width: WIDTH, height: HEIGHT, time: chosen },
  );
  const luma4k = await page.evaluate(() => window.meanLuminance());
  console.log(`[poster] render   ${WIDTH}×${HEIGHT} at uTime=${chosen}s · mean luminance ${luma4k.toFixed(4)}`);

  const tmpPng = join(ROOT, 'node_modules', '.cache', 'hero-poster', 'frame.png');
  await page.locator('#c').screenshot({ path: tmpPng });
  await browser.close();

  const raw = statSync(tmpPng).size;
  console.log(`[poster] png      ${tmpPng} = ${(raw / 1048576).toFixed(2)} MB`);

  // ── Encode ─────────────────────────────────────────────────────────────────
  // AVIF, because this frame is a smooth monochrome field and AV1's transform
  // holds it far below the 500 kB image budget where WebP's would not. Quality
  // walks down only if a run ever exceeds the budget, so the committed asset is
  // the best encode that fits rather than a fixed guess.
  mkdirSync(dirname(OUT_AVIF), { recursive: true });
  let encoded = null;
  for (const quality of [72, 66, 60, 54, 48, 42, 36]) {
    execFileSync('magick', [tmpPng, '-quality', String(quality), '-define', 'heic:speed=4', OUT_AVIF]);
    const size = statSync(OUT_AVIF).size;
    console.log(`[poster] avif     -quality ${quality} → ${(size / 1024).toFixed(1)} kB`);
    if (size <= BUDGET_BYTES) { encoded = { quality, size }; break; }
  }
  if (!encoded) {
    rmSync(OUT_AVIF, { force: true });
    throw new Error(`no AVIF quality kept the poster under ${BUDGET_BYTES} bytes`);
  }

  const probe = execFileSync('magick', ['identify', '-format', '%wx%h', OUT_AVIF]).toString();
  console.log(
    `[poster] done     ${OUT_AVIF} · ${probe} · ${(encoded.size / 1024).toFixed(1)} kB ` +
      `(budget ${(BUDGET_BYTES / 1024).toFixed(0)} kB) · q${encoded.quality} · uTime=${chosen}s`,
  );
  if (!existsSync(OUT_AVIF)) throw new Error('the poster was not written');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
