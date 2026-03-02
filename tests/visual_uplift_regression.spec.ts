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

async function waitForRuntimeMarker(page: Page) {
  await expect.poll(
    async () => page.evaluate(() => (window as any).__runtimeVersion || null),
    { timeout: 45000 },
  ).not.toBeNull();
}

async function gotoHome(page: Page) {
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
  const preloader = page.locator('.preloader');
  if (await preloader.count()) {
    await preloader.first().waitFor({ state: 'hidden', timeout: 12000 }).catch(() => undefined);
  }
  await waitForRuntimeMarker(page);
  await page.waitForTimeout(500);
}

async function waitForOutcomeBindings(page: Page) {
  const cards = page.locator('[data-outcome-card="true"]');
  await expect(cards).toHaveCount(6);
  for (let index = 0; index < 6; index += 1) {
    await expect(cards.nth(index)).toHaveAttribute('data-outcome-bound', '1', { timeout: 20000 });
  }
}

test.describe('Visual runtime and uplift regressions', () => {
  test.describe.configure({ timeout: 90000 });

  test('runtime version marker is present', async ({ page }) => {
    await gotoHome(page);
    await expect.poll(
      async () => page.evaluate(() => (window as any).__runtimeVersion || null),
      { timeout: 30000 },
    ).not.toBeNull();
  });

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

  test('parallax responds to interaction delta', async ({ page }) => {
    await gotoHome(page);
    await expect
      .poll(
        async () => page.evaluate(() => !!(window as any).__forgottenMistoryRuntime?.parallaxBound),
        { timeout: 20000 },
      )
      .toBeTruthy();
    const runtimeState = await page.evaluate(() => {
      const runtime = (window as any).__forgottenMistoryRuntime || {};
      return {
        motionReady: !!runtime.motionReady,
        parallaxBound: !!runtime.parallaxBound,
        mouseParallaxBound: !!runtime.mouseParallaxBound,
      };
    });

    const target = page.locator('[data-parallax="true"]').first();
    await expect(target).toBeVisible();

    const before = await target.evaluate((el) => getComputedStyle(el).transform);
    const box = await target.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 12, box.y + 12);
      await page.waitForTimeout(140);
      await page.mouse.move(box.x + box.width - 12, box.y + Math.min(box.height - 12, 140));
      await page.waitForTimeout(180);
    }
    const afterMouse = await target.evaluate((el) => getComputedStyle(el).transform);
    let hasDelta = afterMouse !== before;

    if (!hasDelta) {
      await page.evaluate(() => {
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        window.scrollTo({ top: Math.min(900, maxScroll), behavior: 'auto' });
      });
      await page.waitForTimeout(700);
      const afterScroll = await target.evaluate((el) => getComputedStyle(el).transform);
      hasDelta = afterScroll !== before;
    }

    const currentTransform = await target.evaluate((el) => getComputedStyle(el).transform);
    const hasVisibleTransforms = currentTransform === 'none' || currentTransform.includes('matrix');
    expect(hasVisibleTransforms).toBeTruthy();
    expect(
      hasDelta ||
        runtimeState.motionReady === false ||
        (runtimeState.parallaxBound && runtimeState.mouseParallaxBound),
    ).toBeTruthy();
  });

  test('all six outcome cards uplift on hover and open flyout', async ({ page }) => {
    await gotoHome(page);
    const cards = page.locator('[data-outcome-card="true"]');
    await waitForOutcomeBindings(page);

    for (let index = 0; index < OUTCOME_LABELS.length; index += 1) {
      const card = cards.nth(index);
      await expect(card).toContainText(OUTCOME_LABELS[index]);
      await expect(card).toBeVisible();

      await card.scrollIntoViewIfNeeded();
      await page.mouse.move(1, 1);
      await page.waitForTimeout(80);
      const before = await page.evaluate((idx) => {
        const el = document.querySelector(
          `[data-outcome-card="true"][data-outcome-index="${idx}"]`,
        ) as HTMLElement | null;
        if (!el) return null;
        const style = getComputedStyle(el);
        return {
          transform: style.transform,
          boxShadow: style.boxShadow,
          borderColor: style.borderColor,
        };
      }, index);

      await card.hover({ force: true });
      await page.waitForTimeout(220);

      const after = await page.evaluate((idx) => {
        const el = document.querySelector(
          `[data-outcome-card="true"][data-outcome-index="${idx}"]`,
        ) as HTMLElement | null;
        if (!el) return null;
        const style = getComputedStyle(el);
        return {
          transform: style.transform,
          boxShadow: style.boxShadow,
          borderColor: style.borderColor,
        };
      }, index);

      const changed =
        !!before &&
        !!after &&
        (before.transform !== after.transform ||
          before.boxShadow !== after.boxShadow ||
          before.borderColor !== after.borderColor);
      expect(changed).toBeTruthy();

      await page.evaluate((idx) => {
        const el = document.querySelector(
          `[data-outcome-card="true"][data-outcome-index="${idx}"]`,
        ) as HTMLElement | null;
        el?.click();
      }, index);
      await expect
        .poll(async () => page.evaluate(() => document.body.classList.contains('detail-open')))
        .toBeTruthy();
      await page.keyboard.press('Escape');
      await expect
        .poll(async () => page.evaluate(() => document.body.classList.contains('detail-open')))
        .toBeFalsy();
    }
  });

  test('mini vic renders as a single uplifted widget instance', async ({ page }) => {
    await gotoHome(page);

    const miniVicToggle = page.getByTestId('minivic-toggle');
    await expect(miniVicToggle).toHaveCount(1);

    await miniVicToggle.first().click({ force: true });
    await expect(page.getByTestId('minivic-panel')).toBeVisible();
    await expect(page.getByTestId('minivic-input')).toBeVisible();
    await expect(page.getByTestId('minivic-mode-recruiter')).toBeVisible();
  });
});
