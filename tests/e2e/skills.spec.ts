import { test, expect } from '@playwright/test';

/**
 * Skills & Certifications — the calibration card.
 *
 * The section's claim is that every capability listed has evidence behind it and
 * that the status says where that evidence was taken, not how good he is. Two
 * things therefore have to hold forever, and this file holds them: no row may
 * appear without evidence, and no proficiency bar, percentage rating or star may
 * ever appear in this section. The moment one does, the page is making a claim
 * no reader can check, which is the failure mode the whole site is built against.
 */

const SKILLS = '#skills';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator(SKILLS).scrollIntoViewIfNeeded();
});

test.describe('Skills', () => {
  test('TC-SKILL-01: the card is a real table with scoped headers', async ({ page }) => {
    const table = page.locator(`${SKILLS} table`);
    await expect(table).toHaveCount(1);
    await expect(table.locator('caption')).not.toHaveText('');
    await expect(table.locator('thead th[scope="col"]')).toHaveCount(4);
    // Every row's capability is its own row header, so a screen reader announces
    // the capability with each cell rather than reading four orphaned strings.
    const rowHeaders = table.locator('tbody th[scope="row"]');
    expect(await rowHeaders.count()).toBeGreaterThan(10);
  });

  test('TC-SKILL-02: every row carries evidence and a place it was measured', async ({ page }) => {
    const rows = page.locator(`${SKILLS} table tbody tr`);
    const count = await rows.count();
    expect(count).toBeGreaterThan(10);
    for (let i = 0; i < count; i++) {
      const cells = rows.nth(i).locator('td');
      const evidence = (await cells.nth(0).innerText()).trim();
      const where = (await cells.nth(1).innerText()).trim();
      expect(evidence.length, `evidence in row ${i}`).toBeGreaterThan(3);
      expect(where.length, `where in row ${i}`).toBeGreaterThan(0);
    }
  });

  test('TC-SKILL-03: no proficiency bars, meters or ratings exist', async ({ page }) => {
    await expect(
      page.locator(`${SKILLS} progress, ${SKILLS} meter, ${SKILLS} [role="progressbar"]`),
    ).toHaveCount(0);
    const text = await page.locator(`${SKILLS} table`).innerText();
    // A percentage that is part of a measured outcome (">30% delivery
    // efficiency") is exactly what belongs here. A rating out of five or ten is
    // not, and neither is a bare "90%" attached to a skill name.
    expect(text).not.toMatch(/\b\d{1,2}\s?\/\s?(5|10)\b/);
    expect(text).not.toMatch(/★|⭐/);
    const capabilities = await page.locator(`${SKILLS} table tbody th`).allInnerTexts();
    for (const capability of capabilities) {
      expect(capability).not.toMatch(/\d{1,3}\s?%/);
    }
  });

  test('TC-SKILL-04: the not-yet-held credential is stated, not hidden', async ({ page }) => {
    // The single most credibility-bearing row on the page.
    const pending = page.locator(`${SKILLS} table tbody tr[data-status="pending"]`);
    await expect(pending).toHaveCount(1);
    await expect(pending).toContainText('AWS and GCP');
    await expect(pending).toContainText('no certificate issued');
    await expect(page.locator(SKILLS)).toContainText('in progress, not yet held');
  });

  test('TC-SKILL-05: status is spoken, never glyph-only', async ({ page }) => {
    const rows = page.locator(`${SKILLS} table tbody tr`);
    const first = rows.first();
    await expect(first).toContainText('measured in production');
  });

  test('TC-SKILL-06: filtering changes the rows and moves nothing else', async ({ page }) => {
    // The card's height floor is measured after the web fonts land, because the
    // fallback face wraps the evidence column differently. Wait for the same
    // signal the component waits for before taking a baseline.
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(250);
    // Measured on the section itself rather than document.scrollHeight: other
    // sections further down the page mount their own content as they come into
    // view, so the document total is not a stable baseline for this assertion.
    const sectionHeight = () =>
      page.locator(SKILLS).evaluate((el) => Math.round(el.getBoundingClientRect().height));
    const before = await sectionHeight();
    const visibleRows = () =>
      page.locator(`${SKILLS} table tbody tr:not([hidden])`).count();

    const all = await visibleRows();
    await page.locator(`${SKILLS} button`, { hasText: 'Production only' }).click();
    const production = await visibleRows();
    expect(production).toBeLessThan(all);
    await expect(page.locator(`${SKILLS} table tbody tr[data-status="pending"]`)).toBeHidden();

    // The card holds its height, so nothing below the section moves under the
    // reader while they are using it.
    expect(await sectionHeight()).toBe(before);

    await page.locator(`${SKILLS} button`, { hasText: 'Everything' }).click();
    expect(await visibleRows()).toBe(all);
  });

  test('TC-SKILL-07: the filter state is exposed and announced', async ({ page }) => {
    const production = page.locator(`${SKILLS} button`, { hasText: 'Production only' });
    await production.click();
    await expect(production).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(`${SKILLS} [role="status"]`)).toContainText('capabilities shown');
  });

  test('TC-SKILL-08: the footer fingerprints the CV it claims to be calibrated against', async ({
    page,
  }) => {
    const footer = page.locator(`${SKILLS}`).getByText('Calibrated against');
    await expect(footer).toContainText('Vik_Resume_Final.pdf');
    // Eight hex characters, generated at build time from the file's bytes by
    // scripts/build/cv_fingerprint.mjs — never hand-typed.
    await expect(footer).toContainText(/MD5\s+[0-9a-f]{8}/);
  });
});
