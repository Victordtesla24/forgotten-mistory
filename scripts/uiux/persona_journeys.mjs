#!/usr/bin/env node
/**
 * Persona journeys J1–J8 (§7) executed against production. Every control on the
 * path is exercised, timed and screenshotted; verdicts are measured, not assumed.
 *
 *   node scripts/uiux/persona_journeys.mjs --run-id <id> [--base-url <url>] [--label pre|post]
 */
import { chromium } from 'playwright';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => { if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : 'true']); return acc; }, []));
const BASE = (args['base-url'] || 'https://forgotten-mistory.web.app').replace(/\/$/, '');
const RUN_ID = args['run-id'];
const LABEL = args.label || 'pre';
if (!RUN_ID) throw new Error('--run-id required');
const OUT = resolve('docs/uiux/evidence', RUN_ID);
mkdirSync(OUT, { recursive: true });
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const shot = (page, j, step) => page.screenshot({ path: `${OUT}/${j}__${page.viewportSize().width}x${page.viewportSize().height}__${step}__${LABEL}__${stamp()}.png` });

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const results = [];
const record = (id, persona, viewport, steps, pass, notes) => { results.push({ id, persona, viewport, steps, pass, notes }); console.log(`[${id}] ${pass ? 'PASS' : 'FAIL'} — ${notes}`); };
const timed = async (steps, name, fn) => { const t = Date.now(); const r = await fn(); steps.push({ name, ms: Date.now() - t, result: r }); return r; };

async function newPage(opts) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 300)));
  return { ctx, page, errors };
}

