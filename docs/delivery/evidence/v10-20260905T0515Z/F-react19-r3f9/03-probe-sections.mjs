import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5603';
const ARGS = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

const browser = await chromium.launch({ channel: 'chrome', args: ARGS });
const out = {};

for (const [label, viewport] of [
  ['1440x900', { width: 1440, height: 900 }],
  ['390x844', { width: 390, height: 844 }],
]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(4000);
  const hero = await page.locator('#hero canvas').count();

  const perSection = {};
  for (const id of ['about', 'experience']) {
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(6000);
    perSection[id] = await page.locator(`#${id} canvas`).count();
  }
  out[label] = { heroCanvas: hero, perSection, pageErrors, consoleErrors };
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(out, null, 2));
