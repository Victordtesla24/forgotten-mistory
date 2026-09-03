import { test, expect, type Page } from '@playwright/test';

/**
 * REGRESSION — render stability (prod outage 2026-07-09).
 *
 * The outage this file is named for: a `useSyncExternalStore` in
 * `lib/githubTelemetry.ts` returned a fresh object from
 * `getSnapshot()`/`getServerSnapshot()` on every call. React compares snapshots
 * with `Object.is`, so a new reference each render meant "store changed"
 * forever → React #185 "Maximum update depth exceeded" → the root error
 * boundary in `app/error.tsx` replaced the ENTIRE page with "Something went
 * wrong". Every visitor saw a dead portfolio. A second defect in the same
 * outage: `TeslaDashboard` read `navigator.connection` inside a `useState`
 * initializer, so the server prerendered "—" and the client hydrated to "4G" →
 * React #425 hydration text mismatch.
 *
 * Both components were deleted with `#work` and the telemetry panel, so the
 * *specific* defects cannot recur on this page. The reason this file survives
 * anyway is that neither of them was really a telemetry bug: they were a store
 * that broke referential identity and a component that read a device API before
 * mount, and the six sections that replaced them do the same kinds of thing —
 * `Skills` measures its own table in a layout effect and feeds the result back
 * into state, `Vitrine` writes scroll position into React state on every frame,
 * `Experience` and `About` derive rendered output from hover and focus. A
 * single mistake in any of them produces exactly the same white page, and this
 * suite is deliberately stricter about timing than TC-RENDER-09 — it waits for
 * hydration and then keeps the page busy — which is why it caught the loop when
 * the render check did not.
 *
 * TS-03 was deleted with its subject: it asserted `#telemetry-panel` mounts and
 * contains "System Status", and the panel is no longer on the page. There is no
 * equivalent to re-point it at, because nothing replaced it; the loop it was a
 * canary for is covered by TS-01 and TS-05, which do not depend on any one
 * component existing.
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

/** Every section on the page, in page order. */
const SECTIONS = ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen'] as const;

async function loadAndSettle(page: Page) {
  await page.goto('/', { waitUntil: 'load' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  // Sit in the middle of the document and give hydration time to loop if it is
  // going to. A render loop is fast; the window in which it is still only a
  // warning is not.
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2));
  await page.waitForTimeout(3500);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
}

/**
 * Full-page scroll that exercises every stateful section: the vitrine's rail
 * observer, the skills table's resize/font re-measure, and the experience
 * timeline's hover and disclosure state.
 */
async function loadAndFullScroll(page: Page) {
  await page.goto('/', { waitUntil: 'load' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});

  for (const selector of SECTIONS) {
    const section = page.locator(selector);
    if ((await section.count()) === 0) continue;
    await section.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(600);
  }

  // The rail is the one place on the page where a scroll handler writes into
  // React state on every frame, so it is driven directly rather than only
  // passed by.
  const rail = page.locator('#vitrine ol').first();
  if ((await rail.count()) > 0) {
    await rail.evaluate((el) => el.scrollTo({ left: el.scrollWidth, behavior: 'instant' as ScrollBehavior }));
    await page.waitForTimeout(600);
    await rail.evaluate((el) => el.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior }));
    await page.waitForTimeout(600);
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
  test.describe.configure({ timeout: 120000 });

  test('TS-01: no uncaught React exceptions (max-update-depth / hydration)', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loadAndSettle(page);

    const fatal = pageErrors.filter((m) => FATAL_ERROR_SIGNATURES.some((sig) => m.includes(sig)));
    expect(fatal, `Uncaught fatal React errors:\n${fatal.join('\n')}`).toHaveLength(0);
  });

  test('TS-02: page shows real content, never the error boundary', async ({ page }) => {
    await loadAndSettle(page);

    const bodyText = await page.locator('body').innerText();
    assertNoErrorBoundary(bodyText);

    // The real app shell must be present, and all six sections with it — the
    // outage's signature was a page that still returned 200 with nothing on it.
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('#hero')).toContainText('Vikram');
    for (const selector of SECTIONS) {
      await expect(page.locator(selector)).toHaveCount(1);
    }
  });

  test('TS-03: the stateful sections keep rendering after being driven', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await loadAndSettle(page);

    // Replaces the deleted telemetry-panel check with the same idea aimed at
    // what is now on the page: exercise the three sections that hold state, and
    // require each to still be rendering its own content afterwards rather than
    // an empty shell.
    const skills = page.locator('#skills');
    await skills.scrollIntoViewIfNeeded();
    await skills.getByRole('button', { name: 'Production only' }).click();
    await skills.getByRole('button', { name: 'Everything' }).click();
    await expect(skills.locator('tbody tr:not([hidden])')).not.toHaveCount(0);

    const experience = page.locator('#experience');
    await experience.scrollIntoViewIfNeeded();
    await experience.locator('button[aria-expanded]').first().click();
    await expect(experience.locator('h3')).not.toHaveCount(0);

    const vitrine = page.locator('#vitrine');
    await vitrine.scrollIntoViewIfNeeded();
    await expect(vitrine.locator('li[aria-roledescription="plate"]')).toHaveCount(6);

    const fatal = pageErrors.filter((m) => FATAL_ERROR_SIGNATURES.some((sig) => m.includes(sig)));
    expect(fatal, `Fatal pageerrors while driving state:\n${fatal.join('\n')}`).toHaveLength(0);
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

    const fatal = pageErrors.filter((m) => FATAL_ERROR_SIGNATURES.some((sig) => m.includes(sig)));
    expect(fatal, `Fatal pageerrors after full scroll:\n${fatal.join('\n')}`).toHaveLength(0);

    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('#hero')).toContainText('Vikram');
  });

  test('TS-06: no duplicate React keys during a full scroll', async ({ page }) => {
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

    // D-KEYS-01. Several lists on the rebuilt page are keyed on a slice of their
    // own text (`bullet.slice(0, 40)`, `paragraph.slice(0, 24)`, `line.slice(0, 30)`),
    // which is a collision waiting for two entries that begin the same way — so
    // this guard is if anything more load-bearing now than it was.
    const dupKeys = consoleMessages.filter((t) => t.includes(DUPLICATE_KEY_SIGNATURE));
    expect(dupKeys, `Duplicate React key warnings:\n${dupKeys.join('\n')}`).toHaveLength(0);
  });
});
