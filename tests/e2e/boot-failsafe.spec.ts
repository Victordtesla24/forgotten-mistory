import { test, expect } from '@playwright/test';

/**
 * D-BOOT-02 — the front door must never depend on hydration finishing.
 *
 * Production measurement (2026-09-03): with a cold cache the hero stayed blank
 * behind the preloader for 4–8 s while the 450 kB first-load bundle parsed,
 * because framer-motion server-renders the hero blocks at `opacity: 0` and the
 * preloader unmounts from a rAF loop. These tests simulate the pathological
 * case — hydration never completes at all — by refusing every JS chunk, and
 * assert the server-rendered markup still becomes visible on its own.
 */
test.describe('boot failsafe (no hydration)', () => {
  test.beforeEach(async ({ page }) => {
    // Kill every client chunk: the page is now pure server-rendered HTML + CSS.
    await page.route('**/_next/static/chunks/**', (route) => route.abort());
  });

  test('hero content reveals itself without JavaScript', async ({ page }) => {
    await page.goto('/');
    const title = page.locator('.hero-title');
    await expect(title).toContainText('Vikram');
    // The failsafe fires at 2.2 s + 0.52 s; allow the animation to settle.
    await page.waitForTimeout(3200);
    const opacity = await title.evaluate((el) => Number(getComputedStyle(el).opacity));
    expect(opacity).toBeGreaterThan(0.95);
    await expect(title).toBeVisible();
  });

  test('preloader dismisses itself without JavaScript', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3200);
    const preloader = page.locator('.preloader');
    if ((await preloader.count()) > 0) {
      const state = await preloader.evaluate((el) => {
        const s = getComputedStyle(el);
        return { opacity: Number(s.opacity), visibility: s.visibility };
      });
      expect(state.opacity).toBeLessThan(0.05);
      expect(state.visibility).toBe('hidden');
    }
  });

  test('the failsafe stands down once the real boot completes', async ({ page }) => {
    // With `.page-ready` set (what the preloader does on reveal), the failsafe
    // rules must no longer match — framer-motion owns the hero from then on.
    await page.goto('/');
    await page.evaluate(() => document.body.classList.add('page-ready'));
    const applied = await page.locator('.hero-title').evaluate(
      (el) => getComputedStyle(el).animationName,
    );
    expect(applied).not.toContain('boot-failsafe');
  });
});
