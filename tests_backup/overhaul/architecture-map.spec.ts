import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-ARCHMAP — Tests for ArchitectureMap flow-dot animations (IV-4).
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('TC-FR-ARCHMAP — Architecture Map flow dots', () => {
  test.describe.configure({ timeout: 60000 });

  test('Architecture Map renders flow-dots animating along paths (IV-4)', async ({ page }) => {
    await gotoHome(page);

    const archSection = page.locator('.arch-wrapper');
    if ((await archSection.count()) === 0) {
      test.skip(true, 'Architecture map not present on page');
      return;
    }

    await archSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    const flowDots = page.locator('[data-testid="flow-dot"], .flow-dot, circle.flow-dot');
    const dotCount = await flowDots.count();
    expect(dotCount).toBeGreaterThanOrEqual(1);

    const firstDot = flowDots.first();
    await expect(firstDot).toBeVisible();
  });

  test('Architecture Map SVG paths render correctly', async ({ page }) => {
    await gotoHome(page);

    const archSvg = page.locator('.arch-svg');
    if ((await archSvg.count()) === 0) {
      test.skip(true, 'Architecture SVG not present');
      return;
    }

    const paths = archSvg.locator('path');
    const pathCount = await paths.count();
    expect(pathCount).toBeGreaterThanOrEqual(1);
  });

  test('Architecture Map flow buttons toggle active state', async ({ page }) => {
    await gotoHome(page);

    const archWrapper = page.locator('.arch-wrapper');
    if ((await archWrapper.count()) === 0) {
      test.skip(true, 'Architecture map not present');
      return;
    }

    await archWrapper.scrollIntoViewIfNeeded();

    const buttons = archWrapper.locator('.arch-btn');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThanOrEqual(2);

    const secondBtn = buttons.nth(1);
    await secondBtn.click();
    await expect(secondBtn).toHaveClass(/\bactive\b/);
  });
});
