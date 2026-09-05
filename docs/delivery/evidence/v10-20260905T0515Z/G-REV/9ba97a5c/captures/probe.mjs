import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/root/forgotten-mistory/.claude/worktrees/wf_2cd21f31-055-1/docs/delivery/evidence/v10-20260905T0515Z/G-REV/9ba97a5c/captures';
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'https://forgotten-mistory.web.app';
const LAUNCH = { executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
const results = {};

function wire(page, bag) {
  bag.console = []; bag.pageerrors = []; bag.requests = []; bag.failed = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') bag.console.push({ type: m.type(), text: m.text().slice(0, 400) }); });
  page.on('pageerror', e => bag.pageerrors.push(String(e).slice(0, 500)));
  page.on('request', r => bag.requests.push({ method: r.method(), url: r.url(), post: (r.postData() || '').slice(0, 600) }));
  page.on('requestfailed', r => bag.failed.push({ url: r.url(), err: r.failure()?.errorText }));
  page.on('response', r => { const u = r.url(); if (u.includes('/api/')) bag.requests.push({ apiStatus: r.status(), url: u }); });
}

// ---- measurement executed in page ----
const MEASURE = () => {
  const out = {};
  const cs = (el, p) => el ? getComputedStyle(el).getPropertyValue(p).trim() : null;
  const root = getComputedStyle(document.documentElement);
  out.viewport = { w: innerWidth, h: innerHeight, dpr: devicePixelRatio };
  out.buildCommit = document.querySelector('meta[name="build-commit"]')?.content || null;
  out.tokens = {
    gold: root.getPropertyValue('--gold').trim(),
    goldLight: root.getPropertyValue('--gold-light').trim(),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    htmlBg: getComputedStyle(document.documentElement).backgroundColor,
    bodyBgImage: getComputedStyle(document.body).backgroundImage.slice(0, 400),
  };
  // ---- canvases ----
  out.canvases = { total: document.querySelectorAll('canvas').length, bySection: {} };
  for (const id of ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen']) {
    const s = document.getElementById(id);
    out.canvases.bySection[id] = s ? s.querySelectorAll('canvas').length : 'SECTION-MISSING';
  }
  out.canvasDetail = [...document.querySelectorAll('canvas')].map(c => {
    const r = c.getBoundingClientRect();
    let ctx = 'unknown';
    try { ctx = c.getContext('webgl2') ? 'webgl2-live' : (c.getContext('webgl') ? 'webgl-live' : 'no-gl'); } catch (e) { ctx = 'ctx-err'; }
    return { section: c.closest('section')?.id || null, dataScene: c.closest('[data-scene]')?.dataset?.scene || null, w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height), visible: r.width > 0 && r.height > 0, ctx };
  });

  // ---- G-H1 hero first fold inventory ----
  const hero = document.getElementById('hero');
  if (hero) {
    const inFold = el => { const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.width > 0 && r.height > 0; };
    const words = t => (t || '').trim().split(/\s+/).filter(Boolean).length;
    const h1 = [...hero.querySelectorAll('h1')];
    const paras = [...hero.querySelectorAll('p, li')].filter(inFold).map(p => ({ tag: p.tagName, words: words(p.innerText), text: p.innerText.trim().slice(0, 140), top: Math.round(p.getBoundingClientRect().top) }));
    const ctas = [...hero.querySelectorAll('a[href], button')].filter(inFold).map(a => ({ tag: a.tagName, text: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 60), top: Math.round(a.getBoundingClientRect().top), href: a.getAttribute('href') }));
    // text-bearing leaf nodes in fold
    const leaves = [...hero.querySelectorAll('*')].filter(el => el.children.length === 0 && (el.innerText || '').trim().length > 1 && inFold(el));
    out.hero = {
      rect: (r => ({ top: Math.round(r.top), height: Math.round(r.height) }))(hero.getBoundingClientRect()),
      h1Count: h1.length,
      h1Text: h1.map(h => h.innerText.trim().slice(0, 120)),
      headingsInFold: [...hero.querySelectorAll('h1,h2,h3,h4')].filter(inFold).map(h => ({ tag: h.tagName, text: h.innerText.trim().slice(0, 100) })),
      paragraphsInFold: paras,
      paragraphsOver12Words: paras.filter(p => p.words > 12).length,
      ctaInFold: ctas,
      ctaCount: ctas.length,
      textLeavesInFold: leaves.length,
      textLeafSample: leaves.slice(0, 60).map(l => l.innerText.trim().slice(0, 60)),
    };
    // ledger / availability / grading marks
    const findByText = re => [...hero.querySelectorAll('*')].filter(el => el.children.length === 0 && re.test(el.innerText || '')).map(el => ({ text: el.innerText.trim().slice(0, 80), top: Math.round(el.getBoundingClientRect().top), inFold: el.getBoundingClientRect().top < innerHeight }));
    out.hero.availability = findByText(/availab|notice|open to|engaged|contract/i);
    out.hero.ledger = findByText(/years|repositor|systems|dimensions|\bself-reported\b|\bsourced\b/i).slice(0, 20);
    const cal = [...hero.querySelectorAll('[class*="caliper" i], [data-caliper], [class*="Caliper"]')];
    out.hero.caliperMarks = cal.length;
    // scrim / overlay opacity
    const scrimCands = [...hero.querySelectorAll('div,span')].filter(el => {
      const s = getComputedStyle(el);
      return (s.position === 'absolute' || s.position === 'fixed') && (s.backgroundImage.includes('gradient') || (s.backgroundColor !== 'rgba(0, 0, 0, 0)' && el.children.length === 0)) && el.getBoundingClientRect().height > innerHeight * 0.3;
    }).slice(0, 8);
    out.hero.scrims = scrimCands.map(el => ({ cls: el.className?.toString?.().slice(0, 80), opacity: getComputedStyle(el).opacity, bg: getComputedStyle(el).backgroundColor, bgImage: getComputedStyle(el).backgroundImage.slice(0, 220), h: Math.round(el.getBoundingClientRect().height) }));
    // dominant visual: largest media/canvas in hero fold
    const media = [...hero.querySelectorAll('canvas,video,img')].map(m => { const r = m.getBoundingClientRect(); return { tag: m.tagName, cssW: Math.round(r.width), cssH: Math.round(r.height), area: Math.round(r.width * r.height), src: (m.currentSrc || m.getAttribute('src') || '').split('/').pop() }; }).sort((a, b) => b.area - a.area);
    out.hero.media = media;
    out.hero.foldArea = innerWidth * innerHeight;
    out.hero.dominantMediaCoverage = media.length ? +(media[0].area / (innerWidth * innerHeight)).toFixed(3) : 0;
  }

  // ---- G-A1/G-A2 about ----
  const about = document.getElementById('about');
  if (about) {
    const ev = [...about.querySelectorAll('[class*="evidence" i]')];
    out.about = {
      evidenceCount: ev.length,
      evidenceColors: ev.slice(0, 12).map(e => ({ cls: e.className?.toString?.().slice(0, 60), color: getComputedStyle(e).color, text: e.innerText.trim().slice(0, 70) })),
    };
    // any gold anywhere in about
    const goldRe = /rgba?\((?:19[0-9]|2[0-5][0-9]),\s*(?:1[5-9][0-9]|2[0-5][0-9]),\s*(?:[0-9]|[1-9][0-9]|1[0-4][0-9])/;
    let goldHits = [];
    for (const el of about.querySelectorAll('*')) {
      const s = getComputedStyle(el);
      for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'fill', 'stroke']) {
        const v = s[prop];
        if (v && goldRe.test(v)) { goldHits.push({ tag: el.tagName, cls: el.className?.toString?.().slice(0, 50), prop, v }); break; }
      }
      if (goldHits.length > 12) break;
    }
    out.about.anyGoldInAbout = goldHits.length > 0;
    out.about.goldHits = goldHits;
    // hatch / cool-steel chroma scan across about
    const chroma = v => { const m = /rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(v || ''); if (!m) return null; const a = [+m[1], +m[2], +m[3]]; return Math.max(...a) - Math.min(...a); };
    let steel = [];
    for (const el of about.querySelectorAll('*')) {
      const s = getComputedStyle(el);
      for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderLeftColor', 'fill', 'stroke', 'backgroundImage']) {
        const v = s[prop];
        if (typeof v !== 'string') continue;
        const matches = v.match(/rgba?\([0-9]{1,3}[ ,]+[0-9]{1,3}[ ,]+[0-9]{1,3}[^)]*\)/g) || [];
        for (const mm of matches) {
          const c = chroma(mm);
          const isGold = goldRe.test(mm);
          if (c !== null && c > 8 && !isGold) steel.push({ tag: el.tagName, cls: el.className?.toString?.().slice(0, 50), prop, v: mm, chroma: c });
        }
      }
      if (steel.length > 40) break;
    }
    out.about.offTokenChroma = steel.slice(0, 40);
    out.about.offTokenChromaCount = steel.length;
  }

  // ---- G-S1 skills ----
  const skills = document.getElementById('skills');
  if (skills) {
    out.skills = {
      canvasCount: skills.querySelectorAll('canvas').length,
      svgCount: skills.querySelectorAll('svg').length,
      dataScenes: [...skills.querySelectorAll('[data-scene]')].map(e => e.dataset.scene),
    };
  }

  // ---- G-V1/G-V2 vitrine ----
  const vit = document.getElementById('vitrine');
  if (vit) {
    const paths = [...vit.querySelectorAll('svg path, svg line, svg polyline, svg circle, svg rect')];
    const plateHosts = [...vit.querySelectorAll('svg')].map(sv => {
      const card = sv.closest('article, li, figure, div');
      const r = sv.getBoundingClientRect();
      const kids = [...sv.querySelectorAll('path,line,polyline,circle,rect,polygon')];
      return {
        cssW: Math.round(r.width), cssH: Math.round(r.height),
        svgOpacity: getComputedStyle(sv).opacity,
        hostOpacity: card ? getComputedStyle(card).opacity : null,
        strokes: kids.slice(0, 6).map(k => ({ tag: k.tagName, opacity: getComputedStyle(k).opacity, dashoffset: getComputedStyle(k).strokeDashoffset, dasharray: getComputedStyle(k).strokeDasharray, stroke: getComputedStyle(k).stroke, visibility: getComputedStyle(k).visibility })),
      };
    });
    out.vitrine = {
      svgCount: [...vit.querySelectorAll('svg')].length,
      pathCount: paths.length,
      plates: plateHosts.slice(0, 10),
      // engagement CTA: mailto or "start a project"/"hire"/"engage"/"contact"
      ctas: [...vit.querySelectorAll('a[href], button')].map(a => ({ text: (a.innerText || '').trim().slice(0, 70), href: a.getAttribute('href') })),
    };
    out.vitrine.engagementCta = out.vitrine.ctas.filter(c => /mailto:|start a project|hire|engage|work with|brief|consult|contact/i.test((c.href || '') + ' ' + c.text));
  }

  // ---- sections present ----
  out.sections = [...document.querySelectorAll('section[id]')].map(s => ({ id: s.id, top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.getBoundingClientRect().height) }));
  return out;
};

