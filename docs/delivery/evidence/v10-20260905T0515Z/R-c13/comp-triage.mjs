import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/R-c13';
const urls = ['https://forgotten-mistory.web.app/', 'https://forgotten-mistory.web.app/?gl=force'];
(async () => {
  const b = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const res = [];
  for (const u of urls) {
    for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const ctx = await b.newContext({ viewport: vp });
      const page = await ctx.newPage();
      const errs = [], cons = [];
      page.on('pageerror', (e) => errs.push(String(e && e.stack || e).slice(0, 700)));
      page.on('console', (m) => { if (m.type() === 'error') cons.push(m.text().slice(0, 400)); });
      await page.goto(u, { waitUntil: 'load', timeout: 60000 });
      await page.waitForTimeout(4000);
      const d = await page.evaluate(() => ({
        build: document.querySelector('meta[name="build-commit"]')?.content || null,
        secIds: [...document.querySelectorAll('section')].map((s) => s.id || '(none)'),
        h1: document.querySelector('h1')?.innerText?.slice(0, 60) || null,
        bodyText: (document.body.innerText || '').slice(0, 260),
        errorBoundary: /Something went wrong|SYSTEM INTERRUPT/i.test(document.body.innerText || ''),
        mainChildren: document.querySelector('main')?.children?.length ?? -1,
      }));
      res.push({ url: u, vp: vp.width, ...d, pageerrors: errs, consoleErrors: cons });
      await ctx.close();
    }
  }
  // second-load check (does a reload recover?)
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  const reloads = [];
  for (let i = 0; i < 3; i++) {
    await p.goto('https://forgotten-mistory.web.app/', { waitUntil: 'load', timeout: 60000 });
    await p.waitForTimeout(3500);
    reloads.push(await p.evaluate(() => ({ boundary: /Something went wrong/i.test(document.body.innerText || ''), sections: document.querySelectorAll('section').length })));
  }
  await ctx.close(); await b.close();
  fs.writeFileSync(OUT + '/composition-triage.json', JSON.stringify({ res, reloads }, null, 2));
  console.log(JSON.stringify({ res: res.map((r) => ({ u: r.url, vp: r.vp, build: r.build, boundary: r.errorBoundary, secs: r.secIds, h1: r.h1, pe: r.pageerrors.slice(0, 2), ce: r.consoleErrors.slice(0, 3) })), reloads }, null, 2));
})();
