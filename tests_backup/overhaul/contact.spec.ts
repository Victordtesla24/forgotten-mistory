import { test, expect, type Page } from '@playwright/test';

/**
 * TC-FR-CONTACT — #contact exposes a booking/interview CTA (resolves) AND an
 * in-section CV download (200, PDF), alongside the direct email/phone channels.
 * (FR-CONTACT / NN-1)
 */

async function gotoHome(page: Page) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.count()) {
    await pre.first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined);
  }
}

test.describe('TC-FR-CONTACT — contact completion', () => {
  test.describe.configure({ timeout: 90000 });

  test('booking CTA + CV download + direct channels resolve', async ({ page, request }) => {
    await gotoHome(page);
    const contact = page.locator('#contact');
    await expect(contact).toHaveCount(1);

    // Booking CTA present with an actionable href (https scheduling endpoint or mailto fallback).
    const booking = contact.getByRole('link', { name: /book a conversation/i });
    await expect(booking).toBeVisible();
    const bookingHref = await booking.getAttribute('href');
    expect(bookingHref).toMatch(/^(https?:|mailto:)/);

    // In-section CV download resolves 200 as a PDF.
    const cv = contact.getByRole('link', { name: /download cv/i });
    await expect(cv).toBeVisible();
    const cvHref = await cv.getAttribute('href');
    expect(cvHref).toContain('Vik_Resume_Final.pdf');
    const res = await request.get(new URL(cvHref!, page.url()).toString());
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type'] ?? '').toContain('pdf');

    // Direct channels still present.
    await expect(contact.locator('a[href^="mailto:"]').first()).toBeVisible();
    await expect(contact.locator('a[href^="tel:"]').first()).toBeVisible();
  });
});
