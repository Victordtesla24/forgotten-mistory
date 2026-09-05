// R-c13 motion lens — probe 2: diagnose the ?gl=force crash, capture entry beats,
// MiniVic stage motion, and viewport-clipped screenshots under 400 kB.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://forgotten-mistory.web.app';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/R-c13';
const CAP = path.join(OUT, 'capture');
const R = { startedAt: new Date().toISOString() };
const save = () => fs.writeFileSync(path.join(OUT, 'motion-probe2.json'), JSON.stringify(R, null, 2));
const SECTIONS = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];

async function clipShot(page, name, sel) {
  const p = path.join(CAP, name);
  try {
    const box = sel ? await (await page.$(sel))?.boundingBox() : null;
    if (sel && !box) return { file: name, error: 'no element' };
    const vh = page.viewportSize().height;
    const clip = sel ? { x: 0, y: Math.max(0, box.y), width: page.viewportSize().width, height: Math.min(box.height, vh) } : undefined;
    await page.screenshot({ path: p, clip });
    const kb = Math.round(fs.statSync(p).size / 1024);
    return { file: name, kb, over400: kb > 400 };
  } catch (e) { return { file: name, error: String(e).slice(0, 120) }; }
}

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });

// ---------- A. diagnose the ?gl=force crash ----------
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const console_ = [], errs = [], failed = [];
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) console_.push(m.type() + ': ' + m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errs.push((e.stack || String(e)).slice(0, 700)));
  page.on('requestfailed', (r) => failed.push(r.url().slice(-90) + ' :: ' + (r.failure()?.errorText || '')));
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(4000);
  R.glForceCrash = {
    url: '/?gl=force',
    buildCommit: await page.getAttribute('meta[name="build-commit"]', 'content'),
    sectionsPresent: await page.evaluate((s) => s.filter((id) => !!document.getElementById(id)), SECTIONS),
    bodyText: (await page.evaluate(() => document.body.innerText)).slice(0, 700),
    canvases: await page.evaluate(() => document.querySelectorAll('canvas').length),
    consoleErrors: console_.slice(0, 15),
    pageErrors: errs.slice(0, 6),
    requestFailures: failed.slice(0, 8),
  };
  R.glForceCrash.shot = await clipShot(page, '1440-glforce-crash.png');
  // second load to confirm determinism
  await page.reload({ waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3500);
  R.glForceCrash.reloadSectionsPresent = await page.evaluate((s) => s.filter((id) => !!document.getElementById(id)), SECTIONS);
  R.glForceCrash.reloadConsole = console_.slice(0, 25);
  R.glForceCrash.reloadPageErrors = errs.slice(0, 8);
  save();
  await ctx.close();
} catch (e) { R.glForceCrashErr = String(e).slice(0, 300); save(); }

