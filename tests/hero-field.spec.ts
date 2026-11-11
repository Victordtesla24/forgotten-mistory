import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';
import sharp from 'sharp';

import { entranceDone, open } from './support';

interface View {
  w: number;
  h: number;
  touch: boolean;
}

type Scheme = 'dark' | 'light';

async function openView(browser: Browser, view: View, scheme: Scheme, ratio = 1, path = '/?gl=high'): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: { width: view.w, height: view.h },
    deviceScaleFactor: ratio,
    hasTouch: view.touch,
    isMobile: view.touch,
    colorScheme: scheme,
  });
  await context.addInitScript((theme) => {
    try {
      localStorage.setItem('theme', theme);
    } catch {
      /* storage can be refused; the colour scheme of the context still applies */
    }
  }, scheme);
  const page = await context.newPage();
  await open(page, path);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.__stage !== undefined);
  await page.evaluate(() => window.__stage?.ready);
  return { context, page };
}

/** The stage's clock, frozen at `ms` of the entrance, and the frame drawn for it. */
async function seek(page: Page, ms: number): Promise<void> {
  await page.evaluate((time) => window.__stage?.seek(time), ms);
  await page.waitForTimeout(150);
}

interface Shot {
  data: Buffer;
  width: number;
  height: number;
  channels: number;
  ratio: number;
}

/** What the canvas alone shows: the page's words, controls and drawings are hidden, the stage's own light is not. */
async function canvasOnly(page: Page, ratio = 1): Promise<Shot> {
  const hide = await page.addStyleTag({
    content: 'main, header, footer, a[href="#main"], #assistant-launcher, [data-stage-view] > :not(canvas) { visibility: hidden !important; }',
  });
  const { data, info } = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  await hide.evaluate((element) => (element as Element).remove());
  return { data, width: info.width, height: info.height, channels: info.channels, ratio };
}

const pixel = (shot: Shot, x: number, y: number): [number, number, number] => {
  const at = (Math.min(Math.max(y, 0), shot.height - 1) * shot.width + Math.min(Math.max(x, 0), shot.width - 1)) * shot.channels;
  return [shot.data[at] ?? 0, shot.data[at + 1] ?? 0, shot.data[at + 2] ?? 0];
};

