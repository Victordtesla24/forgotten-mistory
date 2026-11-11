import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';
import sharp from 'sharp';

import { careerBars } from '@/lib/timeline';
import { headlineFigures } from '@/content/proof';
import { cells, cohort, points, readingLayout, type ReadingId } from '@/lib/readings';

import { entranceDone, open } from './support';

/** The views of the gate's matrix, with the kind of screen each is. */
interface View {
  w: number;
  h: number;
  touch: boolean;
}

const TOUCH: readonly View[] = [
  { w: 320, h: 700, touch: true },
  { w: 390, h: 844, touch: true },
  { w: 768, h: 1024, touch: true },
  { w: 834, h: 1112, touch: true },
];
const DESKTOP: readonly View[] = [
  { w: 1280, h: 720, touch: false },
  { w: 1366, h: 768, touch: false },
  { w: 1440, h: 900, touch: false },
  { w: 1920, h: 1080, touch: false },
];
const MATRIX: readonly View[] = [...TOUCH, ...DESKTOP];

const SCALE = '[data-career-scale]';

test('the counts the readings draw are the figures of content/proof.ts', { tag: '@desktop' }, () => {
  const count = (id: ReadingId) => headlineFigures.find((figure) => figure.id === id)?.marks.count;
  expect(points.count).toBe(count('telemetry'));
  expect(points.blockColumns * points.blockRows * points.perBlock).toBe(points.count);
  expect(points.perBlock).toBe(points.side * points.side);
  expect(cells.count).toBe(count('evidence'));
  expect(cells.columns * cells.rows).toBe(cells.count);
  expect(cohort.count).toBe(count('portfolio'));
  expect(cohort.groups * cohort.across * cohort.down).toBe(cohort.count);
  expect(cohort.perGroup).toBe(cohort.across * cohort.down);
});
const IDS: readonly ReadingId[] = ['evidence', 'portfolio', 'telemetry'];

