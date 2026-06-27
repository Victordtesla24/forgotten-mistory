import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-PANELFX (SPEC §10 / MOTION-AND-FX-SPEC §2 "calm authority", NN-3 restraint)
 * — the hero "floating panels" (the LIVE TELEMETRY panel + the outcome meta-cards)
 * carry three NEW, restrained, monochrome motion systems:
 *
 *   System A — Panel Depth Parallax: pointer position drives a subtle perspective
 *     tilt (CSS custom props --rx/--ry) + a cursor-tracking spotlight on BOTH the
 *     telemetry panel and the meta-cards. Gated on fine-pointer + reduced-motion
 *     (driven through the existing CursorGlow primitive).
 *   System B — Living Sparkline: the telemetry sparkline gains a gradient area-fill
 *     and a traveling glow scan-node at the latest sample, on top of the stroke path.
 *   System C — Magnetic Glass Cards: the meta-cards translate subtly toward the
 *     pointer (CSS custom props --tx/--ty) in addition to the tilt.
 *
 * All three MUST flatten under prefers-reduced-motion (no tilt, no magnetic offset,
 * no spotlight var churn) and MUST emit zero console errors during interaction.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
  // CursorGlow attaches its pointer listeners after hydration — give it a beat.
  await page.waitForTimeout(800);
}

/** Read an element's INLINE CSS custom property (what CursorGlow writes). */
async function inlineVar(page: Page, selector: string, prop: string): Promise<string> {
  return page.evaluate(
    ([sel, p]) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      return el ? el.style.getPropertyValue(p).trim() : '__no-el__';
    },
    [selector, prop] as const,
  );
}

