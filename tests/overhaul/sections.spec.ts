import { test, expect, type Page } from '@playwright/test';

/**
 * Section-level TC bindings for the stable, currently-built requirements:
 * TC-FR-NAV, TC-FR-ABOUT, TC-FR-EXP, TC-FR-SKILLS, TC-FR-SEO, TC-FR-RESP.
 * (PROOF / CONTACT-booking / CHAT / VOICE etc. get their specs as those features land.)
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('Section TCs', () => {
  test.describe.configure({ timeout: 90000 });
  test.beforeEach(async ({ page }) => gotoHome(page));

  test('TC-FR-NAV — menu opens, lists sections, closes on Esc', async ({ page }) => {
    const toggle = page.locator('.menu-toggle');
    await expect(toggle).toBeVisible();
    const overlay = page.locator('#site-nav-overlay');
    await toggle.click();
    await expect(overlay).toHaveClass(/\bopen\b/);
    await expect(page.locator('.nav-link', { hasText: 'Contact' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(overlay).not.toHaveClass(/\bopen\b/);
  });

  test('TC-FR-ABOUT — #about renders title + biographical text', async ({ page }) => {
    const about = page.locator('#about');
    await expect(about).toHaveCount(1);
    await expect(about).toContainText('About');
    await expect(about).toContainText(/15\+? years|technology industry/i);
  });

  test('TC-FR-ABOUT-EXPAND — About Me cards expand with visible content (IV-1/2)', async ({ page }) => {
    const aboutSection = page.locator('#about');
    await aboutSection.scrollIntoViewIfNeeded();

    const snapCards = aboutSection.locator('.snap-card');
    const cardCount = await snapCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    const firstCard = snapCards.first();
    const header = firstCard.locator('.snap-header');
    const body = firstCard.locator('.snap-body');

    await expect(header).toBeVisible();
    await expect(firstCard).not.toHaveClass(/\bopen\b/);

    await header.click();

    await expect(firstCard).toHaveClass(/\bopen\b/);
    await expect(body).toBeVisible();
    const bb = await body.boundingBox();
    expect(bb).not.toBeNull();
    expect(bb!.height).toBeGreaterThan(0);
  });

  test('TC-FR-EXP — #experience lists ATO + ANZ roles with dates', async ({ page }) => {
    const exp = page.locator('#experience');
    await expect(exp).toHaveCount(1);
    await expect(exp).toContainText('Australian Taxation Office');
    await expect(exp).toContainText('March 2026 - Present');
    await expect(exp).toContainText('ANZ');
  });

  test('TC-FR-SKILLS — #skills renders groups incl. credentials', async ({ page }) => {
    const skills = page.locator('#skills');
    await expect(skills).toHaveCount(1);
    await expect(skills).toContainText(/Certifications|Credentials|Governance/i);
  });

  test('TC-FR-SKILLS-EXPAND — Skills cards expand with visible content (IV-1/2)', async ({ page }) => {
    const skillsSection = page.locator('#skills');
    await skillsSection.scrollIntoViewIfNeeded();

    const skillCards = skillsSection.locator('.skill-card');
    const cardCount = await skillCards.count();
    expect(cardCount).toBeGreaterThanOrEqual(1);

    const firstCard = skillCards.first();
    const header = firstCard.locator('.skill-header');
    const body = firstCard.locator('.skill-body');

    await expect(header).toBeVisible();

    await header.click();

    await expect(firstCard).toHaveClass(/\bopen\b/);
    await expect(body).toBeVisible();
    const bb = await body.boundingBox();
    expect(bb).not.toBeNull();
    expect(bb!.height).toBeGreaterThan(0);
  });

  test('TC-FR-SEO — JSON-LD (Person + WebSite) and OG tags present', async ({ page }) => {
    const ld = page.locator('script[type="application/ld+json"]');
    expect(await ld.count()).toBeGreaterThanOrEqual(1);
    const blob = (await ld.allTextContents()).join(' ');
    expect(blob).toContain('Person');
    expect(blob).toContain('WebSite');
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  });

  // D-6 fixed: fixed-min auto-fit grids wrapped with minmax(min(Npx, 100%), 1fr) so columns
  // never force-min beyond the viewport. 320px is now a first-class assertion (no fixme).
  for (const width of [320, 375, 768, 1280, 2560]) {
    test(`TC-FR-RESP — no horizontal scroll at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, `horizontal overflow at ${width}px`).toBeLessThanOrEqual(1);
    });
  }
});
