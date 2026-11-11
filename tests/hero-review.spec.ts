import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';
import sharp from 'sharp';

import { headlineFigures } from '@/content/proof';
import { cells } from '@/lib/readings';

import { entranceDone, open } from './support';

interface View {
  w: number;
  h: number;
  touch?: boolean;
}

type Scheme = 'dark' | 'light';

async function openView(
  browser: Browser,
  view: View,
  path: string,
  options: { ratio?: number; scheme?: Scheme; javaScript?: boolean; reducedMotion?: boolean } = {},
): Promise<{ context: BrowserContext; page: Page }> {
  const scheme = options.scheme ?? 'dark';
  const context = await browser.newContext({
    viewport: { width: view.w, height: view.h },
    deviceScaleFactor: options.ratio ?? 1,
    hasTouch: view.touch ?? false,
    isMobile: view.touch ?? false,
    colorScheme: scheme,
    javaScriptEnabled: options.javaScript ?? true,
    reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference',
  });
  await context.addInitScript((theme) => {
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* storage can be refused; the colour scheme of the context still applies */
    }
  }, scheme);
  const page = await context.newPage();
  if (options.javaScript === false) await page.goto(path);
  else await open(page, path);
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

async function settled(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__stage !== undefined);
  await page.evaluate(() => window.__stage?.ready);
  await page.evaluate(() => window.__stage?.seek(10_000));
  await entranceDone(page);
  await page.waitForTimeout(300);
}

/** The accent token as the browser resolves it, as three numbers. */
const accentOf = (page: Page): Promise<number[]> =>
  page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'var(--accent)';
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  });

test.describe('the figures: panel headings, notes, focus', { tag: '@desktop' }, () => {
  test('a panel heading starts with its figure, the figure is printed once, and no note says "in one run" or splits a number from its unit', async ({ browser }) => {
    const { context, page } = await openView(browser, { w: 1440, h: 900 }, '/?gl=off');
    try {
      for (const figure of headlineFigures) {
        expect(figure.note, 'no "in one run"').not.toContain('in one run');
        expect(figure.note, 'a number and its unit are one word').not.toMatch(/\d (hours?|minutes?|ms|concurrent)/);
        await page.locator(`[data-detail-trigger="figure-${figure.id}"]`).first().click();
        const item = page.locator('[data-detail-item][data-active="true"]');
        const printed = `${figure.prefix}${figure.value.toLocaleString('en-AU')}${figure.suffix}`;
        const heading = ((await item.locator('h3').innerText()) ?? '').trim();
        expect(heading.startsWith(printed), `${figure.id}: the heading starts with ${printed} (${heading})`).toBe(true);
        expect(/^[a-z]/.test(heading), 'and never with a lowercase letter').toBe(false);
        await expect(item.locator('number-flow-react'), `${figure.id}: the figure is set once, in the heading`).toHaveCount(1);
        await page.keyboard.press('Escape');
      }
    } finally {
      await context.close();
    }
  });

  for (const view of [{ w: 1440, h: 900 }, { w: 390, h: 844, touch: true }]) {
    test(`${view.w} px: a card in focus shows the accent ring on all four sides`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, '/?gl=off');
      try {
        await entranceDone(page);
        const accent = await accentOf(page);
        const card = page.locator('#proof li a').first();
        await card.scrollIntoViewIfNeeded();
        await page.keyboard.press('Tab');
        for (let step = 0; step < 40 && !(await card.evaluate((element) => element === document.activeElement)); step += 1) await page.keyboard.press('Tab');
        await expect(card).toBeFocused();
        const box = await card.evaluate((element) => {
          const { left, top, width, height } = element.getBoundingClientRect();
          return { left, top, width, height };
        });
        const { data, info } = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
        const near = (x: number, y: number): boolean => {
          for (let dy = -3; dy <= 3; dy += 1) {
            for (let dx = -3; dx <= 3; dx += 1) {
              const at = (Math.round(y + dy) * info.width + Math.round(x + dx)) * 3;
              if ([0, 1, 2].every((channel) => Math.abs((data[at + channel] ?? 0) - (accent[channel] ?? 0)) < 24)) return true;
            }
          }
          return false;
        };
        const middle = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
        expect(near(middle.x, box.top + 1), 'top').toBe(true);
        expect(near(middle.x, box.top + box.height - 2), 'bottom').toBe(true);
        expect(near(box.left + 1, middle.y), 'left').toBe(true);
        expect(near(box.left + box.width - 2, middle.y), 'right').toBe(true);
      } finally {
        await context.close();
      }
    });
  }
});

