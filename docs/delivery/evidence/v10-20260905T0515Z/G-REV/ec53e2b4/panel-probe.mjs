#!/usr/bin/env node
// panel-probe.mjs — independent reviewer browser pass on the LIVE site.
// rev-ec53e2b4-w1. Read-only: navigates, opens the MiniVic panel, screenshots, asserts.
// usage: node panel-probe.mjs <width> <height> <tag> [--gl-force] [--send]
import { chromium } from 'playwright';
import fs from 'node:fs';

const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/ec53e2b4';
const W = Number(process.argv[2] || 1440);
const H = Number(process.argv[3] || 900);
const TAG = process.argv[4] || `${W}`;
const GLF = process.argv.includes('--gl-force');
const SEND = process.argv.includes('--send');
const URL = 'https://forgotten-mistory.web.app/' + (GLF ? '?gl=force' : '');

const pageerrors = [];
const consoleErrors = [];
const failedRequests = [];

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
});
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
page.on('pageerror', (e) => pageerrors.push(String(e && e.message || e)));
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300)); });
page.on('requestfailed', (r) => failedRequests.push(`${r.method()} ${r.url().slice(0, 120)} :: ${r.failure()?.errorText}`));

const result = { tag: TAG, url: URL, viewport: `${W}x${H}`, at: new Date().toISOString() };

await page.goto(URL, { waitUntil: 'load', timeout: 90000 });
await page.waitForTimeout(3500);

result.buildCommit = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content ?? null);
result.canvases = await page.evaluate(() => document.querySelectorAll('canvas').length);

// ---- G-MV1 regression: the launcher pill at this width ----
const toggle = page.getByTestId('minivic-toggle');
const label = page.getByTestId('minivic-launcher-label');
result.launcher = {
  toggleCount: await toggle.count(),
  toggleVisible: (await toggle.count()) ? await toggle.first().isVisible() : false,
  ariaLabel: (await toggle.count()) ? await toggle.first().getAttribute('aria-label') : null,
  labelCount: await label.count(),
  labelVisible: (await label.count()) ? await label.first().isVisible() : false,
  labelText: (await label.count()) ? (await label.first().innerText()).trim() : null,
  labelBox: (await label.count()) ? await label.first().boundingBox() : null,
  computed: (await label.count()) ? await label.first().evaluate((el) => {
    const s = getComputedStyle(el);
    return { display: s.display, visibility: s.visibility, opacity: s.opacity, width: s.width, clip: s.clipPath };
  }) : null,
};
await page.screenshot({ path: `${OUT}/10-closed-${TAG}.png`, fullPage: false });

// ---- open the panel ----
result.openPath = [];
if (await toggle.count()) {
  try {
    await toggle.first().click({ timeout: 6000 });
    result.openPath.push('first-fold click OK');
  } catch (e) {
    result.openPath.push(`first-fold click BLOCKED: ${String(e.message).split('\n')[0]}`);
    result.firstFoldClickBlocked = true;
    result.firstFoldBlocker = /intercepts pointer events/.test(String(e.message))
      ? String(e.message).match(/<[^>]*>[^<]*<\/?[^>]*> from [^\n]*intercepts pointer events/)?.[0] ?? 'pointer-events interception'
      : 'timeout';
    await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 1.3)));
    await page.waitForTimeout(1500);
    try {
      await toggle.first().click({ timeout: 8000 });
      result.openPath.push('after-hero-scroll click OK');
    } catch (e2) {
      result.openPath.push(`after-hero-scroll click FAILED: ${String(e2.message).split('\n')[0]}`);
      const skip = page.getByTestId('minivic-skip');
      if (await skip.count()) {
        await skip.first().evaluate((el) => el.click());
        result.openPath.push('opened via minivic-skip skip-link');
      }
    }
  }
  await page.waitForTimeout(2500);
}
const panel = page.getByTestId('minivic-panel');
result.panel = { count: await panel.count(), visible: (await panel.count()) ? await panel.first().isVisible() : false };

