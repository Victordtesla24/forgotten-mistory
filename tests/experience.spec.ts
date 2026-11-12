import { readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { roles, yearsOf } from '@/content/experience';
import { headlineFigures } from '@/content/proof';
import { keyOf } from '@/lib/readings';
import { careerBars, fitStep, labelWidth } from '@/lib/timeline';
import { FIT_INSET, laneLayouts, LANE_STARTS } from '@/lib/timeline-lanes';

import { open, watchConsole } from './support';

const SECTION = '#experience';
const TAB = `${SECTION} [role="tab"]`;
const PANEL = `${SECTION} [role="tabpanel"]`;
const TRACK = `${SECTION} [data-timeline]`;
const BARS = `${TRACK} [data-bar]`;

/** The widths acceptance names, and the two between them where the lanes change. */
const WIDTHS = [320, 360, 390, 640, 834, 1440, 1920] as const;

const ORDER = careerBars.map((bar) => bar.id);
const ids = (list: readonly { id: string }[]) => list.map((entry) => entry.id);

async function openAt(page: Page, path: string, width: number, height = 900): Promise<void> {
  await page.setViewportSize({ width, height });
  await open(page, path);
  await page.evaluate(() => document.fonts.ready);
}

/** Brings the section in and waits for its entrance to be over, whichever way it is configured. */
async function settled(page: Page): Promise<void> {
  await page.locator(SECTION).scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const top = (document.querySelector('#experience')?.getBoundingClientRect().top ?? 0) + window.scrollY;
    window.scrollTo({ top, behavior: 'instant' });
  });
  await page.waitForFunction(() => {
    const phase = document.querySelector('[data-experience]')?.getAttribute('data-phase');
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
    return calm ? phase === 'idle' : phase === 'done';
  });
}

const selectedRole = (page: Page) => page.locator(`${TAB}[aria-selected="true"]`).getAttribute('data-role');

