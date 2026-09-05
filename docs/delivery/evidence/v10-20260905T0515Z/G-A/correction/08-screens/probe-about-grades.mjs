import { chromium } from '@playwright/test';

const OUT = process.argv[2];
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.goto('http://127.0.0.1:5614/', { waitUntil: 'domcontentloaded' });
await page.locator('#about').scrollIntoViewIfNeeded();
await page.waitForTimeout(2500);
await page.locator('#about').screenshot({ path: `${OUT}/1440-about.png` });
const graded = await page.$$eval('#about p[class*="evidence"]', (nodes) =>
  nodes.map((n) => ({
    sourced: n.getAttribute('data-sourced'),
    color: getComputedStyle(n).color,
    text: (n.textContent || '').trim().slice(0, 60),
  })),
);
console.log(JSON.stringify({ pageerrors: errors, graded }, null, 2));
await browser.close();
