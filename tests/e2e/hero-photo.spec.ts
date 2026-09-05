import { expect, test, type Page } from '@playwright/test';

/* -------------------------------------------------------------------------- */
/* Hero photograph — run v10-20260905T0515Z, cycle C21.                        */
/*                                                                            */
/* Binding spec: owner instruction 2026-09-05 09:10Z — "Integrate my Photo     */
/* with full size, colours and dimension with creative decorations that match  */
/* the website UI/UX Design. Include a hover effect that plays the hero video  */
/* avatar and not by default."                                                 */
/*                                                                            */
/* That instruction supersedes two things this suite previously guarded:       */
/*  · the grayscale filter on the figure (CT-HERO-18 re-pointed in            */
/*    tests/e2e/hero.spec.ts — gold, not colour, is the semantic ink rule);    */
/*  · the 88 px stamp at <720 px (TC-HERO-21 re-pointed there too).            */
/* Nothing else in the site's monochrome contract moves: the exemption is the  */
/* photograph itself, never a border, a caption, a control or a background.    */
/* -------------------------------------------------------------------------- */

const HERO = '#hero';
const FIGURE = '[data-testid="hero-portrait"]';
const IMG = `${FIGURE} img`;
const VIDEO = `${FIGURE} video`;
/* The control moved out of the figure and into the proof band below the fold,
   so the first screen carries one call to action and not two (G-H1 correction).
   TC-PHOTO-06's contract — Tab reaches it, Enter and Space toggle it — is
   unchanged; only the selector is. */
const TOGGLE = '#hero [data-testid="portrait-control"]';
const TICK = '[data-testid="portrait-tick"]';
const CAPTION = '[data-testid="portrait-caption"]';
const CAPTION_TEXT = 'Photograph · Melbourne'; // app/data/portfolio/avatar.ts → caption
const LOOP = 'my-avatar.mp4';

/** One round trip for the loop's playback state. */
async function loopState(page: Page) {
  return page.locator(VIDEO).first().evaluate((el) => {
    const v = el as HTMLVideoElement;
    return {
      currentSrc: v.currentSrc,
      srcAttribute: v.getAttribute('src'),
      paused: v.paused,
      currentTime: v.currentTime,
      opacity: Number.parseFloat(getComputedStyle(v).opacity),
    };
  });
}

/** Chromatic test, verbatim from scripts/validate/overhaul_static_audit.mjs::checkMono. */

