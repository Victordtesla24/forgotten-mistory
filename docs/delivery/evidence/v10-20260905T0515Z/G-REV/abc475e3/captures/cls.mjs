// Probe (a) — CLS + LCP on UNSKIPPED cold boots. Never clicks the preloader Skip.
// PerformanceObserver installed via addInitScript so no shift before hydration is missed.
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'https://forgotten-mistory.web.app';
const VIEWPORTS = [
  { w: 1440, h: 900 },
  { w: 1280, h: 720 },
  { w: 390, h: 844 },
];
const LOADS = 3;

const INIT = `
window.__cls = 0;
window.__entries = [];
window.__lcp = null;
try {
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      if (e.hadRecentInput) continue;
      window.__cls += e.value;
      window.__entries.push({
        value: e.value,
        startTime: Math.round(e.startTime),
        sources: (e.sources || []).map((s) => ({
          node: s.node
            ? (s.node.nodeName || '?') +
              (s.node.id ? '#' + s.node.id : '') +
              (s.node.className && typeof s.node.className === 'string'
                ? '.' + s.node.className.trim().split(/\\s+/).slice(0, 3).join('.')
                : '')
            : null,
          previousRect: s.previousRect
            ? { x: Math.round(s.previousRect.x), y: Math.round(s.previousRect.y), w: Math.round(s.previousRect.width), h: Math.round(s.previousRect.height) }
            : null,
          currentRect: s.currentRect
            ? { x: Math.round(s.currentRect.x), y: Math.round(s.currentRect.y), w: Math.round(s.currentRect.width), h: Math.round(s.currentRect.height) }
            : null,
        })),
      });
    }
  }).observe({ type: 'layout-shift', buffered: true });
} catch (err) { window.__clsErr = String(err); }
try {
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      window.__lcp = {
        ms: Math.round(e.startTime),
        element: e.element ? (e.element.nodeName || '?') + (e.element.id ? '#' + e.element.id : '') + (e.element.className && typeof e.element.className === 'string' ? '.' + e.element.className.trim().split(/\\s+/).slice(0,3).join('.') : '') : null,
        url: e.url || null,
        size: e.size || null,
      };
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
} catch (err) { window.__lcpErr = String(err); }
`;

const results = [];

for (const vp of VIEWPORTS) {
  for (let i = 0; i < LOADS; i++) {
    const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
    const ctx = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: 1,
      serviceWorkers: 'allow',
    });
    await ctx.addInitScript(INIT);
    const page = await ctx.newPage();
    const pageerrors = [];
    const consoleErrors = [];
    const failedRequests = [];
    page.on('pageerror', (e) => pageerrors.push(String(e && e.message ? e.message : e)));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
    });
    page.on('requestfailed', (r) =>
      failedRequests.push(`${r.url()} :: ${r.failure()?.errorText}`),
    );
    page.on('response', (r) => {
      if (r.status() >= 400) failedRequests.push(`${r.url()} :: HTTP ${r.status()}`);
    });

    const url = `${BASE}/?cb=${Date.now()}-${vp.w}-${i}`;
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    // UNSKIPPED: do NOT click .preloader-skip. Let the wipe run out naturally.
    await page
      .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 25000 })
      .catch(() => {});
    await page.waitForTimeout(4000); // let post-handoff hero entrance + any late paint settle
    const buildCommit = await page
      .evaluate(() => document.querySelector('meta[name="build-commit"]')?.getAttribute('content') || null)
      .catch(() => null);
    const preloaderStillUp = await page
      .evaluate(() => !!document.querySelector('.preloader'))
      .catch(() => null);
    const docH = await page.evaluate(() => document.documentElement.scrollHeight);
    const m = await page.evaluate(() => ({
      cls: window.__cls,
      entries: window.__entries,
      lcp: window.__lcp,
      clsErr: window.__clsErr || null,
    }));
    results.push({
      viewport: `${vp.w}x${vp.h}`,
      load: i + 1,
      buildCommit,
      preloaderStillUp,
      docScrollHeight: docH,
      wallMs: Date.now() - t0,
      cls: m.cls,
      lcp: m.lcp,
      entryCount: m.entries.length,
      entries: m.entries,
      clsErr: m.clsErr,
      pageerrors,
      consoleErrors,
      failedRequests,
    });
    console.log(
      `${vp.w}x${vp.h} load${i + 1}  build=${buildCommit}  CLS=${m.cls.toFixed(4)}  entries=${m.entries.length}  LCP=${m.lcp ? m.lcp.ms + 'ms ' + m.lcp.element : 'n/a'}  pageerr=${pageerrors.length}  conserr=${consoleErrors.length}  reqfail=${failedRequests.length}`,
    );
    await ctx.close();
    await browser.close();
  }
}

fs.writeFileSync(process.argv[2] || '/tmp/cls.json', JSON.stringify(results, null, 2));
console.log('WROTE', process.argv[2]);
