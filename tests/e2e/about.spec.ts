import { test, expect, type Page } from '@playwright/test';

/**
 * Category 1: E2E — About Section
 * Verifies about section content matches siteContent.ts.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.locator('#about').scrollIntoViewIfNeeded();
}

test.describe('E2E: About Section', () => {
  test.describe.configure({ timeout: 60000 });

  test('TC-ABOUT-01: About section renders with ID and title', async ({ page }) => {
    await gotoHome(page);
    const section = page.locator('#about');
    await expect(section).toBeVisible();
    await expect(section).toContainText('About Me');
  });

  test('TC-ABOUT-02: About paragraphs match siteContent about text', async ({ page }) => {
    await gotoHome(page);
    const aboutText = page.locator('#about .about-text');
    const count = await aboutText.count();
    expect(count).toBeGreaterThanOrEqual(2);

    await expect(aboutText.first()).toContainText('15');
    await expect(aboutText.first()).toContainText('Senior Technical Leader');
    await expect(aboutText.nth(1)).toContainText('cross-functional squads');
  });

  test('TC-ABOUT-03: Expandable cards (snap-cards) render in about section', async ({ page }) => {
    await gotoHome(page);
    const snapCards = page.locator('#about .snap-card');
    const count = await snapCards.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('TC-ABOUT-04: Snap cards expand on click and show content', async ({ page }) => {
    await gotoHome(page);
    const firstCard = page.locator('#about .snap-card').first();
    const header = firstCard.locator('.snap-header');

    // Card should not be open initially
    await expect(firstCard).not.toHaveClass(/open/);

    await header.click();
    await expect(firstCard).toHaveClass(/open/);
    const body = firstCard.locator('.snap-body');
    await expect(body).toBeVisible();
  });

  test('TC-ABOUT-05: Career Objective card has correct content', async ({ page }) => {
    await gotoHome(page);
    const cards = page.locator('#about .snap-card');
    await expect(cards.first()).toContainText('Career Objective');
    await expect(cards.first()).toContainText('Bridge technical depth');
  });

  test('TC-ABOUT-06: Delivery Impact card has measurable outcome content', async ({ page }) => {
    await gotoHome(page);
    const aboutSection = page.locator('#about');
    await expect(aboutSection).toContainText('Delivery Impact');
    await expect(aboutSection).toContainText('92%');
    await expect(aboutSection).toContainText('200 ms');
  });

  test('TC-ABOUT-07: Leadership & Governance card renders', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#about')).toContainText('Leadership');
    await expect(page.locator('#about')).toContainText('Servant leadership');
  });

  test('TC-ABOUT-08: Recent Builds card renders', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#about')).toContainText('Recent Builds');
    await expect(page.locator('#about')).toContainText('Langfuse');
    await expect(page.locator('#about')).toContainText('Next.js');
  });
});
