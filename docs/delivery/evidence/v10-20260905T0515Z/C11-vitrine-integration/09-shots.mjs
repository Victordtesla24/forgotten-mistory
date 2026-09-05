import { chromium } from '@playwright/test';
import fs from 'node:fs';

const BASE = 'http://127.0.0.1:5602';
const DIR = 'docs/delivery/evidence/v10-20260905T0515Z/C11-vitrine-integration/09-verify-screens';
fs.mkdirSync(DIR, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });

for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${DIR}/hero-${w}.png`, animations: 'disabled' });
  await page.locator('#vitrine').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  await page.locator('#vitrine').screenshot({ path: `${DIR}/vitrine-${w}.png`, animations: 'disabled' });
  await ctx.close();
  console.log(`captured ${w}`);
}
await browser.close();
