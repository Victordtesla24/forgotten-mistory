import { existsSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { NOW, roles, ym } from '@/content/experience';
import { headlineFigures } from '@/content/proof';
import { ENTRANCE_END } from '@/lib/entrance';
import { readingLayout } from '@/lib/readings';
import { careerBars, LABEL_CONFLICTS, timeline } from '@/lib/timeline';

import { entranceDone, hydrated, open, visibleWordCounts, watchConsole } from './support';

/** The hero is the first child of the page's main element. */
const HERO = 'main > div:first-child';
const SCALE = '[data-career-scale]';
const BARS = `${SCALE} [data-bars] a[data-role]`;
const CHIPS = `${SCALE} [data-chips] a[data-role]`;
/** The bars as drawn, at every width and on every kind of screen: one list of presentational items. */
const DRAWN = `${SCALE} [data-drawn] > [data-bar]`;

/** Months from the first month of the axis to the month it ends in. */
const AXIS_MONTHS = Math.round((NOW - 2010) * 12);
/** The calendar month, "2026-11", a decimal year falls in. */
const monthOf = (decimalYear: number): string => {
  const year = Math.floor(decimalYear + 1e-6);
  return `${year}-${String(Math.round((decimalYear - year) * 12) + 1).padStart(2, '0')}`;
};

/** The widths acceptance names, with a height tall enough to see the first screen. */
const WIDTHS = [320, 390, 834, 1440, 1920] as const;

/** Waits for the review hook and for its `ready` promise. */
async function stageReady(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__stage !== undefined);
  await page.evaluate(() => window.__stage?.ready);
}

/** What the stage draws for telemetry: 10,000 points where they can be told apart, otherwise 100 blocks of 100 (`readingLayout`). */
async function telemetryDrawn(page: Page): Promise<{ drawn: number; unit: number }> {
  const view = page.locator('[data-stage-view="reading-telemetry"]');
  await expect(view).toHaveAttribute('data-drawn', /\d+/);
  return { drawn: Number(await view.getAttribute('data-drawn')), unit: Number(await view.getAttribute('data-unit')) };
}

async function openAt(page: Page, path: string, width: number, height = 900): Promise<void> {
  await page.setViewportSize({ width, height });
  await open(page, path);
  await page.evaluate(() => document.fonts.ready);
}

interface Box {
  left: number;
  right: number;
  width: number;
}

async function boxes(page: Page, selector: string): Promise<Box[]> {
  return page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const { left, right, width } = element.getBoundingClientRect();
      return { left, right, width };
    }),
  );
}

