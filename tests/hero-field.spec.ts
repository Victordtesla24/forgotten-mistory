import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';
import sharp from 'sharp';

import { entrance } from '@/lib/entrance';

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

const unit = (value: number): number => Math.min(Math.max(value, 0), 1);

/** The WCAG relative luminance of an sRGB colour. */
const relative = ([r, g, b]: readonly number[]): number => {
  const channel = (value: number): number => {
    const v = value / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r ?? 0) + 0.7152 * channel(g ?? 0) + 0.0722 * channel(b ?? 0);
};

test.describe('the career scale lights only behind its front', { tag: '@desktop' }, () => {
  test('1440 by 900: nothing is lit ahead of the front at 150, 450, 750 and 900 ms, the 2026 numeral keeps its contrast at 1050 ms, and 1200 ms is the settled frame', async ({ browser }) => {
    const { context, page } = await openView(browser, { w: 1440, h: 900, touch: false }, 'dark');
    try {
      await entranceDone(page);
      const track = await page.evaluate(() => {
        const bars = (document.querySelector('[data-career-scale] [data-drawn]') as HTMLElement).getBoundingClientRect();
        const ruler = (document.querySelector('[data-career-scale] [data-ruler]') as HTMLElement).getBoundingClientRect();
        const last = Array.from(document.querySelectorAll('[data-career-scale] [data-ruler] span')).filter((span) => span.textContent === '2026')[0] as HTMLElement;
        const box = last.getBoundingClientRect();
        const [r = 0, g = 0, b = 0] = (getComputedStyle(last).color.match(/\d+/g) ?? []).map(Number);
        return { top: bars.top, bottom: ruler.bottom, numeral: { left: box.left, top: box.top, right: box.right, bottom: box.bottom }, colour: [r, g, b] };
      });
      const frontAt = (ms: number): number => unit((ms - entrance.scale.at) / (entrance.scale.for * 0.75)) * 1440;
      await seek(page, 0);
      const before = await canvasOnly(page);
      for (const ms of [150, 450, 750, 900]) {
        await seek(page, ms);
        const frame = await canvasOnly(page);
        const front = frontAt(ms);
        let worst = 0;
        for (let y = Math.floor(track.top); y < Math.ceil(track.bottom); y += 1) {
          for (let x = Math.ceil(front) + 8; x < 1440; x += 1) {
            const [r, g, b] = pixel(frame, x, y);
            const [r0, g0, b0] = pixel(before, x, y);
            worst = Math.max(worst, Math.abs(r - r0), Math.abs(g - g0), Math.abs(b - b0));
          }
        }
        expect(worst, `at ${ms} ms nothing to the right of the front (x ${Math.round(front)}) is lit`).toBeLessThanOrEqual(12);
      }

      await seek(page, 1050);
      const flare = await canvasOnly(page);
      let lightest = 0;
      for (let y = Math.floor(track.numeral.top) - 2; y < Math.ceil(track.numeral.bottom) + 2; y += 1) {
        for (let x = Math.floor(track.numeral.left) - 2; x < Math.ceil(track.numeral.right) + 2; x += 1) lightest = Math.max(lightest, relative(pixel(flare, x, y)));
      }
      const contrast = (relative(track.colour) + 0.05) / (lightest + 0.05);
      expect(contrast, 'the 2026 numeral on the lightest the canvas is behind it').toBeGreaterThanOrEqual(4.5);

      await seek(page, entrance.scale.at + entrance.scale.for);
      const end = await canvasOnly(page);
      await seek(page, 10_000);
      const settled = await canvasOnly(page);
      let differs = 0;
      for (let y = Math.floor(track.top); y < Math.ceil(track.bottom); y += 1) {
        for (let x = 0; x < 1440; x += 1) {
          const [r, g, b] = pixel(end, x, y);
          const [r0, g0, b0] = pixel(settled, x, y);
          differs = Math.max(differs, Math.abs(r - r0), Math.abs(g - g0), Math.abs(b - b0));
        }
      }
      expect(differs, 'the frame at the end of the scale is the settled frame').toBeLessThanOrEqual(2);
    } finally {
      await context.close();
    }
  });
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
          const scale = await rect(page, '[data-career-scale]');
          const header = await rect(page, 'header');
          const shot = await canvasOnly(page);

          // The strong lane rows: the plane is where they are.
          const top = Math.ceil(header.bottom) + 6;
          const bottom = Math.floor(cards.top) - 24;
          const reach = { from: view.w - 160, to: view.w - 12 };
          const rows: number[] = [];
          for (let y = top; y < bottom; y += 1) {
            let total = 0;
            for (let x = reach.from; x < reach.to; x += 1) total += standsOutDown(shot, x, y);
            if (total / (reach.to - reach.from) > 12) rows.push(y);
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
          // Full strength is the plateau between the ramp and the field's own fade at the right edge of the screen.
          const peak = Math.max(...smooth.slice(Math.floor(block.right), view.w - Math.round(view.w * 0.1)));
          const from = smooth.findIndex((value) => value >= 0.05 * peak);
          const to = smooth.findIndex((value) => value >= 0.95 * peak);
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

          // 4. Nothing of the field is left in the left gutter, under the headline block, or in the strip beside the readings.
          const scraps = (area: { x0: number; x1: number; y0: number; y1: number }): number => {
            let found = 0;
            for (let y = Math.floor(area.y0); y < Math.ceil(area.y1); y += 1) {
              for (let x = Math.floor(area.x0); x < Math.ceil(area.x1); x += 1) {
                if (standsOutDown(shot, x, y) > 10 || standsOutAcross(shot, x, y) > 10) found += 1;
              }
            }
            return found;
          };
          expect(scraps({ x0: 4, x1: block.left - 6, y0: header.bottom + 6, y1: scale.top - 6 }), 'lines in the left gutter').toBeLessThanOrEqual(2);
          expect(scraps({ x0: 4, x1: block.right, y0: block.bottom + 6, y1: cards.top - 6 }), 'lines between the headline block and the readings').toBeLessThanOrEqual(2);
          const row = await page.evaluate(() => Array.from(document.querySelectorAll('#proof li'), (card) => card.getBoundingClientRect().right));
          expect(scraps({ x0: Math.max(...row) + 6, x1: view.w - 4, y0: cards.top - 10, y1: scale.top - 6 }), 'lines beside the readings').toBeLessThanOrEqual(2);
        } finally {
          await context.close();
        }
      });
    }
  }
});

