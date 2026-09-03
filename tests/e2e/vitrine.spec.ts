import { test, expect } from '@playwright/test';

/**
 * What is keeping me busy — the long vitrine.
 *
 * Three claims hold this section up, and this file holds all three. Six plates
 * out of thirty-eight repositories, so the selection is an editorial act rather
 * than a directory listing. Every plate states what its repository does NOT do.
 * And the metrics are harvested from the real API on a stated date, never live
 * and never typed by hand — a number on a plate a reader cannot trace is worth
 * less than no number at all.
 */

const VITRINE = '#vitrine';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator(VITRINE).scrollIntoViewIfNeeded();
});

test.describe('Vitrine', () => {
  test('TC-VIT-01: exactly six plates, each with a source link', async ({ page }) => {
    const plates = page.locator(`${VITRINE} ol > li`);
    await expect(plates).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await expect(
        plates.nth(i).locator('a[href^="https://github.com/Victordtesla24/"]'),
      ).toHaveCount(1);
    }
  });

  test('TC-VIT-02: every plate states its limits', async ({ page }) => {
    // The section's hardest rule. A plate that cannot say what its repository
    // does not do has not been looked at closely enough to be shown.
    const plates = page.locator(`${VITRINE} ol > li`);
    for (let i = 0; i < 6; i++) {
      // innerText applies text-transform, so the label reads LIMITS on screen
      // even though the source says "Limits".
      const text = await plates.nth(i).innerText();
      expect(text.toUpperCase(), `plate ${i}`).toContain('LIMITS');
      const limits = text.toUpperCase().split('LIMITS')[1]?.trim() ?? '';
      expect(limits.length, `limits text on plate ${i}`).toBeGreaterThan(30);
    }
  });

  test('TC-VIT-03: metrics are harvested and dated, not live', async ({ page }) => {
    await expect(page.locator(VITRINE)).toContainText('harvested');
    await expect(page.locator(VITRINE)).toContainText(/harvested \d{4}-\d{2}-\d{2}/);
    await expect(page.locator(VITRINE)).toContainText('not live');
    // The real commit count for the flagship repository, from the harvest.
    await expect(page.locator(`${VITRINE} ol > li`).first()).toContainText('1,664');
  });

  test('TC-VIT-04: the exclusions are named with reasons', async ({ page }) => {
    // Worth more than any repository included: it proves the six were chosen.
    await expect(page.locator(VITRINE)).toContainText('Excluded, and why');
    await expect(page.locator(VITRINE)).toContainText('vik-legal-defence');
    await expect(page.locator(VITRINE)).toContainText('environment file was committed');
  });

  test('TC-VIT-05: no screenshots, logos or raster images', async ({ page }) => {
    // Every drawing is an inline mechanism diagram. A screenshot would show what
    // a repository looks like; the drawing shows what it does.
    await expect(page.locator(`${VITRINE} img`)).toHaveCount(0);
    const drawings = page.locator(`${VITRINE} svg[role="img"]`);
    await expect(drawings).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await expect(drawings.nth(i).locator('title')).not.toHaveText('');
      await expect(drawings.nth(i).locator('desc')).not.toHaveText('');
    }
  });

  test('TC-VIT-06: the light tracks the plate at the centre of the rail', async ({ page }) => {
    const plates = page.locator(`${VITRINE} ol > li`);
    const litIndex = async () =>
      plates.evaluateAll((nodes) => nodes.findIndex((n) => n.hasAttribute('data-lit')));

    const first = await litIndex();
    expect(first).toBeGreaterThanOrEqual(0);

    await page.locator(`${VITRINE} ol`).evaluate((rail) => {
      rail.scrollBy({ left: rail.clientWidth * 1.5, behavior: 'instant' as ScrollBehavior });
    });
    await page.waitForTimeout(400);
    expect(await litIndex()).toBeGreaterThan(first);
  });

  test('TC-VIT-07: the rail is keyboard operable and traps nothing', async ({ page }) => {
    const plates = page.locator(`${VITRINE} ol > li`);
    await plates.first().focus();
    await expect(plates.first()).toBeFocused();
    await plates.first().press('ArrowRight');
    await page.waitForTimeout(500);
    await expect(plates.nth(1)).toBeFocused();
    // Tab must still leave the rail — a horizontal scroller that swallows focus
    // is a keyboard trap regardless of how good it looks.
    await page.keyboard.press('Tab');
    await expect(plates.nth(1)).not.toBeFocused();
  });

  test('TC-VIT-08: the kicker denominator matches the harvest', async ({ page }) => {
    await expect(page.locator(VITRINE)).toContainText('38 public repositories');
    await expect(page.locator(`${VITRINE} h2`)).toContainText('Six of thirty-eight');
  });

  test('TC-VIT-09: every plate rules its metrics on the same line', async ({ page }) => {
    // The rail has to read as one cabinet, not six unrelated cards. That claim
    // is entirely carried by horizontal alignment: the COMMITS / ACTIVE / STACK
    // row, the LIMITS block and the source link must start at the same offset
    // inside every plate, so the eye tracks straight across the rail.
    //
    // It broke once, invisibly to every other assertion here: one drawing is
    // authored on a 320x122 crop while the other five are 320x200, so with the
    // drawing sized by its own aspect that plate's metrics began 99px higher
    // than its neighbours'. The band is now fixed in CSS rather than by each
    // drawing's viewBox, and this is the test that would have caught it.
    const offsets = await page.locator(`${VITRINE} ol > li`).evaluateAll((plates) =>
      plates.map((li) => {
        const top = li.getBoundingClientRect().top;
        const at = (frag: string) => {
          const el = Array.from(li.querySelectorAll('*')).find((e) =>
            (e.className?.toString() ?? '').includes(frag),
          );
          return el ? Math.round(el.getBoundingClientRect().top - top) : -1;
        };
        return { metrics: at('metrics'), limits: at('limits'), links: at('links') };
      }),
    );

    expect(offsets.length).toBeGreaterThanOrEqual(6);
    for (const row of ['metrics', 'limits', 'links'] as const) {
      const values = offsets.map((o) => o[row]);
      expect(values, `${row} was not found on every plate`).not.toContain(-1);
      const spread = Math.max(...values) - Math.min(...values);
      // A pixel or two of sub-pixel rounding is fine; a row is not.
      expect(spread, `${row} varies by ${spread}px across the rail: ${values.join(', ')}`)
        .toBeLessThanOrEqual(2);
    }
  });
});
