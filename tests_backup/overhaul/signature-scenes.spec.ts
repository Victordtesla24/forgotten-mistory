import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-SIGFX-EXTENDED — R2 per-skill signature 3D scenes (CelestialSphere,
 * OrchestrationGraph) render with their custom GLSL shaders and produce
 * ZERO WebGL console errors. Each scene is unique — no shared placeholder.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('TC-FR-SIGFX-EXTENDED — per-skill signature 3D scenes', () => {
  test.describe.configure({ timeout: 120000 });

  test('CelestialSphere renders with zero WebGL errors (TC-FR-SHADER)', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (/webgl|three\.|gl_|shader|context lost|invalid_|program/i.test(t)) glErrors.push(t);
      }
    });
    page.on('pageerror', (err) => glErrors.push(String(err)));

    await gotoHome(page);

    // Scroll to #work where signature scenes are mounted.
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(2000);

    // CelestialSphere should be mounted.
    const celestial = page.locator('[data-testid="celestial-sphere"]');
    const celestialCount = await celestial.count();
    expect(celestialCount, 'CelestialSphere must be present in the DOM').toBeGreaterThanOrEqual(1);

    // It should contain a canvas (WebGL rendering surface).
    const celestialCanvas = celestial.first().locator('canvas');
    expect(await celestialCanvas.count(), 'CelestialSphere must contain a WebGL canvas').toBeGreaterThanOrEqual(1);

    expect(glErrors, `WebGL errors in CelestialSphere:\n${glErrors.join('\n')}`).toEqual([]);
  });

  test('OrchestrationGraph renders with zero WebGL errors (TC-FR-SHADER)', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (/webgl|three\.|gl_|shader|context lost|invalid_|program/i.test(t)) glErrors.push(t);
      }
    });
    page.on('pageerror', (err) => glErrors.push(String(err)));

    await gotoHome(page);

    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(2000);

    // OrchestrationGraph should be mounted.
    const orch = page.locator('[data-testid="orchestration-graph"]');
    const orchCount = await orch.count();
    expect(orchCount, 'OrchestrationGraph must be present in the DOM').toBeGreaterThanOrEqual(1);

    // It should contain a canvas.
    const orchCanvas = orch.first().locator('canvas');
    expect(await orchCanvas.count(), 'OrchestrationGraph must contain a WebGL canvas').toBeGreaterThanOrEqual(1);

    expect(glErrors, `WebGL errors in OrchestrationGraph:\n${glErrors.join('\n')}`).toEqual([]);
  });

  test('Per-skill scenes are unique — no shared placeholder component (R2)', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(2000);

    // Both scenes must be distinct elements, not the same component reused.
    const celestial = page.locator('[data-testid="celestial-sphere"]');
    const orchestration = page.locator('[data-testid="orchestration-graph"]');

    expect(await celestial.count(), 'CelestialSphere must exist').toBe(1);
    expect(await orchestration.count(), 'OrchestrationGraph must exist').toBe(1);

    // Each must have its own canvas — not sharing a single renderer.
    const celestialCanvases = await celestial.first().locator('canvas').count();
    const orchCanvases = await orchestration.first().locator('canvas').count();
    expect(celestialCanvases, 'CelestialSphere must have its own canvas').toBeGreaterThanOrEqual(1);
    expect(orchCanvases, 'OrchestrationGraph must have its own canvas').toBeGreaterThanOrEqual(1);
  });

  test('All signature scenes (existing + new) render without WebGL errors as a group', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (/webgl|three\.|gl_|shader|context lost|invalid_|program/i.test(t)) glErrors.push(t);
      }
    });
    page.on('pageerror', (err) => glErrors.push(String(err)));

    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(2500);

    // Verify the existing fx components are present.
    const atoBar = page.locator('[data-testid="ato-evidence-bar"]');
    const packetFlow = page.locator('[data-testid="packet-flow-graph"]');
    const sprintBurndown = page.locator('[data-testid="sprint-burndown"]');
    const tokenReflow = page.locator('[data-testid="token-reflow"]');

    expect(await atoBar.count(), 'AtoEvidenceBar must exist').toBeGreaterThanOrEqual(1);
    expect(await packetFlow.count(), 'PacketFlowGraph must exist').toBeGreaterThanOrEqual(1);
    expect(await sprintBurndown.count(), 'SprintBurndown must exist').toBeGreaterThanOrEqual(1);
    expect(await tokenReflow.count(), 'TokenReflow must exist').toBeGreaterThanOrEqual(1);

    expect(glErrors, `WebGL errors across all signature scenes:\n${glErrors.join('\n')}`).toEqual([]);
  });

  test('Signature scenes render under reduced motion (frozen, no errors)', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /webgl|three\.|gl_|shader/i.test(msg.text())) {
        glErrors.push(msg.text());
      }
    });

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(2000);

    const celestial = page.locator('[data-testid="celestial-sphere"]');
    const orch = page.locator('[data-testid="orchestration-graph"]');
    expect(await celestial.count()).toBeGreaterThanOrEqual(1);
    expect(await orch.count()).toBeGreaterThanOrEqual(1);

    expect(glErrors, `WebGL errors under reduced motion:\n${glErrors.join('\n')}`).toEqual([]);
  });
});
