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
 * outright, and that is the right shape for it. When this lane ran, it measured
 * something else: `app/loading.tsx` put the whole route behind a Suspense
 * boundary, so the export shipped the page's real markup inside a `<div hidden>`
 * and swapped it in with React's inline streaming script. Probed at 1440 with
 * `javaScriptEnabled: false`, `#hero` measured 0×0 and the only thing on screen
 * was the shell's "Loading portfolio" (this lane's `01-js-blocked-shell.log`).
 * That was a route-level defect in a file this lane did not own, so it was filed
 * as `t_nojs01` rather than fixed blind next to a concurrent hero lane; the
 * boundary has since been deleted, and `tests/e2e/no-js.spec.ts` now holds the
 * script-disabled guarantee for the whole page — the hero's name, role,
 * statement, actions and photograph, and all six section headings, painted with
 * script off at 1440 and 390.
 *
 * This file still blocks the WebGL chunk rather than disabling script, because
 * that is the property actually under test here: the slot with no canvas in it,
 * on the code path a reader with no GPU or reduced motion is already served.
 * Disabling script would also disable the scene's own mount, which is the thing
 * whose absence the poster has to survive. Part (a) below keeps the "out of the
 * static HTML" half honest by reading the served bytes directly.
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
 * 2215–3369 ms while `app/loading.tsx`'s height reservation was in place, which
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
