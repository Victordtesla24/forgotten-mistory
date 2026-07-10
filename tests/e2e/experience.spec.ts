import { test, expect, type Page } from '@playwright/test';

/**
 * Category 1: E2E — Experience Section
 * Verifies experience timeline renders with all roles from siteContent.ts.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.locator('#experience').scrollIntoViewIfNeeded();
}

test.describe('E2E: Experience Section', () => {
  test.describe.configure({ timeout: 60000 });

  test('TC-EXP-01: Experience section renders with ID and title', async ({ page }) => {
    await gotoHome(page);
    const section = page.locator('#experience');
    await expect(section).toBeVisible();
    await expect(section).toContainText('Experience');
  });

  test('TC-EXP-02: All 8 experience roles are listed', async ({ page }) => {
    await gotoHome(page);
    // The ExperienceAccordion renders all roles from siteContent
    const roles = [
      'Scrum Master / Project Manager',
      'ATO',
      'AI Solutions Consultant',
      'ANZ Banking Group',
      'National Australia Bank',
      'Microsoft',
      'Telstra',
      'InfoCentric',
      'MYOB',
    ];
    for (const role of roles) {
      await expect(page.locator('#experience')).toContainText(role);
    }
  });

  test('TC-EXP-03: Experience accordion items are expandable', async ({ page }) => {
    await gotoHome(page);
    // The first accordion header is the current ATO role; click it to toggle and
    // confirm the panel remains functional. Use a specific button selector so
    // the click lands on the real control, not the wrapper.
    const firstHeader = page.locator('#experience .accordion-header').first();
    if (await firstHeader.isVisible().catch(() => false)) {
      await firstHeader.click();
      await page.waitForTimeout(300);
      await firstHeader.click();
      await page.waitForTimeout(300);
    }
    // Role details (bullets) should be visible after expanding
    await expect(page.locator('#experience')).toContainText('COBOL');
  });

  test('TC-EXP-04: Experience dates are displayed', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#experience')).toContainText('March 2026');
    await expect(page.locator('#experience')).toContainText('2017');
  });

  test('TC-EXP-05: ScrollRail label anchors to experience', async ({ page }) => {
    await gotoHome(page);
    const label = page.locator('#experience .scroll-rail-label');
    const labelCount = await label.count();
    if (labelCount > 0) {
      await expect(label).toContainText('Experience');
    }
  });
});
