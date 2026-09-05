import { mkdirSync, writeFileSync } from 'node:fs';
import { loadavg, cpus } from 'node:os';
import { join } from 'node:path';

import { test, expect, type Page, type CDPSession } from '@playwright/test';

import { settleBoot } from '../helpers/boot';
import { discoverSceneIds } from '../helpers/scenes';

/**
 * TC-SCENE-FPS — the first measurement of R2's 60 fps clause.
 *
 * R2 has asked for 60 fps since the signature scenes were specified
 * (`docs/architecture/SIGNATURE-SCENES-v1.md`), and until this file nothing in
 * the repository had ever looked. `grep -nE 'rAF|16\.7|median' tests/perf/
 * performance.spec.ts` returns nothing: the perf suite measures transfer size,
 * LCP and CLS — all of them properties of the *load*, none of them a property
 * of a shader that runs for as long as the reader is on the page. A scene can
 * clear every existing budget and still stutter at 12 fps the entire time it is
 * on screen, and no test would have said so.
 *
 * ## What is measured, and why it is the median
 *
 * For each `sceneId`: scroll its slot into view, wait for its canvas, discard a
 * one-second warm-up, then sample at least 120 consecutive
 * `requestAnimationFrame` deltas and take the **median**.
 *
 * The median, never the mean. A mean is the wrong statistic for frame pacing in
 * both directions. One 400 ms compile hitch drags the mean of an otherwise
 * perfect 60 fps run to 20 ms and fails a scene that is fine; and a run that is
 * half 8 ms and half 25 ms averages to 16.5 ms and passes a scene that visibly
 * judders. The median answers the question a viewer actually experiences —
 * *what does a typical frame cost* — and the warm-up discard keeps first-frame
 * shader compilation out of the sample rather than letting it be averaged away.
 * P95 is recorded alongside it, so a scene with a good median and a bad tail is
 * legible in the artefact even though it is not what the gate asserts.
 *
 * Note what an rAF delta is: the cadence at which the browser *served frames*,
 * not the milliseconds of GPU work inside one. That is the right quantity here.
 * A compositor pacing at 60 Hz yields ~16.6 ms deltas while the scene keeps up
 * and ~33.3 ms the moment it drops one, so the median delta is precisely "did
 * this scene sustain 60 fps", which is what R2's clause says.
 *
 * ## Thresholds
 *
 *   TC-SCENE-FPS-01  1440x900, dsf 1, no CPU throttle       median <= 16.7 ms
 *   TC-SCENE-FPS-02  390x844, dsf 3, CPU throttle x4        median <= 20.0 ms
 *
 * These two numbers are the budget, not a dial. If a scene misses, the scene is
 * fixed or the failure is carried honestly — the threshold is never moved to
 * make a run green. The only edits this file should ever receive on a red run
 * are to the *measurement*.
 *
 * ## SwiftShader is not a GPU, and this file says so in every number it prints
 *
 * This host has no GPU. The suite launches Chromium on SwiftShader and loads
 * `/?gl=force`, because `components/gl/useGLCapability.ts` classifies a software
 * rasteriser as unsupported and would otherwise decline to compile a line of
 * GLSL — so without both, this would measure an empty div at a comfortable
 * 60 fps and report a pass.
 *
 * Per SIGNATURE-SCENES-v1 D7 and D9, that has two consequences and this file
 * honours both:
 *
 *   - Every assertion message and every artefact carries the
 *     `WEBGL_debug_renderer_info` renderer string and the label
 *     `software-rasteriser`. A green run here is **not** evidence that the scene
 *     holds 60 fps on a visitor's GPU; GPU-class confirmation is a separate,
 *     non-gating job on the Mac runner. Nothing in this file may be quoted as
 *     GPU proof.
 *   - A red run here is still a real failure. Software rasterisation is slower
 *     than a GPU, not differently-behaved: a scene that cannot hold pace on
 *     SwiftShader is a scene doing too much work per frame, and the fix is in
 *     the shader, not in the label. "It is only SwiftShader" is not a defence.
 *
 * The host is shared and the numbers are load-sensitive, so each artefact also
 * records `os.loadavg()` and the core count at the moment of measurement. A
 * median read off a box at load 8 on four cores carries its own context.
 *
 * ## Scene list
 *
 * Parameterised over `tests/helpers/scenes.ts`, which reads every
 * `sceneId="..."` out of `components/` rather than repeating a list here. A lane
 * landing `vitrine-field` or `listen-field` is measured by this file the moment
 * its `<Scene>` mounts, with nothing to remember. See that file for how
 * `tests/overhaul/flagship-visibility.spec.ts` adopts the same list.
 */

