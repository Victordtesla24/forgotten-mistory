import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-PROOF — the #proof bar renders ≥3 resume-accurate metrics with a scroll-in
 * count-up that completes to its final values; under prefers-reduced-motion the final
 * values render immediately. (FR-PROOF / QA-DR-07)
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('TC-FR-PROOF — proof bar', () => {
  test.describe.configure({ timeout: 90000 });

  test('renders ≥3 metrics and the count-up completes to final values', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#proof')).toHaveCount(1);
    const values = page.locator('#proof .proof-value');
    expect(await values.count()).toBeGreaterThanOrEqual(3);

    await page.evaluate(() => document.getElementById('proof')?.scrollIntoView({ block: 'center' }));
    // count-up settles on the resume-accurate finals (≈92%, 15+).
    await expect(page.locator('#proof .proof-value', { hasText: '92' })).toBeVisible({ timeout: 6000 });
    await expect(page.locator('#proof')).toContainText('15');
  });

  test('prefers-reduced-motion: final values render immediately', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await expect(page.locator('#proof .proof-value', { hasText: '92' })).toBeVisible();
  });
});
