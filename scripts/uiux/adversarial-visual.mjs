#!/usr/bin/env node
import { chromium, firefox, webkit } from 'playwright';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

const require = createRequire(import.meta.url);
const axeSource = require.resolve('axe-core/axe.min.js');

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true'] : null).filter(Boolean));
const BASE = (args['base-url'] || 'https://forgotten-mistory.web.app').replace(/\/$/, '');
const BUILD = args.build || 'buildccf06d10';
const OUT = resolve(args.out || 'docs/uiux/evidence/c4-visual');
const EVIDENCE_LABEL = process.env.UIUX_EVIDENCE_LABEL || args.label || 'before';
mkdirSync(OUT, { recursive: true });
const startedAt = new Date().toISOString();
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const img = (name) => `${OUT}/${EVIDENCE_LABEL}_${name}__${stamp()}.webp`;

const VIEWPORTS = [
  { width: 320, height: 740, mobile: true },
  { width: 360, height: 740, mobile: true },
  { width: 390, height: 844, mobile: true },
  { width: 768, height: 1024, mobile: true },
  { width: 1024, height: 768, mobile: false },
  { width: 1280, height: 800, mobile: false },
  { width: 1440, height: 900, mobile: false },
  { width: 1920, height: 1080, mobile: false },
];
const SHOT_WIDTHS = new Set([320, 390, 1440]);
const SECTION_TARGETS = [
  { id: 'hero', tid: 'hero-observatory', graphic: '[data-testid="hero-observatory"] svg, [data-testid="hero-observatory"]' },
  { id: 'about', tid: 'about-compass', graphic: '[data-testid="about-compass"] svg, [data-testid="about-compass"]' },
  { id: 'experience', tid: 'experience-explorer', graphic: '[data-testid="experience-explorer"] svg, [data-testid="experience-explorer"]' },
  { id: 'skills', tid: 'skills-trace', graphic: '[data-testid="skills-trace"] svg, [data-testid="skills-trace"]' },
  { id: 'vitrine', tid: 'mechanism-diagram', graphic: '[data-testid="mechanism-diagram"] svg, [data-testid="mechanism-diagram"]' },
  { id: 'listen', tid: 'listen-resonance', graphic: '[data-testid="listen-resonance"] svg, [data-testid="listen-resonance"]' },
];
const findings = [];
const addFinding = (id, section, observed, expected, severity, recipe, evidence = []) => findings.push({ id, section, observed, expected, severity, recipe, evidence });
const sig = (v) => JSON.stringify(v).replace(/\d+\.\d{2,}/g, (m) => Number(m).toFixed(2)).slice(0, 5000);

async function visibleGraphic(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return { present: false, visible: false, selector: sel };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const sample = [...el.querySelectorAll('path,circle,line,rect,polyline,polygon,ellipse')].slice(0, 12).map((n) => {
      const s = getComputedStyle(n);
      const nr = n.getBoundingClientRect();
      return { tag: n.tagName, x: +nr.x.toFixed(1), y: +nr.y.toFixed(1), w: +nr.width.toFixed(1), h: +nr.height.toFixed(1), opacity: s.opacity, fill: s.fill, stroke: s.stroke, strokeWidth: s.strokeWidth, transform: s.transform };
    });
    const svgPainted = sample.some((s) => (s.w > 0 || s.h > 0) && Number(s.opacity) > 0 && (s.fill !== 'none' || s.stroke !== 'none'));
    const childVisible = [...el.children].some((c) => { const cr = c.getBoundingClientRect(); const ccs = getComputedStyle(c); return cr.width > 0 && cr.height > 0 && ccs.display !== 'none' && ccs.visibility !== 'hidden' && Number(ccs.opacity) > 0; });
    const isSkillsTrace = el.matches('[data-testid="skills-trace"]') || !!el.closest('[data-testid="skills-trace"]');
    const traceCards = isSkillsTrace ? [...(el.matches('[data-testid="skills-trace"]') ? el : el.closest('[data-testid="skills-trace"]')).querySelectorAll('[data-testid="capability-select"],[data-testid="capability-evidence"]')].some((c) => { const cr = c.getBoundingClientRect(); const ccs = getComputedStyle(c); return cr.width > 20 && cr.height > 20 && ccs.display !== 'none' && ccs.visibility !== 'hidden' && Number(ccs.opacity) > 0; }) : false;
    const cssPainted = (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent') || cs.boxShadow !== 'none' || childVisible || traceCards;
    const painted = svgPainted || cssPainted;
    return { present: true, visible: r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0, bbox: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, opacity: cs.opacity, transform: cs.transform, sample, painted, paintKind: sample.length ? 'svg-shapes' : 'css-text-children' };
  }, selector);
}

