// G-REV phase 2 — live re-probe of G-V1 / G-V2 on build-commit 843b679d.
// Method parity with the phase-1 baseline probe (9ba97a5c/captures/probe.mjs):
// same launcher, same wiring, same context matrix; the vitrine measurement is
// extended to the binary acceptance in artifacts/adversarial/GAP-BACKLOG.md.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import { PNG } from '/root/forgotten-mistory/node_modules/pngjs/lib/png.js';
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/root/forgotten-mistory/.claude/worktrees/wf_93138609-6c3-1/docs/delivery/evidence/v10-20260905T0515Z/G-REV/843b679d/captures';
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'https://forgotten-mistory.web.app';
const LAUNCH = { executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] };
const results = {};

function wire(page, bag) {
  bag.console = []; bag.pageerrors = []; bag.failed = [];
  page.on('console', m => { if (m.type() === 'error') bag.console.push({ type: m.type(), text: m.text().slice(0, 400) }); });
  page.on('pageerror', e => bag.pageerrors.push(String(e).slice(0, 500)));
  page.on('requestfailed', r => bag.failed.push({ url: r.url(), err: r.failure()?.errorText }));
}

// ───────────────────────── in-page measurement ─────────────────────────
const MEASURE = () => {
  const out = {};
  const S = el => getComputedStyle(el);
  const rgb = s => { const m = (s || '').match(/-?[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null; };
  const chroma = s => { const c = rgb(s); return c ? Math.max(...c) - Math.min(...c) : null; };
  const lum = c => { const f = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
  const ratio = (a, b) => { if (!a || !b) return null; const l1 = lum(a), l2 = lum(b); return +(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05))).toFixed(2); };
  const effBg = el => { let n = el; while (n && n !== document.documentElement) { const bc = S(n).backgroundColor; const p = rgb(bc); if (p && !/rgba\(.*,\s*0\)$/.test(bc)) return p; n = n.parentElement; } return rgb(S(document.body).backgroundColor) || [0, 0, 0]; };

  out.viewport = { w: innerWidth, h: innerHeight, dpr: devicePixelRatio };
  out.buildCommit = document.querySelector('meta[name="build-commit"]')?.content || null;
  out.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = S(document.documentElement);
  out.tokens = { gold: root.getPropertyValue('--gold').trim(), white: root.getPropertyValue('--white').trim(), ink900: root.getPropertyValue('--ink-900').trim() };

  out.canvases = { total: document.querySelectorAll('canvas').length, bySection: {} };
  for (const id of ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen']) {
    const s = document.getElementById(id);
    out.canvases.bySection[id] = s ? s.querySelectorAll('canvas').length : 'SECTION-MISSING';
  }
  out.vitrineCanvases = [...(document.getElementById('vitrine')?.querySelectorAll('canvas') || [])].map(c => {
    const r = c.getBoundingClientRect(); let ctx = 'unknown';
    try { ctx = c.getContext('webgl2') ? 'webgl2-live' : (c.getContext('webgl') ? 'webgl-live' : 'no-gl'); } catch { ctx = 'ctx-err'; }
    return { dataScene: c.closest('[data-scene]')?.dataset?.scene || null, w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height), ctx };
  });

  const vit = document.getElementById('vitrine');
  if (!vit) { out.vitrine = 'SECTION-MISSING'; return out; }

  // ───────── G-V1 — every plate's resting drawing ─────────
  const svgs = [...vit.querySelectorAll('svg')];
  const litAncestor = el => { let n = el; while (n && n !== document.body) { if (n.hasAttribute?.('data-lit')) return 'data-lit'; n = n.parentElement; } return null; };
  const drawnAncestor = el => { let n = el; while (n && n !== document.body) { if (n.hasAttribute?.('data-drawn')) return 'data-drawn'; n = n.parentElement; } return null; };

  out.plates = svgs.map((sv, i) => {
    const host = sv.closest('li') || sv.closest('article') || sv.parentElement;
    const r = sv.getBoundingClientRect();
    const strokes = [...sv.querySelectorAll('.stroke, path, line, polyline, circle, rect, polygon, ellipse')];
    const measured = strokes.map(k => {
      const s = S(k);
      return {
        tag: k.tagName,
        isStrokeClass: (k.getAttribute('class') || '').includes('stroke') || [...k.classList].some(c => /stroke/i.test(c)),
        dashoffset: s.strokeDashoffset, dasharray: s.strokeDasharray,
        strokeOpacity: s.strokeOpacity, opacity: s.opacity,
        stroke: s.stroke, strokeWidth: s.strokeWidth, visibility: s.visibility, display: s.display,
      };
    });
    const num = v => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
    const so = measured.map(m => num(m.strokeOpacity)).filter(v => v !== null);
    const el = measured.map(m => num(m.opacity)).filter(v => v !== null);
    const doff = measured.map(m => num(m.dashoffset)).filter(v => v !== null);
    // labels: text nodes inside the plate host
    const labels = [...(host?.querySelectorAll('text, figcaption, h3, h4, p, span, dt, dd') || [])]
      .filter(e => (e.innerText || e.textContent || '').trim().length > 0)
      .slice(0, 8)
      .map(e => ({ tag: e.tagName, cls: (e.getAttribute('class') || '').slice(0, 60), text: (e.innerText || e.textContent).trim().slice(0, 50), opacity: S(e).opacity, color: S(e).color, fill: S(e).fill }));
    return {
      i,
      title: (host?.querySelector('h3, h4, [class*=title i]')?.innerText || '').trim().slice(0, 60),
      lit: litAncestor(sv), drawn: drawnAncestor(sv),
      resting: !litAncestor(sv) && !drawnAncestor(sv),
      hostAttrs: host ? [...host.attributes].map(a => `${a.name}=${a.value}`.slice(0, 60)) : null,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      svgOpacity: S(sv).opacity, hostOpacity: host ? S(host).opacity : null,
      strokeCount: measured.length,
      dashoffsetValues: [...new Set(measured.map(m => m.dashoffset))],
      dashoffsetMax: doff.length ? Math.max(...doff) : null,
      dasharrayValues: [...new Set(measured.map(m => m.dasharray))],
      strokeOpacityMin: so.length ? Math.min(...so) : null,
      strokeOpacityMax: so.length ? Math.max(...so) : null,
      elementOpacityMin: el.length ? Math.min(...el) : null,
      strokeColors: [...new Set(measured.map(m => m.stroke))].slice(0, 4),
      strokes: measured.slice(0, 4),
      labels,
      labelOpacityMin: labels.length ? Math.min(...labels.map(l => parseFloat(l.opacity) || 1)) : null,
    };
  });

  // ───────── G-V2 — engagement CTA ─────────
  const anchors = [...vit.querySelectorAll('a[href], button')];
  out.vitrineLinks = anchors.map(a => ({ text: (a.innerText || '').trim().slice(0, 70), href: a.getAttribute('href'), dataCta: a.getAttribute('data-cta') }));
  const isEngage = a => /^mailto:/i.test(a.getAttribute('href') || '') || /start a project|hire|engage|work with|brief|consult/i.test((a.innerText || ''));
  out.engagementCtas = anchors.filter(isEngage).map(a => {
    const s = S(a); const r = a.getBoundingClientRect();
    const fg = rgb(s.color), bg = rgb(s.backgroundColor), bgOpaque = (parseFloat((s.backgroundColor.match(/[\d.]+\)$/) || ['1)'])[0]) || 1) > 0 && !/, 0\)$/.test(s.backgroundColor);
    const under = bgOpaque ? bg : effBg(a);
    return {
      text: (a.innerText || '').trim(), href: a.getAttribute('href'), dataCta: a.getAttribute('data-cta'),
      tag: a.tagName, tabindex: a.getAttribute('tabindex'),
      rectDoc: { top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY), h: Math.round(r.height), w: Math.round(r.width) },
      color: s.color, backgroundColor: s.backgroundColor, borderColor: s.borderTopColor, borderWidth: s.borderTopWidth, outlineColor: s.outlineColor,
      chroma: { fg: chroma(s.color), bg: chroma(s.backgroundColor), border: chroma(s.borderTopColor) },
      contrast: ratio(fg, under),
      contrastAgainst: under,
      fontSize: s.fontSize, minHeight: s.minHeight,
    };
  });
  // "Start a project" anywhere on the page
  out.startAProjectPageWide = [...document.querySelectorAll('a[href], button')]
    .filter(a => /start a project/i.test(a.innerText || ''))
    .map(a => ({ section: a.closest('section')?.id || null, text: (a.innerText || '').trim(), href: a.getAttribute('href') }));
  out.mailtoPageWide = [...document.querySelectorAll('a[href^="mailto:" i]')]
    .map(a => ({ section: a.closest('section')?.id || null, text: (a.innerText || '').trim().slice(0, 50), href: a.getAttribute('href') }));

  // position of CTA vs the curated plates
  const plateRects = svgs.map(sv => sv.getBoundingClientRect().bottom + scrollY);
  const railBottom = plateRects.length ? Math.max(...plateRects) : null;
  const rail = vit.querySelector('ol, ul, [class*=rail i], [class*=track i]');
  out.railBottomDoc = rail ? Math.round(rail.getBoundingClientRect().bottom + scrollY) : null;
  out.lastPlateBottomDoc = railBottom !== null ? Math.round(railBottom) : null;

  // ───────── gold usage inside #vitrine ─────────
  const goldTok = root.getPropertyValue('--gold').trim();
  const goldRgb = (() => { const d = document.createElement('div'); d.style.color = goldTok; document.body.appendChild(d); const c = rgb(getComputedStyle(d).color); d.remove(); return c; })();
  const near = (c, t = 26) => c && goldRgb && Math.abs(c[0] - goldRgb[0]) < t && Math.abs(c[1] - goldRgb[1]) < t && Math.abs(c[2] - goldRgb[2]) < t;
  out.goldToken = { token: goldTok, rgb: goldRgb };
  out.goldInVitrine = [...vit.querySelectorAll('*')].filter(e => {
    const s = S(e);
    return near(rgb(s.color)) || near(rgb(s.backgroundColor)) || near(rgb(s.borderTopColor)) || near(rgb(s.fill)) || near(rgb(s.stroke));
  }).map(e => ({
    tag: e.tagName, cls: (e.getAttribute('class') || '').slice(0, 50), href: e.getAttribute?.('href') || null,
    text: (e.innerText || e.textContent || '').trim().slice(0, 48),
    where: [near(rgb(S(e).color)) && 'color', near(rgb(S(e).backgroundColor)) && 'bg', near(rgb(S(e).borderTopColor)) && 'border', near(rgb(S(e).fill)) && 'fill', near(rgb(S(e).stroke)) && 'stroke'].filter(Boolean),
  }));

  // ───────── text contrast inside #vitrine ─────────
  const leaves = [...vit.querySelectorAll('*')].filter(e => e.children.length === 0 && (e.innerText || '').trim().length > 1 && e.getBoundingClientRect().width > 0);
  out.vitrineContrast = leaves.map(e => {
    const s = S(e); const fg = rgb(s.color); const bg = effBg(e);
    const px = parseFloat(s.fontSize); const bold = (parseInt(s.fontWeight) || 400) >= 700;
    const large = px >= 24 || (px >= 18.66 && bold);
    const cr = ratio(fg, bg);
    return { text: (e.innerText || '').trim().slice(0, 40), fontSize: s.fontSize, large, ratio: cr, pass: cr === null ? null : cr >= (large ? 3 : 4.5) };
  });
  out.vitrineContrastFailures = out.vitrineContrast.filter(c => c.pass === false);

  out.sections = [...document.querySelectorAll('section[id]')].map(s => s.id);
  return out;
};

