import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { test, expect, type Page } from '@playwright/test';

/**
 * SPEC-v10 c18 / R-c8 items 5 (MOT-F-1) and 6 (C-03) — `#experience` narrates
 * "Sixteen years, to scale".
 *
 * Before this file the section stated its own thesis and then refused to argue
 * it. The bars were painted at full length on first paint, so a reader arriving
 * at the section saw a finished picture and never saw the sixteen years being
 * measured out. The shader behind them said, in its own header, that it
 * "encodes nothing" — decoration sitting under a chart whose entire claim is
 * that nothing here is decorative. And the duration readouts were absolutely
 * positioned past the end of each bar with no room reserved, so at 834 the
 * newest role's `6 mo` ran outside the chart card, four pixels from the
 * viewport edge.
 *
 * What these tests pin:
 *
 * 1. **The bars are drawn, not stated.** Every `.trackBar` mounts at
 *    `scaleX(0)` about its left edge and grows to full over 900 ms once the
 *    section is 35 % in view, one row 60 ms behind the last. The picture is
 *    settled well inside 1.5 s — long enough to be read as a measurement, short
 *    enough that nobody waits for it.
 *
 * 2. **The field follows the bars.** `strata.glsl.ts` takes the eight spans,
 *    the same entry progress and the hovered row, and brightens the sediment
 *    band under each bar as that bar arrives. The header that disclaimed any
 *    meaning is gone, because the disclaimer is no longer true.
 *
 * 3. **Gold marks a sourced employer, and never a date.** Gold on this site
 *    means one thing: this claim has a source a reader can open. An employer on
 *    the CV is such a source, so `#experience` now spends gold on the employer
 *    strings graded `sourced` (`app/data/portfolio/experience.ts`, the same
 *    allow-list as `tests/about_sourced_semantics.test.mjs`) — recessed at rest,
 *    saturated under the active row. Dates are self-reported, so nothing on the
 *    time axis may paint gold: the playhead, the axis ticks and the duration
 *    readouts stay `--white`/`--mist`. The "today" mark ships in `--white`
 *    (R-c8 resolved the motion reviewer's gold-playhead proposal against it).
 *    G-E2 (ADV-1451Z P1) is what moved the mark from "nowhere in the section"
 *    to "the sourced employer, and only there".
 *
 * 4. **Every readout sits inside the card.** At 390, 834, 1280, 1440 and 1920
 *    the duration labels stay at least 16 px inside the chart's right edge and
 *    the document never scrolls sideways.
 *
 * 5. **Reduced motion keeps the chart, drops the movement.** With
 *    `prefers-reduced-motion: reduce` no bar is ever shorter than its real
 *    duration — the section fades in and is immediately true.
 */

const EXPERIENCE = '#experience';
const BAR = `${EXPERIENCE} [class*="trackBar"]`;
const YEARS = `${EXPERIENCE} [class*="trackYears"]`;
const FIELD = `${EXPERIENCE} [data-track-field]`;
const PLAYHEAD = `${EXPERIENCE} [data-playhead]`;
const CHART = `${EXPERIENCE} [data-chart]`;

const GOLD = 'rgb(201, 168, 76)';
const WHITE = 'rgb(246, 246, 246)';

const GLSL_SOURCE = join(
  process.cwd(),
  'components/sections/Experience/strata.glsl.ts',
);

/**
 * This host has no GPU. `useGLCapability` classifies SwiftShader as
 * `unsupported` and mounts no canvas at all, so a scene test run without these
 * two flags plus `?gl=force` would pass by testing the fallback and never
 * compile a line of GLSL.
 */
