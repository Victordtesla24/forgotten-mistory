import { test, expect, type Page } from '@playwright/test';

/**
 * Category 1: E2E — Hero Section
 * Verifies all hero elements render correctly per siteContent.ts data.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Wait for preloader to finish
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  // Wait for hero content to be visible
  await page.locator('.hero-section').waitFor({ state: 'visible', timeout: 15000 });
}

test.describe('E2E: Hero Section', () => {
  test.describe.configure({ timeout: 60000 });

  test('TC-HERO-01: Hero section renders with greeting and name', async ({ page }) => {
    await gotoHome(page);
    const hero = page.locator('#hero');
    await expect(hero).toBeVisible();
    await expect(hero).toContainText("Hello, I'm");
    await expect(hero).toContainText('Vikram.');
  });

  test('TC-HERO-02: Hero subtitle paragraphs render', async ({ page }) => {
    await gotoHome(page);
    const subtitle = page.locator('.hero-subtitle');
    await expect(subtitle).toBeVisible();
    // Verify both paragraphs are present
    await expect(subtitle).toContainText('technical delivery leader');
    await expect(subtitle).toContainText('ancient algorithms');
  });

  test('TC-HERO-03: Dual-pillar CTAs render', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('[data-pillar="employer"]')).toBeVisible();
    await expect(page.locator('[data-pillar="client"]')).toBeVisible();
    await expect(page.locator('[data-pillar="employer"]')).toContainText('Review experience');
    await expect(page.locator('[data-pillar="client"]')).toContainText('See outcomes');
  });

  test('TC-HERO-04: Hero link bar renders with GitHub, YouTube, Resume, Contact', async ({ page }) => {
    await gotoHome(page);
    const heroLinks = page.locator('.hero-links');
    await expect(heroLinks).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: 'GitHub' })).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: 'YouTube' })).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: 'Resume PDF' })).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: "Let's Talk" })).toBeVisible();
  });

  test('TC-HERO-05: TelemetryPanel renders in hero', async ({ page }) => {
    await gotoHome(page);
    // TelemetryPanel should be visible
    const panel = page.locator('.hero-hud-backdrop, [class*="telemetry"]').first();
    await expect(panel).toBeVisible();
  });

  test('TC-HERO-06: Outcome cards (meta cards) render with resumeContent data', async ({ page }) => {
    await gotoHome(page);
    const cards = page.locator('[data-outcome-card="true"]');
    const count = await cards.count();
    expect(count).toBe(6); // 6 outcomes from resumeContent
    await expect(cards.first()).toBeVisible();
    // Verify key values appear
    await expect(page.locator('.meta-value').first()).toContainText('-92%');
  });

  test('TC-HERO-07: HeroAvatar renders', async ({ page }) => {
    await gotoHome(page);
    const avatar = page.locator('.hero-image-container');
    await expect(avatar).toBeVisible();
  });

  test('TC-HERO-08: SpaceScene background renders', async ({ page }) => {
    await gotoHome(page);
    const scene = page.locator('.scene-stack');
    await expect(scene).toBeAttached();
  });

  test('TC-HERO-09: Preloader renders and then disappears', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const pre = page.locator('.preloader');
    // Should exist initially
    await expect(pre).toBeAttached();
    // Should eventually hide
    await pre.waitFor({ state: 'hidden', timeout: 20000 });
    await expect(pre).not.toBeVisible();
  });
});
