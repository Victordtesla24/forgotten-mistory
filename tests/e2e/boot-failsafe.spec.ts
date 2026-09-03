import { test, expect } from '@playwright/test';

/**
 * D-BOOT-02 — the front door must not depend on JavaScript at all.
 *
 * Production measurement (2026-09-03, cold cache): the hero stayed blank behind
 * the "Calibrating stars & telemetry" preloader for four to eight seconds while
 * the 450 kB first-load bundle parsed, because framer-motion server-rendered
 * every hero block at `opacity: 0` and the preloader only unmounted from a
 * requestAnimationFrame loop.
 *
 * The rebuild removed both mechanisms: the hero is plain server-rendered markup
 * revealed by a CSS animation, and there is no preloader. These tests refuse
 * every client chunk — hydration never happens at all — and assert the hero is
 * still complete, legible and usable.
 */
test.describe('the hero without JavaScript', () => {
  test.beforeEach(async ({ page }) => {
    // Kill every client chunk: what remains is server-rendered HTML plus CSS.
    await page.route('**/_next/static/chunks/**', (route) => route.abort());
    await page.goto('/');
  });

  test('the name, positioning and statement are visible', async ({ page }) => {
    const name = page.locator('#hero h1');
    await expect(name).toHaveText('Vikram Deshpande');
    await expect(name).toBeVisible();

    // The CSS entrance is ~1 s including its longest stagger delay.
    await page.waitForTimeout(1600);
    const opacity = await name.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opacity).toBeGreaterThan(0.95);

    await expect(page.locator('#hero')).toContainText('Delivery leadership');
    await expect(page.locator('#hero')).toContainText('Australian Taxation Office');
  });

  test('the evidence ledger is intact', async ({ page }) => {
    await expect(page.locator('#hero ul li')).toHaveCount(3);
    await expect(page.locator('#hero')).toContainText('≈92%');
    await expect(page.locator('#hero')).toContainText('ATO Payday Super');
  });

  test('both actions still work as links', async ({ page }) => {
    // Plain anchors, so they function with no runtime whatsoever.
    await expect(page.locator('#hero a[href="#experience"]')).toBeVisible();
    const cv = page.locator('#hero a[href$=".pdf"]');
    await expect(cv).toBeVisible();
    await expect(cv).toHaveAttribute('href', '/docs/Vik_Resume_Final.pdf');
  });

  test('nothing covers the viewport', async ({ page }) => {
    await page.waitForTimeout(1600);
    // Whatever is painted at the centre of the screen must belong to the hero —
    // no overlay, no loading curtain, no invisible full-page shim.
    const owner = await page.evaluate(() => {
      const el = document.elementFromPoint(window.innerWidth / 2, window.innerHeight / 2);
      return el?.closest('#hero') ? 'hero' : (el?.className?.toString() ?? 'unknown');
    });
    expect(owner).toBe('hero');
  });
});
