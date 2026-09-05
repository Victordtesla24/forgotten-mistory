// Cycle 7 evidence capture: the whole page at 1440 and each section at 390.
import { chromium } from 'playwright';
const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5607/';
const OUT = new URL('./screens/', import.meta.url).pathname;
const SECTIONS = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const settle = async (page) => {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(async () => { const H = document.body.scrollHeight; for (let y = 0; y < H; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(1200);
};
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await settle(page);
  await page.screenshot({ path: `${OUT}1440-full-page.png`, fullPage: true });
  await page.locator('[data-testid="minivic-toggle"]').evaluate((el) => el.click());
  await page.waitForTimeout(700);
  await page.screenshot({ path: `${OUT}1440-minivic-open.png` });
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await settle(page);
  await page.screenshot({ path: `${OUT}390-hero-first-screen.png` });
  for (const id of SECTIONS) {
    await page.locator(`#${id}`).screenshot({ path: `${OUT}390-${id}.png` });
  }
  await ctx.close();
}
await browser.close();
console.log('captured');
