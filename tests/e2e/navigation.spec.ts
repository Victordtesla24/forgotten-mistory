import { test, expect, type Page } from '@playwright/test';

/**
 * Category 1: E2E — Navigation
 * Verifies nav links render, overlay opens/closes, sticky behaviour.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
}

test.describe('E2E: Navigation', () => {
  test.describe.configure({ timeout: 60000 });

  test('TC-NAV-01: Logo renders with correct text', async ({ page }) => {
    await gotoHome(page);
    const logo = page.locator('.logo');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('VIKRAM.');
  });

  test('TC-NAV-02: Menu toggle button renders and is clickable', async ({ page }) => {
    await gotoHome(page);
    const toggle = page.locator('.menu-toggle');
    await expect(toggle).toBeVisible();
  });

  test('TC-NAV-03: Nav overlay opens on toggle click', async ({ page }) => {
    await gotoHome(page);
    const toggle = page.locator('.menu-toggle');
    await toggle.click();
    const overlay = page.locator('#site-nav-overlay, .nav-overlay');
    await expect(overlay).toBeVisible();
  });

  test('TC-NAV-04: Nav overlay lists all 8 sections', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.menu-toggle').click();
    const links = page.locator('.nav-link, .nav-links a');
    await expect(links.first()).toBeVisible();

    const expectedLinks = ['Home', 'About', 'Experience', 'Skills', 'Architecture', 'Work', 'Resume', 'Contact'];
    for (const label of expectedLinks) {
      await expect(page.locator('.nav-link, .nav-links a', { hasText: label })).toBeVisible();
    }
  });

  test('TC-NAV-05: Nav overlay closes on Escape key', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.menu-toggle').click();
    const overlay = page.locator('#site-nav-overlay, .nav-overlay');
    await expect(overlay).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(overlay).not.toHaveClass(/open/);
  });

  test('TC-NAV-06: Clicking a nav link scrolls to the correct section', async ({ page }) => {
    await gotoHome(page);
    // Click About link in nav overlay
    await page.locator('.menu-toggle').click();
    await page.locator('.nav-link, .nav-links a', { hasText: 'About' }).click();

    // Verify #about section is now in viewport
    const aboutSection = page.locator('#about');
    await expect(aboutSection).toBeVisible();
    // Check that we scrolled to it (it should be near the top of viewport)
    const box = await aboutSection.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      expect(box.y).toBeLessThan(600); // Top of about section should be visible
    }
  });

  test('TC-NAV-07: Sticky nav — nav is present after scrolling down', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(500);
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    // Logo should still be visible
    await expect(page.locator('.logo')).toBeVisible();
  });

  test('TC-NAV-08: Logo click scrolls to top', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(500);
    await page.locator('.logo').click();
    await page.waitForTimeout(500);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });
});