async function interact(page, id) {
  if (id === 'hero') {
    const l = page.locator('[data-testid="telemetry-toggle"]').first();
    if (await l.count()) await l.click({ timeout: 3000 }).catch(() => {});
  } else if (id === 'about') {
    const btns = page.locator('[data-testid="compass-dimension"]');
    if (await btns.count() > 1) await btns.nth(1).click({ timeout: 3000 }).catch(() => {});
  } else if (id === 'experience') {
    const scr = page.locator('[data-testid="career-scrubber"]');
    if (await scr.count()) await scr.evaluate((el) => { el.value = String(Math.max(0, Number(el.max || 1))); el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
  } else if (id === 'skills') {
    const sel = page.locator('[data-testid="capability-select"]');
    if (await sel.count()) {
      const opts = await sel.locator('option').evaluateAll((os) => os.map((o) => o.value));
      if (opts[1]) await sel.selectOption(opts[1]).catch(() => {});
    }
  } else if (id === 'vitrine') {
    const b = page.locator('[data-testid="mechanism-inspect"]').first();
    if (await b.count()) await b.click({ timeout: 3000 }).catch(() => {});
  } else if (id === 'listen') {
    const a = page.locator('#listen a, #listen button').first();
    if (await a.count()) await a.focus().catch(() => {});
  }
  await page.waitForTimeout(250);
}

async function pageProbes(page, width) {
  return page.evaluate((width) => {
    const rect = (el) => { const r = el.getBoundingClientRect(); return { x: +r.x.toFixed(1), y: +r.y.toFixed(1), w: +r.width.toFixed(1), h: +r.height.toFixed(1), left: +r.left.toFixed(1), right: +r.right.toFixed(1), top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1) }; };
    const isVis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.display !== 'none' && cs.visibility !== 'hidden' && Number(cs.opacity) > 0; };
    const controls = [...document.querySelectorAll('a,button,input,select,textarea,[role="button"]')].filter((el) => isVis(el) && (() => { const r = el.getBoundingClientRect(); return r.bottom >= 0 && r.top <= innerHeight && r.right >= 0 && r.left <= innerWidth; })()).map((el) => { const rr = rect(el); const name = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('value') || '').trim().slice(0, 80); const isInlineProseLink = el.tagName === 'A' && !el.closest('#hero,#listen,nav,[role="navigation"],[data-testid]') && rr.h >= 16 && name.length > 8; return { tag: el.tagName, name, testid: el.getAttribute('data-testid'), href: el.getAttribute('href'), rect: rr, tooSmall: !isInlineProseLink && (rr.w < 24 || rr.h < 24) }; });
    const clippedText = [...document.querySelectorAll('main *')].filter((el) => {
      const txt = (el.textContent || '').trim(); if (!txt || el.children.length) return false;
      let n = el.parentElement; while (n && n !== document.body) { const cs = getComputedStyle(n); if ((cs.overflow === 'hidden' || cs.overflowX === 'hidden' || cs.overflowY === 'hidden' || cs.overflow === 'clip') && (el.scrollWidth > n.clientWidth + 2 || el.scrollHeight > n.clientHeight + 2)) return true; n = n.parentElement; }
      return false;
    }).map((el) => ({ text: el.textContent.trim().slice(0, 100), tag: el.tagName, rect: rect(el) }));
    const cards = [...document.querySelectorAll('#vitrine article, #vitrine [class*="plate"], #vitrine [data-mechanism]')].filter(isVis).map((el) => ({ name: (el.getAttribute('data-mechanism') || el.textContent || '').trim().slice(0, 50), rect: rect(el), within: rect(el).left >= -1 && rect(el).right <= width + 1 }));
    const ctas = [...document.querySelectorAll('#hero a,#hero button,#listen a,#listen button')].filter(isVis);
    const fixed = [...document.querySelectorAll('body *')].filter((el) => { const cs = getComputedStyle(el); return (cs.position === 'fixed' || cs.position === 'sticky') && isVis(el); });
    const overlap = [];
    for (const f of fixed) for (const c of ctas) { if (f.contains(c) || c.contains(f)) continue; const fr = f.getBoundingClientRect(), cr = c.getBoundingClientRect(); const area = Math.max(0, Math.min(fr.right, cr.right) - Math.max(fr.left, cr.left)) * Math.max(0, Math.min(fr.bottom, cr.bottom) - Math.max(fr.top, cr.top)); if (area > 1) { const cx = cr.left + cr.width / 2, cy = cr.top + cr.height / 2; const top = document.elementFromPoint(cx, cy); const fcs = getComputedStyle(f); const obstructsCenter = top === f || Boolean(top && f.contains(top)); const opaqueOrHit = fcs.pointerEvents !== 'none' && Number(fcs.opacity) > 0.05 && fcs.visibility !== 'hidden' && fcs.display !== 'none'; if (obstructsCenter && opaqueOrHit) overlap.push({ fixed: f.tagName + '.' + String(f.className).slice(0,40), cta: (c.textContent || c.getAttribute('aria-label') || '').trim().slice(0,50), area: Math.round(area), centerTop: top ? top.tagName + '.' + String(top.className).slice(0,40) : null }); } }
    return { scroll: { clientWidth: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth, overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1 }, controls, smallControls: controls.filter((c) => c.tooSmall), clippedText, vitrineCards: cards, ctaOverlaps: overlap, canvases: document.querySelectorAll('canvas').length, webglScripts: [...document.scripts].filter((s) => /three|webgl/i.test(s.src + s.textContent)).length };
  }, width);
}

