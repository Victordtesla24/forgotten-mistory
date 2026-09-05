// G-REV phase 2 — G-H1 re-probe on live 9b864752.
// Method reused from ../../9ba97a5c/captures/probe.mjs (same fold inventory,
// same leaf/paragraph/CTA definitions) so the numbers are comparable.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const BASE = 'https://forgotten-mistory.web.app';
const LAUNCH = {
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
};

function wire(page, bag) {
  bag.console = []; bag.pageerrors = []; bag.failed = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') bag.console.push({ type: m.type(), text: m.text().slice(0, 300) }); });
  page.on('pageerror', (e) => bag.pageerrors.push(String(e).slice(0, 500)));
  page.on('requestfailed', (r) => bag.failed.push({ url: r.url(), err: r.failure()?.errorText }));
}

const MEASURE = () => {
  const out = {};
  const inFold = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.width > 0 && r.height > 0; };
  const words = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;
  out.viewport = { w: innerWidth, h: innerHeight, dpr: devicePixelRatio };
  out.buildCommit = document.querySelector('meta[name="build-commit"]')?.content || null;
  out.canvases = { total: document.querySelectorAll('canvas').length, bySection: {} };
  for (const id of ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen']) {
    const s = document.getElementById(id);
    out.canvases.bySection[id] = s ? s.querySelectorAll('canvas').length : 'SECTION-MISSING';
  }
  out.canvasDetail = [...document.querySelectorAll('canvas')].map((c) => {
    const r = c.getBoundingClientRect();
    let ctx = 'unknown';
    try { ctx = c.getContext('webgl2') ? 'webgl2-live' : (c.getContext('webgl') ? 'webgl-live' : 'no-gl'); } catch { ctx = 'ctx-err'; }
    return { section: c.closest('section')?.id || null, dataScene: c.closest('[data-scene]')?.dataset?.scene || null, w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height), ctx };
  });

  const hero = document.getElementById('hero');
  if (!hero) { out.hero = 'MISSING'; return out; }

  // --- structural bands (0506e7e) ---
  const fold = hero.querySelector('[data-testid="hero-fold"]');
  const proof = hero.querySelector('[data-testid="hero-proof"]');
  const rectOf = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width) }; };
  out.bands = { foldTestid: !!fold, proofTestid: !!proof, foldRect: rectOf(fold), proofRect: rectOf(proof), innerHeight };

  // --- fold inventory (identical definitions to phase 1) ---
  const h1 = [...hero.querySelectorAll('h1')];
  const paras = [...hero.querySelectorAll('p, li')].filter(inFold)
    .map((p) => ({ tag: p.tagName, words: words(p.innerText), text: p.innerText.trim().slice(0, 160), top: Math.round(p.getBoundingClientRect().top) }));
  const ctas = [...hero.querySelectorAll('a[href], button')].filter(inFold)
    .map((a) => ({ tag: a.tagName, text: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 60), top: Math.round(a.getBoundingClientRect().top), href: a.getAttribute('href'), testid: a.closest('[data-testid]')?.dataset?.testid || null, cls: (a.className?.toString?.() || '').slice(0, 90) }));
  const leaves = [...hero.querySelectorAll('*')].filter((el) => el.children.length === 0 && (el.innerText || '').trim().length > 1 && inFold(el));
  out.hero = {
    rect: rectOf(hero),
    h1Count: h1.length,
    h1Text: h1.map((h) => h.innerText.trim().slice(0, 120)),
    h1InFold: h1.filter(inFold).length,
    headingsInFold: [...hero.querySelectorAll('h1,h2,h3,h4')].filter(inFold).map((h) => ({ tag: h.tagName, text: h.innerText.trim().slice(0, 100) })),
    paragraphsInFold: paras,
    paragraphsOver12Words: paras.filter((p) => p.words > 12).length,
    ctaInFold: ctas,
    ctaCount: ctas.length,
    textLeavesInFold: leaves.length,
    textLeafSample: leaves.map((l) => ({ t: l.innerText.trim().slice(0, 60), top: Math.round(l.getBoundingClientRect().top), tag: l.tagName })),
  };
  // CTA groups: distinct nearest ancestor that holds >=1 in-fold CTA
  const groupKeys = new Map();
  for (const a of [...hero.querySelectorAll('a[href], button')].filter(inFold)) {
    const g = a.parentElement;
    const key = (g?.dataset?.testid) || (g?.className?.toString?.() || '') || 'ROOT';
    if (!groupKeys.has(key)) groupKeys.set(key, []);
    groupKeys.get(key).push((a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 40));
  }
  out.hero.ctaGroups = [...groupKeys.entries()].map(([k, v]) => ({ group: k.slice(0, 90), items: v }));
  out.hero.ctaGroupCount = groupKeys.size;

  // --- ledger / grading / availability positions vs innerHeight ---
  const ul = hero.querySelector('ul');
  out.hero.ulTop = ul ? Math.round(ul.getBoundingClientRect().top) : null;
  out.hero.ulInFold = ul ? ul.getBoundingClientRect().top < innerHeight : null;
  const lis = ul ? [...ul.querySelectorAll('li')] : [];
  out.hero.ulLiCount = lis.length;
  out.hero.ulLiText = lis.map((l) => l.innerText.replace(/\s+/g, ' ').trim().slice(0, 90));
  const heroText = hero.innerText;
  out.ct10 = { ulLiCount: lis.length, has92: /92/.test(heroText), has5M: /\$5M\+/.test(heroText), has10k: /10k\+/.test(heroText) };

  const findByText = (re) => [...hero.querySelectorAll('*')].filter((el) => el.children.length === 0 && re.test(el.innerText || ''))
    .map((el) => ({ text: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 90), top: Math.round(el.getBoundingClientRect().top), inFold: el.getBoundingClientRect().top < innerHeight }));
  out.hero.availabilityNodes = findByText(/availab|notice|open to|engaged|contract/i);
  out.hero.gradingNodes = findByText(/self-reported|sourced|grading|figure/i).slice(0, 20);
  const availEl = hero.querySelector('[data-testid="hero-availability"]');
  out.hero.availabilityTop = availEl ? Math.round(availEl.getBoundingClientRect().top) : null;
  out.hero.availabilityInFold = availEl ? availEl.getBoundingClientRect().top < innerHeight : null;
  out.hero.caliperMarksInFold = [...hero.querySelectorAll('[class*="aliper" i], [data-caliper]')].filter(inFold).length;

  // --- dominant visual ---
  const media = [...hero.querySelectorAll('canvas,video,img,picture')].map((m) => { const r = m.getBoundingClientRect(); return { tag: m.tagName, cssW: Math.round(r.width), cssH: Math.round(r.height), area: Math.round(r.width * r.height), top: Math.round(r.top), src: (m.currentSrc || m.getAttribute('src') || '').split('/').pop() }; }).sort((a, b) => b.area - a.area);
  out.hero.media = media;
  out.hero.foldArea = innerWidth * innerHeight;
  out.hero.dominantMediaCoverage = media.length ? +(media[0].area / (innerWidth * innerHeight)).toFixed(4) : 0;
  // stage: the element the prompt calls "the stage"
  const stage = hero.querySelector('[class*="stage" i]');
  if (stage) {
    const r = stage.getBoundingClientRect();
    const vx = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
    const vy = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    out.hero.stage = { cls: stage.className.toString().slice(0, 90), cssW: Math.round(r.width), cssH: Math.round(r.height), top: Math.round(r.top), visibleInFoldCoverage: +((vx * vy) / (innerWidth * innerHeight)).toFixed(4), bgImage: getComputedStyle(stage).backgroundImage.slice(0, 260) };
  } else out.hero.stage = null;
  // photograph
  const photo = [...hero.querySelectorAll('img')].map((i) => { const r = i.getBoundingClientRect(); return { src: (i.currentSrc || i.src).split('/').pop(), cssW: Math.round(r.width), cssH: Math.round(r.height), top: Math.round(r.top), visible: r.width > 0 && r.height > 0, inFold: inFold(i) }; });
  out.hero.photos = photo;

  // --- text plates (flagship-C regression) ---
  out.hero.plates = [...hero.querySelectorAll('*')].filter((el) => {
    const s = getComputedStyle(el);
    return /rgba?\(10,\s*10,\s*10/.test(s.backgroundColor) || /rgb\(10 10 10/.test(s.backgroundColor);
  }).map((el) => { const r = el.getBoundingClientRect(); return { cls: (el.className?.toString?.() || '').slice(0, 80), bg: getComputedStyle(el).backgroundColor, w: Math.round(r.width), h: Math.round(r.height) }; });

  return out;
};

// --- AA contrast walk over #hero (same shape as tests/a11y/text-contrast) ---
const CONTRAST = () => {
  const lum = (r, g, b) => { const c = (v) => { const x = v / 255; return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); }; return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b); };
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const effBg = (el) => {
    let n = el;
    let acc = null;
    while (n) {
      const c = parse(getComputedStyle(n).backgroundColor);
      if (c && c.a > 0) { acc = acc ? over(acc, c) : c; if (acc.a >= 0.999) return acc; }
      n = n.parentElement;
    }
    return acc && acc.a >= 0.999 ? acc : { r: 10, g: 10, b: 10, a: 1 };
  };
  const hero = document.getElementById('hero');
  if (!hero) return { error: 'no hero' };
  const nodes = [...hero.querySelectorAll('*')].filter((el) => el.children.length === 0 && (el.innerText || '').trim().length > 1 && el.getBoundingClientRect().width > 0);
  const rows = nodes.map((el) => {
    const s = getComputedStyle(el);
    const fg = parse(s.color) || { r: 255, g: 255, b: 255, a: 1 };
    const bg = effBg(el);
    const flat = fg.a < 1 ? over(fg, bg) : fg;
    const l1 = lum(flat.r, flat.g, flat.b); const l2 = lum(bg.r, bg.g, bg.b);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(s.fontSize); const bold = parseInt(s.fontWeight, 10) >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const need = large ? 3 : 4.5;
    return { t: el.innerText.trim().slice(0, 44), cls: (el.className?.toString?.() || '').slice(0, 50), ratio: +ratio.toFixed(2), px, need, pass: ratio >= need, top: Math.round(el.getBoundingClientRect().top) };
  });
  return { total: rows.length, fails: rows.filter((r) => !r.pass), min: rows.length ? Math.min(...rows.map((r) => r.ratio)) : null };
};

