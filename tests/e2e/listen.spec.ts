import { test, expect } from '@playwright/test';

/**
 * Always willing to listen — the closing screen.
 *
 * Two invariants matter here and both are about restraint. The section must
 * stay nearly empty — it is the silence after five screens of instrumentation,
 * and that contrast is the thing a visitor is meant to leave holding. And there
 * must be no contact form: on a static export a form either lies about where
 * the message goes or hands the visitor to a third party, and neither is a good
 * last impression.
 */

const LISTEN = '#listen';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.locator(LISTEN).scrollIntoViewIfNeeded();
});

test.describe('Listen', () => {
  test('TC-LISTEN-01: the closing sentence is the only italic on the page', async ({ page }) => {
    const italics = await page.evaluate(() =>
      Array.from(document.querySelectorAll('main *'))
        .filter((el) => getComputedStyle(el).fontStyle === 'italic' && el.textContent?.trim())
        .map((el) => el.textContent!.trim().slice(0, 60)),
    );
    expect(italics).toHaveLength(1);
    expect(italics[0]).toContain('I have been wrong often enough');
  });

  test('TC-LISTEN-02: the closing copy stays under sixty-five words', async ({ page }) => {
    // Measured on the closing copy itself — the sentence, the four channels and
    // the coffee line — and not on the corrections ledger or the colophon. The
    // ledger is a record, printed under its own rule and its own heading, and a
    // record is not copy. What this budget guards is the invitation, which is
    // the thing that has to stay short.
    const words = await page.evaluate(() => {
      const section = document.querySelector('#listen')!;
      const clone = section.cloneNode(true) as HTMLElement;
      clone.querySelector('figure')?.remove();
      clone.querySelector('section')?.remove();
      clone.lastElementChild?.remove();
      return clone.textContent!.trim().split(/\s+/).length;
    });
    // The emptiest screen on the site, immediately after the densest.
    expect(words).toBeLessThanOrEqual(65);
  });

  test('TC-LISTEN-03: no form, no input, no third-party embed', async ({ page }) => {
    await expect(page.locator('form')).toHaveCount(0);
    await expect(page.locator('input, textarea, select')).toHaveCount(0);
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('TC-LISTEN-04: all four channels are real anchors matching the CV', async ({ page }) => {
    await expect(page.locator(`${LISTEN} a[href="mailto:sarkar.vikram@gmail.com"]`)).toBeVisible();
    await expect(page.locator(`${LISTEN} a[href="tel:+61433224556"]`)).toBeVisible();
    await expect(
      page.locator(`${LISTEN} a[href="https://www.linkedin.com/in/vikramd-profile"]`),
    ).toBeVisible();
    await expect(
      page.locator(`${LISTEN} a[href="https://github.com/Victordtesla24"]`),
    ).toBeVisible();
  });

  test('TC-LISTEN-05: hover and focus produce the identical underline', async ({ page }) => {
    const link = page.locator(`${LISTEN} a`).first();
    const scaleOf = () =>
      link.evaluate((el) => {
        const style = getComputedStyle(el, '::after');
        return style.transform;
      });

    await link.hover();
    await page.waitForTimeout(200);
    const hovered = await scaleOf();

    await page.mouse.move(0, 0);
    await link.focus();
    await page.waitForTimeout(200);
    const focused = await scaleOf();

    expect(focused).toBe(hovered);
    expect(hovered).not.toContain('0, 0, 0, 0');
  });

  test('TC-LISTEN-06: the colophon states what the page does not do', async ({ page }) => {
    const colophon = page.locator(LISTEN).getByText('no analytics');
    await expect(colophon).toBeVisible();
    await expect(colophon).toContainText('static export');
  });
});

test.describe('Listen · the corrections ledger', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.locator('#listen').scrollIntoViewIfNeeded();
  });

  test('TC-LEDGER-01: every correction is a link to the commit that made it', async ({
    page,
  }) => {
    const rows = page.locator('#listen ol li');
    const count = await rows.count();
    // A ledger of one is not a ledger, and a ledger of forty is a changelog.
    expect(count).toBeGreaterThanOrEqual(5);

    for (let i = 0; i < count; i += 1) {
      const row = rows.nth(i);
      const href = await row.locator('a').first().getAttribute('href');
      // The claim this section makes is checkable only if each line goes to the
      // diff. A row without one is an assertion about being corrected, which is
      // the exact thing the section is trying not to be.
      expect(href, `correction ${i} does not link to a commit`).toMatch(
        /^https:\/\/github\.com\/Victordtesla24\/forgotten-mistory\/commit\/[0-9a-f]{7,40}$/,
      );
      await expect(row.locator('time')).toHaveAttribute('datetime', /^\d{4}-\d{2}-\d{2}$/);
    }
  });

  test('TC-LEDGER-02: the ledger says how much of the history it is showing', async ({
    page,
  }) => {
    const shown = await page.locator('#listen ol li').count();
    const foot = page.locator('#listen').getByText(/corrections in the history/);
    await expect(foot).toContainText(`${shown} of `);
    // The total has to exceed what is printed, or the section is quietly
    // implying the list is complete when it is the most recent page of it.
    const text = (await foot.textContent()) ?? '';
    const total = Number(text.match(/of (\d+) corrections/)?.[1] ?? 0);
    expect(total).toBeGreaterThan(shown);
  });
});