// ---------- B. 1440 normal (no gl=force): entry beats + hover + MiniVic + shots ----------
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(1500);
  R.p1440 = { url: '/', pageErrors: errs, shots: [] };
  R.p1440.shots.push(await clipShot(page, '1440-hero.png', '#hero'));

  // hero entry beats — reload and read animations immediately
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(220);
  R.p1440.heroBeats = await page.evaluate(() => document.getAnimations().map((a) => ({
    name: a.animationName || 'wa',
    state: a.playState,
    dur: a.effect?.getTiming?.().duration,
    delay: a.effect?.getTiming?.().delay,
    ease: a.effect?.getTiming?.().easing,
    target: (a.effect?.target?.tagName || '') + '.' + ((typeof a.effect?.target?.className === 'object' ? a.effect.target.className.baseVal : a.effect?.target?.className) || '').slice(0, 30),
  })).slice(0, 20));
  await page.waitForTimeout(2500);

  // per-section entry: scroll in, then read what fired
  R.p1440.entry = {};
  for (const id of SECTIONS.slice(1)) {
    await page.evaluate((s) => document.getElementById(s)?.scrollIntoView({ block: 'start' }), id);
    await page.waitForTimeout(150);
    const t0 = await page.evaluate((s) => {
      const el = document.getElementById(s);
      const inSec = (a) => { let t = a.effect?.target; while (t && t !== document.body) { if (t === el) return true; t = t.parentElement; } return false; };
      return document.getAnimations().filter(inSec).map((a) => ({ n: a.animationName || 'wa', st: a.playState, dur: a.effect?.getTiming?.().duration, delay: a.effect?.getTiming?.().delay, ease: a.effect?.getTiming?.().easing }));
    }, id);
    await page.waitForTimeout(1600);
    const t1 = await page.evaluate((s) => {
      const el = document.getElementById(s);
      const inSec = (a) => { let t = a.effect?.target; while (t && t !== document.body) { if (t === el) return true; t = t.parentElement; } return false; };
      const anims = document.getAnimations().filter(inSec).map((a) => ({ n: a.animationName || 'wa', st: a.playState }));
      // transition-driven signatures (vitrine trace, bench trace) leave data flags
      const flags = [...el.querySelectorAll('[data-lit],[data-drawn],[data-settled],[data-sweep],[data-open],[data-active]')].slice(0, 12)
        .map((n) => ({ cls: ((typeof n.className === 'object' ? n.className.baseVal : n.className) || '').slice(0, 30), ds: Object.fromEntries(Object.entries(n.dataset)) }));
      // measured dash state of traced strokes
      const strokes = [...el.querySelectorAll('[class*="stroke" i],[class*="wire" i]')].slice(0, 4).map((n) => { const cs = getComputedStyle(n); return { cls: ((typeof n.className === 'object' ? n.className.baseVal : n.className) || '').slice(0, 24), dashoffset: cs.strokeDashoffset, dasharray: cs.strokeDasharray, transDur: cs.transitionDuration, transDelay: cs.transitionDelay, ease: cs.transitionTimingFunction, anim: cs.animationName, animDur: cs.animationDuration }; });
      return { anims, flags, strokes };
    }, id);
    R.p1440.entry[id] = { onArrival: t0, after1600ms: t1 };
    R.p1440.shots.push(await clipShot(page, `1440-${id}.png`, `#${id}`));
  }
  save();

  // compass hover
  try {
    await page.evaluate(() => document.getElementById('about')?.scrollIntoView({ block: 'start' }));
    await page.waitForTimeout(700);
    const pre = await page.evaluate(() => document.getElementById('about')?.innerText.slice(0, 500));
    const svg = await page.$('#about svg');
    const b = await svg.boundingBox();
    await page.mouse.move(b.x + b.width * 0.5, b.y + b.height * 0.22);
    await page.waitForTimeout(600);
    const post = await page.evaluate(() => document.getElementById('about')?.innerText.slice(0, 500));
    R.p1440.compassHover = { changed: pre !== post, pre: (pre || '').slice(0, 220), post: (post || '').slice(0, 220) };
    R.p1440.shots.push(await clipShot(page, '1440-about-hover.png', '#about'));
  } catch (e) { R.p1440.compassHoverErr = String(e).slice(0, 150); }

  // compass keyboard: focus the dial's focusable and arrow through
  try {
    R.p1440.compassKeyboard = await page.evaluate(() => {
      const about = document.getElementById('about');
      const f = about.querySelectorAll('button, [tabindex]:not([tabindex="-1"]), a[href]');
      return { focusables: f.length, sample: [...f].slice(0, 6).map((n) => ({ tag: n.tagName.toLowerCase(), label: (n.getAttribute('aria-label') || n.innerText || '').slice(0, 40).replace(/\n/g, ' ') })) };
    });
  } catch (e) { R.p1440.compassKeyboardErr = String(e).slice(0, 120); }

  // MiniVic avatar stage: does anything move while it speaks?
  try {
    await page.click('#minivic-toggle', { timeout: 8000 });
    await page.waitForTimeout(2000);
    R.miniVic = await page.evaluate(() => {
      const root = document.querySelector('[role="dialog"], [class*="MiniVic" i], [class*="panel" i]');
      const vid = document.querySelector('video');
      const cans = [...document.querySelectorAll('canvas')].map((c) => { const r = c.getBoundingClientRect(); return { cssW: Math.round(r.width), cssH: Math.round(r.height), bufW: c.width, bufH: c.height, cls: (c.className || '').slice(0, 30) }; });
      return {
        video: vid ? { src: (vid.currentSrc || '').slice(-40), paused: vid.paused, loop: vid.loop, muted: vid.muted, t: vid.currentTime, dur: vid.duration, w: vid.videoWidth, h: vid.videoHeight, cssW: Math.round(vid.getBoundingClientRect().width), cssH: Math.round(vid.getBoundingClientRect().height) } : null,
        canvases: cans,
        anims: document.getAnimations().map((a) => ({ n: a.animationName || 'wa', st: a.playState, dur: a.effect?.getTiming?.().duration })).slice(0, 12),
      };
    });
    // sample video currentTime + canvas pixels over 3 s
    R.miniVicMotion = await page.evaluate(async () => {
      const vid = document.querySelector('video');
      const can = document.querySelector('canvas');
      const sampleCanvas = () => { try { const cx = can.getContext('2d'); if (!cx) return 'no2d'; const d = cx.getImageData(0, 0, Math.min(can.width, 64), Math.min(can.height, 32)).data; let s = 0; for (let i = 0; i < d.length; i += 16) s += d[i]; return s; } catch (e) { return 'err'; } };
      const out = { vidTimes: [], canvasSums: [] };
      for (let i = 0; i < 6; i++) { out.vidTimes.push(vid ? +vid.currentTime.toFixed(3) : null); out.canvasSums.push(can ? sampleCanvas() : null); await new Promise((r) => setTimeout(r, 500)); }
      out.videoAdvanced = out.vidTimes.length > 1 && out.vidTimes[5] !== out.vidTimes[0];
      out.canvasChanged = new Set(out.canvasSums.map(String)).size > 1;
      return out;
    });
    R.p1440.shots.push(await clipShot(page, '1440-minivic-stage.png'));
  } catch (e) { R.miniVicErr = String(e).slice(0, 200); }
  save();
  await ctx.close();
} catch (e) { R.p1440Err = String(e).slice(0, 300); save(); }

