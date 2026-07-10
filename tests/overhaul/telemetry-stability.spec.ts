import { test, expect, type Page } from '@playwright/test';

/**
 * REGRESSION — Telemetry render stability (prod outage 2026-07-09).
 *
 * A `useSyncExternalStore` in lib/githubTelemetry.ts returned a fresh object
 * from getSnapshot()/getServerSnapshot() on every call. React compares
 * snapshots with Object.is, so a new reference each render meant "store
 * changed" forever → React #185 "Maximum update depth exceeded" → the root
 * error boundary (app/error.tsx) replaced the ENTIRE page with
 * "Something went wrong". Every visitor saw a dead portfolio.
 *
 * A second defect: TeslaDashboard read navigator.connection during a
 * useState initializer, so the server prerendered "—" but the client
 * hydrated to "4G" → React #425 hydration text mismatch.
 *
 * This spec is intentionally strict about TIMING — it waits for hydration
 * and forces the telemetry panel to mount, because the pre-existing
 * TC-RENDER-09 check ran too early to catch the loop. It fails on the buggy
 * build and passes once the snapshot is memoized and device reads are
 * deferred to a post-mount effect.
 */

const FATAL_ERROR_SIGNATURES = [
  'Maximum update depth exceeded',
  'Minified React error #185',
  'getServerSnapshot should be cached',
  'Minified React error #425',
  'Minified React error #422',
  'Text content does not match',
  'Text content did not match',
];

const DUPLICATE_KEY_SIGNATURE = 'Encountered two children with the same key';

async function dismissPreloader(page: Page) {
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
}

async function loadAndSettle(page: Page) {
  await page.goto('/', { waitUntil: 'load' });
  await dismissPreloader(page);
  // Force the telemetry panel to mount + give hydration time to loop if buggy.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(3500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

/** Full-page scroll that mounts lazy VFX (InboxTriage stream, etc.). */
async function loadAndFullScroll(page: Page) {
  await page.goto('/', { waitUntil: 'load' });
  await dismissPreloader(page);

  // Prefer #work (InboxTriage) + telemetry; keep total wall time well under 90s.
  for (const sectionId of ['#hero', '#work', '#contact']) {
    const section = page.locator(sectionId);
    if ((await section.count()) === 0) continue;
    await section.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(600);
  }

  const triage = page.locator('[data-testid="inbox-triage"]');
  if ((await triage.count()) > 0) {
    await triage.first().scrollIntoViewIfNeeded();
    // 12 messages × 160ms ≈ 2s trickle + settle buffer
    await page.waitForTimeout(2800);
  }

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

function assertNoErrorBoundary(bodyText: string) {
  expect(bodyText).not.toContain('Something went wrong');
  expect(bodyText.toLowerCase()).not.toContain('system interrupt');
}

test.describe('TC-TELEMETRY-STABILITY: no infinite render loop / error boundary', () => {
  // Full-scroll cases (TS-05/06) need headroom under a busy :8080 lane.
  test.describe.configure({ timeout: 120000 });

  test('TS-01: no uncaught React exceptions (max-update-depth / hydration)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loadAndSettle(page);

    const fatal = pageErrors.filter((m) =>
      FATAL_ERROR_SIGNATURES.some((sig) => m.includes(sig)),
    );
    expect(fatal, `Uncaught fatal React errors:\n${fatal.join('\n')}`).toHaveLength(0);
  });

  test('TS-02: page shows real content, never the error boundary', async ({ page }) => {
    await loadAndSettle(page);

    const bodyText = await page.locator('body').innerText();
    assertNoErrorBoundary(bodyText);

    // The real app shell must be present.
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('#hero')).toContainText('Vikram');
  });

  test('TS-03: telemetry panel + project telemetry render (not crashed)', async ({ page }) => {
    await loadAndSettle(page);

    // Scroll the telemetry panel into view and assert its content mounted.
    const panel = page.locator('#telemetry-panel');
    await panel.scrollIntoViewIfNeeded();
    await expect(panel).toBeVisible();
    await expect(panel).toContainText('System Status');

    // Both project telemetry cards must render their own content. Scope to the
    // panel — a second TeslaDashboard also renders in the #work gallery.
    await expect(panel.locator('[data-testid="jarvis-telemetry"]')).toBeVisible();
    await expect(panel.locator('[data-testid="tesla-dashboard"]')).toBeVisible();
  });

  test('TS-04: no hydration-mismatch console errors on first paint', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await loadAndSettle(page);

    const hydrationErrors = consoleErrors.filter(
      (t) =>
        t.includes('did not match') ||
        t.includes('hydrat') ||
        t.includes('getServerSnapshot') ||
        t.includes('Maximum update depth'),
    );
    expect(
      hydrationErrors,
      `Hydration / loop console errors:\n${hydrationErrors.join('\n')}`,
    ).toHaveLength(0);
  });

  test('TS-05: full scroll never trips error boundary or React #185/#425', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loadAndFullScroll(page);

    const bodyText = await page.locator('body').innerText();
    assertNoErrorBoundary(bodyText);

    const fatal = pageErrors.filter((m) =>
      FATAL_ERROR_SIGNATURES.some((sig) => m.includes(sig)),
    );
    expect(fatal, `Fatal pageerrors after full scroll:\n${fatal.join('\n')}`).toHaveLength(0);

    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('#hero')).toContainText('Vikram');
  });

  test('TS-06: no duplicate React keys (m3/m5 AnimatePresence) during scroll', async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on('console', (msg) => {
      // React duplicate-key warnings are type "error" in React 18+ / "warning" in some builds.
      if (msg.type() === 'error' || msg.type() === 'warning') {
        consoleMessages.push(msg.text());
      }
    });

    await loadAndFullScroll(page);

    const bodyText = await page.locator('body').innerText();
    assertNoErrorBoundary(bodyText);

    const dupKeys = consoleMessages.filter((t) => t.includes(DUPLICATE_KEY_SIGNATURE));
    expect(
      dupKeys,
      `Duplicate React key warnings (D-KEYS-01):\n${dupKeys.join('\n')}`,
    ).toHaveLength(0);
  });
});
