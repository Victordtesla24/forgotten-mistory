/**
 * S4 evidence shooter — the fold at the brief's four viewports on both paths.
 *
 * One browser, one page at a time (host constraint: srv1356245, 4 cores, swap
 * saturated). Boots exactly the way `scripts/validate/hero_plane_dominance.mjs`
 * `preparePage` does, so the frame photographed here is the frame the SPD
 * instrument measured.
 *
 *   node docs/delivery/evidence/.../shoot.mjs http://127.0.0.1:5610
 */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = process.argv[2] || 'http://127.0.0.1:5610';
const OUT = dirname(fileURLToPath(import.meta.url));

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 834, height: 1194 },
  { width: 390, height: 844 },
];
const PATHS = [
  { id: 'gl', url: '/?gl=force', reducedMotion: false },
  { id: 'reduced', url: '/', reducedMotion: true },
];

const browser = await chromium.launch({
  channel: 'chrome',
  args: [
    '--no-sandbox',
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--disable-lcd-text',
  ],
});

for (const viewport of VIEWPORTS) {
  for (const route of PATHS) {
    const ctx = await browser.newContext({
      viewport,
      deviceScaleFactor: 1,
      reducedMotion: route.reducedMotion ? 'reduce' : 'no-preference',
    });
    const page = await ctx.newPage();
    await page.goto(new URL(route.url, BASE).toString(), { waitUntil: 'domcontentloaded' });
    const preloader = page.locator('.preloader');
    if (await preloader.isVisible().catch(() => false)) {
      const skip = page.locator('button.preloader-skip');
      if (await skip.isVisible().catch(() => false)) await skip.click({ timeout: 5000 }).catch(() => {});
      await preloader.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    }
    await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 20000 });
    await page
      .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
      .catch(() => {});
    if (route.reducedMotion) {
      await page.waitForTimeout(1500);
    } else {
      await page
        .locator('[data-scene="hero-atmosphere"] canvas')
        .waitFor({ state: 'attached', timeout: 30000 });
      await page.waitForTimeout(3000);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(100);
    const canvases = await page.locator('#hero canvas').count();
    const proofTop = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="hero-proof"]');
      return el ? Math.round(el.getBoundingClientRect().top) : null;
    });
    const name = `fold-${viewport.width}x${viewport.height}-${route.id}.png`;
    await page.screenshot({ path: join(OUT, name), fullPage: false });
    // eslint-disable-next-line no-console
    console.log(
      `${name}  canvases=${canvases}  proof.top=${proofTop} (innerHeight ${viewport.height})`,
    );
    await ctx.close();
  }
}
await browser.close();
