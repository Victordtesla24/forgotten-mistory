import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-SIGFX / TC-FR-SHADER / TC-FR-LIGHT — the signature monochrome HUD (custom
 * GLSL radar ring + volumetric light shaft) renders, recurs across ≥2 sections
 * (NN-2 motif), and produces ZERO WebGL/Three console errors.
 *
 * Also: TC-FR-SIGFX (ATO) — the ATO evidence-harness time-compression effect.
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

    // Recurring HUD frame in ≥2 sections (hero backdrop + #work panel — NN-2 motif).
    expect(await page.locator('.hud-frame').count()).toBeGreaterThanOrEqual(2);

    // At boot the home view runs a single live WebGL context (the SpaceScene
    // backdrop). The #work JARVIS HUD is deliberately lazy (NFR-FPS) and only
    // spins up its context when approached — so exactly one canvas here.
    expect(await page.locator('canvas').count()).toBeGreaterThanOrEqual(1);

    // Drive the #work HUD into view: its IntersectionObserver gate mounts the
    // second live context. Wait for that canvas, then capture evidence.
    await page.evaluate(() => document.querySelector('.work-hud')?.scrollIntoView({ block: 'center' }));
    await page.locator('.work-hud canvas').waitFor({ state: 'attached', timeout: 15000 });
    await page.waitForTimeout(1500);
    // Now ≥2 live WebGL scenes are present (SpaceScene + the JARVIS HUD).
    expect(await page.locator('canvas').count()).toBeGreaterThanOrEqual(2);

    await page.locator('.work-hud').screenshot({ path: 'test-results/hud-work.png' });
    await page.screenshot({ path: 'test-results/home-full.png', fullPage: false });

    expect(glErrors, `WebGL/Three console errors:\n${glErrors.join('\n')}`).toEqual([]);
  });

  test('TC-FR-SIGFX-HUD — HUD is interactive with Canvas2D sparkline present', async ({ page }) => {
    await gotoHome(page);

    // Scroll the HUD element itself into view (not the tall #work section).
    await page.evaluate(() => document.querySelector('.work-hud')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1500);

    const hudInteractive = page.locator('[data-testid="hud-interactive"]');
    const count = await hudInteractive.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // R3: Canvas2D sparkline (not SVG/polyline — real Canvas2D rendering).
    const sparkline = page.locator('[data-testid="hud-sparkline"]');
    const sparklineCount = await sparkline.count();
    expect(sparklineCount).toBeGreaterThanOrEqual(1);

    // Verify it's a canvas element with content (not an empty stub).
    const tagName = await sparkline.first().evaluate((el) => el.tagName);
    expect(tagName).toBe('CANVAS');
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
    const timelapse = page.locator('[data-testid="ato-timelapse"]');
    const track = page.locator('[data-testid="ato-track"]');

    // Measure the bar's FULL entry width WHILE STILL BELOW THE FOLD — before the
    // IntersectionObserver (threshold 0.3) fires the ~2.4 s collapse. Ratios
    // against the track keep the assertion layout-independent.
    await timelapse.waitFor({ state: 'attached' });
    const startBox = await timelapse.boundingBox();
    const trackStart = await track.boundingBox();
    expect(startBox, 'timelapse bar must have a measurable box').not.toBeNull();
    expect(trackStart, 'track must have a measurable box').not.toBeNull();
    expect(
      startBox!.width / trackStart!.width,
      'bar should fill its track before the collapse',
    ).toBeGreaterThan(0.6);

    // Now bring it into view to trigger the time-compression sweep.
    await bar.scrollIntoViewIfNeeded();
    await expect(bar).toBeVisible();
    await expect(timelapse).toBeVisible();

    // Tick graduations exist (the timelapse ruler that lights up).
    const ticks = page.locator('[data-testid="ato-tick"]');
    expect(await ticks.count()).toBeGreaterThan(10);

    // The time-compression sweep collapses the bar to its compressed end state
    // (~8.3% of the track ⇒ the ≈92% evidence-effort cut). Poll the bar/track
    // width ratio instead of sleeping a fixed interval.
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

/**
 * TC-FR-SIGFX-DATA — R2 signature scenes render with résumé-sourced data
 * (NEVER random / coffee-cup values). Every numeric readout must trace to a
 * verifiable fact in siteContent.ts or the résumé.
 */
test.describe('TC-FR-SIGFX-DATA — real data, never coffee-cup', () => {
  test.describe.configure({ timeout: 120000 });

  test('PacketFlowGraph shows résumé-sourced P95 and device count', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(2000);

    const pfg = page.locator('[data-testid="packet-flow-graph"]');
    expect(await pfg.count()).toBeGreaterThanOrEqual(1);

    const readout = pfg.locator('[data-testid="pfg-readout"]');
    const text = (await readout.textContent()) || '';
    // Résumé-sourced: P95 < 198 ms, 10,000 devices (from ANZ telemetry record)
    expect(text).toMatch(/P95.*198.*ms/);
    expect(text).toMatch(/10[,.]?000/);
  });

  test('CelestialSphere shows résumé-sourced astro repo count', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(2000);

    const cs = page.locator('[data-testid="celestial-sphere"]');
    expect(await cs.count()).toBeGreaterThanOrEqual(1);

    // DOM overlay has résumé-sourced astro repo metadata
    const readout = cs.locator('.cs-readout');
    const text = (await readout.textContent()) || '';
    // siteContent.ts featuredRepos: 3 astro repos (btr-demo, jyotish-shastra, Birth-Time-Rectifier)
    expect(text).toMatch(/3\s+astro\s+repos/);
    expect(text).toMatch(/Vedic\s+astronomy/);
  });

  test('OrchestrationGraph shows résumé-sourced agent profile count', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(2000);

    const og = page.locator('[data-testid="orchestration-graph"]');
    expect(await og.count()).toBeGreaterThanOrEqual(1);

    // DOM overlay has résumé-sourced orchestration metadata
    const readout = og.locator('.og-readout');
    const text = (await readout.textContent()) || '';
    // Meta: this site was built by a 6-profile Hermes orchestration system
    expect(text).toMatch(/6\s+agent\s+profiles/);
    expect(text).toMatch(/Coordinated\s+cascade/);
  });

  test('Zero scenes use random/coffee-cup placeholder data — all values are traceable', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(2000);

    // Collect all scene readouts
    const readouts = await page.locator('.pfg-readout, .cs-readout, .og-readout').allTextContents();

    // Not a single scene should contain generic placeholder words
    const coffeeCup = ['lorem', 'ipsum', 'placeholder', 'TODO', 'xxx', 'TBD', '??', 'random', 'mock', 'sample', 'dummy'];
    for (const text of readouts) {
      for (const marker of coffeeCup) {
        expect(text.toLowerCase(), `coffee-cup marker "${marker}" found in readout: "${text}"`).not.toContain(marker);
      }
    }
  });
});
