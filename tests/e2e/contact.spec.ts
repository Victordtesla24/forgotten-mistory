import { test, expect, type Page } from '@playwright/test';

/**
 * Category 1: E2E — Contact Section
 * Verifies contact form elements and links from siteContent.ts.
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  // Match hero suite: click Skip, then force-remove if the wipe stalls.
  await page.evaluate(() => {
    const skip = document.querySelector('button.preloader-skip') as HTMLButtonElement | null;
    skip?.click();
    document.querySelector('.preloader')?.remove();
  }).catch(() => {});
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
