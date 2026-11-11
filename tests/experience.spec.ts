import { readFileSync } from 'node:fs';

import { expect, test, type Page } from '@playwright/test';

import { roles, yearsOf } from '@/content/experience';
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
    test(`every bar is named, no two names meet and none is under 13 px at ${width} px`, async ({ page }) => {
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
      expect(names.map((name) => name.id).sort(), 'one name for each bar').toEqual([...ORDER].sort());
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
      // The connector and the playhead glide to the new bar; the test reads them once they have arrived.
      await expect(async () => {
        const place = await page.evaluate((role) => {
          const bar = document.querySelector(`#experience [data-bar="${role}"]`) as HTMLElement;
          const centre = (element: Element) => {
            const { left, width } = element.getBoundingClientRect();
            return left + width / 2;
          };
          const connector = document.querySelector('#experience [data-connector]') as HTMLElement;
          const card = (document.querySelector('#experience [role="tabpanel"]') as HTMLElement).getBoundingClientRect();
          const line = connector.getBoundingClientRect();
          return {
            bar: centre(bar),
            connector: centre(connector),
            playhead: centre(document.querySelector('#experience [data-playhead]') as Element),
            gapToCard: Math.abs(line.top - card.bottom),
            gapToBar: Math.abs(line.bottom - bar.getBoundingClientRect().top),
          };
        }, id);
        expect(Math.abs(place.connector - place.bar), `${id}: the connector lands on the bar's centre`).toBeLessThanOrEqual(2);
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

  test('the card shows each role as the content states it, with its figure drawn and keyed where the content has one', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    await settled(page);
    await page.locator(`${TAB}[data-role="myob"]`).focus();
    await page.keyboard.press('Home');
    for (const bar of careerBars) {
      const role = roles.find((entry) => entry.id === bar.id);
      await expect(page.locator(`${TAB}[data-role="${bar.id}"]`)).toHaveAttribute('aria-selected', 'true');
      const card = page.locator(PANEL);
      await expect(card.getByRole('heading', { level: 3 })).toHaveText(role?.shortTitle ?? '');
      await expect(card).toContainText(role?.short ?? '');
      await expect(card).toContainText(yearsOf(role?.span ?? { start: 0, end: 0 }));
      expect(await card.innerText()).toMatch(/\b(\d+ years?|\d+ months?)\b/);
      await expect(card.getByRole('button', { name: 'Open role' })).toBeVisible();
      if (role?.headline) {
        await expect(card).toContainText(role.headline.value);
        await expect(card).toContainText(role.headline.label);
        await expect(card.locator('[data-figure] svg')).toHaveCount(1);
      } else {
        await expect(card.locator('[data-figure] svg')).toHaveCount(0);
        await expect(card).toContainText(role?.summary ?? '');
      }
      await page.keyboard.press('ArrowRight');
    }
  });

  test('a figure is a field of 100 marks that draws what the number states', async ({ page }) => {
    await openAt(page, '/?gl=off', 1440);
    await settled(page);
    const marks = async (id: string) => {
      await page.locator(`${TAB}[data-role="${id}"]`).click();
      return page.locator(`${PANEL} [data-figure] svg path`).evaluateAll((paths) => paths.map((path) => ((path.getAttribute('d') ?? '').match(/M/g) ?? []).length));
    };
    expect(await marks('ato'), '≈92%: 92 solid marks and 8 outlined').toEqual([92, 8]);
    expect(await marks('independent'), '−38%: 38 solid marks and 62 outlined').toEqual([38, 62]);
    expect(await marks('anz'), '10,000+ devices at 100 to a mark: 100 solid marks').toEqual([100, 0]);
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
        new Promise<{ starts: { id: string; start: number }[]; end: number; phases: string[] }>((resolve) => {
          const root = document.querySelector('[data-experience]') as HTMLElement;
          const phases = [root.dataset.phase ?? ''];
          let seen: { starts: { id: string; start: number }[]; end: number } | null = null;
          const observer = new MutationObserver(() => {
            const phase = root.dataset.phase ?? '';
            if (phases.at(-1) !== phase) phases.push(phase);
            if (phase === 'play') {
              const animations = document.getAnimations().filter((animation) => (animation.effect as KeyframeEffect).target?.closest('[data-experience]'));
              const starts = animations
                .filter((animation) => (animation as CSSAnimation).animationName.includes('_grow_') && (animation.effect as KeyframeEffect).target?.className.includes('_fill__'))
                .map((animation) => ({
                  id: ((animation.effect as KeyframeEffect).target as HTMLElement).closest<HTMLElement>('[data-bar]')?.dataset.bar ?? '',
                  start: Number(animation.effect?.getComputedTiming().delay),
                }));
              const end = Math.max(...animations.map((animation) => Number(animation.effect?.getComputedTiming().endTime)));
              seen = { starts, end };
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
    await expect(page.locator(`${SECTION} [data-ruler] [data-year]`)).toHaveCount(9);
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
    await expect.poll(() => row.evaluate((list) => {
      const card = list.querySelector<HTMLElement>('[data-role="anz"]') as HTMLElement;
      return Math.abs(card.getBoundingClientRect().left - (list.getBoundingClientRect().left + Number.parseFloat(getComputedStyle(list).paddingLeft)));
    })).toBeLessThanOrEqual(2);

    // Moving the row to a card moves the lens to its role.
    await row.evaluate((list) => {
      const card = list.querySelector<HTMLElement>('[data-role="telstra"]') as HTMLElement;
      list.scrollTo({ left: card.offsetLeft - Number.parseFloat(getComputedStyle(list).paddingLeft), behavior: 'instant' });
    });
    await expect.poll(() => selectedRole(page)).toBe('telstra');
    await expect(lens).toContainText('Telstra');

    // A tap on a card selects it.
    await page.locator(`${TAB}[data-role="nab"]`).tap();
    expect(await selectedRole(page)).toBe('nab');
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
