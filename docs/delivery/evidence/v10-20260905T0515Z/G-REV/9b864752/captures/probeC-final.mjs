// G-REV phase 2 — final probe: 390 skills-bench retry (long settle), exact gold
// palette match (SATURATED_GOLD / ANY_GOLD from tests/monochrome/gold-semantics.spec.ts:34-45),
// #skills contrast walk, and LCP/CLS at 1280x720 via PerformanceObserver.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const BASE = 'https://forgotten-mistory.web.app';
const LAUNCH = { executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
const LAUNCH_NOGL = { executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] };

const SATURATED_GOLD = [[201, 168, 76], [212, 182, 92]];
const ANY_GOLD = [...SATURATED_GOLD, [232, 213, 163], [176, 146, 63]];
const LICENSED = '[data-caliper-state="sourced"], [class*="measuredMark"], [class*="mark"][class*="production"], a[href^="https://github.com/"]';

const GOLD_EXACT = ({ palette, licensed }) => {
  const parse = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 }; };
  const hit = (s) => { const c = parse(s); if (!c || c.a === 0) return -1; return palette.findIndex((g) => Math.abs(c.rgb[0] - g[0]) <= 1 && Math.abs(c.rgb[1] - g[1]) <= 1 && Math.abs(c.rgb[2] - g[2]) <= 1); };
  const sk = document.getElementById('skills');
  if (!sk) return { error: 'no #skills' };
  const rows = [];
  for (const el of sk.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || Number(s.opacity) === 0) continue;
    const via = [];
    for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'fill', 'stroke', 'outlineColor']) {
      if (hit(s[prop]) >= 0) via.push(prop + '=' + s[prop]);
    }
    if (!via.length) continue;
    rows.push({ tag: el.tagName, cls: (el.className?.toString?.() || el.className?.baseVal || '').slice(0, 70), text: (el.innerText || '').trim().slice(0, 40), x: Math.round(r.x), y: Math.round(r.y), via: via.join(' | '), licensed: !!el.closest(licensed) });
  }
  return { count: rows.length, nodes: rows };
};

const SKILLS_CONTRAST = () => {
  const lum = (r, g, b) => { const c = (v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b); };
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const effBg = (el) => { let n = el, acc = null; while (n) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { acc = acc ? over(acc, c) : c; if (acc.a >= 0.999) return acc; } n = n.parentElement; } return acc && acc.a >= 0.999 ? acc : { r: 10, g: 10, b: 10, a: 1 }; };
  const sk = document.getElementById('skills'); if (!sk) return { error: 'no skills' };
  const rows = [...sk.querySelectorAll('*')].filter((el) => el.children.length === 0 && (el.innerText || '').trim().length > 1 && el.getBoundingClientRect().width > 0).map((el) => {
    const s = getComputedStyle(el); const fg = parse(s.color) || { r: 255, g: 255, b: 255, a: 1 }; const bg = effBg(el);
    const flat = fg.a < 1 ? over(fg, bg) : fg; const l1 = lum(flat.r, flat.g, flat.b), l2 = lum(bg.r, bg.g, bg.b);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(s.fontSize), bold = parseInt(s.fontWeight, 10) >= 700; const need = (px >= 24 || (px >= 18.66 && bold)) ? 3 : 4.5;
    return { t: el.innerText.trim().slice(0, 40), cls: (el.className?.toString?.() || '').slice(0, 50), ratio: +ratio.toFixed(2), px, need, pass: ratio >= need };
  });
  return { total: rows.length, fails: rows.filter((r) => !r.pass), min: rows.length ? Math.min(...rows.map((r) => r.ratio)) : null };
};

