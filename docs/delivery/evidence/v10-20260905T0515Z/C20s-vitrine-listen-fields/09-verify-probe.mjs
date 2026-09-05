/**
 * 09 — independent verification probe for c20 scenes 5 + 6 (#vitrine, #listen).
 *
 * Written by the reviewer, not the author: it re-measures every claim in the
 * implementer's report from scratch against a freshly built `out/` served on
 * 127.0.0.1:5602. Nothing here reads the author's probe or its JSON.
 *
 *   node docs/delivery/evidence/v10-20260905T0515Z/C20s-vitrine-listen-fields/09-verify-probe.mjs
 */
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5602';
const ARGS = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

/** Every gold the site defines, as the rgb() strings a computed style returns. */
const GOLDS = new Set([
  'rgb(201, 168, 76)', // --gold
  'rgb(212, 182, 92)', // --gold-light
  'rgb(232, 213, 163)', // --gold-pale
  'rgb(176, 146, 63)', // --gold-dark
]);

const out = {};

function goldWalker({ sectionId, golds }) {
  const section = document.querySelector(sectionId);
  if (!section) return { error: 'no section' };
  const hits = [];
  for (const el of section.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    const props = {
      color: cs.color,
      backgroundColor: cs.backgroundColor,
      borderTopColor: cs.borderTopWidth !== '0px' ? cs.borderTopColor : '',
      borderBottomColor: cs.borderBottomWidth !== '0px' ? cs.borderBottomColor : '',
      borderLeftColor: cs.borderLeftWidth !== '0px' ? cs.borderLeftColor : '',
      borderRightColor: cs.borderRightWidth !== '0px' ? cs.borderRightColor : '',
      fill: cs.fill,
      stroke: cs.stroke,
      outlineColor: cs.outlineWidth !== '0px' ? cs.outlineColor : '',
    };
    const which = Object.entries(props).filter(([, v]) => golds.includes(v)).map(([k]) => k);
    if (which.length) {
      hits.push({
        tag: el.tagName.toLowerCase(),
        cls: (typeof el.className === 'string' ? el.className : el.getAttribute('class')) || '',
        href: el.getAttribute('href') || null,
        text: (el.textContent || '').trim().slice(0, 60),
        props: which,
      });
    }
  }
  return hits;
}

async function scrollTo(page, id) {
  await page.evaluate((sel) => {
    document.querySelector(sel)?.scrollIntoView({ block: 'center', behavior: 'instant' });
  }, id);
  await page.waitForTimeout(2600);
}

async function countCanvases(page) {
  return page.evaluate(() => ({
    hero: document.querySelectorAll('#hero canvas').length,
    about: document.querySelectorAll('#about canvas').length,
    experience: document.querySelectorAll('#experience canvas').length,
    skills: document.querySelectorAll('#skills canvas').length,
    vitrine: document.querySelectorAll('#vitrine canvas').length,
    listen: document.querySelectorAll('#listen canvas').length,
    page: document.querySelectorAll('canvas').length,
  }));
}

const browser = await chromium.launch({ channel: 'chrome', args: ARGS });

