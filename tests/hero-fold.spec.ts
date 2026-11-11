import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

import { entranceDone, open } from './support';

/** The floor under the first screen: how tall the empty band between the header and the fold may be. */
const BAND = 96;

interface View {
  w: number;
  h: number;
  touch: boolean;
}

async function openView(
  browser: Browser,
  view: View,
  path: string,
  options: { javaScript?: boolean } = {},
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: { width: view.w, height: view.h },
    hasTouch: view.touch,
    isMobile: view.touch,
    colorScheme: 'dark',
    javaScriptEnabled: options.javaScript ?? true,
  });
  const page = await context.newPage();
  if (options.javaScript === false) await page.goto(path);
  else {
    await open(page, path);
    await entranceDone(page);
  }
  await page.evaluate(() => document.fonts.ready);
  return { context, page };
}

interface Geometry {
  /** The widest empty band between the header and the fold, from the words, controls and cards of the hero that are on the first screen. */
  widest: number;
  /** What the round button's rectangle covers: the words, controls and cards that are on the first screen (not clipped away) and meet it. */
  covered: string[];
  button: boolean;
  firstCardTop: number;
  fold: number;
  scaleBottom: number;
  axisBottom: number;
  numeralBottom: number;
  barsTop: number;
}

/** What the first screen holds, measured the way a reader sees it: boxes clipped by the scrollers and the screen they stand in. */
function geometry(page: Page): Promise<Geometry> {
  return page.evaluate(() => {
    const header = document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
    const fold = innerHeight;
    interface Box {
      top: number;
      bottom: number;
      left: number;
      right: number;
      what: string;
    }
    const clipped = (element: Element, box: DOMRect, what: string): Box | null => {
      let { top, bottom, left, right } = box;
      for (let ancestor = element.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        const around = ancestor.getBoundingClientRect();
        if (style.overflowX !== 'visible') {
          left = Math.max(left, around.left);
          right = Math.min(right, around.right);
        }
        if (style.overflowY !== 'visible') {
          top = Math.max(top, around.top);
          bottom = Math.min(bottom, around.bottom);
        }
      }
      return right - left > 1 && bottom - top > 1 ? { top, bottom, left, right, what } : null;
    };
    const boxes: Box[] = [];
    for (const root of [document.getElementById('top'), document.getElementById('proof'), document.querySelector('[data-career-scale]')]) {
      if (!root) continue;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const element = node.parentElement;
        if (!element || !node.nodeValue?.trim()) continue;
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility !== 'visible' || element.closest('.sr-only')) continue;
        if (element.closest('[aria-hidden="true"]') && !element.closest('[data-ruler]')) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const rect of range.getClientRects()) {
          const box = clipped(element, rect, `text "${node.nodeValue.trim().slice(0, 24)}"`);
          if (box) boxes.push(box);
        }
      }
      for (const control of root.querySelectorAll('a[href], button')) {
        if (getComputedStyle(control).display === 'none') continue;
        const box = clipped(control, control.getBoundingClientRect(), `control "${(control.textContent ?? '').trim().slice(0, 24)}"`);
        if (box) boxes.push(box);
      }
    }
    const cardElements = Array.from(document.querySelectorAll('#proof li'));
    const cards = cardElements.map((card) => card.getBoundingClientRect());
    for (const card of cardElements) {
      const box = clipped(card, card.getBoundingClientRect(), 'card');
      if (box) boxes.push(box);
    }
    const shown = boxes.filter((box) => box.bottom > header && box.top < fold).map((box) => ({ ...box, top: Math.max(box.top, header), bottom: Math.min(box.bottom, fold) }));
    shown.sort((a, b) => a.top - b.top);
    let edge = header;
    let widest = 0;
    for (const box of shown) {
      widest = Math.max(widest, box.top - edge);
      edge = Math.max(edge, box.bottom);
    }
    widest = Math.max(widest, fold - edge);
    const launcher = document.querySelector('#assistant-launcher')?.getBoundingClientRect();
    const covered = launcher
      ? shown.filter((box) => Math.min(box.right, launcher.right) - Math.max(box.left, launcher.left) > 1 && Math.min(box.bottom, launcher.bottom) - Math.max(box.top, launcher.top) > 1).map((box) => box.what)
      : [];
    const scale = document.querySelector('[data-career-scale]')?.getBoundingClientRect();
    const ruler = document.querySelector('[data-career-scale] [data-ruler]')?.getBoundingClientRect();
    const numerals = Array.from(document.querySelectorAll('[data-career-scale] [data-ruler] span'), (span) => span.getBoundingClientRect().bottom);
    const bars = document.querySelector('[data-career-scale] [data-drawn]')?.getBoundingClientRect();
    return {
      widest,
      covered,
      button: Boolean(launcher && getComputedStyle(document.querySelector('#assistant-launcher') as Element).display !== 'none'),
      firstCardTop: cards[0]?.top ?? Number.POSITIVE_INFINITY,
      fold,
      scaleBottom: scale?.bottom ?? 0,
      axisBottom: ruler?.bottom ?? 0,
      numeralBottom: Math.max(...numerals.filter((bottom) => bottom > 0)),
      barsTop: bars?.top ?? 0,
    };
  });
}

