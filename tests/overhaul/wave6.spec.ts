import { test, expect, type Page } from '@playwright/test';

/**
 * WAVE 6 — Interactive widgets elevation (#15 ExperienceAccordion, #16 TelemetryPanel,
 * #17 ArchitectureMap). Studio-grade, restrained, strictly-monochrome motion that MUST
 * flatten under prefers-reduced-motion while keeping every surface readable and usable.
 *
 *   #15 ExperienceAccordion — glassmorphism shell, spring-physics expand, staggered
 *                             bullet reveal, magnetic header, derived role-duration bar.
 *   #16 TelemetryPanel      — spring number counters, pulse-on-change, sparkline draw-in
 *                             (stroke-dasharray), scan-line sweep, glass panel.
 *   #17 ArchitectureMap     — breathing node pulse, connection draw-in, particle burst on
 *                             flow switch, glass sidebar, visible flow-dots with trails.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

/** True when the element's computed backdrop-filter (or -webkit-) blurs. */
async function hasBackdropBlur(page: Page, selector: string): Promise<boolean> {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel) as HTMLElement | null;
    if (!el) return false;
    const cs = getComputedStyle(el);
    const bf = `${cs.backdropFilter} ${(cs as unknown as Record<string, string>).webkitBackdropFilter ?? ''}`;
    return /blur\(/.test(bf);
  }, selector);
}

/** First value of an element's computed transform matrix (scaleX for a pure scale). */
async function transformScaleX(locator: import('@playwright/test').Locator): Promise<number> {
  return locator.evaluate((el) => {
    const t = getComputedStyle(el as HTMLElement).transform;
    if (!t || t === 'none') return 0;
    const m = t.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    return parseFloat(m[1].split(',')[0]) || 0;
  });
}

// ── #15 ExperienceAccordion ────────────────────────────────────────────────────────
test.describe('WAVE6 #15 — ExperienceAccordion spring + stagger + magnetic + duration bar', () => {
  test.describe.configure({ timeout: 90000 });

  test('accordion sits on a glassmorphic shell with magnetic headers', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('experience')?.scrollIntoView({ block: 'center' }));

    expect(await hasBackdropBlur(page, '.accordion-shell'), 'accordion shell must use a backdrop blur').toBe(true);

    const header = page.locator('#experience .accordion-header').first();
    await expect(header).toHaveAttribute('data-magnetic', '');
  });

  test('each role carries a derived duration bar that animates to a non-zero scale', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('experience')?.scrollIntoView({ block: 'center' }));

    const bars = page.locator('#experience [data-duration-bar]');
    expect(await bars.count(), 'every role needs a duration bar').toBeGreaterThanOrEqual(2);

    // The first (open) role's bar fill settles on a real, non-zero proportion.
    const fill = page.locator('#experience [data-duration-fill]').first();
    await expect.poll(async () => transformScaleX(fill), { timeout: 6000 }).toBeGreaterThan(0.05);
  });

  test('expanding a collapsed role staggers its bullets in to fully visible', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('experience')?.scrollIntoView({ block: 'center' }));

    // The first role is open by default; open a different (collapsed) role to watch a fresh stagger.
    const secondHeader = page.locator('#experience .accordion-header').nth(1);
    await secondHeader.click();

    const group = page.locator('#experience [data-accordion-stagger]').first();
    await expect(group).toBeAttached();
    const items = group.locator(':scope > *');
    expect(await items.count(), 'stagger group must carry ≥2 bullet children').toBeGreaterThanOrEqual(2);
    await expect
      .poll(
        async () =>
          items.evaluateAll((els) => els.every((el) => Number(getComputedStyle(el as HTMLElement).opacity) > 0.9)),
        { timeout: 8000 },
      )
      .toBe(true);
  });

  test('reduced motion: an opened role is readable immediately', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('experience')?.scrollIntoView({ block: 'center' }));

    const secondHeader = page.locator('#experience .accordion-header').nth(1);
    await secondHeader.click();
    const body = page.locator('#experience .accordion-item.active .accordion-body').first();
    await expect(body).toBeVisible();
    const box = await body.boundingBox();
    expect(box?.height ?? 0).toBeGreaterThan(0);
  });
});

