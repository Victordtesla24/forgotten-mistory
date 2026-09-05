// CLS attribution probe — PERF-03's six-step walk under CDP CPU throttling,
// with every layout-shift entry printed with its sources' node selectors and rects.
//
//   node docs/delivery/evidence/v10-20260905T0515Z/F-stability/01-cls-probe.mjs
//   PROBE_BASE_URL=http://127.0.0.1:5601 PROBE_CPU=6 PROBE_RUNS=2
//
// It exists because the reviewer's finding named `footer.Footer_footer__TWDx3`
// as the shift *source* without saying whether the footer was the culprit or the
// victim. LayoutShiftAttribution rects are viewport-clipped, so a footer that is
// pushed below the fold reports `currentRect.height = 0` and looks identical to a
// footer that collapsed. Only the other sources in the same entry separate them.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const BASE = process.env.PROBE_BASE_URL || 'http://127.0.0.1:5601';
const OUT = process.env.PROBE_OUT || 'docs/delivery/evidence/v10-20260905T0515Z/F-stability/01-cls-attribution.json';
const RATE = Number(process.env.PROBE_CPU || 6);

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '1280x720', width: 1280, height: 720 },
];

const INSTALL = () => {
  window.__shifts = [];
  const describe = (node) => {
    const el = node && node.nodeType === 1 ? node : node && node.parentElement;
    if (!el) return 'unknown';
    const id = el.id ? `#${el.id}` : '';
    const cls =
      typeof el.className === 'string' && el.className
        ? `.${el.className.trim().split(/\s+/).join('.')}`
        : '';
    let path = `${el.tagName.toLowerCase()}${id}${cls}`;
    let p = el.parentElement;
    let depth = 0;
    while (p && depth < 3) {
      const pid = p.id ? `#${p.id}` : '';
      const pcl =
        typeof p.className === 'string' && p.className ? `.${p.className.trim().split(/\s+/)[0]}` : '';
      path = `${p.tagName.toLowerCase()}${pid}${pcl} > ${path}`;
      p = p.parentElement;
      depth += 1;
    }
    return path;
  };
  const rect = (r) =>
    r ? { x: Math.round(r.x), y: Math.round(r.y), w: +r.width.toFixed(2), h: +r.height.toFixed(2) } : null;
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__shifts.push({
        value: entry.value || 0,
        hadRecentInput: !!entry.hadRecentInput,
        time: Math.round(entry.startTime),
        sources: (entry.sources || []).map((src) => ({
          node: describe(src.node),
          previousRect: rect(src.previousRect),
          currentRect: rect(src.currentRect),
        })),
      });
    }
  }).observe({ type: 'layout-shift', buffered: true });
};

const results = [];
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
for (const vp of VIEWPORTS) {
  for (let run = 1; run <= Number(process.env.PROBE_RUNS || 2); run += 1) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      baseURL: BASE,
    });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
    await page.addInitScript(INSTALL);
    await page.goto('/', { waitUntil: 'load' });
    // PERF-03's six-step walk, verbatim.
    await page.evaluate(async () => {
      const steps = 6;
      for (let i = 0; i < steps; i += 1) {
        window.scrollTo(0, (i / steps) * document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 400));
      }
    });
    await page.waitForTimeout(1500);
    const shifts = await page.evaluate(() => window.__shifts);
    const settled = await page.evaluate(() => {
      const f = document.querySelector('footer');
      const r = f && f.getBoundingClientRect();
      const measure = (sel) => {
        const el = document.querySelector(sel);
        const b = el && el.getBoundingClientRect();
        return b ? +b.height.toFixed(2) : null;
      };
      return {
        bodyScrollHeight: document.body.scrollHeight,
        footerHeight: r ? +r.height.toFixed(2) : null,
        listenHeight: measure('#listen'),
        vitrineHeight: measure('#vitrine'),
      };
    });
    const cls = shifts.filter((s) => !s.hadRecentInput).reduce((a, s) => a + s.value, 0);
    results.push({ viewport: vp.name, run, cpuThrottle: RATE, cls: +cls.toFixed(4), settled, shifts });
    console.log(
      `${vp.name} run ${run}: CLS ${cls.toFixed(4)} · ${shifts.length} entries · footer settled h=${settled.footerHeight}`,
    );
    for (const s of shifts) {
      console.log(
        `   ${s.value.toFixed(4)} @ ${s.time} ms  ${s.sources
          .map((x) => `${x.node} prev=${JSON.stringify(x.previousRect)} cur=${JSON.stringify(x.currentRect)}`)
          .join(' || ')}`,
      );
    }
    await ctx.close();
  }
}
await browser.close();
writeFileSync(OUT, JSON.stringify(results, null, 2));
console.log(`\nwrote ${OUT}`);
