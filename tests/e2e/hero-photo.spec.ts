import { PNG } from 'pngjs';
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
const LOOP = 'my-hero-avatar.mp4';

/** WCAG relative luminance of one 8-bit sRGB triple — the same helper
 *  tests/overhaul/flagship-visibility.spec.ts measures light with. */
function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

interface LumaField {
  values: Float64Array;
  width: number;
  height: number;
}

/** Decode a PNG buffer to a row-major relative-luminance field. `pngjs` already
 *  resolves from this repo's node_modules (it ships with the Playwright
 *  toolchain), so no package is added to measure a picture. */
function decodeLuma(buffer: Buffer): LumaField {
  const png = PNG.sync.read(buffer);
  const values = new Float64Array(png.width * png.height);
  for (let i = 0; i < values.length; i += 1) {
    const o = i * 4;
    values[i] = relativeLuminance(png.data[o], png.data[o + 1], png.data[o + 2]);
  }
  return { values, width: png.width, height: png.height };
}

/** Luminance at a field pixel, clamped to the field so a sample can never read
 *  outside the capture. */
function lumaAt(field: LumaField, x: number, y: number): number {
  const cx = Math.max(0, Math.min(field.width - 1, Math.round(x)));
  const cy = Math.max(0, Math.min(field.height - 1, Math.round(y)));
  return field.values[cy * field.width + cx];
}

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

  /* SUPERSEDED by tests/overhaul/interim-frame.spec.ts TC-IF-02.
     It measured the figure's geometry inside the removed plane — the phone bleed,
     the 834 right column, the bloom behind the frame and the composite dissolve
     on its edges. The photograph is a plain block in normal flow now, and TC-IF-02
     measures what that has to be: visible in the first fold at four viewports,
     with no CSS filter and no plate behind the type. Removed on the Owner's 2026-09-06T05:51Z instruction
     (docs/architecture/INTERIM-FRAME.md); a case that measures a deleted element
     is not a case that can be made to pass. */

  test('TC-PHOTO-03: the still is monochrome in its bytes — no filter does the work', async ({
    page,
  }) => {
    // RE-POINTED 2026-09-06 (G-H6). docs/prompt.md §0.3-2 / C-8 allow black,
    // white and gold only; the chromatic exception the photograph used to hold
    // is retired (docs/architecture/PALETTE-EXCEPTIONS.md now declares an empty
    // register). The photograph is greyscale because the shipped PNG/WebP/AVIF
    // and the loop are re-encoded greyscale — proven byte-side by
    // tests/hero_assets_monochrome.test.mjs — and NOT because CSS greys a
    // colour file. So both halves are asserted here: no `grayscale()` anywhere
    // in the ancestor filter chain, and near-zero saturation in the pixels the
    // browser actually painted.
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
      expect(filter, `a CSS filter, not the asset, is doing the work: ${filter}`).not.toContain('grayscale');
    }

    // Pixels, not CSS: decode the loaded still into a canvas and measure HSL
    // saturation. A greyscale frame samples ~0; the old warm sunset grade sat
    // near 0.30.
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
    expect(saturation, `mean pixel saturation of the loaded still: ${saturation}`).toBeGreaterThanOrEqual(0);
    expect(saturation, `mean pixel saturation of the loaded still: ${saturation}`).toBeLessThan(0.02);
  });

  test('TC-PHOTO-03b: the rendered <picture> at 1440 is monochrome on ≥ 99.5% of its pixels', async ({
    page,
  }) => {
    // The real composite, at the width the owner reviews on: whatever the
    // browser paints — asset, CSS, blend mode, overlay — is what a reader sees.
    // 4/255 of chroma is a JPEG-grade rounding budget, well under the threshold
    // of visibility; 0.5% of pixels is the allowance for the antialiased edge
    // of the frame's own achromatic chrome.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.locator(HERO).waitFor({ state: 'visible' });
    await page.locator(IMG).evaluate(async (el) => {
      const img = el as HTMLImageElement;
      if (!img.complete) await img.decode();
    });
    await page.waitForTimeout(400);

    // The <picture> is a display:contents wrapper with no box of its own, so
    // the screenshot is taken of the <img> it paints — the same pixels.
    const shot = await page.locator(IMG).screenshot();
    const png = PNG.sync.read(shot);
    let chromatic = 0;
    let worst = 0;
    const total = png.width * png.height;
    for (let i = 0; i < total; i += 1) {
      const o = i * 4;
      const r = png.data[o];
      const g = png.data[o + 1];
      const b = png.data[o + 2];
      const chroma = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
      if (chroma > worst) worst = chroma;
      if (chroma > 4) chromatic += 1;
    }
    const share = chromatic / total;
    expect(total, 'the picture rendered with real pixels').toBeGreaterThan(10_000);
    expect(
      share,
      `${chromatic}/${total} painted pixels carry a hue (worst chroma ${worst}/255) at 1440`,
    ).toBeLessThanOrEqual(0.005);
  });

  test('TC-PHOTO-03c: GET /assets/my-hero-avatar.mp4 answers 200 video/mp4', async ({ page }) => {
    // docs/prompt.md §0.3-3 names public/assets/my-hero-avatar.mp4 as the
    // owner's hero video avatar. Live GET was 404 on 9136bc59 because the name
    // pointed at a retired 640×360 orphan. The canonical name must now serve
    // the real loop from the static export.
    const response = await page.request.get(`/assets/${LOOP}`);
    expect(response.status(), `GET /assets/${LOOP}`).toBe(200);
    expect(response.headers()['content-type'] ?? '', 'content-type of the loop').toContain('video/mp4');
    const body = await response.body();
    expect(body.byteLength, 'the loop has real bytes').toBeGreaterThan(100_000);
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

  /* SUPERSEDED by tests/overhaul/interim-frame.spec.ts TC-IF-02.
     It measured the figure's geometry inside the removed plane — the phone bleed,
     the 834 right column, the bloom behind the frame and the composite dissolve
     on its edges. The photograph is a plain block in normal flow now, and TC-IF-02
     measures what that has to be: visible in the first fold at four viewports,
     with no CSS filter and no plate behind the type. Removed on the Owner's 2026-09-06T05:51Z instruction
     (docs/architecture/INTERIM-FRAME.md); a case that measures a deleted element
     is not a case that can be made to pass. */

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

    // TEST FIX (t_w1_red2, 2026-09-06): the 165 px this used to report was
    // Playwright's own actionability scroll, not the product. `locator.hover()`
    // runs scrollIntoViewIfNeeded first, and `boundingBox()` is viewport-
    // relative — so the "before" reading was taken at scrollY 0 and the "after"
    // reading after the figure had been scrolled up by 165 px. Measured on an
    // untouched origin/main export (01-reproduction.log): the figure's
    // *document* position never moved, only the viewport did. The figure is
    // therefore scrolled into place first, both readings are taken in that same
    // scroll position, and the hover is delivered with page.mouse.move so
    // nothing can scroll between them. The assertion itself is unchanged: 1 px.
    await page.locator(FIGURE).scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const before = await page.locator(FIGURE).boundingBox();
    await page.mouse.move(before!.x + before!.width / 2, before!.y + before!.height / 2);
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

  /* SUPERSEDED by tests/overhaul/interim-frame.spec.ts TC-IF-02.
     It measured the figure's geometry inside the removed plane — the phone bleed,
     the 834 right column, the bloom behind the frame and the composite dissolve
     on its edges. The photograph is a plain block in normal flow now, and TC-IF-02
     measures what that has to be: visible in the first fold at four viewports,
     with no CSS filter and no plate behind the type. Removed on the Owner's 2026-09-06T05:51Z instruction
     (docs/architecture/INTERIM-FRAME.md); a case that measures a deleted element
     is not a case that can be made to pass. */

});

