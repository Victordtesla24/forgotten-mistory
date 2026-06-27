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

// ─── R5: ExperienceAccordion 3D card-flip ──────────────────────────────────

test.describe('TC-FR-EXP-ACCORDION — experience accordion open/close & a11y', () => {
  test.describe.configure({ timeout: 60000 });
  test.beforeEach(async ({ page }) => gotoHome(page));

  test('first role (ATO) starts expanded with aria-expanded true', async ({ page }) => {
    await page.locator('#experience').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const firstItem = page.locator('.accordion-item').first();
    await expect(firstItem).toHaveClass(/active/);

    const firstButton = firstItem.locator('.accordion-header');
    await expect(firstButton).toHaveAttribute('aria-expanded', 'true');
    await expect(firstButton).toContainText('Australian Taxation Office');

    // Content region is present and labelled
    const panel = page.locator('#experience-ato');
    await expect(panel).toHaveAttribute('role', 'region');
    await expect(panel).toBeVisible();
  });

  test('clicking a closed header opens it, aria-expanded toggles, content reachable', async ({ page }) => {
    await page.locator('#experience').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Close ATO first (click open header) so we can test opening a closed one
    const atoHeader = page.locator('#experience').locator('.accordion-header').first();
    await atoHeader.click();
    await page.waitForTimeout(400);

    // Now click ANZ header (third role, should be closed)
    const anzHeader = page.locator('.accordion-item').nth(2).locator('.accordion-header');
    await expect(anzHeader).toHaveAttribute('aria-expanded', 'false');
    await anzHeader.click();
    await page.waitForTimeout(600);

    // After opening, aria-expanded should be true
    await expect(anzHeader).toHaveAttribute('aria-expanded', 'true');

    // Content panel should be visible with role="region"
    const panel = page.locator('#experience-anz');
    await expect(panel).toHaveAttribute('role', 'region');
    await expect(panel).toBeVisible();

    // Content should contain ANZ-specific text from the role's bullets
    await expect(panel).toContainText('ANZ');

    // Body has measurable height
    const bb = await panel.boundingBox();
    expect(bb).not.toBeNull();
    expect(bb!.height).toBeGreaterThan(0);
  });

  test('clicking open header closes it, aria-expanded toggles to false', async ({ page }) => {
    await page.locator('#experience').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    const atoHeader = page.locator('.accordion-item').first().locator('.accordion-header');
    await expect(atoHeader).toHaveAttribute('aria-expanded', 'true');

    await atoHeader.click();
    await page.waitForTimeout(600);

    await expect(atoHeader).toHaveAttribute('aria-expanded', 'false');
    // Content panel should be removed from DOM (AnimatePresence exit)
    const panel = page.locator('#experience-ato');
    await expect(panel).not.toBeAttached();
  });
});

test.describe('TC-FR-EXP-WEBGL — card-flip WebGL overlay with zero errors', () => {
  test.describe.configure({ timeout: 60000 });
  test.beforeEach(async ({ page }) => gotoHome(page));

  test('card-flip overlay renders canvas when accordion opens, no WebGL errors', async ({ page }) => {
    const glErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (/webgl|three\.?|gl_|shader|context lost|invalid_|program/i.test(t)) glErrors.push(t);
      }
    });
    page.on('pageerror', (err) => glErrors.push(String(err)));

    await page.locator('#experience').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // First accordion item (ATO) is already open, so the card-flip overlay
    // should already have been mounted with its canvas.
    const firstItem = page.locator('.accordion-item').first();
    const overlay = firstItem.locator('[data-card-flip]');
    expect(await overlay.count()).toBeGreaterThanOrEqual(1);
    await expect(overlay).toHaveAttribute('aria-hidden', 'true');

    // Canvas should be present inside the overlay
    const canvas = overlay.locator('canvas');
    expect(await canvas.count()).toBeGreaterThanOrEqual(1);

    // Close and reopen to exercise the flip lifecycle
    const atoHeader = firstItem.locator('.accordion-header');
    await atoHeader.click();
    await page.waitForTimeout(600);
    await atoHeader.click();
    await page.waitForTimeout(800);

    // Overlay should re-appear after re-opening
    const reopenedOverlay = firstItem.locator('[data-card-flip]');
    expect(await reopenedOverlay.count()).toBeGreaterThanOrEqual(1);

    // No WebGL/Three console errors during the flip lifecycle
    expect(glErrors, `WebGL/Three console errors:\n${glErrors.join('\n')}`).toEqual([]);
  });
});

test.describe('TC-FR-EXP-REDUCED-MOTION — static render, no flip, instant expand', () => {
  test.describe.configure({ timeout: 60000 });

  test('with reduced-motion the accordion opens without card-flip overlay', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);

    await page.locator('#experience').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // First item should still be open with aria-expanded
    const firstItem = page.locator('.accordion-item').first();
    await expect(firstItem).toHaveClass(/active/);
    const firstButton = firstItem.locator('.accordion-header');
    await expect(firstButton).toHaveAttribute('aria-expanded', 'true');

    // Card-flip overlay should NOT be present when reduced-motion is active
    const overlay = firstItem.locator('[data-card-flip]');
    await expect(overlay).toHaveCount(0);

    // Content is still reachable
    const panel = page.locator('#experience-ato');
    await expect(panel).toHaveAttribute('role', 'region');
    await expect(panel).toBeVisible();

    // Close and re-open — still no overlay
    await firstButton.click();
    await page.waitForTimeout(400);
    await firstButton.click();
    await page.waitForTimeout(400);

    await expect(firstItem.locator('[data-card-flip]')).toHaveCount(0);

    // Content should be immediately visible (no animation delay needed)
    await expect(page.locator('#experience-ato')).toBeVisible();
  });
});
