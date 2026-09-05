// R-c13 adversarial battery — live production only. Read-only against https://forgotten-mistory.web.app
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://forgotten-mistory.web.app';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/R-c13';
const CAP = path.join(OUT, 'capture');
const AXE = fs.readFileSync('/root/forgotten-mistory/node_modules/axe-core/axe.min.js', 'utf8');
const R = { generatedAt: new Date().toISOString(), base: BASE };

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '834x1194', width: 834, height: 1194 },
  { name: '390x844', width: 390, height: 844 },
];

const NOGL_INIT = `(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) {
    if (typeof t === 'string' && /webgl/i.test(t)) return null;
    return orig.call(this, t, ...a);
  };
})();`;

const PERF_INIT = `(() => {
  window.__cls = 0; window.__lcp = 0; window.__lcpEl = '';
  try {
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; })
      .observe({ type: 'layout-shift', buffered: true });
  } catch (e) {}
  try {
    new PerformanceObserver((l) => { const es = l.getEntries(); const last = es[es.length - 1];
      if (last) { window.__lcp = last.renderTime || last.loadTime || last.startTime;
        window.__lcpEl = last.element ? (last.element.tagName + (last.element.id ? '#' + last.element.id : '')) : ''; } })
      .observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) {}
})();`;

function mkCollector() {
  return { consoleErrors: [], consoleWarnings: [], pageErrors: [], failedRequests: [], responses: [] };
}
function wire(page, c) {
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error') c.consoleErrors.push(m.text().slice(0, 400));
    else if (t === 'warning') c.consoleWarnings.push(m.text().slice(0, 300));
  });
  page.on('pageerror', (e) => c.pageErrors.push(String(e).slice(0, 400)));
  page.on('requestfailed', (r) => c.failedRequests.push({ url: r.url().slice(0, 220), err: r.failure()?.errorText }));
  page.on('response', async (res) => {
    try {
      const st = res.status();
      if (st >= 400) c.failedRequests.push({ url: res.url().slice(0, 220), status: st });
      const h = res.headers();
      c.responses.push({ url: res.url().slice(0, 220), status: st, type: h['content-type'] || '', bytes: Number(h['content-length'] || 0) });
    } catch (e) {}
  });
}

async function settle(page) {
  await page.waitForLoadState('domcontentloaded');
  try { await page.waitForLoadState('networkidle', { timeout: 12000 }); } catch (e) {}
}

async function scrollAll(page) {
  await page.evaluate(async () => {
    const step = Math.round(window.innerHeight * 0.8);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 220));
    }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400));
  });
}

const SECTION_PROBE = () => {
  const ids = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];
  const out = ids.map((id) => {
    const el = document.getElementById(id);
    if (!el) return { id, present: false };
    const h = el.querySelector('h1,h2');
    const r = el.getBoundingClientRect();
    return { id, present: true, tag: h?.tagName || null, heading: (h?.textContent || '').trim().slice(0, 80),
      docTop: Math.round(r.top + window.scrollY), height: Math.round(r.height) };
  });
  return out;
};

const GOLD_PROBE = () => {
  const GOLD = ['rgb(201, 168, 76)', 'rgb(201,168,76)'];
  const isGold = (v) => !!v && GOLD.some((g) => v.replace(/\s+/g, ' ').includes(g));
  const sections = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];
  const res = {};
  for (const id of sections) {
    const root = document.getElementById(id);
    if (!root) { res[id] = null; continue; }
    const hits = [];
    for (const el of root.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      const props = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'fill', 'stroke', 'outlineColor', 'textDecorationColor'];
      const which = props.filter((p) => isGold(cs[p]));
      if (!which.length) continue;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      hits.push({
        tag: el.tagName, cls: (el.getAttribute('class') || '').slice(0, 90),
        props: which, text: (el.textContent || '').trim().slice(0, 48),
        strokeOpacity: cs.strokeOpacity, opacity: cs.opacity,
        href: el.tagName === 'A' ? el.getAttribute('href') : (el.closest('a')?.getAttribute('href') || null),
        inCaliper: !!el.closest('[data-caliper],[class*=caliper],[class*=Caliper]'),
        caliperState: el.closest('[data-state]')?.getAttribute('data-state') || null,
        w: Math.round(r.width), h: Math.round(r.height),
      });
    }
    // summarise
    const byClass = {};
    for (const x of hits) { const k = x.tag + '|' + x.cls; byClass[k] = (byClass[k] || 0) + 1; }
    res[id] = { count: hits.length, byClass, sample: hits.slice(0, 25) };
  }
  return res;
};

