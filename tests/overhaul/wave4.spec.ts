import { test, expect, type Page } from '@playwright/test';

/**
 * WAVE 4 — Scroll + Cursor + Depth components (Reveal, ScrollRail, CursorGlow,
 * CardDepth). Studio-grade, restrained, monochrome motion that MUST flatten under
 * prefers-reduced-motion and emit zero console errors during interaction.
 *
 *   #4 Reveal    — clip-path (inset wipe) + perspective-depth variants, Apple
 *                  easing (0.16,1,0.3,1), staggered-children propagation.
 *   #5 ScrollRail— glow pulse head + tick marks + two-tone fill along the track.
 *   #6 CursorGlow— cursor state machine (default/hover/click/drag), magnetic
 *                  hover zones, cursor text labels.
 *   #7 CardDepth — multi-layer (3-tier) pointer parallax + spring inertia +
 *                  shadow-depth mapping, composed with CursorGlow's tilt vars.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
  // CursorGlow / CardDepth attach their pointer listeners after hydration.
  await page.waitForTimeout(800);
}

/** Read an element's INLINE CSS custom property (what the JS drivers write). */
async function inlineVar(page: Page, selector: string, prop: string): Promise<string> {
  return page.evaluate(
    ([sel, p]) => {
      const el = document.querySelector(sel) as HTMLElement | null;
      return el ? el.style.getPropertyValue(p).trim() : '__no-el__';
    },
    [selector, prop] as const,
  );
}

const reducedMotionInit = () => {
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
};

// ── #4 Reveal ─────────────────────────────────────────────────────────────────
test.describe('WAVE4 #4 — Reveal entrance variants', () => {
  test.describe.configure({ timeout: 90000 });

  test('clip + depth variant wrappers are present and resolve to fully visible', async ({ page }) => {
    await gotoHome(page);

    const clip = page.locator('[data-reveal-variant="clip"]').first();
    await expect(clip, 'a clip (inset-wipe) reveal must be wired into the page').toBeAttached();
    await clip.scrollIntoViewIfNeeded();
    const depth = page.locator('[data-reveal-variant="depth"]').first();
    await expect(depth, 'a perspective-depth reveal must be wired into the page').toBeAttached();

    // Once in view the entrance resolves to opacity 1 (no permanently-hidden content).
    await expect
      .poll(async () => clip.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 8000 })
      .toBeGreaterThan(0.95);
  });

  test('a staggered group propagates the reveal to every direct child', async ({ page }) => {
    await gotoHome(page);
    const group = page.locator('[data-reveal-stagger]').first();
    await expect(group, 'a staggered Reveal group must exist').toBeAttached();
    await group.scrollIntoViewIfNeeded();

    // Each child wrapper resolves to fully visible (the stagger orchestrates them in).
    const children = group.locator(':scope > *');
    const count = await children.count();
    expect(count, 'staggered group must contain ≥2 children').toBeGreaterThanOrEqual(2);
    await expect
      .poll(
        async () =>
          children.evaluateAll((els) =>
            els.every((el) => Number(getComputedStyle(el as HTMLElement).opacity) > 0.9),
          ),
        { timeout: 9000 },
      )
      .toBe(true);
  });

  test('reduced motion: clip reveal snaps to visible (no permanently clipped content)', async ({
    page,
  }) => {
    await page.addInitScript(reducedMotionInit);
    await gotoHome(page);
    const clip = page.locator('[data-reveal-variant="clip"]').first();
    await clip.scrollIntoViewIfNeeded();
    await expect
      .poll(async () => clip.evaluate((el) => Number(getComputedStyle(el).opacity)), { timeout: 8000 })
      .toBeGreaterThan(0.95);
  });
});

// ── #5 ScrollRail ───────────────────────────────────────────────────────────────
test.describe('WAVE4 #5 — ScrollRail glow head + tick marks', () => {
  test.describe.configure({ timeout: 90000 });

  test('rail renders a glow head and tick marks along the track', async ({ page }) => {
    await gotoHome(page);
    const rail = page.getByTestId('scroll-rail');
    await expect(rail).toBeAttached();

    await expect(rail.locator('.scroll-rail-head'), 'glow pulse head must be present').toHaveCount(1);
    const ticks = rail.locator('.scroll-rail-tick');
    expect(await ticks.count(), 'tick marks must be rendered along the track').toBeGreaterThanOrEqual(3);

    // Two-tone fill: the active accent fill rides over a dim track.
    const trackBg = await rail
      .locator('.scroll-rail-track')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(trackBg, 'track must paint a dim base channel').not.toBe('rgba(0, 0, 0, 0)');
  });
});