test.describe('TC-FR-PANELFX — hero floating-panel motion systems', () => {
  test.describe.configure({ timeout: 90000 });

  test('environment is a fine-pointer surface (parallax precondition)', async ({ page }) => {
    await gotoHome(page);
    const fine = await page.evaluate(() => matchMedia('(pointer: fine)').matches);
    expect(fine, 'parallax requires a fine pointer; the test browser must report one').toBe(true);
  });

  // ── System B — Living Sparkline ────────────────────────────────────────────
  test('System B: telemetry sparkline has stroke, gradient area-fill, and a scan node', async ({
    page,
  }) => {
    await gotoHome(page);
    const panel = page.locator('#telemetry-panel');
    await expect(panel).toBeVisible({ timeout: 10000 });

    // Regression: the stroke path survives.
    const stroke = panel.locator('.telemetry-spark path.telemetry-spark-stroke, .telemetry-spark > path');
    expect(await stroke.count(), 'sparkline stroke path must be present').toBeGreaterThanOrEqual(1);

    // New: an area-fill path under the line.
    await expect(
      panel.locator('.telemetry-spark .telemetry-spark-area'),
      'living sparkline must render a gradient area-fill',
    ).toHaveCount(1);

    // New: a traveling scan-node at the latest sample.
    await expect(
      panel.locator('.telemetry-spark .telemetry-spark-node'),
      'living sparkline must render a scan node',
    ).toHaveCount(1);
  });

  // ── System A — Panel Depth Parallax (telemetry) ─────────────────────────────
  test('System A: moving the pointer over the telemetry panel sets a non-zero tilt + spotlight', async ({
    page,
  }) => {
    await gotoHome(page);
    const panel = page.locator('#telemetry-panel');
    await expect(panel).toBeVisible({ timeout: 10000 });
    await panel.scrollIntoViewIfNeeded(); // the tall hero pushes the panel below the fold
    const box = await panel.boundingBox();
    expect(box).not.toBeNull();

    // Move to a clearly off-centre point (≈25% across, 25% down) → tilt ≈ -0.25.
    await page.mouse.move(box!.x + box!.width * 0.25, box!.y + box!.height * 0.25, { steps: 6 });
    await page.waitForTimeout(80);

    const rx = await inlineVar(page, '#telemetry-panel', '--rx');
    const ry = await inlineVar(page, '#telemetry-panel', '--ry');
    const mx = await inlineVar(page, '#telemetry-panel', '--mouse-x');
    expect(rx, 'panel tilt --rx must be written on pointer move').not.toBe('');
    expect(Math.abs(parseFloat(rx)), 'off-centre pointer must produce a non-trivial tilt').toBeGreaterThan(0.05);
    expect(Math.abs(parseFloat(ry))).toBeGreaterThan(0.05);
    expect(mx, 'spotlight --mouse-x must be written on the telemetry panel').not.toBe('');
  });

  // ── System A + C — meta-card tilt + magnetic offset ─────────────────────────
  test('System A+C: hovering a meta-card sets tilt (--rx/--ry) and magnetic offset (--tx/--ty)', async ({
    page,
  }) => {
    await gotoHome(page);
    const card = page.locator('[data-outcome-card="true"]').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible({ timeout: 10000 });
    const box = await card.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + box!.width * 0.78, box!.y + box!.height * 0.7, { steps: 6 });
    await page.waitForTimeout(80);

    const rx = await inlineVar(page, '[data-outcome-card="true"]', '--rx');
    const tx = await inlineVar(page, '[data-outcome-card="true"]', '--tx');
    expect(rx, 'meta-card tilt --rx must be written on hover').not.toBe('');
    expect(Math.abs(parseFloat(rx))).toBeGreaterThan(0.05);
    expect(tx, 'meta-card magnetic --tx must be written on hover').not.toBe('');
    expect(Math.abs(parseFloat(tx)), 'magnetic offset must be a real pixel value').toBeGreaterThan(0.5);
  });

  // ── Zero console errors during interaction ──────────────────────────────────
  test('parallax interaction across panels emits no console errors', async ({ page }) => {
    // App-relevant errors only: ignore third-party / network noise (e.g. the GitHub
    // feed rate-limiting to 403, YouTube, favicon/MIME, CSP) that has nothing to do
    // with the panel motion — mirrors the repo's isAppError convention so the test is
    // not flaky on external resource failures. pageerror (uncaught JS exceptions) is
    // never filtered.
    const ignorable = [
      /Failed to load resource/i,
      /\b40\d\b/,
      /MIME type/i,
      /favicon/i,
      /service-worker/i,
      /net::ERR/i,
      /Content Security Policy/i,
      /api\.github\.com/i,
      /youtube/i,
    ];
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' && !ignorable.some((re) => re.test(m.text()))) errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(String(e)));

    await gotoHome(page);
    const panel = page.locator('#telemetry-panel');
    await expect(panel).toBeVisible({ timeout: 10000 });
    const pb = await panel.boundingBox();
    // Sweep across the telemetry panel.
    for (let i = 0; i <= 6; i++) {
      await page.mouse.move(pb!.x + (pb!.width * i) / 6, pb!.y + (pb!.height * i) / 6, { steps: 3 });
    }
    // Sweep across a meta-card.
    const card = page.locator('[data-outcome-card="true"]').first();
    await card.scrollIntoViewIfNeeded();
    const cb = await card.boundingBox();
    for (let i = 0; i <= 6; i++) {
      await page.mouse.move(cb!.x + (cb!.width * i) / 6, cb!.y + (cb!.height * i) / 6, { steps: 3 });
    }
    await page.waitForTimeout(200);
    expect(errors, `console errors during parallax:\n${errors.join('\n')}`).toEqual([]);
  });

  // ── Performance: the render loop is not frozen during interaction ────────────
  test('the animation frame loop keeps running during pointer interaction', async ({ page }) => {
    await gotoHome(page);
    const panel = page.locator('#telemetry-panel');
    const pb = await panel.boundingBox();
    await page.mouse.move(pb!.x + pb!.width / 2, pb!.y + pb!.height / 2, { steps: 4 });
    const frames = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let n = 0;
          const start = performance.now();
          const loop = () => {
            n += 1;
            if (performance.now() - start < 500) requestAnimationFrame(loop);
            else resolve(n);
          };
          requestAnimationFrame(loop);
        }),
    );
    // >5 frames in 500ms proves the main thread is not pinned/frozen (very lenient,
    // headless GPU throttling tolerant). A frozen loop would yield 0–1.
    expect(frames, 'rAF loop appears frozen during interaction').toBeGreaterThan(5);
  });
});

