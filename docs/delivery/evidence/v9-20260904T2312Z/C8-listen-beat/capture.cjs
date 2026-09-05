// C8 — the caliper closes. Captures #listen mid-beat and settled, at 1440 and 390,
// plus the reduced-motion final state at 1440. Run against the served static export.
const { chromium } = require('/root/forgotten-mistory/node_modules/@playwright/test');
const path = require('node:path');

const BASE = process.env.BASE || 'http://127.0.0.1:5605/';
const OUT = path.join(__dirname, 'screens');

async function clipOf(page, selector) {
  return page.locator(selector).evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      width: el.offsetWidth,
      height: el.offsetHeight,
    };
  });
}

async function boot(browser, width, height, reduced) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(BASE, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(400);
  await page.addStyleTag({ content: 'body > nav, #site-nav-overlay { visibility: hidden !important; }' });
  return { context, page };
}

async function run(browser, width, height, tag, reduced) {
  const { context, page } = await boot(browser, width, height, reduced);
  const armedBefore = await page.locator('#listen').getAttribute('data-armed');
  const closedBefore = await page.locator('#listen').getAttribute('data-closed');
  await page.locator('#listen').evaluate((el) => el.scrollIntoView({ block: 'start' }));
  const t0 = Date.now();
  await page.waitForFunction(() => document.querySelector('#listen')?.hasAttribute('data-closed'), null, {
    timeout: 5000,
  });
  const tClosed = Date.now();
  const clip = await clipOf(page, '#listen');
  if (!reduced) {
    const wait = Math.max(0, 600 - (Date.now() - tClosed));
    await page.waitForTimeout(wait);
    await page.screenshot({ path: path.join(OUT, `listen-${tag}-mid-600ms.png`), fullPage: true, clip });
    const mid = Date.now() - tClosed;
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(OUT, `listen-${tag}-settled.png`), fullPage: true, clip });
    console.log(
      JSON.stringify({
        tag,
        armedBefore: armedBefore !== null,
        closedBefore: closedBefore !== null,
        msToClosed: tClosed - t0,
        midCapturedAtMs: mid,
      }),
    );
  } else {
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, `listen-${tag}-reduced-motion.png`), fullPage: true, clip });
    console.log(JSON.stringify({ tag, reduced: true, msToClosed: tClosed - t0 }));
  }
  const geometry = await page.locator('#listen svg[data-caliper]').evaluate((svg) => {
    const half = getComputedStyle(svg).getPropertyValue('--caliper-half');
    const tx = (s) => getComputedStyle(svg.querySelector(s)).transform;
    return {
      half,
      left: tx('[data-jaw="left"]'),
      right: tx('[data-jaw="right"]'),
      width: svg.getBoundingClientRect().width,
    };
  });
  console.log(JSON.stringify({ tag, geometry }));
  await context.close();
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  try {
    await run(browser, 1440, 900, '1440', false);
    await run(browser, 390, 844, '390', false);
    await run(browser, 1440, 900, '1440', true);
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