/* -------------------------------------------------------------------------- */
/* g2h1-04 — the photograph loses its card (HERO-FOLD-v2 §5.1 / decision D-3).  */
/*                                                                            */
/* The drafting frame, the four caliper ticks and the registration cross leave */
/* the fold; the media box's outer edges dissolve into the plane through a      */
/* composite mask instead of ending on a rule. Five clauses (PH-1..PH-5) from   */
/* the brief. None of them samples inside the media rect, so they are           */
/* colour-agnostic: the t_g2_h6 decision moves one filter and nothing here.     */
/* -------------------------------------------------------------------------- */

const MEDIA = `${FIGURE} picture`; // `.locator('..')` climbs to the media box .portraitMedia

/** The media box element handle (`.portraitMedia`), climbed from its <picture>. */
function mediaBox(page: Page) {
  return page.locator(MEDIA).first().locator('..');
}

test.describe('Hero photograph — masked into the plane (g2h1-04)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'load' });
    await page.locator(HERO).waitFor({ state: 'visible', timeout: 15000 });
  });

  test('PH-1: no closed rectangle — border, outline and box-shadow are none on the box and its children; zero ticks in the fold', async ({
    page,
  }) => {
    const box = mediaBox(page);
    const nodes = await box.evaluate((root) => {
      const read = (el: Element) => {
        const cs = getComputedStyle(el);
        return {
          tag: el.tagName.toLowerCase(),
          borderStyle: cs.borderStyle,
          borderWidth: cs.borderWidth,
          outlineStyle: cs.outlineStyle,
          outlineWidth: cs.outlineWidth,
          boxShadow: cs.boxShadow,
        };
      };
      return [root, ...Array.from(root.querySelectorAll('*'))].map(read);
    });

    for (const n of nodes) {
      expect(n.boxShadow, `box-shadow on ${n.tag}: ${n.boxShadow}`).toBe('none');
      const borderVisible =
        n.borderStyle.split(' ').some((s) => s !== 'none') &&
        n.borderWidth.split(' ').some((w) => Number.parseFloat(w) > 0);
      expect(borderVisible, `border on ${n.tag}: ${n.borderStyle} / ${n.borderWidth}`).toBe(false);
      const outlineVisible =
        n.outlineStyle !== 'none' && n.outlineWidth.split(' ').some((w) => Number.parseFloat(w) > 0);
      expect(outlineVisible, `outline on ${n.tag}: ${n.outlineStyle} / ${n.outlineWidth}`).toBe(false);
    }

    await expect(page.locator(`${HERO} ${TICK}`), 'zero portrait-tick nodes in the fold').toHaveCount(0);
  });

  /* SUPERSEDED by tests/overhaul/interim-frame.spec.ts TC-IF-02.
     It measured the figure's geometry inside the removed plane — the phone bleed,
     the 834 right column, the bloom behind the frame and the composite dissolve
     on its edges. The photograph is a plain block in normal flow now, and TC-IF-02
     measures what that has to be: visible in the first fold at four viewports,
     with no CSS filter and no plate behind the type. Removed on the Owner's 2026-09-06T05:51Z instruction
     (docs/architecture/INTERIM-FRAME.md); a case that measures a deleted element
     is not a case that can be made to pass. */

  test('PH-3: the face survives — the mask is opaque over the upper-centre; no gradient crosses it', async ({
    page,
  }) => {
    const box = mediaBox(page);
    await box.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);
    const rect = await box.boundingBox();
    expect(rect).not.toBeNull();

    const clip = { x: rect!.x, y: rect!.y, width: rect!.width, height: rect!.height };
    const masked = decodeLuma(await page.screenshot({ clip }));

    // Lift the mask and re-shoot: over an opaque region the two frames are the
    // same pixels, so the difference there is ~0; a gradient crossing the face
    // would show up as a real ΔL. The face sits at object-position 50% 42%, so
    // the tested window (x 30–70 %, y 20–60 %) is centred on it and lands inside
    // the mask's opaque core (16–84 % on both axes).
    await box.evaluate((el) => {
      (el as HTMLElement).style.webkitMaskImage = 'none';
      (el as HTMLElement).style.maskImage = 'none';
    });
    await page.waitForTimeout(120);
    const bare = decodeLuma(await page.screenshot({ clip }));
    await box.evaluate((el) => {
      (el as HTMLElement).style.removeProperty('-webkit-mask-image');
      (el as HTMLElement).style.removeProperty('mask-image');
    });

    let sum = 0;
    let n = 0;
    for (let ty = 0.2; ty <= 0.6; ty += 0.02) {
      for (let tx = 0.3; tx <= 0.7; tx += 0.02) {
        const x = tx * masked.width;
        const y = ty * masked.height;
        sum += Math.abs(lumaAt(masked, x, y) - lumaAt(bare, x, y));
        n += 1;
      }
    }
    const meanFaceDelta = n ? sum / n : 1;
    expect(meanFaceDelta, `the mask must not touch the face (mean |ΔL| ${meanFaceDelta})`).toBeLessThanOrEqual(
      0.02,
    );
  });

  test('PH-4: it is still a <figure>, its caption stands in the proof band, and nothing in it is pressable', async ({
    page,
  }) => {
    const figure = page.locator(FIGURE);
    await expect(figure).toHaveCount(1);
    expect(await figure.evaluate((el) => el.tagName.toLowerCase()), 'the element is a <figure>').toBe('figure');
    // g2h1v3-01: the figure moved into `[data-plane="hero"]`, and the declared
    // plane may carry no text leaf at all (TC-HERO-PLANE-03) — so the caption is
    // no longer inside it. It is not deleted: it renders in `.proof`, beside the
    // photograph's named control, with its words and its type unchanged.
    await expect(page.locator(`${FIGURE} figcaption`), 'no caption inside the plane').toHaveCount(0);
    await expect(
      page.locator(`[data-testid="hero-proof"] [data-testid="portrait-caption"]`),
      'the caption stands in the proof band instead',
    ).toHaveCount(1);
    // SUPERSEDED row (docs/architecture/INTERIM-FRAME.md): the figure used to be
    // composited inside `[data-plane="hero"]`. The plane is removed; the figure
    // stands in the fold in normal flow, and interim-frame TC-IF-01 asserts that
    // no plane exists in #hero at all. What this case still guards — that the
    // element is a <figure>, that its caption is in the proof band and that
    // nothing inside it is pressable — is unchanged and asserted above and below.

    const pressables = await figure.evaluate(
      (el) =>
        el.querySelectorAll(
          'a[href],button,[role="button"],input,select,textarea,[onclick],[tabindex]:not([tabindex="-1"])',
        ).length,
    );
    expect(pressables, 'figurePressables === 0 — the figure never becomes a second call to action').toBe(0);
  });

  test('PH-5: costs nothing — the mask is compositing only; the box never resizes and figure CLS is 0 across 9 loads', async ({
    page,
  }) => {
    // The mask itself is removed with the rest of the hero's atmosphere
    // (docs/architecture/INTERIM-FRAME.md §1 item 5); toggling it off is a no-op
    // now, which is the strongest form of "compositing only" there is. The
    // measurement below is kept as written so the box's geometry and the figure's
    // CLS stay under a gate.
    const box = mediaBox(page);
    await box.scrollIntoViewIfNeeded();
    const before = await box.boundingBox();
    await box.evaluate((el) => {
      (el as HTMLElement).style.webkitMaskImage = 'none';
      (el as HTMLElement).style.maskImage = 'none';
    });
    await page.waitForTimeout(120);
    const after = await box.boundingBox();
    await box.evaluate((el) => {
      (el as HTMLElement).style.removeProperty('-webkit-mask-image');
      (el as HTMLElement).style.removeProperty('mask-image');
    });
    for (const key of ['width', 'height'] as const) {
      expect(Math.abs(after![key] - before![key]), `media ${key} unchanged when the mask is toggled`).toBeLessThanOrEqual(
        0.5,
      );
    }

    // Layout shift attributed to the figure, across 9 cold loads.
    let worst = 0;
    for (let load = 0; load < 9; load += 1) {
      await page.goto('/', { waitUntil: 'load' });
      await page.locator(HERO).waitFor({ state: 'visible', timeout: 15000 });
      const figureShift = await page.evaluate(
        () =>
          new Promise<number>((resolve) => {
            let total = 0;
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries() as (PerformanceEntry & {
                value: number;
                hadRecentInput: boolean;
                sources?: { node?: Node | null }[];
              })[]) {
                if (entry.hadRecentInput) continue;
                const fromFigure = (entry.sources ?? []).some((s) => {
                  const node = s.node;
                  const el = node && node.nodeType === 1 ? (node as Element) : node?.parentElement;
                  return !!el?.closest('[data-testid="hero-portrait"]');
                });
                if (fromFigure) total += entry.value;
              }
            }).observe({ type: 'layout-shift', buffered: true });
            setTimeout(() => resolve(total), 500);
          }),
      );
      worst = Math.max(worst, figureShift);
    }
    expect(worst, `worst figure-attributed CLS across 9 loads: ${worst}`).toBeLessThan(0.01);
  });
});

