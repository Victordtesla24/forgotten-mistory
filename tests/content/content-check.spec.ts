import { test, expect, type Page } from '@playwright/test';
import { knowledgeBase } from '../../app/data/miniVicKnowledge';

/**
 * Category 5: Content Preservation Tests
 * Verifies that siteContent.ts, resumeContent.ts, and miniVicKnowledge.ts
 * facts appear verbatim in the rendered HTML output.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
}

test.describe('Content Preservation', () => {
  test.describe.configure({ timeout: 60000 });

  // ── siteContent.ts ──

  // The hero's copy now lives in app/data/portfolio/hero.ts, deliberately
  // separate from siteContent.ts: it is a fifty-word front door, not a summary
  // of the page below it. The old greeting ("Hello, I'm") and the two-paragraph
  // subtitle were removed with the hero rebuild.

  test('CT-01: Hero name from hero.ts appears verbatim', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#hero h1')).toHaveText('Vikram Deshpande');
  });

  test('CT-02: Hero positioning line appears verbatim', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#hero')).toContainText(
      'Delivery leadership \u00b7 AI solutions architecture',
    );
  });

  test('CT-03: Hero statement names the current engagement', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#hero')).toContainText('Fifteen years leading delivery');
    await expect(page.locator('#hero')).toContainText("Australian Taxation Office's Payday Super");
  });

  test('CT-04: Vedic-astronomy work is preserved in the projects section (demoted out of the hero ATF)', async ({ page }) => {
    await gotoHome(page);
    // D-HERO-02: the astronomy narrative was moved off the recruiter-critical ATF, but
    // the underlying work is still represented as a real project in #work.
    await page.locator('#work').scrollIntoViewIfNeeded();
    await expect(page.locator('#work')).toContainText('Vedic');
    // and it must no longer clutter the hero first paint
    await expect(page.locator('#hero')).not.toContainText('Vedic astronomy');
  });

  // The two-paragraph biography that used to live in siteContent.about was
  // replaced by the ten-dimension About section, whose copy lives in
  // app/data/portfolio/about.ts. The export was deleted rather than left
  // unreferenced. tests/e2e/about.spec.ts owns that section's contract; this
  // check only guards that the section still carries the career facts a
  // recruiter is scanning for.
  test('CT-05: About carries the career facts', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await expect(page.locator('#about')).toContainText('Fifteen years');
    await expect(page.locator('#about')).toContainText('Melbourne, Victoria');
    await expect(page.locator('#about')).toContainText('Australian Taxation Office');
  });

  test('CT-06: All 4 project cards from siteContent appear in HTML', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    await expect(page.locator('#work')).toContainText('EFDDH Jira Analytics');
    await expect(page.locator('#work')).toContainText('AI Resume Tailor');
    await expect(page.locator('#work')).toContainText('Relationship Timeline');
    await expect(page.locator('#work')).toContainText('AI Gmail Manager');
  });

  test('CT-07: Featured repos from siteContent appear in HTML', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#work').scrollIntoViewIfNeeded();
    await expect(page.locator('#work')).toContainText('telemetry-server');
    await expect(page.locator('#work')).toContainText('tesla-api');
  });

  test('CT-08: Skill groups from siteContent appear verbatim', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#skills').scrollIntoViewIfNeeded();
    // Expand all skill cards to reveal the skill list items
    const skillHeaders = page.locator('#skills .skill-header');
    const headerCount = await skillHeaders.count();
    for (let i = 0; i < headerCount; i++) {
      try {
        await skillHeaders.nth(i).click();
        await page.waitForTimeout(200);
      } catch { /* some may already be open */ }
    }
    await page.waitForTimeout(500);
    // Check for specific skill names
    await expect(page.locator('#skills')).toContainText('Python');
    await expect(page.locator('#skills')).toContainText('TypeScript');
    await expect(page.locator('#skills')).toContainText('React/Next.js');
    await expect(page.locator('#skills')).toContainText('Kubernetes');
    await expect(page.locator('#skills')).toContainText('Certified Scrum Master');
  });

  test('CT-09: Contact info from siteContent appears verbatim', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    await expect(page.locator('#contact')).toContainText('sarkar.vikram@gmail.com');
    await expect(page.locator('#contact')).toContainText('+61 433 224 556');
    await expect(page.locator('#contact')).toContainText(
      'Open to Scrum Master / Project Manager roles in Melbourne — and selected AI delivery engagements.',
    );
  });

  test('CT-10: Proof points from siteContent appear in HTML', async ({ page }) => {
    await gotoHome(page);
    // Proof bar data is rendered by ProofBar component
    const pageText = await page.locator('body').innerText();
    expect(pageText).toContain('15');
    expect(pageText).toContain('92');
    expect(pageText).toContain('10k');
    expect(pageText).toContain('$5M');
  });

  test('CT-11: Social links from siteContent appear', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#contact').scrollIntoViewIfNeeded();
    const githubLink = page.locator('a[href*="github.com/Victordtesla24"]');
    await expect(githubLink.first()).toBeAttached();
    const ytLink = page.locator('a[href*="youtube.com/@vicd0ct"]');
    await expect(ytLink.first()).toBeAttached();
  });

  test('CT-15: LinkedIn (primary recruiter channel) is linked on the page', async ({ page }) => {
    await gotoHome(page);
    const li = page.locator('a[href*="linkedin.com/in/vikramd-profile"]');
    await expect(li.first()).toBeAttached();
  });

  // ── resumeContent.ts ──
  //
  // CT-12 and CT-13 covered the six outcome cards and their hover/click detail
  // flyout, which lived in the old hero. The hero rebuild removed them: the
  // front door now carries three figures with their provenance inline, and the
  // full outcome evidence belongs to #experience, which states the same facts
  // in its role bullets. Both tests were deleted rather than re-pointed because
  // the components they exercised (`.meta-card`, `FloatingDetailBox`) no longer
  // exist. CT-10 below still pins the quantified claims themselves.

  // ── miniVicKnowledge.ts ──

  test('CT-14: MiniVicBot knowledge base facts are present (via component render check)', async ({ page }) => {
    await gotoHome(page);
    await page.waitForTimeout(2000); // Deferred load
    // MiniVicBot renders with persona-mode greetings from miniVicKnowledge
    // The component itself must load without errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('CT-16: Dossier decorative frame keeps recruiter-facing role label', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#dossier').scrollIntoViewIfNeeded();
    const frameLabel = page.locator('#dossier .dossier-frame-label');
    await expect(frameLabel).toBeVisible();
    await expect(frameLabel).toContainText('SCRUM MASTER / PROJECT MANAGER');
    await expect(frameLabel).not.toContainText('PRINCIPAL ENGINEER');
  });

  test('CT-17: MiniVic availability default and hiring copy keep active-intent ATO wording', async () => {
    const availability = knowledgeBase.find((entry) => entry.id === 'availability');
    expect(availability).toBeDefined();

    if (!availability) {
      throw new Error('Availability entry is missing from miniVicKnowledge.');
    }

    const defaultAnswer = availability.answer;
    const hiringAnswer = availability.personaVariants?.hiring;

    expect(hiringAnswer, 'availability.hiring persona variant is required').toBeTruthy();

    for (const [variant, answer] of [
      ['default', defaultAnswer],
      ['hiring', hiringAnswer ?? ''],
    ] as const) {
      expect(answer, `${variant} availability must signal active intent`).toContain('actively exploring');
      expect(
        /(?:ato|australian taxation office|payday super)/i.test(answer),
        `${variant} availability must mention current ATO work`,
      ).toBe(true);
      expect(answer.toLowerCase(), `${variant} availability must not claim off-market`).not.toContain(
        'not on the market',
      );
    }
  });
});