test.describe('the career scale', { tag: '@desktop' }, () => {
  test('ends in the month the site was built, never earlier', () => {
    const today = new Date();
    expect(NOW, 'later than the month this was written in').toBeGreaterThanOrEqual(ym(2026, 11));
    expect(NOW, 'no later than the current month').toBeLessThanOrEqual(ym(today.getUTCFullYear(), today.getUTCMonth() + 1));
    const ato = careerBars.find((bar) => bar.current);
    expect(ato?.months, 'the current role runs from March 2026 to the end of the axis').toBe(Math.round((NOW - ym(2026, 3)) * 12));
  });

  test('is drawn on the one UTC time scale, January 2010 to the current month', () => {
    expect(timeline.domain().map((date) => date.toISOString().slice(0, 7))).toEqual(['2010-01', monthOf(NOW)]);
    expect(timeline.range()).toEqual([0, 1]);
    expect(careerBars[0]?.start, 'MYOB starts in May 2010, four months in').toBeCloseTo(4 / AXIS_MONTHS, 2);
    expect(careerBars.at(-1)?.end, 'the current role runs to now').toBe(1);
  });

  for (const width of WIDTHS) {
    test(`runs edge to edge at ${width} px, with no horizontal scroll`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openAt(page, '/?gl=off', width);
      const [track] = await boxes(page, SCALE);
      const client = await page.evaluate(() => document.documentElement.clientWidth);
      expect(track?.left, 'left edge').toBeLessThanOrEqual(1);
      expect(track?.left, 'left edge').toBeGreaterThanOrEqual(-1);
      expect(Math.abs((track?.right ?? 0) - client), 'right edge against the content width').toBeLessThanOrEqual(1);
      const scroll = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(scroll, 'horizontal page scroll').toBeLessThanOrEqual(0);
    });
  }

  test('has eight bars whose widths are the roles’ lengths to scale', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [390, 1440]) {
      await openAt(page, '/?gl=off', width);
      const [track] = await boxes(page, SCALE);
      const bars = await boxes(page, DRAWN);
      expect(bars).toHaveLength(8);
      expect(careerBars).toHaveLength(8);
      careerBars.forEach((bar, index) => {
        const box = bars[index];
        expect(box, bar.id).toBeDefined();
        expect(Math.abs((box?.width ?? 0) - bar.width * (track?.width ?? 0)), `${bar.id} width at ${width}`).toBeLessThanOrEqual(1);
        expect(Math.abs((box?.left ?? 0) - bar.start * (track?.width ?? 0)), `${bar.id} left at ${width}`).toBeLessThanOrEqual(1);
      });
      // Proportional to months: the width per month is the same for every bar, to a pixel's worth.
      const perMonth = bars.map((box, index) => box.width / (careerBars[index]?.months ?? 1));
      expect(Math.max(...perMonth) - Math.min(...perMonth)).toBeLessThanOrEqual(0.2);
      // The current role is the last bar and ends at the track's right edge.
      expect(Math.abs((bars.at(-1)?.right ?? 0) - (track?.right ?? 0))).toBeLessThanOrEqual(1);
      const months = careerBars.map((bar) => bar.months);
      expect(months).toEqual([15, 39, 11, 12, 10, 93, 8, Math.round((NOW - ym(2026, 3)) * 12)]);
    }
  });

  test('draws a name inside its bar only where it fits, and every role is named at every width', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const inside: number[] = [];
    for (const width of [640, 834, 1440, 1920]) {
      await openAt(page, '/?gl=off', width);
      const state = await page.locator(DRAWN).evaluateAll((items) =>
        items.map((item) => {
          const label = item.querySelector<HTMLElement>('[data-fit]');
          const out = item.querySelector<HTMLElement>('[data-lane]');
          const named = label && getComputedStyle(label).display !== 'none' ? label : null;
          const lane = out && getComputedStyle(out).display !== 'none' ? out : null;
          return {
            id: (item as HTMLElement).dataset.bar ?? '',
            inside: named ? named.scrollWidth <= (named.parentElement?.clientWidth ?? 0) : false,
            lane: lane ? lane.dataset.lane : null,
            both: Boolean(named && lane),
          };
        }),
      );
      expect(state, `${width} px`).toHaveLength(8);
      for (const entry of state) {
        expect(entry.inside || entry.lane !== null, `${entry.id} is named at ${width} px`).toBe(true);
        expect(entry.both, `${entry.id} is named once at ${width} px`).toBe(false);
      }
      inside.push(state.filter((entry) => entry.inside).length);
    }
    expect(inside[3], 'a wide screen names more inside the bars').toBeGreaterThan(inside[0] ?? 0);
  });

  test('names set in lanes never run into one another, and no leader runs through a name', async ({ page }) => {
    expect(LABEL_CONFLICTS, 'the lane layout in lib/timeline.ts has no collision').toBe(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [640, 834, 1440]) {
      await openAt(page, '/?gl=off', width);
      const names = await page.locator(`${SCALE} [data-lane]`).evaluateAll((lanes) =>
        lanes.flatMap((lane) => {
          if (getComputedStyle(lane).display === 'none') return [];
          const text = lane.firstElementChild as HTMLElement;
          const range = document.createRange();
          range.selectNodeContents(text);
          const glyphs = range.getBoundingClientRect();
          const leader = lane.getBoundingClientRect().left;
          return [{ id: lane.closest('li')?.dataset.bar ?? '', left: glyphs.left, right: glyphs.right, top: glyphs.top, bottom: glyphs.bottom, leader }];
        }),
      );
      expect(names.length, `${width} px has names in lanes`).toBeGreaterThan(0);
      for (const [index, one] of names.entries()) {
        for (const two of names.slice(index + 1)) {
          const apart = one.right <= two.left || two.right <= one.left || one.bottom <= two.top || two.bottom <= one.top;
          expect(apart, `${one.id} and ${two.id} at ${width} px`).toBe(true);
        }
        for (const other of names) {
          if (other === one || other.top >= one.top) continue;
          expect(one.leader <= other.left || one.leader >= other.right, `${one.id}'s leader through ${other.id} at ${width} px`).toBe(true);
        }
      }
    }
  });

  test('below 640 px a chip of at least 44 px names and opens every role, and the bars are not in the way', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const width of [320, 390]) {
      await openAt(page, '/?gl=off', width);
      await expect(page.locator(BARS).first()).toBeHidden();
      await expect(page.locator(CHIPS)).toHaveCount(8);
      const chips = await boxes(page, CHIPS);
      const heights = await page.locator(CHIPS).evaluateAll((links) => links.map((link) => link.getBoundingClientRect().height));
      for (const [index, box] of chips.entries()) {
        expect(box.width, `${careerBars[index]?.id} chip width at ${width}`).toBeGreaterThanOrEqual(44);
        expect(heights[index], `${careerBars[index]?.id} chip height at ${width}`).toBeGreaterThanOrEqual(44);
      }
      const caption = await page.locator(`${SCALE} p`).first().innerText();
      expect(caption, 'the current role, in words').toContain(careerBars.at(-1)?.label ?? '');
      expect(caption).toContain('March 2026');
      await page.locator(`${CHIPS}[data-role="microsoft"]`).click();
      await expect(page.getByRole('dialog', { name: roles.find((role) => role.id === 'microsoft')?.title ?? '' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator(`${CHIPS}[data-role="microsoft"]`)).toBeFocused();
    }
  });

  test('every bar is reachable by Tab and by the arrow keys, and opens its own role', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    const first = page.locator(BARS).first();

    // Tab walks the bars in date order after the readings that precede them.
    await page.getByRole('link', { name: 'Email' }).focus();
    const visited: string[] = [];
    for (let press = 0; press < 14 && visited.length < careerBars.length; press += 1) {
      await page.keyboard.press('Tab');
      const role = await page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.role ?? null);
      if (role) visited.push(role);
    }
    expect(visited).toEqual(careerBars.map((bar) => bar.id));

    // Arrow keys move between bars and stop at the ends; Home and End jump.
    await first.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(BARS).nth(1)).toBeFocused();
    await page.keyboard.press('End');
    await expect(page.locator(BARS).last()).toBeFocused();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator(BARS).last()).toBeFocused();
    await page.keyboard.press('Home');
    await expect(first).toBeFocused();

    // Enter opens the role in the panel; Escape closes it and focus returns to the bar.
    for (const bar of careerBars) {
      const role = roles.find((entry) => entry.id === bar.id);
      const trigger = page.locator(`${BARS}[data-role="${bar.id}"]`);
      await trigger.focus();
      await page.keyboard.press('Enter');
      const dialog = page.getByRole('dialog', { name: role?.title ?? '' });
      await expect(dialog, bar.id).toBeVisible();
      await expect(dialog.getByRole('heading', { level: 3, name: role?.title ?? '' })).toBeVisible();
      await expect(dialog.getByText(role?.achievements[0] ?? '', { exact: false })).toBeVisible();
      expect(await page.evaluate(() => window.location.hash)).toBe(`#career-${bar.id}`);
      await page.keyboard.press('Escape');
      await expect(dialog, bar.id).toBeHidden();
      await expect(trigger).toBeFocused();
    }
  });

  test('a click or tap on a bar opens that role, and Next steps along the career', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    await page.locator(`${BARS}[data-role="anz"]`).click();
    const dialog = page.getByRole('dialog', { name: roles.find((role) => role.id === 'anz')?.title ?? '' });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Next' }).click();
    await expect(page.getByRole('dialog', { name: roles.find((role) => role.id === 'independent')?.title ?? '' })).toBeVisible();
  });
});

