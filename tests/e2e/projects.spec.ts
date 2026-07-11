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

  test('TC-WORK-06: Signature-effects showreel label renders in work section', async ({ page }) => {
    await gotoHome(page);
    // The JARVIS radar HUD was removed from #work (posh-catalogue overhaul) —
    // the section now leads with the showreel label instead.
    await expect(page.locator('#work')).toContainText('Signature effects');
  });

  test('TC-WORK-07: ScrollRail label anchors to work', async ({ page }) => {
    await gotoHome(page);
    const rail = page.locator('#work [data-testid="scroll-rail"]');
    await expect(rail).toBeAttached();
    await expect(rail).toContainText('Work');
  });

  test('TC-WORK-08: Catalogue is keyboard-reachable with progress dots', async ({ page }) => {
    await gotoHome(page);
    const carousel = page.locator('#projects-carousel');
    await expect(carousel).toBeVisible();
    await expect(carousel).toHaveAttribute('role', 'region');
    await expect(carousel).toHaveAttribute('aria-label', 'Project catalogue');

    const cards = page.locator('#projects-carousel .project-card');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(4);

    // First card keeps its real GitHub href (facts preserved).
    const firstHref = await cards.first().getAttribute('href');
    expect(firstHref).toMatch(/^https:\/\/github\.com\//);

    const dots = page.locator('.carousel-progress-dot');
    const dotCount = await dots.count();
    if (dotCount > 0) {
      expect(dotCount).toBe(cardCount);
      await dots.nth(Math.min(1, dotCount - 1)).click();
      await expect(cards.nth(Math.min(1, cardCount - 1))).toHaveAttribute('aria-current', 'true');
    }
  });

  test('TC-WORK-09: Work section lede and featured repo links stay intact', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#work .work-section-lede')).toBeVisible();
    const repo = page.locator('#work .repo-curated a').first();
    await expect(repo).toBeVisible();
    const href = await repo.getAttribute('href');
    expect(href).toMatch(/^https:\/\/github\.com\//);
  });
});
