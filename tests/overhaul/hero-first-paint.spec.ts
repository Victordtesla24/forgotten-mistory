import { test, expect, type Page } from '@playwright/test';
import { PNG } from 'pngjs';

/**
 * G-H2a — the hero's atmosphere is in the *first paint*.
 *
 * The defect this file guards, as the independent production review measured it
 * (docs/delivery/evidence/v10-20260905T0515Z/, ADV-FAIL-20260905): a normal load
 * of the live site produced **zero canvases**, and the hero atmosphere appeared
 * only under `/?gl=force`. The flagship of a portfolio arguing for engineering
 * craft was, structurally, absent from the screen a recruiter actually sees.
 *
 * The cause was one line. `components/gl/Scene.tsx` gates *every* scene on
 * `pageSettled` — `window.load` and then one `requestIdleCallback` — and that
 * gate exists for a real, measured reason: `components/gl/GLCanvas.tsx:14`
 * records that an eager R3F canvas pushed LCP from ~1.6 s to 2.7 s. So the gate
 * is not removed. `Scene` instead takes an opt-in `priority` prop
 * (docs/architecture/SIGNATURE-SCENES-v1.md §4.1(a), decision D3) which the hero
 * — and only the hero — passes:
 *
 *     show = capability && allowMotion && near && (priority || pageSettled)
 *
 * Two things have to be true for that to be an improvement rather than a
 * trade, and this file asserts both.
 *
 *   TC-HERO-FIRSTPAINT-01  The hero's slot carries a *still* of its own — served
 *       in the document, declared by the stylesheet, owing nothing to the scene
 *       — and that still is **lit**. This is the floor under everything else:
 *       the reader who arrives before the canvas, or never gets one, sees a
 *       composed frame rather than a black rectangle waiting to be filled in.
 *       The still is the site's own gradient today and becomes the overture's
 *       frame 0 (`hero-overture-poster.avif`) when that asset lands in t_x1_13;
 *       the assertion is written against the property both share, so it does not
 *       have to be rewritten when the picture changes.
 *
 *   TC-HERO-FIRSTPAINT-02  At `?gl=force`, a canvas exists inside
 *       `[data-scene="hero-atmosphere"]` within `PRIORITY_BUDGET_MS` of
 *       `domcontentloaded` — measured without ever waiting for network idle,
 *       because waiting for idle is precisely the thing being bypassed. A
 *       regression that reinstated the idle gate on the hero would still pass
 *       every other scene test on the page and would fail here.
 *
 * A third assertion, TC-HERO-FIRSTPAINT-03, guards the blast radius of the
 * change: the prop is opt-in, so no non-hero slot may mount a canvas before the
 * page has settled. Deleting the `priority ||` guard and gating nothing would
 * make 01 and 02 pass and 03 fail.
 *
 * ## Why the still is measured as a picture and not as a string
 *
 * `background-image: none` is the only value that proves nothing is painted,
 * and every other value is a promise, not a picture — a gradient of transparent
 * stops, or a `url()` that 404s, both read as "present". So the string check is
 * the cheap half and the luminance of an actual screenshot is the real one.
 *
 * ## Why the still is photographed with the bundle blocked, not with JS off
 *
 * The architecture note specifies this measurement with JavaScript disabled
 * outright, and that is the right shape for it — but on this build it measures
 * something else, and the difference is a defect this lane found rather than one
 * it introduced. `app/loading.tsx` puts the whole route behind a Suspense
 * boundary, so the export ships the page's real markup inside a `<div hidden>`
 * and swaps it in with React's inline streaming script. Probed at 1440 with
 * `javaScriptEnabled: false`, `#hero` measures 0×0 and the only thing on screen
 * is the shell's "Loading portfolio" — the hero, all six sections, and every
 * word of the copy are in the document but hidden, indefinitely, for any client
 * that does not run script (this lane's `01-js-blocked-shell.log`).
 *
 * That is a real production finding — it is what a non-executing crawler sees —
 * but it is a route-level defect in a file this lane does not own, and fixing it
 * blind, next to a concurrent hero lane, risks the whole page for a slice about
 * one prop. It is filed for its own task. Blocking the WebGL chunk instead gives
 * the same guarantee for the property actually under test: the slot with no
 * canvas in it, on the code path a reader with no GPU or reduced motion is
 * already served. Part (a) below keeps the "out of the static HTML" half honest
 * by reading the served bytes directly, which the shell cannot affect.
 */

