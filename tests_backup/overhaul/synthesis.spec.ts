import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-SYNTH (SPEC §10 / FR-SYNTH, prompt §4) — the site makes the multi-source
 * synthesis visible: a `#synthesis` section shows that each §6 mining source was
 * consulted (repo codebase/commits/READMEs, YouTube descriptions, local profile
 * files, past operational traces, public accounts — not the résumé alone), and
 * ≥1 rendered fact traces back to a non-résumé source.
 */

// The §6 sources the SPEC names as consulted beyond the résumé PDF.
const NON_RESUME_KINDS = ['repo', 'youtube', 'local', 'traces', 'accounts'] as const;

async function gotoSynthesis(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
  await page.locator('#synthesis').scrollIntoViewIfNeeded();
  await page
    .locator('#synthesis [data-source-kind]')
    .first()
    .waitFor({ state: 'attached', timeout: 15000 });
}

test.describe('TC-FR-SYNTH — multi-source synthesis provenance', () => {
  test.describe.configure({ timeout: 90000 });

  test('renders a synthesis section consulting every §6 source (résumé + 5 non-résumé)', async ({ page }) => {
    await gotoSynthesis(page);
    const synthesis = page.locator('#synthesis');
    await expect(synthesis).toHaveCount(1);

    // The résumé is one source; each of the five non-résumé §6 sources must be
    // represented as a consulted source with its own provenance entry.
    await expect(synthesis.locator('[data-source-kind="resume"]')).toHaveCount(1);
    for (const kind of NON_RESUME_KINDS) {
      await expect(
        synthesis.locator(`[data-source-kind="${kind}"]`),
        `§6 source "${kind}" must be shown as consulted`,
      ).toHaveCount(1);
    }
  });

  test('≥1 rendered fact traces back to a non-résumé source', async ({ page }) => {
    await gotoSynthesis(page);
    const synthesis = page.locator('#synthesis');

    // Every consulted source carries a concrete traced fact.
    const facts = synthesis.locator('[data-source-kind] .synthesis-fact');
    expect(await facts.count(), 'each source must render a traced fact').toBeGreaterThanOrEqual(
      NON_RESUME_KINDS.length + 1,
    );

    // At least one fact attributed to a non-résumé source is non-empty — the
    // synthesis is not the résumé alone (the core FR-SYNTH invariant).
    const nonResumeFacts = synthesis.locator(
      '[data-source-kind]:not([data-source-kind="resume"]) .synthesis-fact',
    );
    expect(await nonResumeFacts.count()).toBeGreaterThanOrEqual(1);
    await expect(nonResumeFacts.first()).not.toBeEmpty();

    // Bind to a specific operational-trace fact (P95 latency) that exists on the
    // site but never appears on the résumé as a one-line claim — proof the trace
    // source was genuinely mined.
    await expect(
      synthesis.locator('[data-source-kind="traces"] .synthesis-fact'),
    ).toContainText(/P95/i);
  });
});

/**
 * Studio-visual upgrade (UI/UX §8): the provenance section reads as a vertical
 * provenance-chain timeline — every consulted source sits on a connecting rail
 * with its own node marker — rather than a flat list. The node is the signature
 * visual the spec mandates for this section.
 */
test.describe('TC-FR-SYNTH — provenance timeline (studio visual)', () => {
  test.describe.configure({ timeout: 90000 });

  test('every source sits on the provenance timeline with its own node marker', async ({ page }) => {
    await gotoSynthesis(page);
    const cards = page.locator('#synthesis .synthesis-card');
    const count = await cards.count();
    expect(count, 'résumé + 5 non-résumé sources render as timeline entries').toBeGreaterThanOrEqual(6);
    // The signature rail visual: one node marker per provenance entry.
    await expect(page.locator('#synthesis .synthesis-card .synthesis-node')).toHaveCount(count);
  });
});

/**
 * A11y guard for the new staggered entrance: each card now mounts at opacity:0 and
 * is revealed by a Framer-Motion whileInView stagger. Under prefers-reduced-motion
 * the reveal must resolve instantly to opacity:1 — never leave content stuck hidden.
 */
test.describe('TC-FR-SYNTH — reduced-motion reveals every provenance entry', () => {
  test.describe.configure({ timeout: 90000 });

  test('all source cards resolve to opacity:1 under prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoSynthesis(page);
    const cards = page.locator('#synthesis [data-source-kind]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(6);
    for (let i = 0; i < count; i++) {
      await expect(cards.nth(i), `source card ${i} must reveal under reduced motion`).toHaveCSS(
        'opacity',
        '1',
      );
    }
  });
});