async function runViewport(browser, vp) {
  const c = mkCollector();
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  await ctx.addInitScript(PERF_INIT);
  const page = await ctx.newPage();
  wire(page, c);
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  await settle(page);
  await page.waitForTimeout(1500);

  const meta = await page.evaluate(() => ({
    buildCommit: document.querySelector('meta[name="build-commit"]')?.content || null,
    title: document.title,
    lang: document.documentElement.lang,
  }));
  const sections = await page.evaluate(SECTION_PROBE);

  // screenshots at hero
  await page.screenshot({ path: path.join(CAP, `${vp.name}-hero.png`) });

  // axe
  await page.addScriptTag({ content: AXE });
  const axe = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return {
      violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
        targets: v.nodes.slice(0, 4).map((n) => ({ target: n.target.join(' '), summary: (n.failureSummary || '').slice(0, 260) })) })),
      incomplete: r.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
      passes: r.passes.length,
    };
  });

  await scrollAll(page);
  const gold = await page.evaluate(GOLD_PROBE);

  // extra captures on the 1440 pass
  if (vp.name === '1440x900') {
    for (const id of ['skills', 'vitrine', 'listen']) {
      await page.evaluate((i) => document.getElementById(i).scrollIntoView({ block: 'start', behavior: 'instant' }), id);
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(CAP, `1440x900-${id}.png`) });
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
  }
  if (vp.name === '390x844') {
    await page.evaluate(() => document.getElementById('listen').scrollIntoView({ block: 'start', behavior: 'instant' }));
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(CAP, `390x844-listen.png`) });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
  }

  const perf = await page.evaluate(() => ({ cls: window.__cls, lcp: window.__lcp, lcpEl: window.__lcpEl }));
  const overflow = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, innerWidth: window.innerWidth }));

  // text content for parity
  const text = await page.evaluate(() => document.body.innerText);

  await ctx.close();

  const assets = c.responses.filter((r) => r.status < 400);
  const totalBytes = assets.reduce((a, b) => a + (b.bytes || 0), 0);
  const largest = assets.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 8);
  const over500 = assets.filter((r) => r.bytes > 500 * 1024);

  return {
    viewport: vp.name, meta, sections, axe, perf, overflow, gold,
    consoleErrors: c.consoleErrors, consoleErrorCount: c.consoleErrors.length,
    consoleWarningCount: c.consoleWarnings.length, consoleWarnings: c.consoleWarnings.slice(0, 12),
    pageErrors: c.pageErrors, pageErrorCount: c.pageErrors.length,
    failedRequests: c.failedRequests, failedRequestCount: c.failedRequests.length,
    assetCount: assets.length, totalBytes, totalKB: Math.round(totalBytes / 1024),
    largest, over500kB: over500,
    _text: text,
  };
}

async function runReducedMotion(browser, vp) {
  const c = mkCollector();
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage(); wire(page, c);
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  await settle(page);
  await page.waitForTimeout(3000);
  const res = await page.evaluate(() => {
    const running = document.getAnimations().filter((a) => a.playState === 'running');
    const detail = running.slice(0, 15).map((a) => {
      const t = a.effect && a.effect.target;
      return { name: a.animationName || a.transitionProperty || '(unnamed)',
        tag: t ? t.tagName : null, cls: t ? (t.getAttribute('class') || '').slice(0, 90) : null,
        id: t ? (t.id || (t.closest('section')?.id ?? null)) : null,
        dur: a.effect?.getTiming?.().duration, iter: String(a.effect?.getTiming?.().iterations) };
    });
    const vids = [...document.querySelectorAll('video')].map((v) => ({ paused: v.paused, src: v.currentSrc, autoplay: v.autoplay, loop: v.loop }));
    const h1 = document.querySelector('#hero h1');
    return { runningCount: running.length, detail, videos: vids, videoCount: vids.length,
      h1: h1 ? { text: h1.textContent.trim().slice(0, 60), opacity: getComputedStyle(h1).opacity, transform: getComputedStyle(h1).transform } : null };
  });
  if (vp.name === '1440x900') await page.screenshot({ path: path.join(CAP, '1440x900-reduced-motion.png') });
  await ctx.close();
  return { viewport: vp.name, ...res, consoleErrorCount: c.consoleErrors.length, pageErrorCount: c.pageErrors.length,
    failedRequestCount: c.failedRequests.length, consoleErrors: c.consoleErrors, pageErrors: c.pageErrors };
}