/**
 * The software rasteriser, enabled explicitly. This host has no GPU, and
 * `?gl=force` only lifts the *application's* guard against software renderers —
 * the browser still needs a rasteriser to give three a context at all. Same
 * arguments as `tests/overhaul/flagship-visibility.spec.ts`.
 *
 * `launchOptions` is worker-scoped, so Playwright only accepts it at file level
 * (a `describe`-level copy would force a new worker mid-file). `javaScriptEnabled`
 * is context-scoped and is therefore set on the one describe that needs it.
 */
test.use({
  deviceScaleFactor: 1,
  launchOptions: {
    args: [
      '--no-sandbox',
      '--use-gl=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  },
});

/**
 * How long after `domcontentloaded` the priority scene has to be on screen.
 *
 * The architecture note fixes 1200 ms (§4.1 acceptance) and uses it as a *proof
 * that the idle gate was bypassed* rather than as a performance budget. On this
 * host it does not measure the gate. Measured at `?gl=force`
 * (`05-priority-timing.log`): 820–907 ms at 390 and 1175–1230 ms at 1440 on an
 * idle box; 1614–2465 ms for the same code with a `tsc` beside it; and
 * 2215–3369 ms after the `app/loading.tsx` height-reservation fix landed, which
 * made the shell a full viewport and moved hydration later. The figure tracks
 * what else the host is doing and what the shell is doing — not the term this
 * file is about — and it has already moved by 3× without the scene changing at
 * all.
 *
 * So no wall-clock threshold is asserted here, because there is no honest one to
 * assert: a number picked above today's spread would be re-picked on the next
 * host, and each re-pick would look like a passing test getting easier. The two
 * things worth asserting are asserted where they can be measured properly:
 *
 *   - *did it bypass the gate* — TC-HERO-FIRSTPAINT-02b, causally, by making
 *     `pageSettled` unreachable. No host speed can fake it and no host slowness
 *     can break it.
 *   - *is it fast enough for the reader* — `tests/perf/performance.spec.ts`
 *     PERF-02, which owns the LCP budget the note actually cares about and
 *     measures 200 ms against 2.5 s with this change in.
 *
 * What is left below is a liveness ceiling: generous, existing only to fail a
 * scene that never arrives at all rather than one that arrives on a busy box.
 * The measurement is printed on every run so the trend stays visible.
 */
const PRIORITY_BUDGET_MS = 15000;

/**
 * The floor the hero's first-paint still has to clear, as mean WCAG relative
 * luminance over the slot.
 *
 * Calibrated against the thing it is here to catch, which is an unlit slot.
 * `--ink-900` (`#0A0A0A`), the ink the hero's ground is built from, measures
 * 0.0030 — so a slot that had lost its still, or had gained a full-frame wash
 * that extinguished it, lands within a rounding error of zero. The still as it
 * ships measures **0.0605 at 1440×900** and **0.0908 at 390×844** (this lane's
 * `03-still-luminance.log`); the two differ because `.stage::after`, the desktop
 * scrim, is `display: none` on a phone. 0.04 sits under the smaller of the two
 * with a third of it to spare — room for font and rasteriser variation between
 * hosts — and is still more than thirteen times the ink. Anything that actually
 * put the hero's first paint out lands far below it.
 *
 * It is deliberately *not* the 0.10 the architecture note names. That number
 * describes the finished composition — the overture's own frame 0 under a
 * **graded** text plate (§4.1(b), a separate lane) — and today's still is the
 * site's gradient under the *existing* 0.88 full-frame scrim, which by
 * construction cannot reach it: the wash is exactly what §4.1(b) is being
 * written to remove. Asserting 0.10 here would fail on correct code and would
 * claim this lane shipped a composition it did not. The floor is raised in the
 * commit that changes the picture it measures.
 */
const LIT_STILL_MIN_LUMA = 0.04;

/** Relative luminance (WCAG) of one 8-bit sRGB triple. */
function relativeLuminance(r: number, g: number, b: number): number {
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Mean relative luminance of a PNG capture. `pngjs` arrives with Playwright. */
function meanLuminance(buffer: Buffer): number {
  const png = PNG.sync.read(buffer);
  let sum = 0;
  const pixels = png.width * png.height;
  for (let i = 0; i < pixels; i += 1) {
    const o = i * 4;
    sum += relativeLuminance(png.data[o], png.data[o + 1], png.data[o + 2]);
  }
  return sum / pixels;
}

/** The hero's backdrop slot, addressed by the handle `Scene` stamps on it. */
function heroSlot(page: Page) {
  return page.locator('[data-scene="hero-atmosphere"]');
}

test.describe('G-H2a: the hero atmosphere is in the first paint', () => {
  test.describe.configure({ timeout: 90000 });

  /**
   * The lazily-imported WebGL bundle (`components/gl/GLCanvas` → three + R3F).
   * Aborting it is how this file photographs a first paint that *cannot* contain
   * a canvas: whatever is on screen is then the slot's own still and nothing
   * else, on the same code path a reader with no GPU or reduced motion gets.
   * Next names dynamically-imported chunks `<id>.<hash>.js` (dot), as
   * `tests/overhaul/scene-error-boundary.spec.ts` also relies on.
   */
  const LAZY_CHUNK = /\/_next\/static\/chunks\/\d+\.[^/]+\.js(\?.*)?$/;

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ] as const) {
    test(`TC-HERO-FIRSTPAINT-01 [${viewport.width}]: the hero slot carries a lit still, served and painted without the scene`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.route(LAZY_CHUNK, (route) => route.abort());

      // (a) The still is *served*, not assembled. Read the document as bytes,
      // before a browser has run a line of it: the slot has to be in the HTML
      // the server sent. If the hero's backdrop ever became a node script
      // creates, this is what notices — and it would take the first paint with
      // it no matter how good the picture was.
      const document = await (await page.request.get('/')).text();
      expect(
        document,
        'the hero slot is not in the served document — the backdrop is being created by script, ' +
          'so there is no first paint to light',
      ).toContain('data-scene="hero-atmosphere"');

      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const slot = heroSlot(page);
      await expect(slot).toHaveCount(1);
      await expect(slot).toBeVisible();

      // (b) The still is *declared*, by the stylesheet. `none` is the one value
      // that means the slot paints nothing of its own and waits for a canvas.
      const backgroundImage = await slot.evaluate((el) => getComputedStyle(el).backgroundImage);
      expect(
        backgroundImage,
        'the hero slot declares no background of its own — with the scene absent there is nothing to see',
      ).not.toBe('none');

      // (c) The still is *lit* — the half that cannot be satisfied by a promise.
      // A `url()` that 404s and a gradient of transparent stops both pass (b).
      const canvases = await slot.locator('canvas').count();
      expect(canvases, 'the WebGL bundle was meant to be blocked for this measurement').toBe(0);

      const box = await slot.boundingBox();
      expect(box, 'the hero slot has no box to photograph').not.toBeNull();
      expect(box!.width).toBeGreaterThanOrEqual(viewport.width);
      expect(box!.height).toBeGreaterThan(320);

      const luma = meanLuminance(await slot.screenshot());
      console.log(
        `[TC-HERO-FIRSTPAINT-01] still mean luminance @${viewport.width}: ${luma.toFixed(4)}`,
      );
      expect(
        luma,
        `the hero's first paint is unlit (mean luminance ${luma.toFixed(4)} < ` +
          `${LIT_STILL_MIN_LUMA}) — the reader who arrives before the canvas, or never gets ` +
          'one, is shown a black rectangle where the flagship should be',
      ).toBeGreaterThanOrEqual(LIT_STILL_MIN_LUMA);
    });
  }

  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ] as const) {
    test(`TC-HERO-FIRSTPAINT-02 [${viewport.width}]: the hero canvas mounts on a cold load`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);

      // `domcontentloaded` and nothing after it. `pageSettled` needs `window.load`
      // *plus* an idle callback, so the clock below starts before the gate this
      // test exists to prove was bypassed could possibly have opened.
      await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
      const started = Date.now();

      const canvas = heroSlot(page).locator('canvas');
      await expect(
        canvas,
        'no canvas inside [data-scene="hero-atmosphere"] within ' +
          `${PRIORITY_BUDGET_MS} ms of domcontentloaded — the hero scene is not in the ` +
          'first paint, so the flagship is absent from the screen the reader opens on',
      ).toHaveCount(1, { timeout: PRIORITY_BUDGET_MS });

      const elapsed = Date.now() - started;
      // Printed as a trend, not gated as a budget — see PRIORITY_BUDGET_MS.
      // PERF-02 owns the budget; this is the number the delivery record carries.
      console.log(
        `[TC-HERO-FIRSTPAINT-02] canvas_after_dcl_ms_glforce_${viewport.width}: ${elapsed}`,
      );
    });
  }

  test('TC-HERO-FIRSTPAINT-02b: the hero scene mounts even though the page never settles', async ({
    page,
  }) => {
    // The causal half, and the one that actually pins `priority` down.
    //
    // `Scene` sets `pageSettled` from inside a `requestIdleCallback` (falling
    // back to `setTimeout` only when the API is absent). Replace the API with a
    // function that accepts the callback and never runs it, and `pageSettled` is
    // false for the lifetime of the page — permanently, not just early. Every
    // scene held by the idle gate is then unmountable *by construction*, at any
    // host speed and with any timeout.
    //
    // A canvas appearing here therefore has exactly one possible cause: the
    // `priority || pageSettled` term. Revert that one edit and no budget, however
    // generous, can make this pass; leave it in and no host, however slow, can
    // make it fail.
    await page.addInitScript(() => {
      Object.defineProperty(window, 'requestIdleCallback', {
        configurable: true,
        writable: true,
        value: function neverIdle() {
          return 0;
        },
      });
    });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });

    await expect(
      heroSlot(page).locator('canvas'),
      'the hero scene never mounted on a page whose idle callback never fires — ' +
        'it is still gated on pageSettled, which is the G-H2 defect: the flagship ' +
        'is absent from the first paint',
    ).toHaveCount(1, { timeout: 15000 });

    // And the gate really was withheld — otherwise the assertion above proves
    // nothing. If this reads `true`, the stub failed and the test is vacuous.
    const idleRan = await page.evaluate(
      () => window.requestIdleCallback.toString().includes('neverIdle'),
    );
    expect(idleRan, 'the requestIdleCallback stub was replaced — the test proves nothing').toBe(
      true,
    );
  });

  test('TC-HERO-FIRSTPAINT-03: priority is opt-in — no other scene jumps the idle gate', async ({
    page,
  }) => {
    // The prop's whole justification (D3) is that the idle gate still protects
    // LCP for S2…S7. If a later edit hoisted `priority` to a default, or dropped
    // the `pageSettled` half of the condition, every scene on the page would
    // mount at once and this is where that shows up.
    await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });

    const canvasesBySlot = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[data-scene]')).map((el) => ({
        scene: el.getAttribute('data-scene'),
        canvases: el.querySelectorAll('canvas').length,
      })),
    );

    // Nothing below the hero is anywhere near the viewport at this point, so
    // `near` alone would hold most of them back; the assertion is scoped to the
    // ones the intersection observer has already admitted.
    for (const slot of canvasesBySlot) {
      if (slot.scene === 'hero-atmosphere') continue;
      expect(
        slot.canvases,
        `[data-scene="${slot.scene}"] mounted a canvas before the page settled — ` +
          'priority is meant to be opt-in and the hero is the only opt-in',
      ).toBe(0);
    }
  });
});

