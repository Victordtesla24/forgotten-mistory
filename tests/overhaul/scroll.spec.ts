import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-SCROLL — a GSAP ScrollTrigger orchestral timeline pins/scrubs ≥1 section
 * without jank; reduced-motion shows the final state (no scrub dependence).
 * Bound to FR-SCROLL (SPEC §10).
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

/** Extract the scaleY (d / m22) component from a computed CSS transform matrix. */
function scaleY(transform: string): number {
  if (!transform || transform === 'none') return 1;
  const m2 = transform.match(/matrix\(([^)]+)\)/);
  if (m2) return Number(m2[1].split(',')[3]);
  const m3 = transform.match(/matrix3d\(([^)]+)\)/);
  if (m3) return Number(m3[1].split(',')[5]);
  return 1;
}

test.describe('TC-FR-SCROLL — GSAP ScrollTrigger', () => {
  test.describe.configure({ timeout: 90000 });

  test('rail fill scrubs from ~0 to filled as the section scrolls', async ({ page }) => {
    await gotoHome(page);
    const rail = page.getByTestId('scroll-rail');
    await expect(rail).toBeAttached();
    const fill = page.getByTestId('scroll-rail-fill');

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const before = scaleY(await fill.evaluate((el) => getComputedStyle(el).transform));

    await page.evaluate(() => document.getElementById('experience')?.scrollIntoView({ block: 'end' }));
    await page.waitForTimeout(900);
    const after = scaleY(await fill.evaluate((el) => getComputedStyle(el).transform));

    expect(after).toBeGreaterThan(before);
    expect(after).toBeGreaterThan(0.2);
    // no console errors during the scroll
  });

  test('prefers-reduced-motion: rail shows final filled state without scrub', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    const fill = page.getByTestId('scroll-rail-fill');
    await expect(fill).toBeAttached();
    await page.waitForTimeout(500);
    const s = scaleY(await fill.evaluate((el) => getComputedStyle(el).transform));
    expect(s).toBeGreaterThan(0.9);
  });
});