async function shootSections(page, tag) {
  for (const id of ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen']) {
    try {
      const el = await page.$(`#${id}`);
      if (!el) continue;
      await el.scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT, `${tag}-${id}.png`), clip: await (async () => { const b = await el.boundingBox(); const vp = page.viewportSize(); return b ? { x: 0, y: Math.max(0, 0), width: vp.width, height: Math.min(vp.height, 1200) } : undefined; })() });
    } catch (e) { /* recorded via absence */ }
  }
}

async function run(label, { url, viewport, shots }) {
  const browser = await chromium.launch(LAUNCH);
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const bag = {}; wire(page, bag);
  const t0 = Date.now();
  const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => ({ err: String(e) }));
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(2500);
  const m = await page.evaluate(MEASURE);
  if (shots) {
    await page.screenshot({ path: path.join(OUT, `${label}-fold.png`) });
    await shootSections(page, label);
  }
  const rec = { label, url, viewport, status: resp?.status?.() ?? null, loadMs, measure: m, console: bag.console, pageerrors: bag.pageerrors, failedRequests: bag.failed, requestPaths: [...new Set(bag.requests.map(r => (r.url || '').replace(BASE, '')))].slice(0, 200) };
  results[label] = rec;
  await ctx.close(); await browser.close();
  console.log(`[${label}] status=${rec.status} pageerrors=${rec.pageerrors.length} canvases=${m.canvases?.total} build=${m.buildCommit}`);
  return rec;
}