/**
 * G-H2b — the scrim is a grade bound to the reading column, not a wash over the
 * frame.
 *
 * ## The defect
 *
 * `.stage::after` used to be a flat `rgb(10 10 10 / 0.86)` across the whole
 * frame. It did protect the copy, and it also put a second, permanent
 * attenuation over every luminous layer the hero has — the rake, both pools,
 * the shader. The independent review called the result a shy backdrop
 * (ADV-FAIL-20260905): the flagship scene was on screen and could not be seen.
 *
 * The fix is not "less scrim". It is a scrim that is *shaped like the column it
 * protects*: heavy where a glyph is drawn, gone where the picture is. Then both
 * things are true at once — the copy keeps AA and the light crosses the frame.
 *
 * ## What this measures, and why not the bands the architecture note names
 *
 * `docs/architecture/SIGNATURE-SCENES-v1.md` §4.1(b) writes the acceptance as
 * *the outer thirds (x < 22% and x > 78%) are ≥ 0.06 brighter than the centre
 * reading band*. That phrasing assumes the copy runs down the middle of the
 * frame, which was true when the note was written and is not true now: the fold
 * lane (44c3e08, 70a04a8) made the reading column one grid item hard against
 * the left gutter, beside a `38vw` photograph. Measured on the shipped build at
 * 1440, the hero's text runs **x = 96…960** — 6.7% to 66.7% of the frame. So
 * `x < 22%` is not an outer third at all: it is the `<h1>`, the role line and
 * the statement, and *lighting* it is the one thing this lane is forbidden to
 * do. `--mist-400` (`#909090`, relative luminance 0.2789) over the brightest
 * fog this shader draws needs the ground held at or below `#2A2A2A` to clear
 * 4.5:1; the scrim alpha the note suggests, 0.72, lands that ground on `#494949`
 * and `--mist-400` on it at **2.82:1** — a WCAG failure, not a fix, and
 * `tests/a11y/text-contrast.spec.ts` TC-CONTRAST-02 would say so.
 *
 * The *quantity* in §4.1(b) is right and is kept verbatim: a 0.06 relative
 * luminance margin between the band the type reads on and a lit band elsewhere
 * in the frame. Only the geometry is taken from the DOM instead of assumed, so
 * the assertion measures the composition that shipped rather than the one the
 * note imagined — and keeps measuring it if the column moves again.
 *
 * ## Why "the brightest tenth" and not "the right-hand third"
 *
 * Because the phone is a different mechanism and the assertion has to hold for
 * both. Below 700 px `.stage::after` is `display: none` and each run of copy
 * carries its own plate; the light is whole behind them, showing in the gutters
 * and between the lines. There is no right-hand third to point at — the copy
 * runs x = 17…373 of 390 — so a test written around one would be a desktop test
 * wearing a mobile viewport. A window of a tenth of the frame's width, taken
 * wherever it is brightest, asks the same question of both layouts: *is there a
 * piece of this frame, of a size a reader would notice, that the type is not
 * standing on and that the scrim did not flatten?*
 *
 * It is also the assertion a flat wash fails. A uniform `0.86` attenuates every
 * column by the same factor, so the brightest window collapses towards the mean
 * under the column: over this shader's own range that leaves about 0.02 between
 * them, and on the reduced-motion still about 0.003. Neither reaches 0.06. The
 * shape is what passes this, not the brightness — which is the point.
 *
 * Both paths are measured because they are two different pictures: `?gl=force`
 * is what a reader with a GPU gets (scrim over shader), and the reduced-motion
 * still is what everyone else gets (scrim over the site's own gradient). A
 * scrim graded correctly for one and flat over the other would be half a fix.
 */