// ── J1: P1 hiring executive, 390×844, cold load → role, seniority, 3 proof points → contact
{
  const steps = []; const { ctx, page, errors } = await newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const t0 = Date.now();
  await timed(steps, 'cold load', () => page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }));
  await page.waitForTimeout(800);
  const hero = await timed(steps, 'read hero', () => page.evaluate(() => {
    const h = document.getElementById('hero');
    const text = h?.innerText || '';
    const figures = [...h.querySelectorAll('[class*=ledger] li, [class*=proof] li, [class*=figure]')].map((li) => li.innerText.trim().slice(0, 160));
    const ctas = [...h.querySelectorAll('a,button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0; }).map((e) => ({ text: (e.getAttribute('aria-label') || e.innerText).trim().slice(0, 60), href: e.getAttribute('href'), top: Math.round(e.getBoundingClientRect().top), inFold: e.getBoundingClientRect().top < innerHeight }));
    return { h1: document.querySelector('h1')?.innerText, hasRole: /Scrum Master|Project Manager/i.test(text), hasSeniority: /Scrum Master|Architect|Manager/i.test(text), figures, ctas, textLen: text.length };
  }));
  await shot(page, 'J1', 'fold');
  // scroll count to first visible contact affordance
  let scrolls = 0; let contact = null;
  for (; scrolls <= 6; scrolls++) {
    contact = await page.evaluate(() => {
      const els = [...document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"], a[href*="linkedin"], a[href="#listen"], button, a')].filter((e) => /contact|talk|listen|email|mail|call|book|coffee|linkedin/i.test((e.getAttribute('aria-label') || e.innerText || e.getAttribute('href') || '')));
      const vis = els.map((e) => ({ e, r: e.getBoundingClientRect() })).filter(({ r }) => r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight);
      return vis.length ? { text: (vis[0].e.getAttribute('aria-label') || vis[0].e.innerText).trim().slice(0, 60), href: vis[0].e.getAttribute('href'), top: Math.round(vis[0].r.top) } : null;
    });
    if (contact) break;
    await page.mouse.wheel(0, 700); await page.waitForTimeout(400);
  }
  steps.push({ name: 'scrolls to visible contact/CTA', scrolls, contact });
  await shot(page, 'J1', `contact-visible-after-${scrolls}-scrolls`);
  // Overlay covering CTA?
  const overlay = await page.evaluate(() => {
    const ctas = [...document.querySelectorAll('#hero a, #hero button')].filter((e) => e.getBoundingClientRect().width > 0);
    return ctas.map((c) => { const r = c.getBoundingClientRect(); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { cta: (c.getAttribute('aria-label') || c.innerText).trim().slice(0, 40), covered: !!top && !c.contains(top) && !top.contains(c), by: top ? top.tagName + '.' + (top.className || '').toString().slice(0, 30) : null }; });
  });
  steps.push({ name: 'hero CTA hit-test at midpoint (after scroll back)', overlay });
  // sources under figures
  const sources = await page.evaluate(() => {
    const h = document.getElementById('hero');
    const items = [...h.querySelectorAll('li')];
    return items.map((li) => ({ text: li.innerText.trim().slice(0, 120), hasSource: /source|CV|resume|GitHub|LinkedIn|ATO|measured|self-reported|\bp\.|page/i.test(li.innerText) }));
  });
  steps.push({ name: 'hero figures carry printed source', sources });
  const elapsed = Date.now() - t0;
  const pass = elapsed <= 30000 && scrolls <= 2 && !!contact && hero.hasRole && sources.filter((s) => s.hasSource).length >= 3 && overlay.every((o) => !o.covered);
  record('J1', 'P1', '390x844', steps, pass, `elapsed=${elapsed}ms scrolls=${scrolls} contact=${contact?.text ?? 'none'} figuresWithSource=${sources.filter((s) => s.hasSource).length}/${sources.length} consoleErrors=${errors.length}`);
  results.at(-1).consoleErrors = errors; await ctx.close();
}

// ── J2: P2 recruiter, 1440×900 → CV download in ≤2 interactions → PDF 200 + MD5 matches footer fingerprint
{
  const steps = []; const { ctx, page, errors } = await newPage({ viewport: { width: 1440, height: 900 } });
  await timed(steps, 'load', () => page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }));
  await page.waitForTimeout(800);
  const cvLinks = await page.evaluate(() => [...document.querySelectorAll('a[href*=".pdf"], a[download]')].map((a) => ({ href: a.getAttribute('href'), text: (a.getAttribute('aria-label') || a.innerText).trim().slice(0, 60), visible: (() => { const r = a.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight; })() })));
  steps.push({ name: 'CV links discoverable on first fold', cvLinks });
  await shot(page, 'J2', 'fold');
  const href = cvLinks.find((l) => l.visible)?.href || cvLinks[0]?.href;
  let pdf = null;
  if (href) {
    const url = new URL(href, BASE).toString();
    const res = await timed(steps, 'GET CV', async () => { const r = await fetch(url); const buf = Buffer.from(await r.arrayBuffer()); return { status: r.status, contentType: r.headers.get('content-type'), bytes: buf.length, md5: createHash('md5').update(buf).digest('hex'), url }; });
    pdf = res;
  }
  const fingerprint = await page.evaluate(() => { const s = document.getElementById('skills'); const m = s?.innerText.match(/\b[0-9a-f]{8}\b/); const full = s?.innerText.match(/\b[0-9a-f]{32}\b/); return { short: m?.[0] ?? null, full: full?.[0] ?? null, bytes: s?.innerText.match(/([\d,]+)\s*bytes/)?.[1] ?? null }; });
  steps.push({ name: 'footer fingerprint (Skills)', fingerprint });
  await page.evaluate(() => document.getElementById('skills')?.scrollIntoView()); await page.waitForTimeout(600); await shot(page, 'J2', 'skills-fingerprint');
  const md5ok = pdf && fingerprint.short && pdf.md5.startsWith(fingerprint.short);
  const interactions = href ? (cvLinks.find((l) => l.visible) ? 1 : 2) : Infinity;
  const pass = !!pdf && pdf.status === 200 && /application\/pdf/.test(pdf.contentType || '') && md5ok && interactions <= 2;
  record('J2', 'P2', '1440x900', steps, pass, `cv=${href} status=${pdf?.status} ct=${pdf?.contentType} md5=${pdf?.md5?.slice(0, 8)} footer=${fingerprint.short} match=${md5ok} interactions=${interactions}`);
  results.at(-1).consoleErrors = errors; await ctx.close();
}