const out = {};
// ---------- A: 390 /?gl=force skills-bench, long settle, generous scroll ----------
{
  const browser = await chromium.launch(LAUNCH);
  for (const [label, w, h] of [['390-glforce-long', 390, 844], ['1440-glforce-long', 1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 400)));
    await page.goto(`${BASE}/?gl=force`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1500);
    const trace = [];
    for (let i = 0; i < 6; i++) {
      await page.locator('#skills').scrollIntoViewIfNeeded();
      await page.evaluate(() => document.querySelector('[data-scene="skills-bench"]')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
      await page.waitForTimeout(2000);
      trace.push(await page.evaluate(() => {
        const slot = document.querySelector('[data-scene="skills-bench"]');
        const r = slot?.getBoundingClientRect();
        const c = slot?.querySelector('canvas');
        let gl = null; if (c) { try { gl = c.getContext('webgl2') ? 'webgl2-live' : (c.getContext('webgl') ? 'webgl-live' : 'no-gl'); } catch { gl = 'err'; } }
        return { t: Date.now() % 100000, slotBox: r ? { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top) } : null, canvasesInSkills: document.getElementById('skills')?.querySelectorAll('canvas').length ?? -1, totalCanvases: document.querySelectorAll('canvas').length, gl, slotHTML: (slot?.innerHTML || '').slice(0, 200) };
      }));
    }
    const gold = await page.evaluate(GOLD_EXACT, { palette: ANY_GOLD, licensed: LICENSED });
    const goldSat = await page.evaluate(GOLD_EXACT, { palette: SATURATED_GOLD, licensed: LICENSED });
    const contrast = await page.evaluate(SKILLS_CONTRAST);
    const bench = await page.evaluate(() => { const sk = document.getElementById('skills'); const svgs = [...sk.querySelectorAll('svg')].map((s) => { const r = s.getBoundingClientRect(); const cs = getComputedStyle(s); return { cls: (s.className?.baseVal || '').slice(0, 50), w: Math.round(r.width), h: Math.round(r.height), display: cs.display, visibility: cs.visibility, opacity: cs.opacity }; }); return { svgs, textLen: sk.innerText.trim().length, height: Math.round(sk.getBoundingClientRect().height), headings: [...sk.querySelectorAll('h2,h3')].map((x) => x.innerText.trim().slice(0, 50)) }; });
    await page.screenshot({ path: path.join(OUT, `${label}-skills.png`), fullPage: false });
    out[label] = { pageerrors: errs, trace, goldAny: { count: gold.count, nodes: gold.nodes }, goldSaturated: { count: goldSat.count, nodes: goldSat.nodes }, contrast, bench };
    console.log(`${label}: err=${errs.length} canvasTrace=${trace.map((t) => t.canvasesInSkills).join('>')} gl=${trace[trace.length - 1].gl} slot=${JSON.stringify(trace[trace.length - 1].slotBox)} goldAny=${gold.count} goldSat=${goldSat.count} contrastFails=${contrast.fails.length} min=${contrast.min} svg=${JSON.stringify(bench.svgs)}`);
    await ctx.close();
  }
  await browser.close();
}

// ---------- B: reduced motion + no-GL headless (section whole & readable) ----------
{
  const browser = await chromium.launch(LAUNCH_NOGL);
  for (const [label, rm] of [['1440-nogl-normal', false], ['1440-nogl-reduced', true]]) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: rm ? 'reduce' : 'no-preference', deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 400)));
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    const st = await page.evaluate(() => { const sk = document.getElementById('skills'); return { canvases: sk.querySelectorAll('canvas').length, totalCanvases: document.querySelectorAll('canvas').length, svgs: [...sk.querySelectorAll('svg')].map((s) => { const r = s.getBoundingClientRect(); const cs = getComputedStyle(s); return { cls: (s.className?.baseVal || '').slice(0, 50), w: Math.round(r.width), h: Math.round(r.height), display: cs.display, visibility: cs.visibility, opacity: cs.opacity, paths: s.querySelectorAll('path,line,circle,rect').length }; }), textLen: sk.innerText.trim().length, height: Math.round(sk.getBoundingClientRect().height), headings: [...sk.querySelectorAll('h2,h3')].map((x) => x.innerText.trim().slice(0, 50)), rows: sk.querySelectorAll('li,tr').length }; });
    const contrast = await page.evaluate(SKILLS_CONTRAST);
    await page.screenshot({ path: path.join(OUT, `${label}-skills.png`) });
    out[label] = { pageerrors: errs, ...st, contrast };
    console.log(`${label}: err=${errs.length} skillsCanvas=${st.canvases} svg=${JSON.stringify(st.svgs)} textLen=${st.textLen} rows=${st.rows} contrastFails=${contrast.fails.length}`);
    await ctx.close();
  }
  await browser.close();
}

// ---------- C: LCP / CLS at 1280x720 ----------
{
  const browser = await chromium.launch(LAUNCH_NOGL);
  const runs = [];
  for (let i = 0; i < 3; i++) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__lcp = 0; window.__cls = 0; window.__lcpEl = '';
      new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__lcp = e.startTime; window.__lcpEl = (e.element?.tagName || '') + '.' + (e.element?.className?.toString?.() || '').slice(0, 40) + ' ' + (e.url || '').split('/').pop(); } }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(4000);
    const m = await page.evaluate(() => ({ lcp: window.__lcp, cls: +window.__cls.toFixed(5), lcpEl: window.__lcpEl, nav: performance.getEntriesByType('navigation')[0]?.duration }));
    runs.push(m);
    console.log(`lcp-run-${i}: lcp=${Math.round(m.lcp)}ms cls=${m.cls} el=${m.lcpEl}`);
    await ctx.close();
  }
  out.webvitals1280 = { runs, medianLcp: runs.map((r) => r.lcp).sort((a, b) => a - b)[1], maxCls: Math.max(...runs.map((r) => r.cls)) };
  await browser.close();
}

fs.writeFileSync(path.join(OUT, 'probeC-final.json'), JSON.stringify(out, null, 2));
console.log('WROTE probeC-final.json');
