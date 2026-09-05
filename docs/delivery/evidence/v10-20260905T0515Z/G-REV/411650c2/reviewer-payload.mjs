#!/usr/bin/env node
/** G-REV — capture the live send payload verbatim, to test "no provider/model". */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const SITE = 'https://forgotten-mistory.web.app';
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const bodies = [];
page.on('request', (r) => {
  const u = r.url();
  if ((u.includes('minivicchat-hjdyjsrzvq') || u.includes('/api/chat')) && r.method() === 'POST') {
    bodies.push({ url: u, headers: r.headers()['content-type'] || null, body: r.postData() });
  }
});
await page.goto(SITE, { waitUntil: 'domcontentloaded' });
await page.waitForFunction(
  () => {
    const x = document.querySelector('[data-testid="minivic-toggle"]');
    return x && Object.keys(x).some((k) => k.startsWith('__react'));
  },
  { timeout: 60000 },
);
await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
await page.waitForTimeout(400);
await page.locator('[data-testid="minivic-toggle"]').evaluate((e) => e.click());
const panel = page.locator('[data-testid="minivic-panel"]');
await panel.waitFor({ state: 'visible', timeout: 30000 });
const mute = panel.getByRole('button', { name: 'Mute voice' });
if (await mute.count()) await mute.click();
await panel.locator('[data-testid="minivic-input"]').fill('What did Vikram do at the ATO?');
await panel.locator('[data-testid="minivic-input"]').press('Enter');
await page.waitForTimeout(6000);
writeFileSync('05-payload.json', `${JSON.stringify(bodies, null, 2)}\n`);
console.log(JSON.stringify(bodies, null, 2).slice(0, 2500));
await browser.close();