test.describe('the three readings', { tag: '@desktop' }, () => {
  const counts = { evidence: 200, portfolio: 40, telemetry: 10_000 } as const;

  test('are drawn by the stage from the figures’ own counts', async ({ page }) => {
    const problems = watchConsole(page);
    await openAt(page, '/?gl=high', 1440);
    await stageReady(page);
    await expect(page.locator('[data-stage-view][data-ready="true"]')).toHaveCount(5);
    await page.evaluate(() => window.__stage?.seek(10_000));
    const info = await page.evaluate(() => window.__stage?.info());
    expect(info?.tier).toBe('high');
    const telemetry = await telemetryDrawn(page);
    expect(telemetry.drawn * telemetry.unit, 'telemetry draws every one of 10,000 devices, as points or as blocks of 100').toBe(10_000);
    expect(info?.points, 'the marks of telemetry and the 40 of the portfolio').toBe(telemetry.drawn + 40);
    expect(info?.calls).toBeLessThanOrEqual(40);
    expect(info?.points).toBeLessThanOrEqual(12_000);
    expect(info?.lines).toBeLessThanOrEqual(10_000);
    expect(info?.triangles).toBeLessThanOrEqual(60_000);

    for (const figure of headlineFigures) {
      const view = page.locator(`[data-stage-view="reading-${figure.id}"]`);
      await expect(view, figure.id).toHaveAttribute('data-ready', 'true');
      if (figure.id !== 'telemetry') await expect(view, figure.id).toHaveAttribute('data-drawn', String(counts[figure.id]));
      await expect(view, figure.id).toHaveAttribute('data-marks', String(figure.marks.count));
    }
    expect(problems).toEqual([]);
  });

  test('draw their counts up over the entrance and rest on the final numbers', async ({ page }) => {
    await openAt(page, '/?gl=high', 1440);
    await stageReady(page);
    await expect(page.locator('[data-stage-view][data-ready="true"]')).toHaveCount(5);
    const { drawn } = await telemetryDrawn(page);
    const final = drawn + 40;
    const points: number[] = [];
    for (const ms of [0, 300, 600, 800, 1200, 1500]) {
      points.push((await page.evaluate((at) => {
        window.__stage?.seek(at);
        return window.__stage?.info().points;
      }, ms)) ?? -1);
    }
    expect(points[0], 'nothing is drawn at 0 ms').toBe(0);
    expect(points[3], 'the count is part way at 800 ms').toBeGreaterThan(0);
    expect(points[3]).toBeLessThan(final);
    expect(points.at(-1), 'every mark is drawn by 1500 ms').toBe(final);
    expect([...points].sort((a, b) => a - b)).toEqual(points);
  });

  test('draw the same counts with ?gl=off, in the SVG and HTML fallback', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    await page.evaluate(() => window.__stage?.ready);
    await expect(page.locator('canvas')).toHaveCount(0);

    // Telemetry: one lattice element, laid out by `readingLayout` in whole device pixels, and 10,000 devices in all.
    const lattice = page.locator('[data-reading="telemetry"][data-place="card"] [class*="Readings_lattice__"]');
    await expect(lattice).toHaveCount(1);
    const tile = page.locator('[data-reading="telemetry"][data-place="card"]');
    const layout = await tile.evaluate((element: HTMLElement) => {
      const box = element.getBoundingClientRect();
      return { width: box.width - (element.offsetWidth - element.clientWidth), height: box.height - (element.offsetHeight - element.clientHeight), mode: element.dataset.mode };
    });
    const expected = readingLayout('telemetry', { width: layout.width, height: layout.height, ratio: 1 });
    expect(layout.mode, 'the tile says what it draws').toBe(expected.mode);
    expect(expected.drawn * expected.unit, '100 blocks of 100, or 10,000 points').toBe(10_000);
    const drawn = await lattice.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return { width: box.width, height: box.height };
    });
    expect(Math.abs(drawn.width - expected.frame.width), 'the lattice is the width the layout gives').toBeLessThanOrEqual(1);
    expect(Math.abs(drawn.height - expected.frame.height)).toBeLessThanOrEqual(1);

    // Every one of the 200 cells stays, and the fill of each falls to about 15 of 180 minutes.
    const cells = page.locator('[data-stage-view="reading-evidence"] > div > div > span');
    await expect(cells).toHaveCount(200);
    const rest = await cells.first().evaluate((cell) => Number(getComputedStyle(cell.parentElement as Element).getPropertyValue('--rest')));
    expect(rest).toBeCloseTo(15 / 180, 3);
    await entranceDone(page);
    const clips = await cells.evaluateAll((all) => all.map((cell) => getComputedStyle(cell, '::after').clipPath));
    expect(clips.length, 'no cell falls away: each keeps its fill').toBe(200);
    for (const clip of clips) {
      const left = /max\((\d+(?:\.\d+)?)%, \d+px\)/.exec(clip);
      expect(Number(left?.[1]) / 100, `the fill has fallen to about 15 of 180 minutes: ${clip}`).toBeCloseTo(15 / 180, 3);
    }

    // The cohort: 40 marks as one group on one baseline, with no squads drawn.
    const marks = page.locator('[data-stage-view="reading-portfolio"] > div > div > span');
    await expect(marks).toHaveCount(40);
  });

  for (const gl of ['high', 'off'] as const) {
    test(`each opens its story in the panel (?gl=${gl})`, async ({ page }) => {
      await openAt(page, `/?gl=${gl}`, 1440);
      for (const figure of headlineFigures) {
        await page.locator(`[data-detail-trigger="figure-${figure.id}"]`).click();
        const dialog = page.getByRole('dialog', { name: figure.label });
        await expect(dialog, figure.id).toBeVisible();
        await expect(dialog.getByText(figure.story.slice(0, 40), { exact: false })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(dialog, figure.id).toBeHidden();
      }
    });
  }

  test('keep the figures and their scope on the page', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    const readings = page.locator('#proof ul > li');
    await expect(readings).toHaveCount(3);
    for (const [index, figure] of headlineFigures.entries()) {
      const text = (await readings.nth(index).textContent()) ?? '';
      expect(text).toContain(figure.label);
      expect(text).toContain(figure.scope);
    }
  });
});