// ---- MiniVic probe ----
async function minivic() {
  const browser = await chromium.launch(LAUNCH);
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const bag = {}; wire(page, bag);
  const api = [];
  page.on('request', r => { if (/\/api\//.test(r.url())) api.push({ t: Date.now(), phase: 'request', method: r.method(), url: r.url(), post: (r.postData() || '').slice(0, 800) }); });
  page.on('response', async r => { if (/\/api\//.test(r.url())) api.push({ t: Date.now(), phase: 'response', status: r.status(), url: r.url(), ct: r.headers()['content-type'] }); });
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  const rec = { tried: [], api, opened: false, sent: false };
  // open launcher
  let opened = false;
  for (const sel of ['button[aria-label*="Mini Vic" i]', 'button:has-text("Ask Mini Vic")', '[class*="launcher" i]', 'button:has-text("Mini Vic")']) {
    rec.tried.push('open:' + sel);
    try { const el = await page.$(sel); if (el) { await el.click({ timeout: 4000 }); opened = true; rec.openedWith = sel; break; } } catch (e) { rec.tried.push('open-fail:' + sel + ':' + String(e).slice(0, 90)); }
  }
  rec.opened = opened;
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUT, 'minivic-open.png') });
  // find input
  let input = null;
  for (const sel of ['textarea', 'input[type="text"]', '[contenteditable="true"]', 'input']) {
    rec.tried.push('input:' + sel);
    const el = await page.$(sel); if (el && await el.isVisible().catch(() => false)) { input = el; rec.inputSel = sel; break; }
  }
  if (input) {
    await input.fill('What did you do at ANZ?').catch(e => rec.tried.push('fill-fail:' + String(e).slice(0, 90)));
    const before = await page.evaluate(() => document.body.innerText.length);
    const tSend = Date.now();
    rec.tSend = tSend;
    await page.keyboard.press('Enter');
    rec.sent = true;
    // poll for first visible reply token growth
    let ttft = null; let firstText = null;
    for (let i = 0; i < 120; i++) {
      await page.waitForTimeout(250);
      const st = await page.evaluate((b) => { const t = document.body.innerText; return { len: t.length, tail: t.slice(-500) }; }, before);
      if (st.len > before + 40) { ttft = Date.now() - tSend; firstText = st.tail; break; }
    }
    rec.ttftMs = ttft; rec.replyTail = firstText ? firstText.slice(-400) : null;
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT, 'minivic-reply.png') });
  }
  rec.api = api.map(a => ({ ...a, dt: rec.tSend ? a.t - rec.tSend : null }));
  rec.apiPaths = [...new Set(api.map(a => a.url.replace(BASE, '')))];
  rec.allRequestPaths = [...new Set(bag.requests.map(r => (r.url || '').replace(BASE, '')))].filter(u => /api|functions|cloudfunctions|run\.app/.test(u));
  rec.console = bag.console; rec.pageerrors = bag.pageerrors; rec.failed = bag.failed;
  results.minivic = rec;
  console.log('[minivic] opened=' + rec.opened + ' sent=' + rec.sent + ' ttft=' + rec.ttftMs + ' api=' + JSON.stringify(rec.apiPaths));
  await ctx.close(); await browser.close();
}