test.describe('the field and the scale keep clear of the scale’s words', { tag: '@desktop' }, () => {
  const cases: readonly { view: View; scheme: Scheme }[] = [
    { view: { w: 834, h: 1112, touch: true }, scheme: 'light' },
    { view: { w: 834, h: 1112, touch: true }, scheme: 'dark' },
    { view: { w: 768, h: 1024, touch: true }, scheme: 'dark' },
    { view: { w: 1280, h: 720, touch: false }, scheme: 'dark' },
    { view: { w: 1366, h: 768, touch: false }, scheme: 'light' },
  ];
  for (const { view, scheme } of cases) {
    test(`${view.w} by ${view.h}, ${scheme}: no light of the canvas within 6 px of the caption or a name above the bars`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, scheme);
      try {
        await seek(page, 10_000);
        await entranceDone(page);
        const words = await page.evaluate(() => {
          const found: { left: number; top: number; right: number; bottom: number; what: string }[] = [];
          const roots = Array.from(document.querySelectorAll('[data-career-scale] > p, [data-career-scale] [data-fit]')).filter((element) => {
            const style = getComputedStyle(element);
            return style.display !== 'none' && style.visibility === 'visible';
          });
          for (const root of roots) {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            for (let node = walker.nextNode(); node; node = walker.nextNode()) {
              const element = node.parentElement;
              if (!element || !node.nodeValue?.trim()) continue;
              const style = getComputedStyle(element);
              if (style.display === 'none' || element.closest('[data-bar] > span:first-child')) continue;
              const range = document.createRange();
              range.selectNodeContents(node);
              for (const box of range.getClientRects()) {
                if (box.width > 1 && box.height > 1 && box.top > 0 && box.bottom < innerHeight) found.push({ left: box.left, top: box.top, right: box.right, bottom: box.bottom, what: node.nodeValue.trim().slice(0, 24) });
              }
            }
          }
          return found;
        });
        const names = words.filter((word) => word.top < 4000);
        expect(names.length, 'the scale has words above its bars').toBeGreaterThan(0);
        const shot = await canvasOnly(page);
        for (const word of names) {
          const box = { x0: Math.floor(word.left) - 6, x1: Math.ceil(word.right) + 6, y0: Math.floor(word.top) - 6, y1: Math.ceil(word.bottom) + 6 };
          const samples: [number, number, number][] = [];
          for (let y = box.y0; y < box.y1; y += 1) for (let x = box.x0; x < box.x1; x += 1) samples.push(pixel(shot, x, y));
          const median = [0, 1, 2].map((channel) => {
            const sorted = samples.map((sample) => sample[channel] ?? 0).sort((a, b) => a - b);
            return sorted[Math.floor(sorted.length / 2)] ?? 0;
          });
          const off = Math.max(...samples.map((sample) => Math.max(...sample.map((value, channel) => Math.abs(value - (median[channel] ?? 0))))));
          expect(off, `the canvas round "${word.what}" is flat: its worst pixel is ${off} levels from the rest`).toBeLessThanOrEqual(6);
        }
      } finally {
        await context.close();
      }
    });
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
