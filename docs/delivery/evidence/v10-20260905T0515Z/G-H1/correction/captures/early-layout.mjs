/**
 * early-layout.mjs — what the page measures in its first second.
 *
 * The 1440x900 cold load that produced CLS 0.15556 named FOOTER as the only
 * shift source, moving from y=24 (i.e. directly under the nav, with nothing
 * above it) to off-viewport. This samples the document every 60 ms from commit
 * so the frame where #hero has no height is visible rather than inferred.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:5616';
const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const client = await ctx.newCDPSession(page);
await client.send('Network.enable');
await client.send('Network.emulateNetworkConditions', {
  offline: false, latency: 120, downloadThroughput: 400_000, uploadThroughput: 200_000,
});
await client.send('Emulation.setCPUThrottlingRate', { rate: 6 });

await page.addInitScript(() => {
  window.__samples = [];
  const tick = () => {
    if (!document.body) { setTimeout(tick, 20); return; }
    const hero = document.querySelector('#hero');
    const footer = document.querySelector('footer');
    const main = document.querySelector('main');
    window.__samples.push({
      t: Math.round(performance.now()),
      heroH: hero ? Math.round(hero.getBoundingClientRect().height) : null,
      mainH: main ? Math.round(main.getBoundingClientRect().height) : null,
      footerY: footer ? Math.round(footer.getBoundingClientRect().top) : null,
      sheets: document.styleSheets.length,
      bodyH: Math.round(document.body.getBoundingClientRect().height),
    });
    if (performance.now() < 5000) setTimeout(tick, 60);
  };
  tick();
});
await page.goto(BASE + '/', { waitUntil: 'commit' });
await page.waitForTimeout(6000);
console.log(JSON.stringify(await page.evaluate(() => window.__samples), null, 0));
await browser.close();
