import { test, expect, type Page } from '@playwright/test';

/**
 * TC-NFR-TYPE — Typography discipline (prompt §3 / SPEC §3.2 / NN copy quality).
 *
 * The shipped site loads at most 2 font families: a high-contrast grotesque as
 * the display/heading face (Space Grotesk, self-hosted via next/font) and Inter
 * for body. Playfair Display, Roboto, Source Sans Pro, Source Sans 3 and Roboto
 * Condensed are dropped. Metric numerals are tabular.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
  // Web fonts (next/font) must be applied before reading computed styles.
  await page.evaluate(() => (document as Document & { fonts: FontFaceSet }).fonts.ready);
  await page.waitForTimeout(300);
}

const norm = (s: string) => s.replace(/\s+/g, ' ').trim().toLowerCase();

test.describe('TC-NFR-TYPE — typography', () => {
  test.describe.configure({ timeout: 90000 });
  test.beforeEach(async ({ page }) => gotoHome(page));

  test('body + headings resolve to ≤2 distinct font-family stacks', async ({ page }) => {
    const stacks = await page.evaluate(() => {
      const out: string[] = [];
      const body = document.body;
      if (body) out.push(getComputedStyle(body).fontFamily);
      for (const sel of ['h1', 'h2', 'h3']) {
        const el = document.querySelector(sel);
        if (el) out.push(getComputedStyle(el).fontFamily);
      }
      return out;
    });
    expect(stacks.length).toBeGreaterThanOrEqual(2);
    const distinct = new Set(stacks.map(norm));
    expect(distinct.size, `distinct font-family stacks: ${Array.from(distinct).join(' || ')}`).toBeLessThanOrEqual(2);
  });

  test('no element computes to Playfair Display (dropped)', async ({ page }) => {
    const offenders = await page.evaluate(() => {
      const hits: string[] = [];
      const sels = ['body', 'h1', 'h2', 'h3', '.role', '.nav-link', '.counter', '.section-title'];
      for (const sel of sels) {
        document.querySelectorAll(sel).forEach((el) => {
          const ff = getComputedStyle(el as Element).fontFamily;
          if (/playfair/i.test(ff)) hits.push(`${sel} :: ${ff}`);
        });
      }
      return hits;
    });
    expect(offenders, `Playfair leftovers:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('headings use the grotesque display face', async ({ page }) => {
    const headingFamilies = await page.evaluate(() => {
      const out: string[] = [];
      for (const sel of ['h1', 'h2', 'h3']) {
        const el = document.querySelector(sel);
        if (el) out.push(getComputedStyle(el).fontFamily);
      }
      return out;
    });
    expect(headingFamilies.length).toBeGreaterThan(0);
    for (const ff of headingFamilies) {
      expect(ff, `heading font-family was: ${ff}`).toMatch(/space.?grotesk/i);
    }
  });

  test('metric numerals are tabular', async ({ page }) => {
    const variant = await page.evaluate(() => {
      const el =
        document.querySelector('.meta-value') ||
        document.querySelector('.proof-value') ||
        document.querySelector('.arch-metric-value');
      return el ? getComputedStyle(el as Element).fontVariantNumeric : null;
    });
    expect(variant, 'no metric element found to verify tabular numerals').not.toBeNull();
    expect(variant!).toContain('tabular-nums');
  });
});