/**
 * The margin, in WCAG relative luminance, between the band the hero's type
 * reads on and the brightest tenth of the frame.
 *
 * 0.06 is the architecture note's own figure (§4.1(b)) and is not re-derived
 * here. What is worth recording is the room it has on the build that ships it,
 * so a later reader can tell a real regression from host noise — measured in
 * this lane's `04-tests-passing.log`: 0.32 at 1440 and 0.23 at 390 on
 * `?gl=force`, 0.088 at 1440 and 0.075 at 390 on the reduced-motion still. The
 * still is the tight one by construction: it has no shader to be bright with,
 * only the site's own gradient, so it is the surface a careless scrim edit
 * breaks first and the reason the still is measured at all.
 */
const SCRIM_MIN_DELTA = 0.06;

/** The fraction of the frame's width the brightest window is measured over. */
const LIT_WINDOW_FRACTION = 0.1;

/** Mean relative luminance of every pixel column of a capture, left to right. */
function columnLuminance(buffer: Buffer): number[] {
  const png = PNG.sync.read(buffer);
  const columns = new Array<number>(png.width).fill(0);
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const o = (y * png.width + x) * 4;
      columns[x] += relativeLuminance(png.data[o], png.data[o + 1], png.data[o + 2]);
    }
  }
  return columns.map((sum) => sum / png.height);
}

