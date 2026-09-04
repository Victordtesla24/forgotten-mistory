import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * GitHub feed — honest, silent degradation when the shared GitHub API budget is spent.
 *
 * Live regression (2026-08-09): every production page load fired two
 * unauthenticated api.github.com repository requests and both answered
 * 403 "API rate limit exceeded" — two console errors on every visit, because the
 * 60 req/hr limit is per IP and therefore shared with every other visitor behind
 * it. A browser-side credential is not an option (it would be readable by every
 * visitor), so the feed must instead:
 *   - never spend a request it knows will be rejected (zero 4xx),
 *   - issue at most ONE repository request when it does have budget,
 *   - fall back to the dated snapshot committed in lib/githubTelemetry.ts, never
 *     to an error and never to invented repo names or star counts.
 */

const GITHUB_GLOB = 'https://api.github.com/**';
const RATE_LIMIT_RE = /api\.github\.com\/rate_limit/;
const REPOS_RE = /api\.github\.com\/users\/Victordtesla24\/repos/;

/** Repo names + star counts committed as the offline snapshot. */
function committedSnapshot(): Array<{ name: string; stars: number }> {
  const src = readFileSync(resolve(process.cwd(), 'lib/githubTelemetry.ts'), 'utf8');
  const block = src.split('const SNAPSHOT: readonly RepoStat[] = [')[1]?.split('\n];')[0];
  expect(block, 'SNAPSHOT array must exist in lib/githubTelemetry.ts').toBeTruthy();
  const entries: Array<{ name: string; stars: number }> = [];
  const re = /name: "([^"]+)",[\s\S]*?stars: (\d+),/g;
  let match = re.exec(block!);
  while (match) {
    entries.push({ name: match[1]!, stars: Number(match[2]) });
    match = re.exec(block!);
  }
  expect(entries.length, 'snapshot must hold real repositories').toBeGreaterThan(0);
  return entries;
}

function rateLimitBody(remaining: number) {
  return JSON.stringify({
    resources: {
      core: { limit: 60, remaining, reset: Math.floor(Date.now() / 1000) + 3600, used: 60 - remaining },
    },
  });
}

async function gotoFeed(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.locator('#work').scrollIntoViewIfNeeded();
  const feed = page.locator('#github-projects');
  await expect(feed).not.toHaveAttribute('data-github-source', 'loading', { timeout: 20000 });
  return feed;
}

test.describe('E2E: GitHub feed rate-limit degradation', () => {
  test.describe.configure({ timeout: 60000 });

  test('TC-GHFEED-01: exhausted budget renders the dated snapshot and spends zero requests', async ({
    page,
  }) => {
    const requested: string[] = [];
    const failedStatuses: number[] = [];
    await page.route(GITHUB_GLOB, async (route) => {
      const url = route.request().url();
      requested.push(url);
      if (RATE_LIMIT_RE.test(url)) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: rateLimitBody(0) });
        return;
      }
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'API rate limit exceeded' }),
      });
    });
    page.on('response', (res) => {
      if (res.url().includes('api.github.com') && res.status() >= 400) failedStatuses.push(res.status());
    });

    const feed = await gotoFeed(page);

    // The rate-limit probe is free and always answers 200; because it reported an
    // empty budget the repository call is never made, so nothing 4xx's.
    expect(requested.filter((u) => REPOS_RE.test(u))).toHaveLength(0);
    expect(failedStatuses).toEqual([]);

    await expect(feed).toHaveAttribute('data-github-source', 'snapshot');
    const label = feed.locator('[data-feed-label]');
    await expect(label).toHaveText(/^Snapshot · GitHub public repos, as of /);
    await expect(label).not.toHaveText(/live/i);
    await expect(feed.locator('.repo-card').first()).toBeVisible();
  });

  test('TC-GHFEED-02: a 403 on every endpoint degrades without throwing', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.route(GITHUB_GLOB, (route) =>
      route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'API rate limit exceeded for 203.0.113.9.' }),
      }),
    );

    const feed = await gotoFeed(page);

    await expect(feed).toHaveAttribute('data-github-source', 'snapshot');
    await expect(feed.locator('.repo-card').first()).toBeVisible();
    // No retry/error surface: the visitor gets real repositories, not a dead end.
    await expect(feed.locator('[data-feed-label]')).toHaveText(/^Snapshot · /);
    expect(pageErrors, `unhandled page error(s): ${pageErrors.join(' | ')}`).toEqual([]);
  });

  test('TC-GHFEED-03: the fallback shows only committed repositories, never invented ones', async ({
    page,
  }) => {
    await page.route(GITHUB_GLOB, (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: rateLimitBody(0) }),
    );

    const feed = await gotoFeed(page);
    const snapshot = committedSnapshot();
    const byName = new Map(snapshot.map((r) => [r.name, r.stars]));

    const cards = feed.locator('.repo-card');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < count; i += 1) {
      const card = cards.nth(i);
      const name = (await card.locator('h3').innerText()).trim();
      expect(byName.has(name), `"${name}" is not in the committed snapshot`).toBe(true);
      const starText = (await card.locator('[data-star-count]').innerText()).replace(/\D+/g, '');
      expect(Number(starText), `star count for ${name}`).toBe(byName.get(name));
      await expect(card).toHaveAttribute(
        'href',
        new RegExp(`^https://github\\.com/Victordtesla24/${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
      );
    }
  });

  test('TC-GHFEED-04: with budget available it makes exactly one repository request', async ({
    page,
  }) => {
    const repoRequests: string[] = [];
    await page.route(GITHUB_GLOB, async (route) => {
      const url = route.request().url();
      if (RATE_LIMIT_RE.test(url)) {
        await route.fulfill({ status: 200, contentType: 'application/json', body: rateLimitBody(58) });
        return;
      }
      repoRequests.push(url);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            name: 'telemetry-server',
            html_url: 'https://github.com/Victordtesla24/telemetry-server',
            description: 'Telemetry ingestion service.',
            language: 'Go',
            stargazers_count: 7,
            open_issues_count: 2,
            forks_count: 1,
            pushed_at: '2026-08-01T00:00:00Z',
          },
        ]),
      });
    });

    const feed = await gotoFeed(page);

    expect(repoRequests).toHaveLength(1);
    await expect(feed).toHaveAttribute('data-github-source', 'live');
    await expect(feed.locator('[data-feed-label]')).toHaveText(/^Live · /);
    // Rendered values equal the response verbatim — no derived or padded numbers.
    const card = feed.locator('.repo-card').first();
    await expect(card.locator('h3')).toHaveText('telemetry-server');
    await expect(card.locator('[data-star-count]')).toHaveText(/7$/);
  });
});
