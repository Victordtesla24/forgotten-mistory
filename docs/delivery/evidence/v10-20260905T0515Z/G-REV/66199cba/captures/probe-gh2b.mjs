// Phase 2 — the numbers phase 1 could not close: the ?gl=force pageerror text,
// the JS-off failed request, canvas mount time after DCL (polled, not observed),
// LCP/CLS on 3 unskipped cold loads x 3 widths, and the G-H1 CTA regression check.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const BASE = 'https://forgotten-mistory.web.app';
const LAUNCH = {
  executablePath: '/usr/bin/google-chrome',
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--disable-lcd-text',
  ],
};
const VITALS_INIT = `
window.__cls = 0; window.__shifts = []; window.__lcp = 0; window.__lcpEl = ''; window.__lcpUrl = '';
new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(+e.value.toFixed(5)); } } }).observe({ type: 'layout-shift', buffered: true });
new PerformanceObserver((l) => { const es = l.getEntries(); const e = es[es.length - 1]; window.__lcp = e.startTime;
  const el = e.element;
  window.__lcpEl = el ? (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\\s+/).slice(0,2).join('.') : '') + ' :: ' + (el.textContent||'').replace(/\\s+/g,' ').trim().slice(0,64)) : 'unknown';
  window.__lcpUrl = e.url || ''; }).observe({ type: 'largest-contentful-paint', buffered: true });
`;
const R = { glErrors: {}, jsOffRequests: {}, mount: {}, vitals: {}, gh1: {} };
const browser = await chromium.launch(LAUNCH);

// ---------- A. ?gl=force: full pageerror text + canvas mount time (polled) ----------
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  const consoleErrs = [];
  const failed = [];
  page.on('pageerror', (e) => errs.push({ message: String(e.message || e), stack: String(e.stack || '').slice(0, 400) }));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrs.push(m.text().slice(0, 300)); });
  page.on('requestfailed', (r) => failed.push({ url: r.url(), err: r.failure()?.errorText }));
  await page.addInitScript(`
    window.__dcl = null; window.__canvasAt = null;
    document.addEventListener('DOMContentLoaded', () => { window.__dcl = performance.now(); }, { once: true });
    const tick = () => {
      if (window.__canvasAt === null && document.querySelector('[data-scene="hero-atmosphere"] canvas')) {
        window.__canvasAt = performance.now(); return;
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  `);
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(200);
  fs.writeFileSync(path.join(OUT, `glforce-t200-${vp.w}.png`), await page.screenshot());
  const at200 = await page.evaluate(() => ({
    canvases: document.querySelectorAll('[data-scene="hero-atmosphere"] canvas').length,
    stageBg: (getComputedStyle(document.querySelector('[data-scene="hero-atmosphere"]')).backgroundImage || '').slice(0, 90),
  }));
  await page
    .locator('[data-scene="hero-atmosphere"] canvas')
    .first()
    .waitFor({ state: 'attached', timeout: 45000 })
    .catch(() => {});
  fs.writeFileSync(path.join(OUT, `glforce-atmount-${vp.w}.png`), await page.screenshot());
  const t = await page.evaluate(() => ({
    dcl: window.__dcl === null ? null : Math.round(window.__dcl),
    canvasAt: window.__canvasAt === null ? null : Math.round(window.__canvasAt),
    nav: Math.round(performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd ?? 0),
  }));
  await page.waitForTimeout(3000);
  R.glErrors[vp.w] = { pageerrors: errs, consoleErrors: consoleErrs, failedRequests: failed };
  R.mount[vp.w] = {
    ...t,
    canvasAfterDcl: t.canvasAt !== null && t.dcl !== null ? t.canvasAt - t.dcl : null,
    at200ms: at200,
    canvasesFinal: await page.locator('[data-scene="hero-atmosphere"] canvas').count(),
  };
  console.log(`A ${vp.w}: dcl=${t.dcl} canvasAt=${t.canvasAt} after=${R.mount[vp.w].canvasAfterDcl}ms at200={canvases:${at200.canvases}} pageerrors=${errs.length} :: ${errs.map((e) => e.message).join(' | ').slice(0, 220)}`);
  await ctx.close();
}

// ---------- B. JS-off failed request + G-H1 CTA / ledger positions ----------
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, javaScriptEnabled: false });
  const page = await ctx.newPage();
  const failed = [];
  page.on('requestfailed', (r) => failed.push({ url: r.url(), err: r.failure()?.errorText, type: r.resourceType() }));
  await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  R.jsOffRequests[vp.w] = failed;
  console.log(`B ${vp.w}: js-off failed=${JSON.stringify(failed).slice(0, 300)}`);
  await ctx.close();
}

// ---------- C. G-H1 regression: one CTA group in the fold, ledger below ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  R.gh1 = await page.evaluate(() => {
    const hero = document.querySelector('#hero');
    const inFold = (el) => { const r = el.getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; };
    const groups = [...hero.querySelectorAll('*')].filter((el) => {
      const cls = typeof el.className === 'string' ? el.className : '';
      return /action|cta/i.test(cls) && el.querySelectorAll('a[href], button').length >= 2;
    });
    const ledger = [...hero.querySelectorAll('*')].filter((el) => /ledger/i.test(typeof el.className === 'string' ? el.className : ''));
    const ledgerTops = ledger.map((el) => Math.round(el.getBoundingClientRect().top));
    const ctaTops = groups.map((el) => ({ cls: (typeof el.className === 'string' ? el.className : '').slice(0, 40), top: Math.round(el.getBoundingClientRect().top), inFold: inFold(el), links: el.querySelectorAll('a[href], button').length }));
    return { viewportH: window.innerHeight, ctaGroups: ctaTops, ctaGroupsInFold: ctaTops.filter((g) => g.inFold).length, ledgerCount: ledger.length, ledgerTops, ledgerBelowFold: ledgerTops.every((t) => t >= window.innerHeight) };
  });
  console.log(`C: ${JSON.stringify(R.gh1).slice(0, 420)}`);
  await ctx.close();
}

// ---------- D. LCP / CLS, 3 cold loads x 3 widths ----------
for (const vp of [{ w: 1280, h: 720 }, { w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const key = `${vp.w}x${vp.h}`;
  R.vitals[key] = [];
  for (let i = 0; i < 3; i += 1) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    await ctx.addInitScript(VITALS_INIT);
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e.message || e).slice(0, 160)));
    await page.goto(`${BASE}/`, { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(5000);
    const v = await page.evaluate(() => ({
      cls: +window.__cls.toFixed(5),
      shifts: window.__shifts,
      lcp: Math.round(window.__lcp),
      lcpEl: window.__lcpEl,
      lcpUrl: window.__lcpUrl,
      build: document.querySelector('meta[name="build-commit"]')?.content,
    }));
    R.vitals[key].push({ ...v, pageerrors: errs });
    console.log(`D ${key} load${i + 1}: lcp=${v.lcp}ms cls=${v.cls} el="${(v.lcpEl || '').slice(0, 70)}" url="${v.lcpUrl}" build=${v.build} err=${errs.length}`);
    await ctx.close();
  }
}

fs.writeFileSync(path.join(OUT, 'probe-gh2b.json'), JSON.stringify(R, null, 2));
await browser.close();
console.log('DONE phase 2');