test.describe('the hero is compact', () => {
  test('is one screen at 1440 by 900 and keeps its copy inside the word budget', { tag: '@desktop' }, async ({ page }) => {
    await open(page, '/?gl=off');
    await page.evaluate(() => document.fonts.ready);
    const box = await page.locator(HERO).evaluate((hero) => {
      const { top, bottom, height } = hero.getBoundingClientRect();
      return { top: top + window.scrollY, bottom: bottom + window.scrollY, height };
    });
    expect(box.height, 'hero height').toBeLessThanOrEqual(900);
    expect(box.bottom, 'the scale is on the first screen').toBeLessThanOrEqual(900);
    const words = await visibleWordCounts(page, ['top']);
    expect(words.top, 'words in the introduction').toBeLessThanOrEqual(45);
  });

  test('is at most 1.6 screens at 390 by 844', { tag: '@mobile' }, async ({ page }) => {
    await open(page, '/?gl=off');
    await page.evaluate(() => document.fonts.ready);
    const height = await page.locator(HERO).evaluate((hero) => hero.getBoundingClientRect().height);
    expect(height, 'hero height').toBeLessThanOrEqual(1350);
    const words = await visibleWordCounts(page, ['top']);
    expect(words.top).toBeLessThanOrEqual(45);
  });

  for (const [width, height] of [
    [1280, 720],
    [1366, 768],
    [1440, 900],
    [1920, 1080],
  ] as const) {
    test(`is exactly one screen under the header at ${width} by ${height}, with the scale on the bottom edge and nothing cut by the fold`, { tag: '@desktop' }, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openAt(page, '/?gl=off', width, height);
      const header = await page.getByRole('banner').evaluate((element) => element.getBoundingClientRect().bottom);
      const measured = await page.evaluate((heroSelector) => {
        const rect = (selector: string) => {
          const box = document.querySelector(selector)?.getBoundingClientRect();
          return box ? { top: box.top, bottom: box.bottom } : null;
        };
        const cut = Array.from(document.querySelectorAll('#top *, #proof *, [data-career-scale] *'))
          .filter((element) => getComputedStyle(element).display !== 'none')
          .flatMap((element) => {
            const range = document.createRange();
            range.selectNodeContents(element);
            const own = Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
            return (own ? Array.from(range.getClientRects()) : []).map((box) => ({ top: box.top, bottom: box.bottom, text: element.textContent?.slice(0, 24) ?? '' }));
          })
          .filter((box) => box.top < window.innerHeight - 1 && box.bottom > window.innerHeight + 1);
        return { hero: rect(heroSelector), top: rect('#top'), proof: rect('#proof'), scale: rect('[data-career-scale]'), cut };
      }, HERO);
      expect(measured.hero?.top, 'the hero starts under the header').toBeCloseTo(header, 0);
      expect(measured.hero?.bottom, 'and ends on the bottom edge of the screen').toBeCloseTo(height, 0);
      expect(measured.scale?.bottom, 'the scale stands on that edge').toBeCloseTo(height, 0);
      expect(measured.top?.bottom ?? height, '#top is inside the first screen').toBeLessThanOrEqual(height);
      expect(measured.proof?.bottom ?? height, '#proof is inside the first screen').toBeLessThanOrEqual(measured.scale?.top ?? 0);
      expect(measured.cut, 'no text is cut by the fold').toEqual([]);
    });

    test(`holds its place while the page is still being parsed at ${width} by ${height}`, { tag: '@desktop' }, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await openAt(page, '/?gl=off', width, height);
      const probes = ['#top h1', '#top', '#proof'];
      const place = () =>
        page.evaluate((selectors) => selectors.map((selector) => {
          const box = document.querySelector(selector)?.getBoundingClientRect();
          return box ? [Math.round(box.left * 10) / 10, Math.round(box.top * 10) / 10] : null;
        }), probes);
      const settled = await place();
      // Cut the document the way a slow parse does: after the headline, then after the readings.
      for (const cut of ['#top h1', '#proof']) {
        await page.evaluate((selector) => {
          for (let node: Node | null = document.querySelector(selector); node && node !== document.body; node = node.parentNode) {
            while (node.nextSibling) node.nextSibling.remove();
          }
        }, cut);
        const after = await place();
        after.forEach((position, index) => {
          if (position) expect(position, `${probes[index]} after ${cut}`).toEqual(settled[index]);
        });
      }
    });
  }

  test('holds a single h1 and no separate proof section', { tag: '@desktop' }, async ({ page }) => {
    await open(page, '/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    // The readings live in the hero, and #proof is their anchor.
    const together = await page.evaluate(
      () => document.querySelector('#proof')?.closest('main > div') === document.querySelector('#top')?.closest('main > div'),
    );
    expect(together, '#proof sits inside the hero').toBe(true);
    await expect(page.locator('section#proof')).toHaveCount(1);
    expect(await page.locator('main > div').count(), 'the hero is one block of the page').toBeGreaterThanOrEqual(1);

    await page.goto('/#proof');
    await page.waitForFunction(() => window.location.hash === '#proof' && document.querySelector('#proof')?.getBoundingClientRect().top !== undefined);
    const anchor = await page.locator('#proof').evaluate((element) => element.getBoundingClientRect().top);
    expect(anchor, '#proof resolves to the readings').toBeLessThan(900);
  });

  test('leaves nothing of the old proof section or career scale behind', { tag: '@desktop' }, () => {
    for (const path of [
      'components/sections/Proof',
      'components/sections/Hero/CareerScale.tsx',
      'components/sections/Hero/CareerScale.module.css',
      'components/sections/Hero/careerScale.ts',
    ]) {
      expect(existsSync(path), path).toBe(false);
    }
  });
});

