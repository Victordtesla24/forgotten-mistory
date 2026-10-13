import { test, expect } from '@playwright/test';

test.describe('Repairs Verification Production', () => {
  const PROD = 'https://forgotten-mistory.web.app/';

  test('Experience initial SSR bars (C4-SSR-BARS)', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto(`${baseURL}/#experience`);
    
    const scales = await page.locator('#experience [class*="trackBar"]').evaluateAll((ns) => ns.map((n) => {
        const t = getComputedStyle(n).transform;
        return t === 'none' ? 1 : new DOMMatrixReadOnly(t).a;
    }));
    expect(scales.length).toBe(8);
    for (const s of scales) expect(s).toBeGreaterThanOrEqual(0.95);
    await context.close();
  });

  test('Vitrine nested arrow focus (C4-NESTED-FOCUS)', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/#vitrine`);
    const stage = page.locator('li[data-mechanism]').first().locator('button[class*="stageButton"]').first();
    await stage.focus();
    await stage.press('ArrowRight');
    await expect(stage).toBeFocused();
  });

  test('Vitrine stage aria-pressed (C4-STAGE-STATE)', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/#vitrine`);
    await page.waitForTimeout(1000); // Settle for hydration
    const stage = page.locator('li[data-mechanism]').first().locator('button[class*="stageButton"]').nth(1);
    await stage.click();
    await expect(stage).toHaveAttribute('aria-pressed', 'true');
  });

  test('Menu 48px token (WCAG 2.5.8)', async ({ page, baseURL }) => {
    await page.goto(baseURL!);
    const menu = page.locator('.menu-toggle');
    const box = await menu.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(48);
  });
});
