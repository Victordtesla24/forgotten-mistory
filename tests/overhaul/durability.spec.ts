import { test, expect, type Page } from '@playwright/test';

/**
 * SPEC §10 TC-NFR-DURABLE — after one visit the site still works with the
 * network gone, and the CV is still downloadable.
 *
 * `components/site/ServiceWorkerRegister.tsx` survived the rebuild untouched
 * and still mounts from `app/layout.tsx`, so this file's subject is intact.
 * Two things about it changed, and both are improvements:
 *
 *   1. TC-DURABLE-05 is no longer skipped. It used to gate itself on a
 *      `TEST_BASE_URL`/`CI` heuristic and therefore never ran locally, which
 *      meant the one test that actually proved offline durability proved it
 *      almost never. These runs go against the production static export in
 *      `out/`, `NODE_ENV` is `production` there, so the worker registers,
 *      activates and takes control exactly as it does on the deployed site —
 *      and the offline reload can simply be performed and asserted.
 *   2. TC-DURABLE-04 and TC-DURABLE-06 lost their subjects: the `#contact`
 *      section and the `Dossier` component were both deleted. What they were
 *      protecting is unchanged and still worth protecting — the CV must be
 *      reachable from more than one place, so that losing one of them does not
 *      make the site's single most important download disappear — so they are
 *      re-pointed at the two places that carry it now: the persistent nav bar
 *      and the hero's secondary action.
 */

async function loadAndCache(page: Page) {
  await page.goto('/', { waitUntil: 'load' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/** Waits until the worker has installed, activated and taken control of the page. */
async function waitForServiceWorker(page: Page) {
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 30000 });
  // The precache runs during `install`; give it a moment to finish writing
  // before the network is taken away underneath it.
  await page.waitForTimeout(2000);
}

test.describe('TC-NFR-DURABLE: Offline Durability', () => {
  test.describe.configure({ timeout: 120000 });

  test('TC-DURABLE-01: The service worker registers, activates and controls the page', async ({ page }) => {
    await loadAndCache(page);
    await waitForServiceWorker(page);

    const state = await page.evaluate(async () => {
      const regs = await navigator.serviceWorker.getRegistrations();
      return {
        registrations: regs.length,
        active: regs.map((r) => r.active?.state ?? 'none'),
        controlled: !!navigator.serviceWorker.controller,
      };
    });
    expect(state.registrations).toBeGreaterThanOrEqual(1);
    expect(state.active).toContain('activated');
    expect(state.controlled).toBe(true);

    // The toast region is always in the DOM so "Ready to work offline" and
    // "Update available" are announced in place, without a layout shift.
    const toast = page.locator('[data-sw-toast]');
    await expect(toast).toHaveCount(1);
    await expect(toast).toHaveAttribute('aria-live', 'polite');
    await expect(toast).toHaveAttribute('role', 'status');
  });

  test('TC-DURABLE-02: Core hero content renders on first visit', async ({ page }) => {
    await loadAndCache(page);
    await expect(page.locator('#hero')).toBeVisible();
    await expect(page.locator('#hero')).toContainText('Vikram');
  });

  test('TC-DURABLE-03: CV download link is present in the hero and resolves', async ({ page }) => {
    await loadAndCache(page);

    const cvLink = page.locator('#hero a[href*="Vik_Resume_Final.pdf"]');
    await expect(cvLink).toBeVisible();
    await expect(cvLink).toHaveAttribute('download', '');

    const response = await page.request.get('/docs/Vik_Resume_Final.pdf');
    expect(response.status()).toBe(200);
  });

  test('TC-DURABLE-04: CV is reachable from the persistent navigation, on every screen', async ({ page }) => {
    await loadAndCache(page);
    // D-CV-01: the nav bar's Download CV is visible without opening the menu,
    // which is what makes the CV reachable from anywhere on the page — the role
    // the deleted `#contact` section's CV button used to play at the bottom.
    const navCv = page.locator('.nav-cv');
    await expect(navCv).toBeVisible();
    await expect(navCv).toHaveAttribute('href', '/docs/Vik_Resume_Final.pdf');

    await page.locator('#listen').scrollIntoViewIfNeeded();
    await expect(navCv).toBeVisible();
  });

  test('TC-DURABLE-05: Offline reload still renders the page and still serves the CV', async ({ page }) => {
    await loadAndCache(page);
    await waitForServiceWorker(page);

    await page.context().setOffline(true);
    try {
      const response = await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
      expect(response?.status()).toBe(200);

      // The page comes back from the precache, not from a browser error page.
      const hero = page.locator('#hero');
      await expect(hero).toBeVisible();
      await expect(hero).toContainText('Vikram');

      const bodyText = await page.locator('body').innerText();
      expect(bodyText).not.toContain('ERR_INTERNET_DISCONNECTED');
      expect(bodyText).not.toContain('No internet');

      // And the CV — the one artefact a recruiter came for — is cached too.
      // A site that renders offline but cannot hand over the PDF has kept the
      // decoration and lost the point.
      const pdfStatus = await page.evaluate(async () => {
        try {
          const r = await fetch('/docs/Vik_Resume_Final.pdf');
          return r.status;
        } catch (error) {
          return `fetch failed: ${(error as Error).message}`;
        }
      });
      expect(pdfStatus).toBe(200);
    } finally {
      await page.context().setOffline(false);
    }
  });

  test('TC-DURABLE-06: The CV is offered from more than one place on the page', async ({ page }) => {
    await loadAndCache(page);

    // Two independent entry points minimum — the nav bar and the hero. This was
    // the Dossier's job before the rebuild deleted it; the requirement that the
    // download never depend on a single component is unchanged.
    const links = page.locator('a[href*="Vik_Resume_Final.pdf"]');
    expect(await links.count()).toBeGreaterThanOrEqual(2);
    await expect(page.locator('.nav-cv')).toHaveCount(1);
    await expect(page.locator('#hero a[href*="Vik_Resume_Final.pdf"]')).toHaveCount(1);
  });

  test('TC-DURABLE-07: No first-party request fails on a warm load', async ({ page }) => {
    const failedRequests: string[] = [];
    page.on('requestfailed', (request) => failedRequests.push(request.url()));

    await loadAndCache(page);
    await page.goto('/', { waitUntil: 'load' });
    await page.waitForTimeout(1000);

    // Third-party failures (fonts, analytics that are not installed) are not
    // this site's problem; a broken first-party asset is.
    const localFailures = failedRequests.filter(
      (url) =>
        url.includes('localhost') || url.includes('forgotten-mistory') || url.includes('_next'),
    );

    expect(localFailures, `failed first-party requests:\n${localFailures.join('\n')}`).toHaveLength(0);
  });
});