test.describe('the Experience timeline', { tag: '@desktop' }, () => {
  test('is one tab list of eight roles in date order with one panel, and the current role is selected', async ({ page }) => {
    const problems = watchConsole(page);
    await openAt(page, '/?gl=off', 1440);
    await expect(page.locator(`${SECTION} [role="tablist"]`)).toHaveCount(1);
    expect(await page.locator(TAB).evaluateAll((tabs) => tabs.map((tab) => (tab as HTMLElement).dataset.role))).toEqual(ORDER);
    await expect(page.locator(PANEL)).toHaveCount(1);
    expect(await selectedRole(page)).toBe('ato');
    const tabs = await page.locator(TAB).evaluateAll((list) => list.map((tab) => ({ selected: tab.getAttribute('aria-selected'), index: tab.getAttribute('tabindex'), controls: tab.getAttribute('aria-controls') })));
    expect(tabs.filter((tab) => tab.selected === 'true')).toHaveLength(1);
    for (const tab of tabs) expect(tab.index).toBe(tab.selected === 'true' ? '0' : '-1');
    const panel = page.locator(PANEL);
    expect(await panel.getAttribute('id')).toBe(tabs[0]?.controls);
    expect(await panel.getAttribute('aria-labelledby')).toBe('role-tab-ato');
    await expect(page.locator(`${SECTION} h2`)).toHaveText('Eight roles');
    expect(problems).toEqual([]);
  });

  for (const width of WIDTHS) {
    test(`the track is as wide as the browser and every bar is where lib/timeline puts it at ${width} px`, async ({ page }) => {
      await openAt(page, '/?gl=off', width);
      const measured = await page.evaluate(
        ([track, bars]) => {
          const box = (document.querySelector(track as string) as HTMLElement).getBoundingClientRect();
          const rect = (element: Element) => {
            const { left, right } = element.getBoundingClientRect();
            return { left, right };
          };
          return {
            track: { left: box.left, right: box.right },
            width: document.documentElement.clientWidth,
            scroll: document.documentElement.scrollWidth,
            bars: Array.from(document.querySelectorAll(bars as string)).map((bar) => ({ id: (bar as HTMLElement).dataset.bar, ...rect(bar) })),
          };
        },
        [TRACK, BARS],
      );
      expect(measured.track.left).toBeCloseTo(0, 0);
      expect(measured.track.right).toBeCloseTo(measured.width, 0);
      expect(measured.scroll, 'no horizontal scroll').toBeLessThanOrEqual(measured.width);
      expect(ids(measured.bars.map((bar) => ({ id: bar.id ?? '' })))).toEqual(ORDER);
      for (const bar of careerBars) {
        const drawn = measured.bars.find((entry) => entry.id === bar.id);
        expect(drawn?.left, `${bar.id} left`).toBeCloseTo(bar.start * measured.width, 0);
        expect(drawn?.right, `${bar.id} right`).toBeCloseTo(bar.end * measured.width, 0);
      }
    });
  }

  for (const width of WIDTHS) {
    // A phone's axis names the selected bar and the one wide enough to carry its own name; the row of cards below names every role.
    const named = width < 640 ? ['anz', 'ato'] : ORDER;
    test(`${width < 640 ? 'the selected bar and the wide one are named' : 'every bar is named'}, no two names meet and none is under 13 px at ${width} px`, async ({ page }) => {
      await openAt(page, '/?gl=off', width);
      const names = await page.evaluate((selector) => {
        const found: { id: string; left: number; right: number; top: number; bottom: number; size: number; text: string; outside: boolean }[] = [];
        for (const bar of document.querySelectorAll<HTMLElement>(selector)) {
          const visible = Array.from(bar.querySelectorAll<HTMLElement>('[class*="_label__"], [class*="_text__"]')).filter((element) => {
            const box = element.getBoundingClientRect();
            return getComputedStyle(element).display !== 'none' && box.width > 1 && box.height > 1;
          });
          for (const element of visible) {
            const range = document.createRange();
            range.selectNodeContents(element);
            const glyphs = range.getBoundingClientRect();
            found.push({
              id: bar.dataset.bar ?? '',
              left: glyphs.left,
              right: glyphs.right,
              top: glyphs.top,
              bottom: glyphs.bottom,
              size: Number.parseFloat(getComputedStyle(element).fontSize),
              text: element.textContent ?? '',
              outside: element.className.includes('_text__'),
            });
          }
        }
        return found;
      }, BARS);
      expect(names.map((name) => name.id).sort(), 'the bars that are named').toEqual([...named].sort());
      for (const name of names) {
        expect(name.text).toBe(roles.find((role) => role.id === name.id)?.short);
        expect(name.size, `${name.id} text size`).toBeGreaterThanOrEqual(13);
      }
      for (const [index, one] of names.entries()) {
        for (const two of names.slice(index + 1)) {
          const apart = one.right + 4 <= two.left || two.right + 4 <= one.left || one.bottom <= two.top || two.bottom <= one.top;
          expect(apart, `${one.id} and ${two.id}`).toBe(true);
        }
      }
    });
  }

  test('the stylesheet fits a name in its bar at exactly the width lib/timeline-lanes counts on', () => {
    const css = readFileSync('components/sections/Experience/Experience.module.css', 'utf8');
    const steps = new Map<number, number>();
    for (const [, width, fit] of css.matchAll(/@container \(min-width: (\d+)px\) \{\s*\.label\[data-fit='(\d+)'\]/g)) {
      steps.set(Number(fit), Number(width));
    }
    for (const bar of careerBars) {
      const step = fitStep(bar.label);
      expect(steps.get(step), `a rule for names of ${step} characters`).toBe(labelWidth('x'.repeat(step)) + FIT_INSET);
    }
    expect(laneLayouts.map((layout) => layout.from)).toEqual([...LANE_STARTS]);
    for (const layout of laneLayouts) {
      for (const label of layout.labels) {
        const bar = careerBars.find((entry) => entry.id === label.id);
        expect((bar?.width ?? 1) * layout.from, `${label.id} does not fit at ${layout.from}`).toBeLessThan(labelWidth(bar?.label ?? '') + FIT_INSET);
      }
    }
  });

  test('keys select: Home, End and the arrows, with the card, the connector and the playhead following', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    await settled(page);
    await page.locator(`${TAB}[data-role="ato"]`).focus();
    const checks = async (id: string) => {
      await expect(page.locator(`${TAB}[data-role="${id}"]`)).toHaveAttribute('aria-selected', 'true');
      await expect(page.locator(`${TAB}[data-role="${id}"]`)).toBeFocused();
      // The card, the connector and the playhead glide to the new bar; the test reads them once they have arrived.
      await expect(async () => {
        const place = await page.evaluate((role) => {
          const bar = document.querySelector(`#experience [data-bar="${role}"]`) as HTMLElement;
          const centre = (element: Element) => {
            const { left, width } = element.getBoundingClientRect();
            return left + width / 2;
          };
          const card = (document.querySelector('#experience [role="tabpanel"]') as HTMLElement).getBoundingClientRect();
          const line = (document.querySelector('#experience [data-connector]') as HTMLElement).getBoundingClientRect();
          const target = bar.getBoundingClientRect();
          const middle = target.left + target.width / 2;
          // The connector's lower end is the end of its box nearer the bar's middle: a bent connector is wide, and leaves the card by its side.
          const lower = Math.abs(line.left + 0.5 - middle) < Math.abs(line.right - 0.5 - middle) ? line.left + 0.5 : line.right - 0.5;
          const apart = (a: number, b: number, c: number, d: number) => Math.max(0, Math.max(a, c) - Math.min(b, d));
          return {
            bar: middle,
            lower,
            playhead: centre(document.querySelector('#experience [data-playhead]') as Element),
            gapToCard: Math.hypot(apart(line.left, line.right, card.left, card.right), apart(line.top, line.bottom, card.top, card.bottom)),
            gapToBar: Math.abs(line.bottom - target.top),
          };
        }, id);
        expect(Math.abs(place.lower - place.bar), `${id}: the connector lands on the bar's centre`).toBeLessThanOrEqual(2);
        expect(Math.abs(place.playhead - place.bar), `${id}: the playhead rests on the bar`).toBeLessThanOrEqual(2);
        expect(place.gapToCard, `${id}: the connector starts at the card`).toBeLessThanOrEqual(2.5);
        expect(place.gapToBar, `${id}: the connector ends at the bar`).toBeLessThanOrEqual(2.5);
      }).toPass();
    };
    await page.keyboard.press('Home');
    await checks('myob');
    await page.keyboard.press('ArrowRight');
    await checks('infocentric');
    await page.keyboard.press('End');
    await checks('ato');
    await page.keyboard.press('ArrowLeft');
    await checks('independent');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await checks('ato');
  });

  test('the card shows each role as the content states it, with a drawn figure, and is the same height for every role', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    await settled(page);
    await page.locator(`${TAB}[data-role="myob"]`).focus();
    await page.keyboard.press('Home');
    const heights: number[] = [];
    for (const bar of careerBars) {
      const role = roles.find((entry) => entry.id === bar.id);
      await expect(page.locator(`${TAB}[data-role="${bar.id}"]`)).toHaveAttribute('aria-selected', 'true');
      const card = page.locator(PANEL);
      await expect(card.getByRole('heading', { level: 3 })).toHaveText(role?.shortTitle ?? '');
      await expect(card).toContainText(role?.short ?? '');
      await expect(card).toContainText(yearsOf(role?.span ?? { start: 0, end: 0 }));
      expect(await card.innerText()).toMatch(/\b(\d+ years?|\d+ months?)\b/);
      await expect(card.getByRole('button', { name: 'Open role' })).toBeVisible();
      await expect(card.locator('[data-figure] svg'), `${bar.id} draws a figure`).toHaveCount(1);
      if (role?.headline) {
        await expect(card).toContainText(role.headline.value);
        await expect(card).toContainText(role.headline.label);
      } else await expect(card).toContainText(role?.outcome ?? '');
      const lines = await card.locator('p').allInnerTexts();
      expect(lines.some((line) => line.trim() === role?.shortTitle), `${bar.id}: no line repeats the title`).toBe(false);
      expect((await card.innerText()).split(/\s+/).filter((word) => /[\p{L}\p{N}]/u.test(word)).length, `${bar.id}: words in the card`).toBeLessThanOrEqual(25);
      const figure = await card.locator('[data-figure] svg').boundingBox();
      expect(Math.min(figure?.width ?? 0, figure?.height ?? 0), `${bar.id}: the drawing is at least 96 px on its short side`).toBeGreaterThanOrEqual(96);
      heights.push((await card.boundingBox())?.height ?? 0);
      await page.keyboard.press('ArrowRight');
    }
    expect(Math.max(...heights) - Math.min(...heights), 'one card height for every role').toBeLessThanOrEqual(2);
  });

  test('a figure is drawn with the hero’s own reading where there is one: its layout, its key and its marks', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    await settled(page);
    const drawn = async (id: string) => {
      await page.locator(`${TAB}[data-role="${id}"]`).click();
      await expect(page.locator(`${TAB}[data-role="${id}"]`)).toHaveAttribute('aria-selected', 'true');
      return page.locator(`${PANEL} [data-figure]`).evaluate((figure) => ({
        kind: (figure as HTMLElement).dataset.figure,
        key: figure.querySelector('p')?.textContent,
        solid: Array.from(figure.querySelectorAll('rect[fill*="-solid"]')).length,
        cells: Array.from(figure.querySelectorAll('pattern')).length,
      }));
    };
    const evidence = await drawn('ato');
    expect(evidence.kind).toBe('evidence');
    expect(evidence.key, 'the hero reading’s own key').toBe(keyOf('evidence'));
    const telemetry = await drawn('anz');
    expect(telemetry.kind).toBe('telemetry');
    expect(telemetry.key, 'the hero reading’s own key').toBe(keyOf('telemetry'));
    expect(headlineFigures.map((figure) => figure.key)).toContain(evidence.key);
    expect((await drawn('independent')).kind, '−38% is a share of a hundred cells').toBe('share');
    for (const id of ['myob', 'infocentric', 'telstra', 'microsoft', 'nab']) expect((await drawn(id)).kind, `${id}: its months in the calendar`).toBe('months');
  });

  for (const width of [1024, 1280, 1440, 1920]) {
    test(`from 1024 px the bars are at least 56 px tall, a bar over 220 px names its role too, and every year is numbered, at ${width} px`, async ({ page }) => {
      await openAt(page, '/?gl=off', width, 900);
      const seen = await page.evaluate((selector) => {
        const bars = Array.from(document.querySelectorAll<HTMLElement>(selector)).map((bar) => {
          const box = bar.getBoundingClientRect();
          const sub = bar.querySelector<HTMLElement>('[class*="_sub__"]');
          return { id: bar.dataset.bar ?? '', width: box.width, height: box.height, sub: sub && getComputedStyle(sub).display !== 'none' ? sub.textContent : null };
        });
        const years = Array.from(document.querySelectorAll<HTMLElement>('#experience [data-year]'))
          .filter((year) => getComputedStyle(year).display !== 'none')
          .map((year) => ({ text: year.textContent ?? '', ...year.getBoundingClientRect().toJSON() as { left: number; right: number } }));
        return { bars, years };
      }, BARS);
      for (const bar of seen.bars) {
        expect(bar.height, `${bar.id} height`).toBeGreaterThanOrEqual(56);
        const role = roles.find((entry) => entry.id === bar.id);
        const title = role?.title.split(',')[0] ?? '';
        if (bar.width > 220) expect(bar.sub, `${bar.id} shows its title`).toBe(title.length <= 26 ? title : role?.shortTitle);
        else expect(bar.sub, `${bar.id} is too narrow for a second line`).toBeNull();
      }
      expect(seen.years.map((year) => year.text)).toEqual(Array.from({ length: 17 }, (_, index) => String(2010 + index)));
      for (const [index, year] of seen.years.entries()) {
        const before = seen.years[index - 1];
        if (before) expect(before.right + 4, `${before.text} and ${year.text} do not overlap`).toBeLessThanOrEqual(year.left);
      }
    });
  }

  for (const width of [1280, 1440]) {
    test(`a short bar is named by a label on one baseline, centred on a leader inside its own bar, clear of the graticule, at ${width} px`, async ({ page }) => {
      await openAt(page, '/?gl=off', width, width === 1280 ? 720 : 900);
      const labelled = await page.evaluate((selector) => {
        const grid = document.querySelector('#experience [data-grid]')?.getBoundingClientRect();
        return Array.from(document.querySelectorAll<HTMLElement>(selector)).map((bar) => {
          const box = bar.getBoundingClientRect();
          const out = bar.querySelector<HTMLElement>('[data-out]');
          const inside = Array.from(bar.querySelectorAll<HTMLElement>('[class*="_label__"]')).some((label) => getComputedStyle(label).display !== 'none');
          if (!out || getComputedStyle(out).display === 'none') return { id: bar.dataset.bar ?? '', inside, leader: 0, centre: 0, top: 0, inBar: false, clear: true };
          const text = out.querySelector<HTMLElement>('[class*="_text__"]') as HTMLElement;
          const range = document.createRange();
          range.selectNodeContents(text);
          const glyphs = range.getBoundingClientRect();
          const leader = out.getBoundingClientRect().left;
          return {
            id: bar.dataset.bar ?? '',
            inside,
            leader,
            centre: (glyphs.left + glyphs.right) / 2,
            top: glyphs.top,
            inBar: leader >= box.left && leader <= box.right,
            clear: (grid?.bottom ?? 0) <= glyphs.top,
          };
        });
      }, BARS);
      const outside = labelled.filter((bar) => !bar.inside);
      expect(outside.map((bar) => bar.id), 'the bars that cannot hold their names').toEqual(width === 1280 ? ['telstra', 'microsoft', 'independent'] : ['microsoft', 'independent']);
      for (const bar of outside) {
        expect(Math.abs(bar.centre - bar.leader), `${bar.id}: the label is centred on its leader`).toBeLessThanOrEqual(3);
        expect(bar.inBar, `${bar.id}: the leader lands inside its bar`).toBe(true);
        expect(bar.clear, `${bar.id}: the graticule stops above the lane of names`).toBe(true);
      }
      expect(new Set(outside.map((bar) => Math.round(bar.top))).size, 'one baseline for every label in the lane').toBe(1);
      expect(labelled.filter((bar) => bar.inside).length + outside.length).toBe(8);
    });
  }

  for (const width of [1280, 1366, 1440, 1920]) {
    test(`the playhead is never drawn through a name, at rest on any role or under the pointer, at ${width} px`, async ({ page }) => {
      await openAt(page, '/?gl=off', width, 900);
      await settled(page);
      const crossings = () =>
        page.evaluate(() => {
          const head = (document.querySelector('#experience [data-playhead]') as HTMLElement).getBoundingClientRect();
          const found: string[] = [];
          for (const name of document.querySelectorAll<HTMLElement>('#experience [class*="_label__"], #experience [class*="_text__"], #experience [class*="_sub__"]')) {
            if (getComputedStyle(name).display === 'none') continue;
            const range = document.createRange();
            range.selectNodeContents(name);
            const glyphs = range.getBoundingClientRect();
            const touches = !(head.right < glyphs.left - 4 || head.left > glyphs.right + 4 || head.bottom < glyphs.top - 4 || head.top > glyphs.bottom + 4);
            if (touches) found.push(name.textContent ?? '');
          }
          return found;
        });
      for (const id of ORDER) {
        await page.locator(`${TAB}[data-role="${id}"]`).click();
        await page.mouse.move(2, 2);
        await page.waitForTimeout(400);
        expect(await crossings(), `${id} selected: the names the playhead touches`).toEqual([]);
      }
      for (const id of ORDER) {
        const box = await page.locator(`${BARS}[data-bar="${id}"]`).boundingBox();
        await page.mouse.move((box?.x ?? 0) + (box?.width ?? 0) / 2, (box?.y ?? 0) + (box?.height ?? 0) / 2);
        await page.waitForTimeout(150);
        expect(await crossings(), `${id} under the pointer: the names the playhead touches`).toEqual([]);
      }
    });
  }

  for (const width of [1280, 1440, 1920]) {
    test(`the card stands inside the column of the content, at least 480 px wide, for every role, at ${width} px`, async ({ page }) => {
      await openAt(page, '/?gl=off', width, 900);
      await settled(page);
      for (const id of ORDER) {
        await page.locator(`${TAB}[data-role="${id}"]`).click();
        await page.mouse.move(2, 2);
        await page.waitForTimeout(450);
        const found = await page.evaluate(() => {
          const card = (document.querySelector('#experience [role="tabpanel"]') as HTMLElement).getBoundingClientRect();
          const header = document.querySelector('#experience header') as HTMLElement;
          const box = header.getBoundingClientRect();
          const style = getComputedStyle(header);
          return {
            left: card.left,
            right: card.right,
            width: card.width,
            column: { left: box.left + Number.parseFloat(style.paddingLeft), right: box.right - Number.parseFloat(style.paddingRight) },
          };
        });
        expect(found.width, `${id}: card width`).toBeGreaterThanOrEqual(480);
        expect(found.left, `${id}: card left edge`).toBeGreaterThanOrEqual(found.column.left - 0.5);
        expect(found.right, `${id}: card right edge`).toBeLessThanOrEqual(found.column.right + 0.5);
      }
    });
  }

  test('the “now” edge is a cap as tall as the bar, from its top to the baseline, a hair in from the edge of the screen', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    const found = await page.evaluate(() => {
      const cap = (document.querySelector('#experience [data-now]') as HTMLElement).getBoundingClientRect();
      const bar = (document.querySelector('#experience [data-bar="ato"]') as HTMLElement).getBoundingClientRect();
      const ruler = (document.querySelector('#experience [data-ruler]') as HTMLElement).getBoundingClientRect();
      return { top: cap.top - bar.top, bottom: cap.bottom - ruler.top, right: document.documentElement.clientWidth - cap.right };
    });
    expect(Math.abs(found.top), 'the cap starts at the top of the bar').toBeLessThanOrEqual(1);
    expect(Math.abs(found.bottom), 'the cap ends on the baseline, never under it').toBeLessThanOrEqual(1);
    expect(found.right, 'the cap does not touch the edge of the screen').toBeGreaterThanOrEqual(2);
  });

  test('the first January’s tick stands whole on the track’s edge: the ruler draws it and the drawing leaves it out', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    const found = await page.evaluate(() => {
      const ruler = document.querySelector('#experience [data-ruler]') as HTMLElement;
      const edge = getComputedStyle(ruler, '::before');
      const drawn = Array.from(ruler.querySelectorAll('path'), (path) => path.getAttribute('d') ?? '').join('');
      return { left: edge.left, width: edge.width, atEdge: /M0(\.0+)? /.test(drawn) };
    });
    expect(found.left, 'the tick is on the edge').toBe('0px');
    expect(found.width, 'and a whole pixel wide').toBe('1px');
    expect(found.atEdge, 'the SVG draws no tick whose half would fall outside the page').toBe(false);
  });

  test('with Work in view nothing of the timeline stands under the header, at three laptop sizes', async ({ page }) => {
    for (const [width, height] of [[1280, 720], [1440, 900], [1920, 1080]] as const) {
      await openAt(page, '/?gl=off', width, height);
      await page.locator('header a[href="/#work"]').first().click();
      // The jump has ended when the page has stood still between two looks.
      let rest = -1;
      await expect
        .poll(async () => {
          const now = await page.evaluate(() => window.scrollY);
          const still = now === rest && now > 0;
          rest = now;
          return still;
        })
        .toBe(true);
      const under = await page.evaluate(() => {
        const header = (document.querySelector('header') as HTMLElement).getBoundingClientRect().bottom;
        return Array.from(document.querySelectorAll('#experience *'))
          .filter((element) => {
            const box = element.getBoundingClientRect();
            return box.width > 0 && box.height > 0 && box.bottom > header + 0.5 && box.top < window.innerHeight;
          })
          .map((element) => element.tagName.toLowerCase());
      });
      expect(under, `${width} x ${height}: what of the timeline shows under the header`).toEqual([]);
    }
  });

  test('the timeline is the one scale on the page: no ticks or numerals in a panel, in the dividers or in the no-script list', async ({ browser, page }) => {
    await openAt(page, '/?gl=off#role-anz-detail', 1440);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('[data-ruler], [data-year], svg line')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(page.locator('#work svg line, #capabilities svg line, #about svg line, #contact svg line')).toHaveCount(0);
    const script = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const plain = await script.newPage();
    await plain.goto('/');
    await expect(plain.locator('[data-role-item] [data-ruler], [data-role-item] [data-year], [data-role-item] svg line')).toHaveCount(0);
    await script.close();
  });

  test('the document’s own ground is the page’s, so a view transition held at its first frame never comes up white', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    const same = await page.evaluate(() => {
      const probe = document.createElement('i');
      probe.style.backgroundColor = 'var(--bg)';
      document.body.append(probe);
      const token = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return getComputedStyle(document.documentElement).backgroundColor === token;
    });
    expect(same).toBe(true);
  });

  test('a mouse moves the playhead and a click selects; leaving puts the playhead back on the selected bar', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    await settled(page);
    const centreOf = (selector: string) =>
      page.locator(selector).evaluate((element) => {
        const { left, width, top, height } = element.getBoundingClientRect();
        return { x: left + width / 2, y: top + height / 2 };
      });
    const anz = await centreOf(`${BARS}[data-bar="anz"]`);
    await page.mouse.move(anz.x - 200, anz.y);
    await expect.poll(async () => Math.abs((await centreOf(`${SECTION} [data-playhead]`)).x - (anz.x - 200))).toBeLessThanOrEqual(4);
    await page.mouse.move(anz.x + 150, anz.y);
    await expect.poll(async () => Math.abs((await centreOf(`${SECTION} [data-playhead]`)).x - (anz.x + 150))).toBeLessThanOrEqual(4);
    await page.mouse.click(anz.x, anz.y);
    expect(await selectedRole(page)).toBe('anz');
    await page.mouse.move(anz.x, 20);
    const bar = await centreOf(`${BARS}[data-bar="anz"]`);
    await expect.poll(async () => Math.abs((await centreOf(`${SECTION} [data-playhead]`)).x - bar.x)).toBeLessThanOrEqual(4);
  });

  test('Enter opens the role with the achievements and its own address, and Escape and Back close it with focus on the tab', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    await settled(page);
    const role = roles.find((entry) => entry.id === 'anz');
    await page.locator(`${TAB}[data-role="ato"]`).focus();
    await page.keyboard.press('ArrowLeft');
    await page.keyboard.press('ArrowLeft');
    expect(await selectedRole(page)).toBe('anz');
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog', { name: role?.title ?? '' });
    await expect(dialog).toBeVisible();
    expect(await page.evaluate(() => window.location.hash)).toBe('#role-anz-detail');
    for (const line of role?.achievements ?? []) await expect(dialog.getByText(line, { exact: false })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
    await expect(page.locator(`${TAB}[data-role="anz"]`)).toBeFocused();

    await page.getByRole('button', { name: 'Open role' }).click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Next' }).click();
    await page.keyboard.press('Escape');
    expect(await selectedRole(page), 'the role that was last open is the selected one').toBe('independent');
    await expect(page.locator(`${TAB}[data-role="independent"]`)).toBeFocused();
    await page.keyboard.press('Enter');
    await page.goBack();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
  });

  test('a link to a role’s panel selects it on load', async ({ page }) => {
    await open(page, '/?gl=off#role-nab-detail');
    await expect(page.locator(`${TAB}[data-role="nab"]`)).toHaveAttribute('aria-selected', 'true');
  });

  test('the focus ring is two pixels, in the accent, above the canvas', async ({ page }) => {
    await openAt(page, '/?gl=high', 1440);
    await settled(page);
    await page.keyboard.press('Shift');
    const ring = await page.locator(`${TAB}[data-role="telstra"]`).evaluate((tab) => {
      (tab as HTMLElement).focus();
      const style = getComputedStyle(tab);
      const box = tab.getBoundingClientRect();
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
      return { width: style.outlineWidth, style: style.outlineStyle, focusVisible: tab.matches(':focus-visible'), covered: top !== tab };
    });
    expect(ring).toEqual({ width: '2px', style: 'solid', focusVisible: true, covered: false });
  });

  test('without the stage, and with reduced motion, the same timeline is there and nothing is armed to play', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openAt(page, '/?gl=off', 1440);
    await expect(page.locator('canvas')).toHaveCount(0);
    await expect(page.locator(TAB)).toHaveCount(8);
    await expect(page.locator(BARS)).toHaveCount(8);
    await expect(page.locator('[data-experience]')).toHaveAttribute('data-phase', 'idle');
    await page.locator(SECTION).scrollIntoViewIfNeeded();
    expect(await page.evaluate(() => document.getAnimations().filter((animation) => (animation.effect as KeyframeEffect).target?.closest('[data-experience]')).length)).toBe(0);
    await page.locator(`${TAB}[data-role="ato"]`).focus();
    await page.keyboard.press('Home');
    expect(await selectedRole(page)).toBe('myob');
  });

  test('the entrance plays once, bars in date order, and is over inside 900 ms', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    await page.waitForFunction(() => document.querySelector('[data-experience]')?.getAttribute('data-phase') === 'armed');
    const watch = page.evaluate(
      () =>
        new Promise<{ starts: { id: string; start: number }[]; end: number; barsEnd: number; cardStart: number; phases: string[] }>((resolve) => {
          const root = document.querySelector('[data-experience]') as HTMLElement;
          const phases = [root.dataset.phase ?? ''];
          let seen: { starts: { id: string; start: number }[]; end: number; barsEnd: number; cardStart: number } | null = null;
          const observer = new MutationObserver(() => {
            const phase = root.dataset.phase ?? '';
            if (phases.at(-1) !== phase) phases.push(phase);
            if (phase === 'play') {
              const animations = document.getAnimations().filter((animation) => animation instanceof CSSAnimation && (animation.effect as KeyframeEffect).target?.closest('[data-experience]'));
              const starts = animations
                .filter((animation) => (animation as CSSAnimation).animationName.includes('_grow_') && (animation.effect as KeyframeEffect).target?.className.includes('_fill__'))
                .map((animation) => ({
                  id: ((animation.effect as KeyframeEffect).target as HTMLElement).closest<HTMLElement>('[data-bar]')?.dataset.bar ?? '',
                  start: Number(animation.effect?.getComputedTiming().delay),
                }));
              const end = Math.max(...animations.map((animation) => Number(animation.effect?.getComputedTiming().endTime)));
              const barsEnd = Math.max(
                ...animations
                  .filter((animation) => (animation as CSSAnimation).animationName.includes('_grow_'))
                  .map((animation) => Number(animation.effect?.getComputedTiming().endTime)),
              );
              const cardStart = Number(
                animations.find((animation) => (animation.effect as KeyframeEffect).target?.className.includes('_card__'))?.effect?.getComputedTiming().delay,
              );
              seen = { starts, end, barsEnd, cardStart };
            }
            // The page's own timer ends the entrance; the test waits for it and does not guess how long it takes under load.
            if (phase === 'done' && seen) resolve({ ...seen, phases });
          });
          observer.observe(root, { attributes: true, attributeFilter: ['data-phase'] });
        }),
    );
    await page.evaluate(() => {
      const top = (document.querySelector('#experience')?.getBoundingClientRect().top ?? 0) + window.scrollY;
      window.scrollTo({ top: top - 60, behavior: 'instant' });
    });
    const seen = await watch;
    expect(seen.end, 'the last animation ends inside 900 ms').toBeLessThanOrEqual(900);
    expect(seen.starts.map((entry) => entry.id), 'bars draw in date order').toEqual(ORDER);
    expect(seen.starts.map((entry) => entry.start)).toEqual([...seen.starts.map((entry) => entry.start)].sort((a, b) => a - b));
    expect(seen.cardStart, 'the card arrives after the last bar is drawn').toBeGreaterThanOrEqual(seen.barsEnd);
    expect(seen.phases, 'armed, played, done: once').toEqual(['armed', 'play', 'done']);
    await expect(page.locator('[data-experience]')).toHaveAttribute('data-phase', 'done');
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.evaluate(() => {
      const top = (document.querySelector('#experience')?.getBoundingClientRect().top ?? 0) + window.scrollY;
      window.scrollTo({ top, behavior: 'instant' });
    });
    await page.waitForTimeout(300);
    await expect(page.locator('[data-experience]'), 'once: it does not arm again').toHaveAttribute('data-phase', 'done');
  });

  test('while a panel grows out of, or into, a tab the tab shows its bar', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    await settled(page);
    const seen = await page.evaluate(() => {
      const tab = document.querySelector<HTMLElement>('#experience [role="tab"][data-role="ato"]') as HTMLElement;
      tab.dataset.morph = '';
      const style = getComputedStyle(tab);
      const label = getComputedStyle(tab, '::after').content;
      delete tab.dataset.morph;
      return { border: style.borderTopColor, fill: style.backgroundColor, label };
    });
    expect(seen.fill).not.toBe('rgba(0, 0, 0, 0)');
    expect(seen.label).toContain('ATO');
  });

  test('with the stage, one canvas draws the timeline, within budget, and an idle page draws nothing', async ({ page }) => {
    const problems = watchConsole(page);
    await openAt(page, '/?gl=high', 1440);
    await page.evaluate(() => window.__stage?.ready);
    await settled(page);
    const view = page.locator('[data-stage-view="experience-timeline"]');
    await expect(view).toHaveAttribute('data-ready', 'true');
    await expect(page.locator('canvas')).toHaveCount(1);
    const box = async (selector: string) => page.locator(selector).evaluate((element) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      return { left, top, width, height };
    });
    const track = await box(TRACK);
    const drawn = await box('[data-stage-view="experience-timeline"]');
    expect(drawn).toEqual(track);
    // Frames are drawn while the page settles (an entrance, a late layout, the last of the hero's field above the section): the count to compare with is taken once it has stood still for 500 ms.
    await expect
      .poll(async () => {
        const first = await page.evaluate(() => window.__stage?.info().frames);
        await page.waitForTimeout(500);
        return (await page.evaluate(() => window.__stage?.info().frames)) === first;
      }, { timeout: 15_000 })
      .toBe(true);
    const before = await page.evaluate(() => window.__stage?.info());
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => window.__stage?.info());
    expect(after?.frames, 'nothing moves at rest').toBe(before?.frames);
    expect(after?.calls ?? 99).toBeLessThanOrEqual(40);
    expect(problems).toEqual([]);
  });

  test('with script off the axis is drawn with every bar named and every role is listed in full', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator(BARS)).toHaveCount(8);
    for (const role of roles) await expect(page.locator(`${BARS}[data-bar="${role.id}"]`)).toContainText(role.short);
    await expect(page.locator(`${SECTION} [data-ruler] [data-year]`)).toHaveCount(17);
    await expect(page.locator(`${SECTION} [data-role-item]`)).toHaveCount(8);
    for (const role of roles) {
      const item = page.locator(`${SECTION} [data-role-item="${role.id}"]`);
      await expect(item).toBeVisible();
      await expect(item).toContainText(role.title);
      for (const line of role.achievements) await expect(item).toContainText(line.slice(0, 40));
    }
    await expect(page.locator(`${SECTION} [role="tablist"]`)).toBeHidden();
    await context.close();
  });
});

