// Independent adversarial re-measurement — cross-cutting design system dimension.
import { chromium } from 'playwright';

const URL = 'https://forgotten-mistory.web.app/';
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900);

const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, reducedMotion: 'no-preference', deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(2500);
// scroll through so lazy artefacts mount
const docH = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < docH; y += 400) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(70); }
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1500);

const env = await page.evaluate(() => {
  const c = document.createElement('canvas');
  const g = c.getContext('webgl2') || c.getContext('webgl');
  const d = g && g.getExtension('WEBGL_debug_renderer_info');
  return {
    rmReduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    renderer: d ? g.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'none',
    canvases: document.querySelectorAll('canvas').length,
    commit: document.querySelector('meta[name="commit"]')?.content || null,
    docH: document.documentElement.scrollHeight,
  };
});

const out = await page.evaluate(() => {
  const R = {};
  const root = getComputedStyle(document.documentElement);
  const tok = (n) => root.getPropertyValue(n).trim();

  // ---------- colour helpers ----------
  const parse = (s) => {
    if (!s) return null;
    let m = s.match(/rgba?\(([^)]+)\)/);
    if (m) { const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
    m = s.trim().match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/i);
    if (m) { const h = m[1]; return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: m[2] ? parseInt(m[2], 16) / 255 : 1 }; }
    return null;
  };
  const isGoldish = (c) => {
    if (!c) return false;
    const { r, g, b } = c;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    return mx - mn > 25 && r >= g && g > b; // warm chromatic
  };
  const ancAlpha = (el) => { let a = 1, n = el; while (n && n !== document.documentElement) { const o = parseFloat(getComputedStyle(n).opacity); if (!isNaN(o)) a *= o; n = n.parentElement; } return a; };

  // ---------- 1. gold mark census (rendered) ----------
  const goldMarks = [];
  const props = ['color', 'backgroundColor', 'fill', 'stroke', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor'];
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const aa = ancAlpha(el);
    if (aa < 0.05) continue;
    let hit = null;
    for (const p of props) {
      const c = parse(cs[p]);
      if (!c || c.a === 0) continue;
      if (!isGoldish(c)) continue;
      const eff = c.a * aa;
      if (eff < 0.5) continue;
      // colour on a text-bearing element only counts if it has direct text
      if (p === 'color') {
        const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length);
        if (!hasText) continue;
      }
      if (p.startsWith('border')) {
        const wprop = p.replace('Color', 'Width');
        if (parseFloat(cs[wprop]) < 0.5) continue;
      }
      hit = { prop: p, val: cs[p], eff };
      break;
    }
    // SVG gradient strokes
    if (!hit && (el.getAttribute && /^url\(/.test(el.getAttribute('stroke') || ''))) {
      const id = (el.getAttribute('stroke').match(/#([^)"']+)/) || [])[1];
      const grad = id && document.getElementById(id);
      if (grad) {
        const stops = [...grad.querySelectorAll('stop')].map(s => parse(getComputedStyle(s).stopColor));
        if (stops.some(isGoldish)) hit = { prop: 'stroke-gradient', val: id, eff: 1 };
      }
    }
    if (hit) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const sec = el.closest('section[id]')?.id || (el.closest('nav') ? 'nav' : 'chrome');
      goldMarks.push({ sec, tag: el.tagName.toLowerCase(), cls: (typeof el.className === 'string' ? el.className : el.className.baseVal || '').slice(0, 60), ...hit, top: Math.round(r.top + scrollY), h: Math.round(r.height), w: Math.round(r.width) });
    }
  }
  R.goldMarks = goldMarks;
  R.goldBySec = goldMarks.reduce((a, m) => (a[m.sec] = (a[m.sec] || 0) + 1, a), {});
  // sliding 900px window
  let maxWin = 0, atY = 0;
  const tops = goldMarks.map(m => m.top).sort((a, b) => a - b);
  for (const t of tops) { const n = tops.filter(x => x >= t && x < t + 900).length; if (n > maxWin) { maxWin = n; atY = t; } }
  R.goldMaxWindow = { count: maxWin, atScrollY: atY };

  // ---------- 2. rendered characters per line (Range walk) ----------
  const blocks = [];
  const cand = document.querySelectorAll('#hero p,#about p,#experience p,#skills p,#vitrine p,#listen p, li, blockquote, figcaption, dd');
  for (const el of cand) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none') continue;
    const txt = el.textContent.replace(/\s+/g, ' ').trim();
    if (txt.length < 90) continue;
    const rows = new Map();
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n; const rng = document.createRange();
    while ((n = walker.nextNode())) {
      const s = n.textContent;
      for (let i = 0; i < s.length; i++) {
        if (!s[i].trim()) { /* still count space width position */ }
        rng.setStart(n, i); rng.setEnd(n, i + 1);
        const r = rng.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        const key = Math.round(r.top / 2) * 2;
        rows.set(key, (rows.get(key) || 0) + 1);
      }
    }
    const counts = [...rows.entries()].sort((a, b) => a[0] - b[0]).map(e => e[1]);
    if (counts.length < 2) continue;
    const full = counts.slice(0, -1);
    const mean = full.reduce((a, b) => a + b, 0) / full.length;
    blocks.push({ sec: el.closest('section[id]')?.id || '?', cls: (el.className || '').toString().slice(0, 40), lines: counts.length, mean: +mean.toFixed(1), max: Math.max(...full), widthPx: +el.getBoundingClientRect().width.toFixed(1), fs: cs.fontSize, ff: cs.fontFamily.split(',')[0] });
    if (blocks.length > 60) break;
  }
  R.measureBlocks = blocks;
  R.measureToken = tok('--measure-read');

  // ---------- 3. vitrine plate contrast ----------
  const srgb = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (c) => 0.2126 * srgb(c.r) + 0.7152 * srgb(c.g) + 0.0722 * srgb(c.b);
  const ratio = (a, b) => { const l1 = L(a), l2 = L(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); };
  const ink = parse(tok('--ink-900')) || { r: 10, g: 11, b: 13 };
  const comp = (fg, alpha, bg) => ({ r: fg.r * alpha + bg.r * (1 - alpha), g: fg.g * alpha + bg.g * (1 - alpha), b: fg.b * alpha + bg.b * (1 - alpha) });
  const vit = [];
  for (const plate of document.querySelectorAll('#vitrine [class*="plate"]')) {
    const pcs = getComputedStyle(plate);
    const po = ancAlpha(plate);
    const items = [];
    for (const el of plate.querySelectorAll('*')) {
      const hasText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length);
      if (!hasText) continue;
      const cs = getComputedStyle(el);
      const c = parse(cs.color); if (!c) continue;
      const a = c.a * ancAlpha(el);
      const fs = parseFloat(cs.fontSize);
      const cr = ratio(comp(c, a, ink), ink);
      items.push({ cls: (el.className || '').toString().slice(0, 34), fs: +fs.toFixed(1), alpha: +a.toFixed(3), ratio: +cr.toFixed(2), txt: el.textContent.trim().slice(0, 28) });
    }
    vit.push({ plateOpacity: +po.toFixed(2), lit: plate.getAttribute('data-lit'), worst: items.sort((a, b) => a.ratio - b.ratio).slice(0, 4) });
  }
  R.vitrine = vit;
  R.vitLiveAnchors = [...document.querySelectorAll('#vitrine a')].filter(a => /github|http/.test(a.textContent)).map(a => ({ cls: (a.className || '').toString().slice(0, 30), color: getComputedStyle(a).color, anc: +ancAlpha(a).toFixed(2), txt: a.textContent.trim().slice(0, 30) })).slice(0, 8);
  R.goldLiveVar = tok('--gold-live') || '(empty)';

  // ---------- 4. SVG text rendered size ----------
  const svgText = [];
  for (const svg of document.querySelectorAll('svg[viewBox]')) {
    const vb = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
    const bb = svg.getBoundingClientRect();
    if (!bb.width) continue;
    const scale = bb.width / vb[2];
    const seen = new Set();
    for (const t of svg.querySelectorAll('text,tspan')) {
      const cs = getComputedStyle(t);
      const declared = parseFloat(cs.fontSize);
      const rendered = declared * scale;
      const cls = (t.className && (t.className.baseVal || t.className)) || t.tagName;
      const key = String(cls) + ':' + declared.toFixed(2);
      if (seen.has(key)) continue; seen.add(key);
      const c = parse(cs.fill) || parse(cs.color);
      const a = (c ? c.a : 1) * ancAlpha(t);
      svgText.push({ sec: svg.closest('section[id]')?.id || '?', cls: String(cls).slice(0, 40), declared: +declared.toFixed(2), scale: +scale.toFixed(3), rendered: +rendered.toFixed(2), ratio: c ? +ratio(comp(c, a, ink), ink).toFixed(2) : null, txt: t.textContent.trim().slice(0, 14) });
    }
  }
  R.svgText = svgText;
  R.fsMicro = tok('--fs-micro');

  // ---------- 5. section padding + column lefts ----------
  const secs = [...document.querySelectorAll('section[id]')].map(s => {
    const cs = getComputedStyle(s);
    // widest child box
    let best = null;
    for (const el of s.querySelectorAll('*')) {
      const r = el.getBoundingClientRect();
      if (r.width > 100 && (!best || r.width > best.w)) best = { w: r.width, left: r.left, cls: (el.className || '').toString().slice(0, 34) };
    }
    return { id: s.id, pt: cs.paddingTop, pb: cs.paddingBottom, widest: best ? { left: +best.left.toFixed(1), w: +best.w.toFixed(1), cls: best.cls } : null };
  });
  R.sections = secs;
  R.beatPad = tok('--beat-pad');

  // ---------- 6. experience chart geometry ----------
  const chart = document.querySelector('#experience [class*="chart"]:not([class*="Scene"])');
  const scene = document.querySelector('#experience [class*="chartScene"]');
  const openNote = document.querySelector('#experience [class*="openNote"]');
  const axis = document.querySelector('#experience [class*="axis"]');
  const rb = (e) => e ? (r => ({ l: +r.left.toFixed(1), t: +(r.top + scrollY).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1) }))(e.getBoundingClientRect()) : null;
  R.exp = { chart: rb(chart), scene: rb(scene), openNote: rb(openNote), axis: rb(axis), sceneInset: scene ? getComputedStyle(scene).inset : null };
  R.expCompanies = [...document.querySelectorAll('#experience [class*="trackCompany"]')].map(e => ({ txt: e.textContent.trim().slice(0, 34), right: +e.getBoundingClientRect().right.toFixed(1) })).slice(0, 10);

  // ---------- 7. caliper states ----------
  R.caliperStates = [...document.querySelectorAll('[class*="aliper"]')].map(e => e.getAttribute('data-state')).reduce((a, s) => (a[s] = (a[s] || 0) + 1, a), {});

  // ---------- 8. craft signals ----------
  const monoEls = [...document.querySelectorAll('*')].filter(e => /Plex Mono|mono/i.test(getComputedStyle(e).fontFamily) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  R.craft = {
    monoTotal: monoEls.length,
    monoTabular: monoEls.filter(e => /tabular-nums/.test(getComputedStyle(e).fontVariantNumeric)).length,
    h2Total: document.querySelectorAll('h1,h2').length,
    h2Balance: [...document.querySelectorAll('h1,h2')].filter(e => getComputedStyle(e).textWrap === 'balance' || getComputedStyle(e).textWrapStyle === 'balance').length,
    ledeTotal: document.querySelectorAll('[class*="lede"]').length,
    ledePretty: [...document.querySelectorAll('[class*="lede"]')].filter(e => { const c = getComputedStyle(e); return c.textWrap === 'pretty' || c.textWrapStyle === 'pretty'; }).length,
    hangingAny: [...document.querySelectorAll('[class*="lede"],p')].filter(e => (getComputedStyle(e).hangingPunctuation || 'none') !== 'none').length,
  };

  // ---------- 9. minivic ----------
  const mv = document.querySelector('[class*="mini-vic"],#mini-vic,[id*="mini-vic"],[class*="MiniVic"]') || document.querySelector('button[aria-label*="Mini" i]');
  R.miniVic = mv ? { id: mv.id, cls: (mv.className || '').toString().slice(0, 120), outer: mv.outerHTML.slice(0, 400) } : null;

  // ---------- 10. fonts ----------
  R.fontVars = { serif: tok('--font-serif'), serifIt: tok('--font-serif-italic'), sans: tok('--font-sans'), mono: tok('--font-mono') };

  return R;
});

console.log(JSON.stringify({ viewport: [W, H], env, ...out }, null, 1));
await browser.close();
