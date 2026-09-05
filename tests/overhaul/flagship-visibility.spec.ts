import { PNG } from 'pngjs';
import { test, expect, type Page } from '@playwright/test';

import { settleBoot } from '../helpers/boot';

/**
 * TC-FLAGSHIP-VIS — every signature scene is *visible*.
 *
 * The scenes for `#hero`, `#about` and `#experience` were each written, each
 * compiled, each proved to mount a canvas — and on the live site at 1440 the
 * owner could not see two of them at all. Every existing scene suite asks
 * whether a canvas exists, whether it is `aria-hidden`, whether the fallback
 * survives reduced motion. None of them asks the only question a visitor asks,
 * which is whether there is anything there to look at. A shader whose output
 * is within a couple of luminance steps of the ink it draws on has passed
 * every test in the repository and shipped nothing.
 *
 * So this file photographs each scene and measures the light in it.
 *
 * The measurement has to be of the scene *alone*: a capture of `#hero` is
 * dominated by 96 px display type, and a capture of `#experience` is dominated
 * by eight white bars, so a completely black shader would still read as bright.
 * Each case therefore hides every element on the page except the scene's own
 * slot (`data-scene`, stamped by `components/gl/Scene.tsx`) and its canvas,
 * captures the slot's box, and restores the page afterwards. What is left in
 * the frame is the section's background and whatever the scene drew on it.
 *
 * Five gates per section, at `?gl=force` (this host has no GPU; the escape
 * hatch in `components/gl/useGLCapability.ts` is the only way a line of GLSL
 * is ever compiled here):
 *
 *   1. COVERAGE   >= 15% of pixels sit at least 0.06 relative luminance above
 *                 the section's own ground. Not a glint in one corner — a
 *                 structure with area.
 *   2. PEAK       max luminance >= 0.35. There is a core the eye lands on.
 *   3. MOTION     a second capture 1.5 s later differs by mean |dL| >= 0.004.
 *                 A still image is not a scene.
 *   4. FALLBACK   under `prefers-reduced-motion: reduce` the section mounts no
 *                 canvas at all, and the CSS still underneath is *still light*:
 *                 >= 8% of pixels at least 0.04 above ground (R-c13 MOT-C13-04
 *                 — the no-GL path is a still of the same light, not an empty
 *                 rectangle).
 *   5. CONTRAST   with the text restored, `tests/a11y/text-contrast.spec.ts`
 *                 stays green. That suite is the other half of this one and is
 *                 run alongside it; brightening a backdrop until the type on it
 *                 fails AA is not a fix, it is a different bug.
 *
 * The thresholds are luminance, not channel values, because the eye is not
 * linear in 8-bit sRGB: `GROUND + 0.06` over `--ink-900` is about `#474747`,
 * and a peak of 0.35 is about `#A9A9A9`. Both are numbers a person sees.
 *
 * Parameterised over `SCENES` on purpose. Adding `#skills`, `#vitrine` or
 * `#listen` to that array is the whole cost of holding those scenes to the
 * same bar, which is how the later lanes are meant to use this file.
 */

/** Relative luminance (WCAG) of one 8-bit sRGB triple. */
function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

interface LumaField {
  /** Per-pixel relative luminance, row-major. */
  values: Float64Array;
  width: number;
  height: number;
}

/**
 * Decodes a PNG buffer to a luminance field.
 *
 * `pngjs` already resolves from this repo's `node_modules` (it arrives with the
 * Playwright toolchain), so no new package is added to measure a picture.
 */
function decodeLuma(buffer: Buffer): LumaField {
  const png = PNG.sync.read(buffer);
  const values = new Float64Array(png.width * png.height);
  for (let i = 0; i < values.length; i += 1) {
    const o = i * 4;
    values[i] = relativeLuminance(png.data[o], png.data[o + 1], png.data[o + 2]);
  }
  return { values, width: png.width, height: png.height };
}

/** Share of pixels at least `delta` above `ground`. */
function coverage(field: LumaField, ground: number, delta: number): number {
  let hit = 0;
  for (let i = 0; i < field.values.length; i += 1) {
    if (field.values[i] >= ground + delta) hit += 1;
  }
  return hit / field.values.length;
}

function peak(field: LumaField): number {
  let max = 0;
  for (let i = 0; i < field.values.length; i += 1) {
    if (field.values[i] > max) max = field.values[i];
  }
  return max;
}

/** Mean absolute luminance difference between two same-sized captures. */
function meanDelta(a: LumaField, b: LumaField): number {
  const n = Math.min(a.values.length, b.values.length);
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += Math.abs(a.values[i] - b.values[i]);
  return n === 0 ? 0 : sum / n;
}

