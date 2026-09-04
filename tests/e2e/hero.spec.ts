<<<<<<< HEAD
import { test, expect } from '@playwright/test';
=======
import { test, expect, type Page } from '@playwright/test';
import { gotoHome as sharedGotoHome } from '../helpers/boot';
>>>>>>> 9588cff (Merging everythig on nain)

/**
 * Hero — the front door.
 *
 * The hero was rebuilt in 2026-09 against two hard rules, and this file exists
 * to hold both of them:
 *
 *  1. Nothing above the fold waits on JavaScript. The previous hero
 *     server-rendered its content at `opacity: 0` and let framer-motion reveal
 *     it after hydration, so a cold production load showed a preloader overlay
 *     for four to eight seconds while a 450 kB bundle parsed. The preloader is
 *     gone and the entrance is a pure CSS animation.
 *  2. Every figure carries its provenance. A number without a source is a
 *     boast, and this site's whole register is evidence over adjectives.
 *
 * Selectors are semantic (`#hero h1`, `#hero ul li`, hrefs) rather than
 * class-based: the hero styles itself through a CSS module whose class names
 * are hashed at build time.
 */

<<<<<<< HEAD
const HERO = '#hero';
=======
async function gotoHome(page: Page) {
  // D-BOOT-01: dismiss the boot wipe via the component's own Skip control.
  // Do NOT DOM-remove `.preloader` — it is React-owned and detaching it throws
  // NotFoundError during reconciliation, which trips app/error.tsx and replaces
  // the whole page with the error boundary. See tests/helpers/boot.ts.
  await sharedGotoHome(page);
  // Allow GSAP/CSS name entrance to settle past any transient clip/glitch frames.
  await page.waitForTimeout(400);
}
>>>>>>> 9588cff (Merging everythig on nain)

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator(HERO).waitFor({ state: 'visible', timeout: 15000 });
});

test.describe('Hero', () => {
  test('TC-HERO-01: the name is the page h1', async ({ page }) => {
    const name = page.locator(`${HERO} h1`);
    await expect(name).toBeVisible();
    await expect(name).toHaveText('Vikram Deshpande');
    // Exactly one h1 on the document: the hero owns the top of the outline.
    await expect(page.locator('h1')).toHaveCount(1);
  });

  test('TC-HERO-02: positioning, location and one-sentence statement render', async ({ page }) => {
    const hero = page.locator(HERO);
    await expect(hero).toContainText('Delivery leadership');
    await expect(hero).toContainText('AI solutions architecture');
    await expect(hero).toContainText('Melbourne, Australia');
    await expect(hero).toContainText('Australian Taxation Office');
  });

  test('TC-HERO-03: the statement stays within its word budget', async ({ page }) => {
    // The old hero ran to roughly 150 words above the fold. The rebuild caps
    // the prose at a single sentence; this guard is what stops it creeping back.
    const statement = await page.locator(`${HERO} p`).nth(2).innerText();
    const words = statement.trim().split(/\s+/).length;
    expect(words).toBeLessThanOrEqual(35);
  });

  test('TC-HERO-04: the ledger shows three figures, each with its source', async ({ page }) => {
    const entries = page.locator(`${HERO} ul li`);
    await expect(entries).toHaveCount(3);

    const hero = page.locator(HERO);
    await expect(hero).toContainText('≈92%');
    await expect(hero).toContainText('$5M+');
    await expect(hero).toContainText('10k+');

    // Provenance, not decoration: each figure names where it comes from.
    await expect(hero).toContainText('ATO Payday Super');
    await expect(hero).toContainText('ANZ');
  });

  test('TC-HERO-05: both actions are present and reachable', async ({ page }) => {
    const evidence = page.locator(`${HERO} a[href="#experience"]`);
    await expect(evidence).toBeVisible();
    await expect(evidence).toContainText('See the evidence');

    const cv = page.locator(`${HERO} a[href$=".pdf"]`);
    await expect(cv).toBeVisible();
    await expect(cv).toContainText('Download CV');
    await expect(cv).toHaveAttribute('download', '');
  });

  test('TC-HERO-06: recruiter channels are linked', async ({ page }) => {
    await expect(
      page.locator(`${HERO} a[href*="linkedin.com/in/vikramd-profile"]`),
    ).toBeVisible();
    await expect(page.locator(`${HERO} a[href*="github.com/Victordtesla24"]`)).toBeVisible();
    await expect(page.locator(`${HERO} a[href^="mailto:"]`)).toBeVisible();
  });

  test('TC-HERO-07: a truthful availability signal is shown', async ({ page }) => {
    await expect(page.locator(HERO)).toContainText(
      'Open to delivery-leadership and AI engagements',
    );
  });

  test('TC-HERO-08: the hero fills the first viewport without overflowing it', async ({ page }) => {
    const box = await page.locator(HERO).boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    // One screen, not two. The tolerance is 1.10 rather than 1.05 because the
    // overshoot on a short viewport is the section's bottom padding, not
    // content — TC-HERO-09 below is the assertion that actually guarantees
    // every meaningful element sits above the fold, and it measures elements
    // rather than the section box.
    expect(box!.height).toBeGreaterThanOrEqual(viewport!.height * 0.9);
    expect(box!.height).toBeLessThanOrEqual(viewport!.height * 1.1);
  });

  test('TC-HERO-09: the whole hero is legible in the first viewport', async ({ page }) => {
    // Every element that carries meaning must sit above the fold — a recruiter
    // scanning for five seconds never scrolls.
    const viewport = page.viewportSize()!;
    for (const selector of [
      `${HERO} h1`,
      `${HERO} ul li`,
      `${HERO} a[href="#experience"]`,
      `${HERO} a[href$=".pdf"]`,
    ]) {
      const box = await page.locator(selector).first().boundingBox();
      expect(box, selector).not.toBeNull();
      expect(box!.y + box!.height, selector).toBeLessThanOrEqual(viewport.height);
    }
  });

  test('TC-HERO-10: the preloader is gone', async ({ page }) => {
    // It used to hold the viewport for ~1.9 s in front of a page that paints in
    // well under a second. Its removal is the point, so it is worth pinning.
    await expect(page.locator('.preloader')).toHaveCount(0);
  });

  test('TC-HERO-11: the hero holds at most one WebGL context', async ({ page }) => {
    // Headless runs on a software renderer, which components/gl/useGLCapability
    // declines — so zero canvases here is the expected result, not a failure.
    // What must never happen is the hero mounting more than one: the old design
    // let seventeen components each mint their own, and production logged
    // THREE.WebGLRenderer: Context Lost on every load.
    await page.waitForTimeout(1500);
    const canvases = await page.locator(`${HERO} canvas`).count();
    expect(canvases).toBeLessThanOrEqual(1);
  });
});
