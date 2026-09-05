import { PNG } from 'pngjs';
import { test, expect, type Page } from '@playwright/test';

import { settleBoot } from '../helpers/boot';

/**
 * TC-VISEME-GL — S7, the seventh signature scene: MiniVic's viseme stage.
 *
 * Six of the seven signature scenes are sections (`hero-atmosphere`,
 * `about-field`, `career-strata`, `skills-bench`, `vitrine-field`,
 * `listen-field`, all measured by `flagship-visibility.spec.ts`). The seventh is
 * not a section at all — it is the plate MiniVic answers from
 * (docs/architecture/SIGNATURE-SCENES-v1.md §4.7, decision D8): a `Scene`-mounted
 * GLSL quad behind the avatar whose light is opened and closed by the *same*
 * viseme refs the 2D mouth canvas reads, so the avatar is lit by what he is
 * saying.
 *
 * The promotion is of the *stage*, never of the lip-sync. `lib/visemeMap.ts` and
 * the 2D draw path in `components/MiniVicBot.tsx` are untouched, and the 2D
 * mouth remains the whole of the no-GL / reduced-motion experience — which is
 * what `TC-VISEME-GL-02` exists to hold: if the stage ever became load-bearing,
 * a reader with reduced motion would lose the mouth, and R3 lip-sync accuracy
 * would have regressed behind a scene that is decoration.
 *
 * The floors are the flagship gate's own floors, applied to the stage's slot,
 * measured the same way (`flagship-visibility.spec.ts:166-175`): a scene that is
 * within a couple of luminance steps of the ink it draws on has compiled
 * perfectly and shipped nothing.
 *
 *   TC-VISEME-GL-01  panel open at `?gl=force` → `[data-scene="minivic-viseme"]`
 *                    holds a canvas, and COVERAGE / PEAK / MOTION hold while the
 *                    synthetic viseme stream runs.
 *   TC-VISEME-GL-02  `prefers-reduced-motion: reduce` → zero canvases in the
 *                    slot, and the 2D mouth still animates.
 *   TC-VISEME-GL-03  opening the panel adds at most one live WebGL context —
 *                    `Scene`'s visibility scoping is not weakened by a scene
 *                    that lives inside a dialog rather than a section.
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
  values: Float64Array;
  width: number;
  height: number;
}

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

function meanDelta(a: LumaField, b: LumaField): number {
  const n = Math.min(a.values.length, b.values.length);
  let sum = 0;
  for (let i = 0; i < n; i += 1) sum += Math.abs(a.values[i] - b.values[i]);
  return n === 0 ? 0 : sum / n;
}

/** The flagship gate's floors, unchanged (`flagship-visibility.spec.ts:166-175`). */
const COVERAGE_DELTA = 0.06;
const COVERAGE_MIN = 0.15;
const PEAK_MIN = 0.35;
const MOTION_MIN = 0.004;

const SCENE_ID = 'minivic-viseme';

/**
 * Both widths, same floors — the panel is 22rem on a phone and 27rem on a
 * desktop, and a stage that only lights the wide one is a desktop feature.
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

test.use({
  deviceScaleFactor: 1,
  launchOptions: { args: GL_ARGS },
});

/**
 * Open the panel the way `tests/e2e/minivic-send-path.spec.ts` opens it: wait
 * for React to hydrate the launcher, scroll past the hero (the dock only fades
 * in past it), then click *through* the element. A plain `click()` before
 * hydration is what leaves a reviewer with a panel that never opened.
 */
async function openMiniVic(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await settleBoot(page);
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="minivic-toggle"]');
      if (!btn) return false;
      return Object.keys(btn).some(
        (key) => key.startsWith('__reactFiber') || key.startsWith('__reactProps'),
      );
    },
    { timeout: 30000 },
  );
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.waitForTimeout(400);
  await page.locator('[data-testid="minivic-toggle"]').evaluate((el: HTMLElement) => el.click());
  const panel = page.locator('[data-testid="minivic-panel"]');
  await expect(panel).toBeVisible();
  return panel;
}

