import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * QT-5 — DepthOfField pass on the TelemetryHud EffectComposer.
 *
 * The cinematic JARVIS HUD stacks a custom volumetric god-ray shaft + radar-ring
 * shader under a postprocessing chain. QT-5 adds a DepthOfField bokeh pass for
 * genuine optical depth (cinematic-threejs-hud guidance: Bloom → DoF → Vignette).
 * Two guarantees:
 *   1. (source) DepthOfField is wired INTO the <EffectComposer>, and that composer
 *      only renders in the `!frozen` branch — so the heavy DoF pass is disabled
 *      under prefers-reduced-motion / low-power, exactly like the rest of the chain.
 *   2. (runtime) with DoF active the #work HUD renders with ZERO WebGL/Three
 *      console errors — the new pass must not break the postprocessing pipeline.
 */

const HUD_SRC = readFileSync(join(process.cwd(), 'components/fx/TelemetryHud.tsx'), 'utf8');

test.describe('QT-5 — TelemetryHud DepthOfField pass', () => {
  test.describe.configure({ timeout: 120000 });

  test('DepthOfField is an EffectComposer child, gated off when frozen', () => {
    // Imported from the @react-three/postprocessing wrapper.
    expect(HUD_SRC).toMatch(
      /import\s*\{[^}]*\bDepthOfField\b[^}]*\}\s*from\s*'@react-three\/postprocessing'/,
    );

    // The EffectComposer only mounts in the `!frozen` branch — the reduced-motion /
    // low-power gate — so every pass inside it (including DoF) is disabled there.
    expect(HUD_SRC).toMatch(/!frozen\s*\?\s*\(\s*<EffectComposer/);

    // DepthOfField is a child element of the EffectComposer.
    const composer = HUD_SRC.match(/<EffectComposer>([\s\S]*?)<\/EffectComposer>/);
    expect(composer, 'an <EffectComposer> block must exist in TelemetryHud').not.toBeNull();
    expect(composer![1]).toContain('<DepthOfField');
  });

  test('#work HUD renders with DoF active and emits zero WebGL/Three errors', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (/webgl|three\.|gl_|shader|context lost|invalid_|program|depthoffield|bokeh/i.test(t)) {
          glErrors.push(t);
        }
      }
    });
    page.on('pageerror', (err) => glErrors.push(String(err)));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const pre = page.locator('.preloader');
    if (await pre.count()) {
      await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
    }

    // Bring the lazily-mounted #work HUD into view and let the DoF chain render.
    await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1800);

    await expect(page.locator('[data-testid="hud-interactive"]').first()).toBeVisible();
    expect(glErrors, `WebGL/Three console errors with DoF active:\n${glErrors.join('\n')}`).toEqual([]);
  });
});
