import { test, expect, type Page } from '@playwright/test';

/**
 * P95 — deploy skew, and the scene-local boundary that contains it.
 *
 * Monitor 10:09Z on build c5d808c3 (evidence
 * docs/delivery/evidence/v10-20260905T0515Z/P95-deploy-skew/01-incident.md):
 *
 *   pageerrors: "Loading chunk 427.8222755a6b18eedc.js failed."
 *               "Loading chunk 743.9672a1f959c17edf.js failed."
 *   canvasesAfterExperience: 0
 *
 * Firebase Hosting serves exactly one version of a site. The document is the only file
 * that names this build's hashed chunks, so a page held open across a deploy asks for
 * filenames the next version has deleted, and every one of them 404s. `.github/workflows/
 * deploy.yml` runs every ten minutes, so this is what an engaged reader hits, not an edge
 * case: the lazily-imported WebGL bundle (`components/gl/GLCanvas` → three + R3F) is
 * requested on scroll, which is exactly when it is most likely to be gone.
 *
 * Two failures are simulated here, and neither may take the page down:
 *
 *   TC-SKEW-01  the scene's chunk 404s (the deploy already happened). The import retries,
 *               then reloads once per session to pick up the current document; if it has
 *               already reloaded, it renders the static fallback and says so once. The six
 *               sections survive and `app/error.tsx` is never reached.
 *   TC-SKEW-02  the scene's chunk loads and the *renderer* throws (WebGL context creation
 *               fails mid-mount). The scene-local error boundary keeps the fault inside the
 *               slot: six sections, one console error naming the scene, no canvas.
 *
 * Service workers are blocked for this file on purpose. In production the worker's
 * precache is the FIRST line of defence and would answer the 404 from its own cache —
 * that half is asserted by `tests/sw_strategy.test.mjs` and the cutover simulation. What
 * these tests exercise is the second line: what the application does when the bytes are
 * genuinely unavailable. Leaving the worker in would let it satisfy the request and the
 * spec would pass without ever running the code it is here to protect.
 */

test.use({ serviceWorkers: 'block' });

/** Every section on the page, in page order. */
const ALL_SECTIONS = ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen'] as const;

/**
 * The lazy webpack chunks. Next.js names eagerly-loaded chunks `<id>-<hash>.js` (dash) and
 * dynamically-imported ones `<id>.<hash>.js` (dot) — the incident's `427.8222755a…js` and
 * `743.9672a1f…js` are both of the second kind, and so is the GLCanvas bundle.
 */
const LAZY_CHUNK = /\/_next\/static\/chunks\/\d+\.[^/]+\.js(\?.*)?$/;

/** The copy `app/error.tsx` renders. Seeing any of it means the page shell was replaced. */
const ERROR_SHELL = /Something went wrong|SYSTEM INTERRUPT|System interrupt/;

async function waitForPageReady(page: Page) {
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

/** Console errors the site itself emitted from a scene, excluding browser network noise. */
function collectSceneErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && message.text().includes('[Scene')) errors.push(message.text());
  });
  return errors;
}

test.describe('TC-SKEW: a scene that cannot load never takes the page with it', () => {
  test.describe.configure({ timeout: 150000 });

  test('TC-SKEW-01: a lazy scene chunk that 404s reloads once, then falls back silently', async ({ page }) => {
    const sceneErrors = collectSceneErrors(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));

    // The deploy has already replaced this build's chunks: every request for one is a 404,
    // exactly as Firebase Hosting answers for a version it no longer serves.
    let blocked = 0;
    await page.route(LAZY_CHUNK, async (route) => {
      blocked += 1;
      await route.fulfill({ status: 404, contentType: 'text/plain', body: 'Not Found' });
    });

    await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);

    // First failure → retry after 800 ms → second failure → one reload for the session.
    await page
      .waitForFunction(() => window.sessionStorage.getItem('fm-chunk-reload') === '1', null, { timeout: 40000 })
      .catch(() => {});
    await waitForPageReady(page);

    for (const section of ALL_SECTIONS) {
      await page.locator(section).scrollIntoViewIfNeeded();
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(2500);

    expect(blocked, 'the 404 route never fired — the scene chunk pattern no longer matches').toBeGreaterThan(0);
    expect(
      await page.evaluate(() => window.sessionStorage.getItem('fm-chunk-reload')),
      'a missing chunk must set the one-reload-per-session guard',
    ).toBe('1');

    const sections = await page.locator('section[id]').count();
    expect(sections, 'a failed scene chunk must leave all six sections standing').toBe(6);
    for (const section of ALL_SECTIONS) {
      await expect(page.locator(section), `${section} disappeared with the scene`).toHaveCount(1);
    }
    await expect(page.locator('#hero h1')).toContainText('Vikram Deshpande');

    const body = (await page.locator('body').innerText()) || '';
    expect(body, 'the page fell through to app/error.tsx').not.toMatch(ERROR_SHELL);
    expect(pageErrors, `an uncaught page error escaped: ${pageErrors.join(' | ')}`).toHaveLength(0);
    expect(sceneErrors, `expected exactly one scene report, got: ${sceneErrors.join(' | ')}`).toHaveLength(1);
    expect(sceneErrors[0]).toMatch(/chunk/i);

    // Restore the route — the reader now reloads onto the current build — and the scene
    // that had nothing to load mounts normally.
    await page.unroute(LAZY_CHUNK);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    await page.locator('#experience').scrollIntoViewIfNeeded();
    await page.waitForTimeout(3000);

    const canvases = await page.locator('canvas').count();
    expect(canvases, 'once the chunk is served again the scene must mount').toBeGreaterThan(0);
  });

  test('TC-SKEW-02: a renderer that throws stays inside its own slot', async ({ page }) => {
    const sceneErrors = collectSceneErrors(page);
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));

    // `useGLCapability`'s probe calls getContext('webgl2') with no attributes; three's
    // WebGLRenderer calls it WITH an attributes object. Throwing only for the second lets
    // the scene clear every gate and then fail where a real driver failure would — inside
    // the mounted canvas, after the boundary is the only thing between it and the document.
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      function patched(this: HTMLCanvasElement, ...args: unknown[]) {
        const [type, attributes] = args as [string, unknown];
        if (typeof type === 'string' && type.startsWith('webgl') && attributes) {
          throw new Error('fm-test: forced WebGL context creation failure');
        }
        return (original as unknown as (...a: unknown[]) => unknown).apply(this, args);
      }
      HTMLCanvasElement.prototype.getContext =
        patched as unknown as typeof HTMLCanvasElement.prototype.getContext;
    });

    await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
    await waitForPageReady(page);
    // Only the hero's scene is within the mount window; the other two stay unmounted, so
    // exactly one boundary can trip.
    await page.waitForTimeout(4000);

    const sections = await page.locator('section[id]').count();
    expect(sections, 'a thrown renderer must leave all six sections standing').toBe(6);
    await expect(page.locator('#hero h1')).toContainText('Vikram Deshpande');

    const body = (await page.locator('body').innerText()) || '';
    expect(body, 'a scene fault replaced the document with the error shell').not.toMatch(ERROR_SHELL);
    expect(pageErrors, `an uncaught page error escaped: ${pageErrors.join(' | ')}`).toHaveLength(0);
    expect(sceneErrors, `expected exactly one scene report, got: ${sceneErrors.join(' | ')}`).toHaveLength(1);
    expect(sceneErrors[0], 'the report must name the scene that failed').toMatch(/\[Scene:[a-z-]+\]/i);

    expect(await page.locator('#hero canvas').count(), 'the failed slot must fall back to empty').toBe(0);
  });
});
