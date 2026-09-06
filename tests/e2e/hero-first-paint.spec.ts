import { test, expect } from '@playwright/test';

import type * as Instrument from '../../scripts/validate/hero_plane_dominance.mjs';

/**
 * TC-HERO-GL-01/02 — the two paths are one picture (HERO-SETPIECE-v3 §5, §8,
 * slice S2).
 *
 * GL-01  `?gl=force`: zero `pageerror`s and at least one canvas **inside the
 *        declared plane**. A canvas that exists somewhere on the page is not
 *        evidence that the plane is the thing carrying the light, and a page-wide
 *        crash for GPU visitors has shipped here before (memory:
 *        forgotten-mistory-webgl-headless-verify).
 * GL-02  reduced motion: zero canvases anywhere in `#hero` (Scene's contract),
 *        and the poster still painted — Σ_fold m / (W·H) ≥ 0.045, the same
 *        PLANE-2 floor, read with the same instrument. A blank rectangle is the
 *        failure this catches.
 *
 * The luminance is `hero_plane_dominance.mjs`'s, so this file and the SPD file
 * cannot disagree about the frame. Thresholds are the brief's exactly; lowering
 * one to make a run green is a violation (t_w2_h1s2 QUALITY GATES).
 */

/** §8 PLANE-02 / GL-02 — the same floor, because it is the same measurement. */
const LIT_FLOOR = 0.045;

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 834, height: 1194 },
  { width: 390, height: 844 },
] as const;

const GL_ROUTE = { id: 'gl', label: '/?gl=force (shader, settled)', url: '/?gl=force', reducedMotion: false };
const STILL_ROUTE = { id: 'still', label: 'prefers-reduced-motion still', url: '/', reducedMotion: true };

test.use({
  deviceScaleFactor: 1,
  launchOptions: {
    args: [
      '--no-sandbox',
      '--use-gl=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
      '--disable-lcd-text',
    ],
  },
});

async function instrument(): Promise<typeof Instrument> {
  return import('../../scripts/validate/hero_plane_dominance.mjs');
}

for (const viewport of VIEWPORTS) {
  const size = `${viewport.width}×${viewport.height}`;

  test.describe(`TC-HERO-GL @ ${size} — the plane paints on every path`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`TC-HERO-GL-01 @ ${size} — ?gl=force: 0 page errors, ≥ 1 canvas in the plane`, async ({
      page,
      baseURL,
    }) => {
      test.setTimeout(120000);
      const spd = await instrument();
      const errors: string[] = [];
      page.on('pageerror', (e) => errors.push(e.message));

      await spd.preparePage(page, baseURL ?? 'http://127.0.0.1:5608', GL_ROUTE);

      const inPlane = await page.locator('[data-plane="hero"] canvas').count();
      // eslint-disable-next-line no-console
      console.log(`[hero-gl-01] ${size} — canvases in [data-plane="hero"] = ${inPlane}, pageerrors = ${errors.length}`);

      expect(errors, `GL-01 at ${size}: ?gl=force threw ${errors.length} page error(s)`).toEqual([]);
      expect(
        inPlane,
        `GL-01 at ${size}: no canvas inside the declared plane — the light is not in the plane`,
      ).toBeGreaterThanOrEqual(1);
    });

    test(`TC-HERO-GL-02 @ ${size} — reduced motion: 0 canvases, poster lit ≥ ${LIT_FLOOR}`, async ({
      page,
      baseURL,
    }) => {
      test.setTimeout(120000);
      const spd = await instrument();
      const { canvases } = await spd.preparePage(page, baseURL ?? 'http://127.0.0.1:5608', STILL_ROUTE);
      expect(canvases, `GL-02 at ${size}: reduced motion must mount no canvas`).toBe(0);

      const d = await spd.measureFold(page);
      // eslint-disable-next-line no-console
      console.log(spd.formatReport(`${size} ${STILL_ROUTE.label} (GL-02)`, d));

      expect(
        d.litDensity,
        `GL-02 at ${size}: the reduced-motion fold measures Σ_fold m / (W·H) = ` +
          `${d.litDensity.toFixed(4)} < ${LIT_FLOOR} — the poster is not painting the plane`,
      ).toBeGreaterThanOrEqual(LIT_FLOOR);
    });
  });
}
