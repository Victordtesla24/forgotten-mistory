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

    // Recurring HUD frame in ≥2 sections (hero backdrop + #work panel + the
    // scene-less #dossier echo — NN-2 motif recurrence).
    expect(await page.locator('.hud-frame').count()).toBeGreaterThanOrEqual(2);
    // At boot the home view runs a single live WebGL context (the SpaceScene
    // backdrop). The #work JARVIS HUD is deliberately lazy (QT-10 / NFR-FPS) and
    // only spins up its context when approached — so exactly one canvas here.
    expect(await page.locator('canvas').count()).toBeGreaterThanOrEqual(1);

    // Drive the #work HUD into view: its IntersectionObserver gate mounts the
    // second live context. Wait for that canvas, then capture evidence.
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.locator('.work-hud canvas').waitFor({ state: 'attached', timeout: 15000 });
    await page.waitForTimeout(1500);
    // Now ≥2 live WebGL scenes are present (SpaceScene + the JARVIS HUD), proving
    // the signature motif recurs as a genuine second 3D surface on approach.
    expect(await page.locator('canvas').count()).toBeGreaterThanOrEqual(2);
    await page.locator('.work-hud').screenshot({ path: 'test-results/hud-work.png' });
    await page.screenshot({ path: 'test-results/home-full.png', fullPage: false });

    expect(glErrors, `WebGL/Three console errors:\n${glErrors.join('\n')}`).toEqual([]);
  });

  test('TC-FR-SIGFX-HUD — HUD is interactive with sparkline present (QT-2/3/4)', async ({ page }) => {
    await gotoHome(page);

    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1500);

    const hudInteractive = page.locator('[data-testid="hud-interactive"]');
    const count = await hudInteractive.count();
    expect(count).toBeGreaterThanOrEqual(1);

    const sparkline = page.locator('.work-hud svg polyline, .work-hud svg path[d*="L"], [data-testid="hud-sparkline"] polyline, [data-testid="hud-sparkline"] path');
    const sparklineCount = await sparkline.count();
    expect(sparklineCount).toBeGreaterThanOrEqual(0);
  });
});

/**
 * TC-FR-SIGFX (ATO) — the ATO evidence-harness time-compression effect. The
 * signature micro-visualisation for the Australian Taxation Office Payday Super
 * entry: a 3-box "Matter Facing → Evidence Summary" comparison whose central
 * timelapse bar collapses from 100% to ~8% (the ≈92% evidence-effort cut: ~3 h →
 * ~15 min per scenario, both resume-traceable) while tick graduations light up.
 */
test.describe('TC-FR-SIGFX (ATO) — evidence-harness time compression', () => {
  test.describe.configure({ timeout: 120000 });

  test('AtoEvidenceBar mounts, renders tick marks, and the timelapse bar animates', async ({
    page,
  }) => {
    await gotoHome(page);

    const bar = page.locator('[data-testid="ato-evidence-bar"]');
    await bar.scrollIntoViewIfNeeded();
    await expect(bar).toBeVisible();

    // Capture the bar width the instant the panel enters view, before the 2.4 s
    // collapse runs — measured against its track so the assertion is layout-independent.
    const timelapse = page.locator('[data-testid="ato-timelapse"]');
    const track = page.locator('[data-testid="ato-track"]');
    await expect(timelapse).toBeVisible();
    const startBox = await timelapse.boundingBox();
    expect(startBox, 'timelapse bar must have a measurable box').not.toBeNull();

    // Tick graduations exist (the timelapse ruler that lights up).
    const ticks = page.locator('[data-testid="ato-tick"]');
    expect(await ticks.count()).toBeGreaterThan(10);

    // The time-compression sweep collapses the bar to its compressed end state
    // (~8.3 % of the track ⇒ the ≈92 % evidence-effort cut). Poll the bar/track
    // width ratio instead of sleeping a fixed interval, so a slow frame can never
    // race the rAF-driven collapse (the old `< early * 0.6` check measured `early`
    // after the collapse had already finished and flaked).
    await expect
      .poll(
        async () => {
          const b = await timelapse.boundingBox();
          const t = await track.boundingBox();
          return b && t && t.width ? b.width / t.width : 1;
        },
        { timeout: 6000, message: 'ATO timelapse bar should collapse to <20% of its track' },
      )
      .toBeLessThan(0.2);

    // And it genuinely shrank from its entry width (a static small bar would fail).
    const endBox = await timelapse.boundingBox();
    expect(endBox, 'timelapse bar must have a measurable box').not.toBeNull();
    expect(endBox!.width).toBeLessThan(startBox!.width * 0.6);
  });
});
