import { test, expect, type Page } from '@playwright/test';
import { settleBoot } from '../helpers/boot';

/**
 * Category 1: E2E — Contact Section
 * Verifies contact form elements and links from siteContent.ts.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Skip the boot wipe via the component's own control. Never DOM-remove
  // `.preloader` — it is React-owned. See tests/helpers/boot.ts.
  await settleBoot(page);
  await page.locator('#contact').scrollIntoViewIfNeeded();
}

test.describe('E2E: Contact Section', () => {
  test.describe.configure({ timeout: 60000 });

  test('TC-CONTACT-01: Contact section renders with ID and headline', async ({ page }) => {
    await gotoHome(page);
    const section = page.locator('#contact');
    await expect(section).toBeVisible();
    await expect(section).toContainText(
      'Open to Scrum Master / Project Manager roles in Melbourne — and selected AI delivery engagements.',
    );
  });

  test('TC-CONTACT-02: Book a conversation CTA is visible', async ({ page }) => {
    await gotoHome(page);
    const bookBtn = page.locator('#contact a', { hasText: 'Book a conversation' });
    await expect(bookBtn).toBeVisible();
    const href = await bookBtn.getAttribute('href');
    expect(href).toMatch(/^(https?:\/\/|mailto:)/i);
  });

  test('TC-CONTACT-03: Download CV link is visible', async ({ page }) => {
    await gotoHome(page);
    const cvLink = page.locator('#contact a', { hasText: 'Download CV' });
    await expect(cvLink).toBeVisible();
    const href = await cvLink.getAttribute('href');
    expect(href).toMatch(/\/docs\/Vik_Resume_Final\.pdf$/);
  });

  test('TC-CONTACT-04: Email card renders with correct address', async ({ page }) => {
    await gotoHome(page);
    const emailCard = page.locator('.contact-card-value').first();
    await expect(emailCard).toContainText('sarkar.vikram@gmail.com');
  });

  test('TC-CONTACT-05: Phone card renders', async ({ page }) => {
    await gotoHome(page);
    await expect(page.locator('#contact')).toContainText('+61');
    await expect(page.locator('#contact')).toContainText('433');
  });

  test('TC-CONTACT-06: Email link uses mailto protocol', async ({ page }) => {
    await gotoHome(page);
    const mailLink = page.locator('#contact a[href^="mailto:"]');
    await expect(mailLink).toBeAttached();
    const href = await mailLink.getAttribute('href');
    expect(href).toContain('sarkar.vikram@gmail.com');
  });

  test('TC-CONTACT-07: Social links render — GitHub and YouTube', async ({ page }) => {
    await gotoHome(page);
    const contact = page.locator('#contact');
    await expect(contact.locator('a', { hasText: 'GitHub' })).toBeVisible();
    await expect(contact.locator('a', { hasText: 'YouTube' })).toBeVisible();
  });

  test('TC-CONTACT-09: LinkedIn social link renders in contact section (D-CONTACT-01)', async ({ page }) => {
    await gotoHome(page);
    const contact = page.locator('#contact');
    const linkedinLink = contact.locator('a.social-btn', { hasText: 'LinkedIn' });
    await expect(linkedinLink).toBeVisible();
    const href = await linkedinLink.getAttribute('href');
    expect(href).toContain('linkedin.com/in/vikramd-profile');
  });

  test('TC-CONTACT-08: Contact card icons render (Mail and Phone)', async ({ page }) => {
    await gotoHome(page);
    const contactCards = page.locator('.contact-card-icon');
    const count = await contactCards.count();
    expect(count).toBeGreaterThanOrEqual(2);
    await expect(contactCards.first()).toBeVisible();
  });
});

/**
 * D-CONTACT-02 — the message form. Before it existed the page had exactly one
 * <form> (the HiddenTerminal easter egg) and every contact affordance was a bare
 * `mailto:`, which is a silent no-op without a registered mail handler. These
 * tests pin the two things that matter: the form is really there and operable,
 * and the UI never claims a send succeeded unless the endpoint confirmed it.
 */
