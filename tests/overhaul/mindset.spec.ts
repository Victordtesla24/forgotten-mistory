import { test, expect, type Page } from '@playwright/test';
import { projectionDimensions, proof } from '@/app/data/siteContent';
import { knowledgeBase } from '@/app/data/miniVicKnowledge';

/**
 * TC-FR-MINDSET (SPEC §10 / FR-MINDSET, prompt §4) — the About/Experience copy and
 * `miniVicKnowledge` jointly project a balanced persona across the four dimensions
 * the SPEC names: deep technical depth, multi-million-dollar program scale,
 * multi-year/decades sustained execution, and multi-layered tangible value
 * (≥2 of time saved / risk reduced / cost avoided). Every projected claim is
 * number-led and source-traceable (NN-3). A `#mindset` section renders the four
 * dimensions, and ≥1 multi-million-dollar claim and ≥1 multi-year/decades claim are
 * rendered and trace back to the canonical résumé-sourced data.
 */

// The four projection dimensions FR-MINDSET requires.
const DIMENSION_KEYS = ['depth', 'scale', 'longevity', 'value'] as const;

async function gotoMindset(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
  await page.locator('#mindset').scrollIntoViewIfNeeded();
  await page
    .locator('#mindset [data-dimension]')
    .first()
    .waitFor({ state: 'attached', timeout: 15000 });
}

test.describe('TC-FR-MINDSET — balanced-persona projection', () => {
  test.describe.configure({ timeout: 90000 });

  // U: the data layer + miniVicKnowledge represent all four projection dimensions.
  test('data + knowledge base represent all four projection dimensions', () => {
    expect(projectionDimensions.map((d) => d.key).sort()).toEqual([...DIMENSION_KEYS].sort());

    // The tangible-value dimension is multi-layered: ≥2 of time/risk/cost.
    const value = projectionDimensions.find((d) => d.key === 'value');
    expect(value, 'a tangible-value dimension must exist').toBeTruthy();
    expect(new Set(value!.values).size).toBeGreaterThanOrEqual(2);

    // Every dimension is source-traceable (cites a primary source) and number-led.
    for (const d of projectionDimensions) {
      expect(d.source.trim().length, `${d.key} must cite a source`).toBeGreaterThan(0);
      expect(d.claim, `${d.key} claim must contain a number`).toMatch(/\d/);
    }

    // miniVicKnowledge carries each dimension's signature so the clone projects the
    // same balanced persona: technical win, $5M+ scale, 15+ year span, tangible value.
    const kb = knowledgeBase.map((e) => `${e.answer} ${e.keywords.join(' ')}`).join(' ');
    expect(kb).toMatch(/92%/); // deep technical depth (ATO automation win)
    expect(kb).toMatch(/\$5M\+?/); // multi-million-dollar program scale
    expect(kb).toMatch(/15\+\s*years?/i); // multi-year / decades sustained execution
    expect(kb).toMatch(/cost|compliance/i); // multi-layered tangible value
  });

  // M (exercised via E2E): the four dimensions render with traceable claims.
  test('renders four dimensions including a $5M+ scale claim and a 15+ year span', async ({ page }) => {
    await gotoMindset(page);
    const mindset = page.locator('#mindset');
    await expect(mindset).toHaveCount(1);

    for (const key of DIMENSION_KEYS) {
      await expect(
        mindset.locator(`[data-dimension="${key}"]`),
        `dimension "${key}" must render`,
      ).toHaveCount(1);
    }

    // ≥1 multi-million-dollar claim rendered and source-traceable: the scale card's
    // claim shows $5M+, the same figure carried by the canonical proof data.
    const scaleProof = proof.find((p) => p.prefix === '$' && p.value === 5);
    expect(scaleProof, 'proof data must carry the $5M+ figure').toBeTruthy();
    await expect(mindset.locator('[data-dimension="scale"] .mindset-claim')).toContainText('$5M+');

    // ≥1 multi-year/decades claim rendered.
    await expect(mindset.locator('[data-dimension="longevity"] .mindset-claim')).toContainText(
      /15\+\s*years/i,
    );

    // The tangible-value dimension exposes ≥2 distinct value layers.
    const valueTags = mindset.locator('[data-dimension="value"] [data-value-kind]');
    expect(await valueTags.count()).toBeGreaterThanOrEqual(2);

    // Every dimension cites its source on the page (traceability is visible).
    for (const key of DIMENSION_KEYS) {
      await expect(mindset.locator(`[data-dimension="${key}"] .mindset-source`)).not.toBeEmpty();
    }
  });
});
