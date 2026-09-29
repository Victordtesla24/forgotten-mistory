import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';

const PROD = process.env.PLAYWRIGHT_BASE_URL || 'https://forgotten-mistory.web.app/';

test('footer provenance exposes PDF MD5, build stamp, and one synthetic disclaimer', async ({ page, request }) => {
  await page.goto(PROD, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => undefined);

  const footer = page.locator('footer');
  await expect(footer).toBeVisible();
  const footerText = (await footer.innerText()).replace(/\s+/g, ' ').trim();

  const pdfLinks = footer.locator('a[href*=".pdf" i]');
  expect(await pdfLinks.count(), 'footer must link the PDF whose MD5 is disclosed').toBeGreaterThan(0);
  const pdfHref = await pdfLinks.first().getAttribute('href');
  const pdfUrl = new URL(pdfHref!, page.url()).toString();
  const pdfResponse = await request.get(pdfUrl);
  expect(pdfResponse.ok(), `PDF request must succeed: ${pdfUrl}`).toBeTruthy();
  const md5 = createHash('md5').update(await pdfResponse.body()).digest('hex');
  expect(footerText, 'footer must include the full computed MD5 of its PDF').toContain(md5);

  const metaBuildStamp = await page.locator('meta[name*="build" i], meta[property*="build" i]').first().getAttribute('content');
  expect(metaBuildStamp, 'page must expose a build stamp meta content value').toBeTruthy();
  expect(footerText, 'footer build stamp must equal the page meta build stamp').toContain(metaBuildStamp!);

  const syntheticCount = (footerText.match(/synthetic/gi) ?? []).length;
  expect(syntheticCount, 'footer text must contain “synthetic” exactly once').toBe(1);
});