// ───────────────────────── pixel ink analysis ─────────────────────────
function inkStats(buf) {
  const png = PNG.sync.read(buf);
  const counts = new Map();
  const key = (r, g, b) => (r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3);
  for (let i = 0; i < png.data.length; i += 4) {
    const k = key(png.data[i], png.data[i + 1], png.data[i + 2]);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  let modeK = 0, modeN = -1;
  for (const [k, n] of counts) if (n > modeN) { modeN = n; modeK = k; }
  const mr = ((modeK / 1024) | 0) << 3, mg = (((modeK % 1024) / 32) | 0) << 3, mb = (modeK % 32) << 3;
  let ink = 0, total = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    total++;
    const d = Math.max(Math.abs(png.data[i] - mr), Math.abs(png.data[i + 1] - mg), Math.abs(png.data[i + 2] - mb));
    if (d > 10) ink++;
  }
  return { w: png.width, h: png.height, bgMode: [mr, mg, mb], inkPixels: ink, totalPixels: total, inkFraction: +(ink / total).toFixed(5) };
}

async function platePixels(page, tag) {
  const svgs = await page.$$('#vitrine svg');
  const rows = [];
  for (let i = 0; i < svgs.length; i++) {
    try {
      await svgs[i].scrollIntoViewIfNeeded();
      await page.waitForTimeout(450);
      const state = await svgs[i].evaluate(sv => {
        const up = (el, a) => { let n = el; while (n && n !== document.body) { if (n.hasAttribute?.(a)) return true; n = n.parentElement; } return false; };
        const ks = [...sv.querySelectorAll('.stroke, path, line, circle, polyline, rect, polygon, ellipse')];
        const so = ks.map(k => parseFloat(getComputedStyle(k).strokeOpacity)).filter(Number.isFinite);
        return { lit: up(sv, 'data-lit'), drawn: up(sv, 'data-drawn'), strokeOpacityMin: so.length ? Math.min(...so) : null, strokeOpacityMax: so.length ? Math.max(...so) : null, dashoffsets: [...new Set(ks.map(k => getComputedStyle(k).strokeDashoffset))] };
      });
      const buf = await svgs[i].screenshot({ type: 'png' });
      fs.writeFileSync(path.join(OUT, `${tag}-plate${i}.png`), buf);
      rows.push({ i, ...state, ...inkStats(buf) });
    } catch (e) { rows.push({ i, error: String(e).slice(0, 200) }); }
  }
  return rows;
}

