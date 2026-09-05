import { test, expect, type Page } from '@playwright/test';

/**
 * Hero — the front door.
 *
 * The hero was rebuilt in 2026-09 against two hard rules, and this file exists
 * to hold both of them:
 *
 *  1. Nothing above the fold waits on JavaScript. The previous hero
 *     server-rendered its content at `opacity: 0` and let framer-motion reveal
 *     it after hydration, so a cold production load showed a preloader overlay
 *     for four to eight seconds while a 450 kB bundle parsed. The preloader is
 *     gone and the entrance is a pure CSS animation.
 *  2. Every figure carries its provenance. A number without a source is a
 *     boast, and this site's whole register is evidence over adjectives.
 *
 * Selectors are semantic (`#hero h1`, `#hero ul li`, hrefs) rather than
 * class-based: the hero styles itself through a CSS module whose class names
 * are hashed at build time.
 */

const HERO = '#hero';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator(HERO).waitFor({ state: 'visible', timeout: 15000 });
});

test.describe('Hero', () => {
  test('TC-HERO-01: the name is the page h1', async ({ page }) => {
    const name = page.locator(`${HERO} h1`);
    await expect(name).toBeVisible();
    await expect(name).toHaveText('Vikram Deshpande');
    // Exactly one h1 on the document: the hero owns the top of the outline.
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('TC-HERO-02: positioning, location and one-sentence statement render', async ({ page }) => {
    const hero = page.locator(HERO);
    await expect(hero).toContainText('Delivery leadership');
    await expect(hero).toContainText('AI solutions architecture');
    await expect(hero).toContainText('Melbourne, Australia');
    await expect(hero).toContainText('Australian Taxation Office');
  });

  test('TC-HERO-03: the statement stays within its word budget', async ({ page }) => {
    // The old hero ran to roughly 150 words above the fold. The rebuild caps
    // the prose at a single sentence; this guard is what stops it creeping back.
    const statement = await page.locator(`${HERO} p`).nth(2).innerText();
    const words = statement.trim().split(/\s+/).length;
    expect(words).toBeLessThanOrEqual(35);
  });

  test('TC-HERO-04: the ledger shows three figures, each with its source', async ({ page }) => {
    const entries = page.locator(`${HERO} ul li`);
    await expect(entries).toHaveCount(3);

    const hero = page.locator(HERO);
    await expect(hero).toContainText('≈92%');
    await expect(hero).toContainText('$5M+');
    await expect(hero).toContainText('10k+');

    // Provenance, not decoration: each figure names where it comes from.
    await expect(hero).toContainText('ATO Payday Super');
    await expect(hero).toContainText('ANZ');
  });

  test('TC-HERO-05: both actions are present and reachable', async ({ page }) => {
    const evidence = page.locator(`${HERO} a[href="#experience"]`);
    await expect(evidence).toBeVisible();
    await expect(evidence).toContainText('See the evidence');

    const cv = page.locator(`${HERO} a[href$=".pdf"]`);
    await expect(cv).toBeVisible();
    await expect(cv).toContainText('Download CV');
    await expect(cv).toHaveAttribute('download', '');
  });

  test('TC-HERO-06: recruiter channels are linked', async ({ page }) => {
    await expect(
      page.locator(`${HERO} a[href*="linkedin.com/in/vikramd-profile"]`),
    ).toBeVisible();
    await expect(page.locator(`${HERO} a[href*="github.com/Victordtesla24"]`)).toBeVisible();
    await expect(page.locator(`${HERO} a[href^="mailto:"]`)).toBeVisible();
  });

  test('TC-HERO-07: a truthful availability signal is shown', async ({ page }) => {
    await expect(page.locator(HERO)).toContainText(
      'Open to delivery-leadership and AI engagements',
    );
  });

  test('TC-HERO-08: the hero fills the first viewport without overflowing it', async ({ page }) => {
    const box = await page.locator(HERO).boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    // One screen, not two. The tolerance is 1.10 rather than 1.05 because the
    // overshoot on a short viewport is the section's bottom padding, not
    // content — TC-HERO-09 below is the assertion that actually guarantees
    // every meaningful element sits above the fold, and it measures elements
    // rather than the section box.
    expect(box!.height).toBeGreaterThanOrEqual(viewport!.height * 0.9);
    expect(box!.height).toBeLessThanOrEqual(viewport!.height * 1.1);
  });

  test('TC-HERO-09: the whole hero is legible in the first viewport', async ({ page }) => {
    // Every element that carries meaning must sit above the fold — a recruiter
    // scanning for five seconds never scrolls.
    const viewport = page.viewportSize()!;
    for (const selector of [
      `${HERO} h1`,
      `${HERO} ul li`,
      `${HERO} a[href="#experience"]`,
      `${HERO} a[href$=".pdf"]`,
    ]) {
      const box = await page.locator(selector).first().boundingBox();
      expect(box, selector).not.toBeNull();
      expect(box!.y + box!.height, selector).toBeLessThanOrEqual(viewport.height);
    }
  });

  test('TC-HERO-10: the preloader is gone', async ({ page }) => {
    // It used to hold the viewport for ~1.9 s in front of a page that paints in
    // well under a second. Its removal is the point, so it is worth pinning.
    await expect(page.locator('.preloader')).toHaveCount(0);
  });

  test('TC-HERO-11: the hero holds at most one WebGL context', async ({ page }) => {
    // Headless runs on a software renderer, which components/gl/useGLCapability
    // declines — so zero canvases here is the expected result, not a failure.
    // What must never happen is the hero mounting more than one: the old design
    // let seventeen components each mint their own, and production logged
    // THREE.WebGLRenderer: Context Lost on every load.
    await page.waitForTimeout(1500);
    const canvases = await page.locator(`${HERO} canvas`).count();
    expect(canvases).toBeLessThanOrEqual(1);
  });
});

/* -------------------------------------------------------------------------- */
/* Hero portrait — run v9-20260904T2312Z, cycle 4.                             */
/*                                                                            */
/* Binding spec: docs/delivery/evidence/v9-20260904T2312Z/B-research/          */
/* 02-hero-avatar-placement.md §4 "Recommendation — P1" → "Playwright guards". */
/*                                                                            */
/* The portrait is a <figure data-testid="hero-portrait"> placed after the    */
/* statement and before the ledger: a <picture> poster (AVIF → WebP → PNG)    */
/* with a silent <video> layered above it. The video ships with no `src` and  */
/* no `autoplay`; a JS gate assigns the source only at ≥720 px, without       */
/* prefers-reduced-motion, without saveData, after `load` + idle, once the   */
/* figure is ≥25 % in view. Both layers sit under one                         */
/* `filter: grayscale(1) contrast(1.04)` — the frames are warm sunset colour  */
/* and gold on this site means "this figure has a source" (prime directive 4).*/
/* MONO-04 reads computed CSS, not pixels, so it cannot see a colour video;   */
/* TC-HERO-18 is the guard that can.                                          */
/*                                                                            */
/* TC-HERO-01…11 above are untouched; TC-HERO-03 still reads `#hero p`        */
/* nth(2) (the figure carries a <figcaption>, never a <p>) and TC-HERO-04     */
/* still counts exactly three `#hero ul li`.                                  */
/* -------------------------------------------------------------------------- */

const PORTRAIT = '[data-testid="hero-portrait"]';
const PORTRAIT_IMG = `${PORTRAIT} img`;
const PORTRAIT_VIDEO = `${PORTRAIT} video`;
const PORTRAIT_TOGGLE = `${PORTRAIT} button[aria-pressed]`;
const PORTRAIT_ALT = 'Portrait of Vikram Deshpande';
const HERO_LOOP = 'my-hero-avatar.mp4';

/**
 * The gate runs after `load` → requestIdleCallback (1200 ms fallback) →
 * IntersectionObserver. 2.5 s after `load` is the spec's settling window: by
 * then the src is assigned and, where the renderer decodes H.264, the loop is
 * playing and the 600 ms crossfade has completed.
 */
const GATE_SETTLE_MS = 2500;

/** Parses a computed colour into an RGB triple, or null for `none`/keywords. */
function parseRgb(value: string): [number, number, number] | null {
  const m = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** Verbatim from scripts/validate/overhaul_static_audit.mjs::checkMono. */
function isChromatic([r, g, b]: [number, number, number]): boolean {
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  if (mx <= 24) return false; // near-black: hue is imperceptible
  return (mx - mn) / mx > 0.28;
}

/**
 * Copied verbatim from tests/monochrome/monochrome.spec.ts::chromaticOffenders.
 * It cannot be imported: that file is a spec, and importing a spec from a spec
 * would register the whole monochrome suite a second time under this file.
 * The predicate is the audit's own arithmetic so the three gates cannot drift.
 *
 * `accents` is the allow-list. The site-wide checks pass the four golds; the
 * portrait passes an EMPTY list — spec §4 "Monochrome": no gold border, ring or
 * caption anywhere in the figure, because gold means "sourced" and a portrait
 * is not a sourced figure.
 */
async function chromaticOffenders(page: Page, scope: string, accents: string[]): Promise<string[]> {
  return page.evaluate(
    ({ scope: selector, accents: allowed, properties }) => {
      const allowedSet = new Set(allowed);

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

      const roots = Array.from(document.querySelectorAll(selector));
      const elements = roots.flatMap((root) => [root, ...Array.from(root.querySelectorAll('*'))]);

      const hits = new Set<string>();
      for (const el of elements) {
        const cs = getComputedStyle(el as Element) as unknown as Record<string, string>;
        for (const property of properties) {
          const raw = cs[property];
          if (!raw || raw === 'none') continue;
          const rgb = parse(raw);
          if (!rgb) continue;
          if (allowedSet.has(rgb.join(','))) continue;
          if (!chromatic(rgb)) continue;
          const name = (el as Element).tagName.toLowerCase();
          const cls = String((el as HTMLElement).className ?? '').slice(0, 40);
          hits.add(`${name}${cls ? `.${cls}` : ''} ${property}=${raw}`);
        }
      }
      return Array.from(hits);
    },
    {
      scope,
      accents,
      properties: [
        'color',
        'backgroundColor',
        'borderTopColor',
        'borderRightColor',
        'borderBottomColor',
        'borderLeftColor',
        'outlineColor',
        'textDecorationColor',
        'columnRuleColor',
        'caretColor',
        'fill',
        'stroke',
      ],
    },
  );
}

/** Reads the loop's playback state in one round trip. */
async function loopState(page: Page) {
  return page.locator(PORTRAIT_VIDEO).first().evaluate((el) => {
    const v = el as HTMLVideoElement;
    return {
      src: v.currentSrc || v.src,
      srcAttribute: v.getAttribute('src'),
      paused: v.paused,
      currentTime: v.currentTime,
      videoWidth: v.videoWidth,
      opacity: Number.parseFloat(getComputedStyle(v).opacity),
    };
  });
}

test.describe('Hero portrait', () => {
  test('TC-HERO-12: the poster is eager, AVIF, correctly named, and never faded in', async ({ page }) => {
    // Measured inside the page on the first frame the hero has a box, and
    // again 200 ms later, so the reading does not depend on harness latency.
    // The poster must never take the heroRise opacity entrance: Chrome does
    // not consider an opacity-0 element an LCP candidate, and the <img> is the
    // intended LCP element at 1280×720 (spec §4 "Poster").
    await page.addInitScript(() => {
      const probe = new Promise<{ at0: number; at200: number }>((resolve) => {
        const read = () => {
          const img = document.querySelector('[data-testid="hero-portrait"] img');
          return img ? Number.parseFloat(getComputedStyle(img).opacity) : Number.NaN;
        };
        const deadline = setTimeout(() => resolve({ at0: Number.NaN, at200: Number.NaN }), 15000);
        const tick = () => {
          const hero = document.getElementById('hero');
          if (hero && hero.getBoundingClientRect().height > 0) {
            const at0 = read();
            setTimeout(() => {
              clearTimeout(deadline);
              resolve({ at0, at200: read() });
            }, 200);
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
      (window as unknown as { __portraitOpacityProbe: typeof probe }).__portraitOpacityProbe = probe;
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator(HERO).waitFor({ state: 'visible', timeout: 15000 });

    const probe = await page.evaluate(
      () =>
        (window as unknown as { __portraitOpacityProbe: Promise<{ at0: number; at200: number }> })
          .__portraitOpacityProbe,
    );
    expect(probe.at0, 'poster opacity on the first frame the hero is visible').toBeGreaterThanOrEqual(0.99);
    expect(probe.at200, 'poster opacity 200 ms after the hero is visible').toBeGreaterThanOrEqual(0.99);

    const img = page.locator(PORTRAIT_IMG);
    await expect(img).toHaveCount(1);
    await expect(img).toBeVisible();
    await expect(img).toHaveAttribute('alt', PORTRAIT_ALT);
    await expect
      .poll(() => img.evaluate((el) => (el as HTMLImageElement).naturalWidth), {
        message: 'the poster decoded (naturalWidth > 0)',
      })
      .toBeGreaterThan(0);
    // Chromium negotiates AVIF from the <picture>; WebP and PNG are fallbacks
    // for browsers that cannot, so the served source here must be the AVIF.
    const currentSrc = await img.evaluate((el) => (el as HTMLImageElement).currentSrc);
    expect(currentSrc, 'Chromium picks the AVIF source').toMatch(/\.avif$/);
  });

  test('TC-HERO-13: the loop is silent, deferred, and starts only through the gate', async ({ page }) => {
    // `src` is read at DOMContentLoaded from inside the page, before the gate
    // can possibly have run (it waits for `load`, then idle).
    await page.addInitScript(() => {
      document.addEventListener('DOMContentLoaded', () => {
        const v = document.querySelector('[data-testid="hero-portrait"] video') as HTMLVideoElement | null;
        (window as unknown as { __srcAtDCL: unknown }).__srcAtDCL = v
          ? { found: true, attribute: v.getAttribute('src'), property: v.src }
          : { found: false, attribute: null, property: '' };
      });
    });
    await page.goto('/', { waitUntil: 'load' });

    const video = page.locator(PORTRAIT_VIDEO);
    expect(await video.count(), 'exactly one <video> in the figure').toBe(1);

    const atDcl = await page.evaluate(
      () =>
        (window as unknown as { __srcAtDCL: { found: boolean; attribute: string | null; property: string } })
          .__srcAtDCL,
    );
    expect(atDcl.found, 'the <video> is server-rendered').toBe(true);
    expect(atDcl.attribute, 'no src attribute at DOMContentLoaded').toBeNull();
    expect(atDcl.property, 'no src property at DOMContentLoaded').toBe('');

    const attrs = await video.evaluate((el) => {
      const v = el as HTMLVideoElement;
      return {
        // React may not serialise the `muted` boolean into SSR HTML (facebook/
        // react#10389), so the property is the truth, not the attribute — the
        // component sets `video.muted = true` imperatively before play().
        muted: v.muted,
        loop: v.hasAttribute('loop'),
        playsInline: v.hasAttribute('playsinline'),
        preload: v.getAttribute('preload'),
        ariaHidden: v.getAttribute('aria-hidden'),
        tabIndex: v.tabIndex,
        autoplay: v.hasAttribute('autoplay'),
        controls: v.hasAttribute('controls'),
      };
    });
    expect(attrs.muted, 'muted').toBe(true);
    expect(attrs.loop, 'loop').toBe(true);
    expect(attrs.playsInline, 'playsinline').toBe(true);
    expect(attrs.preload, 'preload="none"').toBe('none');
    expect(attrs.ariaHidden, 'aria-hidden="true"').toBe('true');
    expect(attrs.tabIndex, 'tabindex=-1').toBe(-1);
    expect(attrs.autoplay, 'no autoplay attribute — the gate is the only starter').toBe(false);
    expect(attrs.controls, 'no controls — the pause button is the control').toBe(false);

    // After load + settle: the gate assigned the source and started playback.
    await page.waitForTimeout(GATE_SETTLE_MS);
    const afterGate = await loopState(page);
    expect(afterGate.src, `src ends with ${HERO_LOOP}`).toMatch(/my-hero-avatar\.mp4$/);

    // Playback. Muted autoplay is allowed by Chrome unconditionally
    // (developer.chrome.com/blog/autoplay) and the local project runs the
    // `chrome` channel, which carries the H.264 decoder. If a CI software
    // renderer ever refuses, the spec's escape hatch is to launch this spec
    // with `--autoplay-policy=no-user-gesture-required` — not to weaken the
    // assertion: a loop that never reaches currentTime > 0.04 never crossfades.
    await expect
      .poll(
        async () => {
          const s = await loopState(page);
          return !s.paused && s.currentTime > 0.04 && s.videoWidth > 0;
        },
        { timeout: 6000, message: 'the loop is playing (not paused, currentTime > 0.04, videoWidth > 0)' },
      )
      .toBe(true);
    await expect
      .poll(async () => (await loopState(page)).opacity, {
        timeout: 3000,
        message: 'the video layer crossfaded in over the poster',
      })
      .toBeGreaterThan(0.9);
  });

  test('TC-HERO-14: reduced motion is poster only — no source, no request, no button', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const loopRequests: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes(HERO_LOOP)) loopRequests.push(request.url());
    });
    await page.goto('/', { waitUntil: 'load' });
    await page.locator(HERO).waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(4000);

    expect(loopRequests, 'no request for the loop within 4 s').toEqual([]);
    const fetched = await page.evaluate(
      (name) => performance.getEntriesByType('resource').filter((r) => r.name.includes(name)).length,
      HERO_LOOP,
    );
    expect(fetched, 'no resource-timing entry for the loop').toBe(0);

    const figure = page.locator(PORTRAIT);
    await expect(figure).toHaveCount(1);
    const img = page.locator(PORTRAIT_IMG);
    await expect(img).toBeVisible();
    expect(await img.evaluate((el) => Number.parseFloat(getComputedStyle(el).opacity))).toBeGreaterThanOrEqual(
      0.99,
    );

    // The video may be omitted or present-but-hidden under reduced motion;
    // either way it must carry no source.
    const sources = await page.locator(PORTRAIT_VIDEO).evaluateAll((els) =>
      els.map((el) => ({ attribute: el.getAttribute('src'), property: (el as HTMLVideoElement).src })),
    );
    for (const s of sources) {
      expect(s.attribute, 'no src attribute under reduced motion').toBeNull();
      expect(s.property, 'no src property under reduced motion').toBe('');
    }
    await expect(page.locator(PORTRAIT_TOGGLE)).toHaveCount(0);
  });

  test('TC-HERO-15: the crossfade moves nothing — the figure box holds and CLS stays under budget', async ({ page }) => {
    const figure = page.locator(PORTRAIT);
    const before = await figure.boundingBox();
    expect(before, 'the figure is laid out before the loop starts').not.toBeNull();

    await page.waitForLoadState('load');
    // Wait for `playing` (or, if the renderer declines, the full gate window)
    // so the "after" reading is taken once the video layer is at opacity 1.
    await page
      .waitForFunction(
        (selector) => {
          const v = document.querySelector(selector) as HTMLVideoElement | null;
          return !!v && !v.paused && v.currentTime > 0.04;
        },
        PORTRAIT_VIDEO,
        { timeout: GATE_SETTLE_MS + 4000 },
      )
      .catch(() => undefined);
    await page.waitForTimeout(700); // the 600 ms crossfade

    const after = await figure.boundingBox();
    expect(after).not.toBeNull();
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(Math.abs(after![key] - before![key]), `figure ${key} unchanged across the crossfade`).toBeLessThanOrEqual(
        1,
      );
    }

    const cls = await page.evaluate(
      () =>
        new Promise<number>((resolve) => {
          let value = 0;
          new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
              if (!shift.hadRecentInput) value += shift.value || 0;
            }
          }).observe({ type: 'layout-shift', buffered: true });
          setTimeout(() => resolve(value), 1000);
        }),
    );
    expect(cls, 'CLS (PERF-03 budget)').toBeLessThan(0.05);
  });

  test('TC-HERO-16: a failed loop leaves the poster in place and throws nothing', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.route(`**/${HERO_LOOP}`, (route) => route.abort());
    await page.goto('/', { waitUntil: 'load' });
    await page.locator(HERO).waitFor({ state: 'visible', timeout: 15000 });
    await page.waitForTimeout(GATE_SETTLE_MS + 1000);

    const img = page.locator(PORTRAIT_IMG);
    await expect(img).toBeVisible();
    expect(await img.evaluate((el) => Number.parseFloat(getComputedStyle(el).opacity))).toBeGreaterThanOrEqual(
      0.99,
    );

    const video = page.locator(PORTRAIT_VIDEO);
    expect(await video.count(), 'the <video> is present at 1280×720').toBe(1);
    const state = await loopState(page);
    expect(state.opacity, 'video layer stays at (or returns to) opacity 0 when the source fails').toBeLessThanOrEqual(
      0.05,
    );

    const critical = errors.filter((e) => !e.includes('ResizeObserver loop'));
    expect(critical, `page errors with the loop aborted:\n${critical.join('\n')}`).toHaveLength(0);
  });

  test('TC-HERO-17: the pause button is keyboard-operable and its focus ring is achromatic', async ({ page }) => {
    await page.waitForLoadState('load');
    await page.waitForTimeout(GATE_SETTLE_MS);

    const toggle = page.locator(PORTRAIT_TOGGLE);
    expect(await toggle.count(), 'one pause/play button with aria-pressed').toBe(1);
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveAttribute('aria-label', 'Pause the portrait');

    // Tab from the top of the document. The figure sits after the statement
    // and before the ledger, so the button is a handful of stops in.
    await page.evaluate(() => {
      (document.activeElement as HTMLElement | null)?.blur();
      window.scrollTo(0, 0);
    });
    let reached = false;
    for (let i = 0; i < 60 && !reached; i += 1) {
      await page.keyboard.press('Tab');
      reached = await toggle.evaluate((el) => el === document.activeElement);
    }
    expect(reached, 'Tab reaches button[aria-pressed]').toBe(true);

    // Enter pauses. A user pause is the reader's decision (WCAG 2.2.2).
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await expect(toggle).toHaveAttribute('aria-label', 'Play the portrait');
    await expect.poll(async () => (await loopState(page)).paused, { message: 'video.paused after Enter' }).toBe(true);

    // Space toggles back.
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle).toHaveAttribute('aria-label', 'Pause the portrait');

    // Keyboard focus is :focus-visible in Chromium; the ring must be drawn and
    // must be white/grey, never gold — gold is reserved for sourced figures.
    const ring = await toggle.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        focusVisible: el.matches(':focus-visible'),
        outlineStyle: cs.outlineStyle,
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
      };
    });
    expect(ring.focusVisible, 'button is :focus-visible after keyboard focus').toBe(true);
    expect(ring.outlineStyle, 'a focus outline is drawn').not.toBe('none');
    expect(Number.parseFloat(ring.outlineWidth), 'outline width').toBeGreaterThan(0);
    const rgb = parseRgb(ring.outlineColor);
    expect(rgb, `outline colour parses: ${ring.outlineColor}`).not.toBeNull();
    expect(isChromatic(rgb!), `focus outline is achromatic: ${ring.outlineColor}`).toBe(false);

    // Button hit area ≥ 40×40 (spec §4 "Keyboard and a11y").
    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(40);
    expect(box!.height).toBeGreaterThanOrEqual(40);
  });

  test('TC-HERO-18: both layers are grayscale and nothing in the figure is chromatic', async ({ page }) => {
    await page.waitForLoadState('load');
    await page.waitForTimeout(GATE_SETTLE_MS);

    // `.portraitMedia` is a hashed CSS-module class, so it is addressed
    // structurally: the wrapper is the parent of the <picture>, and it is the
    // one element that carries the filter for both the still and the video.
    const wrapper = page.locator(`${PORTRAIT} picture`).locator('..');
    expect(await wrapper.count(), 'the <picture> has a wrapper (.portraitMedia)').toBe(1);
    const filter = await wrapper.evaluate((el) => getComputedStyle(el).filter);
    expect(filter, 'computed filter on .portraitMedia').toContain('grayscale(1)');

    // The video must be inside that same wrapper so one filter covers both.
    const videoInsideWrapper = await wrapper.evaluate((el) => !!el.querySelector('video'));
    expect(videoInsideWrapper, '<video> shares the filtered wrapper with the poster').toBe(true);

    // Empty allow-list: not even the sanctioned golds are permitted here.
    const offenders = await chromaticOffenders(page, PORTRAIT, []);
    expect(offenders, `chromatic colours inside the figure:\n${offenders.join('\n')}`).toEqual([]);
  });

  test('TC-HERO-19: eager image weight ≤ 500 kB and the loop is fetched only after load', async ({ page }) => {
    await page.waitForLoadState('load');
    await page.waitForTimeout(GATE_SETTLE_MS + 500);

    const timing = await page.evaluate((loopName) => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const loadEventEnd = nav?.loadEventEnd ?? 0;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const isImage = (r: PerformanceResourceTiming) => {
        const path = new URL(r.name).pathname;
        return path.startsWith('/assets/') && /\.(avif|webp|png|jpe?g|gif|svg)$/i.test(path);
      };
      const eagerImages = resources.filter((r) => isImage(r) && r.responseEnd <= loadEventEnd);
      const loop = resources.find((r) => r.name.includes(loopName));
      return {
        loadEventEnd,
        eagerImageBytes: eagerImages.reduce((sum, r) => sum + (r.transferSize || r.encodedBodySize), 0),
        eagerImages: eagerImages.map((r) => `${new URL(r.name).pathname} ${r.transferSize || r.encodedBodySize} B`),
        loop: loop ? { requestStart: loop.requestStart || loop.startTime, startTime: loop.startTime } : null,
      };
    }, HERO_LOOP);

    expect(timing.loadEventEnd, 'navigation timing reports loadEventEnd').toBeGreaterThan(0);
    expect(
      timing.eagerImageBytes,
      `image bytes under /assets/ transferred before load:\n${timing.eagerImages.join('\n')}`,
    ).toBeLessThanOrEqual(500_000);
    expect(timing.loop, 'the loop was requested by the gate').not.toBeNull();
    expect(timing.loop!.requestStart, 'the loop request starts after loadEventEnd').toBeGreaterThan(
      timing.loadEventEnd,
    );
  });

  test('TC-HERO-20: the LCP element is the poster or the h1, inside 2.5 s, at 1280×720', async ({ page }) => {
    expect(page.viewportSize(), 'the single project is Desktop Chrome 1280×720').toEqual({ width: 1280, height: 720 });
    await page.waitForLoadState('load');
    await page.waitForTimeout(1500);

    const lcp = await page.evaluate(
      () =>
        new Promise<{ tag: string | null; startTime: number } | null>((resolve) => {
          let last: { tag: string | null; startTime: number } | null = null;
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const entry = entries[entries.length - 1] as PerformanceEntry & { element?: Element | null };
            if (entry) last = { tag: entry.element?.tagName ?? null, startTime: entry.startTime };
          }).observe({ type: 'largest-contentful-paint', buffered: true });
          setTimeout(() => resolve(last), 1000);
        }),
    );
    expect(lcp, 'an LCP entry was emitted').not.toBeNull();
    console.log(`Hero LCP: ${lcp!.tag} at ${lcp!.startTime.toFixed(0)} ms`);
    expect(['IMG', 'H1'], `LCP element tag: ${lcp!.tag}`).toContain(lcp!.tag);
    expect(lcp!.startTime).toBeLessThanOrEqual(2500);
  });

  test.describe('at 390×844', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('TC-HERO-21: below 720 px the portrait is an 88 px poster stamp with no video', async ({ page }) => {
      // The gate never assigns a source below 720 px and the stamp carries no
      // <video> at all — a phone does not run a decoder for an 88 px face.
      await page.waitForTimeout(3000);

      const figure = page.locator(PORTRAIT);
      const box = await figure.boundingBox();
      expect(box, 'the figure is laid out at 390 px').not.toBeNull();
      expect(box!.width, 'stamp width').toBeLessThanOrEqual(96);
      expect(box!.height, 'stamp height').toBeLessThanOrEqual(96);

      const eyebrow = await page.locator(`${HERO} p`).first().boundingBox();
      expect(eyebrow, 'the eyebrow is the first paragraph').not.toBeNull();
      expect(box!.y, 'stamp top sits at or above the eyebrow bottom').toBeLessThanOrEqual(
        eyebrow!.y + eyebrow!.height,
      );

      await expect(page.locator(PORTRAIT_IMG)).toBeVisible();
      expect(await page.locator(`${HERO} video`).count(), 'no <video> in the hero below 720 px').toBe(0);
    });
  });
});