/* ---------- A. gl=force, 1440x900 ---------- */
for (const [key, vp] of [['glForce1440', { width: 1440, height: 900 }], ['glForce390', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load' });
  await page.waitForTimeout(1200);

  await scrollTo(page, '#vitrine');
  const atVitrine = await countCanvases(page);
  const vitrineSlot = await page.evaluate(() => {
    const section = document.querySelector('#vitrine');
    const canvas = section?.querySelector('canvas');
    const slot = canvas?.closest('[aria-hidden="true"]');
    const rail = section?.querySelector('[class*="rail"]');
    const cs = slot ? getComputedStyle(slot) : null;
    return {
      canvasRect: canvas ? canvas.getBoundingClientRect().toJSON() : null,
      slotAriaHidden: slot ? slot.getAttribute('aria-hidden') : null,
      slotZ: cs ? cs.zIndex : null,
      slotPosition: cs ? cs.position : null,
      railZ: rail ? getComputedStyle(rail).zIndex : null,
      railScrollBehavior: rail ? getComputedStyle(rail).scrollBehavior : null,
      railSnap: rail ? getComputedStyle(rail).scrollSnapType : null,
      dataLit: section?.getAttribute('data-lit') ?? null,
      dataLitIndex: section?.getAttribute('data-lit-index') ?? null,
      svgs: section ? section.querySelectorAll('svg').length : 0,
    };
  });

  await scrollTo(page, '#listen');
  const atListen = await countCanvases(page);
  const listenSlot = await page.evaluate(() => {
    const section = document.querySelector('#listen');
    const canvas = section?.querySelector('canvas');
    const slot = canvas?.closest('[aria-hidden="true"]');
    const cs = slot ? getComputedStyle(slot) : null;
    const field = section?.querySelector('[data-close]');
    const inner = section?.querySelector('[class*="inner"]');
    return {
      canvasRect: canvas ? canvas.getBoundingClientRect().toJSON() : null,
      slotAriaHidden: slot ? slot.getAttribute('aria-hidden') : null,
      slotPosition: cs ? cs.position : null,
      fieldZ: field ? getComputedStyle(field).zIndex : null,
      fieldAnimationName: field ? getComputedStyle(field).animationName : null,
      innerZ: inner ? getComputedStyle(inner).zIndex : null,
      dataClose: field ? field.getAttribute('data-close') : null,
      svgs: section ? section.querySelectorAll('svg').length : 0,
      anchors: section ? [...section.querySelectorAll('a')].map((a) => a.getAttribute('href')) : [],
    };
  });

  const goldVitrine = await page.evaluate(goldWalker, { sectionId: '#vitrine', golds: [...GOLDS] });
  const goldListen = await page.evaluate(goldWalker, { sectionId: '#listen', golds: [...GOLDS] });

  out[key] = { viewport: vp, atVitrine, atListen, vitrineSlot, listenSlot, goldVitrine, goldListen, pageErrors, consoleErrors };
  await ctx.close();
}

/* ---------- B. MOT-C13-03 — the trace stagger, measured on a fresh page ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load' });
  await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelector('#vitrine')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(2000);
  out.stagger = await page.evaluate(() => {
    const plates = [...document.querySelectorAll('#vitrine [class*="drawing"], #vitrine figure, #vitrine li')];
    const report = [];
    for (const plate of plates) {
      const strokes = [...plate.querySelectorAll('[class*="stroke"]')];
      if (strokes.length < 2) continue;
      const rows = strokes.map((s) => {
        const cs = getComputedStyle(s);
        return {
          delay: parseFloat(cs.transitionDelay),
          duration: parseFloat(cs.transitionDuration),
          dashoffset: cs.strokeDashoffset,
        };
      });
      const delays = rows.map((r) => r.delay).sort((a, b) => a - b);
      let minGap = Infinity;
      for (let i = 1; i < delays.length; i += 1) {
        const gap = delays[i] - delays[i - 1];
        if (gap > 1e-6 && gap < minGap) minGap = gap;
      }
      report.push({
        strokes: strokes.length,
        firstDelayMs: +(delays[0] * 1000).toFixed(3),
        lastDelayMs: +(delays[delays.length - 1] * 1000).toFixed(3),
        durationMs: +(rows[0].duration * 1000).toFixed(3),
        minGapMs: Number.isFinite(minGap) ? +(minGap * 1000).toFixed(3) : null,
        landsAtMs: +((delays[delays.length - 1] + rows[0].duration) * 1000).toFixed(3),
        allDashoffsetZero: rows.every((r) => parseFloat(r.dashoffset) === 0),
      });
    }
    const label = document.querySelector('#vitrine [class*="label"]');
    return { plates: report, labelDelayMs: label ? +(parseFloat(getComputedStyle(label).transitionDelay) * 1000).toFixed(3) : null };
  });
  await ctx.close();
}

/* ---------- C. reduced motion, 1440 and 390 ---------- */
for (const [key, vp] of [['reduce1440', { width: 1440, height: 900 }], ['reduce390', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await scrollTo(page, '#vitrine');
  const atVitrine = await countCanvases(page);
  await scrollTo(page, '#listen');
  const atListen = await countCanvases(page);
  out[key] = {
    viewport: vp,
    atVitrine,
    atListen,
    pageErrors,
    detail: await page.evaluate(() => {
      const running = document.getAnimations().filter((a) => a.playState === 'running');
      const rail = document.querySelector('#vitrine [class*="rail"]');
      const jaw = document.querySelector('#listen [data-jaw="left"]');
      const drawings = document.querySelectorAll('#vitrine svg[class*="drawing"], #vitrine svg').length;
      const strokes = [...document.querySelectorAll('#vitrine [class*="stroke"]')];
      return {
        runningAnimations: running.length,
        runningNames: running.slice(0, 8).map((a) => a.animationName ?? a.constructor.name),
        railScrollBehavior: rail ? getComputedStyle(rail).scrollBehavior : null,
        railSnap: rail ? getComputedStyle(rail).scrollSnapType : null,
        jawAnimationDuration: jaw ? getComputedStyle(jaw).animationDuration : null,
        jawTransitionDuration: jaw ? getComputedStyle(jaw).transitionDuration : null,
        vitrineSvgs: drawings,
        strokeCount: strokes.length,
        strokesAllZeroDashoffset: strokes.length > 0 && strokes.every((s) => parseFloat(getComputedStyle(s).strokeDashoffset) === 0),
        listenAnchors: document.querySelectorAll('#listen a').length,
      };
    }),
  };
  await ctx.close();
}

/* ---------- D. no WebGL at all, 1440 ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => {
    const real = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function patched(type, ...rest) {
      if (typeof type === 'string' && /webgl/i.test(type)) return null;
      return real.call(this, type, ...rest);
    };
  });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);
  await scrollTo(page, '#vitrine');
  const atVitrine = await countCanvases(page);
  await scrollTo(page, '#listen');
  const atListen = await countCanvases(page);
  out.noGL1440 = {
    atVitrine,
    atListen,
    pageErrors,
    consoleErrors,
    detail: await page.evaluate(() => ({
      vitrineSvgs: document.querySelectorAll('#vitrine svg').length,
      listenSvgs: document.querySelectorAll('#listen svg').length,
      listenAnchors: [...document.querySelectorAll('#listen a')].map((a) => a.getAttribute('href')),
      h1: document.querySelector('h1')?.textContent?.trim() ?? null,
      sections: document.querySelectorAll('section[id]').length,
      errorBoundary: !!document.querySelector('[data-error-boundary], [class*="errorBoundary"]'),
    })),
  };
  await ctx.close();
}

await browser.close();
writeFileSync(new URL('./09-verify-probe.json', import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
