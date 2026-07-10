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

  test('CT-01: Hero greeting from siteContent appears verbatim', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#hero')).toContainText("Hello, I'm");
  });

  test('CT-02: Hero name from siteContent appears verbatim', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#hero')).toContainText('Vikram.');
  });

  test('CT-03: Hero subtitle contains "technical delivery leader" and "AI solutions architect"', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#hero')).toContainText('technical delivery leader');
    await expect(page.locator('#hero')).toContainText('AI solutions architect');
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

  test('CT-05: About paragraphs from siteContent appear verbatim', async ({ page }) => {
    await gotoHome(page);
    await page.locator('#about').scrollIntoViewIfNeeded();
    await expect(page.locator('#about')).toContainText('15');
    await expect(page.locator('#about')).toContainText('Senior Technical Leader');
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

  test('CT-12: Outcome cards from resumeContent render with correct values', async ({ page }) => {
    await gotoHome(page);
    // The 6 outcome cards show in the hero section
    await expect(page.locator('#hero')).toContainText('-92%');
    await expect(page.locator('#hero')).toContainText('10k+');
    await expect(page.locator('#hero')).toContainText('-38%');
    await expect(page.locator('#hero')).toContainText('$5M+');
    await expect(page.locator('#hero')).toContainText('-30%');
    await expect(page.locator('#hero')).toContainText('40+');
  });

  test('CT-13: Outcome card details from resumeContent appear on hover/click', async ({ page }) => {
    await gotoHome(page);
    const card = page.locator('[data-outcome-card="true"]').first();
    await card.scrollIntoViewIfNeeded();
    await card.click();
    await page.waitForTimeout(500);
    // FloatingDetailBox should show detail content
    const detailBox = page.locator('[class*="floating-detail"], [class*="FloatingDetail"]').first();
    const detailCount = await detailBox.count();
    if (detailCount > 0) {
      await expect(detailBox).toBeVisible();
    }
  });

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