/* -------------------------------------------------------------------------- */
/* Rung selection on the static export (G-H5).                                 */
/*                                                                            */
/* The loop is no longer one file. `app/data/portfolio/avatar.ts` declares a   */
/* three-rung ladder cut from the one 3840x2160@24 master, and lib/videoRung.ts */
/* chooses between the rungs at the moment of play:                            */
/*                                                                            */
/*   need = the video box's rendered CSS height x devicePixelRatio             */
/*   rung = the smallest published rung whose height >= need                   */
/*                                                                            */
/* The unit test (tests/unit/video-rung.spec.ts) pins the rule; these cases    */
/* pin the wiring — that a real browser, on a real export, assigns the source  */
/* the rule dictates for the box it actually rendered, and that the two larger */
/* URLs are published rather than 404 (the precise finding of reviewer         */
/* 56ffed3e: "every higher URL 404s").                                        */
/*                                                                            */
/* The measured box is what makes these numbers what they are: the hero        */
/* portrait's media rect is 305 CSS px tall at 1440 and 321 px at its capped   */
/* maximum, so a 1x or 2x screen genuinely needs no more than 720p and gets    */
/* exactly that — the default holds and nothing extra is fetched — while a 3x  */
/* screen needs 916 device px and is answered with 1080p.                     */
/* -------------------------------------------------------------------------- */

