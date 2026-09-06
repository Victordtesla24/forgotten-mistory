import { test, expect } from '@playwright/test';

/**
 * What is keeping me busy — the long vitrine.
 *
 * Three claims hold this section up, and this file holds all three. Six plates
 * out of thirty-eight repositories, so the selection is an editorial act rather
 * than a directory listing. Every plate states what its repository does NOT do.
 * And the metrics are harvested from the real API on a stated date, never live
 * and never typed by hand — a number on a plate a reader cannot trace is worth
 * less than no number at all.
 */

const VITRINE = '#vitrine';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator(VITRINE).scrollIntoViewIfNeeded();
});

test.describe('Vitrine', () => {
  test('TC-VIT-01: exactly six plates, each with a source link', async ({ page }) => {
    const plates = page.locator(`${VITRINE} ol > li`);
    await expect(plates).toHaveCount(6);
    for (let i = 0; i < 6; i++) {
      await expect(
        plates.nth(i).locator('a[href^="https://github.com/Victordtesla24/"]'),
      ).toHaveCount(1);
    }
  });

  test('TC-VIT-02: every plate states its limits', async ({ page }) => {
    // The section's hardest rule. A plate that cannot say what its repository
    // does not do has not been looked at closely enough to be shown.
    const plates = page.locator(`${VITRINE} ol > li`);
    for (let i = 0; i < 6; i++) {
      // innerText applies text-transform, so the label reads LIMITS on screen
      // even though the source says "Limits".
      const text = await plates.nth(i).innerText();
      expect(text.toUpperCase(), `plate ${i}`).toContain('LIMITS');
      const limits = text.toUpperCase().split('LIMITS')[1]?.trim() ?? '';
      expect(limits.length, `limits text on plate ${i}`).toBeGreaterThan(30);
    }
  });

  test('TC-VIT-03: metrics are harvested and dated, not live', async ({ page }) => {
    await expect(page.locator(VITRINE)).toContainText('harvested');
    await expect(page.locator(VITRINE)).toContainText(/harvested \d{4}-\d{2}-\d{2}/);
    await expect(page.locator(VITRINE)).toContainText('not live');
    // The real commit count for the flagship repository, from the harvest.
    await expect(page.locator(`${VITRINE} ol > li`).first()).toContainText('1,664');
  });

  test('TC-VIT-04: the exclusions are named with reasons', async ({ page }) => {
    // Worth more than any repository included: it proves the six were chosen.
    await expect(page.locator(VITRINE)).toContainText('Excluded, and why');
    await expect(page.locator(VITRINE)).toContainText('vik-legal-defence');
    await expect(page.locator(VITRINE)).toContainText('environment file was committed');
  });

  test('TC-VIT-05: no screenshots, logos or raster images', async ({ page }) => {
    // The bespoke mechanism drawings are removed with the rest of the visual
    // layer (t_w3_rm2, INTERIM-FRAME.md §5); the rule they were an instance of
    // is not. Nothing in the cabinet may be a screenshot or a logo.
    await expect(page.locator(`${VITRINE} img`)).toHaveCount(0);
    // The six-drawing count is SUPERSEDED by interim-frame.spec.ts TC-IF-14,
    // which measures what each card must still carry: title, description, the
    // three metrics, its limits and its source.
  });

  test('TC-VIT-06: the light tracks the plate at the centre of the rail', async ({ page }) => {
    const plates = page.locator(`${VITRINE} ol > li`);
    const litIndex = async () =>
      plates.evaluateAll((nodes) => nodes.findIndex((n) => n.hasAttribute('data-lit')));

    const first = await litIndex();
    expect(first).toBeGreaterThanOrEqual(0);

    await page.locator(`${VITRINE} ol`).evaluate((rail) => {
      rail.scrollBy({ left: rail.clientWidth * 1.5, behavior: 'instant' as ScrollBehavior });
    });
    await page.waitForTimeout(400);
    expect(await litIndex()).toBeGreaterThan(first);
  });

  test('TC-VIT-07: the rail is keyboard operable and traps nothing', async ({ page }) => {
    const plates = page.locator(`${VITRINE} ol > li`);
    await plates.first().focus();
    await expect(plates.first()).toBeFocused();
    await plates.first().press('ArrowRight');
    await page.waitForTimeout(500);
    await expect(plates.nth(1)).toBeFocused();
    // Tab must still leave the rail — a horizontal scroller that swallows focus
    // is a keyboard trap regardless of how good it looks.
    await page.keyboard.press('Tab');
    await expect(plates.nth(1)).not.toBeFocused();
  });

  test('TC-VIT-08: the kicker denominator matches the harvest', async ({ page }) => {
    await expect(page.locator(VITRINE)).toContainText('38 public repositories');
    await expect(page.locator(`${VITRINE} h2`)).toContainText('Six of thirty-eight');
  });

  test('TC-VIT-09: every plate rules its metrics on the same line', async ({ page }) => {
    // The rail has to read as one cabinet, not six unrelated cards. That claim
    // is entirely carried by horizontal alignment: the COMMITS / ACTIVE / STACK
    // row, the LIMITS block and the source link must start at the same offset
    // inside every plate, so the eye tracks straight across the rail.
    //
    // It broke once, invisibly to every other assertion here: one drawing is
    // authored on a 320x122 crop while the other five are 320x200, so with the
    // drawing sized by its own aspect that plate's metrics began 99px higher
    // than its neighbours'. The band is now fixed in CSS rather than by each
    // drawing's viewBox, and this is the test that would have caught it.
    const offsets = await page.locator(`${VITRINE} ol > li`).evaluateAll((plates) =>
      plates.map((li) => {
        const top = li.getBoundingClientRect().top;
        const at = (frag: string) => {
          const el = Array.from(li.querySelectorAll('*')).find((e) =>
            (e.className?.toString() ?? '').includes(frag),
          );
          return el ? Math.round(el.getBoundingClientRect().top - top) : -1;
        };
        return { metrics: at('metrics'), limits: at('limits'), links: at('links') };
      }),
    );

    expect(offsets.length).toBeGreaterThanOrEqual(6);
    for (const row of ['metrics', 'limits', 'links'] as const) {
      const values = offsets.map((o) => o[row]);
      expect(values, `${row} was not found on every plate`).not.toContain(-1);
      const spread = Math.max(...values) - Math.min(...values);
      // A pixel or two of sub-pixel rounding is fine; a row is not.
      expect(spread, `${row} varies by ${spread}px across the rail: ${values.join(', ')}`)
        .toBeLessThanOrEqual(2);
    }
  });

  /* TC-VIT-10 is SUPERSEDED by tests/overhaul/interim-frame.spec.ts TC-IF-14
     (INTERIM-FRAME.md §6). It asserted that a plate traces its bespoke
     mechanism drawing as the light reaches it; both the drawings and the light
     are removed (t_w3_rm2). TC-IF-14 measures what each card must still carry:
     title, description, the three metrics, its limits and its source — and a
     rail the keyboard can still drive. */


  /* TC-VIT-11 is SUPERSEDED by tests/overhaul/interim-frame.spec.ts TC-IF-19
     (INTERIM-FRAME.md §6). It asserted that under reduced motion the drawings
     render present but untraced. With no drawing and no trace, this section's
     reduced-motion contract is that it prints the same words and the same rows
     on both motion paths — which is what TC-IF-19 measures. */


  // Council R-c8, C-02 (blocker): the card rail sat 96 px (1440) / 336 px
  // (1920) off its own heading's spine, the right-most card was cut mid-word
  // with a hard edge, card 02 was lit at rest instead of 01, and an unlit
  // plate at 0.42 composited its captions to 1.75:1. Each half of that finding
  // is an assertion below, at the two widths the council measured.
  for (const width of [1440, 1920]) {
    test(`TC-VIT-12 @ ${width}: card 01 stands on the heading's spine, lit at rest, and the rail fades rather than cuts`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });

      // First paint, before any script: the server-rendered HTML already
      // carries the light on plate 01. A rail that only lights after hydration
      // shows six dimmed cards for as long as the bundle takes to arrive.
      const html = await (await page.request.get('/')).text();
      const railHtml = html.slice(html.indexOf('id="vitrine"'));
      const firstPlate = railHtml.slice(railHtml.indexOf('<li'), railHtml.indexOf('>', railHtml.indexOf('<li')) + 1);
      expect(firstPlate, 'plate 01 carries data-lit in the server-rendered HTML').toContain('data-lit="true"');

      await page.goto('/');
      await page.locator(VITRINE).scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);

      const plates = page.locator(`${VITRINE} ol > li`);
      await expect(plates.first()).toHaveAttribute('data-lit', 'true');
      await expect(page.locator(`${VITRINE} ol > li[data-lit]`)).toHaveCount(1);

      // One spine. The heading's left edge and the first card's border-left
      // are the same x, within a pixel of sub-pixel rounding.
      const headingLeft = (await page.locator(`${VITRINE} h2`).boundingBox())!.x;
      const cardLeft = (await plates.first().boundingBox())!.x;
      expect(
        Math.abs(cardLeft - headingLeft),
        `heading left ${headingLeft.toFixed(2)} vs card 01 border-left ${cardLeft.toFixed(2)}`,
      ).toBeLessThanOrEqual(1);

      // The rail ends in a fade, not a cut: a mask is declared and computed.
      const mask = await page.locator(`${VITRINE} ol`).evaluate((rail) => {
        const cs = getComputedStyle(rail) as CSSStyleDeclaration & { webkitMaskImage?: string };
        return cs.maskImage && cs.maskImage !== 'none' ? cs.maskImage : (cs.webkitMaskImage ?? 'none');
      });
      expect(mask, 'computed mask-image on the rail').not.toBe('none');
      expect(mask).toContain('linear-gradient');

      // The shadow half of the raking light is still legible: an unlit plate
      // composites at 0.62, never the 0.42 that failed AA.
      const unlit = page.locator(`${VITRINE} ol > li:not([data-lit])`).first();
      const opacity = await unlit.evaluate((el) => Number.parseFloat(getComputedStyle(el).opacity));
      expect(opacity, 'unlit plate opacity').toBeGreaterThanOrEqual(0.6);

      // The light moves with the reader, and it is one light: after a scroll
      // exactly one plate carries it.
      await page.locator(`${VITRINE} ol`).evaluate((rail) => {
        rail.scrollBy({ left: 600, behavior: 'instant' as ScrollBehavior });
      });
      await page.waitForTimeout(400);
      await expect(page.locator(`${VITRINE} ol > li[data-lit]`)).toHaveCount(1);
    });
  }

  /* TC-VIT-13 is SUPERSEDED by tests/overhaul/interim-frame.spec.ts TC-IF-14
     and TC-IF-19 (docs/architecture/INTERIM-FRAME.md §6). It asserted that
     every stroke of a lit plate's drawing reaches stroke-dashoffset 0 inside
     the cinematic band. There are no strokes: the six bespoke mechanism
     drawings are removed with the rest of the visual layer (t_w3_rm2). */
});