async function saveWebpFromScreenshot(screenshotPromise, webpPath, quality = 64) {
  const tmp = webpPath.replace(/\.webp$/, '.tmp.png');
  await screenshotPromise(tmp);
  await sharp(tmp).webp({ quality }).toFile(webpPath);
  try { await import('node:fs').then(({ unlinkSync }) => unlinkSync(tmp)); } catch {}
  return webpPath;
}

async function captureElement(page, selector, name) {
  const loc = page.locator(selector).first();
  if (!await loc.count()) return null;
  const p = img(name);
  try {
    await saveWebpFromScreenshot((tmp) => loc.screenshot({ path: tmp, timeout: 8000 }), p, 64);
  } catch {
    await saveWebpFromScreenshot((tmp) => page.screenshot({ path: tmp, fullPage: false }), p, 55);
  }
  return p;
}

async function auditAxe(page, label) {
  await page.addScriptTag({ path: axeSource });
  return page.evaluate(async (label) => {
    const r = await window.axe.run(document, { resultTypes: ['violations'] });
    return { label, violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, description: v.description, nodes: v.nodes.slice(0, 8).map((n) => ({ target: n.target, failureSummary: n.failureSummary })) })), seriousCritical: r.violations.filter((v) => ['serious','critical'].includes(v.impact)).length };
  }, label);
}

async function mechanismSequence(page) {
  await page.locator('#vitrine').scrollIntoViewIfNeeded();
  const diagrams = page.locator('[data-testid="mechanism-diagram"]');
  const rows = [];
  const count = await page.locator('[data-testid="mechanism-inspect"]').count();
  for (let i = 0; i < count; i++) {
    const btn = page.locator('[data-testid="mechanism-inspect"]').nth(i);
    await btn.scrollIntoViewIfNeeded();
    const preStyle = await btn.evaluate((el) => { const card = el.closest('article,li,div'); const cs = getComputedStyle(card || el); return { cls: (card || el).className, transform: cs.transform, opacity: cs.opacity, outline: cs.outline, background: cs.backgroundColor, border: cs.borderColor }; });
    await btn.click(); await page.waitForTimeout(200);
    const post = await diagrams.nth(i).evaluate((el) => ({ data: el.getAttribute('data-mechanism'), html: el.querySelector('svg')?.innerHTML, detail: el.closest('li,article,div')?.querySelector('[data-testid="mechanism-detail"]')?.textContent?.trim().slice(0, 300) || '', activeStage: el.closest('li,article,div')?.querySelector('[aria-pressed="true"]')?.textContent?.trim() || '', bbox: (() => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; })() }));
    const postStyle = await btn.evaluate((el) => { const card = el.closest('article,li,div'); const cs = getComputedStyle(card || el); return { cls: (card || el).className, transform: cs.transform, opacity: cs.opacity, outline: cs.outline, background: cs.backgroundColor, border: cs.borderColor }; });
    rows.push({ index: i, label: await btn.innerText().catch(() => ''), preStyle, postStyle, data: post.data, activeStage: post.activeStage, detailPresent: post.detail.length > 20, svgPresent: (post.html || '').length > 20, bbox: post.bbox });
  }
  return { count, rows };
}

