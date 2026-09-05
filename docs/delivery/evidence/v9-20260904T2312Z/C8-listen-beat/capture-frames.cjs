// C8 — deterministic frames of the beat. After #listen arms and closes, every
// animation inside the section is paused and seeked to an exact time on its own
// timeline, so the captured frame is a function of the choreography alone and
// not of machine load. Times are measured from the moment data-closed lands.
const { chromium } = require('/root/forgotten-mistory/node_modules/@playwright/test');
const path = require('node:path');

const BASE = process.env.BASE || 'http://127.0.0.1:5605/';
const OUT = path.join(__dirname, 'screens');
const FRAMES_MS = [0, 200, 600, 1160, 1520, 1880];

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(400);
  await page.addStyleTag({ content: 'body > nav, #site-nav-overlay { visibility: hidden !important; }' });

  await page.locator('#listen').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  await page.waitForFunction(() => document.querySelector('#listen')?.hasAttribute('data-closed'), null, {
    timeout: 5000,
  });
  const clip = await page.locator('#listen').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      width: el.offsetWidth,
      height: el.offsetHeight,
    };
  });

  const found = await page.evaluate(() => {
    const root = document.querySelector('#listen');
    const inside = document.getAnimations().filter((a) => {
      const target = a.effect && a.effect.target;
      return target && root.contains(target);
    });
    for (const a of inside) a.pause();
    return inside.map((a) => ({
      name: a.animationName,
      duration: a.effect.getComputedTiming().duration,
      delay: a.effect.getComputedTiming().delay,
    }));
  });
  console.log(JSON.stringify({ animations: found }));

  for (const ms of FRAMES_MS) {
    const state = await page.evaluate((t) => {
      const root = document.querySelector('#listen');
      for (const a of document.getAnimations()) {
        const target = a.effect && a.effect.target;
        if (target && root.contains(target)) a.currentTime = t;
      }
      const svg = root.querySelector('svg[data-caliper]');
      const tx = (s) => getComputedStyle(svg.querySelector(s)).transform;
      const rule = getComputedStyle(root.querySelector('span[aria-hidden="true"]')).transform;
      return { left: tx('[data-jaw="left"]'), right: tx('[data-jaw="right"]'), rule };
    }, ms);
    await page.waitForTimeout(60);
    await page.screenshot({ path: path.join(OUT, `listen-1440-frame-${String(ms).padStart(4, '0')}ms.png`), fullPage: true, clip });
    console.log(JSON.stringify({ ms, ...state }));
  }

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
