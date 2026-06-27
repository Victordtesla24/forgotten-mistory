import { test, expect, type Page } from '@playwright/test';
import { ensureStaticBuild, startStaticServer, type StaticServer } from './helpers/staticServer';

/**
 * TC-NFR-A11Y-RM (SPEC §10 / NN-3 / CLAUDE.md "every animated surface needs a
 * prefers-reduced-motion fallback") — under `prefers-reduced-motion: reduce` the
 * WebGL surfaces must be VISUALLY STILL.
 *
 * We measure the requirement DIRECTLY by counting real rendered frames — every
 * `gl.drawArrays` / `gl.drawElements` the SpaceScene WebGL context issues over an
 * idle window. With motion allowed the R3F loop renders continuously (thousands of
 * draws); under reduced motion the canvas drops to `frameloop="demand"` and every
 * `useFrame` early-returns on `frozen`, so the loop issues ZERO draws.
 *
 * History — why draw calls, not requestAnimationFrame: the earlier criterion
 * counted the page-level `window.requestAnimationFrame`, but R3F drives its render
 * loop through an rAF the page patch never observed. Once the framer-driven
 * PanelDepthScene / SparklineGL surfaces were retired (commit 0f00baa) the only
 * remaining animation was R3F's, so the rAF proxy's animating↔frozen differential
 * collapsed to ~0 even though the WebGL freeze was already total (verified by a
 * draw-call probe: ~3500 draws animating vs exactly 0 frozen). Draw-call counting
 * measures the actual GPU work — precisely what "visually still" means — and cannot
 * be fooled by the legitimate GSAP/framer scroll-ticker rAF baseline.
 *
 * Exercised against the PRODUCTION static export (`out/`) over the shared static
 * server (mirrors Firebase Hosting), matching boot.spec.ts / perf.spec.ts /
 * durable.spec.ts. The dev bundle is unrepresentative (its first-load webpack
 * compile floods the main thread and renders unminified React).
 */

const SETTLE_MS = 1000;
const WINDOW_MS = 1500;
// Motion-allowed: the SpaceScene loop renders continuously, so the window must show
// a clearly animating canvas (observed ~3500). 200 proves it genuinely animates —
// otherwise the freeze assertion below would be vacuous — while tolerating headless
// SwiftShader / CI throttling.
const MIN_ANIMATING_DRAWS = 200;
// Reduced motion: zero draws after settle. A small tolerance absorbs a single stray
// frame from a late resize / DPR settle (observed: exactly 0 across repeated runs).
const MAX_FROZEN_DRAWS = 8;

// Hydration / app-error guard (OD — React #418 detection). React hydration failures
// and uncaught exceptions from OUR bundle must be zero. Cross-origin third-party
// noise (the YouTube uploads-playlist embed answers 403 in some automated runs) is
// not ours to fix and is excluded so the gate stays deterministic.
const APP_ERROR = /Minified React error #4\d\d|Hydration failed|did not match|Text content does not match/i;

interface DrawProbeWindow extends Window {
  __draws?: number;
}

async function readDraws(page: Page): Promise<number> {
  return page.evaluate(() => (window as DrawProbeWindow).__draws ?? 0);
}

/** Boot the scene under a media setting and return the WebGL draws issued over an idle window. */
async function measureIdleDraws(
  page: Page,
  origin: string,
  reducedMotion: 'reduce' | 'no-preference',
): Promise<number> {
  await page.emulateMedia({ reducedMotion });
  await page.goto(`${origin}/`, { waitUntil: 'load' });
  // Foreground the page so the render loop is not background-throttled — keeps the
  // animating baseline honest and the frozen count at a true zero.
  await page.bringToFront();

  // The SpaceScene backdrop mounts its WebGL canvas in both states (the scene is
  // present even when frozen — only the motion is suppressed).
  await expect(page.locator('.space-scene-layer canvas')).toBeVisible({ timeout: 15000 });
  // Both paths reach page-ready (reduced motion skips the blocking preloader; the
  // animated path resolves it after the boot count) before steady state.
  await expect(page.locator('body')).toHaveClass(/page-ready/, { timeout: 15000 });

  // Let boot/hydration/mount invalidations drain so the frozen path has truly
  // settled to demand before the window opens.
  await page.waitForTimeout(SETTLE_MS);
  const before = await readDraws(page);
  await page.waitForTimeout(WINDOW_MS);
  const after = await readDraws(page);
  return after - before;
}

test.describe('TC-NFR-A11Y-RM — reduced-motion freezes the WebGL surfaces', () => {
  test.describe.configure({ timeout: 240000 });
  // Block the offline-durability service worker for THIS spec only (durable.spec.ts
  // still exercises it via navigator.serviceWorker.controller): a worker replaying a
  // prior production cache could otherwise serve stale hashed chunks and confound the
  // hydration-error guard with phantom mismatches.
  test.use({ serviceWorkers: 'block' });

  let srv: StaticServer;

  test.beforeAll(() => {
    ensureStaticBuild();
  });

  test.beforeEach(async ({ page }) => {
    srv = await startStaticServer();
    // Count real GPU frames by hooking the WebGL draw entrypoints before any page
    // script runs (and on every navigation in this context). drawArrays/drawElements
    // fire once per draw call, so the delta over an idle window is the scene's render
    // activity — the direct signal the reduced-motion freeze targets.
    await page.addInitScript(() => {
      const w = window as unknown as { __draws?: number };
      w.__draws = 0;
      const hook = (proto: unknown): void => {
        const p = proto as Record<string, ((...a: unknown[]) => unknown) | undefined> | null;
        if (!p) return;
        for (const method of ['drawArrays', 'drawElements'] as const) {
          const original = p[method];
          if (typeof original === 'function') {
            p[method] = function (this: unknown, ...args: unknown[]): unknown {
              w.__draws = (w.__draws ?? 0) + 1;
              return original.apply(this, args);
            };
          }
        }
      };
      const g = window as unknown as {
        WebGLRenderingContext?: { prototype: unknown };
        WebGL2RenderingContext?: { prototype: unknown };
      };
      hook(g.WebGLRenderingContext?.prototype ?? null);
      hook(g.WebGL2RenderingContext?.prototype ?? null);
    });
  });

  test.afterEach(async () => {
    if (srv) await srv.close();
  });

  test('reduced motion freezes the WebGL render loop (zero draws) and emits no hydration errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    const animating = await measureIdleDraws(page, srv.origin, 'no-preference');
    const frozen = await measureIdleDraws(page, srv.origin, 'reduce');

    expect(
      animating,
      `with motion allowed the scene only issued ${animating} draws (floor ${MIN_ANIMATING_DRAWS}); it is not animating, so the freeze assertion would be vacuous`,
    ).toBeGreaterThan(MIN_ANIMATING_DRAWS);

    expect(
      frozen,
      `reduced motion still issued ${frozen} WebGL draws (max ${MAX_FROZEN_DRAWS}); a useFrame loop is still rendering under prefers-reduced-motion`,
    ).toBeLessThanOrEqual(MAX_FROZEN_DRAWS);

    const appErrors = errors.filter((e) => APP_ERROR.test(e));
    expect(
      appErrors,
      `React hydration / app errors during reduced-motion load: ${appErrors.join(' | ')}`,
    ).toEqual([]);
  });
});