/** TC-SCENE-FPS-01: one frame of a 60 Hz budget. Not negotiable. */
const DESKTOP_BUDGET_MS = 16.7;

/** TC-SCENE-FPS-02: the phone allowance. Not negotiable. */
const PHONE_BUDGET_MS = 20.0;

/** Frames thrown away before sampling starts — shader compile, first upload. */
const WARMUP_MS = 1000;

/** The sample R2 is judged on. */
const TARGET_SAMPLES = 120;

/**
 * Wall-clock ceiling on collecting those 120 frames.
 *
 * A scene serving frames slower than ~375 ms each will not reach 120 samples
 * inside this window. That is not a reason to hang until Playwright's own
 * timeout fires and reports an infrastructure failure over a performance one:
 * the run stops, keeps what it measured, and fails on the number.
 */
const SAMPLE_DEADLINE_MS = 45000;

/**
 * Below this many samples the median is noise, and reporting it as a
 * measurement would be a fabricated result. The test fails, loudly, as an
 * insufficient sample rather than as a threshold breach — a different defect
 * with a different fix.
 */
const MIN_TRUSTWORTHY_SAMPLES = 24;

/**
 * Where the per-scene JSON lands.
 *
 * Defaults inside `test-results/` so the spec stays durable across cycles; a
 * run capturing evidence points `SCENE_FPS_ARTEFACT_DIR` at that cycle's
 * evidence directory. The spec never hard-codes a dated path.
 */
const ARTEFACT_DIR =
  process.env.SCENE_FPS_ARTEFACT_DIR ?? join(process.cwd(), 'test-results', 'scene-framerate');

const GL_ARGS = [
  '--no-sandbox',
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

/**
 * One `test.use` for the whole file. Playwright refuses `launchOptions` inside
 * a `describe` — it would force a new worker mid-file — and both viewports want
 * the same browser: a software rasteriser explicitly enabled, because
 * `?gl=force` only lifts the *application's* guard, not Chromium's.
 */
test.use({ launchOptions: { args: GL_ARGS } });

const SCENE_IDS = discoverSceneIds();

interface FrameSample {
  /** Consecutive rAF deltas, milliseconds, warm-up already discarded. */
  deltas: number[];
  /** How long sampling actually ran, for the deadline case. */
  elapsedMs: number;
}

interface SceneMeasurement {
  testCase: string;
  sceneId: string;
  viewport: { width: number; height: number; deviceScaleFactor: number };
  cpuThrottlingRate: number;
  /** Raw `WEBGL_debug_renderer_info` UNMASKED_RENDERER_WEBGL string. */
  renderer: string;
  /** `software-rasteriser` when the renderer is SwiftShader / ANGLE software. */
  rendererLabel: string;
  medianMs: number;
  p95Ms: number;
  minMs: number;
  maxMs: number;
  sampleCount: number;
  targetSamples: number;
  samplingElapsedMs: number;
  budgetMs: number;
  pass: boolean;
  host: { loadavg: [number, number, number]; cores: number };
  measuredAt: string;
  note: string;
}

/** Median of an unsorted list. Even counts average the two middles. */
function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Nearest-rank P95 — recorded, never asserted. */
function percentile(values: readonly number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.min(Math.max(rank, 1), sorted.length) - 1];
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * True when the renderer string names a software rasteriser.
 *
 * SwiftShader reports variously as `SwiftShader Device`, or wrapped by ANGLE as
 * `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device ...), SwiftShader driver)`.
 * `llvmpipe` and Chromium's own "Software Rasterizer" string are here so the
 * label stays correct if the host's GL stack is swapped.
 */
function isSoftwareRasteriser(renderer: string): boolean {
  return /swiftshader|llvmpipe|software\s*rasteri[sz]er|ANGLE.*software/i.test(renderer);
}

/**
 * The renderer this browser will actually draw the scenes with.
 *
 * Read from a throwaway context rather than from the scene's own canvas: the
 * scene canvas belongs to React Three Fiber, and calling `getExtension` on it
 * mid-run is an interference with the thing being measured.
 */
async function readRenderer(page: Page): Promise<string> {
  return page.evaluate(() => {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl2') ??
      canvas.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return 'no-webgl-context';
    const ext = gl.getExtension('WEBGL_debug_renderer_info') as {
      UNMASKED_RENDERER_WEBGL: number;
    } | null;
    const raw = ext
      ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    return typeof raw === 'string' && raw.length > 0 ? raw : 'renderer-unavailable';
  });
}

/** Load the page on the shader path and get past the boot wipe. */
async function bootShaderPath(page: Page): Promise<void> {
  await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
  await settleBoot(page);
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Scroll the scene's slot to the middle of the viewport and wait for its canvas.
 *
 * Sections below the fold are behind `InViewGate`, so the canvas does not exist
 * until the slot is on screen — sampling before this resolves would measure an
 * idle page and call it a fast scene.
 */
async function bringSceneOnScreen(page: Page, sceneId: string): Promise<void> {
  const slot = page.locator(`[data-scene="${sceneId}"]`);
  await slot.waitFor({ state: 'attached', timeout: 15000 });
  await slot.evaluate((el) =>
    el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior }),
  );
  await page
    .locator(`[data-scene="${sceneId}"] canvas`)
    .first()
    .waitFor({ state: 'attached', timeout: 20000 });
}