// ── J3: P3 client, 1280×800 → Vitrine → open a repo → return → Listen → contact
{
  const steps = []; const { ctx, page, errors } = await newPage({ viewport: { width: 1280, height: 800 } });
  await timed(steps, 'load', () => page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }));
  await page.waitForTimeout(800);
  await page.evaluate(() => document.getElementById('vitrine')?.scrollIntoView()); await page.waitForTimeout(900);
  await shot(page, 'J3', 'vitrine');
  const repoLinks = await page.evaluate(() => [...document.querySelectorAll('#vitrine a[href^="http"]')].map((a) => ({ href: a.href, text: a.innerText.trim().slice(0, 60), target: a.target, rel: a.rel })));
  steps.push({ name: 'vitrine external links', repoLinks });
  const statuses = [];
  for (const l of repoLinks.slice(0, 12)) { try { const r = await fetch(l.href, { method: 'GET', redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 uiux-scout' } }); statuses.push({ href: l.href, status: r.status }); } catch (e) { statuses.push({ href: l.href, status: 'ERR ' + e.message }); } }
  steps.push({ name: 'repo links resolve (HTTP)', statuses });
  const scrollBefore = await page.evaluate(() => scrollY);
  const first = repoLinks[0];
  let returned = null;
  if (first) {
    const popupP = page.waitForEvent('popup', { timeout: 4000 }).catch(() => null);
    await page.click(`#vitrine a[href="${first.href}"]`, { timeout: 5000 }).catch(async () => { await page.evaluate((h) => document.querySelector(`#vitrine a[href="${h}"]`)?.click(), first.href); });
    const popup = await popupP;
    if (popup) { await popup.waitForLoadState('domcontentloaded').catch(() => {}); await popup.close(); returned = { via: 'popup', scrollPreserved: (await page.evaluate(() => scrollY)) === scrollBefore }; }
    else { await page.waitForLoadState('domcontentloaded').catch(() => {}); await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {}); await page.waitForTimeout(800); const y = await page.evaluate(() => scrollY); returned = { via: 'same-tab+back', scrollPreserved: Math.abs(y - scrollBefore) < 200, before: scrollBefore, after: y }; }
  }
  steps.push({ name: 'open repo and return', returned });
  await shot(page, 'J3', 'returned');
  await page.evaluate(() => document.getElementById('listen')?.scrollIntoView()); await page.waitForTimeout(900);
  const listen = await page.evaluate(() => { const s = document.getElementById('listen'); return { ctas: [...s.querySelectorAll('a,button')].map((e) => ({ text: (e.getAttribute('aria-label') || e.innerText).trim().slice(0, 60), href: e.getAttribute('href') })), italic: [...s.querySelectorAll('*')].filter((e) => getComputedStyle(e).fontStyle === 'italic' && e.children.length === 0).map((e) => e.innerText.slice(0, 80)) }; });
  steps.push({ name: 'listen CTAs', listen });
  await shot(page, 'J3', 'listen');
  const pass = repoLinks.length > 0 && statuses.every((s) => s.status === 200) && !!returned?.scrollPreserved && listen.ctas.length > 0;
  record('J3', 'P3', '1280x800', steps, pass, `repoLinks=${repoLinks.length} non200=${statuses.filter((s) => s.status !== 200).length} return=${JSON.stringify(returned)} listenCTAs=${listen.ctas.length}`);
  results.at(-1).consoleErrors = errors; await ctx.close();
}

// ── J4: P4 keyboard-only 1280×800 → skip link → every section → MiniVicBot open → type → Escape → focus restored
{
  const steps = []; const { ctx, page, errors } = await newPage({ viewport: { width: 1280, height: 800 } });
  await timed(steps, 'load', () => page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }));
  await page.waitForTimeout(800);
  await page.keyboard.press('Tab');
  const first = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { tag: a.tagName, text: a.innerText?.trim().slice(0, 60), href: a.getAttribute('href'), outline: cs.outlineStyle + ' ' + cs.outlineWidth + ' ' + cs.outlineColor, boxShadow: cs.boxShadow, visible: a.getBoundingClientRect().width > 0 }; });
  steps.push({ name: 'first Tab = skip link?', first });
  await shot(page, 'J4', 'skip-link-focus');
  await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  const afterSkip = await page.evaluate(() => ({ active: document.activeElement.tagName + '#' + document.activeElement.id, hash: location.hash, scrollY }));
  steps.push({ name: 'after skip', afterSkip });
  // traverse up to 120 tab stops, record names/focus visibility/section
  const stops = []; let trapped = false; let lastKey = '';
  for (let i = 0; i < 120; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return { body: true }; const cs = getComputedStyle(a); const r = a.getBoundingClientRect(); const sec = a.closest('section, header, footer, nav, [id]'); const name = a.getAttribute('aria-label') || a.getAttribute('aria-labelledby') || a.getAttribute('title') || a.innerText?.trim() || a.querySelector('img')?.alt || ''; return { tag: a.tagName, name: name.slice(0, 50), section: sec?.id || sec?.tagName, focusVisible: a.matches(':focus-visible'), outline: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, boxShadow: cs.boxShadow !== 'none', onscreen: r.top >= -2 && r.bottom <= innerHeight + 2, w: Math.round(r.width), h: Math.round(r.height) }; });
    const key = JSON.stringify([s.tag, s.name, s.section]);
    if (key === lastKey && !s.body) { trapped = true; break; }
    lastKey = key; stops.push(s);
    if (s.body && i > 10) break;
  }
  steps.push({ name: 'tab traversal', count: stops.length, trapped, unnamed: stops.filter((s) => !s.body && !s.name), noFocusIndicator: stops.filter((s) => !s.body && !s.outline && !s.boxShadow).map((s) => s.name || s.tag), sectionsReached: [...new Set(stops.map((s) => s.section))] });
  // Open MiniVicBot via keyboard: focus launcher
  const launcher = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((b) => /minivic|chat|ask|talk/i.test((b.getAttribute('aria-label') || b.innerText || '') + ' ' + b.className)); if (!b) return null; b.focus(); return { name: b.getAttribute('aria-label') || b.innerText.trim(), cls: b.className.toString().slice(0, 60) }; });
  steps.push({ name: 'launcher located', launcher });
  if (launcher) {
    await page.keyboard.press('Enter'); await page.waitForTimeout(1200);
    const dialog = await page.evaluate(() => { const d = document.querySelector('[role=dialog], [aria-modal=true]'); const a = document.activeElement; return { dialogPresent: !!d, dialogLabel: d?.getAttribute('aria-label') || d?.getAttribute('aria-labelledby'), focusInside: d ? d.contains(a) : false, active: a.tagName + '.' + (a.className || '').toString().slice(0, 40), liveRegion: !!document.querySelector('[aria-live], [role=log], [role=status]') }; });
    steps.push({ name: 'dialog opened (focus moved inside?)', dialog });
    await shot(page, 'J4', 'minivic-open');
    const input = await page.$('textarea, input[type=text]:not([hidden])');
    if (input) { await input.focus(); await page.keyboard.type('Hello'); }
    steps.push({ name: 'typed into input', typed: !!input });
    await page.keyboard.press('Escape'); await page.waitForTimeout(800);
    const afterEsc = await page.evaluate(() => { const d = document.querySelector('[role=dialog], [aria-modal=true]'); const a = document.activeElement; return { dialogStillOpen: !!d && d.getBoundingClientRect().width > 0, active: a.tagName + ' ' + (a.getAttribute('aria-label') || a.innerText?.trim().slice(0, 40)) }; });
    steps.push({ name: 'after Escape (focus restored to launcher?)', afterEsc });
    await shot(page, 'J4', 'after-escape');
    const pass = !trapped && stops.filter((s) => !s.body && !s.name).length === 0 && dialog.dialogPresent && dialog.focusInside && !afterEsc.dialogStillOpen && /minivic|chat|ask|talk/i.test(afterEsc.active);
    record('J4', 'P4', '1280x800', steps, pass, `trapped=${trapped} unnamed=${stops.filter((s) => !s.body && !s.name).length} noIndicator=${stops.filter((s) => !s.body && !s.outline && !s.boxShadow).length} dialog=${dialog.dialogPresent} focusInside=${dialog.focusInside} escClosed=${!afterEsc.dialogStillOpen} focusBack=${afterEsc.active}`);
  } else record('J4', 'P4', '1280x800', steps, false, 'MiniVicBot launcher not found by name');
  results.at(-1).consoleErrors = errors; await ctx.close();
}