async function noJsProbe(width, height) {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width, height }, javaScriptEnabled: false, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const failed = [];
  page.on('requestfailed', (r) => failed.push({ url: r.url(), error: r.failure()?.errorText, expectedBecauseJsBlocked: r.resourceType() === 'script' }));
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);
  const result = await page.evaluate((targets) => Object.fromEntries(targets.map((t) => {
    const el = document.querySelector(`[data-testid="${t.tid}"]`) || document.getElementById(t.id);
    if (!el) return [t.id, { present: false, visible: false }];
    const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
    const nativeControls = [...(document.getElementById(t.id)?.querySelectorAll('button,input,select,summary,a[href]') || [])].filter((n) => { const nr = n.getBoundingClientRect(); const ns = getComputedStyle(n); return nr.width > 0 && nr.height > 0 && ns.visibility !== 'hidden'; }).map((n) => n.tagName + ':' + (n.textContent || n.getAttribute('aria-label') || n.getAttribute('value') || '').trim().slice(0,50));
    return [t.id, { present: true, visible: r.width > 1 && r.height > 1 && cs.display !== 'none' && cs.visibility !== 'hidden', textLen: (document.getElementById(t.id)?.innerText || '').trim().length, controls: nativeControls }];
  })), SECTION_TARGETS);
  const nojsShot = img(`nojs_${width}x${height}_fold`);
  await saveWebpFromScreenshot((tmp) => page.screenshot({ path: tmp, fullPage: false }), nojsShot, 58);
  await ctx.close(); await browser.close();
  return { width, height, sections: result, failedRequests: failed.slice(0, 20) };
}

async function delayedHydrationProbe() {
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 320, height: 740 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.route(/\.(js|mjs)(\?|$)/, (route) => setTimeout(() => route.continue(), 500));
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(500);
  const shot = img('delayedhydration_320_500ms_hero');
  await saveWebpFromScreenshot((tmp) => page.screenshot({ path: tmp, fullPage: false }), shot, 60);
  const hero = await page.locator('#hero').evaluate((el) => ({ text: el.innerText.trim().slice(0, 1500), hiddenIntro: [...el.querySelectorAll('*')].filter((n) => (n.textContent||'').trim() && getComputedStyle(n).visibility === 'hidden').length }));
  await ctx.close(); await browser.close();
  return { shot, heroCopyComplete: /AI|delivery|evidence|experience/i.test(hero.text) && hero.text.length > 120, ...hero };
}

async function reducedMotionProbe() {
  const out = [];
  for (const reduced of [false, true]) {
    const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
    await page.locator('#vitrine').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
    const data = await page.evaluate(() => ({
      mode: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'reduce' : 'normal',
      canvases: document.querySelectorAll('canvas').length,
      scores: [...document.body.innerText.matchAll(/\b\d+\s*%|score\s*:?\s*\d+/gi)].map((m) => m[0]),
      graphics: [...document.querySelectorAll('[data-testid="mechanism-diagram"] path,[data-testid="mechanism-diagram"] line,[data-testid="mechanism-diagram"] circle')].slice(0,12).map((n) => { const cs = getComputedStyle(n); const r = n.getBoundingClientRect(); return { tag: n.tagName, w: +r.width.toFixed(1), h: +r.height.toFixed(1), opacity: cs.opacity, fill: cs.fill, stroke: cs.stroke, transform: cs.transform }; })
    }));
    out.push(data); await ctx.close(); await browser.close();
  }
  return out;
}

const report = { agent_role: 'independent adversarial visual/a11y Test Author B', task_id: 'C4-VISUAL', status: 'running', base_url: BASE, build: BUILD, startedAt, findings, inventory: {}, matrix: [], axe: [], browseravailability: {}, consoleerrors: [], criticalrequests: [], screenshots: [], nojs: [], delayedHydration: null, reducedMotion: null, crossengineSmoke: [], matrixcounts: {}, verdict: null };