/** The share of every evidence cell's inside that is proof colour, from the pixels of a screenshot. */
async function fillShares(page: Page, ratio: number): Promise<number[]> {
  await page.locator('[data-reading="evidence"][data-place="card"]').scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  const rects = await page.locator('[data-reading="evidence"][data-place="card"] [class*="Readings_cell__"]').evaluateAll((elements) =>
    elements.map((element) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      return [left, top, width, height];
    }),
  );
  const proof = await page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'var(--proof)';
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  });
  const { data, info } = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const luminance = (x: number, y: number): number => {
    const at = (y * info.width + x) * 3;
    return 0.2126 * (data[at] ?? 0) + 0.7152 * (data[at + 1] ?? 0) + 0.0722 * (data[at + 2] ?? 0);
  };
  const full = 0.2126 * (proof[0] ?? 0) + 0.7152 * (proof[1] ?? 0) + 0.0722 * (proof[2] ?? 0);
  const outlineColour = await page.evaluate(() => {
    const probe = document.createElement('i');
    probe.style.color = 'var(--line-strong)';
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return (colour.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
  });
  const outline = 0.2126 * (outlineColour[0] ?? 0) + 0.7152 * (outlineColour[1] ?? 0) + 0.0722 * (outlineColour[2] ?? 0);
  /** How many pixels from the middle of a cell the first pixel of its outline is, going `direction` along `read`. */
  const walk = (read: (step: number) => number, direction: 1 | -1): number => {
    for (let step = 1; step < 200; step += 1) if (Math.abs(read(direction * step) - outline) <= 3) return step;
    return 0;
  };
  const shares: number[] = [];
  for (const [left = 0, top = 0, width = 0, height = 0] of rects) {
    // A cell stands where the browser has snapped it, which is not where its box says: its outline is found in the pixels, in the colour of
    // the line token, walking out from the middle of the cell, and what is inside it is its inside.
    const cx = Math.round((left + width / 2) * ratio);
    const cy = Math.round((top + height / 2) * ratio);
    const inLeft = cx - walk((step) => luminance(cx + step, cy), -1) + 1;
    const inRight = cx + walk((step) => luminance(cx + step, cy), 1) - 1;
    const inTop = cy - walk((step) => luminance(cx, cy + step), -1) + 1;
    const inBottom = cy + walk((step) => luminance(cx, cy + step), 1) - 1;
    const rowsInside = inBottom - inTop + 1;
    const columnsInside = inRight - inLeft + 1;
    const empty = luminance(cx, inTop);
    let sum = 0;
    for (let row = inTop; row <= inBottom; row += 1) {
      let along = 0;
      for (let column = inLeft; column <= inRight; column += 1) along += Math.min(Math.max((luminance(column, row) - empty) / (full - empty), 0), 1);
      sum += along / columnsInside;
    }
    shares.push(sum / rowsInside);
  }
  return shares;
}

