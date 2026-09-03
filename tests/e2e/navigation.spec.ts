import { test, expect, type Page } from '@playwright/test';

/**
 * E2E — Navigation.
 *
 * `components/site/Navigation.tsx` survived the rebuild unchanged in shape: a
 * line-draw wordmark, an always-visible Download CV, a hamburger↔X toggle and a
 * full-screen overlay. What changed underneath it is the set of sections it can
 * point at. The menu used to offer nine links, three of which (#architecture-lab,
 * #work, #contact) addressed sections the rebuild deleted — so a recruiter
 * clicking "Work" got nothing at all, which is a worse failure than a missing
 * link. TC-NAV-04 was therefore not merely re-listed against the new labels: it
 * now resolves every in-page anchor against the live DOM, so the menu can never
 * again drift out of step with `app/page.tsx` without a test saying so.
 *
 * There is no preloader to sit out. The hero is server-rendered and
 * `app/page.tsx` raises `body.page-ready` on the frame after mount, so every
 * navigation here keys on that.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

test.describe('E2E: Navigation', () => {
  test.describe.configure({ timeout: 60000 });

  test('TC-NAV-01: Logo renders with correct text', async ({ page }) => {
    await gotoHome(page);
    const logo = page.locator('.logo');
    await expect(logo).toBeVisible();
    await expect(logo).toContainText('VIKRAM.');
  });

  test('TC-NAV-02: Menu toggle and the always-visible Download CV both render', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('.menu-toggle')).toBeVisible();
    // D-CV-01: the strongest recruiter action must be reachable without opening
    // the menu at all, so it sits in the bar rather than only in the overlay.
    const cv = page.locator('.nav-cv');
    await expect(cv).toBeVisible();
    await expect(cv).toHaveAttribute('href', '/docs/Vik_Resume_Final.pdf');
  });

  test('TC-NAV-03: Nav overlay opens on toggle click', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.menu-toggle').click();
    const overlay = page.locator('#site-nav-overlay');
    await expect(overlay).toHaveClass(/open/);
    await expect(overlay.locator('.nav-link').first()).toBeVisible();
  });

  test('TC-NAV-04: Every in-page nav anchor resolves to a section that exists', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.menu-toggle').click();
    const links = page.locator('#site-nav-overlay .nav-link');

    // The labels, in page order, plus the two external actions.
    await expect(links).toHaveText([
      'Home',
      'About',
      'Experience',
      'Skills',
      'Work',
      'Contact',
      'LinkedIn',
      'Download CV',
    ]);

    // And the check that actually matters: no hash link may dangle. This is the
    // regression that shipped once already — three menu entries pointing at
    // deleted sections — and it is invisible to a label-only assertion.
    const hrefs = await links.evaluateAll((els) =>
      els.map((el) => el.getAttribute('href') ?? ''),
    );
    const hashes = hrefs.filter((h) => h.startsWith('#'));
    expect(hashes.length, 'the menu offers no in-page links at all').toBeGreaterThanOrEqual(6);
    for (const hash of hashes) {
      await expect(page.locator(hash), `nav link ${hash} points at nothing`).toHaveCount(1);
    }
  });

  test('TC-NAV-05: Nav overlay closes on Escape key', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.menu-toggle').click();
    const overlay = page.locator('#site-nav-overlay');
    await expect(overlay).toHaveClass(/open/);

    await page.keyboard.press('Escape');
    await expect(overlay).not.toHaveClass(/open/);
  });

  test('TC-NAV-06: Clicking a nav link scrolls to the correct section', async ({ page }) => {
    await gotoHome(page);
    await page.locator('.menu-toggle').click();
    await page.locator('#site-nav-overlay .nav-link', { hasText: 'About' }).click();

    const about = page.locator('#about');
    await expect(about).toBeVisible();
    // The anchor jump should put the section's top near the top of the viewport;
    // if it did nothing at all the hero would still be filling the screen.
    await expect
      .poll(async () => (await about.boundingBox())?.y ?? Number.POSITIVE_INFINITY, { timeout: 5000 })
      .toBeLessThan(600);
  });

  test('TC-NAV-07: Sticky nav — nav and wordmark survive scrolling and frost', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => window.scrollTo(0, 2000));
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    await expect(page.locator('.logo')).toBeVisible();
    // Transparent at the top, frosted once the page leaves it.
    await expect(nav).toHaveAttribute('data-scrolled', 'true');
  });

  test('TC-NAV-08: Logo click scrolls to top', async ({ page }) => {
    await gotoHome(page);
    await page.evaluate(() => window.scrollTo(0, 2000));
    await page.waitForTimeout(300);
    await page.locator('.logo').click();
    await expect.poll(async () => page.evaluate(() => window.scrollY), { timeout: 5000 }).toBeLessThan(100);
  });
});