const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-dev-shm-usage'] });
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const consoleErrors = [], failedRequests = [];
  page.on('console', (m) => { if (['error','warning'].includes(m.type())) consoleErrors.push({ type: m.type(), text: m.text().slice(0, 500) }); });
  page.on('pageerror', (e) => consoleErrors.push({ type: 'pageerror', text: String(e).slice(0, 500) }));
  page.on('requestfailed', (r) => failedRequests.push({ url: r.url(), type: r.resourceType(), error: r.failure()?.errorText }));
  await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(500);
  const row = { viewport: `${vp.width}x${vp.height}`, sections: {}, interactions: {}, probes: null, consoleErrors, failedRequests };
  for (const target of SECTION_TARGETS) {
    await page.locator('#' + target.id).scrollIntoViewIfNeeded(); await page.waitForTimeout(250);
    const before = await visibleGraphic(page, target.graphic);
    const beforeState = await page.locator('#' + target.id).evaluate((el) => ({ text: el.innerText.slice(0,500), htmlSig: el.innerHTML.slice(0,1500) }));
    let shot = null;
    if (SHOT_WIDTHS.has(vp.width)) {
      shot = await captureElement(page, `[data-testid="${target.tid}"]`, `${target.id}_${vp.width}x${vp.height}_before_${target.tid}`);
      if (shot) report.screenshots.push(shot);
    }
    await interact(page, target.id);
    const after = await visibleGraphic(page, target.graphic);
    const afterState = await page.locator('#' + target.id).evaluate((el) => ({ text: el.innerText.slice(0,500), htmlSig: el.innerHTML.slice(0,1500) }));
    row.sections[target.id] = { before, after, beforeStateSig: sig(beforeState), afterStateSig: sig(afterState), changedByInteraction: sig(beforeState) !== sig(afterState) };
    if (!before.visible || !before.painted || !after.visible || !after.painted) addFinding(`C4-GRAPHIC-${vp.width}-${target.id}`, target.id, `graphic before/after visible=${before.visible}/${after.visible} painted=${before.painted}/${after.painted}`, 'section instrument graphic has measurable painted bbox before and after interaction', 'high', `Run node scripts/uiux/adversarial-visual.mjs; viewport ${vp.width}x${vp.height}; inspect ${target.graphic}`, shot ? [shot] : []);
  }
  row.probes = await pageProbes(page, vp.width);
  if (row.probes.scroll.overflowX) addFinding(`C4-OVERFLOW-${vp.width}`, 'global', `document scrollWidth ${row.probes.scroll.scrollWidth} > clientWidth ${row.probes.scroll.clientWidth}`, 'no page-level horizontal overflow', 'medium', `Open ${BASE} at ${vp.width}x${vp.height}`, []);
  if (row.probes.smallControls.length) addFinding(`C4-TARGET-${vp.width}`, 'global', JSON.stringify(row.probes.smallControls.slice(0,6)), 'named controls are at least 24 CSS px in each dimension', 'medium', `Open ${BASE} at ${vp.width}x${vp.height} and measure controls`, []);
  if (vp.width <= 390) {
    const out = row.probes.vitrineCards.filter((c) => !c.within);
    if (out.length) addFinding(`C4-VITRINE-CARDS-${vp.width}`, 'vitrine', JSON.stringify(out.slice(0,6)), 'all six Vitrine cards mobile within viewport', 'high', `Scroll #vitrine at ${vp.width}x${vp.height}`, []);
  }
  if (row.probes.clippedText.length) addFinding(`C4-CLIPPED-TEXT-${vp.width}`, 'global', JSON.stringify(row.probes.clippedText.slice(0,6)), 'critical text is not clipped by hidden/clip overflow ancestors', 'medium', `Inspect hidden-overflow ancestors at ${vp.width}x${vp.height}`, []);
  if (row.probes.ctaOverlaps.length) addFinding(`C4-CTA-COVER-${vp.width}`, 'global', JSON.stringify(row.probes.ctaOverlaps), 'nav/dock does not cover hero/listen CTAs', 'high', `Measure fixed/sticky overlap at ${vp.width}x${vp.height}`, []);
  if ([320,1440].includes(vp.width)) report.axe.push(await auditAxe(page, `${vp.width}x${vp.height}-afterstate`));
  if (vp.width === 1440) report.inventory.mechanisms = await mechanismSequence(page);
  report.matrix.push(row); report.consoleerrors.push(...consoleErrors.map((e) => ({ viewport: row.viewport, ...e }))); report.criticalrequests.push(...failedRequests.map((e) => ({ viewport: row.viewport, ...e })));
  await ctx.close();
  console.log(`[c4] chromium ${vp.width}x${vp.height} done findings=${findings.length}`);
}
await browser.close();

