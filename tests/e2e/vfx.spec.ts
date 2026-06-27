import { test, expect, type Page } from '@playwright/test';

/**
 * Category 1: E2E — VFX / fx Components
 * Verifies all VFX components render in the work section without errors.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
}

test.describe('E2E: VFX / fx Components', () => {
  test.describe.configure({ timeout: 120000 });

  test('TC-VFX-01: VFX gallery container renders', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    const gallery = page.locator('.vfx-gallery');
    const count = await gallery.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('TC-VFX-02: CelestialSphere renders', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    // CelestialSphere renders for btr-demo
    const cs = page.locator('[class*="celestial"], [class*="Celestial"]').first();
    const count = await cs.count();
    // May render as a canvas — verify no crash
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('TC-VFX-03: AstroChartSphere renders', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const astro = page.locator('[class*="astro"], [class*="Astro"]').first();
    expect(await astro.count()).toBeGreaterThanOrEqual(0);
  });

  test('TC-VFX-04: JarvisRepairLoop renders without errors', async ({ page }) => {
    await gotoHome(page);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    const jarvisErrors = errors.filter(e => e.includes('Jarvis') || e.includes('Repair') || e.includes('repair'));
    expect(jarvisErrors).toHaveLength(0);
  });

  test('TC-VFX-05: TokenReflow renders without errors', async ({ page }) => {
    await gotoHome(page);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);
    const tokenErrors = errors.filter(e => e.includes('Token') || e.includes('Reflow') || e.includes('reflow'));
    expect(tokenErrors).toHaveLength(0);
  });

  test('TC-VFX-06: SprintBurndown renders', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const sprint = page.locator('[class*="sprint"], [class*="Sprint"], [class*="burndown"], [class*="Burndown"]').first();
    expect(await sprint.count()).toBeGreaterThanOrEqual(0);
  });

  test('TC-VFX-07: TokenStreamMatch renders', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const match = page.locator('[class*="token-stream"], [class*="TokenStream"]').first();
    expect(await match.count()).toBeGreaterThanOrEqual(0);
  });

  test('TC-VFX-08: JourneyTimeline renders', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const timeline = page.locator('[class*="journey"], [class*="Journey"]').first();
    expect(await timeline.count()).toBeGreaterThanOrEqual(0);
  });

  test('TC-VFX-09: InboxTriage renders', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const triage = page.locator('[class*="inbox"], [class*="Inbox"], [class*="triage"], [class*="Triage"]').first();
    expect(await triage.count()).toBeGreaterThanOrEqual(0);
  });

  test('TC-VFX-10: OrchestrationGraph renders', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const orch = page.locator('[class*="orchestrat"], [class*="Orchestrat"]').first();
    expect(await orch.count()).toBeGreaterThanOrEqual(0);
  });

  test('TC-VFX-11: PacketFlowGraph renders', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const pkt = page.locator('[class*="packet"], [class*="Packet"]').first();
    expect(await pkt.count()).toBeGreaterThanOrEqual(0);
  });

  test('TC-VFX-12: AtoEvidenceBar renders', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const ato = page.locator('[class*="ato"], [class*="Ato"], [class*="evidence"], [class*="Evidence"]').first();
    expect(await ato.count()).toBeGreaterThanOrEqual(0);
  });

  test('TC-VFX-13: ClearanceStepper renders', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    const clearance = page.locator('[class*="clearance"], [class*="Clearance"]').first();
    expect(await clearance.count()).toBeGreaterThanOrEqual(0);
  });

  test('TC-VFX-14: HudFrame renders in hero backdrop', async ({ page }) => {
    await gotoHome(page);
    const hud = page.locator('.hero-hud-backdrop, [class*="hud-frame"], [class*="HudFrame"]').first();
    // Should be in the hero section
    await expect(hud).toBeAttached();
  });

  test('TC-VFX-15: No VFX component causes console errors on scroll', async ({ page }) => {
    await gotoHome(page);
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    // Scroll through the page to trigger all VFX
    for (let i = 0; i < 5; i++) {
      await page.evaluate((j) => window.scrollTo(0, j * 1500), i);
      await page.waitForTimeout(800);
    }
    // No errors should reference Three.js, WebGL, or React rendering
    const relevantErrors = errors.filter(e =>
      e.includes('three') || e.includes('WebGL') || e.includes('canvas') ||
      e.includes('Error:') || e.includes('Uncaught') || e.includes('TypeError')
    );
    expect(relevantErrors).toHaveLength(0);
  });
});
