import { test, expect, type Page, type Locator } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * WAVE 8 — Visual effects A (#21 TelemetryHud, #22 HudFrame, #23 TokenReflow).
 * Studio-grade, restrained, strictly-monochrome motion that MUST flatten under
 * prefers-reduced-motion while keeping every WebGL/SVG surface intact.
 *
 *   #21 TelemetryHud — volumetric light-scatter shader, a HUD scan-line sweep and a
 *                      flickering data readout over the canvas, bokeh DoF, DPR cap 1.5,
 *                      reduced motion → a single static frame (no overlay animation).
 *   #22 HudFrame     — SVG corner brackets that draw in (stroke-dashoffset), a frame
 *                      pulse-glow layer, a 'floating' variant, lazy IO WebGL mount.
 *   #23 TokenReflow  — glassmorphic panel, a streaming dashed flow arrow, a glow pulse
 *                      on the optimised column, and flow particles between the columns.
 */

const SRC = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');
const HUD_SRC = SRC('components/fx/TelemetryHud.tsx');
const SHADER_SRC = SRC('components/fx/shaders/hud.ts');
const HUDFRAME_SRC = SRC('components/fx/HudFrame.tsx');

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

async function reachWork(page: Page) {
  await page.evaluate(() => document.getElementById('work')?.scrollIntoView({ block: 'center' }));
}

/** Scroll the lazily-mounted work HUD itself into view so its IO gate fires. */
async function reachWorkHud(page: Page) {
  await page.evaluate(() => document.querySelector('.work-hud')?.scrollIntoView({ block: 'center' }));
}

// ── #21 TelemetryHud ────────────────────────────────────────────────────────────
test.describe('WAVE8 #21 — TelemetryHud scatter + scan-line + readout flicker', () => {
  test.describe.configure({ timeout: 120000 });

  test('shader adds a volumetric scatter term; DPR is capped and reduced motion freezes', () => {
    // Volumetric light scatter (god-ray haze) in the light-shaft fragment.
    expect(SHADER_SRC, 'light shaft must compute a volumetric scatter term').toMatch(/scatter/i);
    // DPR cap stays at 1.5 for the mobile FPS budget (NFR-FPS gotcha).
    expect(HUD_SRC).toMatch(/dpr=\{\[\s*1\s*,\s*1\.5\s*\]\}/);
    // Reduced motion renders a single static frame (frameloop demand).
    expect(HUD_SRC).toMatch(/frameloop=\{\s*frozen\s*\?\s*'demand'/);
  });

  test('#work HUD mounts a canvas with a scan-line + data readout, zero WebGL errors', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && /webgl|three\.|shader|gl_|context lost|program|bokeh|invalid_/i.test(msg.text())) {
        glErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => glErrors.push(String(err)));

    await gotoHome(page);
    await reachWorkHud(page);
    await page.waitForTimeout(1800);

    const hud = page.locator('[data-testid="hud-interactive"]').first();
    await expect(hud).toBeVisible();
    await expect(hud.locator('canvas')).toBeAttached();
    await expect(page.locator('[data-hud-scanline]').first()).toBeAttached();
    await expect(page.locator('[data-hud-readout]').first()).toBeAttached();
    expect(glErrors, `WebGL/Three errors:\n${glErrors.join('\n')}`).toEqual([]);
  });

  test('reduced motion: scan-line sweep + readout flicker are pinned (no animation)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await reachWorkHud(page);
    await page.waitForTimeout(1200);

    const scan = page.locator('[data-hud-scanline]').first();
    await expect(scan).toBeAttached();
    expect(await animName(scan)).toBe('none');
    const readout = page.locator('[data-hud-readout]').first();
    await expect(readout).toBeAttached();
    expect(await animName(readout)).toBe('none');
  });
});

// ── #22 HudFrame ────────────────────────────────────────────────────────────────
test.describe('WAVE8 #22 — HudFrame corner-bracket draw + pulse glow + variants', () => {
  test('source: a floating variant and the lazy IO mount are wired', () => {
    expect(HUDFRAME_SRC).toMatch(/'panel'\s*\|\s*'backdrop'\s*\|\s*'floating'/);
    expect(HUDFRAME_SRC).toMatch(/useInViewMount/);
  });

  test('frames draw SVG corner brackets and carry a pulse-glow layer', async ({ page }) => {
    await gotoHome(page);
    const frame = page.locator('.hud-frame').first();
    await expect(frame).toBeAttached();
    const bracket = frame.locator('[data-hud-bracket]').first();
    await expect(bracket).toBeAttached();
    await expect(frame.locator('[data-hud-glow]').first()).toBeAttached();
    expect(await animName(bracket), 'brackets must draw via a stroke-dash animation').not.toBe('none');
  });

  test('reduced motion: bracket draw + glow pulse are pinned', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    const frame = page.locator('.hud-frame').first();
    expect(await animName(frame.locator('[data-hud-bracket]').first())).toBe('none');
    expect(await animName(frame.locator('[data-hud-glow]').first())).toBe('none');
  });
});

// ── #23 TokenReflow ───────────────────────────────────────────────────────────────
test.describe('WAVE8 #23 — TokenReflow glass + arrow flow + glow + particles', () => {
  test.describe.configure({ timeout: 120000 });

  test('panel is glassmorphic and the flow arrow streams a dashed flow', async ({ page }) => {
    await gotoHome(page);
    await reachWork(page);
    const reflow = page.locator('[data-testid="token-reflow"]');
    await expect(reflow).toBeAttached();
    await reflow.scrollIntoViewIfNeeded();

    expect(await hasBackdropBlur(page, '[data-testid="token-reflow"]'), 'panel must use a backdrop blur').toBe(true);
    const arrow = page.locator('[data-reflow-arrow]').first();
    await expect(arrow).toBeAttached();
    expect(await animName(arrow), 'flow arrow must stream a dashed animation').not.toBe('none');
  });

  test('optimised column lights up with a glow pulse and emits flow particles', async ({ page }) => {
    await gotoHome(page);
    await reachWork(page);
    const reflow = page.locator('[data-testid="token-reflow"]');
    await reflow.scrollIntoViewIfNeeded();

    await expect(page.locator('[data-reflow-glow]').first()).toBeAttached();
    await expect
      .poll(async () => page.locator('[data-reflow-particle]').count(), { timeout: 7000 })
      .toBeGreaterThanOrEqual(1);
  });

  test('reduced motion: arrow flow is pinned and particles are suppressed', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await reachWork(page);
    const reflow = page.locator('[data-testid="token-reflow"]');
    await reflow.scrollIntoViewIfNeeded();

    const arrow = page.locator('[data-reflow-arrow]').first();
    expect(await animName(arrow)).toBe('none');
    expect(await page.locator('[data-reflow-particle]').count()).toBe(0);
  });
});