test.describe('the evidence reading draws the share that is left, exactly, and its cells are separate squares', { tag: '@desktop' }, () => {
  const cases = [
    { view: { w: 1280, h: 720 }, ratio: 1 },
    { view: { w: 1280, h: 720 }, ratio: 2 },
    { view: { w: 1366, h: 768 }, ratio: 1 },
    { view: { w: 1440, h: 900 }, ratio: 1 },
    { view: { w: 1440, h: 900 }, ratio: 2 },
    { view: { w: 1920, h: 1080 }, ratio: 1 },
    { view: { w: 834, h: 1112, touch: true }, ratio: 1 },
    { view: { w: 834, h: 1112, touch: true }, ratio: 2 },
    { view: { w: 390, h: 844, touch: true }, ratio: 1 },
    { view: { w: 390, h: 844, touch: true }, ratio: 2 },
  ] as const;
  for (const { view, ratio } of cases) {
    for (const gl of ['high', 'off'] as const) {
      test(`${view.w} by ${view.h} at ${ratio}x, ?gl=${gl}: every cell's fill is 8.3% of its inside, within two points`, async ({ browser }) => {
        const { context, page } = await openView(browser, view, `/?gl=${gl}`, { ratio });
        try {
          if (gl === 'high') await settled(page);
          else await entranceDone(page);
          await page.waitForFunction(() => document.querySelectorAll('[data-reading][data-place="card"]:not([data-laid])').length === 0);
          await page.waitForTimeout(500);
          const shares = await fillShares(page, ratio);
          expect(shares, 'all 200 cells').toHaveLength(cells.count);
          const mean = shares.reduce((total, share) => total + share, 0) / shares.length;
          expect(Math.abs(mean - cells.rest), `the mean share ${mean.toFixed(4)}`).toBeLessThanOrEqual(0.02);
          const stray = shares.filter((share) => Math.abs(share - cells.rest) > 0.02);
          expect(stray.length, `cells outside the tolerance: ${stray.slice(0, 5).map((share) => share.toFixed(3)).join(', ')}`).toBeLessThanOrEqual(Math.ceil(shares.length * 0.02));
        } finally {
          await context.close();
        }
      });
    }
  }
});