// ── J5: screen-reader outline + 200%/400% zoom + reduced motion
{
  const steps = [];
  const { ctx, page, errors } = await newPage({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' }); await page.waitForTimeout(2500);
  await page.evaluate(async () => { for (const id of ['about', 'experience', 'skills', 'vitrine', 'listen']) { document.getElementById(id)?.scrollIntoView(); await new Promise((r) => setTimeout(r, 700)); } window.scrollTo(0, 0); });
  await page.waitForTimeout(1000);
  const outline = await page.evaluate(() => ({ h1: document.querySelectorAll('h1').length, headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => h.tagName + ' ' + h.innerText.trim().slice(0, 60)), landmarks: [...document.querySelectorAll('header,nav,main,footer,aside,[role]')].map((e) => e.tagName + (e.getAttribute('role') ? '[' + e.getAttribute('role') + ']' : '') + (e.getAttribute('aria-label') ? '(' + e.getAttribute('aria-label') + ')' : '')), canvasesUnderReducedMotion: document.querySelectorAll('canvas').length, imgsNoAlt: [...document.querySelectorAll('img')].filter((i) => !i.hasAttribute('alt')).length, lang: document.documentElement.lang }));
  steps.push({ name: 'rotor outline + landmarks (reduced motion)', outline });
  await shot(page, 'J5', 'reduced-motion');
  await ctx.close();
  // 200% zoom ≈ 640px wide viewport at 1280 css; 400% ≈ 320 css px
  for (const [zoom, w] of [[200, 640], [400, 320]]) {
    const c = await browser.newContext({ viewport: { width: w, height: 800 } }); const p = await c.newPage();
    await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(1000);
    const r = await p.evaluate(() => ({ overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1, scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth, clippedHero: !!document.getElementById('hero') && [...document.querySelectorAll('#hero *')].some((n) => n.getBoundingClientRect().right > document.documentElement.clientWidth + 1) }));
    steps.push({ name: `reflow at ${zoom}% (viewport ${w}px)`, ...r });
    await p.screenshot({ path: `${OUT}/J5__${w}x800__zoom${zoom}__${LABEL}__${stamp()}.png`, fullPage: false });
    await c.close();
  }
  const reflow = steps.filter((s) => s.name.startsWith('reflow'));
  const pass = outline.h1 === 1 && outline.canvasesUnderReducedMotion === 0 && reflow.every((r) => !r.overflowX);
  record('J5', 'P4', '1280x800/640/320', steps, pass, `h1=${outline.h1} canvasesReducedMotion=${outline.canvasesUnderReducedMotion} overflow200=${reflow[0].overflowX} overflow400=${reflow[1].overflowX} landmarks=${outline.landmarks.length}`);
  results.at(-1).consoleErrors = errors;
}

// ── J6: JS disabled — Hero complete, anchors work
{
  const steps = []; const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false }); const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(800);
  const hero = await page.evaluate(() => { const h = document.getElementById('hero'); const text = h?.innerText || ''; return { present: !!h, h1: document.querySelector('h1')?.innerText, textLen: text.length, figures: h ? h.querySelectorAll('li').length : 0, ctas: h ? [...h.querySelectorAll('a')].map((a) => a.getAttribute('href')) : [], anchorsResolve: [...document.querySelectorAll('a[href^="#"]')].filter((a) => a.getAttribute('href').length > 1).map((a) => ({ href: a.getAttribute('href'), ok: !!document.querySelector(a.getAttribute('href')) })), sectionsPresent: ['about', 'experience', 'skills', 'vitrine', 'listen'].map((id) => ({ id, present: !!document.getElementById(id), textLen: document.getElementById(id)?.innerText.length || 0 })), noscript: document.querySelectorAll('noscript').length }; });
  steps.push({ name: 'no-JS hero', hero });
  await shot(page, 'J6', 'nojs-fold');
  await page.screenshot({ path: `${OUT}/J6__1280x800__nojs-full__${LABEL}__${stamp()}.png`, fullPage: true });
  const pass = hero.present && !!hero.h1 && hero.textLen > 100 && hero.anchorsResolve.every((a) => a.ok);
  record('J6', 'all', '1280x800 (JS off)', steps, pass, `hero=${hero.present} h1=${!!hero.h1} textLen=${hero.textLen} figures=${hero.figures} anchorsBroken=${hero.anchorsResolve.filter((a) => !a.ok).length} sectionsPresent=${hero.sectionsPresent.filter((s) => s.present).length}/5`);
  await ctx.close();
}

