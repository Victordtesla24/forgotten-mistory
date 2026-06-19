import { test, expect, type Page } from '@playwright/test';

/**
 * TC-UIUX-HERO-AVATAR (UI/UX upgrade §7, Wave 2 / #8) — the hero portrait is a
 * studio-grade instrument panel, not a flat picture:
 *  - HUD bracket frame (four corners) + a glassmorphism subject label,
 *  - a scan-line sweep element on the subject label,
 *  - a dedicated 3D-tilt wrapper the magnetic hover drives,
 *  - a cinematic entrance that NEVER leaves the LCP portrait hidden, and
 *  - a reduced-motion path where every layer resolves to its resting, visible state.
 *
 * The portrait image is the hero LCP candidate, so the binding guarantee tested
 * here is that it is opacity:1 (painted) in both the normal and reduced-motion
 * paths — the entrance may scale, but must never fade the portrait out.
 */
async function gotoHeroAvatar(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
  await page.locator('#avatar-container').waitFor({ state: 'attached', timeout: 15000 });
}

test.describe('TC-UIUX-HERO-AVATAR — studio portrait instrument (Wave 2 #8)', () => {
  test.describe.configure({ timeout: 90000 });

  test('renders HUD frame, glass subject label with scan sweep, and a 3D-tilt wrapper', async ({ page }) => {
    await gotoHeroAvatar(page);
    const avatar = page.locator('#avatar-container');
    await expect(avatar).toHaveCount(1);

    // Four HUD bracket corners frame the portrait.
    await expect(avatar.locator('.avatar-frame .hud-frame__corner')).toHaveCount(4);

    // Subject label present + carries its scan-line sweep element (signature motif).
    const tag = avatar.locator('.avatar-tag');
    await expect(tag).toHaveCount(1);
    await expect(tag).toContainText(/SUBJECT/i);
    await expect(avatar.locator('.avatar-tag .avatar-tag__scan')).toHaveCount(1);

    // The magnetic hover tilt drives a dedicated wrapper that holds the portrait.
    const tilt = avatar.locator('.avatar-tilt');
    await expect(tilt).toHaveCount(1);
    await expect(tilt.locator('.avatar-circle')).toHaveCount(1);
  });

  test('portrait LCP image is painted (opacity:1), not faded out by the entrance', async ({ page }) => {
    await gotoHeroAvatar(page);
    const img = page.locator('#avatar-container .avatar-img').first();
    await expect(img).toBeVisible();
    // The entrance animates scale, never opacity-to-zero on the still portrait.
    await expect(img).toHaveCSS('opacity', '1');
  });
});

/**
 * A11y gate: under prefers-reduced-motion every layer of the upgraded portrait
 * must settle into its visible resting state — the chrome reveal resolves, the
 * portrait stays painted, and the decorative scan sweep does not animate.
 */
test.describe('TC-UIUX-HERO-AVATAR — reduced-motion settles every layer', () => {
  test.describe.configure({ timeout: 90000 });

  test('frame, label and portrait all resolve to opacity:1 under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHeroAvatar(page);
    const avatar = page.locator('#avatar-container');
    await expect(avatar.locator('.avatar-frame')).toHaveCSS('opacity', '1');
    await expect(avatar.locator('.avatar-tag')).toHaveCSS('opacity', '1');
    await expect(avatar.locator('.avatar-img').first()).toHaveCSS('opacity', '1');
  });
});
