import { test, expect, type Page } from '@playwright/test';

/**
 * R-c13 ADV-4 / R-c8 C-07 — one "Download CV" per first screen.
 *
 * The first viewport carried three anchors to the same PDF: the nav pill
 * (`components/site/Navigation.tsx:173`), the hero's secondary action
 * (`components/sections/Hero/Hero.tsx:101`) and a third, invisible-but-hit-
 * testable 548x96 anchor at (445.9, 6) — the closed overlay's own "Download CV"
 * link, which framer-motion animates to `opacity: 0` but which kept
 * `visibility: visible`, so it still sat in the hit-test tree across the whole
 * nav band. A reader with a screen magnifier or a stray click landed on a
 * control they could not see.
 *
 * Two identical controls in one screen is not twice the invitation; it is a
 * reader deciding which of the two is the real one. The rule this file holds is
 * the plainest statement of the fix: at scroll top, exactly one element that
 * links to the CV is both on screen and painted. Which one it is, is a design
 * decision recorded in the cycle's `07-decisions.md` — the hero owns the first
 * screen and the nav pill takes over the moment the reader leaves it.
 *
 * The viewport heights are the real ones the widths ship with (iPhone 12,
 * iPad Air, a 1280 laptop, a 1440 laptop, a 1920 desktop) rather than a
 * constant, because "is the hero's own CTA in the first screen" is a question
 * about the screen, not about the width.
 */

const CV = 'a[href="/docs/Vik_Resume_Final.pdf"]';

const SCREENS = [
  { name: '390x844 (phone)', width: 390, height: 844 },
  { name: '834x1112 (tablet)', width: 834, height: 1112 },
  { name: '1280x800 (laptop)', width: 1280, height: 800 },
  { name: '1440x900 (laptop)', width: 1440, height: 900 },
  { name: '1920x1080 (desktop)', width: 1920, height: 1080 },
];

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#hero').first().waitFor({ state: 'visible', timeout: 20000 });
  // The nav flags itself scrolled imperatively on the first scroll event it
  // hears; give that effect a frame so the top state is the settled one.
  await page.waitForTimeout(600);
}

/** Every CV anchor whose rect meets the viewport and which is actually painted. */
async function countingCvControls(page: Page) {
  return page.evaluate((selector: string) => {
    return Array.from(document.querySelectorAll(selector))
      .map((el) => {
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const intersects =
          r.width > 0 &&
          r.height > 0 &&
          r.bottom > 0 &&
          r.top < window.innerHeight &&
          r.right > 0 &&
          r.left < window.innerWidth;
        return {
          label: `${(el.className || '(no class)').toString().slice(0, 32)} "${(el.textContent || '').trim().slice(0, 24)}" (${Math.round(r.x)}, ${Math.round(r.y)}) ${Math.round(r.width)}x${Math.round(r.height)} visibility=${cs.visibility} display=${cs.display}`,
          counts: intersects && cs.visibility !== 'hidden' && cs.display !== 'none',
        };
      })
      .filter((row) => row.counts)
      .map((row) => row.label);
  }, selector());
}

function selector() {
  return CV;
}

test.describe('ADV-4 — one CV control in the first screen', () => {
  test.describe.configure({ timeout: 90000 });

  for (const screen of SCREENS) {
    test(`CTA-01 @ ${screen.name}: exactly one visible CV control at scroll top`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: screen.width, height: screen.height });
      await gotoHome(page);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      expect(await page.evaluate(() => window.scrollY)).toBe(0);

      const showing = await countingCvControls(page);
      console.log(`\n=== CTA-01 @ ${screen.name} === ${showing.length} visible CV control(s)`);
      for (const row of showing) console.log(`  ${row}`);

      expect(
        showing,
        'two identical CV controls in one screen make the reader choose between them; ' +
          'the third was an invisible 548x96 hit target across the nav band',
      ).toHaveLength(1);
    });
  }

  test('CTA-02: the nav pill returns once the reader leaves the hero', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);

    const pill = page.locator('.nav-cv');
    await expect(pill, 'the deferred pill is still in the document, just not painted').toHaveCount(1);
    expect(
      await pill.evaluate((el) => getComputedStyle(el).visibility),
      'at the top the hero owns the CV action',
    ).toBe('hidden');

    await page.evaluate(() => window.scrollTo(0, 900));
    await expect(page.locator('nav').first()).toHaveAttribute('data-scrolled', 'true');
    await expect(pill, 'past the hero the nav is the only CV action left, so it must be there').toBeVisible();
    await expect(pill).toHaveAttribute('href', '/docs/Vik_Resume_Final.pdf');

    // It fades in on a transition, so the instant after the attribute flips it
    // is genuinely mid-way. Poll rather than sample.
    await expect
      .poll(async () => Number(await pill.evaluate((el) => getComputedStyle(el).opacity)), {
        timeout: 5000,
      })
      .toBeGreaterThan(0.99);

    const painted = await pill.evaluate((el) => {
      const cs = getComputedStyle(el);
      return { visibility: cs.visibility, opacity: cs.opacity, borderStyle: cs.borderTopStyle };
    });
    console.log(`\n=== CTA-02 restored nav pill === ${JSON.stringify(painted)}`);
    expect(painted.visibility).toBe('visible');
    expect(painted.borderStyle, 'restored as the pill it was, not as bare text').toBe('solid');
  });

  test('CTA-03: the closed overlay is out of the hit-test tree entirely', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await gotoHome(page);

    const overlay = page.locator('#site-nav-overlay');
    expect(
      await overlay.evaluate((el) => getComputedStyle(el).visibility),
      'a closed overlay that is merely transparent is still a 548x96 target under the cursor',
    ).toBe('hidden');

    // And it must still open: hiding it is not allowed to cost the menu.
    await page.locator('.menu-toggle').click();
    await expect(overlay).toHaveClass(/open/);
    await expect(overlay.locator('.nav-link').first()).toBeVisible();
    expect(await overlay.evaluate((el) => getComputedStyle(el).visibility)).toBe('visible');
  });
});
