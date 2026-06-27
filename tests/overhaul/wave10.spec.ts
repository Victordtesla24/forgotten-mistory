import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * WAVE 10 — Modal, overlay, primitives, page (#27 DetailMaterialize, #28
 * FloatingDetailBox, #29 MiniVicBot, #30 Button, #31 ServiceWorkerRegister,
 * #32 Main Page). Studio-grade, monochrome, reduced-motion-safe.
 *
 * Canvas internals and dev-disabled / off-page primitives (the Button lives only
 * on the excluded /performance-benchmark route; the service worker is production
 * only) are asserted at the source level; everything observable is asserted live.
 */

const SRC = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const DM_SRC = SRC('components/fx/DetailMaterialize.tsx');
const FDB_SRC = SRC('components/FloatingDetailBox.tsx');
const MVB_SRC = SRC('components/MiniVicBot.tsx');
const BUTTON_SRC = SRC('components/ui/button.tsx');
const SW_SRC = SRC('components/site/ServiceWorkerRegister.tsx');

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

async function openPanel(page: Page) {
  const card = page.locator('[data-outcome-card="true"]').first();
  await card.scrollIntoViewIfNeeded();
  await card.click();
  await expect(page.locator('[data-detail-panel]')).toBeVisible({ timeout: 8000 });
}

// ── #27 DetailMaterialize ───────────────────────────────────────────────────────────
test.describe('WAVE10 #27 — DetailMaterialize multi-phase + comp-op restore', () => {
  test.describe.configure({ timeout: 90000 });

  test('source: multi-phase convergence and the composite op is restored each frame', () => {
    expect(DM_SRC, 'particles run a multi-phase burst → converge → settle').toMatch(/burst|converge|settle/i);
    expect(DM_SRC, 'the lighter blend must be restored to source-over (no cross-frame leak)').toMatch(
      /globalCompositeOperation\s*=\s*'source-over'/,
    );
  });

  test('opening a panel materialises the convergence canvas', async ({ page }) => {
    await gotoHome(page);
    await openPanel(page);
    await expect(page.locator('[data-detail-canvas]')).toBeAttached();
  });

  test('reduced motion: no convergence canvas is mounted', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await openPanel(page);
    expect(await page.locator('[data-detail-canvas]').count()).toBe(0);
  });
});

// ── #28 FloatingDetailBox ───────────────────────────────────────────────────────────
test.describe('WAVE10 #28 — FloatingDetailBox staggered reveal + glass depth + tilt', () => {
  test.describe.configure({ timeout: 90000 });

  test('panel reveals its evidence in a stagger over a glass depth layer', async ({ page }) => {
    await gotoHome(page);
    await openPanel(page);

    const stagger = page.locator('[data-panel-stagger]');
    await expect(stagger).toBeAttached();
    const items = stagger.locator(':scope > *');
    expect(await items.count()).toBeGreaterThanOrEqual(2);
    await expect
      .poll(
        async () => items.evaluateAll((els) => els.every((el) => Number(getComputedStyle(el as HTMLElement).opacity) > 0.9)),
        { timeout: 6000 },
      )
      .toBe(true);

    expect(await hasBackdropBlur(page, '.detail-panel-depth'), 'depth layer must be glassmorphic').toBe(true);
  });

  test('source: magnetic cursor tilt writes --panel-rx / --panel-ry', () => {
    expect(FDB_SRC).toMatch(/--panel-rx/);
    expect(FDB_SRC).toMatch(/--panel-ry/);
  });
});

// ── #29 MiniVicBot ──────────────────────────────────────────────────────────────────
test.describe('WAVE10 #29 — MiniVicBot stagger + glass backdrop + clean types', () => {
  test.describe.configure({ timeout: 90000 });

  test('panel opens with a glass backdrop and staggered message bubbles', async ({ page }) => {
    await gotoHome(page);
    await page.locator('[data-testid="minivic-toggle"]').click();
    const panel = page.locator('[data-testid="minivic-panel"]');
    await expect(panel).toBeVisible({ timeout: 8000 });

    expect(await hasBackdropBlur(page, '[data-testid="minivic-panel"]'), 'panel must be glassmorphic').toBe(true);

    const msg = panel.locator('[data-minivic-message]').first();
    await expect(msg).toBeAttached();
    await expect
      .poll(async () => Number(await msg.evaluate((el) => getComputedStyle(el as HTMLElement).opacity)), { timeout: 5000 })
      .toBeGreaterThan(0.9);
  });

  test('source: no `as any` casts remain', () => {
    expect(MVB_SRC).not.toMatch(/\bas any\b/);
  });
});

// ── #30 Button ──────────────────────────────────────────────────────────────────────
test.describe('WAVE10 #30 — Button glow + ripple + loading + glass + magnetic', () => {
  test('source: every elevated affordance is wired', () => {
    expect(BUTTON_SRC, 'glassmorphism variant').toMatch(/glass/);
    expect(BUTTON_SRC, 'loading spinner variant').toMatch(/loading/i);
    expect(BUTTON_SRC, 'ripple click effect').toMatch(/ripple/i);
    expect(BUTTON_SRC, 'magnetic hover handler').toMatch(/magnetic|onPointerMove/);
  });
});

// ── #31 ServiceWorkerRegister ───────────────────────────────────────────────────────
test.describe('WAVE10 #31 — ServiceWorkerRegister toast + update prompt', () => {
  test('source: update-available reload prompt is wired', () => {
    expect(SW_SRC).toMatch(/updatefound|updatefound|update/i);
    expect(SW_SRC).toMatch(/reload|location\.reload/i);
  });

  test('a polite toast region is present for SW notifications', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('[data-sw-toast]')).toBeAttached();
  });
});

// ── #32 Main Page ───────────────────────────────────────────────────────────────────
test.describe('WAVE10 #32 — Main page scroll-progress indicator', () => {
  test('a global scroll-progress indicator advances as the page scrolls', async ({ page }) => {
    await gotoHome(page);
    const bar = page.locator('[data-scroll-progress]');
    await expect(bar).toBeAttached();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.5));
    await page.waitForTimeout(500);

    const scaleX = await bar.evaluate((el) => {
      const t = getComputedStyle(el as HTMLElement).transform;
      if (!t || t === 'none') return 0;
      const m = t.match(/matrix\(([^)]+)\)/);
      return m ? parseFloat(m[1].split(',')[0]) : 0;
    });
    expect(scaleX, 'progress bar must scale with scroll').toBeGreaterThan(0.05);
  });
});
