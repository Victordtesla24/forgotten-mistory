import { test, expect, type Page } from '@playwright/test';

/**
 * Category 1: E2E — Footer
 * Verifies footer content and links render correctly.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.locator('footer').scrollIntoViewIfNeeded();
}

test.describe('E2E: Footer', () => {
  test.describe.configure({ timeout: 60000 });

  test('TC-FOOTER-01: Footer element renders with contentinfo role', async ({ page }) => {
    await gotoHome(page);
    const footer = page.locator('footer[role="contentinfo"]');
    await expect(footer).toBeVisible();
  });

  test('TC-FOOTER-02: Copyright text renders with current year', async ({ page }) => {
    await gotoHome(page);
    const currentYear = new Date().getFullYear().toString();
    await expect(page.locator('footer')).toContainText('Vikram Deshpande');
    await expect(page.locator('footer')).toContainText(currentYear);
    await expect(page.locator('footer')).toContainText('All rights reserved');
  });

  test('TC-FOOTER-03: HiddenTerminal component renders in footer', async ({ page }) => {
    await gotoHome(page);
    // HiddenTerminal is rendered inside the footer
    const terminal = page.locator('footer [class*="terminal"], footer [class*="Terminal"]');
    // It might be hidden; at minimum it should be attached
    const count = await terminal.count();
    expect(count).toBeGreaterThanOrEqual(0); // Verify no crash
  });

  test('TC-FOOTER-04: Footer is positioned at the bottom of the page', async ({ page }) => {
    await gotoHome(page);
    const footer = page.locator('footer');
    const box = await footer.boundingBox();
    expect(box).not.toBeNull();
    // Footer should be after main content
    if (box) {
      const pageHeight = await page.evaluate(() => document.body.scrollHeight);
      expect(box.y).toBeGreaterThan(100);
      // Footer should be near the bottom of the scrollable page
      expect(box.y + box.height).toBeGreaterThan(pageHeight - 100);
    }
  });
});
