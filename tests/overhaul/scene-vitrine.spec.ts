import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { test, expect, type Page } from '@playwright/test';

/**
 * SPEC-v10 §R2 / c20 — `#vitrine` carries a flagship scene, and its trace-on
 * reads as a trace.
 *
 * Before this file `#vitrine` was one of the three sections R-c13 M-2 counted
 * with `canvases: 0` at `?gl=force`: six SVG drawings on bare ink and nothing
 * behind the rail. R2 asks for a signature GLSL scene per section; this is
 * `#vitrine`'s, and it answers the one thing the section already does — the
 * raking light. The field pools under the plate the rail has snapped to
 * (`uLit`) and drifts as the rail is scrolled (`uScroll`), so the light under
 * the cabinet and the light on the plate can never disagree.
 *
 * The same run closes two motion findings the field must not paper over:
 *
 * - **MOT-C13-03.** The trace-on was 6.67 ms between consecutive strokes
 *   against a 720 ms stroke, so a 25-stroke plate spent its whole stagger in
 *   ~160 ms and read as one fade. The budget moves to sequence: 320 ms strokes,
 *   `min(28ms, 520ms / max(1, n - 1))` of stagger, labels at 860 ms — still
 *   inside R-c8 C-02's 900 ms landing.
 * - **MOT-C13-06.** The rail is a real snap carousel but `scroll-behavior` was
 *   only ever declared inside the reduced-motion block, so plate-to-plate moves
 *   jumped. Smooth under no-preference, auto under reduce.
 *
 * Every mount test runs at `?gl=force`: this host is a software rasteriser and
 * `components/gl/useGLCapability.ts` declines those, so without the escape
 * hatch the suite would pass having compiled no GLSL at all.
 */

const VITRINE = '#vitrine';
const FIELD = `${VITRINE} [data-lit-index]`;
const RAIL = `${VITRINE} ol`;
const PLATE = `${VITRINE} ol li`;

const VITRINE_DIR = join(process.cwd(), 'components/sections/Vitrine');
const GLSL_SOURCE = join(VITRINE_DIR, 'vitrine.glsl.ts');
const FIELD_SOURCE = join(VITRINE_DIR, 'VitrineField.tsx');

/**
 * This host has no GPU. Chromium is launched on SwiftShader so a context can be
 * created at all, and `?gl=force` is what gets past `useGLCapability`'s decline
 * of software rasterisers — otherwise the scene would ship having only ever
 * been tested down its fallback path.
 */
