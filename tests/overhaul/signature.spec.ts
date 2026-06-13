import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-SIGFX / TC-FR-SHADER / TC-FR-LIGHT — the signature monochrome HUD (custom
 * GLSL radar ring + volumetric light shaft) renders, recurs across ≥2 sections
 * (NN-2 motif), and produces ZERO WebGL/Three console errors.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('TC-FR-SIGFX/SHADER/LIGHT — signature HUD', () => {
  test.describe.configure({ timeout: 120000 });

  test('HUD motif renders across ≥2 sections with zero WebGL errors', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (/webgl|three\.|gl_|shader|context lost|invalid_|program/i.test(t)) glErrors.push(t);
      }
    });
    page.on('pageerror', (err) => glErrors.push(String(err)));

    await gotoHome(page);

    // Recurring HUD frame in ≥2 sections (hero backdrop + #work panel).
    await expect(page.locator('.hud-frame')).toHaveCount(2);
    // WebGL canvases: SpaceScene + 2 HUD scenes.
    expect(await page.locator('canvas').count()).toBeGreaterThanOrEqual(2);

    // Drive the #work HUD into view, let it render, capture evidence.
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1500);
    await page.locator('.work-hud').screenshot({ path: 'test-results/hud-work.png' });
    await page.screenshot({ path: 'test-results/home-full.png', fullPage: false });

    expect(glErrors, `WebGL/Three console errors:\n${glErrors.join('\n')}`).toEqual([]);
  });
});
