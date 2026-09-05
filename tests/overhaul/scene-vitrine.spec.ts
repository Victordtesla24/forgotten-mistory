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

/**
 * G-V1 / G-V2 — the ADV-FAIL P0 on `#vitrine`.
 *
 * The trace-on was authored as a reveal from nothing: every stroke sat at
 * `stroke-dashoffset: 1` until its plate was lit or had been lit once
 * (`Drawings.module.css`). At rest that is one drawing and five empty frames —
 * a reader scrolling past the rail sees five plates that look like they failed
 * to load, and the mechanism drawing is the whole argument of a plate.
 *
 * The rule these two tests hold: a drawing is always present. The lit plate is
 * still the emphasis — the trace sweeps its strokes up to full weight in
 * document order and the labels still arrive after the last stroke — but it is
 * raised from a resting weight, never from nothing.
 *
 * TC-VIT-V2 is the other half of the same directive (R4): a business client who
 * has just read the work has a route out of it in the section they read it in,
 * rather than having to reach `#listen` to find one. It is chrome — achromatic
 * — because gold in this section is already spent on the live repository URLs,
 * which are the plates' sourced claims.
 */
test.describe('TC-VIT: a plate at rest is still a drawing, and the work ends in an invitation', () => {
  test.describe.configure({ timeout: 120000 });

  /**
   * Every stroke's dash offset and the two independent weights on it.
   *
   * `stroke-opacity` is the trace channel — the one thing the raking light
   * moves, and the one this directive is about. The per-element `opacity` is
   * the drawing's own tonal hierarchy, authored into `Drawings.tsx` (0.16 for a
   * shadow rule, 0.95 for the principal line) and identical whether the plate
   * is lit or not. They are read apart because multiplying them would judge a
   * deliberately faint guide line as a withheld stroke.
   */
  const weigh = (plate: SVGElement | HTMLElement) =>
    Array.from(plate.querySelectorAll('[class*="stroke"]')).map((stroke) => {
      const cs = getComputedStyle(stroke);
      const trace = parseFloat(cs.strokeOpacity) || 0;
      const tone = parseFloat(cs.opacity) || 0;
      return { offset: parseFloat(cs.strokeDashoffset) || 0, trace, painted: trace * tone };
    });

  test('TC-VIT-V1: a resting (unlit, undrawn) plate renders visible strokes', async ({ page }) => {
    await settleVitrineWithGL(page);

    // At rest the rail has snapped to plate 01: it is the only plate the light
    // has ever reached, so the last plate is genuinely at rest.
    await expect(page.locator(PLATE).nth(0)).toHaveAttribute('data-lit', 'true');
    const resting = page.locator(PLATE).nth(5);
    expect(
      await resting.evaluate((el) => el.hasAttribute('data-lit') || el.hasAttribute('data-drawn')),
      'plate 06 has been lit or drawn, so it is not the resting case this test is about',
    ).toBe(false);

    const restingStrokes = await resting.evaluate(weigh);
    expect(restingStrokes.length, 'the resting plate has no strokes to read').toBeGreaterThan(5);

    // Nothing is withheld: every stroke is fully drawn, not dashed out of sight.
    const dashed = restingStrokes.filter((s) => s.offset !== 0).length;
    expect(
      dashed,
      `${dashed} of ${restingStrokes.length} strokes on the resting plate are dashed away — ` +
        'five of the six frames read as empty',
    ).toBe(0);

    // And drawn at a weight a reader can actually see: no stroke is held below
    // the resting trace weight, and the drawing's principal lines are painted.
    const faintestTrace = Math.min(...restingStrokes.map((s) => s.trace));
    expect(
      faintestTrace,
      `faintest resting stroke-opacity: ${faintestTrace}`,
    ).toBeGreaterThanOrEqual(0.4);

    const strongest = Math.max(...restingStrokes.map((s) => s.painted));
    expect(
      strongest,
      `the resting plate's most present stroke paints at ${strongest}`,
    ).toBeGreaterThanOrEqual(0.4);

    // The lit plate is still the emphasis: its trace weight is strictly above
    // every resting one, so the light adds something rather than being the only
    // thing that makes a drawing exist.
    const litStrokes = await page.locator(PLATE).nth(0).evaluate(weigh);
    const litTrace = Math.min(...litStrokes.map((s) => s.trace));
    const brightestResting = Math.max(...restingStrokes.map((s) => s.trace));
    expect(
      litTrace,
      `lit trace ${litTrace} must outweigh the brightest resting trace ${brightestResting}`,
    ).toBeGreaterThan(brightestResting);
  });

  test('TC-VIT-V2: an engagement CTA follows the curated work', async ({ page }) => {
    await settleVitrineWithGL(page);

    const cta = page.locator(`${VITRINE} a`, { hasText: /^Start a project$/ });
    await expect(cta, 'one engagement action in #vitrine, not two').toHaveCount(1);
    await expect(cta).toBeVisible();

    const href = await cta.getAttribute('href');
    expect(href ?? '', `#vitrine CTA href: ${href}`).toMatch(/^mailto:/);

    // It follows the work rather than preceding it.
    const afterRail = await cta.evaluate((el) => {
      const rail = document.querySelector('#vitrine ol');
      if (!rail) return false;
      // Node.DOCUMENT_POSITION_FOLLOWING === 4
      return (rail.compareDocumentPosition(el) & 4) !== 0;
    });
    expect(
      afterRail,
      'the invitation sits before the rail, so it is not a route out of the work',
    ).toBe(true);

    // Achromatic: gold in this section belongs to the live repository URLs.
    const painted = await cta.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { color: cs.color, background: cs.backgroundColor, border: cs.borderTopColor };
    });
    const chromatic = Object.entries(painted).filter(([, value]) => {
      const m = value.match(/rgba?\(([^)]+)\)/);
      if (!m) return false;
      const parts = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
      const [r, g, b] = parts;
      const a = parts.length > 3 ? parts[3] : 1;
      if (a === 0) return false;
      return Math.max(r, g, b) - Math.min(r, g, b) > 4;
    });
    expect(
      chromatic,
      `chromatic channels on the #vitrine CTA: ${JSON.stringify(painted)}`,
    ).toHaveLength(0);

    // Keyboard-reachable, and it says so when it has the focus.
    const focus = await cta.evaluate((el) => {
      (el as HTMLElement).focus();
      return {
        focused: document.activeElement === el,
        tabIndex: (el as HTMLElement).tabIndex,
        outline: getComputedStyle(el).outlineWidth,
      };
    });
    expect(focus.focused, 'the CTA cannot take keyboard focus').toBe(true);
    expect(focus.tabIndex).toBeGreaterThanOrEqual(0);
    expect(parseFloat(focus.outline), 'no visible focus ring on the CTA').toBeGreaterThan(0);
  });
});
