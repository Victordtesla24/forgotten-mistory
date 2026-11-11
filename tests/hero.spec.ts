import { existsSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { roles } from '@/content/experience';
import { headlineFigures } from '@/content/proof';
import { ENTRANCE_END } from '@/lib/entrance';
import { careerBars, timeline } from '@/lib/timeline';

import { hydrated, open, visibleWordCounts, watchConsole } from './support';

/** The hero is the first child of the page's main element. */
const HERO = 'main > div:first-child';
const SCALE = '[data-career-scale]';
const BARS = `${SCALE} a[data-role]`;

/** The widths acceptance names, with a height tall enough to see the first screen. */
const WIDTHS = [320, 390, 834, 1440, 1920] as const;

/** Waits for the review hook and for its `ready` promise. */
async function stageReady(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__stage !== undefined);
  await page.evaluate(() => window.__stage?.ready);
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
  test('is drawn on the one UTC time scale, January 2010 to the current month', () => {
    expect(timeline.domain().map((date) => date.toISOString().slice(0, 7))).toEqual(['2010-01', '2026-09']);
    expect(timeline.range()).toEqual([0, 1]);
    expect(careerBars[0]?.start, 'MYOB starts in May 2010, four months in').toBeCloseTo(4 / 200, 2);
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
      const bars = await boxes(page, BARS);
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
      expect(months).toEqual([15, 39, 11, 12, 10, 93, 8, 6]);
    }
  });

  test('draws a label only where it fits', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const shown: number[] = [];
    for (const width of [390, 834, 1920]) {
      await openAt(page, '/?gl=off', width);
      const labels = await page.locator(`${SCALE} [data-fit]`).evaluateAll((elements) =>
        elements.flatMap((label) => {
          if (getComputedStyle(label).display === 'none') return [];
          const bar = label.closest('a');
          return [{ text: label.textContent, label: label.scrollWidth, space: label.parentElement?.clientWidth ?? 0, bar: bar?.clientWidth ?? 0 }];
        }),
      );
      shown.push(labels.length);
      for (const entry of labels) expect(entry.label, `${entry.text} at ${width}`).toBeLessThanOrEqual(entry.space);
    }
    expect(shown[0], 'a phone shows the one label that fits').toBeGreaterThanOrEqual(1);
    expect(shown[2], 'a wide screen shows more').toBeGreaterThan(shown[0] ?? 0);
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
    expect(info?.points, 'points: 10,000 devices and 40 marks').toBe(10_040);
    expect(info?.calls).toBeLessThanOrEqual(40);
    expect(info?.points).toBeLessThanOrEqual(12_000);
    expect(info?.lines).toBeLessThanOrEqual(10_000);
    expect(info?.triangles).toBeLessThanOrEqual(60_000);

    for (const figure of headlineFigures) {
      const view = page.locator(`[data-stage-view="reading-${figure.id}"]`);
      await expect(view, figure.id).toHaveAttribute('data-ready', 'true');
      await expect(view, figure.id).toHaveAttribute('data-drawn', String(counts[figure.id]));
      await expect(view, figure.id).toHaveAttribute('data-marks', String(figure.marks.count));
    }
    await expect(page.locator('[data-stage-view="reading-portfolio"]')).toHaveAttribute('data-drawn-groups', '5');
    expect(problems).toEqual([]);
  });

  test('draw their counts up over the entrance and rest on the final numbers', async ({ page }) => {
    await openAt(page, '/?gl=high', 1440);
    await stageReady(page);
    await expect(page.locator('[data-stage-view][data-ready="true"]')).toHaveCount(5);
    const points: number[] = [];
    for (const ms of [0, 300, 600, 900, 1200, 1500]) {
      points.push((await page.evaluate((at) => {
        window.__stage?.seek(at);
        return window.__stage?.info().points;
      }, ms)) ?? -1);
    }
    expect(points[0], 'nothing is drawn at 0 ms').toBe(0);
    expect(points[3], 'the count is part way at 900 ms').toBeGreaterThan(0);
    expect(points[3]).toBeLessThan(10_040);
    expect(points.at(-1), 'every mark is drawn by 1500 ms').toBe(10_040);
    expect([...points].sort((a, b) => a - b)).toEqual(points);
  });

  test('draw the same counts with ?gl=off, in the SVG and HTML fallback', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    await page.evaluate(() => window.__stage?.ready);
    await expect(page.locator('canvas')).toHaveCount(0);

    const lattice = page.locator('[data-stage-view="reading-telemetry"] svg');
    const [columns, rows] = (await lattice.getAttribute('viewBox'))?.split(' ').slice(2).map(Number) ?? [];
    expect((columns ?? 0) * (rows ?? 0), 'a 1 by 1 pattern tile for each of 10,000 points').toBe(10_000);
    await expect(lattice.locator('pattern')).toHaveAttribute('width', '1');
    await expect(lattice.locator('pattern')).toHaveAttribute('height', '1');

    const cells = page.locator('[data-stage-view="reading-evidence"] > div > div > span');
    await expect(cells).toHaveCount(200);
    const squads = page.locator('[data-stage-view="reading-portfolio"] > div > div > span');
    await expect(squads).toHaveCount(5);
    for (let squad = 0; squad < 5; squad += 1) await expect(squads.nth(squad).locator('span')).toHaveCount(8);
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
    await page.waitForTimeout(400);
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
  test('arrives in the written order and is over in under 1.6 s', async ({ page }) => {
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
        else if (target.closest('#top') && target.tagName === 'P' && target.textContent?.startsWith('Sixteen')) add('line', animation);
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
    expect(end, 'every animation is over').toBeLessThan(1600);
    expect(ENTRANCE_END, 'the table agrees').toBeLessThan(1600);
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
    await page.waitForTimeout(1500);

    const opacityAt = (selector: string, ms: number) =>
      page.evaluate(
        ([target, at]) => {
          for (const animation of document.getAnimations()) {
            if (animation.timeline !== document.timeline) continue;
            animation.pause();
            animation.currentTime = Number(at);
          }
          window.__stage?.seek(Number(at));
          const element = document.querySelector(String(target));
          return element ? Number(getComputedStyle(element).opacity) : -1;
        },
        [selector, ms] as const,
      );

    const headline = '#top h1';
    const readings = '#proof ul > li:first-child';
    expect(await opacityAt(headline, 0), 'the headline waits for the field').toBe(0);
    expect(await opacityAt(headline, 300)).toBeGreaterThan(0.3);
    expect(await opacityAt(readings, 300), 'the readings are not yet there at 300 ms').toBe(0);
    expect(await opacityAt(readings, 900)).toBeGreaterThan(0.9);
    expect(await opacityAt(headline, 1500)).toBe(1);
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
      };
    });
    expect(state.running, 'nothing animates').toBe(0);
    expect(state.headline).toBe(1);
    expect(state.reading).toBe(1);
    expect(state.ruler).not.toMatch(/[1-9]\d*%/);
    expect(state.info?.tier).toBe('still');
    expect(state.info?.points, 'the stage shows the finished readings at once').toBe(10_040);
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
    const fill = `${BARS}[data-role="anz"] > span`;
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
