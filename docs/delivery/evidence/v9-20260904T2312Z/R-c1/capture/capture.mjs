// Evidence capture for https://forgotten-mistory.web.app — run v9-20260904T2312Z / R-c1
// Read-only against the live site. Writes PNGs + report.json into this directory only.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const OUT = path.dirname(fileURLToPath(import.meta.url));
const URL = 'https://forgotten-mistory.web.app';
const SECTIONS = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];
const VIEWPORTS = [
  [390, 844],
  [834, 1194],
  [1280, 800],
  [1440, 900],
  [1920, 1080],
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const report = {
  url: URL,
  startedAt: new Date().toISOString(),
  viewports: {},
  reducedMotion: null,
  minivic: null,
  screenshots: [],
};

function attachCollectors(page, bucket) {
  page.on('console', (m) => {
    const t = m.type();
    if (t === 'error' || t === 'warning') bucket.console.push({ type: t, text: m.text().slice(0, 500) });
  });
  page.on('pageerror', (e) => bucket.pageErrors.push(String(e && e.message ? e.message : e).slice(0, 500)));
  page.on('requestfailed', (r) => bucket.failedRequests.push({ url: r.url(), status: null, error: r.failure()?.errorText || 'failed' }));
  page.on('response', (r) => {
    if (r.status() >= 400) bucket.failedRequests.push({ url: r.url(), status: r.status(), error: null });
  });
}

const VITALS_INIT = `
  window.__vitals = { lcp: null, lcpEl: null, cls: 0 };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        window.__vitals.lcp = e.startTime;
        const el = e.element;
        window.__vitals.lcpEl = el ? {
          tag: el.tagName.toLowerCase(),
          src: el.currentSrc || el.src || null,
          text: (el.textContent || '').trim().slice(0, 40),
          id: el.id || null,
          cls: typeof el.className === 'string' ? el.className.slice(0, 80) : null,
        } : null;
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (e) { window.__vitals.lcpErr = String(e); }
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  } catch (e) { window.__vitals.clsErr = String(e); }
`;

async function shot(page, file, opts = {}) {
  const p = path.join(OUT, file);
  await page.screenshot({ path: p, ...opts });
  report.screenshots.push(p);
  return p;
}

async function captureViewport(browser, [w, h]) {
  const key = `${w}x${h}`;
  const bucket = { console: [], pageErrors: [], failedRequests: [], vitals: null, sections: {} };
  report.viewports[key] = bucket;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  attachCollectors(page, bucket);
  await page.addInitScript(VITALS_INIT);
  const t0 = Date.now();
  try {
    await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
  } catch (e) {
    bucket.gotoError = String(e.message);
  }
  bucket.loadMs = Date.now() - t0;
  await sleep(4000);
  bucket.vitals = await page.evaluate(() => window.__vitals);
  await shot(page, `${key}-full.png`, { fullPage: true });
  for (const s of SECTIONS) {
    const exists = await page.$(`#${s}`);
    if (!exists) { bucket.sections[s] = { present: false }; continue; }
    await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start', behavior: 'instant' }), s);
    await sleep(1200);
    const box = await exists.boundingBox();
    bucket.sections[s] = { present: true, box };
    await shot(page, `${key}-${s}.png`);
  }

  if (w === 1440) {
    // hover about list
    const aboutList = await page.$('#about ul, #about ol, #about [role="list"], #about dl');
    if (aboutList) {
      await page.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }), aboutList);
      await sleep(800);
      const b = await aboutList.boundingBox();
      if (b) {
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
        await sleep(900);
        bucket.hoverAbout = { target: await aboutList.evaluate((e) => e.tagName + (e.className ? '.' + String(e.className).split(' ')[0] : '')), at: [b.x + b.width / 2, b.y + b.height / 2] };
        await shot(page, `${key}-about-hover.png`);
      }
    } else bucket.hoverAbout = { target: null };
    // hover experience chart
    const chart = await page.$('#experience svg, #experience canvas, #experience [class*="chart"], #experience [class*="axis"]');
    if (chart) {
      await page.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }), chart);
      await sleep(800);
      const b = await chart.boundingBox();
      if (b) {
        await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
        await sleep(900);
        bucket.hoverExperience = { target: await chart.evaluate((e) => e.tagName + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '')), at: [b.x + b.width / 2, b.y + b.height / 2] };
        await shot(page, `${key}-experience-hover.png`);
      }
    } else bucket.hoverExperience = { target: null };

    // MiniVic
    const mv = { toggleFound: false, greeting: null, videoSrc: null, replyToQuestion: null, replySource: null, chatRequest: null, panelSelector: null, errors: [] };
    report.minivic = mv;
    const chatCalls = [];
    page.on('response', (r) => { if (r.url().includes('/api/chat')) chatCalls.push({ url: r.url(), status: r.status() }); });
    page.on('requestfailed', (r) => { if (r.url().includes('/api/chat')) chatCalls.push({ url: r.url(), status: null, error: r.failure()?.errorText }); });
    try {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await sleep(500);
      const toggle = await page.$('[data-testid="minivic-toggle"]');
      mv.toggleFound = !!toggle;
      if (toggle) {
        await toggle.evaluate((el) => el.click());
        await sleep(3000);
        const panelSel = ['[data-testid="minivic-panel"]', '[role="dialog"]', '[class*="minivic"] [class*="panel"]', '[class*="MiniVic"]', '[class*="minivic"]'];
        let panel = null;
        for (const s of panelSel) { panel = await page.$(s); if (panel && await panel.isVisible()) { mv.panelSelector = s; break; } panel = null; }
        if (panel) await shot(page, `${key}-minivic-open.png`);
        else await shot(page, `${key}-minivic-open.png`);
        const scope = panel || page;
        mv.panelText = (await (panel ? panel.innerText() : page.innerText('body'))).slice(0, 1500);
        const msgs = await scope.$$('[data-testid*="message"], [class*="message"], [class*="bubble"], [role="log"] > *, [aria-live] > *');
        mv.initialMessageCount = msgs.length;
        if (msgs.length) mv.greeting = (await msgs[0].innerText()).trim().slice(0, 600);
        const vid = await scope.$('video');
        mv.videoSrc = vid ? await vid.evaluate((v) => v.currentSrc || v.src || (v.querySelector('source') && v.querySelector('source').src) || null) : null;
        const tb = await scope.$('textarea, input[type="text"], [role="textbox"], [contenteditable="true"]');
        mv.composerFound = !!tb;
        if (tb) {
          const before = (await scope.innerText()).length;
          await tb.click();
          await tb.type('What is your current role?', { delay: 20 });
          await page.keyboard.press('Enter');
          const t1 = Date.now();
          let reply = null;
          while (Date.now() - t1 < 20000) {
            await sleep(500);
            const items = await scope.$$('[data-testid*="message"], [class*="message"], [class*="bubble"], [role="log"] > *, [aria-live] > *');
            if (items.length > mv.initialMessageCount + 1) {
              const last = items[items.length - 1];
              const txt = (await last.innerText()).trim();
              if (txt && !/what is your current role\?/i.test(txt) && !/^(thinking|typing|…|\.\.\.)$/i.test(txt)) { reply = txt; break; }
            }
          }
          mv.replyWaitMs = Date.now() - t1;
          if (!reply) {
            const after = await scope.innerText();
            mv.panelTextAfter = after.slice(-1200);
            if (after.length > before + 40) reply = after.slice(before).trim().slice(0, 800);
          }
          mv.replyToQuestion = reply ? reply.slice(0, 800) : null;
          mv.chatRequest = chatCalls.length ? chatCalls : null;
          mv.replySource = chatCalls.length ? `network:/api/chat status ${chatCalls.map((c) => c.status ?? c.error).join(',')}` : (reply ? 'no /api/chat request observed — client-side/static reply' : 'no reply, no /api/chat request');
          await shot(page, `${key}-minivic-reply.png`);
        }
      }
    } catch (e) { mv.errors.push(String(e.message)); }
  }
  await ctx.close();
}

