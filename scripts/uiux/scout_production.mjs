#!/usr/bin/env node
/**
 * UX Scout sweep — exercises the production site at every §3.2 viewport and
 * writes structured evidence (JSON + compressed PNG) under
 * docs/uiux/evidence/<run-id>/. Read-only against production; proposes nothing.
 *
 *   node scripts/uiux/scout_production.mjs --run-id <id> [--base-url <url>] [--label pre|post]
 */
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']);
    return acc;
  }, []),
);
const BASE = (args['base-url'] || 'https://forgotten-mistory.web.app').replace(/\/$/, '');
const RUN_ID = args['run-id'];
const LABEL = args.label || 'pre';
if (!RUN_ID) throw new Error('--run-id required');
const OUT = resolve('docs/uiux/evidence', RUN_ID);
mkdirSync(OUT, { recursive: true });
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const SECTIONS = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];
const VIEWPORTS = [
  { w: 360, h: 740, mobile: true },
  { w: 390, h: 844, mobile: true },
  { w: 768, h: 1024, mobile: true },
  { w: 1024, h: 768, mobile: false },
  { w: 1280, h: 800, mobile: false },
  { w: 1440, h: 900, mobile: false },
  { w: 1920, h: 1080, mobile: false },
];

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const report = { base: BASE, runId: RUN_ID, label: LABEL, startedAt: new Date().toISOString(), viewports: [] };