/** The whole loop state plus the arithmetic the choice was made from. */
async function rungState(page: Page) {
  return page.locator(VIDEO).first().evaluate((el) => {
    const v = el as HTMLVideoElement;
    const box = v.getBoundingClientRect();
    return {
      file: (v.currentSrc || '').split('/').pop() ?? '',
      renderedWidth: box.width,
      renderedHeight: box.height,
      dpr: window.devicePixelRatio,
      need: box.height * window.devicePixelRatio,
    };
  });
}

async function playAndRead(page: Page) {
  await page.locator(FIGURE).hover();
  await expect
    .poll(async () => (await rungState(page)).file, { timeout: 4000, message: 'a source is assigned on hover' })
    .not.toBe('');
  return rungState(page);
}

/* -- The rule, restated here rather than imported -----------------------------
 *
 * REWRITTEN 2026-09-06 (t_w2_h1s5). The three cases below used to name literal
 * device-pixel counts — "needs under 720", "needs 916" — and those numbers were
 * true of exactly ONE figure box: the pre-v3 media rect, 305 CSS px tall at
 * 1440 (the block comment above still records it). HERO-SETPIECE-v3 §3.2 sets
 * `.planeFigure` to 846 × 472 at 1440, so a 2× screen now needs 472 × 2 = 944
 * device px and a 3× screen 1416 — and the literals became assertions about a
 * geometry the site no longer has. Measured on the export at fda8406: 944.3 and
 * 2160.webm respectively (t_w2_h1s4/09-hero-e2e.log).
 *
 * What v3 §4.3 and `lib/videoRung.ts` actually promise is a RULE:
 *
 *   need = the video box's rendered CSS height × devicePixelRatio
 *   rung = the smallest published rung whose encoded height ≥ need
 *
 * That is what these cases assert from here on, derived from the box the
 * browser really rendered — so the next legitimate change to the figure's
 * geometry moves the expectation with it instead of turning the case red for a
 * reason that has nothing to do with the ladder. Nothing is relaxed: each case
 * still pins the exact filename the rule produces, still pins the emulated DPR,
 * and now also pins the geometry the need was computed from (native aspect,
 * FIG-CAP width) so a collapsed box cannot make the arithmetic trivially true.
 *
 * The ladder is copied from `app/data/portfolio/avatar.ts` rather than imported
 * from `lib/videoRung.ts`: a test that calls the implementation to compute its
 * own expectation agrees with the implementation by construction.
 */
