import { test, expect, type Page } from '@playwright/test';

/**
 * Visual regression — one baseline per screen the reader actually meets.
 *
 * The set of screens changed with the rebuild, so the set of baselines changed
 * with it. `#contact` and `#work` were deleted, and rather than drop visual
 * cover for the closing screen and the project catalogue — the two places a
 * layout regression would be most embarrassing — VIS-04 and VIS-05 were
 * re-pointed at the sections that took their place: `#listen`, which is the
 * last thing anyone reads, and `#vitrine`, which is the densest layout on the
 * page and the one most likely to break. Their stale PNGs
 * (`contact-section-*`, `work-section-*`) were deleted from `tests/baselines/`
 * along with the tests' old subjects.
 *
 * Every capture runs under reduced motion. Each section's scene is a moving
 * shader and `components/gl/Scene.tsx` refuses to mount one when motion is not
 * allowed, so this is the only state in which the page can produce the two
 * identical consecutive frames a screenshot comparison needs. It is also the
 * right thing to be baselining: what is under test is layout, type and rhythm,
 * all of which are identical with or without the scene, because every section
 * is built to be complete without it.
 *
 * Baselines are per-platform. The repository carries `-chromium-linux` files
 * for the rebuilt page; the `-chromium-darwin` ones that survive are still of
 * the OLD page and must be regenerated on macOS before this suite passes there.
 * To regenerate:
 *   UPDATE_SNAPSHOTS=1 PLAYWRIGHT_BASE_URL=http://localhost:5599 \
 *     npx playwright test --project=chromium tests/visual/
 */

const SHOT = { maxDiffPixelRatio: 0.02, threshold: 0.3, timeout: 30000 } as const;

async function gotoHome(page: Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
  // The web fonts change how the ledger and the calibration table wrap, so a
  // capture taken before they land bakes the fallback metrics into the baseline.
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(500);
}

test.describe('Visual Regression', () => {
  test.describe.configure({ timeout: 90000 });

  test('VIS-01: Full hero section screenshot', async ({ page }) => {
    await gotoHome(page);
    const hero = page.locator('#hero');
    await hero.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(hero).toHaveScreenshot('hero-full.png', SHOT);
  });

  test('VIS-02: About section screenshot', async ({ page }) => {
    await gotoHome(page);
    const about = page.locator('#about');
    await about.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(about).toHaveScreenshot('about-section.png', SHOT);
  });

  test('VIS-03: Navigation overlay screenshot (open state)', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.menu-toggle').click();
    await expect(page.locator('#site-nav-overlay')).toHaveClass(/open/);
    await page.waitForTimeout(500);
    await expect(page.locator('#site-nav-overlay')).toHaveScreenshot('nav-overlay-open.png', SHOT);
  });

  test('VIS-04: Listen (closing) section screenshot', async ({ page }) => {
    await gotoHome(page);
    const listen = page.locator('#listen');
    await listen.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(listen).toHaveScreenshot('listen-section.png', SHOT);
  });

  test('VIS-05: Vitrine section screenshot', async ({ page }) => {
    await gotoHome(page);
    const vitrine = page.locator('#vitrine');
    await vitrine.scrollIntoViewIfNeeded();
    // The rail lights whichever plate is nearest its centre, so the frame is
    // only reproducible once the scroll observer has settled on one.
    await page.waitForTimeout(1000);
    await expect(vitrine).toHaveScreenshot('vitrine-section.png', SHOT);
  });

  test('VIS-06: Full page screenshot (viewport top)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('viewport-top-1440x900.png', {
      ...SHOT,
      fullPage: false,
    });
  });
});
