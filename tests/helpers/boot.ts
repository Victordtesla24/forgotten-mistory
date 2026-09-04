import type { Page } from '@playwright/test';

/**
 * Shared boot/preloader helper for the Playwright suite.
 *
 * ## Why this file exists
 *
 * Four spec files each carried their own copy of a `gotoHome()` helper that
 * skipped the ~1.9 s boot wipe by ripping the overlay out of the DOM directly:
 *
 *     document.querySelector('.preloader')?.remove();
 *
 * That is destructive. `.preloader` is rendered by <Preloader/>, so React still
 * holds a reference to the node. When React later unmounts or re-renders around
 * it, reconciliation calls `removeChild`/`insertBefore` against a parent that no
 * longer owns the node and throws:
 *
 *     NotFoundError: Failed to execute 'removeChild' on 'Node':
 *     The node to be removed is not a child of this node.
 *
 * app/error.tsx catches it and swaps the entire page for the "SYSTEM INTERRUPT"
 * boundary, so `#hero` never appears and every dependent assertion times out.
 *
 * A three-way probe against the real static export isolated it precisely:
 *   A. no intervention            -> hero renders, 10 sections   PASS
 *   B. Skip click only            -> hero renders, 10 sections   PASS
 *   C. Skip click + .remove()     -> hero absent, error boundary FAIL
 *
 * That single line accounted for 35 of 36 suite failures — hero (18), chatbot
 * (7), contact (6) and cinematic (4) — while the specs that simply waited for
 * the overlay to hide (navigation, footer, projects, catalogue) passed all along.
 *
 * ## The correct approach
 *
 * Click the component's own Skip control and let React unmount the overlay. The
 * skip path is not a slow fallback: Preloader.handleSkip sets `body.page-ready`
 * and dispatches `fm:page-ready` immediately (components/site/Preloader.tsx:127),
 * which is the same handoff signal app/page.tsx listens for to start the hero
 * entrance. So we get the speed the destructive version was reaching for,
 * without corrupting React's tree.
 *
 * Never reintroduce a DOM `.remove()` on a React-owned node here.
 */

/** Longest we will wait for the boot overlay to finish and unmount. */
const PRELOADER_TIMEOUT_MS = 20000;

/**
 * Dismiss the boot preloader safely and resolve once the page is interactive.
 *
 * Clicks the in-page Skip control (via a real Playwright click, so React's
 * synthetic event handler runs) and then waits for the overlay to leave the
 * accessibility tree. Tolerant of the overlay already being gone — some specs
 * navigate after it has finished naturally.
 */
export async function settleBoot(page: Page): Promise<void> {
  const preloader = page.locator('.preloader');

  // Nothing to do if the wipe already completed.
  if (!(await preloader.isVisible().catch(() => false))) return;

  const skip = page.locator('button.preloader-skip');
  if (await skip.isVisible().catch(() => false)) {
    // React-owned handler: sets body.page-ready + dispatches fm:page-ready.
    await skip.click({ timeout: 5000 }).catch(() => {});
  }

  // Let React unmount the overlay itself. `hidden` covers both the
  // detached case and the still-mounted-but-invisible case.
  await preloader.waitFor({ state: 'hidden', timeout: PRELOADER_TIMEOUT_MS }).catch(() => {});
}

/**
 * Navigate to the home page and wait until the hero is genuinely visible.
 *
 * This is the helper the majority of specs want: it guarantees the app has
 * booted and hydrated far enough that hero content is assertable.
 */
export async function gotoHome(page: Page): Promise<void> {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await settleBoot(page);
  await page.locator('#hero, .hero-section').first().waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Navigate to the home page and scroll a specific section into view.
 *
 * Sections below the fold are gated behind InViewGate/IntersectionObserver, so
 * they only mount once scrolled to.
 */
export async function gotoSection(page: Page, selector: string): Promise<void> {
  await gotoHome(page);
  await page.locator(selector).scrollIntoViewIfNeeded();
}
