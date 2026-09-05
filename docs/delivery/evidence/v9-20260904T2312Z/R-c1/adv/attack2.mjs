import { chromium } from 'playwright';
import fs from 'node:fs';
const URL = 'https://forgotten-mistory.web.app/';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c1/adv';
const R = {};
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = []; page.on('console', m => m.type() === 'error' && errs.push(m.text().slice(0, 300)));
page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 300)));
await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForTimeout(3000);
await page.evaluate(async () => { const H = document.body.scrollHeight; for (let y = 0; y < H; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 80)); } window.scrollTo(0, 0); });
await page.waitForTimeout(2500);

R.canvasGlobal = await page.evaluate(() => {
  const cs = [...document.querySelectorAll('canvas')];
  return { count: cs.length, list: cs.map(c => { const r = c.getBoundingClientRect(); return { w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height), parentSection: (c.closest('section,[id]') || {}).id || null, cls: c.className.toString().slice(0, 60) }; }) };
});
R.svgGlobal = await page.evaluate(() => [...document.querySelectorAll('svg')].map(s => ({ sec: (s.closest('section[id]') || {}).id || null, w: Math.round(s.getBoundingClientRect().width), h: Math.round(s.getBoundingClientRect().height), animEls: s.querySelectorAll('animate,animateTransform,animateMotion').length })));
R.runningAnimationsNormal = await page.evaluate(() => document.getAnimations().map(a => ({ st: a.playState, name: a.animationName || a.transitionProperty || '?', tgt: a.effect?.target?.tagName + '.' + String(a.effect?.target?.className || '').slice(0, 30) })).filter(a => a.st === 'running').slice(0, 30));

// gold inventory
R.gold = await page.evaluate(() => {
  const hits = [];
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    for (const p of ['color', 'backgroundColor', 'borderTopColor', 'borderBottomColor', 'borderLeftColor', 'fill', 'stroke']) {
      const v = cs[p]; if (!v) continue;
      const m = v.match(/rgba?\((\d+), ?(\d+), ?(\d+)/); if (!m) continue;
      const [r, g, b] = [+m[1], +m[2], +m[3]];
      if (r > 150 && g > 120 && b < 130 && r > b + 60) {
        if (el.children.length === 0 || p !== 'color') hits.push({ p, v, tag: el.tagName, sec: (el.closest('section[id]') || {}).id || 'chrome', txt: (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 60), href: el.getAttribute('href') || null });
      }
    }
  }
  const byKey = {};
  for (const h of hits) { const k = h.sec + '|' + h.p + '|' + h.txt; byKey[k] = (byKey[k] || 0) + 1; }
  return { total: hits.length, unique: Object.entries(byKey).slice(0, 60) };
});

// full tab sweep until minivic or 200
R.tabSweep = await page.evaluate(() => {
  const foc = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(e => { const r = e.getBoundingClientRect(); return !(r.width === 0 && r.height === 0); });
  const mv = document.querySelector('[data-testid="minivic-toggle"]');
  return { totalFocusable: foc.length, minivicIndex: mv ? foc.indexOf(mv) : -1, minivicTabindex: mv ? mv.getAttribute('tabindex') : null, lastFive: foc.slice(-5).map(e => e.tagName + ':' + (e.getAttribute('data-testid') || (e.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 30))) };
});
// verify keyboard actually lands on it
await page.evaluate(() => window.scrollTo(0, 0));
await page.keyboard.press('Tab');
let found = -1;
for (let i = 1; i <= 140; i++) {
  const hit = await page.evaluate(() => document.activeElement?.getAttribute('data-testid') === 'minivic-toggle');
  if (hit) { found = i; break; }
  await page.keyboard.press('Tab');
}
R.minivicReachedAtTab = found;

// contrast spot-checks on the low-contrast greys
R.contrast = await page.evaluate(() => {
  const lum = c => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
  const L = (r, g, b) => 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  const parse = v => { const m = v.match(/rgba?\((\d+), ?(\d+), ?(\d+)(?:, ?([\d.]+))?\)/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
  const bgOf = el => { let n = el; while (n && n !== document.documentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c && c[3] > 0.5) return c; n = n.parentElement; } return [10, 11, 13, 1]; };
  const out = [];
  for (const el of document.querySelectorAll('p,span,li,a,h1,h2,h3,h4,small,div')) {
    if (el.children.length) continue;
    const t = (el.innerText || '').trim(); if (t.length < 3) continue;
    const cs = getComputedStyle(el); const fg = parse(cs.color); if (!fg) continue;
    const bg = bgOf(el);
    const l1 = L(fg[0], fg[1], fg[2]), l2 = L(bg[0], bg[1], bg[2]);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const fs = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight) >= 700;
    const large = fs >= 24 || (fs >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    if (ratio < need) out.push({ txt: t.slice(0, 48), fg: cs.color, bg: `rgb(${bg[0]},${bg[1]},${bg[2]})`, fs, ratio: +ratio.toFixed(2), need, sec: (el.closest('section[id]') || {}).id || 'chrome' });
  }
  return { failing: out.length, sample: out.slice(0, 20) };
});
R.consoleErrors = errs;
await ctx.close(); await browser.close();
fs.writeFileSync(OUT + '/attack2.json', JSON.stringify(R, null, 2));
console.log(JSON.stringify({ canvas: R.canvasGlobal.count, canvasList: R.canvasGlobal.list, minivicReachedAtTab: R.minivicReachedAtTab, tabSweep: R.tabSweep, goldTotal: R.gold.total, contrastFailing: R.contrast.failing, errs }, null, 1));
