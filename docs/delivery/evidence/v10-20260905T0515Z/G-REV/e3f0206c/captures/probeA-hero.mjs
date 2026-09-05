// G-REV phase 3 — G-H1 re-probe on live (build-commit read at runtime).
// Method reused verbatim from ../../9b864752/captures/probeA-hero.mjs: same
// inFold, same text-leaf / paragraph / CTA definitions, same CTA-group rule
// (nearest [data-testid] ancestor, else class), so every number is comparable.
// New this phase: hero-actions bottom margin, the proof-band portrait control,
// and the keyboard contract.
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
  page.on('console', (m) => { if (m.type() === 'error') bag.console.push(m.text().slice(0, 240)); });
  page.on('pageerror', (e) => bag.pageerrors.push(String(e).slice(0, 400)));
  page.on('requestfailed', (r) => bag.failed.push({ url: r.url().slice(-60), err: r.failure()?.errorText }));
}

const MEASURE = () => {
  const out = {};
  const inFold = (el) => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.width > 0 && r.height > 0; };
  const words = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;
  const rectOf = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), h: Math.round(r.height), w: Math.round(r.width) }; };
  out.viewport = { w: innerWidth, h: innerHeight };
  out.buildCommit = document.querySelector('meta[name="build-commit"]')?.content || null;
  out.canvases = { total: document.querySelectorAll('canvas').length, bySection: {} };
  for (const id of ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen']) {
    const s = document.getElementById(id);
    out.canvases.bySection[id] = s ? s.querySelectorAll('canvas').length : 'SECTION-MISSING';
  }
  const hero = document.getElementById('hero');
  if (!hero) { out.hero = 'MISSING'; return out; }

  const fold = hero.querySelector('[data-testid="hero-fold"]');
  const proof = hero.querySelector('[data-testid="hero-proof"]');
  out.bands = { foldRect: rectOf(fold), proofRect: rectOf(proof), innerHeight };

  const paras = [...hero.querySelectorAll('p, li')].filter(inFold)
    .map((p) => ({ tag: p.tagName, words: words(p.innerText), text: p.innerText.trim().slice(0, 120), top: Math.round(p.getBoundingClientRect().top) }));
  const ctas = [...hero.querySelectorAll('a[href], button')].filter(inFold)
    .map((a) => ({ tag: a.tagName, text: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 60), top: Math.round(a.getBoundingClientRect().top), testid: a.closest('[data-testid]')?.dataset?.testid || null }));
  const leaves = [...hero.querySelectorAll('*')].filter((el) => el.children.length === 0 && (el.innerText || '').trim().length > 1 && inFold(el));
  const h1 = [...hero.querySelectorAll('h1')];
  out.hero = {
    rect: rectOf(hero),
    h1InFold: h1.filter(inFold).length,
    h1Text: h1.map((h) => h.innerText.trim().slice(0, 80)),
    paragraphsInFold: paras,
    paragraphsOver12Words: paras.filter((p) => p.words > 12).length,
    ctaInFold: ctas,
    ctaCount: ctas.length,
    textLeavesInFold: leaves.length,
    textLeafSample: leaves.map((l) => ({ t: l.innerText.trim().slice(0, 40), top: Math.round(l.getBoundingClientRect().top) })),
  };
  // CTA groups — nearest [data-testid] ancestor, else parent class (phase-2 rule).
  const groups = new Map();
  for (const a of [...hero.querySelectorAll('a[href], button')].filter(inFold)) {
    const g = a.parentElement;
    const key = a.closest('[data-testid]')?.dataset?.testid || (g?.className?.toString?.() || '') || 'ROOT';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push((a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 40));
  }
  out.hero.ctaGroups = [...groups.entries()].map(([k, v]) => ({ group: k.slice(0, 80), items: v }));
  out.hero.ctaGroupCount = groups.size;

  // hero-actions: inside the fold with >= 40 px margin?
  const actions = hero.querySelector('[data-testid="hero-actions"]');
  out.hero.actions = actions ? { ...rectOf(actions), marginToFoldBottom: Math.round(innerHeight - actions.getBoundingClientRect().bottom), links: [...actions.querySelectorAll('a[href]')].map((a) => a.innerText.trim().slice(0, 40)) } : null;

  // ledger / grading / availability
  const ul = hero.querySelector('ul');
  out.hero.ulTop = ul ? Math.round(ul.getBoundingClientRect().top) : null;
  out.hero.ulClearance = ul ? Math.round(ul.getBoundingClientRect().top - innerHeight) : null;
  const lis = ul ? [...ul.querySelectorAll('li')] : [];
  const heroText = hero.innerText;
  out.ct10 = { ulLiCount: lis.length, has92: /92/.test(heroText), has5M: /\$5M\+/.test(heroText), has10k: /10k\+/.test(heroText), liText: lis.map((l) => l.innerText.replace(/\s+/g, ' ').trim().slice(0, 70)) };
  const availEl = hero.querySelector('[data-testid="hero-availability"]');
  out.hero.availabilityTop = availEl ? Math.round(availEl.getBoundingClientRect().top) : null;
  const gradeLeaves = [...hero.querySelectorAll('*')].filter((el) => el.children.length === 0 && /self-reported|sourced|grading/i.test(el.innerText || ''));
  out.hero.gradingNodes = gradeLeaves.map((el) => ({ t: el.innerText.replace(/\s+/g, ' ').trim().slice(0, 60), top: Math.round(el.getBoundingClientRect().top), inFold: inFold(el) }));

  // the proof-band control
  const ctrl = document.querySelector('[data-testid="portrait-control"]');
  if (ctrl) {
    const r = ctrl.getBoundingClientRect();
    const cs = getComputedStyle(ctrl);
    out.control = {
      tag: ctrl.tagName, text: ctrl.innerText.replace(/\s+/g, ' ').trim().slice(0, 60),
      ariaPressed: ctrl.getAttribute('aria-pressed'),
      w: Math.round(r.width), h: Math.round(r.height),
      minHeight: cs.minHeight, top: Math.round(r.top),
      insideProof: !!ctrl.closest('[data-testid="hero-proof"]'),
      belowFold: r.top >= innerHeight,
      accessibleName: (ctrl.innerText || ctrl.getAttribute('aria-label') || '').trim().slice(0, 60),
    };
  } else out.control = null;

  // any pressable inside the photograph?
  const fig = hero.querySelector('figure');
  out.hero.figurePressables = fig ? [...fig.querySelectorAll('button, a[href], [role="button"]')].length : 'NO-FIGURE';
  const vid = hero.querySelector('video');
  out.video = vid ? { paused: vid.paused, hasSrc: !!vid.getAttribute('src'), currentTime: vid.currentTime, top: Math.round(vid.getBoundingClientRect().top) } : null;

  // stage coverage of the fold
  const stage = hero.querySelector('[class*="stage" i]');
  if (stage) {
    const r = stage.getBoundingClientRect();
    const vx = Math.max(0, Math.min(r.right, innerWidth) - Math.max(r.left, 0));
    const vy = Math.max(0, Math.min(r.bottom, innerHeight) - Math.max(r.top, 0));
    out.hero.stage = { cssW: Math.round(r.width), cssH: Math.round(r.height), top: Math.round(r.top), coverage: +((vx * vy) / (innerWidth * innerHeight)).toFixed(4), bgImage: getComputedStyle(stage).backgroundImage.slice(0, 200), canvases: stage.querySelectorAll('canvas').length };
  } else out.hero.stage = null;

  const photos = [...hero.querySelectorAll('img')].map((i) => { const r = i.getBoundingClientRect(); return { src: (i.currentSrc || i.src).split('/').pop(), cssW: Math.round(r.width), cssH: Math.round(r.height), top: Math.round(r.top), inFold: inFold(i) }; });
  out.hero.photos = photos;
  // flagship-C regression: opaque ink plates in the hero
  out.hero.plates = [...hero.querySelectorAll('*')].filter((el) => /rgba?\(10,\s*10,\s*10/.test(getComputedStyle(el).backgroundColor)).map((el) => ({ cls: (el.className?.toString?.() || '').slice(0, 60), bg: getComputedStyle(el).backgroundColor }));
  return out;
};