test.describe('the Experience timeline on a phone', { tag: '@mobile' }, () => {
  test('an axis as wide as the screen, a lens above a snapping row of cards, and each drives the other', async ({ page }) => {
    await open(page, '/?gl=off');
    await settled(page);
    const row = page.locator(`${SECTION} [data-row]`);
    const lens = page.locator(`${SECTION} [data-lens]`);
    await expect(row).toBeVisible();
    const layout = await page.evaluate(() => {
      const list = document.querySelector('#experience [data-row]') as HTMLElement;
      const style = getComputedStyle(list);
      const lensBox = (document.querySelector('#experience [data-lens]') as HTMLElement).getBoundingClientRect();
      const track = (document.querySelector('#experience [data-timeline]') as HTMLElement).getBoundingClientRect();
      return {
        overflow: style.overflowX,
        snap: style.scrollSnapType,
        cards: Array.from(list.querySelectorAll<HTMLElement>('[data-role-card]')).map((card) => card.dataset.role),
        lensBottom: lensBox.bottom,
        rowTop: list.getBoundingClientRect().top,
        track: { left: track.left, right: track.right, width: document.documentElement.clientWidth },
      };
    });
    expect(layout.overflow).toBe('auto');
    expect(layout.snap).toContain('x');
    expect(layout.cards).toEqual(ORDER);
    expect(layout.lensBottom).toBeLessThanOrEqual(layout.rowTop + 1);
    expect(layout.track.left).toBeCloseTo(0, 0);
    expect(layout.track.right).toBeCloseTo(layout.track.width, 0);
    await expect(lens).toContainText('Scrum Master / PM');

    // A tap on a bar selects its role, the lens shows it and the row brings its card to the front.
    const bar = await page.locator(`${BARS}[data-bar="anz"]`).evaluate((element) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      return { x: left + width / 2, y: top + height / 2 };
    });
    await page.touchscreen.tap(bar.x, bar.y);
    expect(await selectedRole(page)).toBe('anz');
    await expect(lens).toContainText('Senior Delivery Lead');
    // How far a card stands from the row's first position: nil once the row has come to rest on it.
    const offFirst = (id: string) =>
      row.evaluate((list, role) => {
        const card = list.querySelector<HTMLElement>(`[data-role="${role}"]`) as HTMLElement;
        return Math.abs(card.getBoundingClientRect().left - (list.getBoundingClientRect().left + Number.parseFloat(getComputedStyle(list).scrollPaddingLeft)));
      }, id);
    await expect.poll(() => offFirst('anz')).toBeLessThanOrEqual(2);

    // Moving the row to a card moves the lens to its role.
    await row.evaluate((list) => {
      const card = list.querySelector<HTMLElement>('[data-role="telstra"]') as HTMLElement;
      list.scrollTo({ left: card.offsetLeft - Number.parseFloat(getComputedStyle(list).scrollPaddingLeft), behavior: 'instant' });
    });
    await expect.poll(() => selectedRole(page)).toBe('telstra');
    await expect(lens).toContainText('Telstra');

    // A tap on the part of a card that shows selects it, once the row has come to rest on the one before; the row then comes to rest on that card and the selection stays.
    await expect.poll(() => offFirst('telstra')).toBeLessThanOrEqual(2);
    const shown = await row.evaluate((list) => {
      const card = list.querySelector<HTMLElement>('[data-role="nab"]') as HTMLElement;
      const box = card.getBoundingClientRect();
      return { x: (box.left + Math.min(box.right, list.getBoundingClientRect().right)) / 2, y: (box.top + box.bottom) / 2 };
    });
    await page.touchscreen.tap(shown.x, shown.y);
    await expect.poll(() => selectedRole(page)).toBe('nab');
    await expect.poll(() => offFirst('nab')).toBeLessThanOrEqual(2);
    expect(await selectedRole(page)).toBe('nab');
  });

  test('the lens never moves the axis, the connector crosses no name, the launcher covers no card and the row peeks nothing or a clear card', async ({ page }) => {
    await open(page, '/?gl=off');
    await settled(page);
    const row = page.locator(`${SECTION} [data-row]`);
    /** Everything that must stay put or stay clear of a name, measured in the page. */
    const measure = () =>
      page.evaluate(() => {
        const rect = (element: Element) => element.getBoundingClientRect();
        const lens = document.querySelector('#experience [data-lens]') as HTMLElement;
        const list = document.querySelector('#experience [data-row]') as HTMLElement;
        const connector = rect(document.querySelector('#experience [data-connector]') as HTMLElement);
        const names = Array.from(document.querySelectorAll<HTMLElement>('#experience [data-out]'))
          .filter((out) => getComputedStyle(out).display !== 'none')
          .map((out) => rect(out.querySelector('span') as HTMLElement));
        const launcher = document.querySelector('#assistant-launcher');
        const box = launcher ? rect(launcher) : null;
        const cards = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]')).map((tab) => ({ id: tab.dataset.role ?? '', box: rect(tab), text: rect(tab.querySelector('span') as HTMLElement) }));
        const selected = cards.find((card) => card.id === document.querySelector('[data-experience]')?.getAttribute('data-selected'));
        const previous = cards[cards.findIndex((card) => card.id === selected?.id) - 1];
        return {
          lens: rect(lens).height,
          barsTop: rect(document.querySelector('#experience [data-bars]') as HTMLElement).top,
          rowTop: rect(list).top,
          next: rect(document.querySelector('#experience')?.nextElementSibling as HTMLElement).top,
          crossed: names.filter((name) => name.left <= connector.right && name.right >= connector.left).length,
          covered: box ? cards.filter((card) => card.text.left < box.right && card.text.right > box.left && card.text.top < box.bottom && card.text.bottom > box.top).map((card) => card.id) : [],
          peek: previous ? Math.max(previous.box.right, 0) : 0,
          scroll: list.scrollLeft,
        };
      });
    const first = await measure();
    for (const id of ORDER) {
      await page.locator(`${TAB}[data-role="${id}"]`).evaluate((tab) => (tab as HTMLElement).click());
      await expect.poll(() => selectedRole(page)).toBe(id);
      // The row comes to rest on the card before anything about the row is measured.
      let rest = -1;
      await expect
        .poll(async () => {
          const now = await row.evaluate((list) => list.scrollLeft);
          const still = now === rest;
          rest = now;
          return still;
        })
        .toBe(true);
      const now = await measure();
      expect(now.lens, `${id}: the lens is as tall as it was`).toBe(first.lens);
      expect(now.barsTop, `${id}: the bars have not moved`).toBe(first.barsTop);
      expect(now.rowTop, `${id}: the row has not moved`).toBe(first.rowTop);
      expect(now.next, `${id}: the next section has not moved`).toBe(first.next);
      expect(now.crossed, `${id}: no name stands under the connector`).toBe(0);
      expect(now.covered, `${id}: the launcher covers no card's name`).toEqual([]);
      expect(now.peek === 0 || now.peek >= 28, `${id}: the previous card peeks ${now.peek} px`).toBe(true);
    }
  });

  test('a drag along the track moves the playhead and the selection and leaves the page where it was', async ({ page }) => {
    await open(page, '/?gl=off');
    await settled(page);
    const centres = await page.evaluate(() =>
      ['infocentric', 'nab'].map((id) => {
        const { left, width, top, height } = (document.querySelector(`#experience [data-bar="${id}"]`) as HTMLElement).getBoundingClientRect();
        return { x: left + width / 2, y: top + height / 2 };
      }),
    );
    const before = await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }));
    const client = await page.context().newCDPSession(page);
    const [from, to] = centres;
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: from?.x ?? 0, y: from?.y ?? 0 }] });
    for (let step = 1; step <= 8; step += 1) {
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: (from?.x ?? 0) + (((to?.x ?? 0) - (from?.x ?? 0)) * step) / 8, y: from?.y ?? 0 }] });
    }
    // The finger rests on the last bar before it lifts, and the page has the move before the lift.
    await page.waitForTimeout(100);
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(() => selectedRole(page)).toBe('nab');
    expect(await page.evaluate(() => ({ x: window.scrollX, y: window.scrollY }))).toEqual(before);
  });

  test('every control of the section is at least 44 by 44 px', async ({ page }) => {
    await open(page, '/?gl=off');
    await settled(page);
    const small = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#experience button, #experience a[href], #experience [tabindex="0"]'))
        .map((element) => ({ name: element.textContent?.trim().slice(0, 24) ?? '', box: element.getBoundingClientRect() }))
        .filter(({ box }) => box.width > 0 && (box.width < 44 || box.height < 44))
        .map(({ name }) => name),
    );
    expect(small).toEqual([]);
  });
});