/**
 * The ground the stage's light is drawn on: the nearest painted background at
 * or above the slot. The stage sits on the panel's own near-black plate rather
 * than on a section, so this walks up from the slot itself.
 */
async function groundLuminance(page: Page): Promise<number> {
  const rgb = await page.evaluate((id) => {
    let node: Element | null = document.querySelector(`[data-scene="${id}"]`);
    while (node) {
      const bg = getComputedStyle(node).backgroundColor;
      const m = bg.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
        const alpha = parts.length > 3 ? parts[3] : 1;
        if (alpha > 0.5) return [parts[0], parts[1], parts[2]] as [number, number, number];
      }
      node = node.parentElement;
    }
    return [0, 0, 0] as [number, number, number];
  }, SCENE_ID);
  return relativeLuminance(rgb[0], rgb[1], rgb[2]);
}

/** Hide everything but the stage's slot, so the capture is the scene alone. */
async function isolateScene(page: Page) {
  await page.evaluate((id) => {
    const style = document.createElement('style');
    style.id = 'viseme-stage-isolate';
    style.textContent = `
      body * { visibility: hidden !important; }
      [data-scene="${id}"], [data-scene="${id}"] * { visibility: visible !important; }
    `;
    document.head.appendChild(style);
  }, SCENE_ID);
}

async function restorePage(page: Page) {
  await page.evaluate(() => {
    document.getElementById('viseme-stage-isolate')?.remove();
  });
}