// ── J7: MiniVicBot degraded paths — /api/chat and /api/tts probes + UI state after send
{
  const steps = [];
  const probe = async (path, init) => { try { const r = await fetch(`${BASE}${path}`, init); const body = await r.text(); return { status: r.status, contentType: r.headers.get('content-type'), body: body.slice(0, 300) }; } catch (e) { return { error: e.message }; } };
  steps.push({ name: 'POST /api/chat', ...(await probe('/api/chat', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'user', content: 'What do you do?' }], message: 'What do you do?' }) })) });
  steps.push({ name: 'POST /api/tts', ...(await probe('/api/tts', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: 'hello' }) })) });
  const { ctx, page, errors } = await newPage({ viewport: { width: 1280, height: 800 } });
  const apiCalls = [];
  page.on('response', (r) => { if (/\/api\//.test(r.url())) apiCalls.push({ url: r.url(), status: r.status() }); });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(1000);
  const opened = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((b) => /minivic|chat|ask|talk/i.test((b.getAttribute('aria-label') || b.innerText || '') + ' ' + b.className)); if (!b) return false; b.click(); return true; });
  await page.waitForTimeout(1500);
  const input = await page.$('textarea, input[type=text]:not([hidden])');
  let uiState = null;
  if (input) {
    await input.fill('What do you do?');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(9000);
    uiState = await page.evaluate(() => { const d = document.querySelector('[role=dialog], [aria-modal=true]') || document.body; const t = d.innerText; return { text: t.slice(-900), mentionsError: /unavailable|error|could not|couldn.t|offline|try again|failed|sorry|not available|no answer|quota|limit/i.test(t), voiceState: /voice|audio|mute|speak|listen/i.test(t), disabledControls: [...d.querySelectorAll('button[disabled], [aria-disabled=true]')].map((b) => b.getAttribute('aria-label') || b.innerText.trim().slice(0, 40)), liveRegion: !!d.querySelector('[aria-live], [role=log], [role=status]') }; });
  }
  steps.push({ name: 'UI after sending a message (9 s wait)', opened, typed: !!input, apiCalls, uiState });
  await shot(page, 'J7', 'after-send');
  const chat = steps[0]; const tts = steps[1];
  const honest = chat.status === 200 ? true : !!uiState?.mentionsError;
  const pass = opened && !!input && honest && apiCalls.length > 0;
  record('J7', 'all', '1280x800', steps, pass, `chat=${chat.status} tts=${tts.status} apiCallsFromUI=${JSON.stringify(apiCalls)} honestError=${uiState?.mentionsError} consoleErrors=${errors.length}`);
  results.at(-1).consoleErrors = errors; await ctx.close();
}

