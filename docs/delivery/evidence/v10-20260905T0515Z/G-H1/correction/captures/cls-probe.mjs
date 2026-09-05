/**
 * cls-probe.mjs — cold-load CLS / LCP, three loads per viewport.
 *
 * Same instrument the reviewer used on live 9b864752 (probeC-final.mjs
 * `webvitals1280`): a fresh browser context per load, PerformanceObserver on
 * `layout-shift` with `hadRecentInput` excluded, and `largest-contentful-paint`
 * for the element and its time. Every shift source is recorded so a regression
 * names the node that moved.
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://127.0.0.1:5616';
const VPS = [[1280, 720], [1440, 900], [390, 844]];
const LOADS = 3;

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});

const out = {};
for (const [w, h] of VPS) {
  out[`${w}x${h}`] = [];
  for (let i = 0; i < LOADS; i += 1) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__cls = 0;
      window.__shifts = [];
      window.__lcp = null;
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          if (e.hadRecentInput) continue;
          window.__cls += e.value;
          window.__shifts.push({
            value: Number(e.value.toFixed(5)),
            t: Math.round(e.startTime),
            sources: (e.sources || []).map((s) => {
              const n = s.node;
              if (!n) return 'detached';
              const tag = n.tagName || n.nodeName;
              const cls = (n.className && n.className.toString ? n.className.toString() : '').slice(0, 60);
              const id = n.id ? `#${n.id}` : '';
              return `${tag}${id}${cls ? '.' + cls : ''} ${JSON.stringify(s.previousRect)}→${JSON.stringify(s.currentRect)}`;
            }),
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        const e = list.getEntries().at(-1);
        if (e) {
          window.__lcp = {
            ms: Math.round(e.startTime),
            el: e.element ? `${e.element.tagName} ${(e.element.currentSrc || e.element.id || (e.element.className || '').toString()).split('/').pop()}` : null,
          };
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    await page.goto(BASE + '/', { waitUntil: 'load' });
    await page.waitForTimeout(4000);
    const res = await page.evaluate(() => ({
      cls: Number(window.__cls.toFixed(5)),
      lcp: window.__lcp,
      shifts: window.__shifts,
    }));
    out[`${w}x${h}`].push(res);
    await ctx.close();
  }
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