async function ctaKeyboard(page) {
  const has = await page.$('#vitrine [data-cta="engage"], #vitrine a[href^="mailto:"]');
  if (!has) return { reachable: false, reason: 'no CTA element found' };
  // start from the last focusable inside the plate rail, then Tab forward
  const started = await page.evaluate(() => {
    const vit = document.getElementById('vitrine');
    const rail = vit.querySelector('ol, ul');
    const fs = [...(rail || vit).querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])')];
    if (!fs.length) return false;
    fs[fs.length - 1].focus();
    return document.activeElement === fs[fs.length - 1];
  });
  const trail = [];
  for (let n = 0; n < 12; n++) {
    await page.keyboard.press('Tab');
    const cur = await page.evaluate(() => {
      const a = document.activeElement;
      if (!a) return null;
      return { tag: a.tagName, text: (a.innerText || '').trim().slice(0, 40), href: a.getAttribute?.('href'), dataCta: a.getAttribute?.('data-cta'), isEngage: a.getAttribute?.('data-cta') === 'engage' || /^mailto:/i.test(a.getAttribute?.('href') || '') && !!a.closest('#vitrine'), focusVisible: a.matches(':focus-visible'), outline: getComputedStyle(a).outline, outlineWidth: getComputedStyle(a).outlineWidth, outlineColor: getComputedStyle(a).outlineColor, outlineOffset: getComputedStyle(a).outlineOffset, boxShadow: getComputedStyle(a).boxShadow.slice(0, 90) };
    });
    trail.push(cur);
    if (cur && cur.isEngage) return { reachable: true, startedFromRail: started, tabsFromRailEnd: n + 1, focused: cur, trail };
  }
  return { reachable: false, startedFromRail: started, trail };
}

