import { test, expect, type Page } from '@playwright/test';

/**
 * SPEC §10 TC-FR-CLONE — the conversational clone is present, and it is inert
 * until asked.
 *
 * This file used to carry two subjects. The first was the static hero portrait
 * (`HeroAvatar`, rendered into `.hero-image-container`): its container, its
 * reserved-dimension CLS guard and its post-preloader crossfade. The hero
 * rebuild removed the portrait from the page altogether — the front door is now
 * type, a three-figure ledger and two links, with no image — so those three
 * tests had no subject left and were deleted rather than weakened into
 * assertions that would pass on an empty page.
 *
 * The second subject survives untouched: `MiniVicBot` still mounts from
 * `app/layout.tsx` and is independent of anything the page contains. It is what
 * this file now covers, and it covers only the *presence* contract — the
 * launcher exists, it is inert until pressed, and pressing it yields a panel
 * with real content. The interaction and accessibility contract belongs to
 * tests/e2e/chatbot.spec.ts and is not restated here.
 *
 * TC-INT-01 was deleted with the same reasoning as the tests above it. It was a
 * `test.skip` gated on an `INTEGRATION_BASE_URL` that is never set in this
 * repository, aimed at a D-ID/ElevenLabs backend that lives in `services/` and
 * that the static export does not host — a permanently-skipped placeholder that
 * asserted nothing about this site on any run.
 */

async function gotoHome(page: Page) {
  // No preloader to sit out: `components/site/Preloader.tsx` is deleted and the
  // hero is server-rendered, so the first paint is the finished page.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

test.describe('TC-FR-CLONE: Clone Rendering (MiniVicBot)', () => {
  test.describe.configure({ timeout: 90000 });

  test('TC-CLONE-03: MiniVicBot launcher is present and interactive on the static build', async ({ page }) => {
    await gotoHome(page);

    const toggle = page.locator('[data-testid="minivic-toggle"]');
    await expect(toggle).toBeVisible();
    await expect(toggle).toBeEnabled();

    // Closed is the resting state. The clone is an offer, not an interruption:
    // nothing about it may be on screen until a visitor asks for it.
    await expect(page.locator('[data-testid="minivic-panel"]')).toHaveCount(0);
  });

  test('TC-CLONE-05: Pressing the launcher yields a panel carrying real clone content', async ({ page }) => {
    await gotoHome(page);

    const toggle = page.locator('[data-testid="minivic-toggle"]');
    await toggle.evaluate((el: HTMLElement) => el.click());

    // The old version ended with `expect(panelVisible || toggle).toBeTruthy()`,
    // which is true for any locator and could not fail. The panel either opens
    // or the clone is broken, so it is asserted outright.
    const panel = page.locator('[data-testid="minivic-panel"]');
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('Mini Vic');
    await expect(page.locator('[data-testid="minivic-input"]')).toBeVisible();

    // And it carries a real opening turn from the knowledge base rather than an
    // empty transcript waiting on a backend the static export does not have.
    const transcript = panel.getByRole('log');
    expect((await transcript.innerText()).trim().length).toBeGreaterThan(40);
  });
});