async function openView(
  browser: Browser,
  view: View,
  ratio: number,
  path: string,
  options: { scheme?: 'dark' | 'light'; javaScript?: boolean } = {},
): Promise<{ context: BrowserContext; page: Page }> {
  const scheme = options.scheme ?? 'dark';
  const context = await browser.newContext({
    viewport: { width: view.w, height: view.h },
    deviceScaleFactor: ratio,
    hasTouch: view.touch,
    isMobile: view.touch,
    colorScheme: scheme,
    javaScriptEnabled: options.javaScript ?? true,
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

/** Waits for the review hook and for its `ready` promise, then freezes the stage clock at a settled time. */
async function stageSettled(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__stage !== undefined);
  await page.evaluate(() => window.__stage?.ready);
  await page.evaluate(() => window.__stage?.seek(10_000));
}

interface Tile {
  width: number;
  height: number;
  left: number;
  top: number;
}

/** A reading's tile as its drawing is placed in it: the padding box, in CSS pixels. */
function tileOf(page: Page, id: ReadingId, place: 'card' | 'panel' = 'card'): Promise<Tile> {
  return page.locator(`[data-reading="${id}"][data-place="${place}"]`).first().evaluate((element: HTMLElement) => {
    const box = element.getBoundingClientRect();
    return {
      width: box.width - (element.offsetWidth - element.clientWidth),
      height: box.height - (element.offsetHeight - element.clientHeight),
      left: box.left + element.clientLeft,
      top: box.top + element.clientTop,
    };
  });
}

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const rectsOf = (page: Page, selector: string): Promise<Rect[]> =>
  page.locator(selector).evaluateAll((elements) =>
    elements.map((element) => {
      const { left, top, right, bottom } = element.getBoundingClientRect();
      return { left, top, right, bottom };
    }),
  );

const union = (rects: readonly Rect[]): Rect => ({
  left: Math.min(...rects.map((rect) => rect.left)),
  top: Math.min(...rects.map((rect) => rect.top)),
  right: Math.max(...rects.map((rect) => rect.right)),
  bottom: Math.max(...rects.map((rect) => rect.bottom)),
});

/** What the DOM drawings may differ from the layout by: the gate's own tolerance for the two layers. */
const WITHIN = 1;

test.describe('every reading keeps its marks countable, at every size and on both kinds of screen', { tag: '@desktop' }, () => {
  for (const view of MATRIX) {
    for (const ratio of [1, 2]) {
      test(`${view.w} by ${view.h} at ${ratio}x: the layout is countable and the DOM draws exactly it`, async ({ browser }) => {
        const { context, page } = await openView(browser, view, ratio, '/?gl=off');
        try {
          await entranceDone(page);

          // Telemetry: 10,000 points where each can be told apart, otherwise 100 distinct blocks of 100 and the key.
          const telemetryTile = await tileOf(page, 'telemetry');
          const telemetry = readingLayout('telemetry', { width: telemetryTile.width, height: telemetryTile.height, ratio });
          expect(telemetry.drawn * telemetry.unit, 'every device is drawn, or accounted for by a block').toBe(10_000);
          expect(telemetry.mark, 'a mark is at least one device pixel').toBeGreaterThanOrEqual(1);
          expect(telemetry.pitch - telemetry.mark, 'and at least one device pixel from its neighbours').toBeGreaterThanOrEqual(1);
          if (telemetry.mode === 'points') {
            expect(telemetry.pitch, 'points are drawn only where they can be told apart').toBeGreaterThanOrEqual(2);
            expect(telemetry.key).toBeNull();
          } else {
            expect(telemetry.drawn, 'exactly 100 blocks').toBe(100);
            expect(telemetry.unit).toBe(100);
            await expect(page.locator('[data-reading="telemetry"][data-place="card"] [class*="Readings_key__"]')).toHaveText('1 block = 100 devices');
          }
          await expect(page.locator('[data-reading="telemetry"][data-place="card"]')).toHaveAttribute('data-mode', telemetry.mode);
          const [lattice] = await rectsOf(page, '[data-reading="telemetry"][data-place="card"] [class*="Readings_lattice__"]');
          expect(lattice, 'the lattice is in the DOM drawing').toBeDefined();
          if (lattice) {
            expect(Math.abs(lattice.left - telemetryTile.left - telemetry.frame.x / ratio), 'lattice left').toBeLessThanOrEqual(WITHIN);
            expect(Math.abs(lattice.top - telemetryTile.top - telemetry.frame.y / ratio), 'lattice top').toBeLessThanOrEqual(WITHIN);
            expect(Math.abs(lattice.right - lattice.left - telemetry.frame.width / ratio), 'lattice width').toBeLessThanOrEqual(WITHIN);
            expect(Math.abs(lattice.bottom - lattice.top - telemetry.frame.height / ratio), 'lattice height').toBeLessThanOrEqual(WITHIN);
          }

          // Evidence: 200 separate cells, each fill a pixel in from its cell, never under two device pixels tall.
          const evidenceTile = await tileOf(page, 'evidence');
          const evidence = readingLayout('evidence', { width: evidenceTile.width, height: evidenceTile.height, ratio });
          expect(evidence.fillWidth, 'a fill is at least one device pixel wide').toBeGreaterThanOrEqual(1);
          expect(evidence.pitchX - evidence.fillWidth, 'neighbouring fills never touch: their cells, outlines and insets are between').toBeGreaterThanOrEqual(2 * (evidence.outline + evidence.inset));
          expect(evidence.floor, 'a fill is at least two device pixels tall').toBeGreaterThanOrEqual(2);
          expect(evidence.room, 'and there is room for it').toBeGreaterThanOrEqual(evidence.floor);
          const cells = await rectsOf(page, '[data-reading="evidence"][data-place="card"] [class*="Readings_cell__"]');
          expect(cells, 'all 200 cells').toHaveLength(200);
          const firstCell = cells[0];
          const lastCell = cells.at(-1);
          if (firstCell && lastCell) {
            expect(Math.abs(firstCell.left - evidenceTile.left - evidence.frame.x / ratio), 'first cell left').toBeLessThanOrEqual(WITHIN);
            expect(Math.abs(firstCell.top - evidenceTile.top - evidence.frame.y / ratio), 'first cell top').toBeLessThanOrEqual(WITHIN);
            expect(Math.abs(lastCell.right - evidenceTile.left - (evidence.frame.x + evidence.frame.width) / ratio), 'last cell right').toBeLessThanOrEqual(WITHIN);
            expect(Math.abs(lastCell.bottom - evidenceTile.top - (evidence.frame.y + evidence.frame.height) / ratio), 'last cell bottom').toBeLessThanOrEqual(WITHIN);
          }
          const outline = await page.locator('[data-reading="evidence"][data-place="card"] [class*="Readings_cell__"]').first().evaluate((cell) => {
            const probe = document.createElement('i');
            probe.style.borderTop = '1px solid var(--line-strong)';
            document.body.append(probe);
            const token = getComputedStyle(probe).borderTopColor;
            probe.remove();
            return { cell: getComputedStyle(cell).borderTopColor, token };
          });
          expect(outline.cell, 'the outline of a cell is --line-strong').toBe(outline.token);

          // Portfolio: 40 separate marks in 5 groups, with a gap between groups wider than any inside one.
          const portfolioTile = await tileOf(page, 'portfolio');
          const portfolio = readingLayout('portfolio', { width: portfolioTile.width, height: portfolioTile.height, ratio });
          expect(portfolio.mark).toBeGreaterThanOrEqual(1);
          expect(portfolio.pitch - portfolio.mark, 'marks are a device pixel apart at the least').toBeGreaterThanOrEqual(1);
          const between = portfolio.groupPitch - (portfolio.across - 1) * portfolio.pitch - portfolio.mark;
          expect(between, 'the gap between groups is wider than the gap inside one').toBeGreaterThan(portfolio.pitch - portfolio.mark);
          expect(between, 'and is at least two device pixels').toBeGreaterThanOrEqual(2);
          const marks = await page.locator('[data-reading="portfolio"][data-place="card"] [class*="Readings_mark__"]').evaluateAll((elements) =>
            elements.map((element) => {
              const { left, right, top, bottom } = element.getBoundingClientRect();
              return { left, right, top, bottom, group: Number((element as HTMLElement).style.getPropertyValue('--g')) };
            }),
          );
          expect(marks, '40 marks').toHaveLength(40);
          expect(new Set(marks.map((mark) => mark.group)).size, 'in five groups').toBe(cohort.groups);
          expect(Math.abs(Math.min(...marks.map((mark) => mark.left)) - portfolioTile.left - portfolio.frame.x / ratio), 'marks left').toBeLessThanOrEqual(WITHIN);
          expect(Math.abs(Math.max(...marks.map((mark) => mark.right)) - portfolioTile.left - (portfolio.frame.x + portfolio.frame.width) / ratio), 'marks right').toBeLessThanOrEqual(WITHIN);
          const rightOfGroup = (group: number) => Math.max(...marks.filter((mark) => mark.group === group).map((mark) => mark.right));
          const leftOfGroup = (group: number) => Math.min(...marks.filter((mark) => mark.group === group).map((mark) => mark.left));
          for (let group = 0; group < cohort.groups - 1; group += 1) {
            expect(Math.abs(leftOfGroup(group + 1) - rightOfGroup(group) - between / ratio), `groups ${group} and ${group + 1} are the layout's gap apart`).toBeLessThanOrEqual(WITHIN);
          }
        } finally {
          await context.close();
        }
      });
    }
  }
});

/** The pixels of the canvas inside a tile, with the DOM drawing above it hidden, as the gate looks at them. */
async function glPixels(page: Page, tile: Tile, ratio: number): Promise<{ data: Buffer; width: number; height: number; channels: number }> {
  const hide = await page.addStyleTag({ content: '[data-stage-view] > :not(canvas) { visibility: hidden !important; }' });
  const shot = await page.screenshot({
    clip: { x: Math.floor(tile.left), y: Math.floor(tile.top), width: Math.ceil(tile.width) + 1, height: Math.ceil(tile.height) + 1 },
  });
  await hide.evaluate((element) => (element as Element).remove());
  const { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  expect(info.width, 'the shot is taken at the screen ratio').toBe((Math.ceil(tile.width) + 1) * ratio);
  return { data, width: info.width, height: info.height, channels: info.channels };
}

/** The extent of the warm pixels (the proof colour) in the canvas shot, in CSS pixels from the tile's padding box. */
function warmExtent(shot: { data: Buffer; width: number; height: number; channels: number }, tile: Tile, ratio: number): Rect | null {
  const offset = { x: tile.left - Math.floor(tile.left), y: tile.top - Math.floor(tile.top) };
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (let y = 0; y < shot.height; y += 1) {
    for (let x = 0; x < shot.width; x += 1) {
      const at = (y * shot.width + x) * shot.channels;
      const r = shot.data[at] ?? 0;
      const b = shot.data[at + 2] ?? 0;
      if (r > 100 && r - b > 50) {
        left = Math.min(left, x);
        top = Math.min(top, y);
        right = Math.max(right, x + 1);
        bottom = Math.max(bottom, y + 1);
      }
    }
  }
  if (right < 0) return null;
  return { left: left / ratio - offset.x, top: top / ratio - offset.y, right: right / ratio - offset.x, bottom: bottom / ratio - offset.y };
}

test.describe('the GL layer draws the layout the DOM draws', { tag: '@desktop' }, () => {
  const cases = [
    { view: DESKTOP[2], ratio: 1 },
    { view: DESKTOP[2], ratio: 2 },
    { view: DESKTOP[0], ratio: 1 },
    { view: TOUCH[3], ratio: 1 },
  ] as const;
  for (const { view, ratio } of cases) {
    if (!view) continue;
    test(`${view.w} by ${view.h} at ${ratio}x: telemetry and the portfolio land where the layout puts them, within a pixel`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, ratio, '/?gl=high');
      try {
        await stageSettled(page);
        await entranceDone(page);
        const telemetryTile = await tileOf(page, 'telemetry');
        const telemetry = readingLayout('telemetry', { width: telemetryTile.width, height: telemetryTile.height, ratio });
        const drawn = warmExtent(await glPixels(page, telemetryTile, ratio), telemetryTile, ratio);
        expect(drawn, 'the canvas drew telemetry').not.toBeNull();
        if (drawn) {
          expect(Math.abs(drawn.left - telemetry.frame.x / ratio), 'telemetry left').toBeLessThanOrEqual(WITHIN);
          expect(Math.abs(drawn.right - (telemetry.frame.x + telemetry.frame.width) / ratio), 'telemetry right').toBeLessThanOrEqual(WITHIN);
          expect(Math.abs(drawn.top - telemetry.frame.y / ratio), 'telemetry top').toBeLessThanOrEqual(WITHIN);
          expect(Math.abs(drawn.bottom - (telemetry.frame.y + telemetry.frame.height) / ratio), 'telemetry bottom').toBeLessThanOrEqual(WITHIN);
        }
        await expect(page.locator('[data-stage-view="reading-telemetry"]')).toHaveAttribute('data-drawn', String(telemetry.drawn));

        const portfolioTile = await tileOf(page, 'portfolio');
        const portfolio = readingLayout('portfolio', { width: portfolioTile.width, height: portfolioTile.height, ratio });
        const marks = warmExtent(await glPixels(page, portfolioTile, ratio), portfolioTile, ratio);
        expect(marks, 'the canvas drew the portfolio').not.toBeNull();
        if (marks) {
          expect(Math.abs(marks.left - portfolio.frame.x / ratio), 'portfolio left').toBeLessThanOrEqual(WITHIN);
          expect(Math.abs(marks.right - (portfolio.frame.x + portfolio.frame.width) / ratio), 'portfolio right').toBeLessThanOrEqual(WITHIN);
          expect(Math.abs(marks.top - portfolio.frame.y / ratio), 'portfolio top').toBeLessThanOrEqual(WITHIN);
          expect(Math.abs(marks.bottom - (portfolio.frame.y + portfolio.frame.height) / ratio), 'portfolio bottom').toBeLessThanOrEqual(WITHIN);
        }

        const evidenceTile = await tileOf(page, 'evidence');
        const evidence = readingLayout('evidence', { width: evidenceTile.width, height: evidenceTile.height, ratio });
        const fills = warmExtent(await glPixels(page, evidenceTile, ratio), evidenceTile, ratio);
        expect(fills, 'the canvas drew the evidence').not.toBeNull();
        if (fills) {
          const inside = (evidence.outline + evidence.inset) / ratio;
          expect(Math.abs(fills.left - evidence.frame.x / ratio - inside), 'first fill left').toBeLessThanOrEqual(WITHIN);
          expect(Math.abs(fills.right - (evidence.frame.x + evidence.frame.width) / ratio + inside), 'last fill right').toBeLessThanOrEqual(WITHIN);
        }
      } finally {
        await context.close();
      }
    });
  }
});

/** Waits until the stage has stopped drawing: the frame counter reads the same on two looks a short while apart. */
async function framesStable(page: Page, timeout = 15_000): Promise<void> {
  let previous = -1;
  await expect
    .poll(
      async () => {
        const now = await page.evaluate(() => window.__stage?.info().frames ?? -1);
        const same = now === previous;
        previous = now;
        return same;
      },
      { message: 'the frame counter is stable', timeout, intervals: [300] },
    )
    .toBe(true);
}

/** The pixels of a whole screenshot, as raw RGB. */
async function screen(page: Page): Promise<{ data: Buffer; width: number; height: number; channels: number }> {
  const { data, info } = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height, channels: info.channels };
}