for (const a of report.axe) {
  const serious = a.violations.filter((v) => ['serious','critical'].includes(v.impact));
  if (serious.length) addFinding(`C4-AXE-${a.label}`, 'global', JSON.stringify(serious), '0 serious/critical axe-core violations after state interaction', 'high', `axe.run(document) at ${a.label}`, []);
}
if (report.inventory.mechanisms) {
  const bad = report.inventory.mechanisms.rows.filter((r) => !r.svgPresent || !r.detailPresent || r.bbox.w < 20 || r.bbox.h < 20);
  if (report.inventory.mechanisms.count !== 6 || bad.length) addFinding('C4-MECHANISM-STATES', 'vitrine', JSON.stringify({ count: report.inventory.mechanisms.count, bad }), 'all 6 mechanism plates expose their own SVG and detail when inspected', 'high', 'Click every [data-testid="mechanism-inspect"] at 1440 and inspect nth plate/diagram/detail', []);
}
report.nojs.push(await noJsProbe(320,740), await noJsProbe(1440,900));
for (const n of report.nojs) {
  const hidden = Object.entries(n.sections).filter(([, v]) => !v.present || !v.visible || v.textLen < 40);
  if (hidden.length) addFinding(`C4-NOJS-${n.width}`, 'global', JSON.stringify(hidden), 'JS-blocked route beforeload has core content and graphics visible', 'high', `Disable JS and open ${BASE} at ${n.width}x${n.height}`, []);
}
report.delayedHydration = await delayedHydrationProbe();
if (!report.delayedHydration.heroCopyComplete || report.delayedHydration.hiddenIntro) addFinding('C4-DELAYED-HYDRATION', 'hero', JSON.stringify(report.delayedHydration), 'first 500ms delayed hydration shows complete hero copy with no hidden intro text', 'medium', 'Delay JS by 500ms then capture first fold', [report.delayedHydration.shot]);
report.reducedMotion = await reducedMotionProbe();
if (report.reducedMotion.some((m) => m.canvases > 0) || sig(report.reducedMotion[0].scores) !== sig(report.reducedMotion[1].scores) || report.reducedMotion.some((m) => !m.graphics.some((g) => (g.w > 0 || g.h > 0) && Number(g.opacity) > 0 && (g.fill !== 'none' || g.stroke !== 'none')))) addFinding('C4-REDUCED-MOTION', 'vitrine', JSON.stringify(report.reducedMotion), 'normal/reduced motion keep diagram strokes/opacity visible, no score changes, no WebGL/canvas', 'medium', 'Compare reducedMotion no-preference/reduce while diagram visible', []);

for (const [name, type] of [['firefox', firefox], ['webkit', webkit]]) {
  const executablePath = type.executablePath();
  const available = !!executablePath && existsSync(executablePath);
  report.browseravailability[name] = { executablePath, available, smokeRun: false };
  if (available) {
    const b = await type.launch();
    for (const size of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
      const ctx = await b.newContext({ viewport: size }); const p = await ctx.newPage();
      await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 }); await p.waitForTimeout(600);
      const smoke = await p.evaluate((targets) => Object.fromEntries(targets.map((t) => { const el = document.querySelector(`[data-testid="${t.tid}"]`) || document.getElementById(t.id); if (!el) return [t.id, false]; const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return [t.id, r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none']; })), SECTION_TARGETS);
      report.crossengineSmoke.push({ browser: name, viewport: `${size.width}x${size.height}`, smoke });
      await ctx.close();
    }
    await b.close(); report.browseravailability[name].smokeRun = true;
  }
}
report.browseravailability.chromium = { available: true, smokeRun: true };

report.matrixcounts = { chromiumViewports: VIEWPORTS.length, sectionsPerViewport: SECTION_TARGETS.length, sectionBeforeAfterChecks: VIEWPORTS.length * SECTION_TARGETS.length, capturedWebp: report.screenshots.length + report.nojs.length + 1, axeAudits: report.axe.length, noJsViewports: report.nojs.length, crossengineSmokes: report.crossengineSmoke.length, findings: findings.length };
report.status = 'done';
const reportPath = `${OUT}/${EVIDENCE_LABEL}.json`;
report.verdict = { result: findings.length ? 'fail' : 'pass', evidence: [reportPath, ...report.screenshots.slice(0, 18)], notes: 'Evidence is measured by script against production. Images are compact element/fold WebP captures for independent visual review; this report does not certify image aesthetics without human inspection. Desktop rail offscreen was treated as intentional only when document-level overflow and mobile card containment remained reachable.' };
writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify({ status: report.status, result: report.verdict.result, findings: findings.length, out: reportPath, matrixcounts: report.matrixcounts }, null, 2));
