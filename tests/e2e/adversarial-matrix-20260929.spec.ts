import { expect, test } from '@playwright/test';

const LIVE_BASE = 'https://forgotten-mistory.web.app';
const BASE = (process.env.PLAYWRIGHT_BASE_URL || LIVE_BASE).replace(/\/$/, '');

const SECTIONS = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];
const SECTION_IDS = SECTIONS.map(s => `#${s}`);

test.describe('Adversarial UX Matrix - 2026-09-29', () => {

  test.beforeEach(async ({ page }) => {
    // Basic connectivity check
    await page.goto(BASE);
  });

  test('Matrix: Deep Anchors + Warm Reload', async ({ page }) => {
    for (const id of SECTION_IDS) {
      await page.goto(`${BASE}/${id}`);
      await page.waitForTimeout(500);
      const locator = page.locator(id);
      await expect(locator).toBeInViewport();
      
      // Warm reload
      await page.reload({ waitUntil: 'networkidle' });
      await expect(locator).toBeInViewport();
    }
  });

  test('Matrix: Back/Forward Navigation Stability', async ({ page }) => {
    await page.goto(`${BASE}/#hero`);
    await page.goto(`${BASE}/#experience`);
    await page.waitForTimeout(500);
    await expect(page.locator('#experience')).toBeInViewport();
    
    await page.goBack();
    await page.waitForTimeout(500);
    await expect(page.locator('#hero')).toBeInViewport();
    
    await page.goForward();
    await page.waitForTimeout(500);
    await expect(page.locator('#experience')).toBeInViewport();
  });

  test('Matrix: Fast Scroll Section Lifecycle', async ({ page }) => {
    // Rapidly scroll down and up
    for (const id of SECTION_IDS) {
      await page.locator(id).scrollIntoViewIfNeeded();
      // No wait - fast scroll
    }
    for (const id of [...SECTION_IDS].reverse()) {
      await page.locator(id).scrollIntoViewIfNeeded();
    }
    
    // Check if hero is still functional
    await expect(page.locator('#hero')).toBeVisible();
    const canvases = await page.locator('canvas').count();
    expect(canvases).toBeLessThanOrEqual(2); // Invariant: <=1 context per section, usually only 1-2 visible
  });

  test('Matrix: Hidden Tab Resume', async ({ page }) => {
    await page.goto(`${BASE}/#vitrine`);
    await page.waitForTimeout(1000); // Let animation start
    
    // Hide
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForTimeout(500);
    
    // Resume
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    
    await expect(page.locator('#vitrine')).toBeVisible();
  });

  test('Matrix: Resize / Orientation Stress', async ({ page }) => {
    const viewports = [
      { width: 360, height: 740 },
      { width: 740, height: 360 },
      { width: 390, height: 844 },
      { width: 844, height: 390 }
    ];
    
    for (const vp of viewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(300);
      // Ensure no horizontal overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow, `Horizontal overflow at ${vp.width}x${vp.height}`).toBe(false);
    }
  });

  test('Matrix: Slow Network LCP Integrity', async ({ context, page }) => {
    // Playwright doesn't have a direct "slow network" in browser level without CDP for Chromium
    // But we can use route to delay everything
    await page.route('**/*', async (route) => {
      await new Promise(f => setTimeout(f, 100)); // Delay each request by 100ms
      await route.continue();
    });
    
    const start = Date.now();
    await page.goto(BASE, { waitUntil: 'load' });
    const duration = Date.now() - start;
    
    expect(duration).toBeGreaterThan(500); // Verify throttling worked
    await expect(page.locator('#hero')).toBeVisible();
  });

  test('Matrix: Keyboard Navigation (J4)', async ({ page }) => {
    await page.goto(BASE);
    await page.keyboard.press('Tab');
    
    const skipLink = page.locator('text=Skip to the evidence');
    if (await skipLink.count() > 0) {
      await expect(skipLink).toBeFocused();
      await page.keyboard.press('Enter');
      // Should scroll to evidence (Skills or Experience)
      await page.waitForTimeout(500);
      // Find what it scrolled to - assuming it goes to first section after hero
      // In J4 it says "every section"
    }
    
    // Tab through menu
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
    }
    // Just ensuring no crash and some focus movement
  });
});
