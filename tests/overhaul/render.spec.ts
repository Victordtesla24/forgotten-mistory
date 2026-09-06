import { test, expect, type Page } from '@playwright/test';

/**
 * SPEC §10 TC-NFR-RENDER — the shader work compiles and draws, and the page is
 * whole whether it draws or not.
 *
 * The scene inventory this file was written against no longer exists. There is
 * no page-wide `SpaceScene` starfield in a `.scene-stack`, no `.vfx-gallery`,
 * no `CelestialSphere`/`OrchestrationGraph`/`PacketFlowGraph`, and no
 * `SkillViz*` canvases — all deleted with `#work` and `#skills`' old form. The
 * four tests aimed at them (TC-RENDER-01, -04, -05 and the `work-section.png`
 * baseline in TC-RENDER-08) went with their subjects, and the two stale
 * `work-section` PNGs under `tests/baselines/` were deleted with them.
 *
 * Three GLSL scenes remain, one per section, each mounted through
 * `components/gl/Scene.tsx`: `HeroAtmosphere` in `#hero`, `Compass` in
 * `#about`, `CareerStrata` in `#experience`. Testing them needs one thing
 * spelled out. `components/gl/useGLCapability.ts` deliberately reports
 * `unsupported` on a software rasteriser — SwiftShader renders these scenes at
 * about three frames a second, and a static page beats a stuttering one — and
 * every CI machine here *is* a software rasteriser. So on a default page load
 * the correct number of canvases is zero, and asserting one would be asserting
 * a bug. `useGLCapability` provides `?gl=force` for exactly this reason: it is
 * the build host's escape hatch, without which every shader on the site would
 * ship having only ever been exercised down its fallback path. These tests use
 * it, so the shaders are genuinely compiled and drawn rather than assumed.
 *
 * TC-RENDER-09 additionally absorbed what `tests/e2e/vfx.spec.ts` protected
 * before that file was deleted with the effect gallery: scrolling the whole
 * page, top to bottom, must never produce a page error or an error-boundary
 * fallback. That was the one assertion in the VFX suite that could actually
 * fail, and it now walks all six sections rather than the four that used to
 * exist.
 *
 * Screenshot baselines live in `tests/baselines/` (see playwright.config.ts).
 * Regenerate with:
 *   UPDATE_SNAPSHOTS=1 PLAYWRIGHT_BASE_URL=http://localhost:5599 \
 *     npx playwright test tests/overhaul/render.spec.ts
 * Snapshots are per-platform, so that has to be done on each OS that runs the
 * suite; the repository currently carries a `-chromium-linux` baseline for the
 * rebuilt hero and a `-chromium-darwin` one that is still of the OLD hero and
 * must be regenerated on macOS before this passes there.
 */

/** The three sections that own a WebGL scene, in page order. */
/* The sections a WebGL scene could mount in. Empty after t_w3_rm2 removed the
   last of them (INTERIM-FRAME.md §5): TC-RENDER-02's context-loss watch is
   parameterised over it and now watches the page with no scene on it, which is
   still the honest measurement — a console free of WebGL errors. */
const SCENE_SECTIONS: readonly string[] = [];

/** Every section on the page, in page order. */
const ALL_SECTIONS = ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen'] as const;

async function waitForPageReady(page: Page) {
  // app/page.tsx adds `page-ready` on the frame after mount and dispatches
  // `fm:page-ready`.
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Loads the page with the software-rasteriser guard overridden, so the scenes
 * actually mount here. Without this every scene test would be testing the
 * fallback and reporting it as a pass.
 */
async function gotoWithGL(page: Page) {
  await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
  await waitForPageReady(page);
}

/** Walks a section into view and gives its scene time to mount and draw. */
async function settleSection(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(2000);
}

test.describe('TC-NFR-RENDER: Cinematic Rendering Compliance', () => {
  test.describe.configure({ timeout: 120000 });

  /* TC-RENDER-01 is SUPERSEDED by tests/overhaul/interim-frame.spec.ts TC-IF-18
     (docs/architecture/INTERIM-FRAME.md §6). It asserted that at least one
     section scene mounts a live canvas under ?gl=force; after t_w3_rm2 no
     section declares a scene at all, so the case now asserts the opposite of
     the frame in force. TC-IF-18 measures what replaced it: 0 page errors under
     ?gl=force, and no canvas anywhere on the page but MiniVic's own. */

  test('TC-RENDER-02: Scenes draw with no WebGL context loss', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
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
    });

    await gotoWithGL(page);
    for (const selector of SCENE_SECTIONS) await settleSection(page, selector);

    // The whole reason `Scene` exists is that seventeen components each mounting
    // their own `<Canvas>` logged `THREE.WebGLRenderer: Context Lost` on every
    // production page load. One context per section, torn down on exit, is the
    // fix — and this is the assertion that says it held.
    const critical = glErrors.filter(
      (e) => e.toLowerCase().includes('error') && !e.toLowerCase().includes('warning'),
    );
    expect(critical, `WebGL errors:\n${critical.join('\n')}`).toHaveLength(0);
  });

  test('TC-RENDER-06: No shader compilation errors anywhere on the page', async ({ page }) => {
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

    await gotoWithGL(page);
    for (const selector of ALL_SECTIONS) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);
    }

    // The GLSL in components/sections/*/**.glsl.ts is hand-written, so a typo in
    // a uniform name is a runtime failure with no build-time warning at all.
    expect(shaderErrors, `shader errors:\n${shaderErrors.join('\n')}`).toHaveLength(0);
  });

  test('TC-RENDER-07: Screenshot baseline — hero section (chromium)', async ({ page }) => {
    // Captured down the fallback path deliberately — no `?gl=force`. The scene
    // is a moving shader, and a moving surface can never produce the two
    // identical consecutive frames a screenshot comparison needs. What the
    // baseline is for is the layout, the type and the ledger, all of which are
    // identical either way because the hero is complete without its scene.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.waitForTimeout(2000); // let the CSS entrance finish

    await expect(page.locator('#hero')).toHaveScreenshot('hero-section.png', {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
      // The default 15s expect timeout is not enough headroom for the capture's
      // stability gate when several workers share one software rasteriser.
      timeout: 30000,
    });
  });

  test('TC-RENDER-09: A full-page scroll never trips a page error or the error boundary', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // Walk every section so lazily-mounted content, the vitrine's rail observer
    // and the skills table's font re-measure all actually run. This is the
    // check tests/e2e/vfx.spec.ts existed for — one throwing component used to
    // take the whole section down with it — restated over the page as it is.
    for (const selector of ALL_SECTIONS) {
      await page.locator(selector).scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
    }
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    // No error boundary fallback text visible.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('Something went wrong');
    expect(bodyText.toLowerCase()).not.toContain('system interrupt');
    expect(bodyText).not.toContain('Error:');

    expect(pageErrors, `page errors during a full scroll:\n${pageErrors.join('\n')}`).toHaveLength(0);
  });
});
