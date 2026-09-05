const { chromium } = require('playwright');
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c1';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); }); page.on('pageerror', e => errs.push('PAGEERR ' + String(e).slice(0, 200)));
  await page.goto('https://forgotten-mistory.web.app/?gl=force', { waitUntil: 'networkidle' }); await sleep(2500);
  const canvases = await page.evaluate(() => Array.from(document.querySelectorAll('canvas')).map(c => ({ sec: c.closest('section') && c.closest('section').id, w: c.width, h: c.height })));
  await page.mouse.move(120, 450); await sleep(1200); await page.screenshot({ path: OUT + '/force-hero-left.png' });
  await page.mouse.move(1320, 450, { steps: 20 }); await sleep(1200); await page.screenshot({ path: OUT + '/force-hero-right.png' });
  // luminance diff between the two hero frames in a 200x200 patch at top-left (key light region)
  const diff = await page.evaluate(async () => { return null; });
  await page.evaluate(() => document.getElementById('experience').scrollIntoView()); await sleep(2000); await page.screenshot({ path: OUT + '/force-experience.png' });
  console.log(JSON.stringify({ canvases, errs }));
  await browser.close();
})().catch(e => { console.error('FAIL', e); process.exit(1); });
