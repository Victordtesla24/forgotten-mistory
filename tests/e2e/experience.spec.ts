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
    // `offsetWidth`, not `boundingBox`: cycle 15 gave the bars an entry beat
    // (`scaleX(0)` → `scaleX(1)`), so the painted box is whatever frame the
    // animation happens to be on when the harness looks. The layout width is
    // the encoding — the percentage of the sixteen-year axis this role owns —
    // and it is the same number before, during and after the beat.
    const widths = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#experience [class*="trackBar"]')).map(
        (bar) => (bar as HTMLElement).offsetWidth,
      ),
    );
    expect(widths).toHaveLength(8);

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
        // The readout — a sibling of the bar since cycle 15, so that the bar's
        // entry transform cannot squash it. It is what overran.
        const readout = row.locator('[class*="trackYears"]').last();
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
    const readouts = page
      .locator(`${EXPERIENCE} ol`)
      .first()
      .locator('li button [class*="trackYears"]');
    await expect(readouts).toHaveCount(8);
    for (let i = 0; i < 8; i += 1) {
      await expect(readouts.nth(i)).toHaveCSS('color', expected);
    }
  });

  test('TC-EXP-11: the longest bar is the brightest object in the chart, and it is ANZ', async ({
    page,
  }) => {
    // Design council R-c1, C4(a): bar fill was ≈1.89:1 against the plot ground.
    // Every bar paints in --mist-400 at 0.72 (R-c8 C-03 lowered it from 0.85);
    // the eight-year ANZ bar takes --white at 0.9 so the longest bar is the
    // brightest. The white bar is selected by its row position, so this pins
    // that the third row *is* ANZ.
    //
    // Two corrections, both cycle 15, both recorded because this test was red
    // in CI before either:
    //
    // 1. The selector read `button span span > span`, which needs three levels
    //    of nested span and therefore resolved to `.trackYears` — the label,
    //    whose ::before has no background at all. Every "brightness" it
    //    compared was 0, so `expect(0).toBeLessThan(0)` failed and the test
    //    had never once measured a bar. It now names the bar.
    // 2. The floor was `≥ 120`, an *uncomposited* stand-in for "≥ 3:1 against
    //    the plot ground" that ignores the fill's own opacity sitting over
    //    #131313. At 0.72 the stand-in reads 103.7 and the real ratio is
    //    3.39:1 — the proxy fails a bar that passes 1.4.11. The ratio itself
    //    is computed here instead, which is both the thing the old comment
    //    claimed to check and a check the proxy could not make.
    const rows = page.locator(`${EXPERIENCE} ol`).first().locator('li button');
    await expect(rows.nth(2)).toHaveAttribute('aria-label', /ANZ/);
    const fills = await page.evaluate(() => {
      const bars = Array.from(document.querySelectorAll('#experience [class*="trackBar"]'));
      return bars.map((bar) => {
        const cs = getComputedStyle(bar, '::before');
        return { background: cs.backgroundColor, opacity: parseFloat(cs.opacity) };
      });
    });
    expect(fills).toHaveLength(8);
    const rgb = (value: string) => value.match(/\d+/g)!.slice(0, 3).map(Number);
    /** The fill composited over the plot's #131313 ground, channel by channel. */
    const composited = (f: { background: string; opacity: number }) =>
      rgb(f.background).map((channel) => 0x13 + (channel - 0x13) * f.opacity);
    const relativeLuminance = (channels: number[]) => {
      const [r, g, b] = channels.map((channel) => {
        const s = channel / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const GROUND = relativeLuminance([0x13, 0x13, 0x13]);
    const contrast = (f: { background: string; opacity: number }) =>
      (relativeLuminance(composited(f)) + 0.05) / (GROUND + 0.05);
    const anz = relativeLuminance(composited(fills[2]));
    for (let i = 0; i < 8; i += 1) {
      if (i === 2) continue;
      expect(
        relativeLuminance(composited(fills[i])),
        `bar ${i} must not outshine ANZ`,
      ).toBeLessThan(anz);
      // WCAG 1.4.11: a graphic that carries information needs 3:1.
      expect(contrast(fills[i]), `bar ${i} fill must clear the non-text floor`).toBeGreaterThanOrEqual(3);
    }
    expect(contrast(fills[2]), 'the ANZ bar clears it too').toBeGreaterThanOrEqual(3);
  });

  test('TC-EXP-08: the section is complete without WebGL', async ({ page }) => {
    // Headless runs a software renderer, which the capability check declines.
    await expect(page.locator(`${EXPERIENCE} canvas`)).toHaveCount(0);
    await expect(page.locator(`${EXPERIENCE} ol`).first().locator('li')).toHaveCount(8);
  });
});