interface Group {
  start: number;
  end: number;
}

test.describe('the entrance', { tag: '@desktop' }, () => {
  test('arrives in the written order and is over within a section’s 1.2 s', async ({ page }) => {
    await open(page, '/?gl=off');
    const groups = await page.evaluate(() => {
      const found: Record<string, Group[]> = {};
      const add = (key: string, animation: Animation) => {
        const timing = animation.effect?.getComputedTiming();
        if (!timing) return;
        const start = Number(timing.delay ?? 0);
        (found[key] ??= []).push({ start, end: start + Number(timing.duration ?? 0) });
      };
      for (const animation of document.getAnimations()) {
        const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
        if (!(target instanceof Element)) continue;
        if (target.closest('[data-stage-view="hero-field"]')) add('field', animation);
        else if (target.tagName === 'H1') add('headline', animation);
        else if (target.closest('#top') && target.tagName === 'P' && target.textContent?.startsWith('15+')) add('line', animation);
        else if (target.closest('#top') && ['A', 'UL'].includes(target.tagName)) add('actions', animation);
        else if (target.closest('#proof') && target.tagName === 'LI') add('readings', animation);
        else if (target.closest('[data-career-scale]')) add('scale', animation);
      }
      return found;
    });
    const span = (key: string): Group => {
      const list = groups[key] ?? [];
      expect(list.length, `${key} animates`).toBeGreaterThan(0);
      return { start: Math.min(...list.map((g) => g.start)), end: Math.max(...list.map((g) => g.end)) };
    };
    const order = ['field', 'headline', 'line', 'actions', 'readings', 'scale'].map((key) => ({ key, ...span(key) }));
    for (let index = 1; index < order.length; index += 1) {
      const before = order[index - 1];
      const here = order[index];
      expect(here?.start, `${here?.key} starts after ${before?.key}`).toBeGreaterThan(before?.start ?? 0);
    }
    const end = Math.max(...order.map((entry) => entry.end));
    expect(end, 'every animation is over').toBeLessThanOrEqual(1200);
    expect(ENTRANCE_END, 'the table agrees').toBeLessThanOrEqual(1200);
    expect(end).toBeLessThanOrEqual(ENTRANCE_END);
  });

  test('seeked frames at 0, 300, 600, 900, 1200 and 1500 ms show it, and nothing pops or shifts', async ({ page }) => {
    await page.addInitScript(() => {
      const shifts = { value: 0, nodes: [] as string[] };
      (window as unknown as { __shifts: typeof shifts }).__shifts = shifts;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: { node: Node | null }[] };
          if (shift.hadRecentInput) continue;
          shifts.value += shift.value;
          for (const source of shift.sources ?? []) shifts.nodes.push(source.node instanceof Element ? `${source.node.tagName}.${source.node.className}` : 'text');
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    // The first visit warms the cache, so the fonts are in place when the page under test paints
    // and the only motion measured is the entrance's own.
    await openAt(page, '/?gl=high', 1440);
    await page.reload();
    await hydrated(page);
    await stageReady(page);
    await entranceDone(page);

    const stateAt = (selector: string, ms: number) =>
      page.evaluate(
        ([target, at]) => {
          for (const animation of document.getAnimations()) {
            if (animation.timeline !== document.timeline) continue;
            animation.pause();
            animation.currentTime = Number(at);
          }
          window.__stage?.seek(Number(at));
          const element = document.querySelector(String(target));
          if (!element) return { opacity: -1, lift: -1 };
          const style = getComputedStyle(element);
          return { opacity: Number(style.opacity), lift: style.transform === 'none' ? 0 : new DOMMatrixReadOnly(style.transform).m42 };
        },
        [selector, ms] as const,
      );
    const opacityAt = async (selector: string, ms: number) => (await stateAt(selector, ms)).opacity;

    // The headline is the largest thing on the first screen, so it is never held at opacity 0: it
    // is painted from the first frame, 12 px low, and lifts into place. The eyebrow fades, the
    // line rises as it fades and the actions settle, so no two arrive the same way.
    const headline = '#top h1';
    const readings = '#proof ul > li:first-child';
    const first = await stateAt(headline, 0);
    expect(first.opacity, 'the headline is painted from the first frame').toBe(1);
    expect(first.lift, 'and sits low, ready to lift').toBeGreaterThan(8);
    const lifting = await stateAt(headline, 300);
    expect(lifting.lift).toBeLessThan(first.lift);
    expect(lifting.lift).toBeGreaterThan(0);
    expect(await opacityAt('#top p', 0), 'the eyebrow waits for the field').toBe(0);
    expect(await opacityAt(readings, 300), 'the readings are not yet there at 300 ms').toBe(0);
    expect(await opacityAt(readings, 900)).toBeGreaterThan(0.9);
    expect((await stateAt(headline, 1500)).lift).toBe(0);
    expect(await opacityAt(readings, 1500)).toBe(1);

    const clip = await page.locator(`${SCALE} [data-ruler]`).evaluate((ruler) => getComputedStyle(ruler).clipPath);
    expect(clip, 'the scale is fully drawn by 1500 ms').not.toMatch(/[1-9]\d*%/);

    const shift = await page.evaluate(() => (window as unknown as { __shifts: { value: number; nodes: string[] } }).__shifts);
    expect(shift.value, `layout shift over the whole entrance: ${shift.nodes.join(', ')}`).toBe(0);
  });
});

test.describe('reduced motion and the Motion off control', { tag: '@desktop' }, () => {
  async function expectFinalState(page: Page): Promise<void> {
    await stageReady(page);
    const state = await page.evaluate(() => {
      const hero = document.querySelector('main > div');
      const running = document.getAnimations().filter((animation) => hero?.contains(animation.effect instanceof KeyframeEffect ? animation.effect.target : null));
      const opacity = (selector: string) => Number(getComputedStyle(document.querySelector(selector) as Element).opacity);
      return {
        running: running.length,
        headline: opacity('#top h1'),
        reading: opacity('#proof ul > li:last-child'),
        ruler: getComputedStyle(document.querySelector('[data-career-scale] [data-ruler]') as Element).clipPath,
        info: window.__stage?.info(),
        drawn: Number(document.querySelector('[data-stage-view="reading-telemetry"]')?.getAttribute('data-drawn')),
      };
    });
    expect(state.running, 'nothing animates').toBe(0);
    expect(state.headline).toBe(1);
    expect(state.reading).toBe(1);
    expect(state.ruler).not.toMatch(/[1-9]\d*%/);
    expect(state.info?.tier).toBe('still');
    expect(state.info?.points, 'the stage shows the finished readings at once').toBe(state.drawn + 40);
  }

  test('show the final state at once under prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await open(page, '/?gl=high');
    await expectFinalState(page);
  });

  test('show the final state at once with ?motion=off', async ({ page }) => {
    await open(page, '/?motion=off&gl=high');
    await expectFinalState(page);
  });
});

