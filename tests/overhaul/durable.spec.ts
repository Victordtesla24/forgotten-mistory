import { test, expect, type Page } from '@playwright/test';
import { ensureStaticBuild, startStaticServer, type StaticServer } from './helpers/staticServer';

/**
 * TC-NFR-DURABLE (SPEC §3.5 / §9 NFR-DURABLE / §10) — prompt §2 NN-2: the site must
 * deliver an immediate, memorable takeaway that survives disconnecting from the internet.
 *
 * Exercised against the PRODUCTION static export (`out/`) served over the shared gzip
 * static server (mirrors Firebase Hosting; 127.0.0.1 is a secure context so the service
 * worker registers without TLS). Flow: load online → wait for the SW to activate and take
 * control → go offline → reload → assert the core dossier (identity, key sections, CV link)
 * still renders from cache and the CV PDF is reachable offline, and that the reloaded page
 * is the real document, not the browser's offline-error page.
 *
 * RED before the SW lands: with no `public/sw.js` and no registration, the SW never takes
 * control and the offline reload falls back to the browser error page.
 */

const SW_CONTROL_TIMEOUT = 30000;

/**
 * Resolve once the service worker has activated AND taken control of this client.
 *
 * `navigator.serviceWorker.controller` is non-null only after the worker activates and
 * `clients.claim()` adopts this page — and activation only runs after `install` (and its
 * `event.waitUntil(cache.addAll(...))` precache) has fully completed. So a non-null
 * controller is a strong, synchronous signal that precache is settled. A synchronous
 * predicate is used deliberately: `waitForFunction` with a numeric `polling` interval does
 * not await an async predicate (it would treat the returned Promise as truthy and resolve
 * immediately), which would race the offline cut.
 */
async function waitForServiceWorkerControl(page: Page): Promise<void> {
  await page.waitForFunction(
    () => 'serviceWorker' in navigator && navigator.serviceWorker.controller !== null,
    undefined,
    { timeout: SW_CONTROL_TIMEOUT, polling: 250 },
  );
  // Brief settle for any runtime cache writes triggered during the controlled load.
  await page.waitForTimeout(400);
}

test.describe('TC-NFR-DURABLE — offline-after-visit reload (NN-2)', () => {
  test.describe.configure({ timeout: 240000 });

  let srv: StaticServer;

  test.beforeAll(async () => {
    ensureStaticBuild();
    srv = await startStaticServer();
  });

  test.afterAll(async () => {
    if (srv) await srv.close();
  });

  test('core content + key sections render after an offline reload', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${srv.origin}/`, { waitUntil: 'load' });
      await waitForServiceWorkerControl(page);

      await ctx.setOffline(true);
      const resp = await page.reload({ waitUntil: 'domcontentloaded' });

      // The reload must be served (from the SW cache), not net::ERR_INTERNET_DISCONNECTED.
      expect(resp, 'offline reload returned no response (browser offline-error page)').not.toBeNull();

      // Identity + the three core dossier sections survive offline (present in the DOM).
      await expect(page.locator('body')).toContainText('Vikram');
      await expect(page.locator('#about')).toHaveCount(1);
      await expect(page.locator('#experience')).toHaveCount(1);
      await expect(page.locator('#proof')).toHaveCount(1);

      // The CV dossier link is present and points at the resume PDF.
      const cvLink = page.locator('a[href*="Vik_Resume_Final.pdf"]');
      await expect(cvLink.first()).toHaveCount(1);
      const href = await cvLink.first().getAttribute('href');
      expect(href).toContain('/docs/Vik_Resume_Final.pdf');
    } finally {
      await ctx.setOffline(false);
      await ctx.close();
    }
  });

  test('CV dossier is reachable offline and the page is not the browser offline-error page', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await ctx.newPage();
    try {
      await page.goto(`${srv.origin}/`, { waitUntil: 'load' });
      await waitForServiceWorkerControl(page);

      await ctx.setOffline(true);
      await page.reload({ waitUntil: 'domcontentloaded' });

      // (g) The CV PDF replays from the SW cache with a 200/ok while offline.
      const pdf = await page.evaluate(async () => {
        try {
          const r = await fetch('/docs/Vik_Resume_Final.pdf', { cache: 'no-store' });
          return { ok: r.ok, status: r.status, type: r.headers.get('content-type') };
        } catch (e) {
          return { ok: false, status: 0, type: null, error: String(e) };
        }
      });
      expect(pdf.ok, `CV PDF not served offline: ${JSON.stringify(pdf)}`).toBe(true);
      expect(pdf.status).toBe(200);

      // (h) Real document, not the browser offline-error page: the cached title is the
      // site's own metadata title (which includes the subject's name).
      await expect(page).toHaveTitle(/Vikram/);
    } finally {
      await ctx.setOffline(false);
      await ctx.close();
    }
  });
});
