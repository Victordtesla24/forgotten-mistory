// Which child of the hero's .inner grows late? Samples every child's box every
// 100 ms on a 6x-throttled 390x844 phone and prints the first sample where any of
// them changes height, next to the first sample taken.
import { chromium } from '@playwright/test';

const BASE = process.env.PROBE_BASE_URL || 'http://127.0.0.1:5601';
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, baseURL: BASE });
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 6 });
await page.addInitScript(() => {
  window.__samples = [];
  const sample = () => {
    const inner = document.querySelector('[class*="Hero_inner"]');
    if (!inner) return;
    const rows = [...inner.children].map((el) => {
      const r = el.getBoundingClientRect();
      return `${el.tagName.toLowerCase()}.${String(el.className).split(' ')[0]}=${r.height.toFixed(1)}`;
    });
    const fonts = document.fonts ? document.fonts.status : 'n/a';
    window.__samples.push({
      t: Math.round(performance.now()),
      inner: +inner.getBoundingClientRect().height.toFixed(1),
      fonts,
      rows,
    });
  };
  const tick = () => {
    sample();
    if (performance.now() < 8000) setTimeout(tick, 100);
  };
  document.addEventListener('DOMContentLoaded', tick);
});
await page.goto('/', { waitUntil: 'load' });
await page.waitForTimeout(6000);
const samples = await page.evaluate(() => window.__samples);
const first = samples[0];
console.log(`first  t=${first.t} inner=${first.inner} fonts=${first.fonts}\n  ${first.rows.join('\n  ')}`);
let prev = first;
for (const s of samples) {
  if (s.inner !== prev.inner) {
    console.log(`\nCHANGE t=${s.t} inner ${prev.inner} -> ${s.inner} fonts=${prev.fonts} -> ${s.fonts}`);
    for (let i = 0; i < Math.max(s.rows.length, prev.rows.length); i += 1) {
      if (s.rows[i] !== prev.rows[i]) console.log(`   ${prev.rows[i]}  ->  ${s.rows[i]}`);
    }
    prev = s;
  }
}
const last = samples[samples.length - 1];
console.log(`\nlast   t=${last.t} inner=${last.inner} fonts=${last.fonts}\n  ${last.rows.join('\n  ')}`);
await browser.close();
