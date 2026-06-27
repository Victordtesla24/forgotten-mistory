import { test, expect, type Page, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * WAVE 9 — Visual effects B (#24 SprintBurndown, #25 PacketFlowGraph, #26 AtoEvidenceBar).
 * Studio-grade, restrained, strictly-monochrome motion that MUST flatten under
 * prefers-reduced-motion while every SVG infographic stays readable and the
 * resume-sourced figures stay intact.
 *
 *   #24 SprintBurndown  — glassmorphic panel, a third (trend) series, a gradient area
 *                         fill, spring-pop data points on hover.
 *   #25 PacketFlowGraph — pulsing node rings, edge weight labels, glowing particle
 *                         trails, a spring count-up readout.
 *   #26 AtoEvidenceBar  — spring-physics bar collapse, particle shimmer along the bar,
 *                         all resume figures preserved (NN-3).
 */

const SRC = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const SPRINT_SRC = SRC('components/fx/SprintBurndown.tsx');
const ATO_SRC = SRC('components/fx/AtoEvidenceBar.tsx');

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

async function hasBackdropBlur(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return false;
    const cs = getComputedStyle(el);
    const bf = `${cs.backdropFilter} ${(cs as unknown as Record<string, string>).webkitBackdropFilter ?? ''}`;
    return /blur\(/.test(bf);
  }, selector);
}

const animName = (loc: Locator) =>
  loc.evaluate((el) => getComputedStyle(el as HTMLElement).animationName);

// ── #24 SprintBurndown ────────────────────────────────────────────────────────────
test.describe('WAVE9 #24 — SprintBurndown multi-series + area fill + glass', () => {
  test.describe.configure({ timeout: 90000 });

  test('glassmorphic panel renders a 3-series chart with a gradient area fill', async ({ page }) => {
    await gotoHome(page);
    const chart = page.locator('[data-testid="sprint-burndown"]');
    await chart.scrollIntoViewIfNeeded();
    await expect(chart).toBeVisible();

    expect(await hasBackdropBlur(page, '[data-testid="sprint-burndown"]'), 'panel must use a backdrop blur').toBe(true);
    await expect(chart.locator('[data-testid="burndown-ideal"]')).toBeAttached();
    await expect(chart.locator('[data-testid="burndown-actual"]')).toBeAttached();
    await expect(chart.locator('[data-testid="burndown-trend"]')).toBeAttached();

    const area = chart.locator('[data-burndown-area]').first();
    await expect(area).toBeAttached();
    const fill = await area.evaluate((el) => el.getAttribute('fill'));
    expect(fill, 'area must be filled with a gradient').toMatch(/url\(#/);
  });

  test('source: data points spring-pop on hover', () => {
    expect(SPRINT_SRC).toMatch(/whileHover/);
    expect(SPRINT_SRC).toMatch(/type:\s*'spring'/);
  });

  test('reduced motion: the chart marks itself static', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    const chart = page.locator('[data-testid="sprint-burndown"]');
    await chart.scrollIntoViewIfNeeded();
    expect(await chart.getAttribute('data-reduced-motion')).toBe('true');
  });
});

// ── #25 PacketFlowGraph ─────────────────────────────────────────────────────────────
test.describe('WAVE9 #25 — PacketFlowGraph pulses + weights + glowing trails', () => {
  test.describe.configure({ timeout: 90000 });

  test('nodes pulse, edges carry weight labels, particles ride glowing trails', async ({ page }) => {
    await gotoHome(page);
    const graph = page.locator('[data-testid="packet-flow-graph"]');
    await graph.scrollIntoViewIfNeeded();
    await expect(graph).toBeVisible();

    const pulse = graph.locator('[data-pfg-pulse]').first();
    await expect(pulse).toBeAttached();
    expect(await animName(pulse), 'node rings must pulse').not.toBe('none');

    await expect(graph.locator('[data-pfg-weight]').first()).toBeAttached();
    await expect
      .poll(async () => graph.locator('[data-pfg-trail]').count(), { timeout: 6000 })
      .toBeGreaterThanOrEqual(1);
  });

  test('reduced motion: pulses pinned, trails suppressed, marked static', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    const graph = page.locator('[data-testid="packet-flow-graph"]');
    await graph.scrollIntoViewIfNeeded();

    expect(await graph.getAttribute('data-reduced-motion')).toBe('true');
    expect(await animName(graph.locator('[data-pfg-pulse]').first())).toBe('none');
    expect(await graph.locator('[data-pfg-trail]').count()).toBe(0);
  });
});

// ── #26 AtoEvidenceBar ──────────────────────────────────────────────────────────────
test.describe('WAVE9 #26 — AtoEvidenceBar spring collapse + shimmer + parity', () => {
  test.describe.configure({ timeout: 90000 });

  test('bar emits shimmer particles and preserves every resume figure', async ({ page }) => {
    await gotoHome(page);
    const bar = page.locator('[data-testid="ato-evidence-bar"]');
    await bar.scrollIntoViewIfNeeded();
    await expect(bar).toBeVisible();

    await expect
      .poll(async () => bar.locator('[data-ato-spark]').count(), { timeout: 6000 })
      .toBeGreaterThanOrEqual(1);

    // Resume-sourced figures stay intact (NN-3): the bar's collapse IS the ≈92% cut.
    const text = await bar.innerText();
    expect(text).toMatch(/≈?\s*92%/);
    expect(text).toContain('~3 h');
    expect(text).toContain('~15 min');
    expect(text).toMatch(/200\+/);
  });

  test('source: spring-physics collapse', () => {
    expect(ATO_SRC).toMatch(/type:\s*'spring'/);
  });

  test('reduced motion: marked static, shimmer suppressed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    const bar = page.locator('[data-testid="ato-evidence-bar"]');
    await bar.scrollIntoViewIfNeeded();

    expect(await bar.getAttribute('data-reduced-motion')).toBe('true');
    expect(await bar.locator('[data-ato-spark]').count()).toBe(0);
  });
});
