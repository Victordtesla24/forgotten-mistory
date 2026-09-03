import { test, expect } from '@playwright/test';

/**
 * Experience — sixteen years drawn to scale, then the detail.
 *
 * The chart's one claim is that a bar's length is its role's real duration. If
 * that stops being true the section is decoration, so these tests measure the
 * rendered bars and compare them against the dates in the data. They also pin
 * the accessibility contract: the chart is real markup with real proportions,
 * so it survives a screen reader and a browser with no WebGL.
 */

const EXPERIENCE = '#experience';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator(EXPERIENCE).scrollIntoViewIfNeeded();
});

test.describe('Experience', () => {
  test('TC-EXP-01: every role from the CV appears in the chart and the list', async ({ page }) => {
    await expect(page.locator(`${EXPERIENCE} ol`).first().locator('li')).toHaveCount(8);
    const companies = await page
      .locator(`${EXPERIENCE} ol`)
      .first()
      .locator('li button')
      .allInnerTexts();
    for (const company of [
      'Australian Taxation Office',
      'ANZ Banking Group',
      'National Australia Bank',
      'Microsoft',
      'Telstra',
      'InfoCentric',
      'MYOB',
    ]) {
      expect(companies.join(' ')).toContain(company);
    }
  });

  test('TC-EXP-02: bar lengths are proportional to real durations', async ({ page }) => {
    const bars = page.locator(`${EXPERIENCE} ol`).first().locator('li span[style]');
    const widths: number[] = [];
    const count = await bars.count();
    for (let i = 0; i < count; i++) {
      const box = await bars.nth(i).boundingBox();
      widths.push(box?.width ?? 0);
    }

    // ANZ (Sept 2017 – June 2025, 7.8 years) is the third row and must be the
    // longest bar by a wide margin — roughly six times the ten-month NAB bar.
    const anz = widths[2];
    const nab = widths[3];
    expect(anz).toBeGreaterThan(0);
    expect(anz).toBe(Math.max(...widths));
    expect(anz / nab).toBeGreaterThan(5);
    expect(anz / nab).toBeLessThan(12);
  });

  test('TC-EXP-03: the axis is labelled with real years', async ({ page }) => {
    const axis = page.locator(`${EXPERIENCE}`);
    for (const year of ['2010', '2015', '2020', '2025']) {
      await expect(axis).toContainText(year);
    }
  });

  test('TC-EXP-04: each chart row is a real button with an accessible name', async ({ page }) => {
    const buttons = page.locator(`${EXPERIENCE} ol`).first().locator('button');
    await expect(buttons).toHaveCount(8);
    const label = await buttons.first().getAttribute('aria-label');
    expect(label).toContain('Australian Taxation Office');
    expect(label).toContain('March 2026');
  });

  test('TC-EXP-05: the current role opens by default and lists its bullets', async ({ page }) => {
    const first = page.locator(`${EXPERIENCE} #role-ato`);
    await expect(first).toHaveAttribute('data-open', 'true');
    await expect(first.locator('li')).not.toHaveCount(0);
    await expect(first).toContainText('Agile Kookaburras');
  });

  test('TC-EXP-06: roles expand and collapse from the keyboard', async ({ page }) => {
    const toggle = page.locator(`${EXPERIENCE} #role-anz button`).first();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.focus();
    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator(`${EXPERIENCE} #role-body-anz`)).toBeVisible();
    await toggle.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('TC-EXP-07: headline figures carry their role, not a bare number', async ({ page }) => {
    // Three roles state a figure in the CV; the other five deliberately do not,
    // and inventing one for them would be the exact failure this site avoids.
    const headlines = page.locator(`${EXPERIENCE} #role-ato, ${EXPERIENCE} #role-anz`);
    await expect(headlines.first()).toContainText('≈92%');
    await expect(page.locator(`${EXPERIENCE} #role-anz`)).toContainText('10k+');
    await expect(page.locator(`${EXPERIENCE} #role-microsoft`)).not.toContainText('%');
  });

  test('TC-EXP-08: the section is complete without WebGL', async ({ page }) => {
    // Headless runs a software renderer, which the capability check declines.
    await expect(page.locator(`${EXPERIENCE} canvas`)).toHaveCount(0);
    await expect(page.locator(`${EXPERIENCE} ol`).first().locator('li')).toHaveCount(8);
  });
});
