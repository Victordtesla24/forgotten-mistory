// Cycle 7 evidence probe: spine edges at five widths, the 390x844 hero fold and
// jaws, the Experience chart's right edge, and the MiniVic panel geometry.
import { chromium } from 'playwright';
const URL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5607/';
const SPINE = ['#hero h1', '#about h2', '#experience h2', '#skills h2', '#vitrine h2', '#listen h2'];
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const R = { spine: {}, hero390: null, experience: {}, minivic: null };
for (const [w, h] of [[390, 844], [834, 1194], [1280, 800], [1440, 900], [1920, 1080]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  await page.evaluate(async () => { const H = document.body.scrollHeight; for (let y = 0; y < H; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); });
  R.spine[w] = await page.evaluate((sel) => sel.map(s => Math.round(document.querySelector(s).getBoundingClientRect().left * 10) / 10), SPINE);
  if (w === 390) {
    R.hero390 = await page.evaluate(() => {
      const jaws = [...document.querySelectorAll('#hero ul li [data-state] > span[aria-hidden="true"]:nth-child(3)')].map(e => Math.round(e.getBoundingClientRect().left * 10) / 10);
      const a = document.querySelector('#hero a[href="#experience"]').getBoundingClientRect();
      const cv = document.querySelector('#hero a[href$=".pdf"]')?.getBoundingClientRect();
      const hero = document.querySelector('#hero').getBoundingClientRect();
      return { jaws, evidenceBottom: Math.round(a.bottom), cvBottom: cv ? Math.round(cv.bottom) : null, heroHeight: Math.round(hero.height) };
    });
  }
  if (w >= 1280) {
    R.experience[w] = await page.evaluate(() => {
      const sec = document.querySelector('#experience'); const cs = getComputedStyle(sec); const r = sec.getBoundingClientRect();
      const spineRight = r.right - parseFloat(cs.paddingRight);
      const readouts = [...document.querySelectorAll('#experience ol li button span span span')].map(e => Math.round(e.getBoundingClientRect().right * 10) / 10);
      const rows = [...document.querySelectorAll('#experience ol li button')].map(e => Math.round(e.getBoundingClientRect().right * 10) / 10);
      return { spineRight, maxReadoutRight: Math.max(...readouts), maxRowRight: Math.max(...rows) };
    });
  }
  if (w === 1440) {
    await page.locator('[data-testid="minivic-toggle"]').evaluate((el) => el.click());
    await page.waitForTimeout(600);
    R.minivic = await page.evaluate(() => {
      const p = document.querySelector('[data-testid="minivic-panel"]').getBoundingClientRect();
      const t = document.querySelector('[data-testid="minivic-toggle"]').getBoundingClientRect();
      const h1 = document.querySelector('#hero h1').getBoundingClientRect();
      return { panel: [p.left, p.top, p.right, p.bottom].map(Math.round), toggle: [t.left, t.top, t.right, t.bottom].map(Math.round), h1: [h1.left, h1.top, h1.right, h1.bottom].map(Math.round) };
    });
  }
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(R, null, 1));