async function boot(page, url) {
  const r = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1800);
  return r?.status();
}

const results = {};
const browser = await chromium.launch(LAUNCH);
const VIEWPORTS = [{ w: 1440, h: 900 }, { w: 1280, h: 800 }, { w: 834, h: 1194 }, { w: 390, h: 844 }];

for (const vp of VIEWPORTS) {
  const key = `${vp.w}x${vp.h}`;
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const bag = {}; wire(page, bag);
  const status = await boot(page, `${BASE}/`);
  const measure = await page.evaluate(MEASURE);
  await page.screenshot({ path: path.join(OUT, `${key}-fold.png`) });

  // ---- keyboard contract (desktop widths only need it once, but run all) ----
  const kb = { tabsToControl: null, focusedAfterTabs: null, videoPausedOnFocus: null, ariaAfterEnter: null, videoAfterEnter: null, ariaAfterSpace: null, videoAfterSpace: null, focusRing: null };
  await page.evaluate(() => { document.body.scrollIntoView(); window.scrollTo(0, 0); document.activeElement?.blur?.(); });
  let found = false;
  for (let i = 1; i <= 40; i += 1) {
    await page.keyboard.press('Tab');
    const isCtrl = await page.evaluate(() => document.activeElement?.getAttribute?.('data-testid') === 'portrait-control');
    if (isCtrl) { kb.tabsToControl = i; found = true; break; }
  }
  kb.focusedAfterTabs = await page.evaluate(() => ({ testid: document.activeElement?.getAttribute?.('data-testid') || null, tag: document.activeElement?.tagName, text: (document.activeElement?.innerText || '').trim().slice(0, 40) }));
  if (found) {
    await page.waitForTimeout(700);
    kb.videoPausedOnFocus = await page.evaluate(() => { const v = document.querySelector('#hero video'); return v ? { paused: v.paused, currentTime: v.currentTime, hasSrc: !!v.getAttribute('src') } : 'NO-VIDEO'; });
    kb.focusRing = await page.evaluate(() => { const el = document.activeElement; const cs = getComputedStyle(el); return { outlineColor: cs.outlineColor, outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, boxShadow: cs.boxShadow.slice(0, 120) }; });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1200);
    kb.ariaAfterEnter = await page.evaluate(() => document.querySelector('[data-testid="portrait-control"]')?.getAttribute('aria-pressed'));
    kb.videoAfterEnter = await page.evaluate(() => { const v = document.querySelector('#hero video'); return v ? { paused: v.paused, currentTime: +v.currentTime.toFixed(2), src: (v.getAttribute('src') || '').split('/').pop() } : 'NO-VIDEO'; });
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);
    kb.ariaAfterSpace = await page.evaluate(() => document.querySelector('[data-testid="portrait-control"]')?.getAttribute('aria-pressed'));
    kb.videoAfterSpace = await page.evaluate(() => { const v = document.querySelector('#hero video'); return v ? { paused: v.paused, currentTime: +v.currentTime.toFixed(2) } : 'NO-VIDEO'; });
  }

  // ---- pointer-enter arms the loop (the claimed replacement for the glyph) ----
  const pointer = {};
  const box = await page.evaluate(() => { const f = document.querySelector('#hero figure'); if (!f) return null; const r = f.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2), top: Math.round(r.top) }; });
  if (box) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.mouse.move(box.x, Math.max(5, Math.min(box.y, vp.h - 5)));
    await page.waitForTimeout(1500);
    pointer.afterEnter = await page.evaluate(() => { const v = document.querySelector('#hero video'); return v ? { paused: v.paused, currentTime: +v.currentTime.toFixed(2) } : 'NO-VIDEO'; });
    await page.mouse.move(2, 2);
    await page.waitForTimeout(900);
    pointer.afterLeave = await page.evaluate(() => { const v = document.querySelector('#hero video'); return v ? { paused: v.paused } : 'NO-VIDEO'; });
  } else pointer.error = 'no figure';

  results[key] = { status, pageerrors: bag.pageerrors, consoleErrors: bag.console, failed: bag.failed, measure, kb, pointer };
  await ctx.close();
  console.log(`${key}: status=${status} err=${bag.pageerrors.length} groups=${measure.hero?.ctaGroupCount} ctas=${measure.hero?.ctaCount} leaves=${measure.hero?.textLeavesInFold} p>12=${measure.hero?.paragraphsOver12Words} actionsMargin=${measure.hero?.actions?.marginToFoldBottom} ulTop=${measure.hero?.ulTop}(clear ${measure.hero?.ulClearance}) ctrl=${measure.control ? measure.control.h + 'px belowFold=' + measure.control.belowFold : 'MISSING'} tabs=${kb.tabsToControl} pausedOnFocus=${JSON.stringify(kb.videoPausedOnFocus)} enter=${kb.ariaAfterEnter}/${JSON.stringify(kb.videoAfterEnter)} space=${kb.ariaAfterSpace} ptr=${JSON.stringify(pointer.afterEnter)}`);
}