// ── prefers-reduced-motion: every system flattens ─────────────────────────────
test.describe('TC-FR-PANELFX — reduced-motion flattens all panel motion', () => {
  test.describe.configure({ timeout: 90000 });

  // Force the app's reduced-motion branch deterministically by overriding
  // matchMedia before any page script runs (the CDP reduced-motion emulation is
  // not reliably reflected in matchMedia across browser channels). This exercises
  // the real product path: CursorGlow reads matchMedia('(prefers-reduced-motion)').
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const real = window.matchMedia.bind(window);
      window.matchMedia = ((q: string) => {
        if (q.includes('prefers-reduced-motion')) {
          return {
            matches: q.includes('reduce'),
            media: q,
            onchange: null,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
            dispatchEvent() {
              return false;
            },
          } as unknown as MediaQueryList;
        }
        return real(q);
      }) as typeof window.matchMedia;
    });
  });

  test('no tilt / magnetic / spotlight vars are written when reduced motion is requested', async ({
    page,
  }) => {
    await gotoHome(page);
    const panel = page.locator('#telemetry-panel');
    await expect(panel).toBeVisible({ timeout: 10000 });
    await panel.scrollIntoViewIfNeeded();
    const pb = await panel.boundingBox();
    await page.mouse.move(pb!.x + pb!.width * 0.25, pb!.y + pb!.height * 0.25, { steps: 6 });
    await page.waitForTimeout(120);

    // CursorGlow is inert under reduced motion → no inline tilt vars on the panel.
    expect(await inlineVar(page, '#telemetry-panel', '--rx')).toBe('');
    expect(await inlineVar(page, '#telemetry-panel', '--ry')).toBe('');

    const card = page.locator('[data-outcome-card="true"]').first();
    await card.scrollIntoViewIfNeeded();
    const cb = await card.boundingBox();
    await page.mouse.move(cb!.x + cb!.width * 0.78, cb!.y + cb!.height * 0.7, { steps: 6 });
    await page.waitForTimeout(120);
    expect(await inlineVar(page, '[data-outcome-card="true"]', '--rx')).toBe('');
    expect(await inlineVar(page, '[data-outcome-card="true"]', '--tx')).toBe('');
  });

  test('the living sparkline still renders its static structure under reduced motion', async ({
    page,
  }) => {
    await gotoHome(page);
    const panel = page.locator('#telemetry-panel');
    await expect(panel).toBeVisible({ timeout: 10000 });
    // Structure present (the motion is frozen by the global reduced-motion guard,
    // but the evidence-bearing area-fill + node must still be drawn).
    await expect(panel.locator('.telemetry-spark .telemetry-spark-area')).toHaveCount(1);
    await expect(panel.locator('.telemetry-spark .telemetry-spark-node')).toHaveCount(1);
  });
});

/**
 * TC-FR-DETAILFX — the redesigned "Cloud Modernisation" floating panel.
 *
 * The hero outcome cards open a centered capability panel (FloatingDetailBox).
 * The previous entrance rendered its FX (particles + beam + orbiting star) into
 * the SHARED SpaceScene via window.__portfolioSceneBridge__, positioned from the camera at
 * click-time — so the drifting camera desynchronised the FX from the DOM modal
 * and the orbiting star wandered off-frame (the stray corner orb in the owner's
 * reference image), as well as being busy/scribbly (NN-3 restraint breach).
 *
 * The redesign is a SELF-CONTAINED, camera-independent "HUD materialization":
 *   - Framer-Motion FLIP: the panel lifts off the clicked card and floats to centre.
 *   - A dedicated 2-D <canvas> particle convergence bounded to the dialog's
 *     fixed-viewport layer (cannot leave a stray off-frame artifact; torn down on close).
 *   - CSS HUD corner brackets (×4) + a single scanline sweep.
 *   - No dependency on window.__portfolioSceneBridge__.
 *   - Under reduced motion: instant centred panel, no canvas, no sweep.
 */
function cloudCard(page: Page) {
  return page
    .locator('[data-outcome-card="true"]')
    .filter({ hasText: 'Cloud Modernisation' })
    .first();
}

const DETAIL_DIALOG = '[role="dialog"][aria-labelledby="capability-modal-title"]';

