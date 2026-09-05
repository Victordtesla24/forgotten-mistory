import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const URL = 'https://forgotten-mistory.web.app/?gl=force';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c8/capture';
const VIEWPORTS = [[390,844],[834,1194],[1280,800],[1440,900],[1920,1080]];
const SECTIONS = ['hero','about','experience','skills','vitrine','listen'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const report = { url: URL, startedAt: new Date().toISOString(), viewports: {}, minivic: {}, reducedMotion: {}, screenshots: [] };

function attach(page, bucket) {
  page.on('console', m => { const t = m.type(); if (t === 'error' || t === 'warning') bucket.console.push(`[${t}] ${m.text()}`.slice(0, 500)); });
  page.on('pageerror', e => bucket.pageErrors.push(String(e && e.message || e).slice(0, 500)));
  page.on('requestfailed', r => bucket.failedRequests.push(`FAILED ${r.url()} ${r.failure() && r.failure().errorText || ''}`));
  page.on('response', r => { if (r.status() >= 400) bucket.failedRequests.push(`${r.status()} ${r.url()}`); });
}

const VITALS_INIT = `
window.__vitals = { lcp: null, lcpEl: null, cls: 0 };
try {
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { window.__vitals.lcp = e.startTime; const el = e.element; window.__vitals.lcpEl = el ? (el.tagName.toLowerCase() + (el.src ? ' src=' + el.src : '') + (el.textContent ? ' text=' + el.textContent.trim().slice(0,40) : '')) : null; } }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput) window.__vitals.cls += e.value; } }).observe({ type: 'layout-shift', buffered: true });
} catch (e) { window.__vitals.error = String(e); }
`;

async function shot(page, file, opts = {}) {
  const p = path.join(OUT, file);
  await page.screenshot({ path: p, ...opts });
  report.screenshots.push(p);
  return p;
}

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
try {
  for (const [w, h] of VIEWPORTS) {
    const key = `${w}x${h}`;
    const bucket = { console: [], pageErrors: [], failedRequests: [], vitals: null, sections: {} };
    report.viewports[key] = bucket;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    await ctx.addInitScript(VITALS_INIT);
    const page = await ctx.newPage();
    attach(page, bucket);
    try {
      await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
      await sleep(4000);
      bucket.vitals = await page.evaluate(() => window.__vitals);
      await shot(page, `${key}-full.png`, { fullPage: true });
      for (const s of SECTIONS) {
        const exists = await page.$(`#${s}`);
        if (!exists) { bucket.sections[s] = 'MISSING'; continue; }
        await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start', behavior: 'instant' }), s);
        await sleep(1200);
        bucket.sections[s] = await shot(page, `${key}-${s}.png`);
      }
      if (w === 1440) {
        // hover about list
        const aboutList = await page.$('#about ul, #about ol, #about [role="list"], #about dl');
        if (aboutList) {
          await page.evaluate(() => document.getElementById('about').scrollIntoView({ block: 'start', behavior: 'instant' }));
          await sleep(800);
          const b = await aboutList.boundingBox();
          if (b) { await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await sleep(800); }
          bucket.hoverAbout = await shot(page, `${key}-about-hover.png`);
        } else bucket.hoverAbout = 'no list element found in #about';
        const expChart = await page.$('#experience canvas, #experience svg, #experience [role="img"], #experience figure');
        if (expChart) {
          await page.evaluate(() => document.getElementById('experience').scrollIntoView({ block: 'start', behavior: 'instant' }));
          await sleep(800);
          const b = await expChart.boundingBox();
          if (b) { await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await sleep(800); }
          bucket.hoverExperience = await shot(page, `${key}-experience-hover.png`);
        } else bucket.hoverExperience = 'no chart element found in #experience';

        // MiniVic
        const mv = report.minivic;
        const chatCalls = [];
        page.on('response', r => { if (r.url().includes('/api/chat')) chatCalls.push({ url: r.url(), status: r.status() }); });
        page.on('requestfailed', r => { if (r.url().includes('/api/chat')) chatCalls.push({ url: r.url(), status: 'FAILED ' + (r.failure() && r.failure().errorText) }); });
        await page.evaluate(() => window.scrollTo(0, 0));
        await sleep(500);
        const toggle = await page.$('[data-testid="minivic-toggle"]');
        mv.toggleFound = !!toggle;
        if (toggle) {
          await toggle.evaluate(el => el.click());
          await sleep(3000);
          mv.panelScreenshot = await shot(page, `${key}-minivic-open.png`);
          const info = await page.evaluate(() => {
            const t = document.querySelector('[data-testid="minivic-toggle"]');
            const panel = document.querySelector('[data-testid="minivic-panel"]') || document.querySelector('[role="dialog"]') || (t && t.closest('[class*="minivic" i], [id*="minivic" i], [class*="MiniVic"]')) || document.querySelector('[class*="minivic" i], [id*="minivic" i]');
            const out = { panelSelector: panel ? (panel.tagName + (panel.id ? '#' + panel.id : '') + '.' + (panel.className && panel.className.baseVal === undefined ? String(panel.className).slice(0, 80) : '')) : null };
            const root = panel || document.body;
            const msgs = Array.from(root.querySelectorAll('[data-testid*="message" i], [data-role], [class*="message" i], [class*="bubble" i], p'));
            out.greeting = (msgs.map(m => m.textContent.trim()).filter(Boolean)[0] || root.innerText.trim().slice(0, 300));
            out.messageTexts = msgs.map(m => m.textContent.trim()).filter(Boolean).slice(0, 10);
            const v = root.querySelector('video');
            out.videoSrc = v ? (v.currentSrc || v.src || (v.querySelector('source') && v.querySelector('source').src) || '') : null;
            out.videoCount = root.querySelectorAll('video').length;
            const ta = root.querySelector('textarea, input[type="text"], [contenteditable="true"], [role="textbox"]');
            out.composerFound = !!ta;
            out.composerTag = ta ? ta.tagName + ' ' + (ta.getAttribute('data-testid') || ta.getAttribute('placeholder') || '') : null;
            out.panelText = root.innerText.trim().slice(0, 1500);
            return out;
          });
          Object.assign(mv, info);
          const composer = await page.$('[data-testid="minivic-panel"] textarea, [role="dialog"] textarea, textarea, [role="textbox"], input[type="text"]');
          if (composer) {
            const before = await page.evaluate(() => document.body.innerText.length);
            await composer.click();
            await composer.type('What is your current role?', { delay: 20 });
            await composer.press('Enter');
            mv.sentAt = new Date().toISOString();
            const t0 = Date.now(); let reply = null;
            while (Date.now() - t0 < 20000) {
              await sleep(1000);
              reply = await page.evaluate((beforeLen) => {
                const t = document.querySelector('[data-testid="minivic-toggle"]');
                const panel = document.querySelector('[data-testid="minivic-panel"]') || document.querySelector('[role="dialog"]') || document.querySelector('[class*="minivic" i], [id*="minivic" i]') || document.body;
                const cands = Array.from(panel.querySelectorAll('[data-role="assistant"], [data-author="assistant"], [data-testid*="assistant" i], [class*="assistant" i], [class*="bot" i], [class*="reply" i], [class*="message" i], p, li'))
                  .map(m => ({ text: m.textContent.trim(), cls: String(m.className).slice(0, 80), role: m.getAttribute('data-role') || m.getAttribute('data-author') || m.getAttribute('data-testid') || '' })).filter(m => m.text);
                return { cands: cands.slice(-12), bodyLen: document.body.innerText.length, panelText: panel.innerText.trim().slice(-1500) };
              }, before);
              const found = reply.cands.filter(c => !/What is your current role\?/.test(c.text) && c.text.length > 20);
              if (reply.bodyLen > before + 40 && chatCalls.length > 0) { mv.replyPoll = reply; break; }
              mv.replyPoll = reply;
            }
            mv.waitedMs = Date.now() - t0;
            mv.panelTextAfter = mv.replyPoll && mv.replyPoll.panelText;
            mv.afterScreenshot = await shot(page, `${key}-minivic-reply.png`);
          } else mv.composerFound = false;
          mv.apiChatCalls = chatCalls;
        }
      }
    } catch (e) { bucket.error = String(e && e.stack || e).slice(0, 800); }
    await ctx.close();
  }

  // reduced motion
  {
    const bucket = { console: [], pageErrors: [], failedRequests: [] };
    report.reducedMotion = bucket;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    attach(page, bucket);
    try {
      await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
      await page.reload({ waitUntil: 'load', timeout: 60000 });
      await sleep(2500);
      bucket.matches = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
      bucket.heroScreenshot = await shot(page, `1440x900-reduced-motion-hero.png`);
    } catch (e) { bucket.error = String(e).slice(0, 800); }
    await ctx.close();
  }
} finally {
  await browser.close();
}
report.finishedAt = new Date().toISOString();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ viewports: Object.fromEntries(Object.entries(report.viewports).map(([k, v]) => [k, { console: v.console.length, pageErrors: v.pageErrors.length, failed: v.failedRequests.length, vitals: v.vitals, error: v.error }])), minivic: { ...report.minivic, replyPoll: undefined, panelText: undefined }, reducedMotion: { ...report.reducedMotion }, shots: report.screenshots.length }, null, 2));
