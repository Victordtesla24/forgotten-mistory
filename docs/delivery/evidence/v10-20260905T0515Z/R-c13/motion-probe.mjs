// R-c13 motion/visualisation lens probe — read-only against production.
// Playwright chromium, channel 'chrome', --no-sandbox. One browser, sequential contexts.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://forgotten-mistory.web.app';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/R-c13';
const CAP = path.join(OUT, 'capture');
fs.mkdirSync(CAP, { recursive: true });
const R = { startedAt: new Date().toISOString(), phases: {} };
const SECTIONS = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];

const save = () => fs.writeFileSync(path.join(OUT, 'motion-probe.json'), JSON.stringify(R, null, 2));

// ---- in-page collectors -----------------------------------------------------
const INVENTORY = () => {
  const secs = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];
  const out = {};
  for (const id of secs) {
    const el = document.getElementById(id);
    if (!el) { out[id] = { missing: true }; continue; }
    const canvases = [...el.querySelectorAll('canvas')].map((c) => {
      const r = c.getBoundingClientRect();
      let ctx = 'unknown';
      try { ctx = c.getContext('webgl2') ? 'webgl2' : (c.getContext('webgl') ? 'webgl' : '2d-or-none'); } catch { ctx = 'ctx-taken'; }
      return { w: Math.round(r.width), h: Math.round(r.height), cls: c.className || '', ctx, aria: c.getAttribute('aria-hidden') };
    });
    const svgs = [...el.querySelectorAll('svg')].map((s) => {
      const r = s.getBoundingClientRect();
      return {
        w: Math.round(r.width), h: Math.round(r.height),
        vb: s.getAttribute('viewBox'),
        paths: s.querySelectorAll('path').length,
        lines: s.querySelectorAll('line').length,
        circles: s.querySelectorAll('circle').length,
        rects: s.querySelectorAll('rect').length,
        texts: s.querySelectorAll('text').length,
        cls: (typeof s.className === 'object' ? s.className.baseVal : s.className) || '',
      };
    });
    // CSS-animated / transitioned elements inside the section
    const animated = [];
    const transitions = [];
    for (const n of el.querySelectorAll('*')) {
      const cs = getComputedStyle(n);
      if (cs.animationName && cs.animationName !== 'none') {
        animated.push({
          tag: n.tagName.toLowerCase(), cls: (typeof n.className === 'object' ? n.className.baseVal : n.className) || '',
          name: cs.animationName, dur: cs.animationDuration, delay: cs.animationDelay,
          ease: cs.animationTimingFunction, iter: cs.animationIterationCount, state: cs.animationPlayState,
        });
      }
      const td = cs.transitionDuration;
      if (td && td !== '0s' && !td.split(',').every((d) => parseFloat(d) === 0)) {
        transitions.push({
          tag: n.tagName.toLowerCase(), cls: (typeof n.className === 'object' ? n.className.baseVal : n.className) || '',
          prop: cs.transitionProperty, dur: td, delay: cs.transitionDelay, ease: cs.transitionTimingFunction,
        });
      }
    }
    out[id] = {
      canvases, svgs,
      animatedCount: animated.length, animated: animated.slice(0, 18),
      transitionCount: transitions.length, transitions: transitions.slice(0, 12),
      videos: el.querySelectorAll('video').length,
      dataAttrs: Object.fromEntries(Object.entries(el.dataset || {})),
    };
  }
  // page-level running animations
  const running = document.getAnimations().map((a) => ({
    name: a.animationName || (a.effect && a.effect.getKeyframes && 'web-animation') || '?',
    state: a.playState,
    dur: a.effect && a.effect.getTiming ? a.effect.getTiming().duration : null,
    ease: a.effect && a.effect.getTiming ? a.effect.getTiming().easing : null,
    target: a.effect && a.effect.target ? (a.effect.target.tagName + '.' + ((typeof a.effect.target.className === 'object' ? a.effect.target.className.baseVal : a.effect.target.className) || '')) : null,
    sectionId: (() => { let t = a.effect && a.effect.target; while (t && t !== document.body) { if (t.id && ['hero','about','experience','skills','vitrine','listen'].includes(t.id)) return t.id; t = t.parentElement; } return null; })(),
  }));
  return {
    out, running,
    canvasTotal: document.querySelectorAll('canvas').length,
    glFlag: location.search,
    reducedMotionMatches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    htmlDataset: Object.fromEntries(Object.entries(document.documentElement.dataset || {})),
    bodyDataset: Object.fromEntries(Object.entries(document.body.dataset || {})),
  };
};

