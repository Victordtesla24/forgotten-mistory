import { test, expect, type Page } from '@playwright/test';

/**
 * Category 1: E2E — Projects (Work) Section
 * Verifies projects render with all data from siteContent.ts.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.locator('#work').scrollIntoViewIfNeeded();
}

test.describe('E2E: Projects / Work Section', () => {
  test.describe.configure({ timeout: 60000 });

  test('TC-WORK-01: Work section renders with ID and title', async ({ page }) => {
    await gotoHome(page);
    const section = page.locator('#work');
    await expect(section).toBeVisible();
    await expect(section).toContainText('Current Projects in the Pipeline');
  });

  test('TC-WORK-02: ProjectsCarousel renders all 4 project cards', async ({ page }) => {
    await gotoHome(page);
    const projects = [
      'EFDDH Jira Analytics',
      'AI Resume Tailor',
      'Relationship Timeline',
      'AI Gmail Manager',
    ];
    for (const p of projects) {
      await expect(page.locator('#work')).toContainText(p);
    }
  });

  test('TC-WORK-03: Featured repos render in the work section', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#work')).toContainText('Featured repos');
    await expect(page.locator('#work')).toContainText('btr-demo');
    await expect(page.locator('#work')).toContainText('jyotish-shastra');
  });

  test('TC-WORK-04: GitHub Feed section renders', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#work')).toContainText('Latest GitHub work');
  });

  test('TC-WORK-05: YouTube feed renders with iframe', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#work')).toContainText('YouTube stream');
    const iframe = page.locator('#work iframe[src*="youtube"]');
    await expect(iframe).toBeAttached();
  });

  test('TC-WORK-06: HudFrame renders in work section', async ({ page }) => {
    await gotoHome(page);
    // The HUD frame labeled "JARVIS · real-time telemetry"
    await expect(page.locator('#work')).toContainText('JARVIS');
    await expect(page.locator('#work')).toContainText('telemetry');
  });
});
