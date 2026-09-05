import { test, expect, type Page } from '@playwright/test';
import { settleBoot } from '../helpers/boot';

/**
 * Overhaul — cinematic-monochrome design language, as the rebuilt page states it.
 *
 * These are the R1/R7 acceptance tests. The hero rebuild replaced the INC1 hero
 * stage wholesale: `.cine-stage`, `.cine-spotlight`, `.cine-vignette`,
 * `.cine-title` and `.hero-title` render nowhere, so the tests that asserted
 * their existence were deleted rather than softened. What replaced them is one
 * decorative `<div aria-hidden>` per section onto which the shared GL stage
 * mounts a shader scene, and the invariants that genuinely survived — the
 * backdrop is inert, the CTA is never covered, the name renders unclipped, and
 * reduced motion drops movement without dropping content — are re-asserted here
 * against the new markup.
 *
 * Three tests were retired outright in this pass:
 *
 *   - TC-CINE-04 asserted that `:root` publishes `--spot-x`/`--spot-y`. The
 *     tokens are still declared in `app/globals.css`, but the god-ray plane
 *     that consumed them and the `CursorGlow` component that eased them are
 *     both deleted, so the check guarded a value nothing reads and nothing
 *     writes. Passing told us nothing.
 *   - TC-CINE-07/08/09 were built on the `.beat` letterbox primitive and the
 *     `data-beats-armed` flag `SectionBeats` set on `<html>`. That primitive was
 *     removed from the site entirely — `section.beat` matches zero elements —
 *     so the threshold was not lowered from five, it was retired: there is no
 *     letterbox to arm. What TC-CINE-08/09 were really protecting, though, is
 *     that a decorative reveal must never leave content trapped behind it, and
 *     that is a live risk for every section on the page. TC-CINE-07 below is
 *     that invariant, restated against the six sections that exist.
 *
 * The hero uses CSS-module hashed class names, so every hero assertion goes
 * through semantics that survive a rebuild: `#hero`, `#hero h1`,
 * `#hero a[href="#experience"]`, and text.
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
    // hero has exactly one backdrop element: the slot the shared GL stage
    // mounts its scene into. The contract is unchanged even though the markup
    // is — the backdrop is never content, never announced, never a hit target.
    const stage = page.locator('#hero > div[aria-hidden="true"]');
    await expect(stage).toHaveCount(1);

    // A backdrop carries no reading matter. If copy ever lands in here it is
    // invisible to a screen reader, which is the failure this guards.
    await expect(stage).toHaveText('');

    // Sits behind the copy in the hero's own stacking context, so the section
    // reads correctly with the scene present, absent, or still loading. The
    // absolute value is the hero's business; what must hold is the ordering
    // against the content wrapper beside it.
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

  test('TC-CINE-02: nothing intercepts clicks on the hero CTA', async ({ page }) => {
    await gotoHome(page);
    // The dual `[data-pillar]` CTAs are gone; the hero now offers one primary
    // action into the evidence and one CV download. The invariant is the one
    // that always mattered: whatever is painted over or behind the copy must
    // not steal the click.
    const cta = page.locator('#hero a[href="#experience"]');
    await expect(cta).toBeVisible();

    // Two things have to happen before the probe is meaningful. The web fonts
    // change how the hero's statement wraps, which changes the hero's height by
    // about thirty pixels; and at 1280×720 the CTA sits low enough that on the
    // taller of those two layouts its centre point is *below* the fold.
    // `document.elementFromPoint` is viewport-relative and answers `null` for a
    // point off screen, so probing without scrolling first tested whichever
    // layout the fonts happened to have produced — which is how this check
    // came to report an element that is nowhere near the hero.
    await page.evaluate(() => document.fonts?.ready);
    await cta.scrollIntoViewIfNeeded();

    const hit = await cta.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      if (!top) return 'off-screen';
      return top.closest('#hero a[href="#experience"]') ? 'cta' : (top.className || top.tagName);
    });
    expect(hit).toBe('cta');

    // And the authoritative form of the same question. A trial click runs
    // Playwright's full actionability check and, when something is in the way,
    // names the element that is — which is more use in a failure than a class
    // string. Note that `.sw-toast` is `position: fixed` at the bottom-left,
    // which is where this CTA also sits at this viewport, so this is the guard
    // that would catch a notification landing on the primary call to action.
    await cta.click({ trial: true });
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

  test('TC-CINE-04: with every scene suppressed the page is still the whole page', async ({ page }) => {
    // Replaces the `--spot-x`/`--spot-y` token check, whose consumer was
    // deleted along with the god-ray plane and CursorGlow — it asserted that a
    // value nothing reads is still published, which cannot fail informatively.
    //
    // The rule that governs decoration on the rebuilt page is the one
    // `components/gl/Scene.tsx` states: the scene is evidence rendered, never
    // the evidence itself. Reduced motion is the deterministic way to prove it
    // on any host — `Scene` refuses to mount a canvas when motion is not
    // allowed, regardless of whether the machine running the test has a GPU —
    // so this asserts the strong form: not one WebGL surface exists, and every
    // section is still carrying its content.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);

    for (const id of ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen']) {
      await page.locator(id).scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
    }
    await expect(page.locator('canvas')).toHaveCount(0);

    for (const id of ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen']) {
      const text = (await page.locator(id).innerText()).trim();
      expect(text.length, `${id} lost its content with the scene suppressed`).toBeGreaterThan(200);
    }
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
    // the `.cine-spotlight` plane. The contract on the new hero is that the
    // `heroRise` entrance (opacity + 14px translate) swaps for `heroFade`
    // (opacity only). This test used to also demand the fade be collapsed to
    // <20 ms by a site-wide duration guard in globals.css; that guard was the
    // R-46 kill switch the design-system lock (§4.3) condemns, and
    // tests/a11y/reduced-motion-choreography.spec.ts (RM-1 / RM-5) requires a
    // perceptible 150–600 ms fade with no universal override. Two live specs
    // cannot demand both, so this one asserts the contract that survives: the
    // entrance interpolates opacity and nothing else, runs inside the R-46 fade
    // band, and leaves the copy untransformed.
    const name = page.locator('#hero h1');
    await expect(name).toBeVisible();

    const entrance = await name.evaluate((el) => {
      const s = getComputedStyle(el);
      const first = (s.animationDuration.split(',')[0] || '').trim();
      let ms = parseFloat(first) || 0;
      if (first.endsWith('ms')) ms = parseFloat(first);
      else if (first.endsWith('s')) ms = parseFloat(first) * 1000;
      // Read the keyframes the running animation actually interpolates off the
      // shipped CSSOM, so a transform smuggled back into the fade is caught.
      const props = new Set<string>();
      const walk = (rules: CSSRuleList): void => {
        for (const rule of Array.from(rules)) {
          const keyframes = rule as CSSKeyframesRule;
          if (keyframes.name === s.animationName && keyframes.cssRules) {
            for (const frame of Array.from(keyframes.cssRules)) {
              const style = (frame as CSSKeyframeRule).style;
              for (let i = 0; i < style.length; i++) props.add(style[i]);
            }
          }
          const grouping = rule as CSSGroupingRule;
          if (grouping.cssRules) walk(grouping.cssRules);
        }
      };
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          walk(sheet.cssRules);
        } catch {
          // Cross-origin sheet: not part of this build's CSS.
        }
      }
      return { name: s.animationName, durationMs: ms, keyframeProps: Array.from(props), transform: s.transform };
    });

    // CSS Modules hashes the keyframe name (e.g. `Hero_heroFade__GnbNG`), so match
    // on the stem rather than the build-specific hash.
    expect(entrance.name).toMatch(/heroFade/);
    expect(entrance.keyframeProps, 'the reduced-motion entrance is opacity only — no rise').toEqual(['opacity']);
    expect(entrance.durationMs).toBeGreaterThanOrEqual(150);
    expect(entrance.durationMs).toBeLessThanOrEqual(600);
    expect(entrance.transform).toBe('none');
  });

  test('TC-CINE-07: under reduced motion every section is readable, not left behind a curtain', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);

    // This is what the two deleted `.beat` tests were actually protecting: a
    // decorative reveal that never runs must fail open, leaving the content
    // visible, rather than fail closed and leave a section behind a bar that
    // never lifted. The letterbox primitive is gone, but the risk applies to
    // every entrance on the page, so the check is now made against all six
    // sections instead of against whichever one happened to carry the class.
    for (const [section, heading] of [
      ['#hero', '#hero h1'],
      ['#about', '#about h2'],
      ['#experience', '#experience h2'],
      ['#skills', '#skills h2'],
      ['#vitrine', '#vitrine h2'],
      ['#listen', '#listen h2'],
    ]) {
      await page.locator(section).scrollIntoViewIfNeeded();
      const title = page.locator(heading).first();
      await expect(title, `${heading} is not visible under reduced motion`).toBeVisible();
      const opacity = await title.evaluate((el) => Number(getComputedStyle(el).opacity));
      expect(opacity, `${heading} is transparent under reduced motion`).toBeGreaterThan(0.9);
    }
  });
});
