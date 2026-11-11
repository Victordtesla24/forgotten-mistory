import { expect, test, type Page } from '@playwright/test';

import { entranceDone, hydrated, open } from './support';

const LAUNCHER = '#assistant-launcher';
const HEADER_BUTTON = '#assistant-header-button';

interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

async function rect(page: Page, selector: string): Promise<Rect> {
  return page.locator(selector).first().evaluate((element) => {
    const { left, top, right, bottom, width, height } = element.getBoundingClientRect();
    return { left, top, right, bottom, width, height };
  });
}

/** Every text line and control of the hero's two roots that lies over `area` and is not clipped away by a scroller or box round it, named. */
async function coveredBy(page: Page, area: Rect): Promise<string[]> {
  return page.evaluate((box) => {
    const covered: string[] = [];
    for (const root of ['#top', '#proof']) {
      for (const element of document.querySelectorAll(`${root}, ${root} *`)) {
        const style = getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden') continue;
        const control = element.matches('a[href], button, input, select, textarea, [tabindex]');
        const hasText = Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
        if (!control && !hasText) continue;
        const rects = control ? [element.getBoundingClientRect()] : (() => {
          const range = document.createRange();
          range.selectNodeContents(element);
          return Array.from(range.getClientRects());
        })();
        for (const whole of rects) {
          // What a scroller or an overflow-hidden box round the element cuts off is not on the screen.
          let { left, right, top, bottom } = whole;
          for (let ancestor = element.parentElement; ancestor && ancestor !== document.body; ancestor = ancestor.parentElement) {
            const around = getComputedStyle(ancestor);
            const frame = ancestor.getBoundingClientRect();
            if (around.overflowX !== 'visible') {
              left = Math.max(left, frame.left);
              right = Math.min(right, frame.right);
            }
            if (around.overflowY !== 'visible') {
              top = Math.max(top, frame.top);
              bottom = Math.min(bottom, frame.bottom);
            }
          }
          const across = Math.min(box.right, right) - Math.max(box.left, left);
          const down = Math.min(box.bottom, bottom) - Math.max(box.top, top);
          if (whole.width > 0 && whole.height > 0 && across > 1 && down > 1) {
            covered.push(`${control ? 'control' : 'text'} ${element.tagName.toLowerCase()} ${element.textContent?.trim().slice(0, 30) ?? ''}`);
          }
        }
      }
    }
    return covered;
  }, area);
}

/** Opens the page at a size as a touch screen (a coarse pointer without hover) or as a mouse. */
async function openAs(page: Page, width: number, height: number): Promise<void> {
  await page.setViewportSize({ width, height });
  await open(page, '/?gl=off');
  await page.evaluate(() => document.fonts.ready);
  await entranceDone(page);
}

test.describe('Ask Mini Vic is never out of reach', () => {
  test.describe('on a touch screen narrower than 1024 px', { tag: '@mobile' }, () => {
    for (const [width, height] of [
      [320, 700],
      [390, 844],
      [768, 1024],
      [834, 1112],
    ] as const) {
      test(`${width} by ${height}: a round 48 px button in the bottom right corner, clear of the hero, from the first frame and after scrolling`, async ({ page }) => {
        await openAs(page, width, height);
        const launcher = page.locator(LAUNCHER);
        await expect(launcher).toBeVisible();
        const box = await rect(page, LAUNCHER);
        expect(box.width, 'width').toBeGreaterThanOrEqual(44);
        expect(box.height, 'height').toBeGreaterThanOrEqual(44);
        expect(Math.round(box.width), 'a 48 px round control').toBe(48);
        expect(Math.round(box.height)).toBe(48);
        expect(width - box.right, 'one rem from the right edge').toBeLessThanOrEqual(16.5);
        expect(height - box.bottom, 'one rem from the bottom edge').toBeLessThanOrEqual(16.5);
        expect(await launcher.evaluate((element) => getComputedStyle(element).borderRadius), 'round').not.toBe('0px');
        expect(await coveredBy(page, box), 'the hero keeps the corner free of text and controls').toEqual([]);

        await page.evaluate(() => document.querySelector('#experience')?.scrollIntoView());
        await expect(launcher, 'still there after scrolling').toBeVisible();
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await expect(launcher, 'and back at the top').toBeVisible();
      });
    }

    test('the button opens the panel, and Escape returns focus to it', async ({ page }) => {
      await openAs(page, 390, 844);
      await page.locator(LAUNCHER).click();
      const panel = page.getByRole('dialog', { name: 'Ask Mini Vic' });
      await expect(panel).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(panel).toBeHidden();
      await expect(page.locator(LAUNCHER)).toBeFocused();
    });
  });

  test.describe('on a desktop', { tag: '@desktop' }, () => {
    for (const [width, height] of [
      [1280, 720],
      [1440, 900],
      [1920, 1080],
    ] as const) {
      test(`${width} by ${height}: the header button is the control while the hero is in view, and the floating one appears once it has scrolled out`, async ({ page }) => {
        await openAs(page, width, height);
        const header = page.locator(HEADER_BUTTON);
        const launcher = page.locator(LAUNCHER);
        await expect(header, 'the header names it').toBeVisible();
        const reach = await rect(page, HEADER_BUTTON);
        expect(reach.width).toBeGreaterThanOrEqual(44);
        expect(reach.height).toBeGreaterThanOrEqual(44);
        await expect(launcher, 'hidden over the hero').toBeHidden();

        await page.evaluate(() => document.querySelector('#experience')?.scrollIntoView());
        await expect(launcher, 'shown once the hero is past').toBeVisible();
        await expect(header).toBeVisible();

        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await expect(launcher, 'gone again over the hero').toBeHidden();
        await header.click();
        await expect(page.getByRole('dialog', { name: 'Ask Mini Vic' })).toBeVisible();
      });
    }

    test('the launcher is hidden by the stylesheet, so it never shows on the first paint, and without script neither control is on the page, since neither can do anything', async ({ browser }) => {
      for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
        const context = await browser.newContext({ javaScriptEnabled: false, viewport });
        const page = await context.newPage();
        await page.goto('/');
        await expect(page.locator(LAUNCHER)).toBeHidden();
        await expect(page.locator(HEADER_BUTTON)).toBeHidden();
        await context.close();
      }
    });

    test('a page without a hero has the floating button from the start', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await open(page, '/privacy');
      await hydrated(page);
      await expect(page.locator(LAUNCHER)).toBeVisible();
    });
  });
});
