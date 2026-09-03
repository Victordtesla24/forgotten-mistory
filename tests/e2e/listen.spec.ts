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

  test('TC-LISTEN-02: under sixty-five words of copy, excluding the colophon', async ({ page }) => {
    const words = await page.evaluate(() => {
      const section = document.querySelector('#listen')!;
      const colophon = section.lastElementChild!;
      return (section.textContent!.replace(colophon.textContent!, '')).trim().split(/\s+/).length;
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