test.describe('interaction states', { tag: '@desktop' }, () => {
  test('every control answers a hover, a focus and a press', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openAt(page, '/?gl=off', 1440);
    const style = (selector: string, property: string) =>
      page.locator(selector).first().evaluate((element, name) => getComputedStyle(element).getPropertyValue(name), property);

    // A reading's card: hover changes its border, focus draws the ring, the press changes its text row.
    const card = '#proof a';
    const border = await style(card, 'border-top-color');
    await page.locator(card).first().hover();
    await page.waitForTimeout(350);
    expect(await style(card, 'border-top-color'), 'card hover').not.toBe(border);

    // A bar: hover and focus change its fill; a press squeezes it.
    const fill = `${SCALE} [data-bar="anz"] > span:nth-of-type(1)`;
    const rest = await style(fill, 'background-color');
    await page.locator(`${BARS}[data-role="anz"]`).hover();
    await page.waitForTimeout(350);
    expect(await style(fill, 'background-color'), 'bar hover').not.toBe(rest);
    await page.mouse.down();
    await page.waitForTimeout(200);
    expect(await style(fill, 'scale'), 'bar press').not.toBe('none');
    await page.mouse.move(5, 300);
    await page.mouse.up();

    await page.locator(`${BARS}[data-role="anz"]`).focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    expect(await style(fill, 'box-shadow'), 'bar focus').not.toBe('none');
    expect(await style(`${BARS}[data-role="anz"]`, 'outline-style'), 'the ring is drawn inside the bar').toBe('none');

    // The actions and the links.
    const primary = '#top a[href="#work"]';
    await page.locator(primary).hover();
    await page.mouse.down();
    await page.waitForTimeout(250);
    expect(await style(primary, 'scale'), 'action press').not.toBe('none');
    await page.mouse.move(5, 300);
    await page.mouse.up();
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    expect(await page.evaluate(() => getComputedStyle(document.activeElement as Element).outlineStyle)).not.toBe('none');
  });
});

test.describe('the hero is healthy at every width and in both themes', { tag: '@desktop' }, () => {
  for (const theme of ['dark', 'light'] as const) {
    for (const width of WIDTHS) {
      test(`${width} px, ${theme}: no console error, no overflow, nothing under 13 px`, async ({ page }) => {
        const problems = watchConsole(page);
        await page.addInitScript((value) => {
          try {
            window.localStorage.setItem('theme', value);
          } catch {
            // Storage can be unavailable.
          }
        }, theme);
        await page.emulateMedia({ colorScheme: theme });
        await openAt(page, '/?gl=high', width);
        await stageReady(page);
        await page.evaluate(() => window.__stage?.seek(10_000));
        const state = await page.evaluate(() => {
          const hero = document.querySelector('main > div') as HTMLElement;
          const small: string[] = [];
          for (const element of hero.querySelectorAll('*')) {
            if (!(element instanceof HTMLElement) || element.closest('[aria-hidden="true"]')) continue;
            const text = Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '');
            if (text && Number.parseFloat(getComputedStyle(element).fontSize) < 13) small.push(`${element.tagName}.${element.className}`);
          }
          return {
            scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            small,
            theme: document.documentElement.dataset.theme ?? null,
            tier: window.__stage?.info().tier,
          };
        });
        expect(state.scroll).toBeLessThanOrEqual(0);
        expect(state.small).toEqual([]);
        expect(state.tier).toBe('high');
        expect(problems).toEqual([]);
      });
    }
  }
});

