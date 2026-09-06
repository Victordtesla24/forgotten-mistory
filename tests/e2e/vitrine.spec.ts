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

  test('TC-VIT-10: a plate traces its drawing when the light reaches it', async ({ page }) => {
    // Council R-c1 (motion, #vitrine): the drawings are the section's story —
    // what each repository does — so they are traced as the plate is lit, not
    // printed static. Scroll the rail by 700 and the third plate takes the
    // light; its first stroke must have run its dash to 0 within 1200 ms.
    const plates = page.locator(`${VITRINE} ol > li`);
    const litIndex = () =>
      plates.evaluateAll((nodes) => nodes.findIndex((n) => n.getAttribute('data-lit') === 'true'));
    const litBefore = await litIndex();
    await page.locator(`${VITRINE} ol`).evaluate((rail) => {
      rail.scrollBy({ left: 700, behavior: 'instant' as ScrollBehavior });
    });
    await expect.poll(litIndex, { timeout: 2000 }).toBe(2);
    expect(litBefore, 'the third plate was not the lit one before the scroll').not.toBe(2);

    const stroke = plates
      .nth(2)
      .locator('svg[role="img"] :is(path, line, circle)')
      .first();
    await expect(stroke).toHaveAttribute('pathLength', '1');
    const dashoffset = () =>
      stroke.evaluate((el) => Number.parseFloat(getComputedStyle(el).strokeDashoffset));
    await expect
      .poll(dashoffset, {
        timeout: 1200,
        intervals: [100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
        message: 'first stroke of the lit plate traced to 0',
      })
      .toBe(0);

    // Drawn once: the light moving on does not undraw the plate.
    await page.locator(`${VITRINE} ol`).evaluate((rail) => {
      rail.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
    });
    await expect.poll(litIndex, { timeout: 2000 }).not.toBe(2);
    await expect(plates.nth(2)).toHaveAttribute('data-drawn', 'true');
    expect(await dashoffset()).toBe(0);
  });

  test('TC-VIT-11: under reduced motion the drawings are present, untraced', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator(VITRINE).scrollIntoViewIfNeeded();
    // The fifth plate has never been lit, so it has neither data-lit nor
    // data-drawn: only the reduced-motion rule can have put its strokes at 0.
    const plate = page.locator(`${VITRINE} ol > li`).nth(4);
    await expect(plate).not.toHaveAttribute('data-lit', /.*/);
    await expect(plate).not.toHaveAttribute('data-drawn', /.*/);
    const stroke = plate.locator('svg[role="img"] :is(path, line, circle)').first();
    const style = await stroke.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { offset: Number.parseFloat(cs.strokeDashoffset), transition: cs.transitionProperty };
    });
    expect(style.offset, 'strokes are present immediately under reduced motion').toBe(0);
    expect(style.transition, 'no dash animation under reduced motion').not.toContain('stroke-dashoffset');
  });

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

  test('TC-VIT-13: every stroke of a lit plate lands inside the cinematic band', async ({ page }) => {
    // Council R-c8, C-02 acceptance: "lit plate svg paths reach
    // stroke-dashoffset 0 by 900 ms". Plate 01 has twenty-five strokes, so a
    // fixed 40 ms stagger on top of a 900 ms draw ran to 1.9 s; the stagger is
    // budgeted (Drawings.module.css `--n`) so the last stroke lands by 880 ms
    // whatever the count. Two readings: the timing the stylesheet declares
    // (deterministic) and the moment the last stroke actually reaches 0
    // (harness-tolerant, measured from the attribute change itself).
    const plates = page.locator(`${VITRINE} ol > li`);
    const target = plates.nth(2);
    await expect(target).not.toHaveAttribute('data-lit', /.*/);

    // Timestamp the moment the light reaches the plate, from inside the page.
    await target.evaluate((plate) => {
      const w = window as unknown as { __litAt: number | null };
      w.__litAt = null;
      new MutationObserver(() => {
        if (plate.hasAttribute('data-lit') && w.__litAt === null) w.__litAt = performance.now();
      }).observe(plate, { attributes: true, attributeFilter: ['data-lit'] });
    });
    await page.locator(`${VITRINE} ol`).evaluate((rail) => {
      rail.scrollBy({ left: 700, behavior: 'instant' as ScrollBehavior });
    });
    await expect(target).toHaveAttribute('data-lit', 'true', { timeout: 2000 });

    const result = await target.evaluate(
      (plate) =>
        new Promise<{ strokes: number; declaredMaxMs: number; landedMs: number }>((resolve) => {
          const w = window as unknown as { __litAt: number | null };
          const strokes = Array.from(
            plate.querySelectorAll<SVGElement>('svg[role="img"] :is(path, line, circle, rect)[pathLength]'),
          );
          const ms = (v: string) => {
            const n = Number.parseFloat(v);
            return v.trim().endsWith('ms') ? n : n * 1000;
          };
          // The stylesheet's own promise: duration + delay for every stroke.
          const declaredMaxMs = Math.max(
            ...strokes.map((s) => {
              const cs = getComputedStyle(s);
              return ms(cs.transitionDuration.split(',')[0]) + ms(cs.transitionDelay.split(',')[0]);
            }),
          );
          const litAt = w.__litAt ?? performance.now();
          const tick = () => {
            const now = performance.now();
            const done = strokes.every((s) => Number.parseFloat(getComputedStyle(s).strokeDashoffset) === 0);
            if (done) return resolve({ strokes: strokes.length, declaredMaxMs, landedMs: now - litAt });
            if (now - litAt > 4000) return resolve({ strokes: strokes.length, declaredMaxMs, landedMs: Infinity });
            requestAnimationFrame(tick);
          };
          tick();
        }),
    );
    expect(result.strokes, 'the lit plate has traced strokes').toBeGreaterThan(0);
    expect(result.declaredMaxMs, `declared duration + delay of the slowest stroke (${result.strokes} strokes)`).toBeLessThanOrEqual(900);
    expect(result.landedMs, `all ${result.strokes} strokes at dashoffset 0`).toBeLessThanOrEqual(1200);
  });
});
