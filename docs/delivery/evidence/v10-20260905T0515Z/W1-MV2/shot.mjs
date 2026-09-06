// First-fold proof: a real, hit-tested mouse click on the launcher opens the
// panel at 1440x900 and 390x844, with no scrolling. Writes one closed and one
// open screenshot per width plus a JSON record of the hit test.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const BASE = process.env.PROBE_BASE_URL || 'http://127.0.0.1:5619';
const OUT = new URL('.', import.meta.url).pathname;

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});
const record = [];

for (const vp of [
  { tag: '1440', width: 1440, height: 900 },
  { tag: '390', width: 390, height: 844 },
]) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  const pageerrors = [];
  page.on('pageerror', (e) => pageerrors.push(String(e)));
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="minivic-toggle"]');
      return !!btn && Object.keys(btn).some((k) => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
    },
    { timeout: 30000 },
  );
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/05-firstfold-closed-${vp.tag}.png` });
  const dockOpacityAtRest = await page.evaluate(() => {
    const d = document.querySelector('.minivic-dock');
    return d ? getComputedStyle(d).opacity : null;
  });

  const box = await page.locator('[data-testid="minivic-launcher-label"]').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const hit = await page.evaluate(
    ([x, y]) => {
      const el = document.elementFromPoint(x, y);
      const toggle = document.querySelector('[data-testid="minivic-toggle"]');
      return {
        tag: el ? el.tagName.toLowerCase() : null,
        cls: el ? String(el.className ?? '') : null,
        inLauncher: !!(el && toggle && (el === toggle || toggle.contains(el))),
      };
    },
    [cx, cy],
  );

  await page.mouse.click(cx, cy);
  await page.locator('[data-testid="minivic-panel"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/06-firstfold-open-${vp.tag}.png` });

  record.push({
    tag: vp.tag,
    viewport: `${vp.width}x${vp.height}`,
    at: new Date().toISOString(),
    pillBox: box,
    clickPoint: { x: cx, y: cy },
    elementFromPoint: hit,
    panelVisible: await page.locator('[data-testid="minivic-panel"]').isVisible(),
    scrollY: await page.evaluate(() => window.scrollY),
    pillDisplay: await page
      .locator('[data-testid="minivic-launcher-label"]')
      .evaluate((el) => getComputedStyle(el).display),
    dockOpacityAtRest,
    dockOpacityWithPanelOpen: await page.evaluate(() => {
      const d = document.querySelector('.minivic-dock');
      return d ? getComputedStyle(d).opacity : null;
    }),
    pageerrors,
  });
  await context.close();
}

await browser.close();
writeFileSync(`${OUT}/07-firstfold-click.json`, `${JSON.stringify(record, null, 2)}\n`);
console.log(JSON.stringify(record, null, 2));