test.describe('E2E: Contact message form (D-CONTACT-02)', () => {
  test.describe.configure({ timeout: 60000 });

  const CONSOLE = '.contact-console';

  /** JSON body every browser fetch treats as a confirmed delivery. */
  const OK_BODY = { status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) };

  test('TC-CONTACT-10: message form renders inside #contact with all three fields', async ({ page }) => {
    await gotoHome(page);
    const form = page.locator('#contact form.contact-form');
    await expect(form).toBeVisible();
    await expect(form.getByLabel('Your name')).toBeVisible();
    await expect(form.getByLabel('Your email')).toBeVisible();
    await expect(form.getByLabel('Your message')).toBeVisible();
    await expect(form.getByRole('button', { name: 'Send message' })).toBeVisible();
  });

  test('TC-CONTACT-11: labels are associated and fields carry required/autocomplete', async ({ page }) => {
    await gotoHome(page);
    const meta = await page.evaluate(() => {
      const form = document.querySelector('#contact form.contact-form');
      if (!form) return null;
      const fields = Array.from(form.querySelectorAll('input, textarea'));
      return fields.map((el) => {
        const label = el.id ? form.querySelector(`label[for="${el.id}"]`) : null;
        return {
          name: el.getAttribute('name'),
          hasLabel: Boolean(label && (label.textContent || '').trim().length > 0),
          required: el.hasAttribute('required'),
          ariaRequired: el.getAttribute('aria-required'),
          autocomplete: el.getAttribute('autocomplete'),
        };
      });
    });
    expect(meta).not.toBeNull();
    expect(meta).toEqual([
      { name: 'name', hasLabel: true, required: true, ariaRequired: 'true', autocomplete: 'name' },
      { name: 'email', hasLabel: true, required: true, ariaRequired: 'true', autocomplete: 'email' },
      { name: 'message', hasLabel: true, required: true, ariaRequired: 'true', autocomplete: 'off' },
    ]);
  });

  test('TC-CONTACT-12: an invalid email is rejected client-side with aria-describedby error text', async ({ page }) => {
    await gotoHome(page);
    let posted = false;
    await page.route('**/api/contact', async (route) => { posted = true; await route.fulfill(OK_BODY); });

    const form = page.locator('#contact form.contact-form');
    await form.getByLabel('Your name').fill('Dana Recruiter');
    await form.getByLabel('Your email').fill('dana@nowhere');
    await form.getByLabel('Your message').fill('Scrum Master role, Melbourne, starting March.');
    await form.getByRole('button', { name: 'Send message' }).click();

    const email = form.getByLabel('Your email');
    await expect(email).toHaveAttribute('aria-invalid', 'true');
    const describedBy = await email.getAttribute('aria-describedby');
    expect(describedBy).toBe('contact-form-email-error');
    await expect(page.locator(`[id="${describedBy}"]`)).toHaveText(/valid email address/i);
    // Focus is moved to the offending field, and nothing was sent.
    await expect(email).toBeFocused();
    expect(posted).toBe(false);
    await expect(page.locator(CONSOLE)).toHaveAttribute('data-contact-state', 'invalid');
  });

  test('TC-CONTACT-13: a confirmed 2xx moves idle -> submitting -> sent', async ({ page }) => {
    await gotoHome(page);
    await page.route('**/api/contact', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 600));
      await route.fulfill(OK_BODY);
    });

    const console_ = page.locator(CONSOLE);
    await expect(console_).toHaveAttribute('data-contact-state', 'idle');

    const form = page.locator('#contact form.contact-form');
    await form.getByLabel('Your name').fill('Dana Recruiter');
    await form.getByLabel('Your email').fill('dana@example.com');
    await form.getByLabel('Your message').fill('Scrum Master role, Melbourne, starting March.');
    await form.getByRole('button', { name: 'Send message' }).click();

    await expect(console_).toHaveAttribute('data-contact-state', 'submitting');
    await expect(console_).toHaveAttribute('data-contact-state', 'sent');
    const status = page.locator('.contact-form-status');
    await expect(status).toHaveAttribute('aria-live', 'polite');
    await expect(status).toContainText('Message sent.');
  });

  test('TC-CONTACT-14: a 404 endpoint yields a truthful failure, not a fake success', async ({ page }) => {
    await gotoHome(page);
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({ status: 404, contentType: 'text/html', body: '<html>Not Found</html>' });
    });

    const form = page.locator('#contact form.contact-form');
    await form.getByLabel('Your name').fill('Dana Recruiter');
    await form.getByLabel('Your email').fill('dana@example.com');
    await form.getByLabel('Your message').fill('Scrum Master role, Melbourne, starting March.');
    await form.getByRole('button', { name: 'Send message' }).click();

    await expect(page.locator(CONSOLE)).toHaveAttribute('data-contact-state', 'failed');
    const status = page.locator('.contact-form-status');
    await expect(status).not.toContainText('Message sent.');
    await expect(status).toContainText(/unavailable/i);
    // Recovery path: a real clickable draft carrying what was typed.
    const draft = status.locator('a.contact-form-draft');
    await expect(draft).toBeVisible();
    const href = await draft.getAttribute('href');
    expect(href).toContain('mailto:sarkar.vikram@gmail.com');
    expect(href).toContain(encodeURIComponent('Scrum Master role, Melbourne, starting March.'));
    // The typed text is kept so nothing has to be retyped.
    await expect(form.getByLabel('Your message')).toHaveValue('Scrum Master role, Melbourne, starting March.');
  });

  test('TC-CONTACT-15: a 200 that is not a confirmed delivery still fails truthfully', async ({ page }) => {
    await gotoHome(page);
    await page.route('**/api/contact', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: false }) });
    });

    const form = page.locator('#contact form.contact-form');
    await form.getByLabel('Your name').fill('Dana Recruiter');
    await form.getByLabel('Your email').fill('dana@example.com');
    await form.getByLabel('Your message').fill('Scrum Master role, Melbourne.');
    await form.getByRole('button', { name: 'Send message' }).click();

    await expect(page.locator(CONSOLE)).toHaveAttribute('data-contact-state', 'failed');
    await expect(page.locator('.contact-form-status')).not.toContainText('Message sent.');
  });

  test('TC-CONTACT-16: keyboard-only completion works end to end', async ({ page }) => {
    await gotoHome(page);
    await page.route('**/api/contact', async (route) => { await route.fulfill(OK_BODY); });

    const form = page.locator('#contact form.contact-form');
    await form.getByLabel('Your name').focus();
    await page.keyboard.type('Dana Recruiter');
    await page.keyboard.press('Tab');
    await expect(form.getByLabel('Your email')).toBeFocused();
    await page.keyboard.type('dana@example.com');
    await page.keyboard.press('Tab');
    await expect(form.getByLabel('Your message')).toBeFocused();
    await page.keyboard.type('Scrum Master role, Melbourne.');
    await page.keyboard.press('Tab');
    await expect(form.getByRole('button', { name: 'Send message' })).toBeFocused();
    await page.keyboard.press('Enter');

    await expect(page.locator(CONSOLE)).toHaveAttribute('data-contact-state', 'sent');
  });

  test('TC-CONTACT-17: raw email + LinkedIn are always rendered as copyable text', async ({ page }) => {
    await gotoHome(page);
    const direct = page.locator('#contact .contact-direct');
    await expect(direct).toBeVisible();
    await expect(direct).toContainText('sarkar.vikram@gmail.com');
    await expect(direct).toContainText('linkedin.com/in/vikramd-profile');

    await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
    await direct.getByRole('button', { name: 'Copy email address' }).click();
    const liveRegion = page.locator('.contact-copy-status');
    await expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    await expect(liveRegion).toContainText(/copied|selectable/i);
  });

  test('TC-CONTACT-18: reduced-motion renders the form with no send animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await gotoHome(page);
    await expect(page.locator('#contact form.contact-form')).toBeVisible();

    const opacity = await page.evaluate(() => {
      const el = document.querySelector('.contact-console');
      return el ? getComputedStyle(el).opacity : null;
    });
    expect(opacity).toBe('1');

    await page.route('**/api/contact', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) });
    });
    const form = page.locator('#contact form.contact-form');
    await form.getByLabel('Your name').fill('Dana Recruiter');
    await form.getByLabel('Your email').fill('dana@example.com');
    await form.getByLabel('Your message').fill('Scrum Master role, Melbourne.');
    await form.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator(CONSOLE)).toHaveAttribute('data-contact-state', 'submitting');

    const pulse = await page.evaluate(() => {
      const line = document.querySelector('.contact-form-status .contact-form-status-line');
      return line ? getComputedStyle(line, '::before').animationName : null;
    });
    expect(pulse === null || pulse === 'none').toBe(true);
  });
});