test.describe('the first screen paints its own heading first', { tag: '@desktop' }, () => {
  for (const width of [390, 834, 1440]) {
    test(`the largest contentful paint is the h1 at ${width} px, with the entrance running`, async ({ page }) => {
      await page.addInitScript(() => {
        const seen: string[] = [];
        (window as unknown as { __lcp: string[] }).__lcp = seen;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const element = (entry as PerformanceEntry & { element: Element | null }).element;
            seen.push(element ? `${element.tagName.toLowerCase()}#${element.id}` : 'none');
          }
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      });
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/?gl=high');
      await page.waitForTimeout(3000);
      const seen = await page.evaluate(() => (window as unknown as { __lcp: string[] }).__lcp);
      expect(seen.length, 'the browser reports a largest paint').toBeGreaterThan(0);
      expect(seen.at(-1), `every candidate in order: ${seen.join(', ')}`).toBe('h1#top-title');
    });
  }
});

test.describe('without JavaScript the hero looks finished', { tag: '@desktop' }, () => {
  test.use({ javaScriptEnabled: false });

  for (const width of [1440, 390]) {
    test(`at ${width} px the type starts the first screen and every panel sits inside the gutters`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const measured = await page.evaluate(() => {
        const rect = (selector: string) => document.querySelector(selector)?.getBoundingClientRect();
        const gutter = Number.parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gutter')) || 0;
        const panels = Array.from(document.querySelectorAll<HTMLElement>('[data-detail-item]')).map((item) => {
          const box = item.getBoundingClientRect();
          const measure = Math.max(0, ...Array.from(item.querySelectorAll('p')).map((paragraph) => paragraph.getBoundingClientRect().width));
          return { id: item.id, left: box.left, right: box.right, width: measure };
        });
        const scale = rect('[data-career-scale]');
        const firstPanel = rect('#figure-evidence');
        return {
          eyebrow: rect('#top p')?.top ?? -1,
          h1: rect('#top h1')?.top ?? -1,
          width: document.documentElement.clientWidth,
          scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          gutter,
          panels,
          scaleBottom: scale?.bottom ?? -1,
          figuresTop: firstPanel?.top ?? -1,
        };
      });
      expect(measured.h1, 'the headline is in the top of the first screen').toBeLessThanOrEqual(200);
      expect(measured.eyebrow, 'the eyebrow is under the header').toBeGreaterThan(56);
      expect(measured.scroll).toBeLessThanOrEqual(0);
      expect(measured.panels).toHaveLength(11);
      for (const panel of measured.panels) {
        expect(panel.left, `${panel.id} starts inside the gutter`).toBeGreaterThanOrEqual(measured.gutter - 1);
        expect(panel.right, `${panel.id} ends inside the gutter`).toBeLessThanOrEqual(measured.width - measured.gutter + 1);
        expect(panel.width, `${panel.id} reads at a readable measure`).toBeLessThanOrEqual(820);
      }
      expect(measured.figuresTop, 'the figure stories follow the career scale').toBeGreaterThan(measured.scaleBottom);
    });
  }
});

test.describe('the pieces of the first screen keep to their places', { tag: '@desktop' }, () => {
  test('the three readings sit side by side on a tablet, all on the first screen', async ({ page }) => {
    await openAt(page, '/?gl=off', 834);
    await entranceDone(page);
    const cards = await boxes(page, '#proof ul > li');
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      expect(card.left).toBeGreaterThanOrEqual(0);
      expect(card.right, 'inside the screen').toBeLessThanOrEqual(834);
    }
    expect(cards[1]?.left).toBeGreaterThan(cards[0]?.right ?? 0);
    expect(cards[2]?.left).toBeGreaterThan(cards[1]?.right ?? 0);
    const tops = await page.locator('#proof ul > li').evaluateAll((items) => items.map((item) => item.getBoundingClientRect().top));
    expect(new Set(tops.map(Math.round)).size, 'one row').toBe(1);
  });

  test('a bar’s tip stands in the scale’s own band and never covers a link or leaves the screen', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openAt(page, '/?gl=off', 1440);
    await page.locator(`${BARS}[data-role="infocentric"]`).hover();
    const tip = await page.locator(`${SCALE} [data-bars] [data-bar="infocentric"] > span:last-child`).evaluate((element) => {
      const box = element.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, shown: getComputedStyle(element).display !== 'none' };
    });
    expect(tip.shown).toBe(true);
    expect(tip.top, 'inside the screen, above').toBeGreaterThanOrEqual(0);
    expect(tip.bottom, 'inside the screen, below').toBeLessThanOrEqual(900);
    const bar = await page.locator(`${BARS}[data-role="infocentric"]`).evaluate((element) => element.getBoundingClientRect().top);
    expect(tip.bottom, 'standing on its bar').toBeLessThanOrEqual(bar);
    const links = await page.locator('#top a').evaluateAll((all) =>
      all.map((link) => {
        const box = link.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
      }),
    );
    for (const link of links) {
      const apart = tip.right <= link.left || tip.left >= link.right || tip.bottom <= link.top || tip.top >= link.bottom;
      expect(apart, 'clear of the hero links').toBe(true);
    }
  });
});