// ---- persistent profile second load (SW freshness) ----
async function persistent() {
  const dir = '/tmp/claude-0/-root-forgotten-mistory/46afcf46-5464-449d-9c0d-a9f0b25357cd/scratchpad/pp-profile';
  fs.rmSync(dir, { recursive: true, force: true });
  const ctx = await chromium.launchPersistentContext(dir, { ...LAUNCH, viewport: { width: 1440, height: 900 } });
  const p1 = await ctx.newPage();
  await p1.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await p1.waitForTimeout(3000);
  const first = await p1.evaluate(() => ({ build: document.querySelector('meta[name="build-commit"]')?.content, sw: 'serviceWorker' in navigator ? navigator.serviceWorker.controller?.scriptURL || null : 'unsupported' }));
  await p1.close();
  const p2 = await ctx.newPage();
  const bag = {}; wire(p2, bag);
  await p2.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await p2.waitForTimeout(2500);
  const second = await p2.evaluate(MEASURE);
  await p2.screenshot({ path: path.join(OUT, 'persistent-second-load.png') });
  results.persistent = { firstLoad: first, secondLoadBuild: second.buildCommit, secondCanvases: second.canvases, pageerrors: bag.pageerrors, console: bag.console, failed: bag.failed, swController: await p2.evaluate(() => navigator.serviceWorker?.controller?.scriptURL || null) };
  console.log('[persistent] first=' + JSON.stringify(first) + ' second=' + second.buildCommit);
  await ctx.close();
}

const only = process.argv[2] || 'all';
try {
  if (only === 'all' || only === 'a') {
    await run('1440-normal', { url: BASE + '/', viewport: { width: 1440, height: 900 }, shots: true });
    await run('1440-glforce', { url: BASE + '/?gl=force', viewport: { width: 1440, height: 900 }, shots: true });
  }
  if (only === 'all' || only === 'b') {
    await run('390-normal', { url: BASE + '/', viewport: { width: 390, height: 844 }, shots: true });
    await run('390-glforce', { url: BASE + '/?gl=force', viewport: { width: 390, height: 844 }, shots: false });
  }
  if (only === 'all' || only === 'c') { await minivic(); await persistent(); }
} catch (e) {
  results.fatal = String(e);
  console.error('FATAL', e);
}
fs.writeFileSync(path.join(OUT, `probe-${only}.json`), JSON.stringify(results, null, 2));
console.log('WROTE ' + path.join(OUT, `probe-${only}.json`));
