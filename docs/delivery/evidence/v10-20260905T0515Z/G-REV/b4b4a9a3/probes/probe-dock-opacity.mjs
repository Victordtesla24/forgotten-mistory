// rev-b4b4a9a3-c23 — G-NEW-1: is the Ask Mini Vic pill actually visible at 390,
// or does .minivic-dock stay opacity:0? Sampled across the whole scroll range.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import { writeFileSync } from 'node:fs';
const OUT = '/root/.claude/jobs/4e543924/tmp';
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const out = {};

for (const w of [390, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto('https://forgotten-mistory.web.app/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2000);

  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const samples = [];
  for (const frac of [0, 0.05, 0.15, 0.3, 0.5, 0.7, 0.9, 1.0]) {
    await page.evaluate((f) => window.scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * f)), frac);
    await page.waitForTimeout(1200); // let the 300ms opacity transition settle
    const s = await page.evaluate(() => {
      const dock = document.querySelector('.minivic-dock');
      const pill = document.querySelector('.minivic-launcher__pill');
      const dcs = dock ? getComputedStyle(dock) : null;
      const r = pill ? pill.getBoundingClientRect() : null;
      const sec = Array.from(document.querySelectorAll('section[id]')).find((s) => {
        const b = s.getBoundingClientRect();
        return b.top <= innerHeight / 2 && b.bottom >= innerHeight / 2;
      });
      return {
        scrollY: Math.round(scrollY),
        section: sec ? sec.id : '(between)',
        dockOpacity: dcs ? dcs.opacity : null,
        dockDisplay: dcs ? dcs.display : null,
        dockPointerEvents: dcs ? dcs.pointerEvents : null,
        pillText: pill ? pill.textContent.trim() : null,
        pillRect: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
        pillInViewport: r ? r.top < innerHeight && r.bottom > 0 : false,
      };
    });
    samples.push(s);
  }
  out[`w${w}`] = { totalScroll: total, samples };

  // Screenshot at the first scroll position where the dock is opaque (or the last if never)
  const opaque = samples.find((s) => Number(s.dockOpacity) > 0.9) || samples[samples.length - 1];
  await page.evaluate((y) => window.scrollTo(0, y), opaque.scrollY);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/dock-${w}-scroll${opaque.scrollY}.png` });
  out[`w${w}`].screenshotAt = opaque;
  await ctx.close();
}
await browser.close();
writeFileSync(`${OUT}/probe-dock-opacity.json`, JSON.stringify(out, null, 2));
for (const k of Object.keys(out)) {
  console.log(`### ${k} (totalScroll=${out[k].totalScroll})`);
  for (const s of out[k].samples) {
    console.log(`  y=${String(s.scrollY).padStart(6)} sec=${(s.section || '').padEnd(11)} dockOpacity=${s.dockOpacity} pointerEvents=${s.dockPointerEvents} pillInVP=${s.pillInViewport} rect=${JSON.stringify(s.pillRect)}`);
  }
}
