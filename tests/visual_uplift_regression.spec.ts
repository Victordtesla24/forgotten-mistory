import { test, expect, type Page } from '@playwright/test';

const TARGET_URL = process.env.TEST_TARGET_URL || 'http://127.0.0.1:8080';

const OUTCOME_LABELS = [
  'Cloud Modernisation',
  'Realtime Reliability',
  'AI Quality & Risk',
  'Leadership Scale',
  'Strategic Alignment',
  'Portfolio Value',
];

async function gotoHome(page: Page) {
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
  const preloader = page.locator('.preloader');
  if (await preloader.count()) {
    await preloader.first().waitFor({ state: 'hidden', timeout: 12000 }).catch(() => undefined);
  }
  await page.waitForTimeout(500);
}

test.describe('Visual runtime and uplift regressions', () => {
  test('starfield canvas is present and visible', async ({ page }) => {
    await gotoHome(page);
    const canvas = page.locator('.space-scene-layer canvas').first();

    await expect(canvas).toBeVisible({ timeout: 15000 });

    const metrics = await canvas.evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return {
        width: rect.width,
        height: rect.height,
        display: style.display,
        visibility: style.visibility,
        opacity: Number(style.opacity || '1'),
      };
    });

    expect(metrics.width).toBeGreaterThan(320);
    expect(metrics.height).toBeGreaterThan(320);
    expect(metrics.display).not.toBe('none');
    expect(metrics.visibility).not.toBe('hidden');
    expect(metrics.opacity).toBeGreaterThan(0);
  });

  test('parallax responds to scroll delta', async ({ page }) => {
    await gotoHome(page);
    const parallaxTargets = page.locator('[data-parallax="true"]');
    await expect(parallaxTargets.first()).toBeVisible();
    const before = await parallaxTargets.evaluateAll((elements) =>
      elements.map((el) => getComputedStyle(el).transform),
    );

    await page.evaluate(() => {
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: Math.min(900, maxScroll), behavior: 'auto' });
    });
    await page.waitForTimeout(700);

    const after = await parallaxTargets.evaluateAll((elements) =>
      elements.map((el) => getComputedStyle(el).transform),
    );

    const hasDelta = after.some((transform, index) => transform !== before[index]);
    expect(hasDelta).toBeTruthy();
  });

  test('all six outcome cards uplift on hover and open flyout', async ({ page }) => {
    await gotoHome(page);
    const cards = page.locator('[data-outcome-card="true"]');
    await expect(cards).toHaveCount(6);

    for (let index = 0; index < OUTCOME_LABELS.length; index += 1) {
      const card = cards.nth(index);
      await expect(card).toContainText(OUTCOME_LABELS[index]);

      await card.scrollIntoViewIfNeeded();
      const changed = await card.evaluate(async (el) => {
        const beforeStyle = getComputedStyle(el);
        const before = {
          transform: beforeStyle.transform,
          boxShadow: beforeStyle.boxShadow,
          borderColor: beforeStyle.borderColor,
        };

        el.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 220));

        const afterStyle = getComputedStyle(el);
        const after = {
          transform: afterStyle.transform,
          boxShadow: afterStyle.boxShadow,
          borderColor: afterStyle.borderColor,
        };

        el.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));

        return (
          before.transform !== after.transform ||
          before.boxShadow !== after.boxShadow ||
          before.borderColor !== after.borderColor
        );
      });
      expect(changed).toBeTruthy();
    }

    await cards.first().click();
    await expect(page.locator('[aria-label="Close detail view"]')).toBeVisible();
  });

  test('mini vic renders as a single uplifted widget instance', async ({ page }) => {
    await gotoHome(page);

    const miniVicToggle = page.locator('button[aria-label*="Mini Vic assistant"]');
    await expect(miniVicToggle).toHaveCount(1);

    await miniVicToggle.first().click();
    await expect(page.getByText('Mini Vic')).toBeVisible();
    await expect(page.getByPlaceholder('Ask me anything—teams, budgets, AI stack...')).toBeVisible();
  });
});