const panelText = (await panel.count()) ? await panel.first().innerText() : '';
result.panelTextBefore = panelText.replace(/\s+/g, ' ').trim().slice(0, 900);
const synth = page.getByTestId('minivic-synthetic-label');
result.truthLineBefore = (await synth.count()) ? (await synth.first().innerText()).trim() : null;
result.truthLineVisibleBefore = (await synth.count()) ? await synth.first().isVisible() : false;

// badge: the element carrying "synthetic"
result.badges = await page.evaluate(() => {
  const p = document.querySelector('[data-testid="minivic-panel"]');
  if (!p) return [];
  return [...p.querySelectorAll('span,div,p')]
    .map((el) => (el.textContent || '').trim())
    .filter((t) => t.length > 0 && t.length < 60 && /minivic/i.test(t));
});

// liveness-claim scan inside the panel only
result.livenessClaimsInPanel = await page.evaluate(() => {
  const p = document.querySelector('[data-testid="minivic-panel"]');
  if (!p) return { text: null, hits: [] };
  const t = p.innerText;
  const hits = [];
  for (const re of [/\bLIVE\b/g, /\bLive\b/g, /\blive avatar\b/gi, /\brealtime\b/gi, /\breal-time\b/gi]) {
    let m; while ((m = re.exec(t)) !== null) hits.push({ pattern: re.source, match: m[0], around: t.slice(Math.max(0, m.index - 45), m.index + 45).replace(/\s+/g, ' ') });
  }
  return { hits };
});
await page.screenshot({ path: `${OUT}/11-panel-open-${TAG}.png`, fullPage: false });
if (await panel.count()) await panel.first().screenshot({ path: `${OUT}/12-panel-only-${TAG}.png` }).catch(() => {});

// ---- send one question, watch the truth line update ----
if (SEND) {
  const input = page.getByTestId('minivic-input');
  if (await input.count()) {
    await input.first().click();
    await input.first().fill('In one sentence, what did Vikram do at the ATO?');
    const t0 = Date.now();
    await page.keyboard.press('Enter');
    let answered = false;
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(500);
      const tl = (await synth.count()) ? await synth.first().innerText() : '';
      const norm = tl.toUpperCase();
      if (/ANSWERS:\s*(LIVE TEXT VIA \S+|OFFLINE KNOWLEDGE BASE)/.test(norm)) { answered = true; break; }
    }
    result.sendMs = Date.now() - t0;
    result.answered = answered;
    result.truthLineAfter = (await synth.count()) ? (await synth.first().innerText()).trim() : null;
    result.panelTextAfter = (await panel.count()) ? (await panel.first().innerText()).replace(/\s+/g, ' ').trim().slice(0, 1400) : null;
    await page.screenshot({ path: `${OUT}/13-panel-answered-${TAG}.png`, fullPage: false });
    if (await panel.count()) await panel.first().screenshot({ path: `${OUT}/14-panel-answered-only-${TAG}.png` }).catch(() => {});
  } else {
    result.answered = 'no-input-found';
  }
}

// ---- regression: hero monochrome + engage plates (G-C1) ----
await page.keyboard.press('Escape').catch(() => {});
await page.waitForTimeout(600);
result.hero = await page.evaluate(() => {
  const h = document.querySelector('#hero');
  if (!h) return null;
  const cs = getComputedStyle(h);
  const sat = [...h.querySelectorAll('*')].slice(0, 400).map((el) => getComputedStyle(el).filter).filter((f) => f && f !== 'none').slice(0, 6);
  return { bg: cs.backgroundColor, color: cs.color, filters: sat };
});
result.engagePlates = await page.evaluate(() => {
  const out = [];
  for (const el of document.querySelectorAll('a,button')) {
    const t = (el.textContent || '').trim();
    if (!t || t.length > 60) continue;
    if (/book|coffee|call|cv|linkedin|email|github|resume|download/i.test(t)) {
      const r = el.getBoundingClientRect();
      out.push({ text: t, href: el.getAttribute('href'), w: Math.round(r.width), h: Math.round(r.height) });
    }
  }
  return out.slice(0, 20);
});

result.pageerrors = pageerrors;
result.consoleErrors = consoleErrors;
result.failedRequests = failedRequests.slice(0, 10);

fs.writeFileSync(`${OUT}/panel-probe-${TAG}.json`, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
await browser.close();