async function boot(page, url) {
  const r = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1800);
  return r?.status();
}

const results = {};
const browser = await chromium.launch(LAUNCH);
const VIEWPORTS = [
  { w: 1440, h: 900 }, { w: 1280, h: 800 }, { w: 834, h: 1194 }, { w: 390, h: 844 },
];
for (const vp of VIEWPORTS) {
  for (const mode of ['normal', 'glforce']) {
    if (mode === 'glforce' && vp.w !== 1440 && vp.w !== 390) continue;
    const key = `${vp.w}-${mode}`;
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const bag = {}; wire(page, bag);
    const status = await boot(page, mode === 'glforce' ? `${BASE}/?gl=force` : `${BASE}/`);
    const measure = await page.evaluate(MEASURE);
    const contrast = await page.evaluate(CONTRAST);
    await page.screenshot({ path: path.join(OUT, `${key}-fold.png`) });
    results[key] = { status, ...bag, measure, contrast };
    await ctx.close();
    console.log(`${key}: status=${status} pageerrors=${bag.pageerrors.length} leaves=${measure.hero?.textLeavesInFold} p>12w=${measure.hero?.paragraphsOver12Words} ctas=${measure.hero?.ctaCount}/${measure.hero?.ctaGroupCount}g ulTop=${measure.hero?.ulTop} availTop=${measure.hero?.availabilityTop} stageCov=${measure.hero?.stage?.visibleInFoldCoverage} domMedia=${measure.hero?.dominantMediaCoverage} canvases=${measure.canvases.total} contrastFails=${contrast.fails?.length}`);
  }
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'probeA-hero.json'), JSON.stringify(results, null, 2));
console.log('WROTE probeA-hero.json');
