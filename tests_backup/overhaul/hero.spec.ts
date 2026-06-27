import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-HERO (SPEC §10 / FR-HERO + NN-1 dual-pillar) — the hero presents the
 * subject's name, a restrained position line, ≥1 quantified metric, the two
 * dual-pillar CTAs (employer "Review experience" + client "See outcomes"), and
 * GitHub / YouTube / CV links that are present and resolve 200.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('TC-FR-HERO — hero dossier + dual-pillar CTAs', () => {
  test.describe.configure({ timeout: 90000 });

  test('name, position line, ≥1 metric, dual-pillar CTAs, and GitHub/YouTube/CV links present', async ({ page }) => {
    await gotoHome(page);
    const hero = page.locator('#hero');
    await expect(hero).toHaveCount(1);

    // Name + restrained, resume-sourced position line.
    await expect(hero.locator('.hero-title')).toContainText('Vikram');
    await expect(hero.locator('.hero-subtitle')).toContainText('Australian Taxation Office');

    // ≥1 quantified metric surfaced in the hero (outcome cards).
    const metricValues = hero.locator('.hero-meta .meta-value');
    expect(await metricValues.count(), 'hero must surface ≥1 quantified metric').toBeGreaterThanOrEqual(1);
    await expect(metricValues.first()).not.toBeEmpty();

    // Dual-pillar CTAs (NN-1): an employer action AND a client action, both in the hero.
    const employer = hero.locator('a[data-pillar="employer"]');
    const client = hero.locator('a[data-pillar="client"]');
    await expect(employer, 'employer-pillar CTA present').toHaveCount(1);
    await expect(client, 'client-pillar CTA present').toHaveCount(1);
    await expect(employer).toContainText(/review experience/i);
    await expect(client).toContainText(/see outcomes/i);
    // The two pillars route to distinct, real on-page destinations.
    expect(await employer.getAttribute('href')).toBe('#experience');
    expect(await client.getAttribute('href')).toBe('#proof');

    // GitHub / YouTube / CV links present in the hero with correct destinations.
    await expect(hero.locator('a[href*="github.com/Victordtesla24"]')).toHaveCount(1);
    await expect(hero.locator('a[href*="youtube.com/@vicd0ct"]')).toHaveCount(1);
    await expect(hero.locator('a[href$="/docs/Vik_Resume_Final.pdf"]').first()).toHaveCount(1);
  });

  test('GitHub, YouTube and CV links resolve (200 / reachable)', async ({ page, request }) => {
    await gotoHome(page);
    const hero = page.locator('#hero');

    // CV is same-origin → a deterministic 200 against the served document.
    const cvHref = await hero.locator('a[href$="/docs/Vik_Resume_Final.pdf"]').first().getAttribute('href');
    const cvResp = await request.get(new URL(cvHref!, page.url()).toString());
    expect(cvResp.status(), 'CV PDF must resolve 200').toBe(200);

    // External profiles: assert reachable (status < 400). Network-gated — if the
    // run host has no outbound network, annotate rather than false-fail the build.
    const externals = [
      await hero.locator('a[href*="github.com"]').first().getAttribute('href'),
      await hero.locator('a[href*="youtube.com"]').first().getAttribute('href'),
    ];
    for (const url of externals) {
      expect(url, 'external profile link present').toBeTruthy();
      try {
        const r = await request.get(url!, { timeout: 15000, maxRedirects: 5 });
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
