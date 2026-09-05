import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire('/root/forgotten-mistory/package.json');
const { chromium } = require('playwright');

const URL = 'https://forgotten-mistory.web.app/?gl=force';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c5/capture';
const VIEWPORTS = [[390,844],[834,1194],[1280,800],[1440,900],[1920,1080]];
const SECTIONS = ['hero','about','experience','skills','vitrine','listen'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const VITALS_INIT = `
window.__vitals = { lcpMs: null, lcpElement: null, cls: 0 };
try {
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      window.__vitals.lcpMs = e.renderTime || e.loadTime || e.startTime;
      const el = e.element;
      window.__vitals.lcpElement = el ? (el.tagName.toLowerCase() + (el.src ? ' src=' + el.src : '') + (el.textContent ? ' text=' + el.textContent.trim().slice(0,40) : '')) : null;
    }
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (!e.hadRecentInput) window.__vitals.cls += e.value;
  }).observe({ type: 'layout-shift', buffered: true });
} catch (err) { window.__vitalsError = String(err); }
`;

function attach(page, bucket) {
  page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning') bucket.console.push({ type: t, text: m.text().slice(0, 500) }); });
  page.on('pageerror', (e) => bucket.pageErrors.push(String(e && e.message || e).slice(0, 500)));
  page.on('requestfailed', (r) => bucket.failedRequests.push({ url: r.url(), status: null, failure: r.failure() && r.failure().errorText }));
  page.on('response', (r) => { if (r.status() >= 400) bucket.failedRequests.push({ url: r.url(), status: r.status() }); });
}

const report = { url: URL, startedAt: new Date().toISOString(), viewports: {}, minivic: {}, reducedMotion: {}, screenshots: [] };
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });

async function shot(page, file, opts = {}) {
  const p = path.join(OUT, file);
  await page.screenshot({ path: p, ...opts });
  report.screenshots.push(p);
  return p;
}

try {
  for (const [w, h] of VIEWPORTS) {
    const key = `${w}x${h}`;
    const bucket = { console: [], pageErrors: [], failedRequests: [], vitals: null, sections: {} };
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    attach(page, bucket);
    await page.addInitScript(VITALS_INIT);
    await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
    await sleep(4000);
    bucket.vitals = await page.evaluate(() => ({ ...window.__vitals, error: window.__vitalsError || null }));
    await shot(page, `${key}-fullpage.png`, { fullPage: true });
    for (const s of SECTIONS) {
      const exists = await page.$(`#${s}`);
      if (!exists) { bucket.sections[s] = { present: false }; continue; }
      await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'start' }), s);
      await sleep(1200);
      const box = await exists.boundingBox();
      await shot(page, `${key}-${s}.png`);
      bucket.sections[s] = { present: true, box };
    }

    if (w === 1440) {
      // hovers
      for (const [id, sel, name] of [['about', '#about ul, #about ol, #about [role="list"], #about', 'about-list'], ['experience', '#experience canvas, #experience svg, #experience', 'experience-chart']]) {
        await page.evaluate((i) => document.getElementById(i).scrollIntoView({ block: 'start' }), id);
        await sleep(800);
        const el = await page.$(sel);
        const box = await el.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await sleep(1000);
        await shot(page, `${key}-${name}-hover.png`);
        bucket[`hover_${name}`] = { selectorHit: sel, box };
      }
      // MiniVic
      const mv = report.minivic;
      const chatCalls = [];
      page.on('response', (r) => { if (r.url().includes('/api/chat')) chatCalls.push({ url: r.url(), status: r.status() }); });
      page.on('requestfailed', (r) => { if (r.url().includes('/api/chat')) chatCalls.push({ url: r.url(), status: null, failure: r.failure() && r.failure().errorText }); });
      await page.evaluate(() => window.scrollTo(0, 0));
      const toggle = await page.$('[data-testid="minivic-toggle"]');
      mv.togglePresent = !!toggle;
      if (toggle) {
        await page.evaluate(() => document.querySelector('[data-testid="minivic-toggle"]').click());
        await sleep(3000);
        const panel = await page.$('[data-testid="minivic-panel"]');
        mv.panelPresent = !!panel;
        if (panel) await shot(page, `${key}-minivic-panel.png`); else await shot(page, `${key}-minivic-after-toggle.png`);
        const info = await page.evaluate(() => {
          const p = document.querySelector('[data-testid="minivic-panel"]') || document.body;
          const v = p.querySelector('video');
          const msgs = Array.from(p.querySelectorAll('[data-role], [data-testid^="minivic-message"], .message, p, div'))
            .filter((e) => e.children.length === 0 && e.textContent.trim().length > 20).map((e) => e.textContent.trim());
          return { videoSrc: v ? (v.currentSrc || v.src || (v.querySelector('source') && v.querySelector('source').src) || '') : null, texts: msgs.slice(0, 12), panelText: p.innerText.slice(0, 1500) };
        });
        mv.greeting = info.texts[0] || null;
        mv.panelTextBefore = info.panelText;
        mv.videoSrc = info.videoSrc;
        const before = info.panelText;
        const input = await page.$('[data-testid="minivic-input"]');
        mv.inputPresent = !!input;
        if (input) {
          await input.click();
          await input.type('What is your current role?');
          await page.keyboard.press('Enter');
          let reply = null; const t0 = Date.now();
          while (Date.now() - t0 < 20000) {
            await sleep(1000);
            const now = await page.evaluate(() => (document.querySelector('[data-testid="minivic-panel"]') || document.body).innerText);
            const loading = await page.$('[data-testid="minivic-loading"]');
            if (now.length > before.length + 40 && now.includes('What is your current role?') && !loading) {
              reply = now.slice(now.indexOf('What is your current role?') + 'What is your current role?'.length).trim(); break;
            }
          }
          mv.replyWaitMs = Date.now() - t0;
          mv.replyToQuestion = reply;
          await shot(page, `${key}-minivic-reply.png`);
        }
      }
      mv.apiChatCalls = chatCalls;
      const allChat = bucket.failedRequests.filter((r) => r.url.includes('/api/chat'));
      mv.apiChatFailed = allChat;
    }
    await ctx.close();
    report.viewports[key] = bucket;
  }

  // reduced motion
  {
    const bucket = { console: [], pageErrors: [], failedRequests: [] };
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    attach(page, bucket);
    await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
    await page.reload({ waitUntil: 'load' });
    await sleep(2500);
    bucket.matches = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    await shot(page, `1440x900-reduced-motion-hero.png`);
    await ctx.close();
    report.reducedMotion = bucket;
  }
} catch (err) {
  report.fatal = String(err && err.stack || err);
} finally {
  await browser.close();
}
report.finishedAt = new Date().toISOString();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ screenshots: report.screenshots.length, fatal: report.fatal || null }));