// ── #16 TelemetryPanel ─────────────────────────────────────────────────────────────
test.describe('WAVE6 #16 — TelemetryPanel spring counters + scan-line + sparkline draw', () => {
  test.describe.configure({ timeout: 90000 });

  test('panel is glassmorphic and carries a scan-line sweep overlay', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('telemetry-panel')?.scrollIntoView({ block: 'center' }));

    expect(await hasBackdropBlur(page, '.telemetry-panel'), 'telemetry panel must use a backdrop blur').toBe(true);
    await expect(page.locator('[data-telemetry-scanline]')).toBeAttached();
  });

  test('sparkline stroke is normalised for a stroke-dasharray draw-in', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('telemetry-panel')?.scrollIntoView({ block: 'center' }));

    const stroke = page.locator('.telemetry-spark-stroke');
    await expect(stroke).toHaveAttribute('pathLength', '1');
    await expect(stroke).toHaveAttribute('data-spark-draw', '');
  });

  test('spring counters render tabular digits and update live', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('telemetry-panel')?.scrollIntoView({ block: 'center' }));

    const value = page.locator('[data-telemetry-value]').first();
    await expect(value).toBeVisible();
    const variant = await value.evaluate((el) => getComputedStyle(el as HTMLElement).fontVariantNumeric);
    expect(variant, 'telemetry digits must be tabular').toContain('tabular-nums');

    // The bounded random-walk advances the latency value within a couple of ticks.
    const initial = (await value.textContent())?.trim() ?? '';
    await expect.poll(async () => (await value.textContent())?.trim(), { timeout: 14000 }).not.toBe(initial);
  });

  test('reduced motion: telemetry values are present and readable (no live churn required)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await page.evaluate(() => document.getElementById('telemetry-panel')?.scrollIntoView({ block: 'center' }));

    const value = page.locator('[data-telemetry-value]').first();
    await expect(value).toBeVisible();
    expect((await value.textContent())?.trim().length ?? 0).toBeGreaterThan(0);
  });
});

// ── #17 ArchitectureMap ────────────────────────────────────────────────────────────
test.describe('WAVE6 #17 — ArchitectureMap breathing nodes + draw-in + burst + glass', () => {
  test.describe.configure({ timeout: 90000 });

  test('sidebar is a glassmorphic panel and active nodes breathe', async ({ page }) => {
    await gotoHome(page);
    const wrapper = page.locator('.arch-wrapper');
    await wrapper.scrollIntoViewIfNeeded();

    expect(await hasBackdropBlur(page, '.arch-sidebar'), 'arch sidebar must use a backdrop blur').toBe(true);

    const activeChip = page.locator('.arch-node-chip.active').first();
    await expect(activeChip).toBeAttached();
    const anim = await activeChip.evaluate((el) => getComputedStyle(el as HTMLElement).animationName);
    expect(anim, 'active node must carry a breathing keyframe').not.toBe('none');
  });

  test('active connections draw in and flow-dots are visible with trails', async ({ page }) => {
    await gotoHome(page);
    const wrapper = page.locator('.arch-wrapper');
    await wrapper.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    await expect(page.locator('[data-conn-draw]').first()).toBeAttached();
    expect(await page.locator('[data-flow-trail]').count()).toBeGreaterThanOrEqual(1);

    // Packet dots must actually be painted (opacity > 0), not just present in the DOM.
    const dotOpacity = await page
      .locator('.flow-dot')
      .first()
      .evaluate((el) => Number(getComputedStyle(el as HTMLElement).opacity));
    expect(dotOpacity).toBeGreaterThan(0);
  });

  test('switching flow emits a particle burst', async ({ page }) => {
    await gotoHome(page);
    const wrapper = page.locator('.arch-wrapper');
    await wrapper.scrollIntoViewIfNeeded();

    const burst = page.locator('[data-flow-burst]');
    await expect(burst).toBeAttached();

    const secondBtn = wrapper.locator('.arch-btn').nth(1);
    await secondBtn.click();
    await expect(secondBtn).toHaveClass(/\bactive\b/);
    // Particles mount on the switch and animate out; catch them while they live.
    await expect.poll(async () => burst.locator('[data-burst-particle]').count(), { timeout: 4000 }).toBeGreaterThanOrEqual(1);
  });

  test('reduced motion: no draw-in/burst, but the map stays interactive', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    const wrapper = page.locator('.arch-wrapper');
    await wrapper.scrollIntoViewIfNeeded();

    expect(await page.locator('[data-conn-draw]').count(), 'no draw overlay under reduced motion').toBe(0);

    const secondBtn = wrapper.locator('.arch-btn').nth(1);
    await secondBtn.click();
    await expect(secondBtn).toHaveClass(/\bactive\b/);
    await expect(page.locator('.arch-explainer-title')).toHaveText('Telemetry Stream');
    expect(await page.locator('[data-burst-particle]').count(), 'no burst under reduced motion').toBe(0);
  });
});
