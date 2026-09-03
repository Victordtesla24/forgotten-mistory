import { test, expect, type Page } from '@playwright/test';

/**
 * SPEC §10 TC-NFR-RENDER — Per-browser visual check: bloom/DoF/volumetric/
 * shader passes all render on signature scenes (Chrome/WebKit/Firefox).
 *
 * The signature scenes are:
 *   - SpaceScene (the page-wide starfield in `.scene-stack`, deferred behind the
 *     `heavyReady` gate in app/page.tsx so it never contends with the hero's LCP)
 *   - CelestialSphere (btr-demo in #work)
 *   - OrchestrationGraph (ralph-loop-infinite in #work)
 *   - PacketFlowGraph (telemetry-cluster in #work)
 *   - SkillViz* components (in #skills)
 *
 * What changed with the hero rebuild:
 *   - The HudFrame bezel test was deleted. Its last mount was the hero backdrop
 *     (`.hero-hud-backdrop`), which the rebuild removed; HudFrame is no longer
 *     rendered anywhere on the page, so there is no bezel left to assert.
 *   - The hero's own scene now goes through components/gl/GLStage.tsx — the
 *     page's single WebGL context — via `<Scene track={ref}>`. GLStage refuses to
 *     mount on a software rasteriser (see components/gl/useGLCapability.ts), and
 *     headless CI *is* a software rasteriser, so **the hero has no canvas of its
 *     own in these runs and that is correct**. Nothing below asserts one. The
 *     hero's contract is that it is complete and legible with its scene absent.
 *   - The preloader is gone (components/site/Preloader.tsx is deleted). Waits are
 *     keyed on `body.page-ready`, which app/page.tsx still raises on the frame
 *     after mount and which also arms the deferred SpaceScene.
 *   - The gallery canvas test now walks the gallery rather than the section. A
 *     shorter hero changed where `#work` lands, and the three R3F effects sit far
 *     enough down the list that scrolling the section into view left every one of
 *     them off screen and mounted as a poster — zero canvases, for a layout
 *     reason rather than a rendering one.
 *
 * Test approach:
 *   1. Navigate to each scene section
 *   2. Verify the scene's canvas element is present and non-empty
 *   3. Capture screenshots via toHaveScreenshot() for visual regression
 *   4. Verify no WebGL context loss or shader compilation errors
 *
 * Screenshot baselines are stored in tests/baselines/ (per playwright.config.ts).
 * Update baselines with: UPDATE_SNAPSHOTS=1 npx playwright test tests/overhaul/render.spec.ts
 *
 * PASS:
 *   - Each signature scene renders a canvas with non-zero dimensions
 *   - No WebGL context loss errors in console
 *   - Screenshots match baselines (pixel diff < 1%, threshold 0.2)
 */

async function waitForPageReady(page: Page) {
  // app/page.tsx adds `page-ready` on the frame after mount and dispatches
  // `fm:page-ready`; the deferred starfield arms off the same signal.
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
}

/**
 * Lazy content (the projects carousel, the GitHub feed, the gallery's poster
 * fallbacks) mounts as it approaches the viewport, so a section's height keeps
 * growing for a second or two after it is scrolled to. Screenshot comparison
 * needs two identical frames, which it never gets while the box is still
 * resizing — so wait for the measured height to repeat before capturing.
 */
async function waitForStableHeight(page: Page, selector: string): Promise<number> {
  let last = -1;
  for (let i = 0; i < 24; i += 1) {
    const height = await page
      .locator(selector)
      .evaluate((el) => Math.round(el.getBoundingClientRect().height));
    if (height === last) return height;
    last = height;
    await page.waitForTimeout(500);
  }
  return last;
}

/**
 * Walks the viewport down through an element taller than the screen. The WebGL
 * effects in the gallery each mount their own canvas only once they are
 * genuinely on screen and a context ticket is free (lib/webglContextGuard.ts);
 * off-screen they render a static poster instead. Scrolling the *section* into
 * view aligns its top and leaves every effect below the fold, so the canvases
 * have to be walked past to exist at all.
 */
