import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { test, expect, type Page } from '@playwright/test';

import { listenContent } from '../../app/data/portfolio/listen';

/**
 * SPEC-v10 §R2 / c20 — `#listen` carries a flagship scene, and it stays quiet.
 *
 * `#listen` was the third section R-c13 M-2 counted at `canvases: 0`. It is
 * also the emptiest screen on the site by design, and the section has exactly
 * one motion beat (MOT-F-4): the caliper closing. So the field here is not a
 * second animation — it is the same beat, seen as light: `uClose` runs 0 → 1 on
 * the jaws' own timing (`Listen.module.css` `caliperCloseLeft`, one
 * `--motion-cine-long`), and a hairline band brightens under the instrument as
 * the jaws arrive. Nothing in the scene moves on its own clock.
 *
 * TC-LISTEN-06..08 in `tests/e2e/listen.spec.ts` continue to own the beat, the
 * reduced-motion state and the no-gold rule; this file owns the scene.
 */

const LISTEN = '#listen';
const FIELD = `${LISTEN} [data-close]`;
const CALIPER = `${LISTEN} svg[data-caliper]`;

/** The four contact routes, plus the engagement plate that leads them. */
const ANCHORS = listenContent.channels.length + 1;

const LISTEN_DIR = join(process.cwd(), 'components/sections/Listen');
const GLSL_SOURCE = join(LISTEN_DIR, 'listen.glsl.ts');
const FIELD_SOURCE = join(LISTEN_DIR, 'ListenField.tsx');

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

async function settleListenWithGL(page: Page) {
  await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.locator(LISTEN).scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
}

test.describe('TC-SCENE-LISTEN: the instrument is set down in a field of light', () => {
  test.describe.configure({ timeout: 120000 });

  test('TC-SCENE-LISTEN-01: exactly one canvas mounts in #listen once the section is in view', async ({
    page,
  }) => {
    await settleListenWithGL(page);

    const canvases = page.locator(`${LISTEN} canvas`);
    await expect(canvases).toHaveCount(1);

    const box = await canvases.first().boundingBox();
    expect(box, 'the #listen canvas has no box').not.toBeNull();
    expect(box!.width, 'the #listen canvas is too small to be drawing').toBeGreaterThan(100);
    expect(box!.height, 'the #listen canvas is too small to be drawing').toBeGreaterThan(100);
  });

  test('TC-SCENE-LISTEN-02: the canvas is aria-hidden, behind the heading and behind the caliper', async ({
    page,
  }) => {
    await settleListenWithGL(page);
    await expect(page.locator(`${LISTEN} canvas`)).toHaveCount(1);

    const hidden = await page
      .locator(`${LISTEN} canvas`)
      .first()
      .evaluate((el) => el.closest('[aria-hidden="true"]') !== null);
    expect(hidden, 'the #listen canvas is not inside an aria-hidden slot').toBe(true);

    const overHeading = await page.locator('#listen-title').evaluate((el) => {
      const r = el.getBoundingClientRect();
      return document.elementFromPoint(r.left + 4, r.top + r.height / 2)?.tagName ?? 'none';
    });
    expect(overHeading).not.toBe('CANVAS');

    const zOrder = await page.evaluate(() => {
      const field = document.querySelector('#listen [data-close]');
      const inner = document.querySelector('#listen [class*="inner"]');
      return {
        field: field ? getComputedStyle(field).zIndex : 'missing',
        inner: inner ? getComputedStyle(inner).zIndex : 'missing',
      };
    });
    expect(Number(zOrder.field)).toBeLessThan(Number(zOrder.inner));
  });

  test('TC-SCENE-LISTEN-03: the field is bound to the caliper beat, not a clock of its own', async ({
    page,
  }) => {
    await settleListenWithGL(page);

    // The section closes its jaws once, on entry; the field says so too.
    await expect(page.locator(LISTEN)).toHaveAttribute('data-closed', '');
    await expect(page.locator(FIELD)).toHaveAttribute('data-close', 'closed');

    // The one beat stays one beat: no animation or transition is declared on
    // the scene slot itself (MOT-F-4).
    const slot = await page.locator(FIELD).evaluate((el) => {
      const cs = getComputedStyle(el);
      return { animation: cs.animationName, transition: cs.transitionProperty };
    });
    expect(slot.animation).toBe('none');
    expect(slot.transition === 'none' || slot.transition === 'all').toBe(true);
  });

  test('TC-SCENE-LISTEN-04: under reduced motion there is no canvas and the caliper is drawn closed', async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await settleListenWithGL(page);

    await expect(page.locator(`${LISTEN} canvas`)).toHaveCount(0);
    await expect(page.locator(CALIPER)).toHaveCount(1);

    const still = await page
      .locator(`${CALIPER} [data-jaw="left"]`)
      .evaluate((el) => getComputedStyle(el).animationDuration);
    expect(still).toBe('0s');

    // The four routes plus the one engagement plate the section gained in
    // cycle 20 (R-c13 CC-02): with no scene, the closing screen still
    // carries every way a reader has of answering it.
    await expect(page.locator(`${LISTEN} a`)).toHaveCount(ANCHORS);
    await expect(page.locator(`${LISTEN} [data-cta="engage"]`)).toHaveCount(1);
  });

  test('TC-SCENE-LISTEN-05: with WebGL unavailable the closing screen is whole and silent', async ({
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

    await settleListenWithGL(page);

    await expect(page.locator(`${LISTEN} canvas`)).toHaveCount(0);
    await expect(page.locator(CALIPER)).toHaveCount(1);
    // The four routes plus the one engagement plate the section gained in
    // cycle 20 (R-c13 CC-02): with no scene, the closing screen still
    // carries every way a reader has of answering it.
    await expect(page.locator(`${LISTEN} a`)).toHaveCount(ANCHORS);
    await expect(page.locator(`${LISTEN} [data-cta="engage"]`)).toHaveCount(1);
    expect(pageErrors, `page errors with no WebGL:\n${pageErrors.join('\n')}`).toHaveLength(0);
  });

  test('TC-SCENE-LISTEN-06: the field is monochrome, palette-sourced and cheap per pixel', async () => {
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
    expect(glsl).toContain('uClose');
  });
});
