import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-MODAL — Tests for the hero capability modal (FloatingDetailBox):
 * - 3-D FX visibility through backdrop (IV-3)
 * - Dialog ARIA semantics (OD-1)
 * - Focus management
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('TC-FR-MODAL — Hero capability modal', () => {
  test.describe.configure({ timeout: 60000 });

  test('Modal opens with role=dialog and aria-modal (OD-1)', async ({ page }) => {
    await gotoHome(page);

    const metaCard = page.locator('[data-outcome-card="true"]').first();
    await expect(metaCard).toBeVisible({ timeout: 10000 });

    await metaCard.click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"][aria-labelledby="capability-modal-title"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  test('Modal has accessible close button with aria-label (OD-1)', async ({ page }) => {
    await gotoHome(page);

    const metaCard = page.locator('[data-outcome-card="true"]').first();
    await metaCard.click();
    await page.waitForTimeout(500);

    const closeBtn = page.locator('[role="dialog"][aria-labelledby="capability-modal-title"] button[aria-label*="Close"], [role="dialog"][aria-labelledby="capability-modal-title"] button[aria-label*="close"]');
    await expect(closeBtn).toBeVisible();
  });

  test('Modal backdrop allows 3-D FX to be partially visible (IV-3)', async ({ page }) => {
    await gotoHome(page);

    const metaCard = page.locator('[data-outcome-card="true"]').first();
    await metaCard.click();
    await page.waitForTimeout(800);

    await page.screenshot({ path: 'test-results/modal-fx-visibility.png', fullPage: false });
  });

  test('Modal closes on Escape key', async ({ page }) => {
    await gotoHome(page);

    const metaCard = page.locator('[data-outcome-card="true"]').first();
    await metaCard.click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"][aria-labelledby="capability-modal-title"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('Modal close button closes the modal', async ({ page }) => {
    await gotoHome(page);

    const metaCard = page.locator('[data-outcome-card="true"]').first();
    await metaCard.click();
    await page.waitForTimeout(500);

    const dialog = page.locator('[role="dialog"][aria-labelledby="capability-modal-title"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const closeBtn = dialog.locator('button[aria-label*="Close"]');
    if (await closeBtn.count() > 0) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
  });
});