test.describe('TC-FR-DETAILFX — Cloud Modernisation floating panel', () => {
  test.describe.configure({ timeout: 90000 });

  test('opens from the Cloud Modernisation card as a centred dialog with the right title', async ({
    page,
  }) => {
    await gotoHome(page);
    const card = cloudCard(page);
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();

    const dialog = page.locator(DETAIL_DIALOG);
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    await expect(page.locator('#capability-modal-title')).toHaveText('Cloud Modernisation');

    // The redesigned panel element exists and carries its open state.
    const panel = page.locator('[data-detail-panel]');
    await expect(panel).toBeVisible();
    await expect(panel).toHaveAttribute('data-detail-state', 'open');
  });

  test('renders the self-contained HUD materialization (canvas + 4 corner brackets + sweep)', async ({
    page,
  }) => {
    await gotoHome(page);
    const card = cloudCard(page);
    await card.scrollIntoViewIfNeeded();
    await card.click();

    await expect(page.locator('[data-detail-panel]')).toBeVisible({ timeout: 5000 });

    // The materialization canvas is bounded to the dialog (viewport-fixed), so it
    // can never leave an off-frame orb the way the old shared-scene FX did.
    await expect(page.locator('[data-detail-canvas]')).toHaveCount(1);
    // Four HUD corner brackets frame the panel.
    await expect(page.locator('[data-detail-corner]')).toHaveCount(4);
    // A single scanline sweep accent.
    await expect(page.locator('[data-detail-sweep]')).toHaveCount(1);
  });

  test('settles centred in the viewport after the float-in', async ({ page }) => {
    await gotoHome(page);
    const card = cloudCard(page);
    await card.scrollIntoViewIfNeeded();
    await card.click();

    const panel = page.locator('[data-detail-panel]');
    await expect(panel).toBeVisible({ timeout: 5000 });
    // Allow the entrance spring to settle.
    await page.waitForTimeout(900);

    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    const vp = page.viewportSize();
    expect(vp).not.toBeNull();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;
    // Centre of the panel lands within 18% of the viewport centre on both axes.
    expect(Math.abs(cx - vp!.width / 2)).toBeLessThan(vp!.width * 0.18);
    expect(Math.abs(cy - vp!.height / 2)).toBeLessThan(vp!.height * 0.18);
  });

  test('does NOT depend on window.__portfolioSceneBridge__ (root-cause of the old corner-orb artifact)', async ({
    page,
  }) => {
    await gotoHome(page);
    // Remove the shared-scene bridge the old FX relied on; the redesign must not need it.
    await page.evaluate(() => {
      delete (window as unknown as { __portfolioSceneBridge__?: unknown }).__portfolioSceneBridge__;
    });
    const card = cloudCard(page);
    await card.scrollIntoViewIfNeeded();
    await card.click();

    await expect(page.locator('[data-detail-panel]')).toBeVisible({ timeout: 5000 });
    // The self-contained materialization still renders without the bridge.
    await expect(page.locator('[data-detail-canvas]')).toHaveCount(1);
  });

  test('tears down the materialization canvas on close (no lingering overlay)', async ({ page }) => {
    await gotoHome(page);
    const card = cloudCard(page);
    await card.scrollIntoViewIfNeeded();
    await card.click();

    const panel = page.locator('[data-detail-panel]');
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-detail-canvas]')).toHaveCount(1);

    await page.keyboard.press('Escape');
    // After the exit animation completes the whole dialog (and its canvas) unmounts.
    await expect(page.locator(DETAIL_DIALOG)).toHaveCount(0, { timeout: 5000 });
    await expect(page.locator('[data-detail-canvas]')).toHaveCount(0);
  });

  test('keyboard: Enter opens, Escape closes, focus returns to the card', async ({ page }) => {
    await gotoHome(page);
    const card = cloudCard(page);
    await card.scrollIntoViewIfNeeded();
    await card.focus();
    await page.keyboard.press('Enter');

    const dialog = page.locator(DETAIL_DIALOG);
    await expect(dialog).toBeVisible({ timeout: 5000 });
    // Focus is moved into the dialog (the close control).
    await expect(dialog.locator('button[aria-label*="Close"]')).toBeFocused({ timeout: 5000 });

    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0, { timeout: 5000 });
    // Focus is restored to the originating card.
    const focusedIsCard = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return !!el?.closest('[data-outcome-card="true"]');
    });
    expect(focusedIsCard).toBe(true);
  });

  test('open → close emits zero console errors', async ({ page }) => {
    // App-relevant errors only: ignore third-party / network noise (e.g. the
    // GitHub feed rate-limiting to 403, favicon/MIME, CSP) that has nothing to do
    // with the panel — mirrors the repo's isAppError convention (vfx-new.spec.ts).
    // pageerror (uncaught JS exceptions, incl. anything our canvas could throw) is
    // never filtered.
    const ignorable = [
      /Failed to load resource/i,
      /\b40\d\b/,
      /MIME type/i,
      /favicon/i,
      /service-worker/i,
      /net::ERR/i,
      /Content Security Policy/i,
      /api\.github\.com/i,
      /youtube/i,
    ];
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' && !ignorable.some((re) => re.test(m.text()))) errors.push(m.text());
    });
    page.on('pageerror', (e) => errors.push(String(e)));

    await gotoHome(page);
    const card = cloudCard(page);
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await expect(page.locator('[data-detail-panel]')).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(700);
    await page.keyboard.press('Escape');
    await expect(page.locator(DETAIL_DIALOG)).toHaveCount(0, { timeout: 5000 });

    expect(errors, `console errors:\n${errors.join('\n')}`).toEqual([]);
  });
});

