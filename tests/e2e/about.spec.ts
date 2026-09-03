import { test, expect } from '@playwright/test';

/**
 * About — the ten dimensions his own job-fit engine scores a candidate on,
 * answered one at a time.
 *
 * The section's argument is that a self-assigned number is not evidence, so
 * these tests pin two things above all: that all ten dimensions are present and
 * named exactly as the product names them, and that no score appears anywhere
 * near them. If a future change adds a percentage or a progress bar to this
 * section, that is not a styling regression — it contradicts the copy sitting
 * directly above it, and this file should fail.
 */

const ABOUT = '#about';

const DIMENSIONS = [
  'Technical Skills',
  'Experience Level',
  'Industry Match',
  'Role Alignment',
  'Culture Fit',
  'Salary Fit',
  'Location Match',
  'Career Growth',
  'Company Stability',
  'North Star Align',
];

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator(ABOUT).scrollIntoViewIfNeeded();
});

test.describe('About', () => {
  test('TC-ABOUT-01: all ten dimensions render, in the engine’s own order', async ({ page }) => {
    const names = await page.locator(`${ABOUT} ol li h3`).allInnerTexts();
    expect(names).toHaveLength(10);
    names.forEach((text, index) => {
      expect(text).toContain(DIMENSIONS[index]);
    });
  });

  test('TC-ABOUT-02: every dimension carries an answer and its evidence', async ({ page }) => {
    const items = page.locator(`${ABOUT} ol li`);
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const paragraphs = items.nth(i).locator('p');
      await expect(paragraphs).toHaveCount(2);
      const answer = (await paragraphs.nth(0).innerText()).trim();
      const evidence = (await paragraphs.nth(1).innerText()).trim();
      expect(answer.length, `answer ${i}`).toBeGreaterThan(40);
      expect(evidence.length, `evidence ${i}`).toBeGreaterThan(10);
    }
  });

  test('TC-ABOUT-03: no dimension is given a score', async ({ page }) => {
    // The check is scoped to the headings and the answers, not the evidence
    // lines: a sourced figure like "-38% simulated error-budget breaches" is
    // exactly the kind of number this site wants, because it names where it
    // came from. What must never appear is a rating attached to a dimension —
    // a percentage, an "8/10", or a bar — since the copy directly above says
    // there are none and explains why.
    const headings = (await page.locator(`${ABOUT} ol li h3`).allInnerTexts()).join(' ');
    const answers = (await page.locator(`${ABOUT} ol li p:first-of-type`).allInnerTexts()).join(' ');
    for (const scored of [headings, answers]) {
      expect(scored).not.toMatch(/\b\d{1,3}\s?%/);
      expect(scored).not.toMatch(/\b\d{1,2}\s?\/\s?10\b/);
      expect(scored).not.toMatch(/\b\d{1,2}\s+out of\s+10\b/i);
    }
    // No meters, progress bars or sliders either.
    await expect(page.locator(`${ABOUT} progress, ${ABOUT} meter, ${ABOUT} [role="progressbar"]`)).toHaveCount(0);
    await expect(page.locator(ABOUT)).toContainText('There are no scores below');
  });

  test('TC-ABOUT-04: the dimensions name their source', async ({ page }) => {
    const link = page.locator(`${ABOUT} a[href*="aether-job-career-agent"]`);
    await expect(link).toBeVisible();
    await expect(page.locator(ABOUT)).toContainText('apps/api/app/routers/jobs.py');
  });

  test('TC-ABOUT-05: job-side dimensions are labelled as such', async ({ page }) => {
    // Salary Fit, Location Match and Company Stability are computed from the
    // role, not the candidate. Answering them about oneself without saying so
    // would misrepresent what the engine measures.
    const tagged = page.locator(`${ABOUT} ol li[data-side="role"]`);
    await expect(tagged).toHaveCount(3);
    for (const name of ['Salary Fit', 'Location Match', 'Company Stability']) {
      await expect(
        page.locator(`${ABOUT} ol li[data-side="role"]`, { hasText: name }),
      ).toHaveCount(1);
    }
  });

  test('TC-ABOUT-06: each dimension is keyboard reachable', async ({ page }) => {
    const first = page.locator(`${ABOUT} ol li`).first();
    await first.focus();
    await expect(first).toBeFocused();
    await expect(first).toHaveAttribute('data-active', 'true');
  });

  test('TC-ABOUT-07: the section is complete without WebGL', async ({ page }) => {
    // Headless runs a software renderer, which the capability check declines —
    // so this run IS the no-WebGL path, and all ten answers must still be here.
    await expect(page.locator(`${ABOUT} ol li`)).toHaveCount(10);
    await expect(page.locator(`${ABOUT} canvas`)).toHaveCount(0);
    await expect(page.locator(ABOUT)).toContainText('Ten axes · no scores');
  });
});
