import { expect, test, type Page } from '@playwright/test';

import { roles } from '@/content/experience';
import { careerBars } from '@/lib/timeline';

import { entranceDone, hydrated, hydratedAt, open } from './support';

const LAUNCHER = '#assistant-launcher';
const HEADER_BUTTON = '#assistant-header-button';
const SCALE = '[data-career-scale]';

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

/** Every text line and control of the hero's three roots that lies over `area`, named. */
async function coveredBy(page: Page, area: Rect): Promise<string[]> {
  return page.evaluate((box) => {
    const covered: string[] = [];
    for (const root of ['#top', '#proof', '[data-career-scale]']) {
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
        for (const r of rects) {
          const across = Math.min(box.right, r.right) - Math.max(box.left, r.left);
          const down = Math.min(box.bottom, r.bottom) - Math.max(box.top, r.top);
          if (r.width > 0 && r.height > 0 && across > 1 && down > 1) {
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
      await hydratedAt(page, LAUNCHER);
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

    test('the launcher is hidden by the stylesheet, so it never shows on the first paint, and without script it stays hidden', async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto('/');
      await expect(page.locator(LAUNCHER)).toBeHidden();
      await expect(page.locator(HEADER_BUTTON)).toBeVisible();
      await context.close();
    });

    test('a page without a hero has the floating button from the start', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await open(page, '/privacy');
      await hydrated(page);
      await expect(page.locator(LAUNCHER)).toBeVisible();
    });
  });
});

test.describe('on a touch screen the chips are the controls, and the bars are only drawn', () => {
  for (const [width, height] of [
    [320, 700],
    [390, 844],
    [768, 1024],
    [834, 1112],
  ] as const) {
    test(`${width} by ${height}: bars are out of the tab order and no tap target; eight chips of 44 px, 8 px apart, open the role`, { tag: '@mobile' }, async ({ page }) => {
      await openAs(page, width, height);

      const bars = page.locator(`${SCALE} [data-bars] a`);
      await expect(bars).toHaveCount(careerBars.length);
      for (const bar of await bars.all()) await expect(bar, 'a bar is not rendered as a control').toBeHidden();
      expect(await page.locator(`${SCALE} [data-drawn]`).getAttribute('aria-hidden'), 'the drawing is presentational').toBe('true');

      const chips = page.locator(`${SCALE} [data-chips] a[data-role]`);
      await expect(chips).toHaveCount(careerBars.length);
      const boxes = await chips.evaluateAll((links) =>
        links.map((link) => {
          const { left, top, right, width: w, height: h } = link.getBoundingClientRect();
          return { left, top, right, w, h };
        }),
      );
      boxes.forEach((box, index) => {
        expect(box.w, `chip ${index} width`).toBeGreaterThanOrEqual(44);
        expect(box.h, `chip ${index} height`).toBeGreaterThanOrEqual(44);
        const previous = boxes[index - 1];
        if (previous) expect(box.left - previous.right, `chip ${index} gap`).toBeGreaterThanOrEqual(8);
      });

      // Tab reaches no bar, only chips.
      const reached = new Set<string>();
      await page.locator('#top a[href="#work"]').focus();
      for (let press = 0; press < 40; press += 1) {
        await page.keyboard.press('Tab');
        const where = await page.evaluate(() => {
          const active = document.activeElement as HTMLElement | null;
          return active?.closest('[data-bars]') ? 'bar' : (active?.dataset.role ?? '');
        });
        expect(where, 'Tab never lands on a bar').not.toBe('bar');
        if (where) reached.add(where);
      }

      const role = roles.find((entry) => entry.id === 'anz');
      const chip = `${SCALE} [data-chips] a[data-role="anz"]`;
      await hydratedAt(page, chip);
      await page.locator(chip).scrollIntoViewIfNeeded();
      await page.locator(chip).tap();
      await expect(page.getByRole('dialog', { name: role?.title ?? '' })).toBeVisible();
    });
  }

  test('with a mouse and room, the bars are the controls and there are no chips', { tag: '@desktop' }, async ({ page }) => {
    await openAs(page, 1440, 900);
    await expect(page.locator(`${SCALE} [data-bars] a`).first()).toBeVisible();
    await expect(page.locator(`${SCALE} [data-chips]`)).toBeHidden();
  });
});