async function runNoGL(browser, vp) {
  const c = mkCollector();
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
  await ctx.addInitScript(NOGL_INIT);
  const page = await ctx.newPage(); wire(page, c);
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  await settle(page);
  await page.waitForTimeout(2500);
  const res = await page.evaluate(() => {
    const hero = document.getElementById('hero');
    const h1 = hero?.querySelector('h1');
    const cs = h1 ? getComputedStyle(h1) : null;
    const txt = (hero?.innerText || '').trim();
    const canvases = hero ? hero.querySelectorAll('canvas').length : -1;
    const stage = hero?.querySelector('[class*=stage],[class*=Stage]');
    return {
      canvases, heroTextLength: txt.length, heroTextHead: txt.slice(0, 220),
      h1: h1 ? { text: h1.textContent.trim(), opacity: cs.opacity, color: cs.color, fontSize: cs.fontSize, visibility: cs.visibility } : null,
      heroBg: hero ? getComputedStyle(hero).backgroundColor : null,
      stageBgImage: stage ? getComputedStyle(stage).backgroundImage.slice(0, 200) : null,
      ctas: [...(hero?.querySelectorAll('a,button') || [])].map((e) => ({ t: e.textContent.trim().slice(0, 40), vis: e.getBoundingClientRect().height > 0 })),
    };
  });
  await page.screenshot({ path: path.join(CAP, `${vp.name}-nogl-hero.png`) });
  await ctx.close();
  return { viewport: vp.name, ...res, consoleErrorCount: c.consoleErrors.length, consoleErrors: c.consoleErrors,
    pageErrorCount: c.pageErrors.length, pageErrors: c.pageErrors, failedRequestCount: c.failedRequests.length, failedRequests: c.failedRequests };
}

async function runGLForce(browser) {
  const c = mkCollector();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage(); wire(page, c);
  await page.goto(BASE + '/?gl=force', { waitUntil: 'load', timeout: 60000 });
  await settle(page);
  await page.waitForTimeout(2500);
  await scrollAll(page);
  const res = await page.evaluate(() => ({
    canvasTotal: document.querySelectorAll('canvas').length,
    perSection: ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'].map((id) => ({ id, canvases: document.getElementById(id)?.querySelectorAll('canvas').length ?? -1 })),
  }));
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(CAP, '1440x900-glforce-hero.png') });
  await ctx.close();
  return { ...res, consoleErrorCount: c.consoleErrors.length, consoleErrors: c.consoleErrors,
    pageErrorCount: c.pageErrors.length, pageErrors: c.pageErrors, failedRequestCount: c.failedRequests.length, failedRequests: c.failedRequests };
}

async function runKeyboard(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  await settle(page);
  await page.waitForTimeout(1200);
  const stops = [];
  let mvStop = -1, mvName = null;
  for (let i = 1; i <= 130; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a || a === document.body) return null;
      const cs = getComputedStyle(a);
      const r = a.getBoundingClientRect();
      return {
        tag: a.tagName, id: a.id || null, testid: a.getAttribute('data-testid') || null,
        name: (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 46),
        href: a.getAttribute('href') || null,
        section: a.closest('section')?.id || (a.closest('nav') ? 'nav' : (a.closest('header') ? 'header' : (a.closest('footer') ? 'footer' : 'chrome'))),
        outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor,
        boxShadow: cs.boxShadow.slice(0, 60), visible: r.width > 0 && r.height > 0,
      };
    });
    if (!info) break;
    stops.push({ i, ...info });
    if (info.testid === 'minivic-toggle' && mvStop < 0) { mvStop = i; mvName = info.name; }
  }
  const ctas = stops.filter((s) => /download cv|see the evidence|email|linkedin|github|ask|book|coffee|call|contact|resume|cv/i.test(s.name || ''));
  const noFocusRing = stops.filter((s) => (s.outlineStyle === 'none' || s.outlineWidth === '0px') && (!s.boxShadow || s.boxShadow === 'none'));
  await ctx.close();
  return { totalStops: stops.length, minivicTabStop: mvStop, minivicName: mvName, stops, ctas, noFocusRingCount: noFocusRing.length, noFocusRing: noFocusRing.slice(0, 20) };
}

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    R.viewports = [];
    for (const vp of VIEWPORTS) {
      const r = await runViewport(browser, vp);
      if (vp.name === '1440x900') { R.pageText = r._text; }
      delete r._text;
      R.viewports.push(r);
      console.error('[done vp]', vp.name, 'ce', r.consoleErrorCount, 'pe', r.pageErrorCount, 'fr', r.failedRequestCount, 'axe', r.axe.violations.length);
    }
    R.reducedMotion = [];
    for (const vp of [VIEWPORTS[0], VIEWPORTS[3]]) {
      const r = await runReducedMotion(browser, vp);
      R.reducedMotion.push(r);
      console.error('[done rm]', vp.name, 'running', r.runningCount);
    }
    R.noGL = [];
    for (const vp of [VIEWPORTS[0], VIEWPORTS[3]]) {
      const r = await runNoGL(browser, vp);
      R.noGL.push(r);
      console.error('[done nogl]', vp.name, 'canvases', r.canvases, 'h1', r.h1 && r.h1.text);
    }
    R.glForce = await runGLForce(browser);
    console.error('[done glforce]', R.glForce.canvasTotal);
    R.keyboard = await runKeyboard(browser);
    console.error('[done kbd]', R.keyboard.totalStops, 'mv', R.keyboard.minivicTabStop);
  } catch (e) {
    R.fatal = String(e && e.stack || e);
    console.error('[FATAL]', R.fatal);
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(OUT, 'adversarial-report.json'), JSON.stringify(R, null, 2));
  console.error('[written]');
})();
