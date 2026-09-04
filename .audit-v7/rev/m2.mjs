import { chromium } from 'playwright';
const URL = 'https://forgotten-mistory.web.app/';
const W = Number(process.argv[2] || 1440), H = Number(process.argv[3] || 900);
const browser = await chromium.launch({ headless: false });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, reducedMotion: 'no-preference', deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(2500);
const docH = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < docH; y += 400) { await page.evaluate((y) => window.scrollTo(0, y), y); await page.waitForTimeout(70); }
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(1200);

const out = await page.evaluate(() => {
  const R = {};
  const root = getComputedStyle(document.documentElement);
  const tok = (n) => root.getPropertyValue(n).trim();
  const ancAlpha = (el) => { let a = 1, n = el; while (n && n !== document.documentElement) { const o = parseFloat(getComputedStyle(n).opacity); if (!isNaN(o)) a *= o; n = n.parentElement; } return a; };
  R.live = [...document.querySelectorAll('#vitrine [class*="live"]')].map(e => ({ tag: e.tagName, cls: (e.className.baseVal || e.className || '').toString(), color: getComputedStyle(e).color, anc: +ancAlpha(e).toFixed(3), fs: getComputedStyle(e).fontSize, txt: e.textContent.trim().slice(0, 40), href: e.getAttribute && e.getAttribute('href') }));

  // svg text
  R.svgText = [];
  for (const svg of document.querySelectorAll('svg[viewBox]')) {
    const vb = svg.getAttribute('viewBox').split(/[\s,]+/).map(Number);
    const bb = svg.getBoundingClientRect(); if (!bb.width) continue;
    const scale = bb.width / vb[2];
    const seen = new Set();
    for (const t of svg.querySelectorAll('text,tspan')) {
      const cs = getComputedStyle(t);
      const cls = String((t.className && (t.className.baseVal ?? t.className)) || t.tagName);
      const key = cls + ':' + cs.fontSize; if (seen.has(key)) continue; seen.add(key);
      R.svgText.push({ sec: svg.closest('section[id]')?.id || '?', cls: cls.slice(0, 44), declaredFs: cs.fontSize, scale: +scale.toFixed(3), renderedPx: +(parseFloat(cs.fontSize) * scale).toFixed(2), fill: cs.fill, opacity: +ancAlpha(t).toFixed(3), txt: t.textContent.trim().slice(0, 12), n: svg.querySelectorAll(`[class*="${cls.split(' ')[0]}"]`).length });
    }
  }
  R.fsMicro = tok('--fs-micro');

  R.sections = [...document.querySelectorAll('section[id]')].map(s => { const cs = getComputedStyle(s); return { id: s.id, pt: cs.paddingTop, pb: cs.paddingBottom }; });
  R.beatPad = tok('--beat-pad');

  // outermost content container left per section
  R.cols = [...document.querySelectorAll('section[id]')].map(s => {
    let best = null;
    for (const el of s.children) { const r = el.getBoundingClientRect(); if (r.width > 100 && (!best || r.width > best.w)) best = { w: +r.width.toFixed(1), left: +r.left.toFixed(1), cls: (el.className || '').toString().slice(0, 30) }; }
    // deepest widest text container
    let inner = null;
    for (const el of s.querySelectorAll('h2,h1,[class*="lede"],[class*="title"]')) { const r = el.getBoundingClientRect(); if (r.width > 50 && (!inner || r.left < inner.left)) inner = { left: +r.left.toFixed(1), w: +r.width.toFixed(1), cls: (el.className || '').toString().slice(0, 30) }; }
    let art = null;
    for (const el of s.querySelectorAll('svg,canvas,figure,table,ol,ul')) { const r = el.getBoundingClientRect(); if (r.width > 100) { art = { left: +r.left.toFixed(1), w: +r.width.toFixed(1), tag: el.tagName }; break; } }
    return { id: s.id, outer: best, headLeft: inner, artefact: art };
  });

  const rb = (e) => e ? (r => ({ l: +r.left.toFixed(1), t: +(r.top + scrollY).toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), b: +(r.bottom + scrollY).toFixed(1) }))(e.getBoundingClientRect()) : null;
  R.exp = {
    chart: rb(document.querySelector('#experience [class*="Experience_chart__"]')),
    scene: rb(document.querySelector('#experience [class*="chartScene"]')),
    openNote: rb(document.querySelector('#experience [class*="openNote"]')),
    axis: rb(document.querySelector('#experience [class*="Experience_axis"]')),
    grid: rb(document.querySelector('#experience [class*="grid"]')),
    rows: [...document.querySelectorAll('#experience [class*="trackRow"]')].slice(0, 3).map(rb),
    sceneInset: (e => e ? getComputedStyle(e).inset : null)(document.querySelector('#experience [class*="chartScene"]')),
    companies: [...document.querySelectorAll('#experience [class*="trackCompany"]')].map(e => ({ txt: e.textContent.trim().slice(0, 40), l: +e.getBoundingClientRect().left.toFixed(1), r: +e.getBoundingClientRect().right.toFixed(1) })),
  };
  const allCls = new Set(); document.querySelectorAll('#experience *').forEach(e => (e.className || '').toString().split(/\s+/).forEach(c => c && allCls.add(c)));
  R.expClasses = [...allCls].filter(c => /chart|axis|grid|track|note/i.test(c));

  R.caliper = [...document.querySelectorAll('[class*="aliper"]')].map(e => e.getAttribute('data-state'));

  const monoEls = [...document.querySelectorAll('*')].filter(e => /Plex.?Mono/i.test(getComputedStyle(e).fontFamily) && [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()));
  R.craft = {
    monoTotal: monoEls.length,
    monoTabular: monoEls.filter(e => /tabular-nums/.test(getComputedStyle(e).fontVariantNumeric)).length,
    monoTabularSample: monoEls.filter(e => /tabular-nums/.test(getComputedStyle(e).fontVariantNumeric)).slice(0, 6).map(e => (e.className || '').toString().slice(0, 30)),
    h2: [...document.querySelectorAll('h1,h2')].map(e => ({ t: e.textContent.trim().slice(0, 24), wrap: getComputedStyle(e).textWrap || getComputedStyle(e).textWrapStyle })),
    lede: [...document.querySelectorAll('[class*="lede"]')].map(e => ({ cls: (e.className || '').toString().slice(0, 24), wrap: getComputedStyle(e).textWrap || getComputedStyle(e).textWrapStyle, hang: getComputedStyle(e).hangingPunctuation })),
  };
  // vitrine metric figures alignment
  R.vitMetricRights = [...document.querySelectorAll('#vitrine [class*="metric"], #vitrine [class*="figure"]')].slice(0, 12).map(e => ({ cls: (e.className || '').toString().slice(0, 26), txt: e.textContent.trim().slice(0, 20), r: +e.getBoundingClientRect().right.toFixed(1), fvn: getComputedStyle(e).fontVariantNumeric }));

  // minivic
  const mv = document.querySelector('[class*="minivic" i], [id*="mini" i], button[aria-label*="Mini" i], button[aria-label*="clone" i]');
  R.mvOuter = mv ? mv.outerHTML.slice(0, 900) : null;
  R.mvBodyTail = document.body.lastElementChild ? document.body.lastElementChild.outerHTML.slice(0, 900) : null;

  // letter-spacing distinct values
  const ls = {};
  for (const el of document.querySelectorAll('*')) { const v = getComputedStyle(el).letterSpacing; if (v && v !== 'normal') { const fs = parseFloat(getComputedStyle(el).fontSize); const em = (parseFloat(v) / fs).toFixed(3); ls[em] = (ls[em] || 0) + 1; } }
  R.letterSpacingEm = ls;
  R.fontsLoaded = [...document.fonts].map(f => `${f.family} ${f.weight} ${f.style}`).filter((v, i, a) => a.indexOf(v) === i);
  return R;
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