const LADDER = [
  { height: 720, file: 'my-hero-avatar.mp4' },
  { height: 1080, file: 'my-hero-avatar-1080.mp4' },
  { height: 2160, file: 'my-hero-avatar-2160.webm' },
] as const;

/** HERO-SETPIECE-v3 §4.3: the smallest published rung that covers `need`; the
 *  largest published rung when nothing covers it. */
function rungFor(need: number, ladder: readonly { height: number; file: string }[] = LADDER) {
  return ladder.find((rung) => rung.height >= need) ?? ladder[ladder.length - 1];
}

/** The figure's box is the input to the whole rule, so it is asserted too:
 *  native 1480/826 aspect (nothing cropped) and inside FIG-CAP (v3 §3). */
function expectFigureGeometry(state: { renderedHeight: number }, width: number) {
  expect(width, 'FIG-CAP: the figure is never upscaled past 1480 ÷ 1.75 DPR').toBeLessThanOrEqual(846);
  expect(
    Math.abs(width / state.renderedHeight - 1480 / 826),
    `the box keeps the native aspect (${width.toFixed(0)}×${state.renderedHeight.toFixed(0)})`,
  ).toBeLessThan(0.05);
}

test.describe('The loop ladder — which encode a screen is actually served', () => {
  test.describe('a 2x screen at 1440', () => {
    test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });

    test('TC-PHOTO-13: a 2× screen is served the smallest rung its measured box needs — and nothing larger', async ({
      page,
    }) => {
      await page.goto('/', { waitUntil: 'load' });
      const state = await playAndRead(page);
      expect(state.dpr, 'the emulated pixel ratio').toBe(2);
      expectFigureGeometry(state, state.renderedWidth);

      const expected = rungFor(state.need);
      expect(
        state.file,
        `box ${state.renderedHeight.toFixed(0)} CSS px × ${state.dpr} = ${state.need.toFixed(0)} device px → ${expected.height}p`,
      ).toBe(expected.file);

      // "and nothing larger": every rung below the chosen one is genuinely too
      // small, so the ladder cannot pass by always reaching for the top.
      for (const rung of LADDER) {
        if (rung.height < expected.height) {
          expect(rung.height, `${rung.height}p is below the ${state.need.toFixed(0)} px need`).toBeLessThan(
            state.need,
          );
        }
      }
    });
  });

  test.describe('a 3x phone at 390', () => {
    test.use({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });

    test('TC-PHOTO-14: a small box at 3x still resolves inside 720p — no data is spent to prove a point', async ({
      page,
    }) => {
      await page.goto('/', { waitUntil: 'load' });
      const state = await playAndRead(page);
      expect(state.dpr).toBe(3);
      expectFigureGeometry(state, state.renderedWidth);
      // §3.5's phone box (366 × 204) still resolves inside 720p at 3×: 613 px.
      // The claim in the title is a real geometric claim, so it is kept as an
      // assertion rather than folded into the rule.
      expect(state.need, `device pixels down the phone box: ${state.need.toFixed(0)}`).toBeLessThanOrEqual(
        720,
      );
      expect(state.file).toBe(rungFor(state.need).file);
      expect(state.file, 'the base rung, so no extra bytes are spent').toBe('my-hero-avatar.mp4');
    });
  });

  test.describe('a 3x desktop at 1440', () => {
    test.use({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });

    test('TC-PHOTO-15: a 3× desktop outgrows the base rung, so an on-demand rung is fetched instead', async ({
      page,
    }) => {
      await page.goto('/', { waitUntil: 'load' });
      const state = await playAndRead(page);
      expectFigureGeometry(state, state.renderedWidth);
      expect(state.need, 'device pixels down the box').toBeGreaterThan(720);

      const expected = rungFor(state.need);
      expect(expected.file, 'the rule reaches past the base rung here').not.toBe('my-hero-avatar.mp4');
      expect(
        state.file,
        `box ${state.renderedHeight.toFixed(0)} CSS px × ${state.dpr} = ${state.need.toFixed(0)} device px → ${expected.height}p`,
      ).toBe(expected.file);
    });

    test('TC-PHOTO-16: Save-Data pins the same screen back to the 720p rung', async ({ page }) => {
      await page.addInitScript(() => {
        Object.defineProperty(navigator, 'connection', {
          configurable: true,
          get: () => ({ saveData: true }),
        });
      });
      await page.goto('/', { waitUntil: 'load' });
      const state = await playAndRead(page);
      expect(state.need, 'the screen still needs more than 720').toBeGreaterThan(720);
      expect(state.file, 'but the reader asked for less data').toBe('my-hero-avatar.mp4');
    });

    test('TC-PHOTO-17: a browser with no AV1 decoder never receives the WebM rung', async ({ page }) => {
      await page.addInitScript(() => {
        const native = HTMLMediaElement.prototype.canPlayType;
        HTMLMediaElement.prototype.canPlayType = function patched(type: string) {
          return /av01|webm/i.test(type) ? '' : native.call(this, type);
        };
      });
      await page.goto('/', { waitUntil: 'load' });
      const state = await playAndRead(page);
      expect(state.file).not.toContain('.webm');
      expect(state.file).toBe('my-hero-avatar-1080.mp4');
    });
  });

  test('TC-PHOTO-18: both on-demand rungs are published — the URLs the ladder names answer 200', async ({ page }) => {
    const rungs = [
      { path: '/assets/avatar/my-hero-avatar-1080.mp4', type: 'video/mp4' },
      { path: '/assets/avatar/my-hero-avatar-2160.webm', type: 'video/webm' },
    ];
    for (const rung of rungs) {
      const response = await page.request.get(rung.path);
      expect(response.status(), `GET ${rung.path}`).toBe(200);
      expect(response.headers()['content-type'] ?? '', `content-type of ${rung.path}`).toContain(rung.type);
      const body = await response.body();
      expect(body.byteLength, `${rung.path} has real bytes`).toBeGreaterThan(1_000_000);
      expect(body.byteLength, `${rung.path} is inside the 5 MB on-demand budget`).toBeLessThanOrEqual(5 * 1024 * 1024);
    }
  });

  test('TC-PHOTO-19: at rest none of the three rungs is requested', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (r) => {
      if (/my-hero-avatar(-\d+)?\.(mp4|webm)/.test(r.url())) requested.push(r.url());
    });
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(2500);
    expect(requested, 'no rung is fetched before the reader asks').toEqual([]);
  });
});