/**
 * Sample rAF deltas in the page.
 *
 * The warm-up is spent inside the same rAF chain rather than in a `setTimeout`,
 * so the frame immediately before the first recorded delta is a real frame and
 * the first delta is a real inter-frame interval, not an interval that straddles
 * a gap in the callback chain.
 */
async function sampleFrameDeltas(page: Page): Promise<FrameSample> {
  return page.evaluate(
    ({ warmupMs, target, deadlineMs }) =>
      new Promise<FrameSample>((resolve) => {
        const deltas: number[] = [];
        const started = performance.now();
        const warmUntil = started + warmupMs;
        let previous = 0;

        const tick = (now: number) => {
          if (now < warmUntil) {
            previous = now;
            requestAnimationFrame(tick);
            return;
          }
          if (previous > 0) deltas.push(now - previous);
          previous = now;

          if (deltas.length >= target || now - started >= deadlineMs) {
            resolve({ deltas, elapsedMs: now - started });
            return;
          }
          requestAnimationFrame(tick);
        };

        requestAnimationFrame(tick);
      }),
    { warmupMs: WARMUP_MS, target: TARGET_SAMPLES, deadlineMs: SAMPLE_DEADLINE_MS },
  );
}

/** Write one scene's numbers to disk. Called before the assertion, always. */
function writeArtefact(measurement: SceneMeasurement): string {
  mkdirSync(ARTEFACT_DIR, { recursive: true });
  const path = join(ARTEFACT_DIR, `${measurement.testCase}-${measurement.sceneId}.json`);
  writeFileSync(path, `${JSON.stringify(measurement, null, 2)}\n`, 'utf8');
  return path;
}

interface Budget {
  testCase: string;
  budgetMs: number;
  deviceScaleFactor: number;
  cpuThrottlingRate: number;
}

/**
 * One scene, one viewport, one number.
 *
 * The CPU throttle is applied *after* the page has booted and the canvas has
 * mounted, and lifted before the context closes. Throttling the boot as well
 * would turn a 20 s preloader wait into a timeout and report an infrastructure
 * failure where a frame-rate measurement was wanted; what TC-SCENE-FPS-02 is
 * about is the steady-state cost of a frame on a slow device, not the cost of
 * getting there.
 */