for (const vp of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h },
    isMobile: vp.mobile,
    hasTouch: vp.mobile,
    deviceScaleFactor: 1,
    userAgent: vp.mobile
      ? 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0 Mobile Safari/537.36'
      : undefined,
  });
  const page = await context.newPage();
  const console_ = [];
  const failed = [];
  const requests = [];
  page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') console_.push({ type: m.type(), text: m.text().slice(0, 500) });
  });
  page.on('pageerror', (e) => console_.push({ type: 'pageerror', text: String(e).slice(0, 500) }));
  page.on('requestfailed', (r) => failed.push({ url: r.url(), error: r.failure()?.errorText }));
  page.on('response', (r) => {
    requests.push({ url: r.url(), status: r.status(), type: r.request().resourceType() });
  });

  const t0 = Date.now();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(1500);

  const vpKey = `${vp.w}x${vp.h}`;
  const vpReport = { viewport: vpKey, mobile: vp.mobile, loadMs, sections: {}, console: console_, failedRequests: failed };

  // Global structural probes
  vpReport.global = await page.evaluate(({ sections }) => {
    const doc = document;
    const h1s = [...doc.querySelectorAll('h1')].map((h) => h.textContent.trim());
    const overflowX = doc.documentElement.scrollWidth > doc.documentElement.clientWidth + 1;
    const anchors = [...doc.querySelectorAll('a[href^="#"]')].map((a) => ({
      href: a.getAttribute('href'),
      text: a.textContent.trim().slice(0, 60),
      resolves: a.getAttribute('href').length > 1 ? !!doc.querySelector(a.getAttribute('href')) : true,
    }));
    const sectionsPresent = Object.fromEntries(sections.map((s) => [s, !!doc.getElementById(s)]));
    const italic = [...doc.querySelectorAll('body *')].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.fontStyle === 'italic' && el.textContent.trim().length > 0 && el.children.length === 0;
    }).map((el) => ({ tag: el.tagName, text: el.textContent.trim().slice(0, 80) }));
    const fonts = [...new Set([...doc.querySelectorAll('body *')].map((el) => getComputedStyle(el).fontFamily.split(',')[0].replace(/["']/g, '').trim()))];
    const canvases = doc.querySelectorAll('canvas').length;
    const links = [...doc.querySelectorAll('a[href]')].map((a) => a.getAttribute('href'));
    const cv = links.filter((h) => /\.pdf/i.test(h));
    const mailto = links.filter((h) => /^mailto:/i.test(h));
    const tel = links.filter((h) => /^tel:/i.test(h));
    const skip = [...doc.querySelectorAll('a[href^="#"]')].slice(0, 3).map((a) => a.textContent.trim());
    const landmarks = [...doc.querySelectorAll('header,nav,main,footer,[role=banner],[role=navigation],[role=main],[role=contentinfo]')].map((e) => e.tagName + (e.getAttribute('role') ? `[${e.getAttribute('role')}]` : ''));
    const meta = Object.fromEntries([...doc.querySelectorAll('meta[name]')].map((m) => [m.getAttribute('name'), m.getAttribute('content')]));
    const jsonld = [...doc.querySelectorAll('script[type="application/ld+json"]')].map((s) => { try { return JSON.parse(s.textContent); } catch { return 'INVALID'; } });
    const lang = doc.documentElement.lang;
    const title = doc.title;
    const smallTargets = [...doc.querySelectorAll('a,button,[role=button],input,select,textarea')]
      .filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.width < 24 || r.height < 24); })
      .map((el) => { const r = el.getBoundingClientRect(); return { tag: el.tagName, name: (el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 50), w: Math.round(r.width), h: Math.round(r.height) }; });
    const unnamed = [...doc.querySelectorAll('a,button,[role=button]')]
      .filter((el) => !(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || el.textContent.trim() || el.querySelector('img[alt]')))
      .map((el) => el.outerHTML.slice(0, 120));
    return { title, lang, h1s, overflowX, scrollWidth: doc.documentElement.scrollWidth, clientWidth: doc.documentElement.clientWidth, anchors, sectionsPresent, italic, fonts, canvases, cv, mailto, tel, skip, landmarks, meta, jsonld, smallTargets, unnamed };
  }, { sections: SECTIONS });

  // Fixed/sticky elements and CTA overlap in the first fold
  vpReport.fixed = await page.evaluate(() => {
    const fixed = [...document.querySelectorAll('body *')].filter((el) => {
      const p = getComputedStyle(el).position;
      if (p !== 'fixed' && p !== 'sticky') return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    });
    const ctas = [...document.querySelectorAll('#hero a, #hero button, #listen a, #listen button')].filter((el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
    const overlaps = [];
    const rect = (el) => el.getBoundingClientRect();
    for (const f of fixed) {
      const fr = rect(f);
      for (const c of ctas) {
        if (f.contains(c) || c.contains(f)) continue;
        const cr = rect(c);
        const ix = Math.max(0, Math.min(fr.right, cr.right) - Math.max(fr.left, cr.left));
        const iy = Math.max(0, Math.min(fr.bottom, cr.bottom) - Math.max(fr.top, cr.top));
        if (ix * iy > 0) overlaps.push({ fixed: f.tagName + '.' + (f.className || '').toString().slice(0, 40), cta: (c.getAttribute('aria-label') || c.textContent.trim()).slice(0, 50), area: Math.round(ix * iy) });
      }
    }
    return { fixed: fixed.map((f) => ({ tag: f.tagName, cls: (f.className || '').toString().slice(0, 60), rect: (({ x, y, width, height }) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(width), h: Math.round(height) }))(f.getBoundingClientRect()) })), overlaps };
  });

  // First fold screenshot
  await page.screenshot({ path: `${OUT}/fold__${vpKey}__load__${LABEL}__${stamp()}.png`, fullPage: false });

  // Per-section: scroll into view, wait, screenshot, measure
  for (const s of SECTIONS) {
    const exists = await page.$(`#${s}`);
    if (!exists) { vpReport.sections[s] = { present: false }; continue; }
    await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start', behavior: 'instant' }), s);
    await page.waitForTimeout(900);
    const m = await page.evaluate((id) => {
      const el = document.getElementById(id);
      const r = el.getBoundingClientRect();
      const clipped = [...el.querySelectorAll('*')].filter((n) => {
        const cs = getComputedStyle(n);
        return (cs.overflow === 'hidden' || cs.overflowX === 'hidden') && n.scrollWidth > n.clientWidth + 2 && n.textContent.trim().length > 0 && n.children.length === 0;
      }).length;
      const wideChildren = [...el.querySelectorAll('*')].filter((n) => n.getBoundingClientRect().right > document.documentElement.clientWidth + 1).length;
      const headings = [...el.querySelectorAll('h1,h2,h3,h4')].map((h) => h.tagName + ': ' + h.textContent.trim().slice(0, 70));
      const controls = [...el.querySelectorAll('a,button,[role=button],summary')].length;
      const canvases = el.querySelectorAll('canvas').length;
      return { top: Math.round(r.top), height: Math.round(r.height), clippedTextNodes: clipped, elementsBeyondViewport: wideChildren, headings, controls, canvases, hash: location.hash };
    }, s);
    vpReport.sections[s] = { present: true, ...m };
    await page.screenshot({ path: `${OUT}/${s}__${vpKey}__view__${LABEL}__${stamp()}.png`, fullPage: false });
  }

  // Full page
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/page__${vpKey}__full__${LABEL}__${stamp()}.png`, fullPage: true });

  vpReport.requestSummary = {
    total: requests.length,
    non2xx: requests.filter((r) => r.status >= 400).map((r) => ({ url: r.url, status: r.status })),
    byType: requests.reduce((a, r) => ((a[r.type] = (a[r.type] || 0) + 1), a), {}),
  };
  report.viewports.push(vpReport);
  await context.close();
  console.log(`[scout] ${vpKey} done — console=${console_.length} failed=${failed.length} overflowX=${vpReport.global.overflowX} overlaps=${vpReport.fixed.overlaps.length}`);
}

report.finishedAt = new Date().toISOString();
writeFileSync(`${OUT}/scout__all__sweep__${LABEL}__${stamp()}.json`, JSON.stringify(report, null, 2));
await browser.close();
console.log(`[scout] wrote report to ${OUT}`);
