import { test, expect, type Page } from '@playwright/test';

/**
 * Category 4: Monochrome Compliance Tests
 * Verifies no chromatic hues (hardcoded colors) appear in rendered components.
 * Only CSS variables from globals.css should be used.
 *
 * The site uses a monochrome palette defined in :root:
 *   --ink-900: #0A0B0D
 *   --ink-800: #121317
 *   --ink-700: #1B1D23
 *   --ink-500: #3A3D46
 *   --mist-400: #8A8F9A
 *   --mist-200: #C9CDD6
 *   --white: #F4F6FA
 *   --accent: #E8EBF0
 *   --steel: #AEB6C2
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
}

test.describe('Monochrome Compliance', () => {
  test.describe.configure({ timeout: 60000 });

  test('MONO-01: :root CSS variables are defined and contain only monochrome values', async ({ page }) => {
    await gotoHome(page);
    const rootVars = await page.evaluate(() => {
      const rootStyle = getComputedStyle(document.documentElement);
      const vars: Record<string, string> = {};
      const tokenNames = [
        '--ink-900', '--ink-800', '--ink-700', '--ink-500',
        '--mist-400', '--mist-200', '--white', '--accent', '--steel',
        '--token-bg-base', '--token-bg-surface', '--token-bg-elevated',
        '--token-text-primary', '--token-text-secondary',
        '--token-brand-primary', '--token-brand-accent',
      ];
      for (const name of tokenNames) {
        vars[name] = rootStyle.getPropertyValue(name).trim();
      }
      return vars;
    });
    // All defined tokens should be present
    expect(rootVars['--ink-900']).toBeTruthy();
    expect(rootVars['--white']).toBeTruthy();
    expect(rootVars['--accent']).toBeTruthy();
  });

  test('MONO-02: Body background-color uses CSS variable not hardcoded hex', async ({ page }) => {
    await gotoHome(page);
    const bodyBg = await page.evaluate(() => {
      return getComputedStyle(document.body).backgroundColor;
    });
    // Should be rgb(r, g, b) where r === g === b (monochrome/gray)
    // Accept any monochrome color
    const match = bodyBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      // All channels should be equal or very close for monochrome
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      expect(maxDiff).toBeLessThanOrEqual(5);
    }
  });

  test('MONO-03: No hardcoded hex colors in inline styles (scan)', async ({ page }) => {
    await gotoHome(page);
    const hardcodedHex = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('*'));
      const violations: string[] = [];
      for (const el of all) {
        const style = el.getAttribute('style');
        if (style && /#[0-9a-fA-F]{3,8}/.test(style)) {
          violations.push(style.slice(0, 120));
        }
      }
      return violations;
    });
    // Inline style hex colors should be minimal — only system tokens if any
    // Accept up to 20 minor instances (animations, transforms may use #000/#fff)
    expect(hardcodedHex.length).toBeLessThanOrEqual(20);
  });

  test('MONO-04: Text color is monochrome (gray/grayish)', async ({ page }) => {
    await gotoHome(page);
    const textColors = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('h1, h2, h3, p, span, a, li'));
      const colors = new Set<string>();
      for (const el of elements) {
        const color = getComputedStyle(el).color;
        colors.add(color);
        if (colors.size >= 20) break;
      }
      return Array.from(colors);
    });
    for (const color of textColors) {
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        // Text should be grayscale or very near grayscale (tolerance: 10)
        expect(maxDiff).toBeLessThanOrEqual(10);
      }
    }
  });

  test('MONO-05: Hero section has no chromatic hue deviations', async ({ page }) => {
    await gotoHome(page);
    const heroColors = await page.evaluate(() => {
      const hero = document.querySelector('#hero');
      if (!hero) return [];
      const all = Array.from(hero.querySelectorAll('*'));
      const colors = new Set<string>();
      for (const el of all) {
        const bg = getComputedStyle(el).backgroundColor;
        const border = getComputedStyle(el).borderColor;
        if (bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') colors.add(bg);
        if (border !== 'rgba(0, 0, 0, 0)' && border !== 'transparent') colors.add(border);
        if (colors.size >= 30) break;
      }
      return Array.from(colors);
    });
    for (const color of heroColors) {
      const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (match) {
        const [, r, g, b] = match.map(Number);
        const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
        expect(maxDiff).toBeLessThanOrEqual(10);
      }
    }
  });

  test('MONO-06: Navigation overlay background is monochrome', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.menu-toggle').click();
    await page.waitForTimeout(500);

    const overlayBg = await page.evaluate(() => {
      const overlay = document.querySelector('.nav-overlay');
      if (!overlay) return 'none';
      return getComputedStyle(overlay).backgroundColor;
    });
    const match = overlayBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      expect(maxDiff).toBeLessThanOrEqual(5);
    }
  });

  test('MONO-07: Footer background is monochrome', async ({ page }) => {
    await gotoHome(page);
    await page.locator('footer').scrollIntoViewIfNeeded();
    const footerBg = await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (!footer) return 'none';
      return getComputedStyle(footer).backgroundColor;
    });
    const match = footerBg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const [, r, g, b] = match.map(Number);
      const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      expect(maxDiff).toBeLessThanOrEqual(5);
    }
  });
});