// ── #6 CursorGlow ───────────────────────────────────────────────────────────────
test.describe('WAVE4 #6 — CursorGlow state machine + magnetic + labels', () => {
  test.describe.configure({ timeout: 90000 });

  test('hovering an interactive magnetic zone enters hover state, writes magnetic offset + label', async ({
    page,
  }) => {
    await gotoHome(page);
    const cta = page.locator('[data-magnetic]').first();
    await expect(cta, 'at least one magnetic hover zone must be wired in').toBeAttached();
    await cta.scrollIntoViewIfNeeded();

    // The cursor label node is rendered alongside the dot/outline.
    await expect(page.locator('.cursor-label')).toHaveCount(1);

    const box = await cta.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(box!.x + box!.width * 0.5, box!.y + box!.height * 0.5, { steps: 6 });
    await page.waitForTimeout(120);

    // State machine: pointer over an interactive element → "hover".
    await expect(page.locator('body')).toHaveAttribute('data-cursor-state', 'hover');

    // Magnetic pull: the zone receives a non-empty --mag-x / --mag-y offset.
    const magX = await inlineVar(page, '[data-magnetic]', '--mag-x');
    expect(magX, 'magnetic zone must receive a --mag-x offset on hover').not.toBe('');

    // Cursor text label reflects the zone's data-cursor-label.
    const labelText = await page.locator('.cursor-label').innerText();
    expect(labelText.trim().length, 'cursor label must surface the zone label').toBeGreaterThan(0);

    // Click state on pointer down.
    await page.mouse.down();
    await page.waitForTimeout(50);
    await expect(page.locator('body')).toHaveAttribute('data-cursor-state', 'click');
    await page.mouse.up();
  });

  test('reduced motion: no custom cursor is rendered and no state attribute is set', async ({
    page,
  }) => {
    await page.addInitScript(reducedMotionInit);
    await gotoHome(page);
    await expect(page.locator('.cursor-dot')).toHaveCount(0);
    await expect(page.locator('.cursor-label')).toHaveCount(0);
    const state = await page.evaluate(() => document.body.getAttribute('data-cursor-state'));
    expect(state).toBeNull();
  });
});

// ── #7 CardDepth ────────────────────────────────────────────────────────────────
test.describe('WAVE4 #7 — CardDepth multi-tier pointer parallax', () => {
  test.describe.configure({ timeout: 90000 });

  test('pointer over an outcome card writes multi-tier depth vars with inertia', async ({ page }) => {
    await gotoHome(page);
    const card = page.locator('[data-outcome-card="true"]').first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible({ timeout: 10000 });
    const box = await card.boundingBox();
    expect(box).not.toBeNull();

    await page.mouse.move(box!.x + box!.width * 0.8, box!.y + box!.height * 0.75, { steps: 8 });

    // The spring settles over a few frames (inertia) — poll rather than read once.
    await expect
      .poll(async () => Math.abs(parseFloat(await inlineVar(page, '[data-outcome-card="true"]', '--card-px') || '0')), {
        timeout: 4000,
      })
      .toBeGreaterThan(0.05);

    const depth = await inlineVar(page, '[data-outcome-card="true"]', '--card-depth');
    expect(depth, 'overall --card-depth magnitude must be written').not.toBe('');
  });

  test('reduced motion: no card depth vars are written', async ({ page }) => {
    await page.addInitScript(reducedMotionInit);
    await gotoHome(page);
    const card = page.locator('[data-outcome-card="true"]').first();
    await card.scrollIntoViewIfNeeded();
    const box = await card.boundingBox();
    await page.mouse.move(box!.x + box!.width * 0.8, box!.y + box!.height * 0.75, { steps: 8 });
    await page.waitForTimeout(200);
    expect(await inlineVar(page, '[data-outcome-card="true"]', '--card-px')).toBe('');
  });
});

// ── Cross-cutting: zero console errors while interacting with all four systems ──
test.describe('WAVE4 — interaction emits no app console errors', () => {
  test.describe.configure({ timeout: 90000 });

  test('sweeping cursor + cards + scrolling rail produces no uncaught errors', async ({ page }) => {
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
    const card = page.locator('[data-outcome-card="true"]').first();
    await card.scrollIntoViewIfNeeded();
    const cb = await card.boundingBox();
    for (let i = 0; i <= 6; i++) {
      await page.mouse.move(cb!.x + (cb!.width * i) / 6, cb!.y + (cb!.height * i) / 6, { steps: 3 });
    }
    await page.evaluate(() => document.getElementById('experience')?.scrollIntoView({ block: 'end' }));
    await page.waitForTimeout(300);
    expect(errors, `console errors during interaction:\n${errors.join('\n')}`).toEqual([]);
  });
});