test.describe('Hero photograph', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.locator(HERO).waitFor({ state: 'visible', timeout: 15000 });
  });

  test('TC-PHOTO-01: at 1440 the figure owns the right column — ≥34 % of the viewport and ≥440 px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(400);

    const box = await page.locator(FIGURE).boundingBox();
    expect(box, 'the figure is laid out at 1440').not.toBeNull();
    const inner = await page.evaluate(() => window.innerWidth);
    expect(box!.width, `figure width ${Math.round(box!.width)} px of ${inner} px`).toBeGreaterThanOrEqual(
      0.34 * inner,
    );
    expect(box!.width, 'figure width in px').toBeGreaterThanOrEqual(440);

    // Native aspect, no crop that loses the face: 1480/826 = 1.792.
    const media = await page.locator(`${FIGURE} picture`).locator('..').boundingBox();
    expect(media).not.toBeNull();
    expect(Math.abs(media!.width / media!.height - 1480 / 826), 'media box keeps the native aspect').toBeLessThan(
      0.05,
    );
  });

  test('TC-PHOTO-02: at 390 the photo is full width and sits below the last hero action', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'load' });
    await page.locator(HERO).waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(600);

    const box = await page.locator(FIGURE).boundingBox();
    expect(box, 'the figure is laid out at 390').not.toBeNull();
    const inner = await page.evaluate(() => window.innerWidth);
    expect(box!.width, `figure width ${Math.round(box!.width)} px of ${inner} px`).toBeGreaterThanOrEqual(
      0.9 * inner,
    );

    const actions = page.locator(`${HERO} a[href="#experience"], ${HERO} a[download]`);
    const bottoms: number[] = [];
    for (let i = 0; i < (await actions.count()); i += 1) {
      const b = await actions.nth(i).boundingBox();
      if (b) bottoms.push(b.y + b.height);
    }
    expect(bottoms.length, 'both hero actions are laid out').toBeGreaterThanOrEqual(2);
    expect(box!.y, 'the photo starts below the last action').toBeGreaterThanOrEqual(Math.max(...bottoms));
  });

  test('TC-PHOTO-03: the still is in colour — no grayscale filter, and the pixels are saturated', async ({
    page,
  }) => {
    const filters = await page.locator(IMG).evaluate((el) => {
      const chain: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.documentElement) {
        chain.push(getComputedStyle(node).filter);
        node = node.parentElement;
      }
      return chain;
    });
    for (const filter of filters) {
      expect(filter, `an ancestor filter greys the photo: ${filter}`).not.toContain('grayscale');
    }

    // Pixels, not CSS: decode the loaded still into a canvas and measure HSL
    // saturation. A greyscale frame samples ~0; the warm sunset frame is well
    // clear of the 0.15 floor.
    const saturation = await page.locator(IMG).evaluate(async (el) => {
      const img = el as HTMLImageElement;
      if (!img.complete) await img.decode();
      const w = 120;
      const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return -1;
      ctx.drawImage(img, 0, 0, w, h);
      const { data } = ctx.getImageData(0, 0, w, h);
      let total = 0;
      let n = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        if (mx > 24) {
          total += (mx - mn) / mx;
          n += 1;
        }
      }
      return n ? total / n : 0;
    });
    expect(saturation, `mean pixel saturation of the loaded still: ${saturation}`).toBeGreaterThan(0.15);
  });

  test('TC-PHOTO-04: at rest the loop has no source and never plays', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes(LOOP)) requests.push(r.url());
    });
    await page.waitForTimeout(3000);

    const state = await loopState(page);
    expect(state.srcAttribute, 'no src attribute at rest').toBeNull();
    expect(state.currentSrc, 'no currentSrc at rest').toBe('');
    expect(state.paused, 'paused at rest').toBe(true);
    expect(requests, 'no network request for the loop at rest').toEqual([]);
  });

  test('TC-PHOTO-05: hover starts the loop; leaving pauses it', async ({ page }) => {
    await page.locator(FIGURE).hover();
    await expect
      .poll(async () => (await loopState(page)).currentSrc, { timeout: 1500, message: 'src assigned on hover' })
      .toContain(LOOP);
    await expect
      .poll(async () => (await loopState(page)).paused, { timeout: 1500, message: 'playing on hover' })
      .toBe(false);
    await expect
      .poll(async () => (await loopState(page)).opacity, { timeout: 1500, message: 'the loop fades in' })
      .toBeGreaterThan(0.9);

    await page.mouse.move(2, 2);
    await expect
      .poll(async () => (await loopState(page)).paused, { timeout: 1500, message: 'paused on pointerleave' })
      .toBe(true);
  });

  test('TC-PHOTO-06: the control is keyboard-operable — Enter plays, Enter pauses', async ({ page }) => {
    const toggle = page.locator(TOGGLE);
    await expect(toggle).toHaveCount(1);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');

    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur();
      window.scrollTo(0, 0);
    });
    let reached = false;
    for (let i = 0; i < 60 && !reached; i += 1) {
      await page.keyboard.press('Tab');
      reached = await toggle.evaluate((el) => el === document.activeElement);
    }
    expect(reached, 'Tab reaches the portrait toggle').toBe(true);

    // REWRITTEN (G-H1 correction): the control moved out of the figure and into
    // the proof band, so focus on it is a reader tabbing through the page
    // rather than a reader pointing at the photograph. Focus offers; a press
    // decides. Nothing is weakened — the same three states are asserted, and
    // one more: that focus alone fetches and plays nothing.
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect
      .poll(async () => (await loopState(page)).paused, { timeout: 1500, message: 'still paused on focus alone' })
      .toBe(true);

    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(async () => (await loopState(page)).paused, { timeout: 2000, message: 'playing after Enter' })
      .toBe(false);

    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect
      .poll(async () => (await loopState(page)).paused, { timeout: 1500, message: 'paused after the second Enter' })
      .toBe(true);
  });

  test('TC-PHOTO-07: reduced motion plays nothing at rest and runs no animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const requests: string[] = [];
    page.on('request', (r) => {
      if (r.url().includes(LOOP)) requests.push(r.url());
    });
    await page.reload({ waitUntil: 'load' });
    await page.locator(HERO).waitFor({ state: 'visible', timeout: 15000 });
    await page.locator(FIGURE).hover();
    await page.waitForTimeout(2500);

    const state = await loopState(page);
    expect(state.currentSrc, 'no source under reduced motion, even on hover').toBe('');
    expect(state.paused, 'nothing plays under reduced motion without a press').toBe(true);
    expect(requests, 'no loop request under reduced motion').toEqual([]);

    // The toggle survives: a user action is allowed (WCAG 2.2.2 works both ways).
    await expect(page.locator(TOGGLE)).toHaveCount(1);

    const running = await page.locator(FIGURE).evaluate((el) => {
      const nodes = [el, ...Array.from(el.querySelectorAll('*'))];
      return nodes
        .flatMap((n) => n.getAnimations({ subtree: false }))
        .filter((a) => a.playState === 'running').length;
    });
    expect(running, 'no running animation inside the figure under reduced motion').toBe(0);
  });

  test('TC-PHOTO-08: TC-HERO-12 still holds — an action ends inside the first 844 px at 390', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.reload({ waitUntil: 'load' });
    await page.locator(`${HERO} h1`).waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(1200);

    const evidence = page.locator(`${HERO} a[href="#experience"]`).first();
    const box = await evidence.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height, 'See the evidence must end inside the first 844 px').toBeLessThanOrEqual(844);
  });

  test('TC-PHOTO-09: the decorations are present — four corner ticks and the caption plate', async ({ page }) => {
    const ticks = page.locator(`${FIGURE} ${TICK}`);
    await expect(ticks, 'four caliper-style corner ticks').toHaveCount(4);
    const corners = await ticks.evaluateAll((els) => els.map((el) => el.getAttribute('data-corner')));
    expect(new Set(corners), 'one tick per corner').toEqual(new Set(['tl', 'tr', 'br', 'bl']));

    const caption = page.locator(`${FIGURE} ${CAPTION}`);
    await expect(caption).toHaveCount(1);
    await expect(caption).toHaveText(CAPTION_TEXT);
    const type = await caption.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { family: cs.fontFamily, spacing: cs.letterSpacing, size: Number.parseFloat(cs.fontSize) };
    });
    expect(type.family.toLowerCase(), 'the plate is set in the mono face').toMatch(/mono|courier/);
    expect(Number.parseFloat(type.spacing), 'the caption tracking is open').toBeGreaterThan(0);
    expect(type.size, 'micro type, not body').toBeLessThan(14);

    // The bloom sits behind the plate: a light layer under the photo, not black.
    const glow = page.locator(`${FIGURE} [data-testid="portrait-glow"]`);
    await expect(glow).toHaveCount(1);
    const image = await glow.evaluate((el) => getComputedStyle(el).backgroundImage);
    expect(image, 'the bloom is a radial gradient layer').toContain('radial-gradient');
  });

  test('TC-PHOTO-10: no gold anywhere in or around the figure', async ({ page }) => {
    await page.locator(FIGURE).hover();
    await page.waitForTimeout(800);

    const offenders = await page.locator(FIGURE).evaluate((root) => {
      const properties = [
        'color',
        'backgroundColor',
        'borderTopColor',
        'borderRightColor',
        'borderBottomColor',
        'borderLeftColor',
        'outlineColor',
        'textDecorationColor',
        'fill',
        'stroke',
      ];
      const parse = (value: string): [number, number, number] | null => {
        const m = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
        return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
      };
      const chromatic = ([r, g, b]: [number, number, number]) => {
        const mx = Math.max(r, g, b);
        const mn = Math.min(r, g, b);
        if (mx <= 24) return false;
        return (mx - mn) / mx > 0.28;
      };
      const hits: string[] = [];
      for (const el of [root, ...Array.from(root.querySelectorAll('*'))]) {
        const cs = getComputedStyle(el as Element) as unknown as Record<string, string>;
        for (const property of properties) {
          const raw = cs[property];
          if (!raw || raw === 'none') continue;
          const rgb = parse(raw);
          if (!rgb || !chromatic(rgb)) continue;
          hits.push(`${(el as Element).tagName.toLowerCase()} ${property}=${raw}`);
        }
      }
      return hits;
    });
    expect(offenders, `chromatic ink in the figure's chrome:\n${offenders.join('\n')}`).toEqual([]);

    const gradients = await page.locator(FIGURE).evaluate((root) =>
      [root, ...Array.from(root.querySelectorAll('*'))]
        .map((el) => getComputedStyle(el as Element).backgroundImage)
        .filter((v) => v && v !== 'none')
        .filter((v) => /rgb\(\s*20[0-9]|201,\s*168|c9a84c/i.test(v)),
    );
    expect(gradients, `gold in a background layer:\n${gradients.join('\n')}`).toEqual([]);
  });

  test('TC-PHOTO-11: the still carries width/height and the box never shifts', async ({ page }) => {
    const attrs = await page.locator(IMG).evaluate((el) => {
      const img = el as HTMLImageElement;
      return { width: img.getAttribute('width'), height: img.getAttribute('height') };
    });
    expect(attrs.width, 'intrinsic width attribute').toBe('1480');
    expect(attrs.height, 'intrinsic height attribute').toBe('826');

    const before = await page.locator(FIGURE).boundingBox();
    await page.locator(FIGURE).hover();
    await page.waitForTimeout(1400);
    const after = await page.locator(FIGURE).boundingBox();
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(Math.abs(after![key] - before![key]), `figure ${key} unchanged across the hover fade`).toBeLessThanOrEqual(
        1,
      );
    }

    // Attributed, not summed. The page-wide CLS budget belongs to PERF-03,
    // which measures a clean load with no hover; what this test owns is the
    // photograph's own contribution — a hover that starts a 1.1 MB loop over a
    // still must move nothing. Under `fullyParallel` on a loaded machine the
    // page's late-arriving text does shift (a deterministic 0.1764, identical
    // across runs, absent when the test runs alone), and summing would make
    // this test a report on the worker count rather than on the figure.
    const shifts = await page.evaluate(
      () =>
        new Promise<{ value: number; sources: string[] }[]>((resolve) => {
          const entries: { value: number; sources: string[] }[] = [];
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as (PerformanceEntry & {
              value: number;
              hadRecentInput: boolean;
              sources?: { node?: Node | null }[];
            })[]) {
              if (entry.hadRecentInput) continue;
              entries.push({
                value: entry.value,
                sources: (entry.sources ?? []).map((source) => {
                  const node = source.node;
                  const el = node && node.nodeType === 1 ? (node as Element) : node?.parentElement;
                  if (!el) return 'unknown';
                  const inFigure = !!el.closest('[data-testid="hero-portrait"]');
                  return `${inFigure ? 'FIGURE:' : 'page:'}${el.tagName.toLowerCase()}.${String(
                    (el as HTMLElement).className ?? '',
                  ).slice(0, 40)}`;
                }),
              });
            }
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve(entries), 600);
        }),
    );
    console.log(`Hover shifts: ${JSON.stringify(shifts)}`);
    const fromFigure = shifts.filter((s) => s.sources.some((source) => source.startsWith('FIGURE:')));
    const fromFigureTotal = fromFigure.reduce((sum, s) => sum + s.value, 0);
    expect(
      fromFigureTotal,
      `layout shift attributed to the photograph:\n${JSON.stringify(shifts, null, 1)}`,
    ).toBeLessThan(0.05);
  });
});

test.describe('Hero photograph at 834', () => {
  test.use({ viewport: { width: 834, height: 1112 } });

  test('TC-PHOTO-12: at 834 the figure still owns the whole right column', async ({ page }) => {
    await page.goto('/', { waitUntil: 'load' });
    await page.locator(HERO).waitFor({ state: 'visible', timeout: 15000 });

    const figure = await page.locator(FIGURE).boundingBox();
    const statement = await page.locator(`${HERO} p`).nth(2).boundingBox();
    expect(figure, 'the figure is laid out at 834').not.toBeNull();
    expect(statement, 'the statement is laid out at 834').not.toBeNull();
    expect(figure!.width, 'the right column is a real column, not a stamp').toBeGreaterThanOrEqual(240);
    expect(figure!.x, 'the figure sits to the right of the prose').toBeGreaterThan(statement!.x);
  });
});
