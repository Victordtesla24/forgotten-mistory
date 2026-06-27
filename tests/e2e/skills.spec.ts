import { test, expect, type Page } from '@playwright/test';

/**
 * Category 1: E2E — Skills Section
 * Verifies skills section renders all skill groups from siteContent.ts.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.locator('#skills').scrollIntoViewIfNeeded();
}

test.describe('E2E: Skills Section', () => {
  test.describe.configure({ timeout: 60000 });

  test('TC-SKILLS-01: Skills section renders with ID and title', async ({ page }) => {
    await gotoHome(page);
    const section = page.locator('#skills');
    await expect(section).toBeVisible();
    await expect(section).toContainText('Skills');
    await expect(section).toContainText('Certifications');
  });

  test('TC-SKILLS-02: All 5 skill groups render', async ({ page }) => {
    await gotoHome(page);
    const groups = [
      'AI/ML Solutions',
      'Cloud-Native',
      'Program Delivery',
      'Credentials',
      'Formal Education',
    ];
    for (const g of groups) {
      await expect(page.locator('#skills')).toContainText(g);
    }
  });

  test('TC-SKILLS-03: Skill group kickers render', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#skills')).toContainText('AI/ML & Data');
    await expect(page.locator('#skills')).toContainText('Engineering');
    await expect(page.locator('#skills')).toContainText('Leadership');
    await expect(page.locator('#skills')).toContainText('Certifications');
    await expect(page.locator('#skills')).toContainText('Education');
  });

  test('TC-SKILLS-04: Skill cards are expandable', async ({ page }) => {
    await gotoHome(page);
    const skillCards = page.locator('#skills .skill-card');
    const count = await skillCards.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // Expand the first skill card
    const header = skillCards.first().locator('.skill-header');
    await header.click();
    await expect(skillCards.first()).toHaveClass(/open/);
    const body = skillCards.first().locator('.skill-body');
    await expect(body).toBeVisible();
  });

  test('TC-SKILLS-05: Skill icons render for each group', async ({ page }) => {
    await gotoHome(page);
    const icons = page.locator('#skills .skill-icon');
    const count = await icons.count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('TC-SKILLS-06: Certifications include CSM', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#skills')).toContainText('Certified Scrum Master (CSM)');
  });

  test('TC-SKILLS-07: Education shows Monash University', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#skills')).toContainText('Monash University');
    await expect(page.locator('#skills')).toContainText('University of Melbourne');
  });
});
