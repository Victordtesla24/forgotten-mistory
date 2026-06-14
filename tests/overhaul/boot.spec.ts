import { test, expect, type Page } from '@playwright/test';
import { ensureStaticBuild, startStaticServer, type StaticServer } from './helpers/staticServer';

/**
 * TC-FR-BOOT (SPEC §10 / FR-BOOT) — the deterministic preloader counts 0→100, the
 * counter VISIBLY settles on 100, then the loader reveals (`.preloader` height→0 /
 * detaches) within the 2.5 s budget, and the signature HUD motif (the recurring
 * NN-2 monochrome HUD) is visible in the hero.
 *
 * Exercised against the PRODUCTION static export (`out/`) served over the shared
 * static server (mirrors Firebase Hosting). The dev bundle is unrepresentative for a
 * timing criterion: its first-load webpack compile jams the main thread and starves
 * the rAF counter, so the boot budget can only be measured faithfully on the built
 * artifact. The animated path is asserted under `reducedMotion: 'no-preference'` so
 * it runs regardless of the host OS accessibility setting; a separate test covers the
 * reduced-motion skip.
 *
 * RED before the batch fix: on the final tick the original Preloader batched
 * `setCount(100)` with `setDone(true)`, so the loader unmounted before 100 ever
 * painted — the counter visibly reached only 99.
 */

test.describe('TC-FR-BOOT — preloader counter→100, reveal, motif', () => {
  test.describe.configure({ timeout: 240000 });

  let srv: StaticServer;

  test.beforeAll(() => {
    ensureStaticBuild();
  });

  test.beforeEach(async () => {
    srv = await startStaticServer();
  });

  test.afterEach(async () => {
    if (srv) await srv.close();
  });

  async function bootHome(page: Page, reducedMotion: 'reduce' | 'no-preference') {
    await page.emulateMedia({ reducedMotion });
    await page.goto(`${srv.origin}/`, { waitUntil: 'domcontentloaded' });
  }

  test('counter reaches 100, then loader reveals within 2.5s; motif visible', async ({ page }) => {
    // Record the highest value the counter ever paints. A MutationObserver
    // captures every DOM mutation, so it is immune to assertion poll cadence —
    // the right tool to verify a transient animation value (a sampled
    // `toHaveText` can step over the brief 100 frame).
    await page.addInitScript(() => {
      (window as Window & { __counterMax?: number }).__counterMax = -1;
      const scan = () => {
        const el = document.querySelector('.preloader .counter');
        const n = el ? parseInt(el.textContent || '', 10) : NaN;
        const w = window as Window & { __counterMax?: number };
        if (Number.isFinite(n) && n > (w.__counterMax ?? -1)) w.__counterMax = n;
      };
      const observe = () =>
        new MutationObserver(scan).observe(document.body, {
          subtree: true,
          childList: true,
          characterData: true,
        });
      if (document.body) observe();
      else document.addEventListener('DOMContentLoaded', observe);
    });

    await bootHome(page, 'no-preference');

    const pre = page.locator('.preloader');
    await pre.waitFor({ state: 'visible', timeout: 15000 });
    const appeared = Date.now();

    // The loader reveals (height→0 / detaches) within the 2.5 s boot budget.
    await pre.waitFor({ state: 'hidden', timeout: 8000 });
    expect(
      Date.now() - appeared,
      'preloader must reveal within the 2.5 s boot budget',
    ).toBeLessThan(2500);

    // The counter visibly settled on 100 (not 99) before revealing.
    const max = await page.evaluate(
      () => (window as Window & { __counterMax?: number }).__counterMax,
    );
    expect(max, 'preloader counter must visibly reach 100').toBe(100);

    // The signature HUD motif (NN-2) is visible in the hero after reveal.
    await expect(page.locator('#hero .hud-frame')).toBeVisible();
  });

  test('prefers-reduced-motion: loader is skipped, motif + hero render', async ({ page }) => {
    await bootHome(page, 'reduce');

    // Reduced motion releases the page immediately (sets body.page-ready) with no
    // blocking loader; the motif and identity still render.
    await page.locator('.preloader').waitFor({ state: 'hidden', timeout: 12000 }).catch(() => undefined);
    await expect(page.locator('body')).toHaveClass(/page-ready/, { timeout: 12000 });
    await expect(page.locator('#hero .hud-frame')).toBeVisible({ timeout: 12000 });
    await expect(page.locator('#hero .hero-title')).toBeVisible();
  });
});
