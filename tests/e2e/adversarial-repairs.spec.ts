import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const LIVE_BASE = 'https://forgotten-mistory.web.app';
const BASE = (process.env.PLAYWRIGHT_BASE_URL || LIVE_BASE).replace(/\/$/, '');

const EXPERIENCE = '#experience';
const VITRINE = '#vitrine';
const TRACK_BAR = `${EXPERIENCE} [class*="trackBar"]`;
const STAGE_BUTTONS = `${VITRINE} [data-testid="mechanism-diagram"] button`;
const MENU_TOGGLE = '.menu-toggle';

function sourceCheck(needle: string, file: string) {
  const source = fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  expect(source, `${file} should still contain selector/source hook ${needle}`).toContain(needle);
}

test.describe('C4 adversarial repair reproductions', () => {
  test('C4-SSR-BARS: JavaScript-blocked Experience keeps a visible duration axis', async ({ page }) => {
    sourceCheck('trackBar', 'components/sections/Experience/Experience.module.css');
    sourceCheck('data-track-field', 'components/sections/Experience/Experience.tsx');

    await page.route('**/*', async (route) => {
      const request = route.request();
      const url = request.url();
      const isJavascript = request.resourceType() === 'script' || /\.(?:m?js)(?:\?|$)/.test(url);
      if (isJavascript) {
        await route.abort('blockedbyclient');
      } else {
        await route.continue();
      }
    });

    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await page.locator(EXPERIENCE).scrollIntoViewIfNeeded();

    const bars = page.locator(TRACK_BAR);
    await expect(bars).toHaveCount(8);

    const measurements = await bars.evaluateAll((nodes) => nodes.map((node, index) => {
      const el = node as HTMLElement;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const matrix = new DOMMatrixReadOnly(style.transform === 'none' ? undefined : style.transform);
      return {
        index,
        offsetWidth: el.offsetWidth,
        paintedWidth: rect.width,
        transform: style.transform,
        scaleX: matrix.a,
      };
    }));

    for (const bar of measurements) {
      expect(bar.offsetWidth, `bar ${bar.index} has encoded layout width`).toBeGreaterThan(0);
      expect(bar.scaleX, `bar ${bar.index} computed transform must not collapse the static axis`).toBeGreaterThanOrEqual(0.95);
      expect(bar.paintedWidth, `bar ${bar.index} painted width must remain visible without JavaScript`).toBeGreaterThan(1);
    }
  });

  test('C4-NESTED-FOCUS: Vitrine nested stage buttons keep focus on ArrowRight', async ({ page }) => {
    sourceCheck('data-testid="mechanism-diagram"', 'components/sections/Vitrine/Vitrine.tsx');
    sourceCheck('stageButton', 'components/sections/Vitrine/Vitrine.tsx');

    await page.goto(`${BASE}/`);
    await page.locator(VITRINE).scrollIntoViewIfNeeded();

    const stageButton = page.locator(STAGE_BUTTONS).first();
    await expect(stageButton).toBeVisible();
    await stageButton.focus();
    await expect(stageButton).toBeFocused();

    await stageButton.press('ArrowRight');
    await expect(stageButton, 'ArrowRight inside a stage control must not bubble to the plate rail roving-focus handler').toBeFocused();
  });

  test('C4-STAGE-STATE: Vitrine stage buttons expose selected state with aria-pressed', async ({ page }) => {
    sourceCheck('data-active', 'components/sections/Vitrine/Vitrine.tsx');
    sourceCheck('stageButton', 'components/sections/Vitrine/Vitrine.tsx');

    await page.goto(`${BASE}/`);
    await page.locator(VITRINE).scrollIntoViewIfNeeded();

    const buttons = page.locator(STAGE_BUTTONS);
    await expect(buttons).toHaveCount(18);

    const first = buttons.nth(0);
    const second = buttons.nth(1);
    await expect(first, 'default selected stage exposes aria-pressed=true').toHaveAttribute('aria-pressed', 'true');
    await expect(second, 'unselected stage exposes aria-pressed=false').toHaveAttribute('aria-pressed', 'false');

    await second.click();
    await expect(second, 'clicked stage exposes aria-pressed=true').toHaveAttribute('aria-pressed', 'true');
    await expect(first, 'previous stage exposes aria-pressed=false').toHaveAttribute('aria-pressed', 'false');
  });

  for (const width of [320, 390]) {
    test(`C4-MENU-TARGET @ ${width}: mobile Menu target is at least 24 CSS px high`, async ({ page }) => {
      sourceCheck('className="menu-toggle"', 'components/site/Navigation.tsx');
      sourceCheck('.menu-toggle', 'app/globals.css');

      await page.setViewportSize({ width, height: 720 });
      await page.goto(`${BASE}/`);

      const menu = page.locator(MENU_TOGGLE);
      await expect(menu).toBeVisible();
      await expect(menu).toHaveText(/Menu/);
      const box = await menu.boundingBox();
      expect(box, 'menu button bounding box').not.toBeNull();
      expect(box!.width, `Menu target width at ${width}px`).toBeGreaterThanOrEqual(24);
      expect(box!.height, `Menu target height at ${width}px`).toBeGreaterThanOrEqual(24);
    });
  }
});
