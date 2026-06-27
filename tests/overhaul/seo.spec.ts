import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-SEO / OD-2 — Open Graph + Twitter social card.
 *
 * Verifies the static social card (public/assets/og-image.png, wired via the
 * layout.tsx metadata) is present in the document head (og:image + twitter:image),
 * that the image resolves 200 against the build under test, and that it is the
 * mandated 1200×630 size. Also confirms the Person JSON-LD carries an image
 * (OD-2 step 3).
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('TC-FR-SEO — Open Graph image (OD-2)', () => {
  test.describe.configure({ timeout: 90000 });
  test.beforeEach(async ({ page }) => gotoHome(page));

  test('og:image meta tag exists and points at the generated card', async ({ page }) => {
    const og = page.locator('meta[property="og:image"]');
    await expect(og).toHaveCount(1);
    const content = await og.getAttribute('content');
    expect(content, 'og:image content must be set').toBeTruthy();
    expect(content!).toMatch(/og-image/);
  });

  test('og:image resolves 200 as an image against the build under test', async ({ page }) => {
    const content = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(content).toBeTruthy();
    // og:image is absolute (metadataBase). Re-resolve the path against the
    // baseURL so we exercise THIS build, not the live production site.
    const path = new URL(content!).pathname;
    const res = await page.request.get(path);
    expect(res.status(), `GET ${path}`).toBe(200);
    expect(res.headers()['content-type'] ?? '').toContain('image/png');
  });

  test('og:image declares the mandated 1200×630 dimensions', async ({ page }) => {
    const w = await page.locator('meta[property="og:image:width"]').getAttribute('content');
    const h = await page.locator('meta[property="og:image:height"]').getAttribute('content');
    expect(w).toBe('1200');
    expect(h).toBe('630');
  });

  test('twitter:image is wired for the summary_large_image card', async ({ page }) => {
    const tw = page.locator('meta[name="twitter:image"]');
    await expect(tw).toHaveCount(1);
    const content = await tw.getAttribute('content');
    expect(content!).toMatch(/og-image/);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      'content',
      'summary_large_image',
    );
  });

  test('Person JSON-LD carries an image (OD-2)', async ({ page }) => {
    const blocks = await page
      .locator('script[type="application/ld+json"]')
      .allTextContents();
    const person = blocks
      .map((b) => {
        try {
          return JSON.parse(b) as Record<string, unknown>;
        } catch {
          return null;
        }
      })
      .find((j) => j && j['@type'] === 'Person');
    expect(person, 'Person JSON-LD present').toBeTruthy();
    expect(typeof person!.image, 'Person.image set').toBe('string');
    expect((person!.image as string).length).toBeGreaterThan(0);
  });
});