test.use({
  launchOptions: {
    args: [
      '--no-sandbox',
      '--use-gl=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  },
});

async function waitForPageReady(page: Page) {
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/** Walks `#vitrine` into view with the software-rasteriser guard overridden. */
async function settleVitrineWithGL(page: Page) {
  await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.locator(VITRINE).scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
}

test.describe('TC-SCENE-VITRINE: a field of light under the cabinet', () => {
  test.describe.configure({ timeout: 120000 });

  test('TC-SCENE-VITRINE-01: exactly one canvas mounts under the rail once the section is in view', async ({
    page,
  }) => {
    await settleVitrineWithGL(page);

    const canvases = page.locator(`${VITRINE} canvas`);
    await expect(canvases).toHaveCount(1);

    const box = await canvases.first().boundingBox();
    expect(box, 'the #vitrine canvas has no box').not.toBeNull();
    expect(box!.width, 'the #vitrine canvas is too small to be drawing').toBeGreaterThan(100);
    expect(box!.height, 'the #vitrine canvas is too small to be drawing').toBeGreaterThan(100);
  });

  test('TC-SCENE-VITRINE-02: the canvas is aria-hidden, behind the plates and behind the heading', async ({
    page,
  }) => {
    await settleVitrineWithGL(page);
    await expect(page.locator(`${VITRINE} canvas`)).toHaveCount(1);

    const hidden = await page
      .locator(`${VITRINE} canvas`)
      .first()
      .evaluate((el) => el.closest('[aria-hidden="true"]') !== null);
    expect(hidden, 'the #vitrine canvas is not inside an aria-hidden slot').toBe(true);

    // The reading column is never behind the light: the heading and the lit
    // plate's own title both resolve to themselves, not to the canvas.
    const overHeading = await page.locator('#vitrine-title').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.left + 4, r.top + r.height / 2)?.tagName ?? 'none';
    });
    expect(overHeading).not.toBe('CANVAS');

    const zOrder = await page.evaluate(() => {
      const field = document.querySelector('#vitrine [data-lit-index]');
      const rail = document.querySelector('#vitrine ol');
      return {
        field: field ? getComputedStyle(field).zIndex : 'missing',
        rail: rail ? getComputedStyle(rail).zIndex : 'missing',
      };
    });
    expect(Number(zOrder.field)).toBeLessThan(Number(zOrder.rail));
  });

  test('TC-SCENE-VITRINE-03: the field reads the same lit plate the rail does', async ({
    page,
  }) => {
    await settleVitrineWithGL(page);

    await expect(page.locator(FIELD)).toHaveAttribute('data-lit-index', '0');
    await expect(page.locator(PLATE).nth(0)).toHaveAttribute('data-lit', 'true');

    // Move the rail to the third plate the way the section's own keyboard path
    // does, then let the snap settle.
    await page.locator(PLATE).nth(2).evaluate((el) => {
      el.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'auto' });
    });
    await page.waitForTimeout(700);

    await expect(page.locator(FIELD)).toHaveAttribute('data-lit-index', '2');
    await expect(page.locator(PLATE).nth(2)).toHaveAttribute('data-lit', 'true');
  });

  test('TC-SCENE-VITRINE-04: under reduced motion there is no canvas and the six drawings are whole', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settleVitrineWithGL(page);

    await expect(page.locator(`${VITRINE} canvas`)).toHaveCount(0);
    await expect(page.locator(PLATE)).toHaveCount(6);
    await expect(page.locator(`${VITRINE} ol li svg`)).toHaveCount(6);

    // The drawings are present, not withheld: reduced motion drops the tracing,
    // never the mechanism.
    const offsets = await page
      .locator(`${VITRINE} ol li svg [class*="stroke"]`)
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).strokeDashoffset));
    expect(offsets.length).toBeGreaterThan(20);
    expect(offsets.every((o) => parseFloat(o) === 0)).toBe(true);
  });

  test('TC-SCENE-VITRINE-05: with WebGL unavailable the cabinet is whole and silent', async ({
    page,
  }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(
        this: HTMLCanvasElement,
        id: string,
        ...rest: unknown[]
      ) {
        if (id === 'webgl' || id === 'webgl2' || id === 'experimental-webgl') return null;
        return (original as unknown as (...a: unknown[]) => unknown).call(this, id, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });

    await settleVitrineWithGL(page);

    await expect(page.locator(`${VITRINE} canvas`)).toHaveCount(0);
    await expect(page.locator(PLATE)).toHaveCount(6);
    await expect(page.locator(`${VITRINE} ol li svg`)).toHaveCount(6);
    await expect(page.locator(VITRINE)).toContainText('Excluded, and why');
    expect(pageErrors, `page errors with no WebGL:\n${pageErrors.join('\n')}`).toHaveLength(0);
  });

  test('TC-SCENE-VITRINE-06: the field is monochrome, palette-sourced and cheap per pixel', async () => {
    const glsl = readFileSync(GLSL_SOURCE, 'utf8');
    const component = readFileSync(FIELD_SOURCE, 'utf8');

    expect(glsl.toLowerCase()).not.toContain('gold');
    expect(component).not.toContain('gold');
    expect(glsl).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(component).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    expect(component).toContain("from '@/lib/palette'");

    const body = glsl.slice(glsl.lastIndexOf('void main'));
    const lookups = body.match(/\bnoise\s*\(/g) ?? [];
    expect(
      lookups.length,
      `noise() calls in the fragment program: ${lookups.length}`,
    ).toBeLessThanOrEqual(3);

    expect(component).toContain('ScreenQuad');
    expect(component).toContain('webglcontextlost');

    // The two uniforms the section's own state drives.
    expect(glsl).toContain('uLit');
    expect(glsl).toContain('uScroll');
  });

  test('TC-SCENE-VITRINE-07: the trace-on reads as a trace and still lands inside 900 ms (MOT-C13-03)', async ({
    page,
  }) => {
    await settleVitrineWithGL(page);
    await page.waitForTimeout(600);

    const trace = await page.locator(PLATE).first().evaluate((plate) => {
      const strokes = Array.from(plate.querySelectorAll('[class*="stroke"]'));
      const delays = strokes.map((el) => parseFloat(getComputedStyle(el).transitionDelay) * 1000);
      const durations = strokes.map(
        (el) => parseFloat(getComputedStyle(el).transitionDuration) * 1000,
      );
      const label = plate.querySelector('[class*="label"]');
      return {
        count: strokes.length,
        delays,
        duration: durations[0] ?? NaN,
        labelDelay: label ? parseFloat(getComputedStyle(label).transitionDelay) * 1000 : NaN,
      };
    });

    expect(trace.count, 'the first plate has no strokes to trace').toBeGreaterThan(5);
    expect(trace.duration, 'stroke duration is not the 320 ms base').toBeCloseTo(320, 0);

    // Consecutive strokes are far enough apart to read as a sequence rather
    // than one event: >= 20 ms, per MOT-C13-03's acceptance.
    const steps = trace.delays.slice(1).map((d, i) => d - trace.delays[i]);
    const smallest = Math.min(...steps);
    expect(smallest, `smallest gap between consecutive strokes: ${smallest} ms`).toBeGreaterThanOrEqual(20);

    // And the whole drawing still lands inside R-c8 C-02's 900 ms budget.
    const last = Math.max(...trace.delays) + trace.duration;
    expect(last, `last stroke lands at ${last} ms`).toBeLessThanOrEqual(900);

    // The labels come up after the last stroke, not over it.
    expect(trace.labelDelay).toBeGreaterThanOrEqual(Math.max(...trace.delays) + trace.duration - 1);
    expect(trace.labelDelay).toBeLessThanOrEqual(900);
  });

  test('TC-SCENE-VITRINE-08: the rail travels under no-preference and jumps under reduce (MOT-C13-06)', async ({
    page,
  }) => {
    await settleVitrineWithGL(page);
    await expect(page.locator(RAIL)).toHaveCSS('scroll-behavior', 'smooth');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(200);
    await expect(page.locator(RAIL)).toHaveCSS('scroll-behavior', 'auto');
  });
});