test.describe('a phone is composed to its fold', { tag: '@desktop' }, () => {
  for (const [w, h] of [
    [390, 844],
    [412, 915],
    [430, 932],
  ] as const) {
    test(`${w} by ${h}: the readings and the whole axis are above the fold, no band over ${BAND} px, and the button covers nothing`, async ({ browser }) => {
      const { context, page } = await openView(browser, { w, h, touch: true }, '/?gl=off');
      try {
        const found = await geometry(page);
        expect(found.widest, 'the widest empty band between the header and the fold').toBeLessThanOrEqual(BAND);
        expect(found.axisBottom, 'the ruler (bars and ticks) is above the fold').toBeLessThanOrEqual(found.fold);
        expect(found.numeralBottom, 'and so are the numerals').toBeLessThanOrEqual(found.fold);
        expect(found.scaleBottom, 'the scale ends on the screen').toBeLessThanOrEqual(found.fold);
        expect(found.button, 'the launcher is there').toBe(true);
        expect(found.covered, 'and covers no word, control or card').toEqual([]);
      } finally {
        await context.close();
      }
    });
  }

  for (const [w, h] of [
    [320, 700],
    [360, 640],
    [375, 667],
    [412, 719],
  ] as const) {
    test(`${w} by ${h}: a reading card is above the fold, no band over ${BAND} px, and the corner stays free`, async ({ browser }) => {
      const { context, page } = await openView(browser, { w, h, touch: true }, '/?gl=off');
      try {
        const found = await geometry(page);
        expect(found.widest, 'the widest empty band between the header and the fold').toBeLessThanOrEqual(BAND);
        expect(found.firstCardTop, 'the top of the first reading card is on the screen').toBeLessThanOrEqual(found.fold - 24);
        expect(found.button, 'the launcher is there').toBe(true);
        expect(found.covered, 'and covers no word, control or card').toEqual([]);
      } finally {
        await context.close();
      }
    });
  }
});

test.describe('a screen from 1024 px is one screen, with a mouse, a finger or no script', { tag: '@desktop' }, () => {
  const cases: readonly (View & { javaScript?: boolean })[] = [
    { w: 1440, h: 900, touch: false },
    { w: 1280, h: 720, touch: false },
    { w: 1440, h: 900, touch: false, javaScript: false },
    { w: 1280, h: 720, touch: false, javaScript: false },
    { w: 1024, h: 768, touch: true },
    { w: 1180, h: 820, touch: true },
  ];
  for (const view of cases) {
    test(`${view.w} by ${view.h}${view.touch ? ' with a finger' : ''}${view.javaScript === false ? ' without JavaScript' : ''}: the scale ends on the bottom of the screen and no band is over ${BAND} px`, async ({ browser }) => {
      const { context, page } = await openView(browser, view, '/?gl=off', { javaScript: view.javaScript });
      try {
        const found = await geometry(page);
        expect(Math.abs(found.scaleBottom - found.fold), 'the bottom of the scale is the bottom of the screen').toBeLessThanOrEqual(1);
        expect(found.widest, 'the widest empty band between the header and the fold').toBeLessThanOrEqual(BAND);
      } finally {
        await context.close();
      }
    });
  }
});