/** Mean of a slice of that profile, addressed in fractions of the width. */
function bandMean(columns: number[], fromFraction: number, toFraction: number): number {
  const from = Math.max(0, Math.floor(columns.length * fromFraction));
  const to = Math.min(columns.length, Math.ceil(columns.length * toFraction));
  let sum = 0;
  for (let x = from; x < to; x += 1) sum += columns[x];
  return sum / Math.max(1, to - from);
}

/** The brightest contiguous window of `fraction` of the width, anywhere in it. */
function brightestWindow(
  columns: number[],
  fraction: number,
): { mean: number; centreFraction: number } {
  const width = Math.max(1, Math.round(columns.length * fraction));
  let running = 0;
  for (let x = 0; x < width; x += 1) running += columns[x];
  let best = running;
  let bestStart = 0;
  for (let x = width; x < columns.length; x += 1) {
    running += columns[x] - columns[x - width];
    if (running > best) {
      best = running;
      bestStart = x - width + 1;
    }
  }
  return {
    mean: best / width,
    centreFraction: (bestStart + width / 2) / columns.length,
  };
}

/**
 * The hero's reading column, as fractions of the slot's width — the union of
 * every text node the hero actually renders, read from the live layout rather
 * than assumed from the stylesheet. Leaf nodes only: a wrapper's box is its
 * children's, and counting both would weight the wide ones twice.
 */