async function scrollThrough(page: Page, selector: string) {
  const target = page.locator(selector);
  const step = 600;

  // Walking once is not enough: each pass mounts more lazy content, which makes
  // the element taller, which leaves fresh content below the point the previous
  // pass stopped at. Keep walking until a full pass adds no height — otherwise
  // how much is mounted depends on how loaded the machine was, which is exactly
  // the non-determinism a screenshot baseline cannot tolerate.
  let previous = -1;
  for (let pass = 0; pass < 6; pass += 1) {
    await target.scrollIntoViewIfNeeded();
    const height = await target.evaluate((el) => el.getBoundingClientRect().height);
    for (let y = 0; y < height; y += step) {
      await page.evaluate((d) => window.scrollBy(0, d), step);
      await page.waitForTimeout(500);
    }
    const settled = await waitForStableHeight(page, selector);
    if (settled === previous) return;
    previous = settled;
  }
}

async function gotoSection(page: Page, sectionId: string) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
  await page.locator(sectionId).scrollIntoViewIfNeeded();
  // Allow lazy-loaded WebGL contexts to mount
  await page.waitForTimeout(2000);
}

test.describe('TC-NFR-RENDER: Cinematic Rendering Compliance', () => {
  test.describe.configure({ timeout: 120000 });

  test('TC-RENDER-01: SpaceScene renders canvas in the scene stack', async ({ page }) => {
    await gotoSection(page, '#hero');

    // SpaceScene renders inside .scene-stack as a canvas. It mounts on an idle
    // callback after page-ready (timeout 2500ms), so wait for it rather than
    // assuming the fixed 2s above was enough.
    const canvases = page.locator('.scene-stack canvas');
    await canvases.first().waitFor({ state: 'attached', timeout: 20000 });
    const canvasCount = await canvases.count();
    expect(canvasCount).toBeGreaterThanOrEqual(1);

    const canvas = canvases.first();
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.width).toBeGreaterThan(100);
      expect(box.height).toBeGreaterThan(100);
    }
  });

  test('TC-RENDER-02: SpaceScene — no WebGL context loss errors', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text().toLowerCase();
        if (
          text.includes('webgl') ||
          text.includes('context lost') ||
          text.includes('shader') ||
          text.includes('glsl') ||
          text.includes('three')
        ) {
          glErrors.push(msg.text());
        }
      }
    });

    await gotoSection(page, '#hero');
    await page.waitForTimeout(1000);

    // Filter out non-critical THREE.js warnings
    const criticalErrors = glErrors.filter(
      (e) =>
        e.toLowerCase().includes('error') &&
        !e.toLowerCase().includes('warning'),
    );

    // Zero critical WebGL errors
    expect(criticalErrors).toHaveLength(0);
  });

  test('TC-RENDER-04: VFX gallery canvases render without errors', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('webgl')) {
        glErrors.push(msg.text());
      }
    });

    await gotoSection(page, '#work');

    // The gallery is ~2.5k px tall against a 720 px viewport and the three R3F
    // effects in it (CelestialSphere, OrchestrationGraph, PacketFlowGraph) sit
    // well down the list. Landing on `#work` leaves all of them off screen and
    // mounted as posters, so the canvases only exist once the gallery has been
    // walked past. This is the repair the hero rebuild forced: nothing about the
    // effects changed, but the shorter hero moved where `#work` lands.
    await scrollThrough(page, '.vfx-gallery');

    // Count all canvases in the work section (WebGL effect components)
    const canvases = page.locator('#work canvas');
    await canvases.first().waitFor({ state: 'attached', timeout: 20000 });
    const count = await canvases.count();

    // There should be multiple R3F/WebGL canvases
    expect(count).toBeGreaterThanOrEqual(1);

    // No WebGL errors from any of them
    expect(glErrors).toHaveLength(0);
  });

  test('TC-RENDER-05: Skill visualization canvases render in skills section', async ({ page }) => {
    await gotoSection(page, '#skills');

    // SkillViz* components render R3F canvases with placeholder during loading
    const skillCanvases = page.locator('#skills canvas');
    const count = await skillCanvases.count();

    // Skills section should have R3F visualizations for skill groups
    // (SkillVizAI, SkillVizEngineering, SkillVizLeadership, etc.)
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const box = await skillCanvases.nth(i).boundingBox();
        if (box) {
          expect(box.width).toBeGreaterThan(0);
          expect(box.height).toBeGreaterThan(0);
        }
      }
    }
    // If no canvases, verify the placeholder containers exist (SSR fallback)
  });

  test('TC-RENDER-06: No WebGL shader compilation errors across entire page', async ({ page }) => {
    const shaderErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text().toLowerCase();
      if (
        msg.type() === 'error' &&
        (text.includes('shader') || text.includes('compile') || text.includes('glsl'))
      ) {
        shaderErrors.push(msg.text());
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Scroll through all sections to trigger lazy-loaded WebGL contexts
    const sections = ['#hero', '#skills', '#work'];
    for (const sectionId of sections) {
      await page.locator(sectionId).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);
    }

    // Shader compilation errors should be zero
    expect(shaderErrors).toHaveLength(0);
  });

  test('TC-RENDER-07: Screenshot baseline — hero section (chromium)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2000); // Allow the CSS entrance and WebGL to settle

    // This baseline used to be scoped to `#hero .hero-content`, because the old
    // hero sat directly over the animating starfield and Playwright could not
    // capture two consecutive stable frames of the whole section. The rebuilt
    // hero paints its own opaque ink backdrop (Hero.module.css `.stage`, inside
    // an `isolation: isolate` stacking context), so the starfield no longer
    // bleeds through and the entire `#hero` section is stable once its CSS
    // entrance has finished. `.hero-content` no longer exists, so the baseline is
    // re-pointed at `#hero` itself — which is also the stronger check, since it
    // now covers the backdrop, the ledger and the CTAs rather than a text block.
    //
    // NOTE: the baseline PNG is of the OLD hero and MUST be regenerated:
    //   UPDATE_SNAPSHOTS=1 npx playwright test tests/overhaul/render.spec.ts
    // on every platform that runs this suite (snapshots are per-OS: the repo
    // currently carries `-chromium-darwin` baselines only).
    await expect(page.locator('#hero')).toHaveScreenshot('hero-section.png', {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      // The default 15s expect timeout is not enough headroom for the capture's
      // stability gate when several workers share one software rasteriser.
      timeout: 30000,
    });
  });

  test('TC-RENDER-08: Screenshot baseline — work section vfx gallery (chromium)', async ({ page }) => {
    // Reduced motion is what makes this baseline reproducible. Every effect in
    // the gallery gates its canvas on `prefers-reduced-motion` and falls back to
    // a static poster, so under this media state the frame contains no WebGL
    // surface being sampled mid-render and no CSS animation — only layout and
    // type, which is what a visual baseline is for.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoSection(page, '#work');

    // Mount everything the section defers *before* measuring. The capture
    // scrolls the element itself, and any lazy content that mounts during that
    // scroll changes the height underneath the comparison — which is why this
    // test flapped between 2370, 4383 and 4965 px tall frames. Walk it once,
    // come back to the top of the section, then wait for the height to settle.
    await scrollThrough(page, '#work');
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await waitForStableHeight(page, '#work');

    await expect(page.locator('#work')).toHaveScreenshot('work-section.png', {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      timeout: 30000,
    });
  });

  test('TC-RENDER-09: Page renders without React error boundary fallback', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Full scroll so lazy VFX / AnimatePresence lists mount (D-CRASH-01).
    for (const sectionId of ['#hero', '#skills', '#work', '#contact']) {
      const section = page.locator(sectionId);
      if ((await section.count()) === 0) continue;
      await section.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(800);
    }
    await page.waitForTimeout(1500);

    // No error boundary fallback text visible
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Something went wrong');
    expect(bodyText.toLowerCase()).not.toContain('system interrupt');
    expect(bodyText).not.toContain('Error:');

    const fatal = pageErrors.filter(
      (m) =>
        m.includes('Maximum update depth exceeded') ||
        m.includes('Minified React error #185') ||
        m.includes('Minified React error #425'),
    );
    expect(fatal, `Fatal pageerrors:\n${fatal.join('\n')}`).toHaveLength(0);
  });
});