test.describe('the Experience timeline on a tablet', { tag: '@mobile' }, () => {
  const SIZES = [
    { width: 768, height: 1024 },
    { width: 834, height: 1112 },
  ] as const;

  for (const size of SIZES) {
    test.describe(`at ${size.width} px`, () => {
      test.use({ viewport: size });

      test('the selected role is a card on its axis, never a band: at most 420 px, joined to its bar, with at most 300 px of room beside it, over a row of cards that say employer, title and years', async ({ page }) => {
        await open(page, '/?gl=off');
        await settled(page);
        const found = await page.evaluate(() => {
          const rect = (selector: string) => (document.querySelector(selector) as HTMLElement).getBoundingClientRect();
          const card = rect('#experience [role="tabpanel"]');
          const connector = rect('#experience [data-connector]');
          const bar = rect('#experience [data-bar="ato"]');
          const row = document.querySelector('#experience [data-row]') as HTMLElement;
          const box = row.getBoundingClientRect();
          const width = document.documentElement.clientWidth;
          const tabs = Array.from(row.querySelectorAll<HTMLElement>('[role="tab"]'));
          const cards = tabs.map((tab) => {
            const [label, title, years] = Array.from(tab.children) as HTMLElement[];
            return { id: tab.dataset.role ?? '', text: [label, title, years].map((part) => part?.textContent ?? ''), sizes: [label, title, years].map((part) => Number.parseFloat(getComputedStyle(part as HTMLElement).fontSize)), parts: [label, title, years].map((part) => {
              const letters = document.createRange();
              letters.selectNodeContents(part as HTMLElement);
              const { left, right } = letters.getBoundingClientRect();
              return { left, right };
            }) };
          });
          const shown = tabs.reduce((sum, tab) => {
            const { left, right } = tab.getBoundingClientRect();
            return sum + Math.max(0, Math.min(right, box.right) - Math.max(left, box.left)) / (right - left);
          }, 0);
          return {
            cardWidth: card.width,
            cardCentre: card.left + card.width / 2,
            connectorX: bar.left + bar.width / 2,
            connectorReach: [connector.left, connector.right],
            left: card.left,
            right: width - card.right,
            shown,
            cards,
            width,
            mask: getComputedStyle(row).maskImage,
          };
        });
        expect(found.cardWidth, 'the card is a card').toBeLessThanOrEqual(420);
        expect(Math.abs(found.cardCentre - found.connectorX), 'the card stands within one card width of its bar').toBeLessThanOrEqual(found.cardWidth);
        expect(found.connectorReach[0], 'the connector reaches the bar').toBeLessThanOrEqual(found.connectorX + 1);
        expect(found.connectorReach[1], 'the connector reaches the bar').toBeGreaterThanOrEqual(found.connectorX - 1);
        expect(found.left, 'no wider band is left empty to the left of the card').toBeLessThanOrEqual(300);
        expect(found.right, 'no wider band is left empty to the right of the card').toBeLessThanOrEqual(300);
        expect(found.shown, 'three cards and a half of the row show').toBeGreaterThanOrEqual(3.4);
        expect(found.mask, 'the ends of the row fade').not.toBe('none');
        for (const role of roles) {
          const card = found.cards.find((entry) => entry.id === role.id);
          expect(card?.text, `${role.id}: the card says employer, title and years`).toEqual([role.short, role.shortTitle, yearsOf(role.span)]);
          expect(Math.min(...(card?.sizes ?? [0])), `${role.id}: the text is 13 px or more`).toBeGreaterThanOrEqual(13);
          for (const part of card?.parts ?? []) {
            const crosses = (edge: number) => part.left < edge && part.right > edge;
            expect(crosses(0) || crosses(found.width), `${role.id}: no letter is cut by an edge of the screen`).toBe(false);
          }
        }
      });

      test('choosing any role leaves the axis, the section and the page where they were, and a tap at either end of a narrow bar chooses that bar even while the row is still moving', async ({ page }) => {
        await open(page, '/?gl=off');
        await settled(page);
        const measure = () =>
          page.evaluate(() => ({
            track: (document.querySelector('#experience [data-timeline]') as HTMLElement).getBoundingClientRect().top,
            section: (document.querySelector('#experience') as HTMLElement).getBoundingClientRect().height,
            scroll: window.scrollY,
          }));
        const first = await measure();
        let last = 0;
        for (const id of ORDER) {
          for (const inset of [3, -3]) {
            const at = await page.locator(`${BARS}[data-bar="${id}"]`).evaluate((bar, edge) => {
              const { left, right, top, height } = bar.getBoundingClientRect();
              return { x: edge > 0 ? left + edge : right + edge, y: top + height / 2 };
            }, inset);
            await page.touchscreen.tap(at.x, at.y);
            last = await page.evaluate(() => performance.now());
            await expect.poll(() => selectedRole(page), `${id}: a tap ${inset > 0 ? 'at the left end' : 'at the right end'} of its bar`).toBe(id);
            const now = await measure();
            expect(now.track, `${id}: the axis stays`).toBeCloseTo(first.track, 0);
            expect(now.section, `${id}: the section keeps its height`).toBeCloseTo(first.section, 0);
            expect(now.scroll, `${id}: the page stays`).toBeCloseTo(first.scroll, 0);
          }
        }
        // The row's own move ends long after the last tap: nothing it does then may choose another role.
        await page.waitForFunction((from) => performance.now() > from + 1200, last);
        expect(await selectedRole(page)).toBe('ato');
      });

      test('a finger on a bar lights a ring of at least 44 px round it at once and lets go when it lifts', async ({ page }) => {
        await open(page, '/?gl=off');
        await settled(page);
        const bar = page.locator(`${BARS}[data-bar="ato"]`);
        const at = await bar.evaluate((element) => {
          const { left, top, width, height } = element.getBoundingClientRect();
          return { x: left + width / 2, y: top + height / 2 };
        });
        const ring = () =>
          bar.evaluate((element) => {
            const style = getComputedStyle(element, '::after');
            return { width: Number.parseFloat(style.width), opacity: Number.parseFloat(style.opacity), right: Number.parseFloat(style.right) };
          });
        const client = await page.context().newCDPSession(page);
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at] });
        await expect.poll(async () => (await ring()).opacity).toBeGreaterThan(0.9);
        expect((await ring()).width, 'the ring is a touch target').toBeGreaterThanOrEqual(44);
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await expect.poll(async () => (await ring()).opacity).toBe(0);
      });

      test('no bright stripe stands on the right edge of the screen and the last bar’s name stands 8 px in from it', async ({ page }) => {
        await open(page, '/?gl=off');
        await settled(page);
        const found = await page.evaluate(() => {
          const width = document.documentElement.clientWidth;
          const now = (document.querySelector('#experience [data-now]') as HTMLElement).getBoundingClientRect();
          const name = document.querySelector('#experience [data-bar="ato"] [data-out] span') as HTMLElement;
          const range = document.createRange();
          range.selectNodeContents(name);
          return { cap: width - now.right, capWidth: now.width, name: width - range.getBoundingClientRect().right };
        });
        expect(found.cap, 'the cap stands in from the edge').toBeGreaterThanOrEqual(6);
        expect(found.capWidth, 'the cap is a hairline').toBeLessThanOrEqual(1);
        expect(found.name, 'the name stands clear of the edge').toBeGreaterThanOrEqual(8);
      });

      test('the playhead is one line: the page’s and the stage’s light cover the same device pixels', async ({ page }) => {
        await open(page, '/?gl=high');
        await page.evaluate(() => window.__stage?.ready);
        await settled(page);
        await expect(page.locator('[data-stage-view="experience-timeline"]')).toHaveAttribute('data-ready', 'true');
        await expect
          .poll(async () => {
            const frames = await page.evaluate(() => window.__stage?.info().frames);
            await page.waitForTimeout(500);
            return (await page.evaluate(() => window.__stage?.info().frames)) === frames;
          }, { timeout: 15_000 })
          .toBe(true);
        const head = await page.locator(`${SECTION} [data-playhead]`).boundingBox();
        expect(head).not.toBeNull();
        if (!head) return;
        const clip = { x: Math.floor(head.x) - 4, y: head.y + 4, width: 10, height: head.height - 8 };
        const shot = await page.screenshot({ clip });
        const columns = await page.evaluate(async (data) => {
          const bitmap = await createImageBitmap(new Blob([Uint8Array.from(atob(data), (letter) => letter.charCodeAt(0))], { type: 'image/png' }));
          const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
          const context = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
          context.drawImage(bitmap, 0, 0);
          const pixels = context.getImageData(0, 0, bitmap.width, bitmap.height).data;
          return Array.from({ length: bitmap.width }, (_, x) => {
            let sum = 0;
            for (let y = 0; y < bitmap.height; y += 1) sum += pixels[(y * bitmap.width + x) * 4] ?? 0;
            return Math.round(sum / bitmap.height);
          });
        }, shot.toString('base64'));
        // On a screen of two device pixels to the pixel the line is two columns wide, bright and alone: the page's line and the light's one line.
        const lit = columns.filter((value) => value > 80);
        expect(lit.length, `the columns of the line (${columns.join(' ')})`).toBe(2);
        expect(Math.min(...lit)).toBeGreaterThan(200);
      });
    });
  }
});
