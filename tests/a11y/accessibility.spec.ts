import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Accessibility — axe-core against the six sections the page actually has.
 *
 * The page was rebuilt around `#hero`, `#about`, `#experience`, `#skills`,
 * `#vitrine` and `#listen`; `#contact` and the `<footer>` were deleted with it.
 * The two checks that pointed at them (A11Y-06 contact, A11Y-07 + A11Y-12
 * footer) had no subject left, so rather than let the closing screen and the
 * catalogue go unaudited they were re-pointed: `#vitrine` now carries the
 * horizontal rail and `#listen` carries the four contact anchors, which is
 * where the accessibility risk actually moved to.
 *
 * `#vitrine` is deliberately audited on its own rather than only through the
 * full-page pass. The rail is a real `overflow-x` scroll container, which is
 * the exact shape axe's `scrollable-region-focusable` rule (serious, WCAG
 * 2.1.1) exists to catch — the same rule the deleted A11Y-14 telemetry-log
 * check was written for. That component is gone; the rule still has a subject,
 * and this is it.
 *
 * There is no preloader to wait out any more: the hero is server-rendered and
 * `app/page.tsx` raises `body.page-ready` on the frame after mount, so every
 * navigation keys on that instead of on a boot overlay that no longer exists.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Runs axe over one section and prints every violation before asserting, so a
 * failure names the rule and the offending node instead of only a count.
 */
async function expectSectionClean(page: Page, selector: string) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  const results = await new AxeBuilder({ page }).include(selector).withTags(WCAG).analyze();

  if (results.violations.length > 0) {
    console.log(`\n=== AXE VIOLATIONS [${selector}] ===`);
    for (const v of results.violations) {
      console.log(`  - ${v.id}: ${v.description} (impact: ${v.impact ?? 'none'})`);
      for (const node of v.nodes) console.log(`    ${node.html?.slice(0, 160)}`);
    }
  }
  expect(results.violations.map((v) => v.id)).toEqual([]);
}

test.describe('A11y: axe-core Accessibility Audit', () => {
  test.describe.configure({ timeout: 120000 });

  test('A11Y-01: Full page passes axe check (wcag2a + wcag2aa + wcag21a + wcag21aa)', async ({ page }) => {
    await gotoHome(page);
    // The scenes mount behind an IntersectionObserver and the Skills table
    // re-measures once the web fonts land; audit after both have settled.
    await page.waitForTimeout(2000);
    const results = await new AxeBuilder({ page })
      .withTags(WCAG)
      // The only remaining <iframe>-shaped content is the avatar's <video>, which
      // axe cannot reach into; nothing else on the page is third-party.
      .exclude('iframe, iframe *')
      .analyze();

    if (results.violations.length > 0) {
      console.log('\n=== AXE VIOLATIONS [full page] ===');
      for (const v of results.violations) {
        console.log(`  - ${v.id}: ${v.description} (impact: ${v.impact ?? 'none'})`);
        for (const node of v.nodes) console.log(`    ${node.html?.slice(0, 160)}`);
      }
    }
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test('A11Y-02: Hero section passes axe check', async ({ page }) => {
    await gotoHome(page);
    await expectSectionClean(page, '#hero');
  });

  test('A11Y-03: About section passes axe check', async ({ page }) => {
    await gotoHome(page);
    await expectSectionClean(page, '#about');
  });

  test('A11Y-04: Experience section passes axe check', async ({ page }) => {
    await gotoHome(page);
    await expectSectionClean(page, '#experience');
  });

  test('A11Y-05: Skills section passes axe check', async ({ page }) => {
    await gotoHome(page);
    await expectSectionClean(page, '#skills');
  });

  test('A11Y-06: Vitrine rail passes axe check, including scrollable-region-focusable', async ({ page }) => {
    await gotoHome(page);
    await expectSectionClean(page, '#vitrine');
  });

  test('A11Y-07: Listen (closing) section passes axe check', async ({ page }) => {
    await gotoHome(page);
    await expectSectionClean(page, '#listen');
  });

  test('A11Y-08: Navigation overlay (open state) passes axe check', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.menu-toggle').click();
    await expect(page.locator('#site-nav-overlay')).toHaveClass(/open/);
    const results = await new AxeBuilder({ page })
      .include('#site-nav-overlay')
      .withTags(WCAG)
      .analyze();
    expect(results.violations.map((v) => v.id)).toEqual([]);
  });

  test('A11Y-09: Tab moves focus forward through real, visible controls', async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(1000);

    // The old version pressed Tab twenty times and then asserted that it had
    // pressed Tab twenty times, which could not fail. What matters is that
    // focus actually advances and lands on genuinely focusable things — a
    // keyboard user who tabs into a dead element is stuck there.
    const seen: string[] = [];
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press('Tab');
      seen.push(
        await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body) return 'BODY';
          const id = el.id ? `#${el.id}` : '';
          const testid = el.getAttribute('data-testid');
          return `${el.tagName}${id}${testid ? `[${testid}]` : ''}:${(el.textContent ?? '').trim().slice(0, 20)}`;
        }),
      );
    }

    // Focus must leave <body> immediately and keep moving: a run of identical
    // consecutive descriptors means the tab order is stuck.
    expect(seen[0]).not.toBe('BODY');
    for (let i = 1; i < seen.length; i += 1) {
      expect(seen[i], `focus did not advance at Tab #${i + 1}: ${seen.join(' | ')}`).not.toBe(seen[i - 1]);
    }
  });

  test('A11Y-10: Keyboard Escape closes the nav overlay and returns focus to the toggle', async ({ page }) => {
    await gotoHome(page);
    const toggle = page.locator('.menu-toggle');
    await toggle.click();
    const overlay = page.locator('#site-nav-overlay');
    await expect(overlay).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(overlay).not.toHaveClass(/open/);
    // WCAG 2.4.3: focus must come back to what opened the menu, not to the top
    // of the document — otherwise closing the menu loses the reader's place.
    await expect(toggle).toBeFocused();
  });

  test('A11Y-11: The page exposes one navigation landmark and one main landmark', async ({ page }) => {
    await gotoHome(page);
    await expect(page.getByRole('navigation')).toHaveCount(1);
    await expect(page.getByRole('main')).toHaveCount(1);
  });

  test('A11Y-12: Every section is reachable by its own accessible name', async ({ page }) => {
    await gotoHome(page);
    // Each of the six sections is `aria-labelledby` its own heading. This is what
    // lets a screen-reader user jump between them; the old footer `contentinfo`
    // check covered the same idea for a landmark that no longer exists.
    for (const id of ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen']) {
      const section = page.locator(`section#${id}`);
      await expect(section).toHaveCount(1);
      const labelledBy = await section.getAttribute('aria-labelledby');
      expect(labelledBy, `section#${id} has no aria-labelledby`).toBeTruthy();
      await expect(page.locator(`#${labelledBy}`)).toHaveCount(1);
    }
  });

  test('A11Y-13: Images have alt text, links and buttons have discernible names', async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(1500);
    const results = await new AxeBuilder({ page })
      .withTags(WCAG)
      .exclude('iframe, iframe *')
      .analyze();
    const named = results.violations.filter(
      (v) => v.id === 'image-alt' || v.id === 'link-name' || v.id === 'button-name',
    );
    expect(named.map((v) => `${v.id}: ${v.nodes[0]?.html?.slice(0, 120)}`)).toEqual([]);
  });
});