const FPS = (ms) => new Promise((res) => {
  const d = []; let last = performance.now(); const t0 = last;
  const step = (t) => { d.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(step); else res(d); };
  requestAnimationFrame(step);
});

const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? +(s[Math.floor(s.length / 2)]).toFixed(2) : null; };

async function shot(page, name, sel) {
  const p = path.join(CAP, name);
  try {
    if (sel) { const el = await page.$(sel); if (!el) return null; await el.screenshot({ path: p }); }
    else await page.screenshot({ path: p });
    const kb = Math.round(fs.statSync(p).size / 1024);
    return { file: name, kb };
  } catch (e) { return { file: name, error: String(e).slice(0, 120) }; }
}

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });

// ================= PHASE 1: 1440 ?gl=force, motion allowed =================
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 160)));
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'networkidle', timeout: 60000 });
  R.buildCommit = await page.getAttribute('meta[name="build-commit"]', 'content');
  await page.waitForTimeout(2500);

  R.phases.p1 = { viewport: '1440x900', url: '/?gl=force', reducedMotion: 'no-preference' };
  R.phases.p1.atHero = await page.evaluate(INVENTORY);

  // frame pacing at hero, no scrolling (3s)
  const d1440 = await page.evaluate(FPS, 3000);
  R.phases.p1.fps = { samples: d1440.length, medianDeltaMs: median(d1440), impliedFps: median(d1440) ? +(1000 / median(d1440)).toFixed(1) : null, p95: median(d1440) ? +[...d1440].sort((a,b)=>a-b)[Math.floor(d1440.length*0.95)].toFixed(2) : null };
  R.phases.p1.shots = [];
  R.phases.p1.shots.push(await shot(page, '1440-gl-hero.png', '#hero'));

  // scroll each section into view, wait for entry beats, capture inventory after entry
  R.phases.p1.onEntry = {};
  for (const id of SECTIONS.slice(1)) {
    await page.evaluate((s) => document.getElementById(s)?.scrollIntoView({ behavior: 'instant', block: 'start' }), id);
    await page.waitForTimeout(400);
    const before = await page.evaluate((s) => {
      const el = document.getElementById(s); if (!el) return null;
      return { anims: document.getAnimations().filter(a => { let t = a.effect && a.effect.target; while (t && t !== document.body) { if (t === el) return true; t = t.parentElement; } return false; }).map(a => ({ n: a.animationName || 'wa', st: a.playState, ct: a.currentTime })).slice(0, 20), canvases: el.querySelectorAll('canvas').length };
    }, id);
    await page.waitForTimeout(1800);
    const after = await page.evaluate((s) => {
      const el = document.getElementById(s); if (!el) return null;
      const inv = {};
      inv.canvases = [...el.querySelectorAll('canvas')].map(c => { const r = c.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
      inv.anims = document.getAnimations().filter(a => { let t = a.effect && a.effect.target; while (t && t !== document.body) { if (t === el) return true; t = t.parentElement; } return false; }).map(a => ({ n: a.animationName || 'wa', st: a.playState, dur: a.effect?.getTiming?.().duration, ease: a.effect?.getTiming?.().easing })).slice(0, 20);
      inv.dataset = Object.fromEntries(Object.entries(el.dataset || {}));
      // look for common "entered/inview" flags on descendants
      inv.inviewFlags = [...el.querySelectorAll('[data-inview],[data-entered],[data-visible],[data-state],[data-active]')].slice(0, 10).map(n => ({ tag: n.tagName.toLowerCase(), cls: (typeof n.className === 'object' ? n.className.baseVal : n.className) || '', ds: Object.fromEntries(Object.entries(n.dataset)) }));
      return inv;
    }, id);
    R.phases.p1.onEntry[id] = { before, after };
    R.phases.p1.shots.push(await shot(page, `1440-gl-${id}.png`, `#${id}`));
  }
  R.phases.p1.pageErrors = errs;
  save();

  // ---- hover behaviour on the two interactive infographics + vitrine plates
  const hover = {};
  try {
    await page.evaluate(() => document.getElementById('about')?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(600);
    const dial = await page.$('#about svg');
    if (dial) {
      const b = await dial.boundingBox();
      const pre = await page.evaluate(() => document.getElementById('about')?.innerText.slice(0, 400));
      await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.28);
      await page.waitForTimeout(500);
      const post = await page.evaluate(() => document.getElementById('about')?.innerText.slice(0, 400));
      hover.about = { changed: pre !== post, preHead: (pre || '').slice(0, 160), postHead: (post || '').slice(0, 160) };
      await shot(page, '1440-about-hover.png', '#about');
    }
  } catch (e) { hover.aboutErr = String(e).slice(0, 120); }
  try {
    await page.evaluate(() => document.getElementById('vitrine')?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(800);
    const plate = await page.$('#vitrine article, #vitrine li, #vitrine [class*="plate"], #vitrine [class*="card"]');
    if (plate) {
      const b = await plate.boundingBox();
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.waitForTimeout(600);
      hover.vitrine = await page.evaluate(() => {
        const el = document.getElementById('vitrine');
        return { running: document.getAnimations().filter(a => { let t = a.effect?.target; while (t && t !== document.body) { if (t === el) return true; t = t.parentElement; } return false; }).map(a => ({ n: a.animationName || 'wa', st: a.playState })).slice(0, 12) };
      });
      await shot(page, '1440-vitrine-hover.png', '#vitrine');
    }
  } catch (e) { hover.vitrineErr = String(e).slice(0, 120); }
  R.phases.p1.hover = hover;

  // ---- keyboard: tab through and see whether any signature responds
  try {
    await page.evaluate(() => window.scrollTo(0, 0));
    const kb = [];
    for (let i = 0; i < 26; i++) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate(() => {
        const a = document.activeElement; if (!a) return null;
        let t = a, sec = null;
        while (t && t !== document.body) { if (t.id && ['hero','about','experience','skills','vitrine','listen'].includes(t.id)) { sec = t.id; break; } t = t.parentElement; }
        const r = a.getBoundingClientRect();
        const cs = getComputedStyle(a);
        return { tag: a.tagName.toLowerCase(), sec, txt: (a.innerText || a.getAttribute('aria-label') || '').slice(0, 40).replace(/\n/g, ' '), outline: cs.outlineWidth + ' ' + cs.outlineStyle, w: Math.round(r.width), h: Math.round(r.height) };
      });
      kb.push(info);
    }
    R.phases.p1.keyboard = kb;
  } catch (e) { R.phases.p1.keyboardErr = String(e).slice(0, 120); }

  // ---- MiniVic: open it and see whether the avatar stage moves while it speaks
  try {
    const trigger = await page.$('[aria-label*="Vic" i], button[class*="miniVic" i], [class*="minivic" i] button, [data-minivic]');
    if (trigger) {
      await trigger.click({ timeout: 5000 }).catch(() => {});
      await page.waitForTimeout(1500);
      R.phases.p1.miniVic = await page.evaluate(() => {
        const root = document.querySelector('[class*="miniVic" i], [class*="minivic" i], [role="dialog"]');
        if (!root) return { open: false };
        const canvases = [...root.querySelectorAll('canvas')].map(c => { const r = c.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; });
        const vids = [...root.querySelectorAll('video')].map(v => ({ src: (v.currentSrc || v.src || '').slice(-60), paused: v.paused, rt: v.readyState }));
        const anims = document.getAnimations().filter(a => { let t = a.effect?.target; while (t && t !== document.body) { if (t === root) return true; t = t.parentElement; } return false; }).map(a => ({ n: a.animationName || 'wa', st: a.playState, dur: a.effect?.getTiming?.().duration }));
        const imgs = [...root.querySelectorAll('img')].map(i => (i.currentSrc || i.src || '').slice(-50));
        return { open: true, canvases, vids, anims, imgs, text: (root.innerText || '').slice(0, 300) };
      });
      await shot(page, '1440-minivic-open.png');
      // sample canvas pixel deltas over 2s to see whether the avatar stage actually animates
      R.phases.p1.miniVicMotion = await page.evaluate(async () => {
        const root = document.querySelector('[class*="miniVic" i], [class*="minivic" i], [role="dialog"]');
        const c = root && root.querySelector('canvas');
        if (!c) return { canvas: false };
        const snap = () => { try { const cx = c.getContext('2d'); if (!cx) return null; const d = cx.getImageData(0, 0, Math.min(c.width, 80), Math.min(c.height, 80)).data; let s = 0; for (let i = 0; i < d.length; i += 40) s += d[i]; return s; } catch { return 'tainted-or-gl'; } };
        const a = snap(); await new Promise(r => setTimeout(r, 900)); const b = snap(); await new Promise(r => setTimeout(r, 900)); const cc = snap();
        return { canvas: true, w: c.width, h: c.height, samples: [a, b, cc], changed: !(a === b && b === cc) };
      });
    } else R.phases.p1.miniVic = { triggerFound: false };
  } catch (e) { R.phases.p1.miniVicErr = String(e).slice(0, 160); }
  save();
  await ctx.close();
} catch (e) { R.phases.p1 = { ...(R.phases.p1 || {}), fatal: String(e).slice(0, 300) }; save(); }

// ================= PHASE 2: 1440 ?gl=force, prefers-reduced-motion: reduce =================
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  R.phases.p2 = { viewport: '1440x900', url: '/?gl=force', reducedMotion: 'reduce' };
  R.phases.p2.atHero = await page.evaluate(INVENTORY);
  const dRM = await page.evaluate(FPS, 3000);
  R.phases.p2.fps = { medianDeltaMs: median(dRM), impliedFps: median(dRM) ? +(1000 / median(dRM)).toFixed(1) : null };
  R.phases.p2.perSection = {};
  R.phases.p2.shots = [await shot(page, '1440-rm-hero.png', '#hero')];
  for (const id of SECTIONS.slice(1)) {
    await page.evaluate((s) => document.getElementById(s)?.scrollIntoView({ block: 'start' }), id);
    await page.waitForTimeout(1500);
    R.phases.p2.perSection[id] = await page.evaluate((s) => {
      const el = document.getElementById(s); if (!el) return null;
      const anims = document.getAnimations().filter(a => { let t = a.effect?.target; while (t && t !== document.body) { if (t === el) return true; t = t.parentElement; } return false; });
      const running = anims.filter(a => a.playState === 'running').map(a => ({ n: a.animationName || 'wa', dur: a.effect?.getTiming?.().duration, iter: a.effect?.getTiming?.().iterations }));
      let cssAnimRunning = [];
      for (const n of el.querySelectorAll('*')) { const cs = getComputedStyle(n); if (cs.animationName !== 'none' && cs.animationPlayState === 'running' && parseFloat(cs.animationDuration) > 0) cssAnimRunning.push({ cls: (typeof n.className === 'object' ? n.className.baseVal : n.className) || '', name: cs.animationName, dur: cs.animationDuration, iter: cs.animationIterationCount }); }
      return { canvases: el.querySelectorAll('canvas').length, runningWAAPI: running, cssAnimRunning: cssAnimRunning.slice(0, 12), textLen: (el.innerText || '').length };
    }, id);
  }
  R.phases.p2.shots.push(await shot(page, '1440-rm-experience.png', '#experience'));
  R.phases.p2.shots.push(await shot(page, '1440-rm-vitrine.png', '#vitrine'));
  save();
  await ctx.close();
} catch (e) { R.phases.p2 = { ...(R.phases.p2 || {}), fatal: String(e).slice(0, 300) }; save(); }

