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
