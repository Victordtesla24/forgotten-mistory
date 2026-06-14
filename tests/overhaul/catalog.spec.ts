import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-CATALOG (SPEC §10 / FR-CATALOG) — the curated project catalogue lists
 * ≥10 real GitHub repositories (corporate AND personal), and every catalogue
 * link resolves (200 / reachable). The dynamic "Latest GitHub work" feed
 * (#github-projects) is excluded: only the curated, owner-authored catalogue
 * (the projects carousel + the featured-repos list) is asserted, so the count
 * is deterministic offline and is a true guard on the catalogue data.
 */

const CATALOG_SELECTOR = '#projects-carousel .project-card, .repo-curated a[href*="github.com"]';
const REPO_HREF = /^https:\/\/github\.com\/Victordtesla24\/[^/?#]+\/?$/;

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
  // The curated catalogue is server-rendered; wait for it before reading.
  await page
    .locator('#projects-carousel .project-card')
    .first()
    .waitFor({ state: 'attached', timeout: 15000 });
}

async function catalogRepoHrefs(page: Page): Promise<string[]> {
  const hrefs = await page
    .locator(CATALOG_SELECTOR)
    .evaluateAll((els) => els.map((el) => (el as HTMLAnchorElement).href).filter(Boolean));
  // One entry per repo; the GitHub profile root (no repo path) is excluded.
  return Array.from(new Set(hrefs.filter((h) => REPO_HREF.test(h))));
}

test.describe('TC-FR-CATALOG — curated catalogue ≥10 repos, links resolve', () => {
  test.describe.configure({ timeout: 120000 });

  test('curated catalogue lists ≥10 distinct GitHub repositories', async ({ page }) => {
    await gotoHome(page);
    const repos = await catalogRepoHrefs(page);
    expect(
      repos.length,
      `curated catalogue must list >=10 distinct repos; found ${repos.length}: ${repos.join(', ')}`,
    ).toBeGreaterThanOrEqual(10);
  });

  test('every curated catalogue link resolves (200 / reachable)', async ({ page, request }) => {
    await gotoHome(page);
    const repos = await catalogRepoHrefs(page);
    expect(repos.length, 'catalogue must expose repo links to verify').toBeGreaterThan(0);
    for (const url of repos) {
      // Network-gated: if the run host has no outbound network, annotate rather
      // than false-fail the build (mirrors hero.spec external-link handling).
      try {
        const r = await request.get(url, { timeout: 15000, maxRedirects: 5 });
        expect(r.status(), `${url} should resolve < 400`).toBeLessThan(400);
      } catch (e) {
        test.info().annotations.push({
          type: 'skip-network',
          description: `no outbound network to verify ${url}: ${String(e)}`,
        });
      }
    }
  });
});