async function reducedMotion(browser) {
  const bucket = { console: [], pageErrors: [], failedRequests: [] };
  report.reducedMotion = bucket;
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  attachCollectors(page, bucket);
  await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
  await page.reload({ waitUntil: 'load', timeout: 60000 });
  await sleep(2500);
  bucket.matchMedia = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  bucket.heroCanvasCount = await page.evaluate(() => document.querySelectorAll('#hero canvas').length);
  await shot(page, '1440x900-reduced-motion-hero.png');
  await ctx.close();
}

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  for (const vp of VIEWPORTS) {
    try { await captureViewport(browser, vp); } catch (e) { report.viewports[`${vp[0]}x${vp[1]}`].fatal = String(e.message); }
  }
  try { await reducedMotion(browser); } catch (e) { report.reducedMotion = { fatal: String(e.message) }; }
} finally {
  await browser.close();
}
report.finishedAt = new Date().toISOString();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  screenshots: report.screenshots.length,
  perViewport: Object.fromEntries(Object.entries(report.viewports).map(([k, v]) => [k, { console: v.console.length, pageErrors: v.pageErrors.length, failed: v.failedRequests.length, lcp: v.vitals?.lcp, cls: v.vitals?.cls, lcpEl: v.vitals?.lcpEl }])),
  reducedMotion: report.reducedMotion && { console: report.reducedMotion.console?.length, pageErrors: report.reducedMotion.pageErrors?.length, matchMedia: report.reducedMotion.matchMedia, fatal: report.reducedMotion.fatal },
  minivic: report.minivic,
}, null, 2));
