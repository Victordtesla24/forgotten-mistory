import { test, expect, type Page } from '@playwright/test';

/**
 * SPEC §10 TC-FR-MINDSET — miniVicKnowledge represents all 4 projection
 * dimensions; ≥1 multi-million-dollar and ≥1 multi-year/decades claim rendered
 * and source-traceable.
 *
 * The MindsetProjection component renders in #mindset with 4 dimensions:
 *   1. Technical depth (key: 'depth')
 *   2. Program scale (key: 'scale') — multi-million-dollar claim
 *   3. Sustained execution (key: 'longevity') — multi-year/decades claim
 *   4. Tangible value (key: 'value')
 *
 * Each card has: label, claim, source (and optional values list).
 * PASS: 4 cards present, each with label/claim/source; scale has dollar figure;
 * longevity has years; all claims source-traceable.
 */

async function gotoMindset(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.locator('#mindset').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
}

test.describe('TC-FR-MINDSET: Balanced Persona Projection', () => {
  test.describe.configure({ timeout: 60000 });

  test('TC-MINDSET-01: Mindset section renders with ID and title', async ({ page }) => {
    await gotoMindset(page);
    const section = page.locator('#mindset');
    await expect(section).toBeVisible();
    await expect(section).toContainText('How I deliver, in numbers');
  });

  test('TC-MINDSET-02: All 4 projection dimension cards render', async ({ page }) => {
    await gotoMindset(page);
    const cards = page.locator('.mindset-card');
    await expect(cards).toHaveCount(4);
  });

  test('TC-MINDSET-03: Each card has a label, claim, and source', async ({ page }) => {
    await gotoMindset(page);
    const cards = page.locator('.mindset-card');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);

      // Label
      const label = card.locator('.mindset-label');
      await expect(label).toBeVisible();
      await expect(label).not.toBeEmpty();

      // Claim
      const claim = card.locator('.mindset-claim');
      await expect(claim).toBeVisible();
      await expect(claim).not.toBeEmpty();

      // Source
      const source = card.locator('.mindset-source');
      await expect(source).toBeVisible();
      await expect(source).not.toBeEmpty();
    }
  });

  test('TC-MINDSET-04: Depth dimension renders technical depth claim', async ({ page }) => {
    await gotoMindset(page);
    const depthCard = page.locator('.mindset-card[data-dimension="depth"]');
    await expect(depthCard).toBeVisible();
    await expect(depthCard.locator('.mindset-label')).toContainText('Technical depth');
    await expect(depthCard.locator('.mindset-claim')).toContainText('92%');
    await expect(depthCard.locator('.mindset-source')).toContainText('ATO');
  });

  test('TC-MINDSET-05: Scale dimension has multi-million-dollar claim', async ({ page }) => {
    await gotoMindset(page);
    const scaleCard = page.locator('.mindset-card[data-dimension="scale"]');
    await expect(scaleCard).toBeVisible();
    await expect(scaleCard.locator('.mindset-label')).toContainText('Program scale');

    const claimText = await scaleCard.locator('.mindset-claim').innerText();
    // Must contain a dollar figure in millions
    expect(claimText).toMatch(/\$\d+M/);
    await expect(scaleCard.locator('.mindset-source')).not.toBeEmpty();
  });

  test('TC-MINDSET-06: Longevity dimension has multi-year/decades claim', async ({ page }) => {
    await gotoMindset(page);
    const longevityCard = page.locator('.mindset-card[data-dimension="longevity"]');
    await expect(longevityCard).toBeVisible();
    await expect(longevityCard.locator('.mindset-label')).toContainText('Sustained execution');

    const claimText = await longevityCard.locator('.mindset-claim').innerText();
    // Must reference years or a multi-year span
    expect(claimText).toMatch(/\d+\+?\s*years/);
    await expect(longevityCard.locator('.mindset-source')).not.toBeEmpty();
  });

  test('TC-MINDSET-07: Value dimension has ≥2 tangible value kinds', async ({ page }) => {
    await gotoMindset(page);
    const valueCard = page.locator('.mindset-card[data-dimension="value"]');
    await expect(valueCard).toBeVisible();
    await expect(valueCard.locator('.mindset-label')).toContainText('Tangible value');

    const values = valueCard.locator('.mindset-value');
    const valueCount = await values.count();
    expect(valueCount).toBeGreaterThanOrEqual(2);

    // Verify the claim mentions efficiency/cost/risk improvements
    const claimText = await valueCard.locator('.mindset-claim').innerText();
    expect(claimText).toMatch(/%/); // At least one percentage
  });

  test('TC-MINDSET-08: Subhead text matches restrained tone', async ({ page }) => {
    await gotoMindset(page);
    const subhead = page.locator('#mindset .section-subhead');
    await expect(subhead).toBeVisible();
    // Subhead should be evidence-led, not boastful
    await expect(subhead).toBeVisible();
    const subheadText = await subhead.innerText();
    // Subhead must be non-empty and free of banned words
    expect(subheadText.length).toBeGreaterThan(20);
    const lowerSubhead = subheadText.toLowerCase();
    const banned = ['world-class', 'best', 'ninja', 'guru', 'rockstar', 'unparalleled', 'revolutionary'];
    for (const word of banned) {
      expect(lowerSubhead).not.toContain(word);
    }
  });

  test('TC-MINDSET-09: Cards animate into view (stagger visible)', async ({ page }) => {
    await gotoMindset(page);
    const grid = page.locator('.mindset-grid');
    await expect(grid).toBeVisible();

    // Verify Framer Motion whileInView stagger: at least one card should be
    // visible after scrollIntoView. Cards may still be animating in, so we
    // wait for the last card to become visible.
    const cards = page.locator('.mindset-card');
    const lastCard = cards.nth(3);
    await expect(lastCard).toBeVisible({ timeout: 5000 });
  });
});
