import { test, expect, type Page, type Locator } from '@playwright/test';

/**
 * TC-FR-ACCORDION — ExpandableCard (About snap-cards + Skills cards).
 *
 * Covers the accordion contract enforced by components/site/ExpandableCard.tsx:
 *   (a) each of the 4 About snap-cards expands on click (body height 0 → >0);
 *   (b) at least one Skills card expands the same way;
 *   (c) aria-expanded toggles true → false across open/collapse;
 *   (d) clicking an open card again collapses it (body unmounts / height → 0);
 *   (e) under prefers-reduced-motion the opened body is still VISIBLE (height > 0)
 *       — reduced-motion users skip the height/opacity tween but MUST still be able
 *       to read the content (ExpandableCard sets initial={false} + exit={undefined}
 *       under reduced motion, so the body snaps open instantly instead of animating).
 *
 * The body lives in the DOM only while the card is open (AnimatePresence conditional
 * render), so collapse is asserted via detach (count → 0) rather than a height read on
 * a removed node.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

/** Asserts that clicking the header opens the card and the body renders with height > 0. */
async function expectExpands(card: Locator, headerClass: string, bodyClass: string) {
  const header = card.locator(`.${headerClass}`);
  const body = card.locator(`.${bodyClass}`);

  await expect(header).toBeVisible();
  await expect(header).toHaveAttribute('aria-expanded', 'false');
  await expect(card).not.toHaveClass(/\bopen\b/);

  await header.click();

  await expect(card).toHaveClass(/\bopen\b/);
  await expect(header).toHaveAttribute('aria-expanded', 'true');
  await expect(body).toBeVisible();
  await expect(body).toHaveClass(/\bexpanded\b/);

  // body height climbs from 0 (collapsed) to a real, measurable height.
  await expect
    .poll(async () => {
      const bb = await body.boundingBox();
      return bb ? bb.height : 0;
    }, { timeout: 5000 })
    .toBeGreaterThan(0);
}

test.describe('TC-FR-ACCORDION — ExpandableCard expand/collapse', () => {
  test.describe.configure({ timeout: 90000 });

  test('(a) all four About snap-cards expand on click with visible body height', async ({ page }) => {
    await gotoHome(page);

    const aboutSection = page.locator('#about');
    await aboutSection.scrollIntoViewIfNeeded();

    const snapCards = aboutSection.locator('.snap-card');
    await expect(snapCards).toHaveCount(4);

    for (let i = 0; i < 4; i += 1) {
      await expectExpands(snapCards.nth(i), 'snap-header', 'snap-body');
    }
  });

  test('(b) at least one Skills card expands on click with visible body height', async ({ page }) => {
    await gotoHome(page);

    const skillsSection = page.locator('#skills');
    await skillsSection.scrollIntoViewIfNeeded();

    const skillCards = skillsSection.locator('.skill-card');
    expect(await skillCards.count()).toBeGreaterThanOrEqual(1);

    await expectExpands(skillCards.first(), 'skill-header', 'skill-body');
  });

  test('(c) aria-expanded toggles true → false on open then collapse', async ({ page }) => {
    await gotoHome(page);

    const aboutSection = page.locator('#about');
    await aboutSection.scrollIntoViewIfNeeded();

    const firstCard = aboutSection.locator('.snap-card').first();
    const header = firstCard.locator('.snap-header');

    await expect(header).toHaveAttribute('aria-expanded', 'false');

    await header.click();
    await expect(header).toHaveAttribute('aria-expanded', 'true');

    await header.click();
    await expect(header).toHaveAttribute('aria-expanded', 'false');
  });

  test('(d) clicking an open card again collapses it (body detaches / height → 0)', async ({ page }) => {
    await gotoHome(page);

    const aboutSection = page.locator('#about');
    await aboutSection.scrollIntoViewIfNeeded();

    const firstCard = aboutSection.locator('.snap-card').first();
    const header = firstCard.locator('.snap-header');
    const body = firstCard.locator('.snap-body');

    await header.click();
    await expect(firstCard).toHaveClass(/\bopen\b/);
    await expect(body).toBeVisible();

    await header.click();
    // AnimatePresence unmounts the body on exit; the card loses its open state.
    await expect(firstCard).not.toHaveClass(/\bopen\b/);
    await expect(body).toHaveCount(0);
  });

  test('(e) prefers-reduced-motion: opened body is still visible with height > 0', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);

    const aboutSection = page.locator('#about');
    await aboutSection.scrollIntoViewIfNeeded();

    const firstCard = aboutSection.locator('.snap-card').first();
    const header = firstCard.locator('.snap-header');
    const body = firstCard.locator('.snap-body');

    await header.click();

    await expect(firstCard).toHaveClass(/\bopen\b/);
    await expect(header).toHaveAttribute('aria-expanded', 'true');
    // Reduced-motion users skip the tween but the content must still be readable:
    // initial={false} snaps the body straight to its open height.
    await expect(body).toBeVisible();
    const bb = await body.boundingBox();
    expect(bb).not.toBeNull();
    expect(bb!.height).toBeGreaterThan(0);
  });
});
