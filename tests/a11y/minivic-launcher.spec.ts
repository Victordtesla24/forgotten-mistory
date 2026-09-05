import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * The MiniVic launcher, as a keyboard user and a screen reader meet it.
 *
 * Two findings from the v9 adversarial pass are closed here.
 *
 * ADV-F-3 (R-c8 item 12) was an instrument disagreement: the attack script's
 * `el.closest('[aria-hidden="true"]')` said the launcher sat inside a hidden
 * subtree, while axe reported no `aria-hidden-focus` violation. Both were
 * right about different moments — the dock carried `aria-hidden` until the
 * reader scrolled past the hero, so a focusable button really was inside an
 * `aria-hidden="true"` subtree at scroll top, which is a WCAG 4.1.2 failure
 * however briefly it lasts. The rule is absolute and stated as such: at no
 * scroll position, at either viewport, is there an `aria-hidden="true"`
 * between the launcher and `<html>`.
 *
 * ADV-F-2 (R-c8 item 13) was measured, not inferred: the launcher was the 93rd
 * of 100 tab stops. The chatbot is the channel the brief names for employers
 * and clients, and a keyboard user had to traverse the entire page to reach
 * it. The fix extends the bypass-block pattern that already exists rather than
 * reordering the DOM: a second skip control, off-canvas until focused, that
 * opens the panel and leaves focus on the launcher so the reader is oriented at
 * the control they just operated.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="minivic-toggle"]');
      if (!btn) return false;
      return Object.keys(btn).some(
        (key) => key.startsWith('__reactFiber') || key.startsWith('__reactProps'),
      );
    },
    { timeout: 30000 },
  );
}

/** {tag, class, aria-hidden} for every ancestor between the launcher and <html>. */
async function ancestorChain(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector('[data-testid="minivic-toggle"]');
    if (!el) return [{ tag: 'MISSING', cls: '', ariaHidden: 'launcher not found' }];
    const chain: { tag: string; cls: string; ariaHidden: string | null }[] = [];
    let node: Element | null = el.parentElement;
    while (node) {
      chain.push({
        tag: node.tagName,
        cls: String((node as HTMLElement).className ?? '').slice(0, 48),
        ariaHidden: node.getAttribute('aria-hidden'),
      });
      node = node.parentElement;
    }
    return chain;
  });
}

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

test.describe('A11y: the MiniVic launcher', () => {
  test.describe.configure({ timeout: 120000 });

  for (const { width, height } of VIEWPORTS) {
    test(`TC-MV-ARIA-01 @ ${width}: no aria-hidden ancestor, and axe finds no aria-hidden-focus`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await gotoHome(page);

      // Scroll top — the position the dock used to hide itself from the
      // accessibility tree while leaving its button in the tab order.
      for (const y of [0, 1200, 4000]) {
        await page.evaluate((to) => window.scrollTo(0, to), y);
        await page.waitForTimeout(350);
        const chain = await ancestorChain(page);
        const hidden = chain.filter((a) => a.ariaHidden === 'true');
        expect(
          hidden,
          `at scrollY ${y} the launcher sits inside ${hidden.length} aria-hidden="true" ancestor(s): ` +
            JSON.stringify(hidden),
        ).toEqual([]);
      }

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .withRules(['aria-hidden-focus', 'aria-hidden-body'])
        .analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.length} node(s)`),
        JSON.stringify(results.violations, null, 2),
      ).toEqual([]);
    });
  }

  test('TC-MV-SKIP-01: the launcher is reachable in three tab stops and opens from the keyboard', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);

    // Start from the very top of the document order, as a reader arriving on
    // the page does.
    await page.evaluate(() => {
      window.scrollTo(0, 0);
      (document.activeElement as HTMLElement | null)?.blur();
    });

    const names: string[] = [];
    let found = -1;
    for (let stop = 1; stop <= 3; stop += 1) {
      await page.keyboard.press('Tab');
      const name = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el) return '';
        return (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim();
      });
      names.push(`${stop}: "${name}"`);
      if (name === 'Ask Mini Vic') {
        found = stop;
        break;
      }
    }
    expect(found, `first three tab stops were ${names.join(', ')}`).toBeGreaterThan(0);

    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="minivic-panel"]')).toBeVisible();

    const landed = await page.evaluate(
      () => (document.activeElement as HTMLElement | null)?.getAttribute('data-testid') ?? null,
    );
    expect(landed, 'Enter on the skip control must leave focus on the launcher').toBe(
      'minivic-toggle',
    );
  });
});