async function measureScene(page: Page, sceneId: string, budget: Budget): Promise<void> {
  await bootShaderPath(page);
  const renderer = await readRenderer(page);
  const rendererLabel = isSoftwareRasteriser(renderer) ? 'software-rasteriser' : 'gpu-reported';

  await bringSceneOnScreen(page, sceneId);

  let cdp: CDPSession | null = null;
  if (budget.cpuThrottlingRate > 1) {
    cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: budget.cpuThrottlingRate });
  }

  let sample: FrameSample;
  try {
    sample = await sampleFrameDeltas(page);
  } finally {
    if (cdp) {
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }).catch(() => {});
      await cdp.detach().catch(() => {});
    }
  }

  const viewport = page.viewportSize();
  const enough = sample.deltas.length >= MIN_TRUSTWORTHY_SAMPLES;
  const medianMs = enough ? median(sample.deltas) : Number.NaN;
  const p95Ms = enough ? percentile(sample.deltas, 95) : Number.NaN;

  const provenance =
    rendererLabel === 'software-rasteriser'
      ? `renderer="${renderer}" [software-rasteriser] — SIGNATURE-SCENES-v1 D9: this is ` +
        `NOT GPU proof, and a miss here is still a real failure.`
      : `renderer="${renderer}" [gpu-reported] — unverified GPU class; GPU-class ` +
        `confirmation is a separate non-gating job (D9).`;

  const measurement: SceneMeasurement = {
    testCase: budget.testCase,
    sceneId,
    viewport: {
      width: viewport?.width ?? 0,
      height: viewport?.height ?? 0,
      deviceScaleFactor: budget.deviceScaleFactor,
    },
    cpuThrottlingRate: budget.cpuThrottlingRate,
    renderer,
    rendererLabel,
    medianMs: enough ? round(medianMs) : -1,
    p95Ms: enough ? round(p95Ms) : -1,
    minMs: enough ? round(Math.min(...sample.deltas)) : -1,
    maxMs: enough ? round(Math.max(...sample.deltas)) : -1,
    sampleCount: sample.deltas.length,
    targetSamples: TARGET_SAMPLES,
    samplingElapsedMs: round(sample.elapsedMs),
    budgetMs: budget.budgetMs,
    pass: enough && medianMs <= budget.budgetMs,
    host: { loadavg: loadavg() as [number, number, number], cores: cpus().length },
    measuredAt: new Date().toISOString(),
    note: provenance,
  };
  const artefactPath = writeArtefact(measurement);

  const context =
    `${budget.testCase} ${sceneId} @ ${measurement.viewport.width}x${measurement.viewport.height} ` +
    `dsf${budget.deviceScaleFactor} cpu-x${budget.cpuThrottlingRate} — ${provenance} ` +
    `host loadavg=[${measurement.host.loadavg.map((n) => n.toFixed(2)).join(', ')}] ` +
    `cores=${measurement.host.cores}; artefact=${artefactPath}`;

  expect(
    sample.deltas.length,
    `${context} — only ${sample.deltas.length} rAF delta(s) in ` +
      `${round(sample.elapsedMs)} ms; below ${MIN_TRUSTWORTHY_SAMPLES} the median is noise, ` +
      `so this is reported as an unusable sample rather than a measurement.`,
  ).toBeGreaterThanOrEqual(MIN_TRUSTWORTHY_SAMPLES);

  expect(
    medianMs,
    `${context} — median rAF delta ${round(medianMs)} ms over ${sample.deltas.length} frames ` +
      `(p95 ${round(p95Ms)} ms, min ${round(Math.min(...sample.deltas))} ms, ` +
      `max ${round(Math.max(...sample.deltas))} ms); budget ${budget.budgetMs} ms. ` +
      `The budget is fixed — fix the scene or carry the failure, never the threshold.`,
  ).toBeLessThanOrEqual(budget.budgetMs);
}

test.describe('TC-SCENE-FPS-01 — desktop 1440x900, median rAF <= 16.7 ms', () => {
  test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  test.describe.configure({ timeout: 180000 });

  for (const sceneId of SCENE_IDS) {
    test(`TC-SCENE-FPS-01 ${sceneId}: median frame <= ${DESKTOP_BUDGET_MS} ms`, async ({
      page,
    }) => {
      await measureScene(page, sceneId, {
        testCase: 'TC-SCENE-FPS-01',
        budgetMs: DESKTOP_BUDGET_MS,
        deviceScaleFactor: 1,
        cpuThrottlingRate: 1,
      });
    });
  }
});

test.describe('TC-SCENE-FPS-02 — phone 390x844 dsf3, CPU x4, median rAF <= 20.0 ms', () => {
  test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
  test.describe.configure({ timeout: 180000 });

  for (const sceneId of SCENE_IDS) {
    test(`TC-SCENE-FPS-02 ${sceneId}: median frame <= ${PHONE_BUDGET_MS} ms`, async ({ page }) => {
      await measureScene(page, sceneId, {
        testCase: 'TC-SCENE-FPS-02',
        budgetMs: PHONE_BUDGET_MS,
        deviceScaleFactor: 3,
        cpuThrottlingRate: 4,
      });
    });
  }
});