const pixelAt = (shot: { data: Buffer; width: number; channels: number }, x: number, y: number): [number, number, number] => {
  const at = (y * shot.width + x) * shot.channels;
  return [shot.data[at] ?? 0, shot.data[at + 1] ?? 0, shot.data[at + 2] ?? 0];
};

/** The tight rectangle of the headline block: its words as far as they reach, and its actions and links. */
const headlineBlock = (page: Page): Promise<Rect> =>
  page.evaluate(() => {
    const section = document.getElementById('top') as HTMLElement;
    const parts: DOMRect[] = [];
    for (const text of section.querySelectorAll('p, h1')) {
      const range = document.createRange();
      range.selectNodeContents(text);
      parts.push(range.getBoundingClientRect());
    }
    for (const control of section.querySelectorAll('a')) parts.push(control.getBoundingClientRect());
    return {
      left: Math.min(...parts.map((part) => part.left)),
      top: Math.min(...parts.map((part) => part.top)),
      right: Math.max(...parts.map((part) => part.right)),
      bottom: Math.max(...parts.map((part) => part.bottom)),
    };
  });

test.describe('the field never shows behind a reading card or the headline block', { tag: '@desktop' }, () => {
  const views: readonly View[] = [DESKTOP[0], DESKTOP[2], DESKTOP[3], TOUCH[3], TOUCH[1]].filter((view): view is View => view !== undefined);
  for (const view of views) {
    for (const scheme of ['dark', 'light'] as const) {
      test(`${view.w} by ${view.h}, ${scheme}: every card is the surface colour all the way round its marks, and the field has nothing in the headline block`, async ({ browser }) => {
        const { context, page } = await openView(browser, view, 1, '/?gl=high', { scheme });
        try {
          await stageSettled(page);
          await entranceDone(page);
          const surface = await page.evaluate(() => {
            const probe = document.createElement('i');
            probe.style.backgroundColor = 'var(--surface)';
            document.body.append(probe);
            const colour = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return (colour.match(/\d+/g) ?? []).slice(0, 3).map(Number);
          });
          const shot = await screen(page);
          const cards = await rectsOf(page, '#proof li');
          // The line between a card's tile and its text is the card's own: it is left out of the strips.
          const dividers = await rectsOf(page, '#proof li [data-reading]');
          let sampled = 0;
          for (const [index, card] of cards.entries()) {
            if (card.left < 0 || card.right > view.w || card.top < 0 || card.bottom > view.h) continue;
            // The padding down each side of a card holds no mark and no text; a lane or a tick or the sweep line resting on an edge would cross it.
            const strips = [
              { from: Math.round(card.left) + 5, to: Math.round(card.left) + 10 },
              { from: Math.round(card.right) - 10, to: Math.round(card.right) - 6 },
            ];
            const divider = Math.round(dividers[index]?.bottom ?? -100);
            let worst = { off: 0, at: '' };
            for (const strip of strips) {
              for (let y = Math.round(card.top) + 14; y < Math.round(card.bottom) - 14; y += 1) {
                if (Math.abs(y - divider) <= 2) continue;
                for (let x = strip.from; x <= strip.to; x += 1) {
                  const pixel = pixelAt(shot, x, y);
                  const off = Math.max(...pixel.map((value, channel) => Math.abs(value - (surface[channel] ?? 0))));
                  if (off > worst.off) worst = { off, at: `${x},${y}: ${pixel.join(',')}` };
                }
              }
            }
            expect(worst.off, `card ${index} is the surface colour ${surface.join(',')} where it has no mark; the worst pixel is ${worst.at}`).toBeLessThanOrEqual(3);

            // The card's last pixels hold its border and the edge of its tile, where the sweep line of telemetry used to rest: nothing there is the accent.
            let accent = 0;
            for (let y = Math.round(card.top) + 14; y < Math.round(card.bottom) - 14; y += 1) {
              if (Math.abs(y - divider) <= 2) continue;
              for (let x = Math.round(card.right) - 5; x <= Math.round(card.right); x += 1) {
                const [r, , b] = pixelAt(shot, x, y);
                accent = Math.max(accent, b - r);
              }
            }
            expect(accent, `card ${index}: no accent line rests on its edge`).toBeLessThan(40);
            sampled += 1;
          }
          expect(sampled, 'cards were sampled').toBeGreaterThanOrEqual(1);

          // The canvas alone, inside the headline block: nothing but the smooth glow and its grain (a step of 9 at most between pixels four apart). A lane or a tick is a step of 30 or more.
          const block = await headlineBlock(page);
          const hide = await page.addStyleTag({
            content: 'main, header, footer, a[href="#main"], #assistant-launcher, [data-stage-view] { visibility: hidden !important; }',
          });
          const canvas = await screen(page);
          await hide.evaluate((element) => (element as Element).remove());
          const [x0, x1, y0, y1] = [Math.ceil(block.left) + 2, Math.floor(block.right) - 6, Math.ceil(block.top) + 2, Math.floor(block.bottom) - 6];
          let sharpest = 0;
          for (let y = y0; y < y1; y += 1) {
            for (let x = x0; x < x1; x += 1) {
              const here = pixelAt(canvas, x, y);
              for (const next of [pixelAt(canvas, x + 4, y), pixelAt(canvas, x, y + 4)]) {
                sharpest = Math.max(sharpest, ...here.map((value, channel) => Math.abs(value - (next[channel] ?? 0))));
              }
            }
          }
          expect(sharpest, 'the largest step between pixels four apart inside the headline block').toBeLessThanOrEqual(12);
        } finally {
          await context.close();
        }
      });
    }
  }
});