test.describe('the detail panels lead with a visual and open with focus inside', { tag: '@desktop' }, () => {
  test('a figure panel leads with its own reading and a key, and a role panel with the career axis', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    for (const figure of headlineFigures) {
      await page.locator(`[data-detail-trigger="figure-${figure.id}"]`).click();
      const dialog = page.getByRole('dialog', { name: figure.label });
      await expect(dialog).toBeVisible();
      const order = await dialog.evaluate((element) => {
        const item = element.querySelector('[data-detail-item][data-active="true"]');
        const visual = item?.querySelector('figure');
        const heading = item?.querySelector('h3');
        return { visual: visual?.getBoundingClientRect().top ?? -1, heading: heading?.getBoundingClientRect().top ?? -1, key: visual?.querySelector('figcaption')?.textContent ?? '' };
      });
      expect(order.visual, `${figure.id}: the reading is above the title`).toBeLessThan(order.heading);
      expect(order.key).toBe(figure.key);
      await page.keyboard.press('Escape');
    }
    await page.locator(`${BARS}[data-role="ato"]`).click();
    const role = page.getByRole('dialog', { name: roles.find((entry) => entry.id === 'ato')?.title ?? '' });
    await expect(role).toBeVisible();
    const lead = await role.evaluate((element) => {
      const item = element.querySelector('[data-detail-item][data-active="true"]');
      const axis = item?.querySelector('svg');
      const heading = item?.querySelector('h3');
      const open = item?.querySelectorAll('li').length ?? 0;
      return { axis: axis?.getBoundingClientRect().top ?? -1, heading: heading?.getBoundingClientRect().top ?? -1, open };
    });
    expect(lead.axis, 'the axis is above the title').toBeLessThan(lead.heading);
    await expect(role.locator('[data-detail-item][data-active="true"]').getByText('More', { exact: true })).toBeVisible();
    const ato = roles.find((entry) => entry.id === 'ato');
    for (const line of ato?.achievements ?? []) expect(await role.textContent(), 'nothing is lost to More').toContain(line.slice(0, 30));
  });

  for (const width of [1440, 390]) {
    test(`a deep link to a role opens it with focus inside the dialog at ${width} px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/?gl=off#career-microsoft');
      await hydrated(page);
      await expect(page.getByRole('dialog', { name: roles.find((entry) => entry.id === 'microsoft')?.title ?? '' })).toBeVisible();
      await expect.poll(() => page.evaluate(() => document.querySelector('dialog[open]')?.contains(document.activeElement) ?? false)).toBe(true);
    });
  }

  test('a panel grows out of its card: the dialog carries the morph, the card is gone before the panel comes in', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    const seen = await page.evaluate(async () => {
      const trigger = document.querySelector<HTMLElement>('[data-detail-trigger="figure-evidence"]');
      trigger?.click();
      const names = new Set<string>();
      const pseudos = new Set<string>();
      // Frames can be slow under software rendering, so the morph is followed until it has ended.
      const end = performance.now() + 10_000;
      let started = false;
      while (performance.now() < end) {
        await new Promise((resolve) => requestAnimationFrame(resolve));
        const running = document.documentElement.dataset.vt === 'detail';
        if (running) started = true;
        if (started && !running) break;
        const dialog = document.querySelector('dialog[open]');
        if (dialog) names.add(getComputedStyle(dialog).getPropertyValue('view-transition-name'));
        for (const animation of document.getAnimations()) {
          const effect = animation.effect as KeyframeEffect | null;
          const name = (animation as CSSAnimation).animationName;
          if (effect?.pseudoElement?.includes('detail-morph')) pseudos.add(`${effect.pseudoElement}:${name}`);
        }
      }
      const dialog = document.querySelector('dialog[open]');
      return { names: [...names], pseudos: [...pseudos], after: dialog ? getComputedStyle(dialog).getPropertyValue('view-transition-name') : '' };
    });
    expect(seen.names, 'the dialog is what is named during the morph').toContain('detail-morph');
    expect(seen.after, 'and unnamed once it ends').toBe('none');
    expect(seen.pseudos).toContain('::view-transition-old(detail-morph):morph-out');
    expect(seen.pseudos).toContain('::view-transition-new(detail-morph):morph-in');
  });
});

test.describe('nothing on the first screen shifts', { tag: '@desktop' }, () => {
  test('the first paint waits until the whole hero is parsed, so a page that arrives in pieces never paints it half built or starts its entrance in two parts', async ({ page }) => {
    await page.goto('/?gl=off');
    const expectation = await page.evaluate(() => {
      const link = document.querySelector('head link[rel="expect"]');
      return { href: link?.getAttribute('href'), blocking: link?.getAttribute('blocking') };
    });
    expect(expectation).toEqual({ href: '#work', blocking: 'render' });
    // The element it waits for starts the next section, so the whole hero comes before it.
    const order = await page.evaluate(() => {
      const hero = document.querySelector('main > div:first-child');
      const next = document.getElementById('work');
      return Boolean(hero && next && hero.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(order, '#work follows the hero').toBe(true);
  });

  test('layout shift while the hero loads and the page is scrolled through under CPU throttling stays under 0.05, with the node named if it does not', async ({ page }) => {
    await page.addInitScript(() => {
      const record = { value: 0, nodes: [] as string[] };
      (window as unknown as { __cls: typeof record }).__cls = record;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: { node: Node | null }[] };
          if (shift.hadRecentInput) continue;
          record.value += shift.value;
          for (const source of shift.sources ?? []) {
            const node = source.node;
            record.nodes.push(node instanceof Element ? `${node.tagName.toLowerCase()}${node.id ? `#${node.id}` : ''}.${String(node.className).slice(0, 40)}` : 'text');
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    const session = await page.context().newCDPSession(page);
    await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.emulateMedia({ colorScheme: 'light' });
    await openAt(page, '/?gl=high', 1440);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let step = 0; step <= 10; step += 1) {
      await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), Math.round(((total - 900) * step) / 10));
      await page.waitForTimeout(250);
    }
    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const cls = await page.evaluate(() => (window as unknown as { __cls: { value: number; nodes: string[] } }).__cls);
    expect(cls.value, `shifted nodes: ${cls.nodes.join(' | ')}`).toBeLessThan(0.05);
  });
});
