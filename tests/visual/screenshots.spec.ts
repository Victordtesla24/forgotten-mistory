import { test, expect, type Page } from '@playwright/test';

/**
 * Category 2: Visual Regression Tests
 * Screenshot comparison for key sections using toHaveScreenshot.
 * Baselines are stored in tests/baselines/ as configured in playwright.config.ts.
 *
 * To generate baselines, run:
 *   UPDATE_SNAPSHOTS=1 npx playwright test --project=chromium tests/visual/
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
}

test.describe('Visual Regression', () => {
  test.describe.configure({ timeout: 90000 });

  test('VIS-01: Full hero section screenshot', async ({ page }) => {
    await gotoHome(page);
    const hero = page.locator('#hero');
    // Scroll slightly to ensure hero is fully in view
    await hero.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(hero).toHaveScreenshot('hero-full.png', {
      maxDiffPixelRatio: 0.02,
      threshold: 0.3,
    });
  });

  test('VIS-02: About section screenshot', async ({ page }) => {
    await gotoHome(page);
    const about = page.locator('#about');
    await about.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(about).toHaveScreenshot('about-section.png', {
      maxDiffPixelRatio: 0.02,
      threshold: 0.3,
    });
  });

  test('VIS-03: Navigation overlay screenshot (open state)', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.menu-toggle').click();
    await page.waitForTimeout(500);
    const overlay = page.locator('.nav-overlay');
    await expect(overlay).toHaveScreenshot('nav-overlay-open.png', {
      maxDiffPixelRatio: 0.02,
      threshold: 0.3,
    });
  });

  test('VIS-04: Contact section screenshot', async ({ page }) => {
    await gotoHome(page);
    const contact = page.locator('#contact');
    await contact.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await expect(contact).toHaveScreenshot('contact-section.png', {
      maxDiffPixelRatio: 0.02,
      threshold: 0.3,
    });
  });

  test('VIS-05: Work / Projects section screenshot', async ({ page }) => {
    await gotoHome(page);
    const work = page.locator('#work');
    await work.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000); // Wait for VFX animations
    await expect(work).toHaveScreenshot('work-section.png', {
      maxDiffPixelRatio: 0.02,
      threshold: 0.3,
    });
  });

  test('VIS-06: Full page screenshot (viewport top)', async ({ page }) => {
    await gotoHome(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(1000);
    await expect(page).toHaveScreenshot('viewport-top-1440x900.png', {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
      threshold: 0.3,
    });
  });
});