test.use({
  launchOptions: {
    args: [
      '--no-sandbox',
      '--use-gl=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  },
});

async function waitForPageReady(page: Page) {
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * The entry beat, sampled in the page rather than from the harness.
 *
 * Timing this from Node would measure the round trip, not the animation: by the
 * time a `waitForTimeout(100)` and a CDP evaluate have completed, the 900 ms
 * growth is already a third of the way through and the "is it still short?"
 * question has no meaningful answer. So the sampler waits inside the page for
 * the section to commit (`data-entered`), takes `performance.now()` as t0, and
 * reads every frame from there.
 */
interface EntryBeat {
  rows: number;
  at100: number | null;
  settledAt: number | null;
  minObserved: number;
  finalTransforms: string[];
}

/**
 * Arms the sampler, scrolls the section in, and hands back what it recorded.
 *
 * The sampler is installed and left running rather than awaited in place: an
 * `evaluate` that stays pending while the same page is being scrolled is a
 * standing invitation to deadlock the harness, and it did — three tests sat on
 * the 90 s timeout with the promise never settled. It writes to a well on
 * `window` instead, and the harness waits for that well to fill.
 */
async function runEntryBeat(page: Page): Promise<EntryBeat> {
  await page.evaluate(
    ([fieldSelector, barSelector]) => {
      const field = document.querySelector(fieldSelector);
      const bars = () => Array.from(document.querySelectorAll(barSelector));
      const scaleX = (el: Element) => {
        const value = getComputedStyle(el).transform;
        if (!value || value === 'none') return 1;
        const matrix = value.match(/matrix\(([^)]+)\)/);
        return matrix ? parseFloat(matrix[1].split(',')[0]) : 1;
      };

      const store = (result: unknown) => {
        (window as unknown as Record<string, unknown>).__experienceBeat = result;
      };

      if (!field) {
        store({ rows: 0, at100: null, settledAt: null, minObserved: -1, finalTransforms: [] });
        return;
      }

      const start = () => {
        const t0 = performance.now();
        let at100: number | null = null;
        let settledAt: number | null = null;
        let minObserved = Number.POSITIVE_INFINITY;

        const tick = () => {
          const elapsed = performance.now() - t0;
          const current = bars();
          for (const bar of current) minObserved = Math.min(minObserved, scaleX(bar));
          if (at100 === null && elapsed >= 100 && current.length > 0) at100 = scaleX(current[0]);
          if (settledAt === null && current.length > 0 && current.every((b) => scaleX(b) >= 0.999)) {
            settledAt = elapsed;
          }
          if (elapsed >= 1700) {
            store({
              rows: current.length,
              at100,
              settledAt,
              minObserved,
              finalTransforms: current.map((b) => getComputedStyle(b).transform),
            });
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      };

      if (field.hasAttribute('data-entered')) {
        start();
        return;
      }
      const observer = new MutationObserver(() => {
        if (field.hasAttribute('data-entered')) {
          observer.disconnect();
          start();
        }
      });
      observer.observe(field, { attributes: true, attributeFilter: ['data-entered'] });
    },
    [FIELD, BAR] as const,
  );

  // The chart, not the section: `#experience` is four viewports tall, and
  // scrolling *it* into view lands the reader at its foot with the chart
  // already behind them — which is a state the chart handles (it commits), but
  // not the one the entry beat is defined in.
  await page.locator(CHART).scrollIntoViewIfNeeded();
  await page.waitForFunction(
    () => Boolean((window as unknown as Record<string, unknown>).__experienceBeat),
    null,
    { timeout: 20000 },
  );
  return page.evaluate(
    () => (window as unknown as Record<string, EntryBeat>).__experienceBeat,
  ) as Promise<EntryBeat>;
}

test.describe('#experience — the narrated signature (c18 / MOT-F-1)', () => {
  test('TC-SCENE-EXP-01: the bars are still growing 100 ms after the section commits', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const result = await runEntryBeat(page);

    expect(result.rows, 'eight roles, eight bars').toBe(8);
    expect(result.at100, 'the first bar reports a scaleX 100 ms in').not.toBeNull();
    expect(result.at100!, 'at 100 ms the first bar is under half its length').toBeLessThan(0.5);
  });

  test('TC-SCENE-EXP-02: every bar reaches its real length within 1500 ms', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const result = await runEntryBeat(page);

    expect(result.settledAt, 'the chart settles').not.toBeNull();
    expect(result.settledAt!, 'settled inside 1.5 s').toBeLessThanOrEqual(1500);
    for (const transform of result.finalTransforms) {
      expect(transform).toBe('matrix(1, 0, 0, 1, 0, 0)');
    }
  });

  test('TC-SCENE-EXP-03: gold paints only sourced employers, never a date', async ({ page }) => {
    // Gold is licensed for `sourced` only — CLAUDE.md prime directive 3. G-E2
    // moved the mark onto the employer strings graded `sourced` in
    // app/data/portfolio/experience.ts; the invariant this holds is that every
    // gold pixel in #experience sits inside a [data-sourced] employer and none
    // sits on a date (the playhead, the axis, or a duration readout).
    await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.locator(EXPERIENCE).scrollIntoViewIfNeeded();
    await page.waitForTimeout(2000);

    const anyGold = [
      'rgb(201, 168, 76)', // --gold
      'rgb(212, 182, 92)', // --gold-light
      'rgb(232, 213, 163)', // --gold-pale
      'rgb(176, 146, 63)', // --gold-dark
    ];

    const offenders = await page.evaluate((golds) => {
      const found: string[] = [];
      const section = document.querySelector('#experience');
      if (!section) return ['#experience is missing'];
      const props = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor',
        'borderBottomColor', 'borderLeftColor', 'outlineColor', 'stroke', 'fill'] as const;
      for (const el of Array.from(section.querySelectorAll('*'))) {
        for (const pseudo of [null, '::before', '::after']) {
          const cs = getComputedStyle(el, pseudo ?? undefined);
          for (const prop of props) {
            const value = String(cs[prop] ?? '');
            if (!golds.some((g) => value.includes(g))) continue;
            // Gold is licensed on a sourced employer string and nowhere else.
            const onSourced = (el as HTMLElement).closest('[data-sourced]');
            if (!onSourced) {
              found.push(`${el.tagName}.${el.className}${pseudo ?? ''} ${prop}=${value}`);
            }
          }
        }
      }
      return found;
    }, anyGold);

    expect(
      offenders,
      `gold outside a sourced employer in #experience: ${offenders.join(' | ')}`,
    ).toEqual([]);
  });

  test('TC-SCENE-EXP-03b: at most one saturated employer gold shares the chart at rest', async ({
    page,
  }) => {
    // Eight employers sit in one chart; the per-view budget (as the vitrine and
    // skills hold it) is one saturated "look here". At rest — no row active —
    // the sourced employers are all recessed --gold-pale, so the saturated
    // count is zero; it rises to one only under the active row.
    await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.locator(EXPERIENCE).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1600);

    const saturated = await page.evaluate((gold) => {
      const section = document.querySelector('#experience');
      if (!section) return -1;
      let count = 0;
      for (const el of Array.from(section.querySelectorAll('[data-sourced]'))) {
        const box = el.getBoundingClientRect();
        if (box.width < 1 || box.height < 1) continue;
        if (box.bottom <= 0 || box.top >= window.innerHeight) continue;
        if (getComputedStyle(el).color === gold) count += 1;
      }
      return count;
    }, GOLD);

    expect(saturated, 'at rest no employer is a saturated gold mark').toBeLessThanOrEqual(1);
  });

  test('TC-SCENE-EXP-04: the today playhead is white', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.locator(EXPERIENCE).scrollIntoViewIfNeeded();

    const playhead = page.locator(PLAYHEAD);
    await expect(playhead).toHaveCount(1);
    await expect(playhead).toHaveCSS('color', WHITE);
  });

  test('TC-SCENE-EXP-05: every duration label stays inside the chart card', async ({ page }) => {
    // R-c8 C-03: at 834 the `6 mo` readout ran from x=800 to x=830 with the
    // card's right border at x=793 — outside the card, 4 px from the edge.
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    for (const width of [390, 834, 1280, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      await page.locator(EXPERIENCE).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);

      const report = await page.evaluate(
        ([chartSelector, yearsSelector]) => {
          const chart = document.querySelector(chartSelector);
          const rect = chart?.getBoundingClientRect();
          const overflowing = Array.from(document.querySelectorAll(yearsSelector))
            .map((el) => el.getBoundingClientRect())
            .filter((r) => r.width > 0 && rect && r.right > rect.right - 16)
            .map((r) => Math.round(r.right));
          return {
            hasChart: Boolean(rect),
            overflowing,
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
          };
        },
        [CHART, YEARS] as const,
      );

      expect(report.hasChart, `chart card present at ${width}`).toBe(true);
      expect(report.overflowing, `labels outside the card at ${width}`).toEqual([]);
      expect(report.scrollWidth, `no sideways scroll at ${width}`).toBe(report.innerWidth);
    }
  });

  test('TC-SCENE-EXP-06: one canvas behind the chart at ?gl=force', async ({ page }) => {
    await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.locator(EXPERIENCE).scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);

    await expect(page.locator(`${EXPERIENCE} canvas`)).toHaveCount(1);
  });

  test('TC-SCENE-EXP-07: the shader is bound to the spans it sits under', async () => {
    const source = readFileSync(GLSL_SOURCE, 'utf8');
    expect(source, 'uSpans carries the eight bars into the shader').toContain('uSpans');
    expect(source, 'uProgress shares the entry beat').toContain('uProgress');
    expect(source, 'uHover carries the pointed-at row').toContain('uHover');
    expect(source, 'the header no longer disclaims meaning').not.toMatch(/encodes nothing/i);
  });
});

test.describe('#experience under reduced motion', () => {
  test('TC-SCENE-EXP-08: no bar is ever shorter than its real duration', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    const watcher = page.evaluate(
      (barSelector) =>
        new Promise<number>((resolve) => {
          let min = Number.POSITIVE_INFINITY;
          const t0 = performance.now();
          const scaleX = (el: Element) => {
            const value = getComputedStyle(el).transform;
            if (!value || value === 'none') return 1;
            const matrix = value.match(/matrix\(([^)]+)\)/);
            return matrix ? parseFloat(matrix[1].split(',')[0]) : 1;
          };
          const tick = () => {
            for (const bar of Array.from(document.querySelectorAll(barSelector))) {
              min = Math.min(min, scaleX(bar));
            }
            if (performance.now() - t0 >= 1200) {
              resolve(min);
              return;
            }
            requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }),
      BAR,
    );
    await page.locator(EXPERIENCE).scrollIntoViewIfNeeded();
    const minScaleX = await watcher;

    expect(minScaleX, 'bars are full length from the first frame').toBeGreaterThanOrEqual(1);
    await expect(page.locator(`${EXPERIENCE} canvas`)).toHaveCount(0);
    await expect(page.locator(PLAYHEAD)).toHaveCount(1);
  });
});