interface SceneCase {
  /** The section's `id`, without the hash. */
  section: string;
  /** The `sceneId` its `<Scene>` is given. */
  scene: string;
  /** Human label for the reported numbers. */
  label: string;
  /**
   * Share of the slot the reduced-motion still must light, at
   * `FALLBACK_DELTA` above ground. Defaults to `FALLBACK_COVERAGE_MIN`.
   *
   * `#experience` is the one section that cannot meet the default, and the
   * reason is measured rather than aesthetic: `.roleDates` (`--ink-300`) and
   * the axis labels (`--mist-400`) are small type sitting directly over the
   * scene slot, and on the ink they clear AA at 4.70:1 and 6.02:1. Raising the
   * ground beneath them by 0.04 relative luminance — what the default asks for
   * — puts both under 4.5:1. Contrast is not negotiable and the scene is, so
   * the still there is held to what the type can carry. The shader path (which
   * a reader with WebGL and motion enabled actually sees, and which no text is
   * composited against differently) meets the full bar unchanged.
   */
  fallbackCoverageMin?: number;
}

const SCENES: readonly SceneCase[] = [
  { section: 'hero', scene: 'hero-atmosphere', label: 'hero atmosphere' },
  { section: 'about', scene: 'about-field', label: 'about compass field' },
  {
    section: 'experience',
    scene: 'career-strata',
    label: 'experience strata',
    fallbackCoverageMin: 0.02,
  },
];

/** >= 15% of the slot at least this far above ground. */
const COVERAGE_DELTA = 0.06;
const COVERAGE_MIN = 0.15;
/** The scene must have a core the eye lands on. */
const PEAK_MIN = 0.35;
/** Mean |dL| between captures 1.5 s apart. */
const MOTION_MIN = 0.004;
/** The reduced-motion still is dimmer than the live scene, but it is not dark. */
const FALLBACK_DELTA = 0.04;
const FALLBACK_COVERAGE_MIN = 0.08;

/**
 * Every floor above is asked at *both* of these widths.
 *
 * The first version of this file declared one `test.use({ viewport: 1440x900 })`
 * for the whole file, and a defect walked straight through it: the hero's
 * `@media (max-width: 700px)` scrim was a flat full-frame `rgb(10 10 10 / 0.86)`
 * painted after the canvas, so on a phone with a GPU the flagship scene measured
 * 0.00% coverage / 0.0212 peak / 0.00011 motion — the exact signature of the
 * defect this suite exists to catch, at the one width it never asked about
 * (C22 09-verification.md, F1). A gate that only asks at desktop is a gate that
 * ships a black rectangle to every phone.
 *
 * Same floors at both widths. A scene is not allowed to be a desktop feature.
 */
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const;

const GL_ARGS = [
  '--no-sandbox',
  '--use-gl=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

/**
 * One `test.use` for the whole file: Playwright refuses `launchOptions` inside a
 * `describe` (it would force a new worker mid-file), and both suites want the
 * same browser anyway — a software rasteriser explicitly enabled, since this
 * host has no GPU and `?gl=force` only lifts the *application's* guard.
 */
test.use({
  deviceScaleFactor: 1,
  launchOptions: { args: GL_ARGS },
});

async function bootAt(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settleBoot(page);
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * The luminance of the ground the scene is drawn on: the nearest painted
 * background-color at or above the section, falling back to the document.
 * Every threshold in this file is relative to it, so a change of ink shifts
 * the bar with the design instead of invalidating it.
 */
async function groundLuminance(page: Page, section: string): Promise<number> {
  const rgb = await page.evaluate((id) => {
    let node: Element | null = document.getElementById(id);
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1]
          .split(/[,\s/]+/)
          .filter(Boolean)
          .map(Number);
        const alpha = parts.length > 3 ? parts[3] : 1;
        if (alpha > 0.5) return [parts[0], parts[1], parts[2]] as [number, number, number];
      }
      node = node.parentElement;
    }
    const body = getComputedStyle(document.body).backgroundColor;
    const bm = body.match(/rgba?\(([^)]+)\)/);
    if (bm) {
      const p = bm[1]
        .split(/[,\s/]+/)
        .filter(Boolean)
        .map(Number);
      return [p[0], p[1], p[2]] as [number, number, number];
    }
    return [0, 0, 0] as [number, number, number];
  }, section);
  return relativeLuminance(rgb[0], rgb[1], rgb[2]);
}

/**
 * Hides everything on the page except the named scene slot and its subtree, so
 * the capture is the scene and the ground it sits on and nothing else.
 * `visibility` rather than `display`: it takes no element out of flow, so the
 * slot's box does not move between the isolated capture and the real page.
 */
async function isolateScene(page: Page, scene: string) {
  await page.evaluate((id) => {
    const style = document.createElement('style');
    style.id = 'flagship-visibility-isolate';
    style.textContent = `
      body * { visibility: hidden !important; }
      [data-scene="${id}"], [data-scene="${id}"] * { visibility: visible !important; }
    `;
    document.head.appendChild(style);
  }, scene);
}

async function restorePage(page: Page) {
  await page.evaluate(() => {
    document.getElementById('flagship-visibility-isolate')?.remove();
  });
}