// ---- reduced motion at 1440 and 390: no loop, stage still ----
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const bag = {}; wire(page, bag);
  const status = await boot(page, `${BASE}/`);
  const m = await page.evaluate(MEASURE);
  // pointer over the figure must NOT start the loop under reduced motion
  const box = await page.evaluate(() => { const f = document.querySelector('#hero figure'); if (!f) return null; const r = f.getBoundingClientRect(); return { x: Math.round(r.left + r.width / 2), y: Math.round(Math.max(5, Math.min(r.top + r.height / 2, innerHeight - 5))) }; });
  let afterHover = 'no-figure';
  if (box) { await page.mouse.move(box.x, box.y); await page.waitForTimeout(1500); afterHover = await page.evaluate(() => { const v = document.querySelector('#hero video'); return v ? { paused: v.paused, currentTime: +v.currentTime.toFixed(2) } : 'NO-VIDEO'; }); }
  await page.screenshot({ path: path.join(OUT, `${vp.w}-reduced.png`) });
  results[`${vp.w}-reduced`] = { status, pageerrors: bag.pageerrors, canvases: m.canvases, stage: m.hero?.stage, video: m.video, afterHover, control: m.control };
  await ctx.close();
  console.log(`${vp.w}-reduced: canvases=${m.canvases.total} heroCanvas=${m.hero?.stage?.canvases} video=${JSON.stringify(m.video)} afterHover=${JSON.stringify(afterHover)} err=${bag.pageerrors.length}`);
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'probeA-hero.json'), JSON.stringify(results, null, 2));
console.log('WROTE probeA-hero.json');