// ---------- C. 1440 reduced motion: shots + running audit ----------
try {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);
  R.rm = { url: '/', reducedMotion: 'reduce', shots: [] };
  R.rm.shots.push(await clipShot(page, '1440-rm-hero.png', '#hero'));
  R.rm.perSection = {};
  for (const id of SECTIONS.slice(1)) {
    await page.evaluate((s) => document.getElementById(s)?.scrollIntoView({ block: 'start' }), id);
    await page.waitForTimeout(2200);
    R.rm.perSection[id] = await page.evaluate((s) => {
      const el = document.getElementById(s);
      const inSec = (a) => { let t = a.effect?.target; while (t && t !== document.body) { if (t === el) return true; t = t.parentElement; } return false; };
      const stillRunning = document.getAnimations().filter(inSec).filter((a) => a.playState === 'running').map((a) => ({ n: a.animationName || 'wa', dur: a.effect?.getTiming?.().duration, iter: a.effect?.getTiming?.().iterations }));
      const infinite = [];
      for (const n of el.querySelectorAll('*')) { const cs = getComputedStyle(n); if (cs.animationName !== 'none' && (cs.animationIterationCount === 'infinite')) infinite.push({ cls: ((typeof n.className === 'object' ? n.className.baseVal : n.className) || '').slice(0, 30), name: cs.animationName, dur: cs.animationDuration }); }
      return { canvases: el.querySelectorAll('canvas').length, stillRunningAfter2200ms: stillRunning, infiniteAnimations: infinite.slice(0, 6), textLen: (el.innerText || '').length };
    }, id);
  }
  R.rm.shots.push(await clipShot(page, '1440-rm-experience.png', '#experience'));
  R.rm.shots.push(await clipShot(page, '1440-rm-vitrine.png', '#vitrine'));
  // page-wide infinite animation audit under RM
  R.rm.pageInfinite = await page.evaluate(() => {
    const out = [];
    for (const n of document.querySelectorAll('*')) { const cs = getComputedStyle(n); if (cs.animationName !== 'none' && cs.animationIterationCount === 'infinite' && cs.animationPlayState === 'running') out.push({ cls: ((typeof n.className === 'object' ? n.className.baseVal : n.className) || '').slice(0, 60), name: cs.animationName, dur: cs.animationDuration }); }
    return out.slice(0, 10);
  });
  save();
  await ctx.close();
} catch (e) { R.rmErr = String(e).slice(0, 300); save(); }

// ---------- D. 390 normal: fps + shots ----------
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(2500);
  R.p390 = { url: '/', shots: [] };
  const d = await page.evaluate(() => new Promise((res) => { const a = []; let l = performance.now(); const t0 = l; const s = (t) => { a.push(t - l); l = t; if (t - t0 < 3000) requestAnimationFrame(s); else res(a); }; requestAnimationFrame(s); }));
  const sorted = [...d].sort((x, y) => x - y);
  R.p390.fps = { samples: d.length, medianDeltaMs: +sorted[Math.floor(sorted.length / 2)].toFixed(2), p95DeltaMs: +sorted[Math.floor(sorted.length * 0.95)].toFixed(2), impliedFps: +(1000 / sorted[Math.floor(sorted.length / 2)]).toFixed(1) };
  R.p390.shots.push(await clipShot(page, '390-hero.png', '#hero'));
  await page.evaluate(() => document.getElementById('experience')?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1500);
  R.p390.shots.push(await clipShot(page, '390-experience.png', '#experience'));
  await page.evaluate(() => document.getElementById('vitrine')?.scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1500);
  R.p390.shots.push(await clipShot(page, '390-vitrine.png', '#vitrine'));
  R.p390.vitrineScroll = await page.evaluate(() => { const el = document.getElementById('vitrine'); const rail = el.querySelector('[class*="rail" i],[class*="track" i],ul,ol'); return rail ? { scrollW: rail.scrollWidth, clientW: rail.clientWidth, overflowX: getComputedStyle(rail).overflowX, scrollBehavior: getComputedStyle(rail).scrollBehavior, snapType: getComputedStyle(rail).scrollSnapType } : null; });
  save();
  await ctx.close();
} catch (e) { R.p390Err = String(e).slice(0, 300); save(); }

await browser.close();
R.finishedAt = new Date().toISOString();
save();
console.log('PROBE2 DONE');
