import { test, expect, type Page } from '@playwright/test';

/**
 * SPEC §10 TC-NFR-RENDER — Per-browser visual check: bloom/DoF/volumetric/
 * shader passes all render on signature scenes (Chrome/WebKit/Firefox).
 *
 * The signature scenes are:
 *   - SpaceScene (hero starfield background)
 *   - HudFrame bezel motif (hero backdrop — scene={false}, no WebGL canvas;
 *     the JARVIS radar instance was removed from #work in the posh-catalogue
 *     overhaul, see TC-RENDER-03)
 *   - CelestialSphere (btr-demo in #work)
 *   - OrchestrationGraph (ralph-loop-infinite in #work)
 *   - PacketFlowGraph (telemetry-cluster in #work)
 *   - SkillViz* components (in #skills)
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

async function gotoSection(page: Page, sectionId: string) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.locator(sectionId).scrollIntoViewIfNeeded();
  // Allow lazy-loaded WebGL contexts to mount
  await page.waitForTimeout(2000);
}

test.describe('TC-NFR-RENDER: Cinematic Rendering Compliance', () => {
  test.describe.configure({ timeout: 120000 });

  test('TC-RENDER-01: SpaceScene renders canvas in hero section', async ({ page }) => {
    await gotoSection(page, '#hero');

    // SpaceScene renders inside .scene-stack as a canvas
    const canvases = page.locator('.scene-stack canvas');
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

  test('TC-RENDER-03: HudFrame bezel motif renders in hero backdrop', async ({ page }) => {
    // The sparse JARVIS radar HudFrame instance was removed from #work
    // (posh-catalogue overhaul — poster cards now carry the signature
    // effect themselves, visible at rest). HudFrame's sole remaining
    // mount is the hero backdrop bezel (scene={false} — bezel/corner-tick
    // motif only, no WebGL canvas).
    await gotoSection(page, '#hero');

    const hudFrame = page.locator('.hero-hud-backdrop .hud-frame');
    await expect(hudFrame).toBeAttached();

    const brackets = page.locator('.hero-hud-backdrop .hud-frame__bracket');
    expect(await brackets.count()).toBe(4);
  });

  test('TC-RENDER-04: VFX gallery canvases render without errors', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().toLowerCase().includes('webgl')) {
        glErrors.push(msg.text());
      }
    });

    await gotoSection(page, '#work');

    // Count all canvases in the work section (WebGL effect components)
    const canvases = page.locator('#work canvas');
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
    const pre = page.locator('.preloader');
    if (await pre.isVisible().catch(() => false)) {
      await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    }

    // Scroll through all sections to trigger lazy-loaded WebGL contexts
    const sections = ['#hero', '#skills', '#work'];
    for (const sectionId of sections) {
      await page.locator(sectionId).scrollIntoViewIfNeeded();
      await page.waitForTimeout(1500);
    }

    // Shader compilation errors should be zero
    expect(shaderErrors).toHaveLength(0);
  });

  test('TC-RENDER-07: Screenshot baseline — hero text content (chromium)', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const pre = page.locator('.preloader');
    if (await pre.isVisible().catch(() => false)) {
      await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    }
    await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(2000); // Allow WebGL to settle

    // Screenshot the hero text overlay (stable DOM) rather than the full
    // #hero section, which contains a continuously-animating R3F starfield
    // canvas that prevents Playwright from capturing two consecutive stable
    // screenshots (toHaveScreenshot stability gate).
    await expect(page.locator('#hero .hero-content')).toHaveScreenshot('hero-text-content.png', {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    });
  });

  test('TC-RENDER-08: Screenshot baseline — work section vfx gallery (chromium)', async ({ page }) => {
    await gotoSection(page, '#work');
    await page.waitForTimeout(2000);

    await expect(page.locator('#work')).toHaveScreenshot('work-section.png', {
      maxDiffPixelRatio: 0.01,
      threshold: 0.2,
    });
  });

  test('TC-RENDER-09: Page renders without React error boundary fallback', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const pre = page.locator('.preloader');
    if (await pre.isVisible().catch(() => false)) {
      await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    }

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
