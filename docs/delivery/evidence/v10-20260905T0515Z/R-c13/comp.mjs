// R-c13 composition lens probe — read-only against production.
import { chromium } from 'playwright';
import fs from 'node:fs';

const URL = 'https://forgotten-mistory.web.app/';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/R-c13';
const CAP = OUT + '/capture';
const SECTIONS = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];
const WIDTHS = [
  { w: 1440, h: 900 }, { w: 1920, h: 1080 },
  { w: 834, h: 1194 }, { w: 390, h: 844 },
];

const MEASURE = () => {
  const px = (n) => Math.round(n * 10) / 10;
  const r = (el) => { const b = el.getBoundingClientRect(); return { x: px(b.x), y: px(b.y), w: px(b.width), h: px(b.height), right: px(b.right), bottom: px(b.bottom) }; };
  const cs = (el, p) => getComputedStyle(el).getPropertyValue(p);
  const isGold = (c) => {
    const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)/.exec(c || '');
    if (!m) return false;
    const [R, G, B] = [+m[1], +m[2], +m[3]];
    // gold family: c9a84c d4b65c e8d5a3 b0923f — R>G>B with real spread
    return R > G && G > B && R - B > 30 && R > 120;
  };
  const isChromatic = (c) => {
    const m = /rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/.exec(c || '');
    if (!m) return false;
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return false;
    const [R, G, B] = [+m[1], +m[2], +m[3]];
    return !(R === G && G === B);
  };

  const out = { spine: {}, sections: {}, gold: [], chroma: [], nav: {}, minivic: {}, tokens: {} };
  const root = getComputedStyle(document.documentElement);
  for (const t of ['--page-max', '--measure-read', '--measure-display', '--gold', '--white', '--mist-400', '--ink-900', '--ink-500', '--fs-body', '--fs-lede', '--fs-small', '--nav-height'])
    out.tokens[t] = root.getPropertyValue(t).trim();

  // ---- spine: eyebrow left edge per section
  for (const id of ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen']) {
    const sec = document.getElementById(id);
    if (!sec) { out.spine[id] = null; continue; }
    // eyebrow = first element whose class contains 'eyebrow'
    const eb = sec.querySelector('[class*="eyebrow" i]');
    const head = sec.querySelector('h1,h2');
    const inner = sec.querySelector('[class*="inner" i]');
    out.spine[id] = {
      eyebrow: eb ? { text: eb.textContent.trim().slice(0, 40), ...r(eb), fs: cs(eb, 'font-size'), ls: cs(eb, 'letter-spacing'), color: cs(eb, 'color') } : null,
      heading: head ? { tag: head.tagName, text: head.textContent.trim().slice(0, 40), ...r(head), fs: cs(head, 'font-size'), lh: cs(head, 'line-height') } : null,
      inner: inner ? { ...r(inner), maxW: cs(inner, 'max-width') } : null,
      sectionBox: r(sec),
      padTop: cs(sec, 'padding-top'), padBottom: cs(sec, 'padding-bottom'),
    };
  }

  // ---- measure (ch) for running text
  const chOf = (el) => {
    const f = getComputedStyle(el).font;
    const c = document.createElement('canvas').getContext('2d');
    c.font = f; const w0 = c.measureText('0').width || 8;
    return Math.round(el.getBoundingClientRect().width / w0);
  };
  out.measures = [];
  for (const id of ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen']) {
    const sec = document.getElementById(id); if (!sec) continue;
    for (const p of sec.querySelectorAll('p')) {
      const t = p.textContent.trim(); if (t.length < 60) continue;
      out.measures.push({ sec: id, ch: chOf(p), w: Math.round(p.getBoundingClientRect().width), fs: cs(p, 'font-size'), lh: cs(p, 'line-height'), color: cs(p, 'color'), txt: t.slice(0, 46) });
    }
  }

  // ---- gold + chroma audit across whole page
  for (const el of document.querySelectorAll('#hero *,#about *,#experience *,#skills *,#vitrine *,#listen *,nav *,[data-testid="minivic-toggle"],[data-testid="minivic-toggle"] *')) {
    const s = getComputedStyle(el);
    const hits = [];
    for (const p of ['color', 'background-color', 'border-top-color', 'border-left-color', 'fill', 'stroke', 'outline-color', 'box-shadow', 'background-image']) {
      const v = s.getPropertyValue(p);
      if (!v || v === 'none' || v === 'rgba(0, 0, 0, 0)') continue;
      if (isGold(v)) hits.push(p + '=' + v.slice(0, 60));
    }
    if (hits.length) {
      const sec = el.closest('section,nav') || {};
      const b = el.getBoundingClientRect();
      if (b.width > 0 || b.height > 0)
        out.gold.push({ sec: sec.id || sec.tagName || '?', tag: el.tagName, cls: (el.className.baseVal ?? el.className ?? '').toString().slice(0, 44), txt: (el.textContent || '').trim().slice(0, 26), props: hits, box: r(el) });
    }
  }
  // chromatic non-gold offenders
  for (const el of document.querySelectorAll('body *')) {
    const s = getComputedStyle(el);
    for (const p of ['color', 'background-color', 'fill', 'stroke']) {
      const v = s.getPropertyValue(p);
      if (!v || v === 'none' || v === 'rgba(0, 0, 0, 0)') continue;
      if (isChromatic(v) && !isGold(v)) {
        const b = el.getBoundingClientRect(); if (b.width === 0 && b.height === 0) continue;
        out.chroma.push({ tag: el.tagName, cls: (el.className.baseVal ?? el.className ?? '').toString().slice(0, 44), p, v, box: r(el) });
        break;
      }
    }
  }

  // ---- nav / CTA duplication in one viewport
  const vh = innerHeight, vw = innerWidth;
  const inVP = (el) => { const b = el.getBoundingClientRect(); return b.bottom > 0 && b.top < vh && b.right > 0 && b.left < vw; };
  out.nav.ctas = [...document.querySelectorAll('a,button')]
    .filter((e) => inVP(e))
    .map((e) => ({ tag: e.tagName, txt: (e.textContent || '').trim().slice(0, 40), href: e.getAttribute('href') || '', box: r(e), fs: cs(e, 'font-size'), border: cs(e, 'border-top-width') + ' ' + cs(e, 'border-top-color'), bg: cs(e, 'background-color'), color: cs(e, 'color') }))
    .filter((e) => e.txt);

  // ---- MiniVic launcher
  const mv = document.querySelector('[data-testid="minivic-toggle"]');
  if (mv) {
    const s = getComputedStyle(mv);
    out.minivic = {
      box: r(mv), aria: mv.getAttribute('aria-label'), title: mv.getAttribute('title'),
      text: (mv.innerText || '').trim(), bg: s.backgroundColor, border: s.borderTopColor + ' ' + s.borderTopWidth,
      radius: s.borderRadius, html: mv.innerHTML.slice(0, 500),
      kids: [...mv.querySelectorAll('*')].map((k) => ({ tag: k.tagName, cls: (k.className.baseVal ?? k.className ?? '').toString().slice(0, 60), bg: getComputedStyle(k).backgroundColor, color: getComputedStyle(k).color, box: r(k) })),
      svgCount: mv.querySelectorAll('svg').length, imgCount: mv.querySelectorAll('img,video').length,
    };
  }

  // ---- section-specific
  const secOf = (id) => document.getElementById(id);
  // experience: bar labels vs card
  const exp = secOf('experience');
  if (exp) {
    const card = exp.querySelector('[class*="chart" i],[class*="card" i]') || exp.querySelector('[class*="inner" i]');
    out.sections.experience = {
      card: card ? r(card) : null,
      years: [...exp.querySelectorAll('[class*="trackYears" i],[class*="years" i]')].map((e) => ({ t: e.textContent.trim(), ...r(e), pos: cs(e, 'position'), fs: cs(e, 'font-size'), color: cs(e, 'color') })),
      bars: [...exp.querySelectorAll('[class*="trackBar" i],[class*="bar" i]')].slice(0, 12).map((e) => ({ ...r(e), bg: cs(e, 'background-color'), op: cs(e, 'opacity'), tr: cs(e, 'transform') })),
      labels: [...exp.querySelectorAll('[class*="role" i] , [class*="trackLabel" i]')].slice(0, 12).map((e) => ({ t: e.textContent.trim().slice(0, 34), ...r(e), fs: cs(e, 'font-size'), color: cs(e, 'color') })),
      scrollW: document.documentElement.scrollWidth, innerW: innerWidth,
      canvases: exp.querySelectorAll('canvas').length,
    };
  }
  // vitrine rail
  const vit = secOf('vitrine');
  if (vit) {
    const rail = vit.querySelector('[class*="rail" i]');
    const cards = [...vit.querySelectorAll('article,[class*="card" i]')].filter((e) => e.getBoundingClientRect().width > 100);
    out.sections.vitrine = {
      rail: rail ? { ...r(rail), maxW: cs(rail, 'max-width'), mask: cs(rail, 'mask-image') || cs(rail, '-webkit-mask-image'), ovx: cs(rail, 'overflow-x'), scrollW: rail.scrollWidth, clientW: rail.clientWidth, pad: cs(rail, 'padding-left') + '/' + cs(rail, 'padding-right') } : null,
      heading: (() => { const h = vit.querySelector('h2'); return h ? r(h) : null; })(),
      cards: cards.slice(0, 8).map((e) => ({ t: e.textContent.trim().slice(0, 24), ...r(e), lit: e.hasAttribute('data-lit') || e.querySelector('[data-lit]') !== null, op: cs(e, 'opacity'), border: cs(e, 'border-left-color') })),
      plates: [...vit.querySelectorAll('[class*="plate" i]')].slice(0, 8).map((e) => ({ lit: e.getAttribute('data-lit'), op: cs(e, 'opacity'), ...r(e) })),
      thumb: vit.querySelectorAll('[class*="thumb" i],[class*="scrollbar" i],[class*="progress" i]').length,
    };
  }
  // skills gold mass
  const sk = secOf('skills');
  if (sk) {
    let goldEls = 0, goldArea = 0;
    for (const el of sk.querySelectorAll('*')) {
      const s = getComputedStyle(el);
      const g = ['color', 'background-color', 'fill', 'stroke'].some((p) => isGold(s.getPropertyValue(p)));
      if (g) { goldEls++; const b = el.getBoundingClientRect(); goldArea += Math.max(0, b.width) * Math.max(0, b.height); }
    }
    out.sections.skills = { goldEls, goldArea: Math.round(goldArea), box: r(sk), svgPaths: sk.querySelectorAll('path').length, canvases: sk.querySelectorAll('canvas').length };
  }
  // listen contact hierarchy / engagement CTA
  const li = secOf('listen');
  if (li) {
    out.sections.listen = {
      box: r(li),
      links: [...li.querySelectorAll('a,button')].map((e) => ({ t: e.textContent.trim().slice(0, 44), href: e.getAttribute('href') || '', ...r(e), fs: cs(e, 'font-size'), ff: cs(e, 'font-family').slice(0, 24), color: cs(e, 'color'), bg: cs(e, 'background-color'), border: cs(e, 'border-top-width') + ' ' + cs(e, 'border-top-color'), pad: cs(e, 'padding-top') + '/' + cs(e, 'padding-left') })),
      rightmostContent: (() => { let m = 0; for (const e of li.querySelectorAll('*')) { const b = e.getBoundingClientRect(); if (b.width > 0 && (e.textContent || '').trim()) m = Math.max(m, b.right); } return Math.round(m); })(),
      canvases: li.querySelectorAll('canvas').length,
    };
  }
  // hero first screen
  const hero = secOf('hero');
  if (hero) {
    const above = [...hero.querySelectorAll('h1,p,a,button,[class*="eyebrow" i],[class*="stat" i],[class*="figure" i],[class*="caliper" i]')]
      .filter((e) => { const b = e.getBoundingClientRect(); return b.top < vh && b.height > 0; })
      .map((e) => ({ tag: e.tagName, cls: (e.className.baseVal ?? e.className ?? '').toString().slice(0, 30), t: (e.textContent || '').trim().slice(0, 52), ...r(e), fs: cs(e, 'font-size') }));
    out.sections.hero = {
      box: r(hero), vh, above,
      h1: (() => { const h = hero.querySelector('h1'); if (!h) return null; return { ...r(h), fs: cs(h, 'font-size'), lh: cs(h, 'line-height'), text: h.innerText }; })(),
      canvases: hero.querySelectorAll('canvas').length,
      cutBelowFold: [...hero.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect(); return b.top < vh && b.bottom > vh && (e.textContent || '').trim().length > 2 && b.height < 200; }).map((e) => ({ t: e.textContent.trim().slice(0, 40), ...r(e) })).slice(0, 6),
    };
  }
  // about
  const ab = secOf('about');
  if (ab) out.sections.about = { box: r(ab), canvases: ab.querySelectorAll('canvas').length, svgPaths: ab.querySelectorAll('path').length, noScores: [...ab.querySelectorAll('text,span,div')].filter((e) => /NO SCORES/i.test(e.textContent || '')).length };

  out.scrollW = document.documentElement.scrollWidth;
  out.innerW = innerWidth;
  return out;
};

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const report = { url: URL, ts: new Date().toISOString(), widths: {} };
  for (const { w, h } of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
    report.buildCommit = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content || null);
    // scroll the whole page so lazy scenes mount, then return to top
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(2200);
    report.widths[w] = await page.evaluate(MEASURE);

    // captures
    if (w === 1440) {
      for (const id of SECTIONS) {
        await page.evaluate((s) => document.getElementById(s)?.scrollIntoView({ block: 'start' }), id);
        await page.waitForTimeout(1400);
        await page.screenshot({ path: `${CAP}/comp-1440x900-${id}.png` });
      }
      // MiniVic open
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(600);
      const mv = page.locator('[data-testid="minivic-toggle"]');
      if (await mv.count()) {
        await mv.first().click({ timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(2500);
        await page.screenshot({ path: `${CAP}/comp-1440x900-minivic-open.png` });
        report.minivicOpen = await page.evaluate(() => {
          const px = (n) => Math.round(n);
          const panel = document.querySelector('[role="dialog"],[class*="panel" i],[data-testid*="minivic-panel"]');
          const h1 = document.querySelector('#hero h1');
          const rr = (e) => { const b = e.getBoundingClientRect(); return { x: px(b.x), y: px(b.y), w: px(b.width), h: px(b.height), right: px(b.right), bottom: px(b.bottom) }; };
          return { panel: panel ? { ...rr(panel), cls: (panel.className || '').toString().slice(0, 60), bg: getComputedStyle(panel).backgroundColor } : null, h1: h1 ? rr(h1) : null, vw: innerWidth, vh: innerHeight };
        });
      }
    } else {
      const scale = w === 1920 ? 0.5 : (w === 834 ? 0.7 : 1);
      const ctx2 = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
      const p2 = await ctx2.newPage();
      await p2.goto(URL, { waitUntil: 'load', timeout: 60000 });
      await p2.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); } window.scrollTo(0, 0); });
      await p2.waitForTimeout(2000);
      await p2.screenshot({ path: `${CAP}/comp-${w}x${h}-full.png`, fullPage: true });
      // one detail shot per width
      const detail = w === 1920 ? 'vitrine' : (w === 834 ? 'experience' : 'listen');
      await p2.evaluate((s) => document.getElementById(s)?.scrollIntoView({ block: 'start' }), detail);
      await p2.waitForTimeout(1200);
      await p2.screenshot({ path: `${CAP}/comp-${w}x${h}-${detail}.png` });
      await ctx2.close();
    }
    await ctx.close();
  }
  await browser.close();
  fs.writeFileSync(OUT + '/composition-report.json', JSON.stringify(report, null, 2));
  console.log('DONE build=' + report.buildCommit);
})();
