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

  test('TC-HERO-02: Hero subtitle renders professional positioning (astronomy demoted out of ATF)', async ({ page }) => {
    await gotoHome(page);
    const subtitle = page.locator('.hero-subtitle');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText('technical delivery leader');
    await expect(subtitle).toContainText('measurable business value');
    // D-HERO-02: the personal Vedic-astronomy R&D narrative must no longer sit ATF.
    await expect(subtitle).not.toContainText('Vedic astronomy');
  });

  test('TC-HERO-03: Dual-pillar CTAs render', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('[data-pillar="employer"]')).toBeVisible();
    await expect(page.locator('[data-pillar="client"]')).toBeVisible();
    await expect(page.locator('[data-pillar="employer"]')).toContainText('Review experience');
    await expect(page.locator('[data-pillar="client"]')).toContainText('See outcomes');
  });

  test('TC-HERO-04: Hero link bar renders LinkedIn, GitHub, YouTube, Download CV, Contact', async ({ page }) => {
    await gotoHome(page);
    const heroLinks = page.locator('.hero-links');
    await expect(heroLinks).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: 'LinkedIn' })).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: 'GitHub' })).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: 'YouTube' })).toBeVisible();
    await expect(heroLinks.locator('a', { hasText: 'Download CV' })).toBeVisible();
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

  // ── Hire-conversion first-paint elements (fable5-plan D-HERO/D-AVAIL/D-CONTACT/D-CV/D-PROOF/D-TRUST) ──

  test('TC-HERO-10: Hero shows a CV-aligned target role as a scannable line', async ({ page }) => {
    await gotoHome(page);
    const role = page.locator('.hero-role');
    await expect(role).toBeVisible();
    await expect(role).toContainText('Scrum Master');
    await expect(role).toContainText('AI Solutions Architect');
  });

  test('TC-HERO-11: Hero shows location', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('.hero-location')).toContainText('Melbourne');
  });

  test('TC-HERO-12: Hero shows a truthful open-to-work signal', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('.hero-availability')).toContainText('Open to');
  });

  test('TC-HERO-13: Hero LinkedIn link points to the canonical profile', async ({ page }) => {
    await gotoHome(page);
    const li = page.locator('.hero-links a[href*="linkedin.com/in/vikramd-profile"]');
    await expect(li.first()).toBeVisible();
  });

  test('TC-HERO-14: At least 3 proof metrics render above the fold at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoHome(page);
    const metrics = page.locator('[data-hero-proof]');
    expect(await metrics.count()).toBeGreaterThanOrEqual(3);
    const box = await metrics.first().boundingBox();
    expect(box?.y ?? 9999).toBeLessThan(844);
  });

  test('TC-HERO-15: Credibility band renders recognised employers + CSM', async ({ page }) => {
    await gotoHome(page);
    const band = page.locator('.credibility-band').first();
    await expect(band).toBeVisible();
    await expect(band).toContainText('ANZ');
    await expect(band).toContainText('Certified Scrum Master');
  });

  test('TC-HERO-16: Preloader exposes a keyboard-focusable Skip control', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const skip = page.locator('.preloader-skip');
    if (await skip.isVisible().catch(() => false)) {
      await expect(skip).toBeEnabled();
      await skip.focus();
      await expect(skip).toBeFocused();
    }
  });
});