/** The slot's box, clamped to the viewport so `clip` is always capturable. */
async function slotClip(page: Page, scene: string) {
  const slot = page.locator(`[data-scene="${scene}"]`);
  await slot.waitFor({ state: 'attached', timeout: 15000 });
  await slot.evaluate((el) =>
    el.scrollIntoView({ block: 'center', behavior: 'instant' as ScrollBehavior }),
  );
  await page.waitForTimeout(250);
  const box = await slot.boundingBox();
  expect(box, `${scene}: slot has no box`).not.toBeNull();
  const viewport = page.viewportSize();
  const vw = viewport?.width ?? 1440;
  const vh = viewport?.height ?? 900;
  const x = Math.max(0, Math.min(box!.x, vw - 4));
  const y = Math.max(0, Math.min(box!.y, vh - 4));
  return {
    x,
    y,
    width: Math.max(4, Math.min(box!.width, vw - x)),
    height: Math.max(4, Math.min(box!.height, vh - y)),
  };
}

for (const viewport of VIEWPORTS) {
  test.describe(`TC-FLAGSHIP-VIS @ ${viewport.width} — signature scenes are visible`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const item of SCENES) {
      test(`TC-FLAGSHIP-VIS-${item.section.toUpperCase()} @ ${viewport.width} — ${item.label} reads as light`, async ({
        page,
      }) => {
        test.setTimeout(120000);
        await bootAt(page, '/?gl=force');

        const ground = await groundLuminance(page, item.section);
        const clip = await slotClip(page, item.scene);

        // The canvas has to exist before anything is measured: without it this
        // test would silently grade the CSS fallback and call the shader visible.
        const canvas = page.locator(`[data-scene="${item.scene}"] canvas`);
        await canvas.waitFor({ state: 'attached', timeout: 30000 });
        await page.waitForTimeout(2500);

        await isolateScene(page, item.scene);
        const first = decodeLuma(await page.screenshot({ clip }));
        await page.waitForTimeout(1500);
        const second = decodeLuma(await page.screenshot({ clip }));
        await restorePage(page);

        const cover = coverage(first, ground, COVERAGE_DELTA);
        const top = peak(first);
        const motion = meanDelta(first, second);

        // eslint-disable-next-line no-console
        console.log(
          `[flagship-visibility] ${item.section}@${viewport.width}: ground=${ground.toFixed(4)} ` +
            `coverage=${(cover * 100).toFixed(2)}% peak=${top.toFixed(4)} ` +
            `motion=${motion.toFixed(5)} box=${Math.round(clip.width)}x${Math.round(clip.height)}`,
        );

        expect(
          cover,
          `${item.label}: only ${(cover * 100).toFixed(2)}% of the scene is more than ` +
            `${COVERAGE_DELTA} luminance above its ground — the structure has no area`,
        ).toBeGreaterThanOrEqual(COVERAGE_MIN);

        expect(
          top,
          `${item.label}: brightest pixel is ${top.toFixed(3)} — the scene has no core`,
        ).toBeGreaterThanOrEqual(PEAK_MIN);

        expect(
          motion,
          `${item.label}: mean |dL| over 1.5 s is ${motion.toFixed(5)} — the scene does not move`,
        ).toBeGreaterThanOrEqual(MOTION_MIN);
      });
    }
  });

  test.describe(`TC-FLAGSHIP-VIS-STILL @ ${viewport.width} — the reduced-motion still is still light`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    for (const item of SCENES) {
      test(`TC-FLAGSHIP-VIS-STILL-${item.section.toUpperCase()} @ ${viewport.width} — ${item.label} fallback`, async ({
        page,
      }) => {
        test.setTimeout(120000);
        // Emulated on the page rather than declared as a fixture: the installed
        // Playwright's `test.use` does not accept `reducedMotion`, and this runs
        // before the first navigation, so the preference is in force for the
        // whole load — which is what `Scene` reads when it decides to mount.
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await bootAt(page, '/?gl=force');

        const ground = await groundLuminance(page, item.section);
        const clip = await slotClip(page, item.scene);

        // Reduced motion mounts no 3D at all — that is `Scene`'s contract, and
        // the light in the frame below is therefore entirely CSS.
        const canvases = await page.locator(`#${item.section} canvas`).count();
        expect(canvases, `${item.label}: reduced motion must mount no canvas`).toBe(0);

        await page.waitForTimeout(400);
        await isolateScene(page, item.scene);
        const still = decodeLuma(await page.screenshot({ clip }));
        await restorePage(page);

        const cover = coverage(still, ground, FALLBACK_DELTA);
        const required = item.fallbackCoverageMin ?? FALLBACK_COVERAGE_MIN;
        // eslint-disable-next-line no-console
        console.log(
          `[flagship-visibility:still] ${item.section}@${viewport.width}: ground=${ground.toFixed(4)} ` +
            `coverage=${(cover * 100).toFixed(2)}% peak=${peak(still).toFixed(4)}`,
        );

        expect(
          cover,
          `${item.label}: the reduced-motion still covers only ${(cover * 100).toFixed(2)}% ` +
            `at +${FALLBACK_DELTA} luminance against a floor of ${(required * 100).toFixed(0)}% — ` +
            `the fallback is an empty rectangle, not a still of the same light`,
        ).toBeGreaterThanOrEqual(required);
      });
    }
  });
}