async function readingColumnFractions(page: Page, slotWidth: number, slotLeft: number) {
  const bounds = await page.evaluate(() => {
    const hero = document.querySelector('#hero');
    if (!hero) return null;
    const selector = 'h1, h2, p, a, span, li, dt, dd';
    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let count = 0;
    for (const el of hero.querySelectorAll(selector)) {
      if (!(el.textContent ?? '').trim()) continue;
      if (el.querySelector(selector)) continue;
      const rect = el.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) continue;
      minX = Math.min(minX, rect.left);
      maxX = Math.max(maxX, rect.right);
      count += 1;
    }
    return count ? { minX, maxX, count } : null;
  });
  expect(bounds, 'the hero rendered no text to measure a reading column from').not.toBeNull();
  return {
    from: (bounds!.minX - slotLeft) / slotWidth,
    to: (bounds!.maxX - slotLeft) / slotWidth,
    count: bounds!.count,
  };
}

for (const path of [
  { url: '/?gl=force', reducedMotion: 'no-preference' as const, name: 'over the shader' },
  { url: '/', reducedMotion: 'reduce' as const, name: 'over the reduced-motion still' },
]) {
  test.describe(`G-H2b: the hero scrim is a column-bound grade, ${path.name}`, () => {
    test.describe.configure({ timeout: 90000 });

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ] as const) {
      test(`TC-HERO-SCRIM-01 [${viewport.width}${
        path.reducedMotion === 'reduce' ? ', still' : ', gl'
      }]: the light crosses the frame the type does not stand on`, async ({ page }) => {
        await page.setViewportSize(viewport);
        // Set on the page rather than the context: `reducedMotion` as a
        // `test.use` option is context-scoped, and a describe-level copy of it
        // forces Playwright to spin the worker again for the second path.
        await page.emulateMedia({ reducedMotion: path.reducedMotion });
        await page.goto(path.url, { waitUntil: 'domcontentloaded' });

        const slot = heroSlot(page);
        await expect(slot).toBeVisible();

        if (path.reducedMotion === 'reduce') {
          // No canvas is coming — `Scene` withholds every scene under reduced
          // motion — so the only thing to wait for is the stylesheet's own
          // picture. Asserting the absence keeps the measurement honest: if a
          // canvas ever did mount here, this would be photographing the shader
          // and calling it the still.
          await page.waitForTimeout(1200);
          expect(
            await slot.locator('canvas').count(),
            'a canvas mounted under prefers-reduced-motion — this is meant to be the still',
          ).toBe(0);
        } else {
          await expect(slot.locator('canvas')).toHaveCount(1, { timeout: PRIORITY_BUDGET_MS });
          // The shader ramps its fog in; measured before it settles the frame is
          // darker than the one a reader looks at.
          await page.waitForTimeout(2500);
        }

        const box = await slot.boundingBox();
        expect(box, 'the hero slot has no box to photograph').not.toBeNull();

        const column = await readingColumnFractions(page, box!.width, box!.x);
        const columns = columnLuminance(await slot.screenshot());

        const underType = bandMean(columns, column.from, column.to);
        const lit = brightestWindow(columns, LIT_WINDOW_FRACTION);
        const delta = lit.mean - underType;

        console.log(
          `[TC-HERO-SCRIM-01] ${viewport.width}${path.reducedMotion === 'reduce' ? ' still' : ' gl'}: ` +
            `column=${column.from.toFixed(3)}..${column.to.toFixed(3)} (${column.count} nodes) ` +
            `under_type=${underType.toFixed(4)} lit_window=${lit.mean.toFixed(4)} ` +
            `at=${lit.centreFraction.toFixed(3)} delta=${delta.toFixed(4)}`,
        );

        expect(
          delta,
          `the hero scrim is flattening the frame: the brightest tenth of it (${lit.mean.toFixed(
            4,
          )}, centred at ${(lit.centreFraction * 100).toFixed(1)}%) is only ${delta.toFixed(
            4,
          )} above the band the type reads on (${underType.toFixed(4)}), against a ` +
            `${SCRIM_MIN_DELTA} floor — the atmosphere is on screen and cannot be seen`,
        ).toBeGreaterThanOrEqual(SCRIM_MIN_DELTA);

        // And the other half of "column-bound": the type is standing on the
        // dark. A scrim that had drifted off the column — or been deleted —
        // would satisfy the margin above while leaving the copy on the light.
        expect(
          underType,
          `the band under the hero's type measures ${underType.toFixed(4)}, brighter than the ` +
            'brightest tenth of the frame — the scrim is no longer over the reading column',
        ).toBeLessThan(lit.mean);
      });
    }
  });
}
