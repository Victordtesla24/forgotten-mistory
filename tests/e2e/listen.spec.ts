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
    // the coffee line — and not on the avatar module or the colophon. Those two
    // have their own contracts: the avatar's words are a disclosure that has to
    // be there, and shrinking a disclosure to protect a word budget would be
    // the wrong trade every time.
    const words = await page.evaluate(() => {
      const section = document.querySelector('#listen')!;
      const clone = section.cloneNode(true) as HTMLElement;
      clone.querySelector('figure')?.remove();
      clone.lastElementChild?.remove();
      return clone.textContent!.trim().split(/\s+/).length;
    });
    // The emptiest screen on the site, immediately after the densest.
    expect(words).toBeLessThanOrEqual(65);
  });

  test('TC-LISTEN-07: the avatar states what it is before it is played', async ({ page }) => {
    // The disclosure is visible text next to the play control, not a tooltip,
    // not a footnote, and not something you only learn by watching. A synthetic
    // face on a site whose argument is "check my claims" has to say so first.
    const figure = page.locator(`${LISTEN} figure`);
    await expect(figure).toContainText('AI-generated');
    await expect(figure).toContainText('my photograph');
    await expect(figure).toContainText('my cloned voice');
    await expect(figure).toContainText('Nothing else on this site is synthetic');
    // Nothing has been fetched yet: at rest it is a poster and a button.
    await expect(figure.locator('video')).toHaveCount(0);
  });

  test('TC-LISTEN-08: the clip has a text alternative that needs no playback', async ({ page }) => {
    // Located by what it controls, not by its label: the label flips to "Hide
    // transcript" on the first click, and a text-filtered locator stops matching
    // the element it just operated on.
    const toggle = page.locator(`${LISTEN} button[aria-controls="avatar-transcript"]`);
    await expect(toggle).toBeVisible();
    await expect(toggle).toContainText('Read it instead');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const transcript = page.locator('#avatar-transcript');
    await expect(transcript).toBeVisible();
    await expect(transcript).toContainText('Hello. I');
    await expect(transcript).toContainText('rendered by a model');
    // And it says how it was made, down to the model that made it.
    await expect(transcript).toContainText('OmniHuman');
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
