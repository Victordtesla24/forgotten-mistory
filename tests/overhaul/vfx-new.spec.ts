import { test, expect, type Page } from '@playwright/test';

/**
 * TC-VFX-1/2/3 — New signature VFX components per SPEC §7:
 * - PacketFlowGraph (WebSocket particle graph)
 * - SprintBurndown (animated burndown infographic)
 * - TokenReflow (prompt optimisation visualiser)
 *
 * Each must mount without runtime errors, render its SVG/elements, and
 * provide a reduced-motion static fallback.
 */

function isAppError(msg: string): boolean {
  const ignored = [
    /MIME type/i,
    /404.*Not Found/i,
    /Failed to load resource/i,
    /favicon/i,
    /service-worker/i,
  ];
  return !ignored.some((re) => re.test(msg));
}

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'networkidle' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('TC-VFX-1 — PacketFlowGraph', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with SVG graph and readout, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(800);

    const graph = page.locator('[data-testid="packet-flow-graph"]');
    await expect(graph).toBeVisible({ timeout: 5000 });

    const svg = graph.locator('svg');
    await expect(svg).toBeVisible();

    const readout = graph.locator('[data-testid="pfg-readout"]');
    await expect(readout).toBeVisible();

    expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('reduced-motion fallback renders static state', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(600);

    const graph = page.locator('[data-testid="packet-flow-graph"]');
    await expect(graph).toBeVisible({ timeout: 5000 });

    // The static-fallback flag must actually engage under emulated reduced motion.
    const hasAttr = await graph.getAttribute('data-reduced-motion');
    expect(hasAttr).toBe('true');

    // And the animated particles must NOT render/animate: the component gates
    // <circle class="pfg-particle"> on !prefersReducedMotion, and CSS hides any
    // residual particle. Under reduced motion zero particles may be present.
    const particles = graph.locator('.pfg-particle');
    await expect(particles).toHaveCount(0);
  });
});

test.describe('TC-VFX-2 — SprintBurndown', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with SVG path and data points, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(800);

    const chart = page.locator('[data-testid="sprint-burndown"]');
    await expect(chart).toBeVisible({ timeout: 5000 });

    const svg = chart.locator('svg');
    await expect(svg).toBeVisible();

    const idealPath = chart.locator('[data-testid="burndown-ideal"]');
    await expect(idealPath).toBeVisible();

    const actualPath = chart.locator('[data-testid="burndown-actual"]');
    await expect(actualPath).toBeVisible();

    expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('reduced-motion fallback renders static chart', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(600);

    const chart = page.locator('[data-testid="sprint-burndown"]');
    await expect(chart).toBeVisible({ timeout: 5000 });

    // The static-fallback flag must actually engage under emulated reduced motion.
    const hasAttr = await chart.getAttribute('data-reduced-motion');
    expect(hasAttr).toBe('true');

    // And the actual line must be at its FINAL drawn state with no draw-on
    // animation: under reduced motion the component resolves strokeDashoffset to
    // 0 and skips the Framer draw-on, so the computed offset settles at 0px.
    const actualPath = chart.locator('[data-testid="burndown-actual"]');
    await expect(actualPath).toBeVisible();
    await expect
      .poll(
        () =>
          actualPath.evaluate(
            (el) => getComputedStyle(el as SVGElement).strokeDashoffset
          ),
        { timeout: 5000 }
      )
      .toBe('0px');
  });
});

test.describe('TC-VFX-3 — TokenReflow', () => {
  test.describe.configure({ timeout: 60000 });

  test('mounts with ≥10 token pills, zero console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && isAppError(msg.text())) errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(800);

    const reflow = page.locator('[data-testid="token-reflow"]');
    await expect(reflow).toBeVisible({ timeout: 5000 });

    const pills = reflow.locator('[data-testid="token-pill"]');
    const count = await pills.count();
    expect(count).toBeGreaterThanOrEqual(10);

    expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
  });

  test('reduced-motion fallback shows static layout', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(600);

    const reflow = page.locator('[data-testid="token-reflow"]');
    await expect(reflow).toBeVisible({ timeout: 5000 });

    // The static-fallback flag must actually engage under emulated reduced motion.
    const hasAttr = await reflow.getAttribute('data-reduced-motion');
    expect(hasAttr).toBe('true');

    // And the optimised stacked layout (the showOptimised path) must be shown
    // immediately: under reduced motion the component forces showOptimised=true
    // and renders the OPTIMAL_ORDER stack as `.token-pill.stacked` spans. Without
    // reduced motion these only appear after the 1s phase timer, so their
    // immediate presence proves the static fallback engaged.
    const stacked = reflow.locator('.token-pill.stacked');
    await expect(stacked).toHaveCount(12);
  });
});