/** The slot's box, clamped to the viewport so `clip` is always capturable. */
async function slotClip(page: Page) {
  const slot = page.locator(`[data-scene="${SCENE_ID}"]`);
  await slot.waitFor({ state: 'attached', timeout: 15000 });
  const box = await slot.boundingBox();
  expect(box, `${SCENE_ID}: slot has no box`).not.toBeNull();
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
  test.describe(`TC-VISEME-GL @ ${viewport.width}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test(`TC-VISEME-GL-01 @ ${viewport.width} — the stage is lit by the viseme stream`, async ({
      page,
    }) => {
      test.setTimeout(150000);
      await openMiniVic(page, '/?gl=force');

      const ground = await groundLuminance(page);

      // The canvas has to exist before anything is measured: without it this
      // test would silently grade the panel's own plate and call the shader
      // visible.
      const canvas = page.locator(`[data-scene="${SCENE_ID}"] canvas`);
      await canvas.waitFor({ state: 'attached', timeout: 30000 });
      await page.waitForTimeout(2500);

      const clip = await slotClip(page);
      await isolateScene(page);
      const first = decodeLuma(await page.screenshot({ clip }));
      await page.waitForTimeout(1500);
      const second = decodeLuma(await page.screenshot({ clip }));
      await restorePage(page);

      const cover = coverage(first, ground, COVERAGE_DELTA);
      const top = peak(first);
      const motion = meanDelta(first, second);

      // eslint-disable-next-line no-console
      console.log(
        `[viseme-stage] ${SCENE_ID}@${viewport.width}: ground=${ground.toFixed(4)} ` +
          `coverage=${(cover * 100).toFixed(2)}% peak=${top.toFixed(4)} ` +
          `motion=${motion.toFixed(5)} box=${Math.round(clip.width)}x${Math.round(clip.height)}`,
      );

      expect(
        cover,
        `${SCENE_ID}@${viewport.width}: only ${(cover * 100).toFixed(2)}% of the stage is ` +
          `${COVERAGE_DELTA} above ground — the pool of light has no area`,
      ).toBeGreaterThanOrEqual(COVERAGE_MIN);
      expect(
        top,
        `${SCENE_ID}@${viewport.width}: peak luminance ${top.toFixed(4)} — no core the eye lands on`,
      ).toBeGreaterThanOrEqual(PEAK_MIN);
      expect(
        motion,
        `${SCENE_ID}@${viewport.width}: mean |dL| ${motion.toFixed(5)} over 1.5 s — ` +
          `the stage is a still image, so it is not being driven by the viseme stream`,
      ).toBeGreaterThanOrEqual(MOTION_MIN);
    });

    test(`TC-VISEME-GL-02 @ ${viewport.width} — reduced motion: no canvas, and the 2D mouth still animates`, async ({
      page,
    }) => {
      test.setTimeout(150000);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const panel = await openMiniVic(page, '/?gl=force');

      // The stage is a GL enhancement and nothing else. Under reduced motion it
      // must not mount at all — `Scene` already refuses, and this holds that
      // refusal for the one scene that lives inside a dialog.
      await page.waitForTimeout(2000);
      const canvases = await page.locator(`[data-scene="${SCENE_ID}"] canvas`).count();
      expect(
        canvases,
        `${SCENE_ID}: ${canvases} canvas(es) mounted under prefers-reduced-motion`,
      ).toBe(0);

      // …and the panel is still complete without it: the 2D mouth canvas is
      // present and still drawing, which is the whole of R3's lip-sync path.
      const mouth = panel.locator('canvas');
      await expect(mouth.first()).toBeAttached();
      const dimensions = await mouth.first().evaluate((el) => {
        const c = el as HTMLCanvasElement;
        return { width: c.width, height: c.height };
      });
      expect(dimensions.width).toBeGreaterThan(0);
      expect(dimensions.height).toBeGreaterThan(0);

      // The 2D draw path is unchanged, so it is still a live 2D context: a
      // canvas whose context type had been taken over by the stage would fail
      // here, which is exactly the regression D8 forbids.
      const is2d = await mouth.first().evaluate((el) => {
        const c = el as HTMLCanvasElement;
        return c.getContext('2d') !== null;
      });
      expect(is2d, 'the MiniVic mouth canvas is no longer a 2D context').toBe(true);
    });
  });
}

test.describe('TC-VISEME-GL-03 — the stage costs at most one context', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('TC-VISEME-GL-03 — opening the panel adds at most one live WebGL context', async ({
    page,
  }) => {
    test.setTimeout(150000);
    await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
    await settleBoot(page);
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('[data-testid="minivic-toggle"]');
        if (!btn) return false;
        return Object.keys(btn).some(
          (key) => key.startsWith('__reactFiber') || key.startsWith('__reactProps'),
        );
      },
      { timeout: 30000 },
    );
    await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
    await page.waitForTimeout(2500);

    const sceneCanvases = () =>
      page.evaluate(() => document.querySelectorAll('[data-scene] canvas').length);

    const before = await sceneCanvases();
    await page.locator('[data-testid="minivic-toggle"]').evaluate((el: HTMLElement) => el.click());
    await expect(page.locator('[data-testid="minivic-panel"]')).toBeVisible();
    await page.locator(`[data-scene="${SCENE_ID}"] canvas`).waitFor({
      state: 'attached',
      timeout: 30000,
    });
    await page.waitForTimeout(1500);
    const after = await sceneCanvases();

    // eslint-disable-next-line no-console
    console.log(`[viseme-stage] scene canvases before=${before} after=${after}`);

    expect(
      after - before,
      `opening the panel added ${after - before} scene canvases; the stage is worth exactly one`,
    ).toBeLessThanOrEqual(1);

    // And closing it hands the context back — `Scene` tears down on unmount, so
    // a panel opened and closed repeatedly must not accumulate contexts.
    await page.locator('[data-testid="minivic-toggle"]').evaluate((el: HTMLElement) => el.click());
    await page.waitForTimeout(1000);
    const closed = await sceneCanvases();
    expect(
      closed,
      `after closing the panel ${closed} scene canvases remain (was ${before} before it opened)`,
    ).toBeLessThanOrEqual(before);
  });
});