test.describe('without JavaScript the panel drawings stand clear of their keys, centred on whole pixels', { tag: '@desktop' }, () => {
  for (const view of [{ w: 320, h: 700, touch: true }, { w: 390, h: 844, touch: true }, { w: 834, h: 1112, touch: true }, { w: 1280, h: 720 }, { w: 1440, h: 900 }]) {
    for (const ratio of [1, 2]) {
      test(`${view.w} by ${view.h} at ${ratio}x: each drawing ends 6 px or more above its key and is centred in the room above it`, async ({ browser }) => {
        const { context, page } = await openView(browser, view, '/', { ratio, javaScript: false });
        try {
          const tiles = await page.evaluate(() =>
            [...document.querySelectorAll<HTMLElement>('[data-reading][data-place="panel"]')].map((tile) => {
              const box = tile.getBoundingClientRect();
              const key = (tile.querySelector('[class*="Readings_key__"]') as HTMLElement).getBoundingClientRect();
              const drawing = tile.querySelector<HTMLElement>('[class*="Readings_lattice__"]') ?? tile.querySelector<HTMLElement>('[class*="Readings_cohort__"]');
              const marks = [...tile.querySelectorAll<HTMLElement>('[class*="Readings_mark__"]')].map((mark) => mark.getBoundingClientRect());
              const drawn = drawing?.getBoundingClientRect();
              const top = marks.length > 0 ? Math.min(...marks.map((mark) => mark.top)) : (drawn?.top ?? 0);
              const bottom = marks.length > 0 ? Math.max(...marks.map((mark) => mark.bottom)) : (drawn?.bottom ?? 0);
              return { id: tile.dataset.reading ?? '', top: box.top, key: key.top, drawingTop: top, drawingBottom: bottom, whole: drawn ? Number.isInteger((drawn.left - box.left) * devicePixelRatio) && Number.isInteger((drawn.top - box.top) * devicePixelRatio) : true };
            }),
          );
          expect(tiles, 'three panels').toHaveLength(3);
          for (const tile of tiles.filter((entry) => entry.id !== 'evidence')) {
            expect(tile.key - tile.drawingBottom, `${tile.id}: clear of the key`).toBeGreaterThanOrEqual(6);
            const room = (tile.top + tile.key) / 2;
            expect(Math.abs((tile.drawingTop + tile.drawingBottom) / 2 - room), `${tile.id}: centred above the key`).toBeLessThanOrEqual(2);
            expect(tile.whole, `${tile.id}: on a whole pixel`).toBe(true);
          }
        } finally {
          await context.close();
        }
      });
    }
  }

  for (const view of [{ w: 390, h: 844, touch: true }, { w: 1440, h: 900 }]) {
    test(`${view.w} px: no Ask Mini Vic control that does nothing is on the page`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, '/', { javaScript: false });
      try {
        await expect(page.locator('#assistant-launcher')).toBeHidden();
        await expect(page.locator('#assistant-header-button')).toBeHidden();
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('the enlarged portfolio reading fills its tile', { tag: '@desktop' }, () => {
  for (const view of [{ w: 1440, h: 900 }, { w: 834, h: 1112, touch: true }, { w: 390, h: 844, touch: true }]) {
    test(`${view.w} px: the marks span 70% of the tile and are centred above the key`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, '/?gl=off');
      try {
        await entranceDone(page);
        await page.locator('[data-detail-trigger="figure-portfolio"]').first().click();
        const tile = page.locator('[data-reading="portfolio"][data-place="panel"]');
        await expect(tile).toHaveAttribute('data-laid', '');
        await page.waitForTimeout(700);
        const measured = await tile.evaluate((element) => {
          const box = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          const border = Number.parseFloat(style.borderLeftWidth);
          const key = (element.querySelector('[class*="Readings_key__"]') as HTMLElement).getBoundingClientRect();
          const marks = [...element.querySelectorAll('[class*="Readings_mark__"]')].map((mark) => mark.getBoundingClientRect());
          return {
            inner: box.width - 2 * border,
            span: Math.max(...marks.map((mark) => mark.right)) - Math.min(...marks.map((mark) => mark.left)),
            centre: (Math.max(...marks.map((mark) => mark.bottom)) + Math.min(...marks.map((mark) => mark.top))) / 2,
            room: (box.top + border + key.top) / 2,
          };
        });
        expect(measured.span / measured.inner, 'the marks span most of the tile').toBeGreaterThanOrEqual(0.7);
        expect(Math.abs(measured.centre - measured.room), 'and are centred above the key').toBeLessThanOrEqual(4);
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('no dead band between the actions and the readings', { tag: '@desktop' }, () => {
  for (const view of [{ w: 1024, h: 1366, touch: true }, { w: 1366, h: 1024, touch: true }, { w: 1920, h: 1080 }, { w: 2560, h: 1440 }]) {
    test(`${view.w} by ${view.h}: the gap is at most the space above the eyebrow, one and a half times, and 220 px`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, '/?gl=off');
      try {
        await entranceDone(page);
        const gaps = await page.evaluate(() => {
          const section = document.getElementById('top') as HTMLElement;
          const eyebrow = (section.querySelector('p') as HTMLElement).getBoundingClientRect();
          const actions = Math.max(...[...section.querySelectorAll('a')].map((link) => link.getBoundingClientRect().bottom));
          const readings = Math.min(...[...document.querySelectorAll('#proof li')].map((card) => card.getBoundingClientRect().top));
          const header = (document.querySelector('header') as HTMLElement).getBoundingClientRect().bottom;
          return { below: readings - actions, above: eyebrow.top - header };
        });
        expect(gaps.below, `below ${gaps.below}, above ${gaps.above}`).toBeLessThanOrEqual(Math.min(220, 1.5 * gaps.above));
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('the figure drawing travels as an element of its own while a panel grows', { tag: '@desktop' }, () => {
  for (const view of [{ w: 1440, h: 900 }, { w: 390, h: 844, touch: true }]) {
    test(`${view.w} px: the card's drawing and the panel's are named for the morph, and the names are gone when it ends`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, '/?gl=off');
      try {
        await entranceDone(page);
        const seen = await page.evaluate(async () => {
          const trigger = document.querySelector<HTMLElement>('[data-detail-trigger="figure-evidence"]') as HTMLElement;
          const named = (): string[] =>
            [...document.querySelectorAll<HTMLElement>('[data-carry]')]
              .filter((element) => element.style.getPropertyValue('view-transition-name') === 'detail-reading')
              .map((element) => (element.closest('dialog') ? 'panel' : 'card'));
          trigger.click();
          const where = new Set(named());
          const reading: string[] = [];
          const end = performance.now() + 4000;
          let started = false;
          while (performance.now() < end) {
            await new Promise((resolve) => requestAnimationFrame(resolve));
            const running = document.documentElement.dataset.vt === 'detail';
            if (running) started = true;
            if (started && !running) break;
            for (const place of named()) where.add(place);
            for (const animation of document.getAnimations()) {
              const effect = animation.effect as KeyframeEffect | null;
              if (effect?.pseudoElement?.includes('detail-reading')) reading.push(`${effect.pseudoElement}:${(animation as CSSAnimation).animationName}`);
            }
          }
          return { where: [...where].sort(), reading: [...new Set(reading)], after: named().length };
        });
        expect(seen.where, "the card's drawing is named for the old state and the panel's for the new").toEqual(['card', 'panel']);
        expect(seen.reading.some((name) => name.includes('old(detail-reading)')), `the card's copy is animated (${seen.reading.join(', ')})`).toBe(true);
        expect(seen.after, 'no name is left behind').toBe(0);
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('the card keys state what a mark is, and the fill, in a line that fits', { tag: '@desktop' }, () => {
  for (const view of [
    { w: 320, h: 700, touch: true },
    { w: 390, h: 844, touch: true },
    { w: 768, h: 1024, touch: true },
    { w: 834, h: 1112, touch: true },
    { w: 1024, h: 768 },
    { w: 1280, h: 720 },
    { w: 1440, h: 900 },
    { w: 1920, h: 1080 },
  ] as const) {
    test(`${view.w} px: no key is cut, the evidence key says what the fill is, and no key repeats a number printed on its card`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, '/?gl=off');
      try {
        await entranceDone(page);
        const cards = await page.locator('#proof li').evaluateAll((items) =>
          items.map((item) => {
            const key = item.querySelector('[class*="Readings_key__"]') as HTMLElement;
            const own = [...key.querySelectorAll<HTMLElement>('[class*="Readings_keyText__"], [class*="Readings_legend__"]')];
            const figure = (item.querySelector('[class*="Readings_text__"]') as HTMLElement).innerText;
            return {
              keyText: key.innerText.replace(/\s+/g, ' ').trim(),
              cut: key.scrollWidth - key.clientWidth,
              partsCut: own.map((part) => {
                const around = key.getBoundingClientRect();
                const box = part.getBoundingClientRect();
                return box.width === 0 ? 0 : Math.max(around.left - box.left, box.right - around.right, 0);
              }),
              card: figure,
            };
          }),
        );
        for (const card of cards) {
          expect(card.cut, `the key "${card.keyText}" is not cut`).toBeLessThanOrEqual(0);
          for (const cut of card.partsCut) expect(cut, 'nor is a part of it').toBeLessThanOrEqual(0);
          const numbersInKey = card.keyText.match(/\d[\d,.]*/g) ?? [];
          for (const number of numbersInKey) {
            if (number === '1') continue;
            expect(card.card.includes(number), `the number ${number} of the key "${card.keyText}" is not printed on the card`).toBe(false);
          }
        }
        const evidence = cards[0];
        expect(evidence?.keyText, 'the evidence key states the fill convention').toMatch(/fill|≈3 h/);
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('on a tall phone the extra height goes to the tile, not to the text', { tag: '@desktop' }, () => {
  for (const view of [
    { w: 412, h: 915, touch: true },
    { w: 430, h: 932, touch: true },
  ] as const) {
    test(`${view.w} by ${view.h}: the scope line ends within 20 px of the card's bottom border`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, '/?gl=off');
      try {
        await entranceDone(page);
        const gaps = await page.locator('#proof li a').evaluateAll((cards) =>
          cards.map((card) => {
            const scope = card.querySelector('[class*="Readings_text__"] > span:last-of-type') as HTMLElement;
            const range = document.createRange();
            range.selectNodeContents(scope);
            const lines = [...range.getClientRects()];
            const last = lines[lines.length - 1];
            return card.getBoundingClientRect().bottom - (last?.bottom ?? 0);
          }),
        );
        for (const gap of gaps) expect(gap, 'from the last line of the scope to the border').toBeLessThanOrEqual(20);
      } finally {
        await context.close();
      }
    });
  }

  test('320 by 700: the two actions are equal and the row of readings says that it moves', async ({ browser }) => {
    const { context, page } = await openView(browser, { w: 320, h: 700, touch: true }, '/?gl=off');
    try {
      await entranceDone(page);
      const actions = await page.locator('#top a[href="#work"], #top a[download]').evaluateAll((links) => links.map((link) => link.getBoundingClientRect().width));
      expect(actions, 'two actions').toHaveLength(2);
      expect(Math.abs((actions[0] ?? 0) - (actions[1] ?? 1)), 'equal width').toBeLessThanOrEqual(1);
      const indicator = await page.locator('#proof section, #proof').first().evaluate((group) => {
        const line = group.querySelector('[class*="Readings_progress__"]');
        return line ? getComputedStyle(line).display : 'none';
      });
      expect(indicator, 'the line that shows how far along the row is').not.toBe('none');
    } finally {
      await context.close();
    }
  });
});

test.describe('the page has one career timeline, and it is in Experience', { tag: '@desktop' }, () => {
  const modes: readonly { name: string; path: string; options: { javaScript?: boolean; reducedMotion?: boolean } }[] = [
    { name: 'the stage on', path: '/?gl=high', options: {} },
    { name: '?gl=off', path: '/?gl=off', options: {} },
    { name: 'reduced motion', path: '/?gl=high', options: { reducedMotion: true } },
    { name: 'JavaScript off', path: '/', options: { javaScript: false } },
  ];
  for (const width of [320, 390, 834, 1280, 1440, 1920]) {
    for (const mode of modes) {
      test(`${width} px, ${mode.name}: nothing of a career scale is in the hero, and the only full-width timeline is in #experience`, async ({ browser }) => {
        const { context, page } = await openView(browser, { w: width, h: width < 700 ? 844 : 900, touch: width < 1000 }, mode.path, mode.options);
        try {
          const found = await page.evaluate(() => {
            const hero = document.querySelector('#top');
            const inExperience = (element: Element): boolean => element.closest('#experience') !== null;
            const clientWidth = document.documentElement.clientWidth;
            const wide = [...document.querySelectorAll<HTMLElement>('[data-timeline], [data-ruler], [data-career-scale]')];
            return {
              scale: document.querySelector('#top [data-career-scale]') === null && document.querySelector('[data-career-scale]') === null,
              tabsInHero: hero?.querySelectorAll('[role="tab"]').length ?? -1,
              numeralsInHero: hero?.querySelectorAll('[data-year], [data-ruler]').length ?? -1,
              outside: wide.filter((element) => !inExperience(element)).length,
              timelines: [...document.querySelectorAll<HTMLElement>('#experience [data-timeline]')].map((element) => Math.round(element.getBoundingClientRect().width) - clientWidth),
            };
          });
          expect(found.scale, 'no [data-career-scale] anywhere').toBe(true);
          expect(found.tabsInHero, 'no tab in the hero').toBe(0);
          expect(found.numeralsInHero, 'no ruler or year numeral in the hero').toBe(0);
          expect(found.outside, 'no timeline or ruler outside #experience').toBe(0);
          expect(found.timelines, 'one timeline, as wide as the browser').toEqual([0]);
        } finally {
          await context.close();
        }
      });
    }
  }
});
