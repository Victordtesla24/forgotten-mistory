/** Fold screenshots at the four reference viewports, clipped to the first screen. */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:5616';
const OUT = 'docs/delivery/evidence/v10-20260905T0515Z/G-H1/correction/08-screens';
const VPS = [[1440, 900], [1280, 800], [834, 1194], [390, 844]];

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
for (const [w, h] of VPS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${OUT}/hero-fold-${w}x${h}.png` });
  await page.evaluate(() => {
    document.querySelector('[data-testid="hero-proof"]')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}/hero-proof-${w}x${h}.png` });
  await ctx.close();
  console.log(`${w}x${h} captured`);
}
await browser.close();