test.describe('the enlarged reading in a panel draws every mark, countably, at every size', { tag: '@desktop' }, () => {
  const cases: readonly { view: View; ratio: number }[] = [...MATRIX.map((view) => ({ view, ratio: 1 })), { view: DESKTOP[2] as View, ratio: 2 }, { view: TOUCH[1] as View, ratio: 2 }];
  for (const { view, ratio } of cases) {
    test(`${view.w} by ${view.h} at ${ratio}x: all 10,000 points, and the other two readings, as the layout draws them`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, ratio, '/?gl=off');
      try {
        for (const id of IDS) {
          await page.locator(`[data-detail-trigger="figure-${id}"]`).first().click();
          const tile = page.locator(`[data-reading="${id}"][data-place="panel"]`);
          await expect(tile, id).toBeVisible();
          await entranceDone(page);
          const box = await tileOf(page, id, 'panel');
          const layout = readingLayout(id, { width: box.width, height: box.height, ratio }, 'panel');
          if (layout.id === 'telemetry') {
            expect(layout.mode, 'every point is drawn').toBe('points');
            expect(layout.drawn).toBe(10_000);
            expect(layout.pitch, 'a pitch of two device pixels at the least').toBeGreaterThanOrEqual(2);
            expect(layout.pitch - layout.mark, 'a device pixel between points').toBeGreaterThanOrEqual(1);
            expect(layout.frame.x, 'inside the tile').toBeGreaterThanOrEqual(0);
            expect(layout.frame.x + layout.frame.width, 'inside the tile, right').toBeLessThanOrEqual(box.width * ratio + 1);
            expect(layout.frame.y + layout.frame.height, 'inside the tile, bottom').toBeLessThanOrEqual(box.height * ratio + 1);
            const [lattice] = await rectsOf(page, '[data-reading="telemetry"][data-place="panel"] [class*="Readings_lattice__"]');
            expect(lattice).toBeDefined();
            if (lattice) {
              expect(Math.abs(lattice.right - lattice.left - layout.frame.width / ratio), 'the DOM lattice is the layout').toBeLessThanOrEqual(WITHIN);
              expect(Math.abs(lattice.bottom - lattice.top - layout.frame.height / ratio)).toBeLessThanOrEqual(WITHIN);
              expect(lattice.left, 'not cut by the tile at the left').toBeGreaterThanOrEqual(box.left - WITHIN);
              expect(lattice.right, 'nor at the right').toBeLessThanOrEqual(box.left + box.width + WITHIN);
            }
          } else if (layout.id === 'evidence') {
            expect(layout.fillWidth).toBeGreaterThanOrEqual(1);
            expect(layout.pitchX - layout.fillWidth).toBeGreaterThanOrEqual(2 * (layout.outline + layout.inset));
            expect(layout.floor).toBeGreaterThanOrEqual(2);
          } else {
            expect(layout.pitch - layout.mark).toBeGreaterThanOrEqual(1);
            expect(layout.groupPitch - (layout.across - 1) * layout.pitch - layout.mark).toBeGreaterThan(layout.pitch - layout.mark);
          }
          await page.keyboard.press('Escape');
          await expect(tile, id).toBeHidden();
        }
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('on a phone or a touch tablet the roles are one snapping row, tied to their bars', { tag: '@desktop' }, () => {
  for (const view of TOUCH) {
    test(`${view.w} by ${view.h}: one row in axis order, each chip 44 px with 8 px between, and a chip lights its bar and its caption (?gl=off)`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, 1, '/?gl=off');
      try {
        await entranceDone(page);
        const chips = `${SCALE} [data-chips] a[data-role]`;
        await expect(page.locator(chips)).toHaveCount(careerBars.length);
        const boxes = await rectsOf(page, chips);
        const tops = new Set(boxes.map((box) => Math.round(box.top)));
        expect(tops.size, 'one row: no wrapped line and no orphan').toBe(1);
        boxes.forEach((box, index) => {
          expect(box.right - box.left, `chip ${index} width`).toBeGreaterThanOrEqual(44);
          expect(box.bottom - box.top, `chip ${index} height`).toBeGreaterThanOrEqual(44);
          const previous = boxes[index - 1];
          if (previous) {
            expect(box.left, 'in the order of the axis, left to right').toBeGreaterThan(previous.left);
            expect(box.left - previous.right, `chip ${index} gap`).toBeGreaterThanOrEqual(8);
          }
        });
        expect(await page.locator(chips).evaluateAll((links) => links.map((link) => (link as HTMLElement).dataset.role))).toEqual(careerBars.map((bar) => bar.id));
        const row = await page.locator(`${SCALE} [data-chips]`).evaluate((element) => {
          const style = getComputedStyle(element);
          return { snap: style.scrollSnapType, overflowX: style.overflowX, mask: style.maskImage, pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        });
        expect(row.snap, 'it snaps').toContain('x');
        expect(row.overflowX).toBe('auto');
        expect(row.mask, 'a fade at the edges shows that the row goes on').not.toBe('none');
        expect(row.pageOverflow, 'the row never makes the page wider').toBeLessThanOrEqual(0);

        for (const bar of careerBars) {
          const chip = page.locator(`${chips}[data-role="${bar.id}"]`);
          await chip.scrollIntoViewIfNeeded();
          await chip.focus();
          await expect(page.locator(SCALE), `${bar.id}: focusing a chip sets data-active on the scale`).toHaveAttribute('data-active', bar.id);
          await entranceDone(page);
          const lit = await page.evaluate((id) => {
            const fill = (selector: string) => getComputedStyle(document.querySelector(selector) as Element);
            const caption = document.querySelector('[data-career-scale] > p') as HTMLElement;
            const visible = Array.from(caption.children).filter((child) => getComputedStyle(child).display !== 'none') as HTMLElement[];
            const title = visible[0]?.querySelector<HTMLElement>('[class*="role"]');
            const line = parseFloat(getComputedStyle(caption).lineHeight);
            return {
              border: fill(`[data-career-scale] [data-drawn] [data-bar="${id}"] > span`).borderTopColor,
              current: fill('[data-career-scale] [data-drawn] [data-current="true"] > span').borderTopColor,
              background: fill(`[data-career-scale] [data-drawn] [data-bar="${id}"] > span`).backgroundColor,
              shown: visible.map((child) => child.dataset.mark),
              text: caption.innerText,
              lines: Math.round(caption.getBoundingClientRect().height / line),
              balance: getComputedStyle(caption).getPropertyValue('text-wrap'),
              titleLines: title ? title.getClientRects().length : 0,
            };
          }, bar.id);
          expect(lit.border, `${bar.id}: its bar takes the current bar's style`).toBe(lit.current);
          expect(lit.shown, `${bar.id}: the caption names that role`).toEqual([bar.id]);
          expect(lit.text).toContain(bar.label);
          expect(lit.text).toContain(bar.shortTitle);
          expect(lit.text).toContain(bar.dates);
          expect(lit.lines, `${bar.id}: the caption is at most two lines`).toBeLessThanOrEqual(2);
          expect(lit.balance, 'balanced').toBe('balance');
          expect(lit.titleLines, `${bar.id}: a title is never broken`).toBe(1);
        }
        await page.evaluate(() => (document.activeElement as HTMLElement).blur());
        await expect(page.locator(SCALE), 'letting go clears it').not.toHaveAttribute('data-active', /.+/);

        // A press answers before the panel opens.
        await page.locator(`${chips}[data-role="nab"]`).dispatchEvent('pointerdown', { pointerType: 'touch', bubbles: true });
        await expect(page.locator(SCALE)).toHaveAttribute('data-active', 'nab');
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('a short phone has no hole above the fold', { tag: '@desktop' }, () => {
  for (const [w, h] of [
    [320, 700],
    [360, 640],
    [375, 667],
    [412, 719],
  ] as const) {
    test(`${w} by ${h}: no empty band over 96 px, and the corner stays free`, async ({ browser }) => {
      const { context, page } = await openView(browser, { w, h, touch: true }, 1, '/?gl=off');
      try {
        await entranceDone(page);
        const result = await page.evaluate(() => {
          const top = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
          const items = Array.from(document.querySelectorAll('#top p, #top h1, #top a'))
            .map((element) => element.getBoundingClientRect())
            .filter((box) => box.height > 0)
            .sort((a, b) => a.top - b.top);
          const bands: number[] = [];
          let edge = top;
          for (const box of items) {
            bands.push(box.top - edge);
            edge = Math.max(edge, box.bottom);
          }
          bands.push(innerHeight - edge);
          const corner = document.querySelector('#assistant-launcher')?.getBoundingClientRect();
          const cornerHit = items.some((box) => corner && box.left < corner.right && box.right > corner.left && box.top < corner.bottom && box.bottom > corner.top);
          return { widest: Math.max(...bands), cornerHit, corner: Boolean(corner) };
        });
        expect(result.widest, 'the widest empty band above the fold').toBeLessThanOrEqual(96);
        expect(result.corner, 'the launcher is there').toBe(true);
        expect(result.cornerHit, 'and nothing of the block is under it').toBe(false);
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('on a desktop the space round the headline block is deliberate', { tag: '@desktop' }, () => {
  for (const view of [DESKTOP[2], DESKTOP[3]]) {
    if (!view) continue;
    test(`${view.w} by ${view.h}: the block is centred in its row, with at most 1.5 times the gap above it below it`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, 1, '/?gl=off');
      try {
        await entranceDone(page);
        const block = await headlineBlock(page);
        const header = (await rectsOf(page, 'header'))[0];
        const cards = union(await rectsOf(page, '#proof ul'));
        expect(header).toBeDefined();
        if (!header) return;
        const above = block.top - header.bottom;
        const below = cards.top - block.bottom;
        expect(above, 'room above the block').toBeGreaterThan(0);
        expect(below / above, `${below.toFixed(0)} below against ${above.toFixed(0)} above`).toBeLessThanOrEqual(1.5);
      } finally {
        await context.close();
      }
    });
  }

  test('1280 by 720: nothing is tighter than 12 px between the blocks of the hero', async ({ browser }) => {
    const { context, page } = await openView(browser, DESKTOP[0] as View, 1, '/?gl=off');
    try {
      await entranceDone(page);
      const header = (await rectsOf(page, 'header'))[0];
      const eyebrow = (await rectsOf(page, '#top p'))[0];
      const headline = (await rectsOf(page, '#top h1'))[0];
      const line = (await rectsOf(page, '#top h1 + p'))[0];
      const actions = union(await rectsOf(page, '#top a'));
      const cards = union(await rectsOf(page, '#proof ul'));
      const scale = (await rectsOf(page, SCALE))[0];
      expect([header, eyebrow, headline, line, scale].every(Boolean)).toBe(true);
      if (!header || !eyebrow || !headline || !line || !scale) return;
      const gaps: [string, number][] = [
        ['header to eyebrow', eyebrow.top - header.bottom],
        ['eyebrow to headline', headline.top - eyebrow.bottom],
        ['headline to line', line.top - headline.bottom],
        ['line to actions', actions.top - line.bottom],
        ['actions to readings', cards.top - actions.bottom],
        ['readings to scale', scale.top - cards.bottom],
      ];
      for (const [name, gap] of gaps) expect(gap, name).toBeGreaterThanOrEqual(12);
    } finally {
      await context.close();
    }
  });
});

test.describe('a panel grows out of what opened it, and the source is never an empty box', { tag: '@desktop' }, () => {
  test('a reading card shows its marks at the first frame of the morph, and the incoming panel starts before the card is half gone', async ({ browser }) => {
    const { context, page } = await openView(browser, DESKTOP[2] as View, 1, '/?gl=high');
    try {
      await stageSettled(page);
      await entranceDone(page);
      await expect(page.locator('[data-stage-view="reading-evidence"]')).toHaveAttribute('data-ready', 'true');
      const seen = await page.evaluate(async () => {
        const trigger = document.querySelector<HTMLElement>('[data-detail-trigger="figure-evidence"]') as HTMLElement;
        const view = trigger.querySelector('[data-stage-view="reading-evidence"]') as HTMLElement;
        const fallback = view.firstElementChild as HTMLElement;
        const before = getComputedStyle(fallback).opacity;
        trigger.click();
        // The first frame: the DOM drawing of the card is what the old snapshot is taken from.
        const first = {
          morph: trigger.hasAttribute('data-morph'),
          fallback: getComputedStyle(fallback).opacity,
          cells: fallback.querySelectorAll('[class*="Readings_cell__"]').length,
          cell: getComputedStyle(fallback.querySelector('[class*="Readings_cell__"]') as Element).opacity,
        };
        const opacityAt = (keyframes: ComputedKeyframe[], progress: number): number => {
          let previous = { offset: 0, opacity: Number(keyframes[0]?.opacity ?? 1) };
          for (const frame of keyframes) {
            const offset = Number(frame.offset);
            const opacity = Number(frame.opacity);
            if (progress <= offset) {
              const span = offset - previous.offset;
              return span <= 0 ? opacity : previous.opacity + ((opacity - previous.opacity) * (progress - previous.offset)) / span;
            }
            previous = { offset, opacity };
          }
          return previous.opacity;
        };
        const frames: { out: number; in: number }[] = [];
        let outKeyframes: ComputedKeyframe[] = [];
        let inKeyframes: ComputedKeyframe[] = [];
        const end = performance.now() + 10_000;
        let started = false;
        while (performance.now() < end) {
          await new Promise((resolve) => requestAnimationFrame(resolve));
          const running = document.documentElement.dataset.vt === 'detail';
          if (running) started = true;
          if (started && !running) break;
          let out = -1;
          let incoming = -1;
          for (const animation of document.getAnimations()) {
            const effect = animation.effect as KeyframeEffect | null;
            const name = (animation as CSSAnimation).animationName;
            const pseudo = effect?.pseudoElement ?? '';
            if (!effect || !pseudo.includes('detail-morph')) continue;
            const progress = effect.getComputedTiming().progress ?? 0;
            if (name === 'morph-out') {
              outKeyframes = effect.getKeyframes();
              out = opacityAt(outKeyframes, progress);
            }
            if (name === 'morph-in') {
              inKeyframes = effect.getKeyframes();
              incoming = opacityAt(inKeyframes, progress);
            }
          }
          if (out >= 0 && incoming >= 0) frames.push({ out, in: incoming });
        }
        const when = (keyframes: ComputedKeyframe[], opacity: number, falling: boolean): number => {
          for (let step = 0; step <= 1000; step += 1) {
            const value = opacityAt(keyframes, step / 1000);
            if (falling ? value <= opacity : value > 0) return step / 1000;
          }
          return 1;
        };
        return {
          before,
          first,
          frames: frames.length,
          emptyFrames: frames.filter((frame) => frame.out <= 0 && frame.in <= 0).length,
          outReaches40: when(outKeyframes, 0.4, true),
          inStarts: when(inKeyframes, 0, false),
          after: document.querySelector('[data-morph]') === null,
        };
      });
      expect(seen.first.morph, 'the card is marked while it is the source').toBe(true);
      expect(seen.first.fallback, 'its DOM drawing is shown, whatever the canvas has drawn').toBe('1');
      expect(seen.first.cells, 'with all 200 cells in it').toBe(200);
      expect(Number(seen.first.cell), 'visible').toBeGreaterThan(0);
      expect(seen.emptyFrames, `no frame of ${seen.frames} leaves the shell empty`).toBe(0);
      expect(seen.inStarts, 'the incoming panel starts fading in no later than the card is at 40%').toBeLessThanOrEqual(seen.outReaches40);
      expect(seen.after, 'and the mark is gone when it ends').toBe(true);
    } finally {
      await context.close();
    }
  });

  test('a role bar shows its own drawing while it is the source of the morph, and a chip is its own', async ({ browser }) => {
    const desktop = await openView(browser, DESKTOP[2] as View, 1, '/?gl=off');
    try {
      await entranceDone(desktop.page);
      const bar = await desktop.page.evaluate(() => {
        const trigger = document.querySelector<HTMLElement>('[data-career-scale] [data-bars] a[data-role="anz"]') as HTMLElement;
        trigger.click();
        const before = getComputedStyle(trigger, '::before');
        const after = getComputedStyle(trigger, '::after');
        return { morph: trigger.hasAttribute('data-morph'), fill: before.backgroundColor, content: after.content, label: trigger.dataset.label };
      });
      expect(bar.morph).toBe(true);
      expect(bar.fill, 'the bar is drawn in the source').not.toBe('rgba(0, 0, 0, 0)');
      expect(bar.content, 'with its name').toContain(bar.label ?? '?');
    } finally {
      await desktop.context.close();
    }
    const phone = await openView(browser, TOUCH[1] as View, 1, '/?gl=off');
    try {
      await entranceDone(phone.page);
      const chip = await phone.page.evaluate(() => {
        const trigger = document.querySelector<HTMLElement>('[data-career-scale] [data-chips] a[data-role="anz"]') as HTMLElement;
        const style = getComputedStyle(trigger);
        return { fill: style.backgroundColor, text: trigger.textContent };
      });
      expect(chip.fill, 'a chip is filled').not.toBe('rgba(0, 0, 0, 0)');
      expect(chip.text, 'and named').not.toBe('');
    } finally {
      await phone.context.close();
    }
  });

  test('without View Transitions the panel opens with the existing fade', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
      Object.defineProperty(document, 'startViewTransition', { value: undefined, configurable: true });
    });
    const page = await context.newPage();
    try {
      await open(page, '/?gl=off');
      await page.locator('[data-detail-trigger="figure-evidence"]').first().click();
      const dialog = page.locator('dialog[open]');
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute('data-transition', 'fade');
    } finally {
      await context.close();
    }
  });
});

test.describe('without JavaScript the panels stand on the page column', { tag: '@desktop' }, () => {
  for (const view of [DESKTOP[2], TOUCH[1]]) {
    if (!view) continue;
    test(`${view.w} px: left edge with the hero type, no wider than the column, two columns from 1024 px, the poster only one screen`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, 1, '/', { javaScript: false });
      try {
        const measured = await page.evaluate(() => {
          const h1 = (document.querySelector('#top h1') as Element).getBoundingClientRect();
          const column = (document.querySelector('#top') as Element).getBoundingClientRect();
          const items = Array.from(document.querySelectorAll<HTMLElement>('[data-detail-item]')).map((item) => {
            const box = item.getBoundingClientRect();
            return { left: box.left, width: box.width, columns: getComputedStyle(item).gridTemplateColumns.split(' ').length };
          });
          const poster = document.querySelector('[data-stage-view="hero-field"] > div > div') as Element;
          return { h1: h1.left, column: column.width, items, poster: poster.getBoundingClientRect().height, screen: innerHeight, overflow: document.documentElement.scrollWidth - innerWidth };
        });
        expect(measured.items.length, 'every panel is on the page').toBeGreaterThanOrEqual(11);
        for (const item of measured.items) {
          expect(Math.abs(item.left - measured.h1), 'left edge with the hero type').toBeLessThanOrEqual(2);
          expect(item.width, 'no wider than the page column').toBeLessThanOrEqual(measured.column + 2);
          expect(item.columns, view.w >= 1024 ? 'lead visual left, text right' : 'one column').toBe(view.w >= 1024 ? 2 : 1);
        }
        expect(measured.poster, 'the poster is limited to the first screen').toBeLessThanOrEqual(measured.screen);
        expect(measured.overflow).toBeLessThanOrEqual(0);
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('a touch on the hero is answered once and the field comes to rest', { tag: '@desktop' }, () => {
  test('a tap moves the field, and the stage draws nothing more within a second of letting go', async ({ browser }) => {
    const { context, page } = await openView(browser, TOUCH[1] as View, 1, '/?gl=high');
    try {
      await page.waitForFunction(() => window.__stage !== undefined);
      await page.evaluate(() => window.__stage?.ready);
      const frames = () => page.evaluate(() => window.__stage?.info().frames ?? -1);
      // The entrance is over: the stage has stopped drawing.
      await framesStable(page);
      const hide = await page.addStyleTag({ content: 'main, header, footer, a[href="#main"], #assistant-launcher, [data-stage-view] { visibility: hidden !important; }' });
      const rest = await screen(page);
      const client = await context.newCDPSession(page);
      const at = { x: 330, y: 330 };
      const idle = await frames();
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [at] });
      await expect.poll(frames, { message: 'the touch wakes the stage' }).toBeGreaterThan(idle);
      const held = await screen(page);
      let changed = 0;
      for (let i = 0; i < held.data.length; i += held.channels) {
        if (Math.abs((held.data[i] ?? 0) - (rest.data[i] ?? 0)) + Math.abs((held.data[i + 1] ?? 0) - (rest.data[i + 1] ?? 0)) + Math.abs((held.data[i + 2] ?? 0) - (rest.data[i + 2] ?? 0)) > 6) changed += 1;
      }
      expect(changed, 'pixels of the field that the touch changed').toBeGreaterThan(200);
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      const start = Date.now();
      await framesStable(page, 5000);
      expect(Date.now() - start, 'within about a second, with software rendering').toBeLessThanOrEqual(2500);
      const back = await screen(page);
      let off = 0;
      for (let i = 0; i < back.data.length; i += back.channels) {
        if (Math.abs((back.data[i] ?? 0) - (rest.data[i] ?? 0)) > 6) off += 1;
      }
      expect(off, 'the field is back at rest').toBeLessThan(50);
      await hide.evaluate((element) => (element as Element).remove());
    } finally {
      await context.close();
    }
  });
});