async function ctx(browser, name, opts, url, { pixels = false, shots = [] } = {}) {
  const bag = {};
  const context = await browser.newContext({ viewport: opts.viewport, deviceScaleFactor: 1, reducedMotion: opts.reducedMotion || 'no-preference', userAgent: opts.ua });
  const page = await context.newPage();
  wire(page, bag);
  const t0 = Date.now();
  const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 }).catch(e => ({ err: String(e) }));
  bag.status = resp?.status?.() ?? null;
  bag.loadMs = Date.now() - t0;
  await page.waitForTimeout(1500);
  bag.measureTop = await page.evaluate(MEASURE);
  const vit = await page.$('#vitrine');
  if (vit) { await vit.scrollIntoViewIfNeeded(); await page.waitForTimeout(2200); }
  bag.measure = await page.evaluate(MEASURE);
  for (const s of shots) {
    const el = await page.$(s.sel);
    if (el) { await el.scrollIntoViewIfNeeded(); await page.waitForTimeout(600); await el.screenshot({ path: path.join(OUT, s.file) }).catch(() => {}); }
  }
  if (pixels) bag.platePixels = await platePixels(page, name);
  if (pixels) bag.cta = await ctaKeyboard(page);
  results[name] = bag;
  await context.close();
  console.log(`[${name}] status=${bag.status} pageerrors=${bag.pageerrors.length} consoleErrors=${bag.console.length} plates=${bag.measure?.plates?.length} ctas=${bag.measure?.engagementCtas?.length}`);
}

(async () => {
  const browser = await chromium.launch(LAUNCH);
  await ctx(browser, '1440-normal', { viewport: { width: 1440, height: 900 } }, BASE + '/', { pixels: true, shots: [{ sel: '#vitrine', file: '1440-normal-vitrine.png' }] });
  await ctx(browser, '390-normal', { viewport: { width: 390, height: 844 } }, BASE + '/', { pixels: true, shots: [{ sel: '#vitrine', file: '390-normal-vitrine.png' }] });
  await ctx(browser, '1440-reduced', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, BASE + '/', { pixels: true, shots: [{ sel: '#vitrine', file: '1440-reduced-vitrine.png' }] });
  await ctx(browser, '390-reduced', { viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }, BASE + '/', { shots: [{ sel: '#vitrine', file: '390-reduced-vitrine.png' }] });
  await ctx(browser, '1440-glforce', { viewport: { width: 1440, height: 900 } }, BASE + '/?gl=force', { shots: [{ sel: '#vitrine', file: '1440-glforce-vitrine.png' }] });
  await ctx(browser, '390-glforce', { viewport: { width: 390, height: 844 } }, BASE + '/?gl=force', {});
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'probe.json'), JSON.stringify(results, null, 2));
  console.log('WROTE', path.join(OUT, 'probe.json'));
})();