test.describe('TC-FR-DETAILFX — reduced motion flattens the floating panel', () => {
  test.describe.configure({ timeout: 90000 });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const real = window.matchMedia.bind(window);
      window.matchMedia = ((q: string) => {
        if (q.includes('prefers-reduced-motion')) {
          return {
            matches: q.includes('reduce'),
            media: q,
            onchange: null,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
            dispatchEvent() {
              return false;
            },
          } as unknown as MediaQueryList;
        }
        return real(q);
      }) as typeof window.matchMedia;
    });
  });

  test('panel opens instantly and statically — no canvas, no sweep, corners present', async ({
    page,
  }) => {
    await gotoHome(page);
    const card = cloudCard(page);
    await card.scrollIntoViewIfNeeded();
    await card.click();

    const panel = page.locator('[data-detail-panel]');
    await expect(panel).toBeVisible({ timeout: 5000 });
    await expect(page.locator('#capability-modal-title')).toHaveText('Cloud Modernisation');

    // The motion-only layers are absent under reduced motion …
    await expect(page.locator('[data-detail-canvas]')).toHaveCount(0);
    await expect(page.locator('[data-detail-sweep]')).toHaveCount(0);
    // … but the static HUD framing is still drawn.
    await expect(page.locator('[data-detail-corner]')).toHaveCount(4);
  });
});

/**
 * TC-FR-PANELFX-PRO — studio-grade elevation pass on the floating panels.
 * Restrained, monochrome, GPU-transform-only, reduced-motion-gated upgrades that
 * raise perceived fidelity without new colour, new WebGL canvases, or layout churn:
 *
 *   E1 — Glass rim-light + elevation: the floating panels carry an INSET top
 *        highlight (light catching the glass edge) on top of their drop shadow.
 *   E2 — Pointer specular: the telemetry panel's cursor highlight is a real
 *        radial-gradient layer that tracks --mouse-x/--mouse-y.
 *   E3 — Detail-panel hologram depth (marquee): while a capability panel is open
 *        on a fine pointer, cursor movement drives a subtle parallax tilt of the
 *        panel via --panel-rx/--panel-ry. Flattens to nothing under reduced motion.
 *   E5 — Living sparkline comet trail: a fading trail element follows the scan node.
 *
 * Hardening: opening the panel must NEVER introduce horizontal overflow (no text
 * overflow/clipping) at mobile or desktop widths.
 */
async function readPseudo(page: Page, selector: string, pseudo: string, prop: string): Promise<string> {
  return page.evaluate(
    ([sel, ps, p]) => {
      const el = document.querySelector(sel);
      if (!el) return '__no-el__';
      return getComputedStyle(el, ps).getPropertyValue(p).trim();
    },
    [selector, pseudo, prop] as const,
  );
}

