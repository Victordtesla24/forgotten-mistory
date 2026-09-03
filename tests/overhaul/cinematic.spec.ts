import { test, expect, type Page } from '@playwright/test';

/**
 * Overhaul — Cinematic-Monochrome Design Language
 *
 * These are the R1/R7 (posh, Disney+/Marvel-grade cinematic) acceptance tests.
 * Ref: docs/execution-log OVERHAUL-INC1.
 *
 * The hero rebuild (components/sections/Hero/Hero.tsx + Hero.module.css +
 * HeroAtmosphere.tsx) replaced the INC1 hero stage wholesale. The DOM planes it
 * tested — `.cine-stage`, `.cine-spotlight`, `.cine-vignette`, `.cine-title`,
 * `.hero-title` — no longer render anywhere, so the tests that asserted their
 * existence and their reduced-motion behaviour were deleted outright rather than
 * softened. What replaced them is one decorative `<div aria-hidden>` per hero
 * onto which the shared GL stage scissors a shader scene, so the invariants that
 * genuinely survived — the backdrop is inert, the CTAs are never covered, the
 * name renders unclipped, and reduced motion drops movement without dropping
 * content — are re-asserted here against the new markup.
 *
 * Two consequences of the rebuild shape every test below:
 *
 * 1. **There is no preloader.** components/site/Preloader.tsx is deleted and the
 *    hero is server-rendered, so navigation waits on `#hero` alone. Nothing to
 *    skip, nothing to race.
 * 2. **The hero uses CSS-module hashed class names.** Selecting by class is no
 *    longer stable, so every hero assertion goes through semantics that survive a
 *    rebuild: `#hero`, `#hero h1`, `#hero a[href="#experience"]`, and text.
 *
 * The non-hero cinematic primitives — the frosted-on-scroll nav and the `.beat`
 * letterbox sections — are untouched by the rebuild. The two `.beat` tests were
 * still re-pointed: they had hard-coded `#about` and its "About Me" heading, and
 * that section has since been rewritten out of the `.beat` set. They now assert
 * against whichever section is first to carry the primitive, which is what they
 * were always meant to be testing.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#hero').first().waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(300);
}

test.describe('Overhaul: Cinematic-Monochrome Design Language', () => {
  test.describe.configure({ timeout: 90000 });

  test('TC-CINE-01: the hero backdrop is decorative — hidden from AT and behind the content', async ({
    page,
  }) => {
    await gotoHome(page);

    // Replaces the old `.cine-stage` + spotlight/vignette plane test. The new
    // hero has exactly one backdrop element: the div the shared GL stage
    // scissors its scene onto. The contract is unchanged even though the markup
    // is — the backdrop is never content, never announced, never a hit target.
    const stage = page.locator('#hero > div[aria-hidden="true"]');
    await expect(stage).toHaveCount(1);

    // A backdrop carries no reading matter. If copy ever lands in here it is
    // invisible to a screen reader, which is the failure this guards.
    await expect(stage).toHaveText('');

    // Sits behind the copy in the hero's own stacking context, so the section
    // reads correctly with the scene present, absent, or still loading. The
    // absolute value is the hero's business (it has been both -1 and 0); what
    // must hold is the ordering against the content wrapper beside it.
    const order = await page.evaluate(() => {
      const hero = document.querySelector('#hero');
      const zOf = (el: Element | null) => {
        if (!el) return Number.NaN;
        const raw = getComputedStyle(el).zIndex;
        return raw === 'auto' ? 0 : Number(raw);
      };
      return {
        stage: zOf(hero?.querySelector(':scope > div[aria-hidden="true"]') ?? null),
        content: zOf(hero?.querySelector(':scope > div:not([aria-hidden="true"])') ?? null),
      };
    });
    expect(Number.isNaN(order.stage) || Number.isNaN(order.content)).toBe(false);
    expect(order.stage).toBeLessThan(order.content);
  });

  test('TC-CINE-02: the backdrop never intercepts clicks on the hero CTA', async ({ page }) => {
    await gotoHome(page);
    // The dual `[data-pillar]` CTAs are gone; the hero now offers one primary
    // action into the evidence and one CV download. The invariant is the one
    // that always mattered: whatever is painted behind the copy must not steal
    // the click.
    const cta = page.locator('#hero a[href="#experience"]');
    await expect(cta).toBeVisible();
    const hit = await cta.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return top?.closest('#hero a[href="#experience"]') ? 'cta' : (top?.className ?? 'other');
    });
    expect(hit).toBe('cta');
  });

  test('TC-CINE-03: nav is transparent at top and frosts (data-scrolled) after scroll', async ({ page }) => {
    await gotoHome(page);
    const nav = page.locator('nav').first();
    await expect(nav).not.toHaveAttribute('data-scrolled', 'true');

    await page.evaluate(() => window.scrollTo(0, 600));
    await expect(nav).toHaveAttribute('data-scrolled', 'true');

    // Once scrolled a frosted near-black wash appears (no longer fully
    // transparent). It arrives on a CSS transition, so sampling the computed
    // colour the instant the attribute flips reads the transparent start value —
    // poll it instead. Without the preloader the page reaches this point fast
    // enough that the single sample this used to take lost the race.
    await expect
      .poll(async () => nav.evaluate((el) => getComputedStyle(el).backgroundColor), {
        timeout: 5000,
      })
      .not.toBe('rgba(0, 0, 0, 0)');

    const bg = await nav.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).not.toBe('transparent');
  });

  test('TC-CINE-04: :root publishes an achromatic --spot-x/--spot-y spotlight anchor', async ({ page }) => {
    await gotoHome(page);
    // The hero god-ray plane that consumed this anchor was removed with the hero
    // rebuild, but the tokens themselves are still declared on `:root` in
    // globals.css and still published (eased, in a rAF) by CursorGlow, which is
    // mounted page-wide. The contract under test is that the anchor is always
    // defined — a consumer reading it can never compose an invalid gradient,
    // including on touch/no-JS where the pointer never moves.
    const vars = await page.evaluate(() => {
      const s = getComputedStyle(document.documentElement);
      return { x: s.getPropertyValue('--spot-x').trim(), y: s.getPropertyValue('--spot-y').trim() };
    });
    expect(vars.x).not.toBe('');
    expect(vars.y).not.toBe('');
  });

  test('TC-CINE-05: the hero name renders in full with no glyph-masking clip-path (D-NAME-01)', async ({ page }) => {
    await gotoHome(page);
    // D-NAME-01 is the regression this suite exists to prevent: a mask or wipe on
    // the name element that clips the last glyphs ("Vikr"). The element moved from
    // `.hero-title .reveal-text` to the hero's `<h1 id="hero-name">`, and the
    // entrance moved from framer-motion to a pure CSS opacity/translate rise —
    // but the contract is identical, so it is re-pointed rather than dropped.
    const name = page.locator('#hero h1');
    await expect(name).toHaveText('Vikram Deshpande');
    const clip = await name.evaluate((el) => getComputedStyle(el).clipPath);
    const c = (clip || 'none').toLowerCase();
    expect(c === 'none' || (c.includes('inset(0') && (c.includes('0%') || c.includes('0px')))).toBeTruthy();
  });

  test('TC-CINE-06: under reduced motion the hero entrance is a fade, not a rise', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);

    // Replaces the old spotlight-is-static assertion, which lost its subject with
    // the `.cine-spotlight` plane. The equivalent contract on the new hero is that
    // the `heroRise` entrance (opacity + 14px translate) swaps for `heroFade`
    // (opacity only), and the site-wide guard in globals.css collapses its
    // duration to ~0 — so the copy is present and still, never animating in.
    const name = page.locator('#hero h1');
    await expect(name).toBeVisible();

    const entrance = await name.evaluate((el) => {
      const s = getComputedStyle(el);
      const first = (s.animationDuration.split(',')[0] || '').trim();
      let ms = parseFloat(first) || 0;
      if (first.endsWith('ms')) ms = parseFloat(first);
      else if (first.endsWith('s')) ms = parseFloat(first) * 1000;
      return { name: s.animationName, durationMs: ms };
    });

    // CSS Modules hashes the keyframe name (e.g. `Hero_heroFade__GnbNG`), so match
    // on the stem rather than the build-specific hash.
    expect(entrance.name).toMatch(/heroFade/);
    expect(entrance.durationMs).toBeLessThan(20);
  });

  test('TC-CINE-07: content sections use the .beat letterbox primitive and JS arms it', async ({ page }) => {
    await gotoHome(page);
    const beats = page.locator('section.beat');
    expect(await beats.count()).toBeGreaterThanOrEqual(5);
    // SectionBeats sets the progressive-enhancement flag on <html> once armed.
    await expect(page.locator('html')).toHaveAttribute('data-beats-armed', 'true');
  });

  // TC-CINE-08/09 used to pin themselves to `#about` and its "About Me" heading.
  // The section rewrite moved that heading and dropped `#about` from the `.beat`
  // set, which broke both tests for a reason that has nothing to do with the
  // primitive they exist to protect. They now take the first `.beat` section
  // there is and assert the primitive's own contract, so they survive the copy
  // and markup of any one section changing.
  test('TC-CINE-08: a beat section reveals (data-inview) when scrolled into view', async ({ page }) => {
    await gotoHome(page);
    const beat = page.locator('section.beat').first();
    await beat.scrollIntoViewIfNeeded();
    await expect(beat).toHaveAttribute('data-inview', 'true');
    // Letterbox bars are decorative — content is never trapped behind them.
    await expect(beat.locator('h2').first()).toBeVisible();
  });

  test('TC-CINE-09: under reduced motion beat curtains render open (content visible)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    const beat = page.locator('section.beat').first();
    await beat.scrollIntoViewIfNeeded();
    await expect(beat).toBeVisible();
    // With the curtain animation suppressed the section must still be readable,
    // not left behind a bar that never opened.
    await expect(beat.locator('h2').first()).toBeVisible();
  });
});