// ── J8: navigation integrity (desktop + mobile menu)
for (const vp of [{ width: 1280, height: 800, mobile: false }, { width: 390, height: 844, mobile: true }]) {
  const steps = []; const { ctx, page, errors } = await newPage({ viewport: { width: vp.width, height: vp.height }, isMobile: vp.mobile, hasTouch: vp.mobile });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' }); await page.waitForTimeout(800);
  const menuBtn = await page.evaluate(() => { const b = [...document.querySelectorAll('nav button, header button, button[aria-controls]')].find((b) => /menu|navigation|open|sections/i.test(b.getAttribute('aria-label') || b.innerText || '')); return b ? { name: b.getAttribute('aria-label') || b.innerText.trim(), expanded: b.getAttribute('aria-expanded'), controls: b.getAttribute('aria-controls') } : null; });
  steps.push({ name: 'menu button', menuBtn });
  const hrefs = ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen'];
  const nav = [];
  for (const h of hrefs) {
    // open the menu if needed
    if (menuBtn) { await page.evaluate(() => { const b = [...document.querySelectorAll('nav button, header button, button[aria-controls]')].find((b) => /menu|navigation|open|sections/i.test(b.getAttribute('aria-label') || b.innerText || '')); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); }); await page.waitForTimeout(600); }
    const link = await page.$(`nav a[href="${h}"], header a[href="${h}"], [role=navigation] a[href="${h}"]`);
    if (!link) { nav.push({ href: h, present: false }); continue; }
    const visible = await link.isVisible();
    if (visible) await link.click({ timeout: 5000 }).catch(() => {}); else await page.evaluate((h) => document.querySelector(`a[href="${h}"]`)?.click(), h);
    await page.waitForTimeout(1500);
    const r = await page.evaluate((h) => { const t = document.querySelector(h); const tr = t?.getBoundingClientRect(); const active = [...document.querySelectorAll('nav a, header a')].filter((a) => a.getAttribute('aria-current') || /active|current/i.test(a.className)).map((a) => a.getAttribute('href')); const menuOpen = [...document.querySelectorAll('button[aria-expanded]')].some((b) => b.getAttribute('aria-expanded') === 'true'); return { hash: location.hash, targetTop: tr ? Math.round(tr.top) : null, targetPresent: !!t, activeLinks: active, menuStillOpen: menuOpen }; }, h);
    nav.push({ href: h, present: true, visible, ...r, scrolledToTarget: r.targetPresent && Math.abs(r.targetTop) < Math.max(160, vp.height * 0.25), hashUpdated: r.hash === h });
  }
  steps.push({ name: 'nav links', nav });
  await shot(page, 'J8', 'after-nav');
  const pass = nav.every((n) => n.present && n.targetPresent && n.scrolledToTarget && n.hashUpdated);
  record('J8', 'all', `${vp.width}x${vp.height}`, steps, pass, `present=${nav.filter((n) => n.present).length}/6 scrolled=${nav.filter((n) => n.scrolledToTarget).length}/6 hash=${nav.filter((n) => n.hashUpdated).length}/6 activeState=${nav.filter((n) => n.activeLinks?.length).length}/6 menuBtn=${!!menuBtn}`);
  results.at(-1).consoleErrors = errors; await ctx.close();
}

writeFileSync(`${OUT}/journeys__all__J1-J8__${LABEL}__${stamp()}.json`, JSON.stringify({ base: BASE, runId: RUN_ID, label: LABEL, at: new Date().toISOString(), results }, null, 2));
await browser.close();
console.log('[journeys] summary: ' + results.map((r) => `${r.id}:${r.pass ? 'PASS' : 'FAIL'}`).join(' '));
