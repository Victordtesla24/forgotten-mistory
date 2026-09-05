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

  for (const width of [1280, 1440, 1920]) {
    test(`TC-EXP-09 @ ${width}: every chart row, bar and readout lives inside the spine`, async ({
      page,
    }) => {
      // Design council R-c1, C4(b): the `6 mo` readout for the newest role was
      // positioned past the end of its bar and overran the section's right
      // gutter by ~38 px at 1440 and 1920. The readout column is now reserved
      // inside the content column, so nothing in the chart crosses the edge the
      // heading sits against.
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      await page.locator(EXPERIENCE).scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);

      const spine = await page.evaluate(() => {
        const section = document.querySelector('#experience') as HTMLElement;
        const cs = getComputedStyle(section);
        const rect = section.getBoundingClientRect();
        const heading = document.querySelector('#experience h2')!.getBoundingClientRect();
        // The column is `--page-max` wide, centred inside the section's
        // padding box; the heading stands on its left edge by definition.
        const root = getComputedStyle(document.documentElement);
        const pageMax = parseFloat(root.getPropertyValue('--page-max')) * parseFloat(root.fontSize);
        const contentLeft = rect.left + parseFloat(cs.paddingLeft);
        const contentRight = rect.right - parseFloat(cs.paddingRight);
        const columnLeft = Math.max(contentLeft, (contentLeft + contentRight - pageMax) / 2);
        return {
          left: columnLeft,
          right: Math.min(contentRight, columnLeft + pageMax),
          headingLeft: heading.left,
        };
      });
      // The heading stands on the spine's left edge; the chart must too.
      expect(Math.abs(spine.headingLeft - spine.left)).toBeLessThanOrEqual(1);

      const rows = page.locator(`${EXPERIENCE} ol`).first().locator('li button');
      await expect(rows).toHaveCount(8);
      for (let i = 0; i < 8; i += 1) {
        const row = rows.nth(i);
        const rowBox = (await row.boundingBox())!;
        expect(Math.abs(rowBox.x - spine.left), `row ${i} left`).toBeLessThanOrEqual(1);
        expect(rowBox.x + rowBox.width, `row ${i} right`).toBeLessThanOrEqual(spine.right + 0.5);
        // The readout is the last span inside the bar; it is what overran.
        const readout = row.locator('span span span').last();
        const readoutBox = (await readout.boundingBox())!;
        expect(readoutBox.x + readoutBox.width, `readout ${i} right`).toBeLessThanOrEqual(
          spine.right + 0.5,
        );
      }
    });
  }

  test('TC-EXP-10: the duration readouts are printed in --mist-200', async ({ page }) => {
    // Design council R-c1, C4(a): the readouts sampled at ≈3.3:1 at 12 px mono.
    // --mist-200 on the section ground is ≈ 9.8:1.
    const expected = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.color = 'var(--mist-200)';
      document.body.appendChild(probe);
      const value = getComputedStyle(probe).color;
      probe.remove();
      return value;
    });
    const readouts = page.locator(`${EXPERIENCE} ol`).first().locator('li button span span span');
    await expect(readouts).toHaveCount(8);
    for (let i = 0; i < 8; i += 1) {
      await expect(readouts.nth(i)).toHaveCSS('color', expected);
    }
  });

  test('TC-EXP-11: the longest bar is the brightest object in the chart, and it is ANZ', async ({
    page,
  }) => {
    // Design council R-c1, C4(a): bar fill was ≈1.89:1 against the plot ground.
    // Every bar now paints in --mist-400 at 0.85; the eight-year ANZ bar takes
    // --white at 0.9 so the longest bar is the brightest. The white bar is
    // selected by its row position, so this pins that the third row *is* ANZ.
    const rows = page.locator(`${EXPERIENCE} ol`).first().locator('li button');
    await expect(rows.nth(2)).toHaveAttribute('aria-label', /ANZ/);
    const fills = await page.evaluate(() => {
      const bars = Array.from(document.querySelectorAll('#experience ol li button span span > span'));
      return bars.map((bar) => {
        const cs = getComputedStyle(bar, '::before');
        return { background: cs.backgroundColor, opacity: parseFloat(cs.opacity) };
      });
    });
    expect(fills).toHaveLength(8);
    const rgb = (value: string) => value.match(/\d+/g)!.slice(0, 3).map(Number);
    const brightness = (f: { background: string; opacity: number }) =>
      (rgb(f.background).reduce((a, b) => a + b, 0) / 3) * f.opacity;
    const anz = brightness(fills[2]);
    for (let i = 0; i < 8; i += 1) {
      if (i === 2) continue;
      expect(brightness(fills[i]), `bar ${i} must not outshine ANZ`).toBeLessThan(anz);
      // 0x90 = 144 at 0.85 ≈ 122 painted on a #131313 ground → ≥ 3:1 (1.4.11).
      expect(brightness(fills[i]), `bar ${i} fill must clear the non-text floor`).toBeGreaterThanOrEqual(120);
    }
  });

  test('TC-EXP-08: the section is complete without WebGL', async ({ page }) => {
    // Headless runs a software renderer, which the capability check declines.
    await expect(page.locator(`${EXPERIENCE} canvas`)).toHaveCount(0);
    await expect(page.locator(`${EXPERIENCE} ol`).first().locator('li')).toHaveCount(8);
  });
});
