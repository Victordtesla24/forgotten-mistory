// R-c13 merge lens, pass 2 — on the post-hotfix live build:
// how many signature WebGL scenes actually mount with GL available (R2), per section, after scrolling.
// Plus the 1280 capture the task's screenshot gate requires.
import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = 'https://forgotten-mistory.web.app/';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/R-c13';
const SECTIONS = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];
const out = { startedAt: new Date().toISOString() };

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
try {
  // ?gl=force, scroll every section, count canvases as they mount
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const ce = [], pe = [];
  page.on('console', (m) => { if (m.type() === 'error') ce.push(m.text().slice(0, 200)); });
  page.on('pageerror', (e) => pe.push(String(e).slice(0, 200)));
  await page.goto(URL + '?gl=force', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1800);
  out.build = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.getAttribute('content'));

  const walk = [];
  for (const id of SECTIONS) {
    await page.evaluate((i) => document.getElementById(i)?.scrollIntoView({ block: 'center' }), id);
    await page.waitForTimeout(1600);
    const snap = await page.evaluate((SECS) => {
      const per = {};
      for (const s of SECS) {
        const el = document.getElementById(s);
        per[s] = el ? { canvas: el.querySelectorAll('canvas').length, svg: el.querySelectorAll('svg').length } : null;
      }
      return { per, total: document.querySelectorAll('canvas').length };
    }, SECTIONS);
    walk.push({ scrolledTo: id, ...snap });
  }
  out.glForceWalk = walk;
  out.glForceFinal = walk[walk.length - 1];
  out.consoleErrors = ce.slice(0, 6);
  out.consoleErrorCount = ce.length;
  out.pageErrors = pe.slice(0, 4);

  // fps sample over 3 s at the hero (the one mounted scene)
  await page.evaluate(() => document.getElementById('hero')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(700);
  out.fpsHero = await page.evaluate(() => new Promise((res) => {
    const t = []; let last = performance.now(); const start = last;
    const tick = (now) => { t.push(now - last); last = now; if (now - start < 3000) requestAnimationFrame(tick); else {
      const s = t.slice(1).sort((a, b) => a - b);
      res({ frames: s.length, medianDelta: +s[Math.floor(s.length / 2)].toFixed(2), p95: +s[Math.floor(s.length * 0.95)].toFixed(2) });
    } };
    requestAnimationFrame(tick);
  }));

  // #experience visualisation inventory on the GL path
  out.experienceGL = await page.evaluate(() => {
    const e = document.getElementById('experience');
    if (!e) return null;
    const bars = [...e.querySelectorAll('[class*="trackBar" i]')].map((b) => +b.getBoundingClientRect().width.toFixed(1));
    const slot = e.querySelector('[class*="chartScene" i]');
    return {
      canvas: e.querySelectorAll('canvas').length, svg: e.querySelectorAll('svg').length,
      barCount: bars.length, barsWithWidth: bars.filter((w) => w > 0).length,
      sceneSlotBg: slot ? getComputedStyle(slot).backgroundImage : null,
    };
  });
  await ctx.close();

  // 1280 capture (screenshot gate) on the default path
  const c2 = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const p2 = await c2.newPage();
  await p2.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  await p2.waitForTimeout(1500);
  await p2.screenshot({ path: `${OUT}/capture/merge-1280x800-hero.png` });
  await p2.evaluate(() => document.getElementById('listen')?.scrollIntoView({ block: 'center' }));
  await p2.waitForTimeout(1200);
  await p2.screenshot({ path: `${OUT}/capture/merge-1280x800-listen.png` });
  out.cap1280 = await p2.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth,
    listenCTAs: [...document.querySelectorAll('#listen a,#listen button')].filter((e) => getComputedStyle(e).backgroundColor !== 'rgba(0, 0, 0, 0)').length,
  }));
  await c2.close();
} finally {
  await browser.close();
}
out.finishedAt = new Date().toISOString();
fs.writeFileSync(`${OUT}/merge-probe2.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 3000));