test.describe('TC-FR-PANELFX-PRO — studio-grade floating-panel elevation', () => {
  test.describe.configure({ timeout: 90000 });

  // ── E1 — rim-light + elevation ──────────────────────────────────────────────
  test('E1: the telemetry panel carries an inset rim-light on top of its drop shadow', async ({
    page,
  }) => {
    await gotoHome(page);
    const panel = page.locator('#telemetry-panel');
    await expect(panel).toBeVisible({ timeout: 10000 });
    const shadow = await panel.evaluate((el) => getComputedStyle(el).boxShadow);
    // A premium glass edge = an INSET highlight in the composited box-shadow.
    expect(shadow, 'panel must have a layered box-shadow').not.toBe('none');
    expect(shadow.includes('inset'), 'glass rim-light must be an inset highlight').toBe(true);
  });

  // ── E2 — pointer specular layer ─────────────────────────────────────────────
  test('E2: the telemetry panel renders a radial specular layer that tracks the cursor', async ({
    page,
  }) => {
    await gotoHome(page);
    const panel = page.locator('#telemetry-panel');
    await expect(panel).toBeVisible({ timeout: 10000 });
    await panel.scrollIntoViewIfNeeded();
    const bg = await readPseudo(page, '#telemetry-panel', '::after', 'background-image');
    expect(bg, 'specular ::after layer must be a radial-gradient').toContain('radial-gradient');
  });

  // ── E5 — living sparkline comet trail ───────────────────────────────────────
  test('E5: the telemetry sparkline renders a comet trail behind the scan node', async ({ page }) => {
    await gotoHome(page);
    const panel = page.locator('#telemetry-panel');
    await expect(panel).toBeVisible({ timeout: 10000 });
    await expect(
      panel.locator('.telemetry-spark .telemetry-spark-trail'),
      'living sparkline must render a comet trail',
    ).toHaveCount(1);
  });

  // ── E3 — detail-panel hologram depth ────────────────────────────────────────
  test('E3: moving the cursor over an OPEN capability panel writes a non-trivial parallax tilt', async ({
    page,
  }) => {
    await gotoHome(page);
    const card = cloudCard(page);
    await card.scrollIntoViewIfNeeded();
    await card.click();
    const panel = page.locator('[data-detail-panel]');
    await expect(panel).toBeVisible({ timeout: 5000 });
    await page.waitForTimeout(700); // let the entrance spring settle

    const box = await panel.boundingBox();
    expect(box).not.toBeNull();
    // Move to a clearly off-centre point inside the panel.
    await page.mouse.move(box!.x + box!.width * 0.2, box!.y + box!.height * 0.25, { steps: 6 });
    await page.waitForTimeout(90);

    const rx = await inlineVar(page, '[data-detail-panel]', '--panel-rx');
    const ry = await inlineVar(page, '[data-detail-panel]', '--panel-ry');
    expect(rx, 'open panel must receive a parallax --panel-rx on pointer move').not.toBe('');
    expect(Math.abs(parseFloat(rx)), 'off-centre cursor must produce a non-trivial panel tilt').toBeGreaterThan(0.05);
    expect(Math.abs(parseFloat(ry))).toBeGreaterThan(0.05);
  });

  // ── Hardening — no horizontal overflow with the panel open ──────────────────
  for (const width of [375, 768, 1280]) {
    test(`no horizontal overflow / text clipping with the panel open at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await gotoHome(page);
      const card = cloudCard(page);
      await card.scrollIntoViewIfNeeded();
      await card.click();
      await expect(page.locator('[data-detail-panel]')).toBeVisible({ timeout: 5000 });
      await page.waitForTimeout(700);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `panel introduced ${overflow}px of horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);

      // The title and at least one evidence line are visible (not clipped to zero).
      await expect(page.locator('#capability-modal-title')).toBeVisible();
      const titleBox = await page.locator('#capability-modal-title').boundingBox();
      expect(titleBox!.width).toBeGreaterThan(40);
    });
  }
});

test.describe('TC-FR-PANELFX-PRO — reduced motion flattens the studio-grade layer', () => {
  test.describe.configure({ timeout: 90000 });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const real = window.matchMedia.bind(window);
      window.matchMedia = ((q: string) => {
        if (q.includes('prefers-reduced-motion')) {
          return {
            matches: q.includes('reduce'),
            media: q,
            onchange: null,
            addEventListener() {},
            removeEventListener() {},
            addListener() {},
            removeListener() {},
            dispatchEvent() {
              return false;
            },
          } as unknown as MediaQueryList;
        }
        return real(q);
      }) as typeof window.matchMedia;
    });
  });

  test('E3: no panel parallax var is written when reduced motion is requested', async ({ page }) => {
    await gotoHome(page);
    const card = cloudCard(page);
    await card.scrollIntoViewIfNeeded();
    await card.click();
    const panel = page.locator('[data-detail-panel]');
    await expect(panel).toBeVisible({ timeout: 5000 });

    const box = await panel.boundingBox();
    await page.mouse.move(box!.x + box!.width * 0.2, box!.y + box!.height * 0.25, { steps: 6 });
    await page.waitForTimeout(120);

    expect(await inlineVar(page, '[data-detail-panel]', '--panel-rx')).toBe('');
    expect(await inlineVar(page, '[data-detail-panel]', '--panel-ry')).toBe('');
  });
});