const luma = (shot: Shot, x: number, y: number): number => {
  const [r, g, b] = pixel(shot, x, y);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** How much a pixel stands out from the pixels three to its left and right (a vertical line) or above and below (a horizontal one). */
const standsOutAcross = (shot: Shot, x: number, y: number): number => Math.abs(luma(shot, x, y) - (luma(shot, x - 3, y) + luma(shot, x + 3, y)) / 2);
const standsOutDown = (shot: Shot, x: number, y: number): number => Math.abs(luma(shot, x, y) - (luma(shot, x, y - 3) + luma(shot, x, y + 3)) / 2);
/** How much a pixel stands out from the pixel directly above and below it: a one-pixel horizontal line, and nothing wider. */
const standsOutFromRowsBeside = (shot: Shot, x: number, y: number): number => Math.abs(luma(shot, x, y) - (luma(shot, x, y - 1) + luma(shot, x, y + 1)) / 2);

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

const rect = (page: Page, selector: string): Promise<Rect> =>
  page.locator(selector).first().evaluate((element) => {
    const { left, top, right, bottom } = element.getBoundingClientRect();
    return { left, top, right, bottom };
  });

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

test.describe('the field leads into the timeline below it', { tag: '@desktop' }, () => {
  /** The mean luminance of the same region of the 1440 by 900 hero on the build before this one (8dc3a332): 24.14 of 255. */
  const BEFORE = 24.14;
  const views: readonly View[] = [
    { w: 1280, h: 720, touch: false },
    { w: 1440, h: 900, touch: false },
    { w: 1920, h: 1080, touch: false },
  ];

  test('1440 by 900: the right third is at least twice as bright as it was, and the stage has stopped drawing', async ({ browser }) => {
    const { context, page } = await openView(browser, { w: 1440, h: 900, touch: false }, 'dark');
    try {
      await seek(page, 10_000);
      await entranceDone(page);
      const shot = await sharp(await page.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      let total = 0;
      let count = 0;
      for (let y = 100; y < 520; y += 1) {
        for (let x = 960; x < 1440; x += 1) {
          const at = (y * shot.info.width + x) * 3;
          total += 0.2126 * (shot.data[at] ?? 0) + 0.7152 * (shot.data[at + 1] ?? 0) + 0.0722 * (shot.data[at + 2] ?? 0);
          count += 1;
        }
      }
      expect(total / count, 'mean luminance of x 960 to 1440, y 100 to 520').toBeGreaterThanOrEqual(2 * BEFORE);
      const frames = (): Promise<number> => page.evaluate(() => Number(document.querySelector('canvas')?.getAttribute('data-frames') ?? 0));
      await page.waitForTimeout(1200);
      const first = await frames();
      await page.waitForTimeout(2500);
      expect(await frames(), 'no frame is drawn once the field has settled').toBe(first);
    } finally {
      await context.close();
    }
  });

  for (const view of views) {
    test(`${view.w} by ${view.h}: one lit line falls to the bottom of the hero on the x of the Experience timeline's now edge`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, 'dark');
      try {
        await seek(page, 10_000);
        await entranceDone(page);
        const now = await page.evaluate(() => {
          const { left, right } = (document.querySelector('#experience [data-now]') as HTMLElement).getBoundingClientRect();
          return { left, right, middle: (left + right) / 2 };
        });
        const hero = await rect(page, '[data-stage-view="hero-field"]');
        const shot = await canvasOnly(page);
        // The brightest column of the last 80 rows above the hero's bottom edge, over the columns within 12 px of the edge.
        const bottom = Math.min(Math.floor(hero.bottom), view.h) - 2;
        const columns: number[] = [];
        for (let x = view.w - 12; x < view.w; x += 1) {
          let total = 0;
          for (let y = bottom - 80; y < bottom; y += 1) total += luma(shot, x, y);
          columns.push(total / 80);
        }
        const brightest = view.w - 12 + columns.indexOf(Math.max(...columns));
        expect(Math.abs(brightest + 0.5 - now.middle), `the lit column is x ${brightest}; the now edge is at ${now.left} to ${now.right}`).toBeLessThanOrEqual(2);
        const beside = luma(shot, view.w - 10, bottom - 40);
        expect(luma(shot, brightest, bottom - 40) - beside, 'the line stands out from the dark beside it').toBeGreaterThanOrEqual(20);
        // It is one line from the field to the edge: lit on most rows of the 300 above the bottom, and in no other column.
        let lit = 0;
        for (let y = bottom - 300; y < bottom; y += 1) if (luma(shot, brightest, y) - luma(shot, view.w - 10, y) > 8) lit += 1;
        expect(lit / 300, 'the share of the rows above the edge on which the line is lit').toBeGreaterThanOrEqual(0.8);
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('the lanes stand beside the headline block from 1024 px, never under its words', { tag: '@desktop' }, () => {
  for (const view of [
    { w: 1024, h: 768, touch: false },
    { w: 1100, h: 800, touch: false },
  ] as const) {
    test(`${view.w} by ${view.h}: lanes are drawn right of the block and none stands in it`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, 'dark');
      try {
        await seek(page, 10_000);
        await entranceDone(page);
        const block = await headlineBlock(page);
        const cards = await rect(page, '#proof li');
        const header = await rect(page, 'header');
        const shot = await canvasOnly(page);
        let rows = 0;
        for (let y = Math.ceil(header.bottom) + 6; y < Math.floor(cards.top) - 24; y += 1) {
          let total = 0;
          for (let x = view.w - 100; x < view.w - 12; x += 1) total += standsOutDown(shot, x, y);
          if (total / 88 > 8) rows += 1;
        }
        expect(rows, 'lane rows right of the block').toBeGreaterThanOrEqual(3);
        let inside = 0;
        for (let y = Math.floor(block.top); y < Math.ceil(block.bottom); y += 1) {
          for (let x = Math.floor(block.left); x < Math.ceil(block.right); x += 1) {
            if (standsOutDown(shot, x, y) > 10 || standsOutAcross(shot, x, y) > 10) inside += 1;
          }
        }
        expect(inside, 'lane pixels inside the headline block').toBeLessThanOrEqual(2);
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('the field is one plane that fades in, with exact lanes and ticks and nothing left over', { tag: '@desktop' }, () => {
  const views: readonly View[] = [
    { w: 1280, h: 720, touch: false },
    { w: 1440, h: 900, touch: false },
    { w: 1920, h: 1080, touch: false },
  ];
  for (const view of views) {
    for (const scheme of ['dark', 'light'] as const) {
      test(`${view.w} by ${view.h}, ${scheme}: the edge is a ramp, no lane steps and no tick leans, and no scrap stands in a gutter or between blocks`, async ({ browser }) => {
        const { context, page } = await openView(browser, view, scheme);
        try {
          await seek(page, 10_000);
          await entranceDone(page);
          const block = await headlineBlock(page);
          const cards = await rect(page, '#proof li');
          const header = await rect(page, 'header');
          const shot = await canvasOnly(page);

          // The strong lane rows: the plane is where they are.
          const top = Math.ceil(header.bottom) + 6;
          const bottom = Math.floor(cards.top) - 24;
          const reach = { from: view.w - 160, to: view.w - 12 };
          const from3 = new Map<number, number>();
          const from1 = new Map<number, number>();
          for (let y = top - 3; y < bottom + 3; y += 1) {
            let three = 0;
            let one = 0;
            for (let x = reach.from; x < reach.to; x += 1) {
              three += standsOutDown(shot, x, y);
              one += standsOutFromRowsBeside(shot, x, y);
            }
            from3.set(y, three / (reach.to - reach.from));
            from1.set(y, one / (reach.to - reach.from));
          }
          // A lane is one row of pixels: it stands out from the rows three above and below it, and from the rows directly beside it by nearly as much. The rows round a lane
          // stand out only from three away, and a row between two lanes six apart stands out from both of them; neither is a lane.
          const rows: number[] = [];
          for (let y = top; y < bottom; y += 1) {
            const far = from3.get(y) ?? 0;
            const near = from1.get(y) ?? 0;
            if (far > 12 && near >= 0.7 * far && [-1, 1].every((step) => near >= (from1.get(y + step) ?? 0))) rows.push(y);
          }
          expect(rows.length, 'the plane has lanes').toBeGreaterThanOrEqual(5);

          // 1. Across the former edge the lanes ramp in over at least 64 px, and never step by more than 8% of full strength in 8 px.
          const profile: number[] = [];
          for (let x = 0; x < view.w; x += 1) profile.push(rows.reduce((total, y) => total + standsOutDown(shot, x, y), 0));
          // The lower envelope of the profile is the lanes themselves: a tick only ever adds light at its foot, so a window as wide as the ticks are apart takes it out.
          const envelope = profile.map((_, x) => Math.min(...profile.slice(Math.max(x - 16, 0), Math.min(x + 17, view.w))));
          const smooth = envelope.map((_, x) => {
            let sum = 0;
            for (let step = -4; step <= 4; step += 1) sum += envelope[Math.min(Math.max(x + step, 0), view.w - 1)] ?? 0;
            return sum / 9;
          });
          // The film grain over the canvas is the floor under the lanes: its level in the gutter left of the block is taken off.
          const gutter = smooth.slice(8, Math.max(Math.floor(block.left) - 8, 9)).sort((a, b) => a - b);
          const floor = gutter[Math.floor(gutter.length / 2)] ?? 0;
          // Full strength is the plateau between the ramp and the field's own fade at the right edge of the screen.
          const peak = Math.max(...smooth.slice(Math.floor(block.right), view.w - Math.round(view.w * 0.1))) - floor;
          const from = smooth.findIndex((value) => value - floor >= 0.05 * peak);
          const to = smooth.findIndex((value) => value - floor >= 0.95 * peak);
          expect(to - from, `the lanes ramp from x ${from} to x ${to}`).toBeGreaterThanOrEqual(64);
          expect(from, 'and begin clear of the headline block').toBeGreaterThanOrEqual(Math.floor(block.right));
          let steepest = 0;
          for (let x = from; x <= to; x += 1) steepest = Math.max(steepest, Math.abs((smooth[x + 8] ?? 0) - (smooth[x] ?? 0)) / peak);
          expect(steepest, 'the steepest 8 px of the ramp, as a share of full strength').toBeLessThanOrEqual(0.08);

          // 2. A lane is one row of pixels from one end of the plane to the other: it does not step.
          for (const y of rows) {
            let lit = 0;
            let across = 0;
            for (let x = Math.min(from + 250, view.w - 200); x < view.w - 10; x += 1) {
              across += 1;
              if (standsOutDown(shot, x, y) > 4) lit += 1;
            }
            expect(lit / across, `the lane at y ${y} is one row all the way across (${lit} of ${across})`).toBeGreaterThanOrEqual(0.9);
          }

          // 3. A tick is one column of pixels from its foot to its tip: no lit pixel has another on a diagonal beside it.
          const onLane = new Set(rows.flatMap((y) => [y - 1, y, y + 1]));
          let leaning = 0;
          let ticks = 0;
          for (let y = top; y < bottom; y += 1) {
            if (onLane.has(y)) continue;
            for (let x = Math.min(from + 250, view.w - 200); x < view.w - 10; x += 1) {
              if (standsOutAcross(shot, x, y) <= 10) continue;
              ticks += 1;
              const lit = (dx: number, dy: number): boolean => !onLane.has(y + dy) && standsOutAcross(shot, x + dx, y + dy) > 10;
              if (lit(-1, -1) || lit(1, -1) || lit(-1, 1) || lit(1, 1) || lit(-1, 0) || lit(1, 0)) leaning += 1;
            }
          }
          expect(ticks, 'ticks were found').toBeGreaterThan(50);
          expect(leaning, `ticks that lean (of ${ticks} pixels)`).toBeLessThanOrEqual(2);

          // 4. Above the farthest lane there is only glow: no hairline floats over the field. At nine tenths of the plane's width, averaged over 41 px,
          // no row differs from the next by more than 4 of 255.
          const centre = Math.round(from + 0.9 * (view.w - from));
          const meanRow = (y: number): number => {
            let total = 0;
            for (let x = centre - 20; x <= centre + 20; x += 1) total += luma(shot, x, y);
            return total / 41;
          };
          let step = 0;
          for (let y = Math.ceil(header.bottom) + 6; y < (rows[0] ?? 0) - 2; y += 1) step = Math.max(step, Math.abs(meanRow(y + 1) - meanRow(y)));
          expect(step, 'the largest step between neighbouring rows above the farthest lane').toBeLessThanOrEqual(4);

          // 5. Nothing of the field is left in the left gutter, under the headline block, or in the strip beside the readings.
          const scraps = (area: { x0: number; x1: number; y0: number; y1: number }): number => {
            let found = 0;
            for (let y = Math.floor(area.y0); y < Math.ceil(area.y1); y += 1) {
              for (let x = Math.floor(area.x0); x < Math.ceil(area.x1); x += 1) {
                if (standsOutDown(shot, x, y) > 10 || standsOutAcross(shot, x, y) > 10) found += 1;
              }
            }
            return found;
          };
          expect(scraps({ x0: 4, x1: block.left - 6, y0: header.bottom + 6, y1: cards.bottom }), 'lines in the left gutter').toBeLessThanOrEqual(2);
          expect(scraps({ x0: 4, x1: block.right, y0: block.bottom + 6, y1: cards.top - 6 }), 'lines between the headline block and the readings').toBeLessThanOrEqual(2);
          const row = await page.evaluate(() => Array.from(document.querySelectorAll('#proof li'), (card) => card.getBoundingClientRect().right));
          // The strip within 16 px of the edge is the one lit line that falls to the timeline below, and its halo.
          expect(scraps({ x0: Math.max(...row) + 6, x1: view.w - 16, y0: cards.top - 10, y1: cards.bottom }), 'lines beside the readings').toBeLessThanOrEqual(2);
        } finally {
          await context.close();
        }
      });
    }
  }
});

test.describe('a retina screen draws the telemetry reading as strongly as an ordinary one', { tag: '@desktop' }, () => {
  for (const view of [
    { w: 1440, h: 900, touch: false },
    { w: 1280, h: 720, touch: false },
  ] as const) {
    test(`${view.w} by ${view.h}: the tile's mean brightness at 2x is within 15% of 1x`, async ({ browser }) => {
      const means: number[] = [];
      for (const ratio of [1, 2]) {
        const { context, page } = await openView(browser, view, 'dark', ratio);
        try {
          await seek(page, 10_000);
          await entranceDone(page);
          const tile = await rect(page, '[data-reading="telemetry"][data-place="card"]');
          const shot = await sharp(await page.screenshot({ clip: { x: tile.left, y: tile.top, width: tile.right - tile.left, height: tile.bottom - tile.top } }))
            .removeAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });
          let total = 0;
          for (let at = 0; at < shot.data.length; at += shot.info.channels) {
            total += 0.2126 * (shot.data[at] ?? 0) + 0.7152 * (shot.data[at + 1] ?? 0) + 0.0722 * (shot.data[at + 2] ?? 0);
          }
          means.push(total / (shot.data.length / shot.info.channels));
        } finally {
          await context.close();
        }
      }
      const [one = 0, two = 0] = means;
      expect(Math.abs(two - one) / one, `mean brightness ${one.toFixed(1)} at 1x and ${two.toFixed(1)} at 2x`).toBeLessThanOrEqual(0.15);
    });
  }
});