// ================= PHASE 3: 390 ?gl=force =================
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  R.phases.p3 = { viewport: '390x844@2x', url: '/?gl=force' };
  R.phases.p3.atHero = await page.evaluate(INVENTORY);
  const d390 = await page.evaluate(FPS, 3000);
  R.phases.p3.fps = { samples: d390.length, medianDeltaMs: median(d390), impliedFps: median(d390) ? +(1000 / median(d390)).toFixed(1) : null };
  R.phases.p3.perSection = {};
  for (const id of SECTIONS.slice(1)) {
    await page.evaluate((s) => document.getElementById(s)?.scrollIntoView({ block: 'start' }), id);
    await page.waitForTimeout(1200);
    R.phases.p3.perSection[id] = await page.evaluate((s) => {
      const el = document.getElementById(s); if (!el) return null;
      return { canvases: [...el.querySelectorAll('canvas')].map(c => { const r = c.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; }), svgs: [...el.querySelectorAll('svg')].map(s2 => { const r = s2.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; }), scrollW: el.scrollWidth, clientW: el.clientWidth };
    }, id);
  }
  R.phases.p3.shots = [await shot(page, '390-gl-hero.png', '#hero'), await shot(page, '390-gl-experience.png', '#experience')];
  save();
  await ctx.close();
} catch (e) { R.phases.p3 = { ...(R.phases.p3 || {}), fatal: String(e).slice(0, 300) }; save(); }

