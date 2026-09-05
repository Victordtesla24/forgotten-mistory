// R-c13 adversarial pass 2 — GL mount audit, clean LCP/CLS, ?gl=force reproduction.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://forgotten-mistory.web.app';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/R-c13';
const CAP = path.join(OUT, 'capture');
const R = { generatedAt: new Date().toISOString() };

const PERF_INIT = `(() => {
  window.__cls = 0; window.__lcp = 0; window.__lcpEl = '';
  try { new PerformanceObserver((l)=>{for(const e of l.getEntries()) if(!e.hadRecentInput) window.__cls+=e.value;}).observe({type:'layout-shift',buffered:true}); } catch(e){}
  try { new PerformanceObserver((l)=>{const es=l.getEntries();const last=es[es.length-1];
    if(last){window.__lcp=last.renderTime||last.loadTime||last.startTime; window.__lcpEl=last.element?(last.element.tagName+(last.element.id?'#'+last.element.id:'')):'';}})
    .observe({type:'largest-contentful-paint',buffered:true}); } catch(e){}
})();`;

function mk() { return { ce: [], pe: [], fr: [] }; }
function wire(p, c) {
  p.on('console', (m) => { if (m.type() === 'error') c.ce.push(m.text().slice(0, 500)); });
  p.on('pageerror', (e) => c.pe.push(String(e).slice(0, 500)));
  p.on('requestfailed', (r) => c.fr.push({ url: r.url().slice(0, 200), err: r.failure()?.errorText }));
  p.on('response', (r) => { if (r.status() >= 400) c.fr.push({ url: r.url().slice(0, 200), status: r.status() }); });
}

// ---- clean LCP/CLS: load, sit still, no synthetic scrolling ----
async function cleanPerf(browser, w, h, name) {
  const c = mk();
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await ctx.addInitScript(PERF_INIT);
  const page = await ctx.newPage(); wire(page, c);
  const t0 = Date.now();
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(6000);
  const p = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0] || {};
    return { cls: window.__cls, lcp: window.__lcp, lcpEl: window.__lcpEl,
      domContentLoaded: nav.domContentLoadedEventEnd, loadEvent: nav.loadEventEnd,
      fcp: (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || null };
  });
  await ctx.close();
  return { name, wallMs: Date.now() - t0, ...p, ceCount: c.ce.length, peCount: c.pe.length, frCount: c.fr.length };
}

// ---- canvas / GL mount audit on the default path ----
async function glAudit(browser, url, label, shot) {
  const c = mk();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); wire(page, c);
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  try { await page.waitForLoadState('networkidle', { timeout: 12000 }); } catch (e) {}
  await page.waitForTimeout(2000);
  // scroll each section into view so lazy scenes get a chance to mount
  const ids = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];
  const perSection = [];
  for (const id of ids) {
    const found = await page.evaluate((i) => { const el = document.getElementById(i); if (!el) return false; el.scrollIntoView({ block: 'center', behavior: 'instant' }); return true; }, id);
    await page.waitForTimeout(1400);
    const s = await page.evaluate((i) => {
      const el = document.getElementById(i);
      if (!el) return { id: i, present: false };
      const cvs = [...el.querySelectorAll('canvas')].map((c) => ({ w: c.width, h: c.height, cw: Math.round(c.getBoundingClientRect().width), ch: Math.round(c.getBoundingClientRect().height) }));
      return { id: i, present: true, canvases: cvs.length, canvasDetail: cvs,
        svgs: el.querySelectorAll('svg').length, videos: el.querySelectorAll('video').length,
        animatedSvg: el.querySelectorAll('svg animate, svg animateTransform, svg animateMotion').length };
    }, id);
    perSection.push(s);
  }
  const doc = await page.evaluate(() => ({
    canvasTotal: document.querySelectorAll('canvas').length,
    bodyTextHead: document.body.innerText.trim().slice(0, 200),
    hasErrorBoundary: /something went wrong|unexpected error|try again|reload/i.test(document.body.innerText.slice(0, 600)),
    h1: document.querySelector('h1')?.textContent?.trim() || null,
    sectionCount: document.querySelectorAll('section[id]').length,
    runningAnims: document.getAnimations().filter((a) => a.playState === 'running').length,
  }));
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
  if (shot) await page.screenshot({ path: path.join(CAP, shot) });
  await ctx.close();
  return { label, url, doc, perSection, ce: c.ce.slice(0, 6), ceCount: c.ce.length, pe: c.pe.slice(0, 4), peCount: c.pe.length, fr: c.fr, frCount: c.fr.length };
}

// ---- does ANY query string break it, or only gl=force? ----
async function quickProbe(browser, url) {
  const c = mk();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); wire(page, c);
  await page.goto(url, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3500);
  const d = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent?.trim() || null,
    sections: document.querySelectorAll('section[id]').length,
    canvases: document.querySelectorAll('canvas').length,
    head: document.body.innerText.trim().slice(0, 160),
  }));
  await ctx.close();
  return { url, ...d, ceCount: c.ce.length, ce: c.ce.slice(0, 2), peCount: c.pe.length };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    R.cleanPerf = [];
    R.cleanPerf.push(await cleanPerf(browser, 1440, 900, '1440x900'));
    console.error('[perf 1440]', JSON.stringify(R.cleanPerf[0]));
    R.cleanPerf.push(await cleanPerf(browser, 390, 844, '390x844'));
    console.error('[perf 390]', JSON.stringify(R.cleanPerf[1]));

    R.glDefault = await glAudit(browser, BASE + '/', 'default', '1440x900-gl-default-hero.png');
    console.error('[gl default]', R.glDefault.doc.canvasTotal, JSON.stringify(R.glDefault.perSection.map((s) => s.id + ':' + (s.present ? s.canvases + 'c/' + s.svgs + 'svg' : 'ABSENT'))));

    R.glForce = await glAudit(browser, BASE + '/?gl=force', 'gl=force', '1440x900-glforce-error.png');
    console.error('[gl force]', R.glForce.doc.canvasTotal, R.glForce.doc.h1, 'ce=' + R.glForce.ceCount, JSON.stringify(R.glForce.doc.bodyTextHead));

    R.probes = [];
    for (const u of [BASE + '/?utm_source=linkedin', BASE + '/?gl=force', BASE + '/?gl=auto', BASE + '/#experience']) {
      const p = await quickProbe(browser, u);
      R.probes.push(p);
      console.error('[probe]', u, 'h1=' + p.h1, 'sections=' + p.sections, 'ce=' + p.ceCount);
    }
  } catch (e) {
    R.fatal = String(e && e.stack || e);
    console.error('[FATAL]', R.fatal);
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(OUT, 'adversarial-report-pass2.json'), JSON.stringify(R, null, 2));
  console.error('[written pass2]');
})();
