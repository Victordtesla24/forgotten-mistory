import { test, expect } from '@playwright/test';

/**
 * The vertical spine (design council R-c1, C2).
 *
 * An executive reads alignment as care. At 1440 the page used to carry four
 * different left margins — hero at 176, About/Experience/Skills at 96, Vitrine
 * at 168, Listen at 352 — because every section invented its own container
 * width and centred it. One token, `--page-max`, now sets the single content
 * column, and every section's first heading lands on it.
 *
 * Measured, not inferred: the left edge of each section's title element is
 * read from the rendered page at five viewports and every edge must agree
 * with the others within a pixel.
 */

const SPINE = [
  '#hero h1',
  '#about h2',
  '#experience h2',
  '#skills h2',
  '#vitrine h2',
  '#listen h2',
];

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 834, height: 1194 },
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];

async function leftEdges(page: import('@playwright/test').Page) {
  const edges: Record<string, number> = {};
  for (const selector of SPINE) {
    const box = await page.locator(selector).first().boundingBox();
    expect(box, `${selector} must render`).not.toBeNull();
    edges[selector] = box!.x;
  }
  return edges;
}

test.describe('Vertical spine', () => {
  for (const viewport of VIEWPORTS) {
    test(`TC-SPINE-01 @ ${viewport.width}: all six section titles share one left edge`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');
      await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 15000 });
      // Walk the page so every lazily composed section has laid out.
      await page.evaluate(async () => {
        const height = document.body.scrollHeight;
        for (let y = 0; y < height; y += 600) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
        window.scrollTo(0, 0);
      });

      const edges = await leftEdges(page);
      const values = Object.values(edges);
      const min = Math.min(...values);
      const max = Math.max(...values);
      expect(
        max - min,
        `left edges differ by more than 1px: ${JSON.stringify(
          Object.fromEntries(Object.entries(edges).map(([k, v]) => [k, Math.round(v * 10) / 10])),
        )}`,
      ).toBeLessThanOrEqual(1);
    });
  }

  test('TC-SPINE-02: the spine is one token, read by the hero container', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 15000 });
    const token = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--page-max').trim(),
    );
    expect(token, '--page-max must be declared on :root').toBe('78rem');
    // At 1440 the spine resolves to (1440 - 2*72 gutter - 1248 column)/2 + 72 = 96.
    const box = await page.locator('#hero h1').boundingBox();
    expect(Math.round(box!.x)).toBe(96);
  });
});