// ================= PHASE 4: no-GL (natural SwiftShader classification, no ?gl=force) =================
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  R.phases.p4 = { viewport: '1440x900', url: '/ (no gl=force)', note: 'SwiftShader → useGLCapability classifies unsupported; this IS the no-GL fallback path' };
  R.phases.p4.atHero = await page.evaluate(INVENTORY);
  R.phases.p4.perSection = {};
  for (const id of SECTIONS) {
    await page.evaluate((s) => document.getElementById(s)?.scrollIntoView({ block: 'start' }), id);
    await page.waitForTimeout(900);
    R.phases.p4.perSection[id] = await page.evaluate((s) => {
      const el = document.getElementById(s); if (!el) return null;
      const cs = getComputedStyle(el);
      return { canvases: el.querySelectorAll('canvas').length, svgs: el.querySelectorAll('svg').length, bg: cs.backgroundColor, bgImage: (cs.backgroundImage || '').slice(0, 120), fallbackEls: el.querySelectorAll('[class*="fallback" i],[class*="still" i],[data-fallback]').length, textLen: (el.innerText || '').length };
    }, id);
  }
  R.phases.p4.shots = [await shot(page, '1440-nogl-hero.png', '#hero'), await shot(page, '1440-nogl-experience.png', '#experience')];
  R.phases.p4.glCapability = await page.evaluate(() => {
    try { const c = document.createElement('canvas'); const gl = c.getContext('webgl2') || c.getContext('webgl'); if (!gl) return 'no-context'; const dbg = gl.getExtension('WEBGL_debug_renderer_info'); return dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); } catch (e) { return 'err:' + e.message; }
  });
  save();
  await ctx.close();
} catch (e) { R.phases.p4 = { ...(R.phases.p4 || {}), fatal: String(e).slice(0, 300) }; save(); }

await browser.close();
R.finishedAt = new Date().toISOString();
save();
console.log('DONE build=' + R.buildCommit);
