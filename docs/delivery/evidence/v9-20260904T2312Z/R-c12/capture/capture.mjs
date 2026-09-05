import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL = 'https://forgotten-mistory.web.app/?gl=force';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c12/capture';
const VIEWPORTS = [[390,844],[834,1194],[1280,800],[1440,900],[1920,1080]];
const SECTIONS = ['hero','about','experience','skills','vitrine','listen'];
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const report = { url: URL, startedAt: new Date().toISOString(), viewports: {}, minivic: {}, reducedMotion: {}, screenshots: [] };

const VITALS_INIT = `
window.__lcp = null; window.__cls = 0;
try {
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { const el = e.element; window.__lcp = { ms: e.startTime, tag: el ? el.tagName : null, src: el && (el.currentSrc || el.src) || null, text: el ? (el.textContent||'').trim().slice(0,40) : null }; } }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput) window.__cls += e.value; } }).observe({ type: 'layout-shift', buffered: true });
} catch (err) { window.__vitalsErr = String(err); }
`;

function attach(page, bucket) {
  page.on('console', (m) => { const t = m.type(); if (t === 'error' || t === 'warning') bucket.console.push({ type: t, text: m.text().slice(0, 500) }); });
  page.on('pageerror', (e) => bucket.pageerrors.push(String(e && e.message || e).slice(0, 500)));
  page.on('requestfailed', (r) => bucket.failedRequests.push({ url: r.url(), status: null, failure: r.failure() && r.failure().errorText }));
  page.on('response', (r) => { if (r.status() >= 400) bucket.failedRequests.push({ url: r.url(), status: r.status() }); });
}

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
    const bucket = { console: [], pageerrors: [], failedRequests: [], vitals: null, sections: {} };
    report.viewports[key] = bucket;
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    attach(page, bucket);
    await page.addInitScript(VITALS_INIT);
    await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
    await sleep(4000);
    bucket.vitals = await page.evaluate(() => ({ lcp: window.__lcp, cls: window.__cls, err: window.__vitalsErr || null }));
    await shot(page, `${key}-full.png`, { fullPage: true });
    for (const s of SECTIONS) {
      const found = await page.evaluate((id) => { const el = document.getElementById(id); if (!el) return false; el.scrollIntoView({ block: 'start', behavior: 'instant' }); return true; }, s);
      await sleep(1200);
      bucket.sections[s] = { found };
      if (found) await shot(page, `${key}-${s}.png`);
    }

    if (w === 1440) {
      // hovers
      for (const [id, label] of [['about','about-hover'],['experience','experience-hover']]) {
        const box = await page.evaluate((id) => {
          const sec = document.getElementById(id); if (!sec) return null;
          sec.scrollIntoView({ block: 'start', behavior: 'instant' });
          const target = sec.querySelector(id === 'about' ? 'ol, ul, [role="list"]' : 'canvas, svg, [class*="chart"], [class*="axis"]') || sec;
          const r = target.getBoundingClientRect();
          return { x: r.x + r.width / 2, y: r.y + r.height / 2, tag: target.tagName, cls: String(target.className).slice(0, 80) };
        }, id);
        await sleep(800);
        if (box) { await page.mouse.move(box.x, box.y); await sleep(1000); await shot(page, `${key}-${label}.png`); }
        bucket.sections[label] = box;
      }
      // MiniVic
      const mv = report.minivic;
      let chatStatus = null; let chatCalled = false;
      page.on('response', (r) => { if (r.url().includes('/api/chat')) { chatCalled = true; chatStatus = r.status(); } });
      page.on('requestfailed', (r) => { if (r.url().includes('/api/chat')) { chatCalled = true; chatStatus = 'failed:' + (r.failure() && r.failure().errorText); } });
      await page.evaluate(() => window.scrollTo(0, 0));
      const toggled = await page.evaluate(() => { const el = document.querySelector('[data-testid="minivic-toggle"]'); if (!el) return false; el.click(); return true; });
      mv.toggleFound = toggled;
      await sleep(3000);
      await shot(page, `${key}-minivic-open.png`);
      const panelInfo = await page.evaluate(() => {
        const panel = document.querySelector('[data-testid="minivic-panel"]');
        if (!panel) return { panelFound: false };
        const msgs = [...panel.querySelectorAll('[data-minivic-message]')].map(m => ({ role: m.getAttribute('data-minivic-message') || m.getAttribute('data-role'), text: (m.textContent || '').trim().slice(0, 600) }));
        const video = panel.querySelector('video');
        return { panelFound: true, messages: msgs, greeting: msgs.length ? msgs[0].text : (panel.textContent || '').trim().slice(0, 600), videoSrc: video ? (video.currentSrc || video.getAttribute('src') || (video.querySelector('source') && video.querySelector('source').src) || null) : null, videoCount: panel.querySelectorAll('video').length, inputFound: !!panel.querySelector('[data-testid="minivic-input"]') };
      });
      Object.assign(mv, panelInfo);
      const before = panelInfo.messages ? panelInfo.messages.length : 0;
      if (panelInfo.inputFound) {
        const input = page.locator('[data-testid="minivic-input"]');
        await input.click();
        await input.fill('What is your current role?');
        await input.press('Enter');
        const t0 = Date.now(); let reply = null;
        while (Date.now() - t0 < 20000) {
          await sleep(500);
          const msgs = await page.evaluate(() => [...document.querySelectorAll('[data-testid="minivic-panel"] [data-minivic-message]')].map(m => ({ role: m.getAttribute('data-minivic-message'), text: (m.textContent || '').trim().slice(0, 800) })));
          const assistant = msgs.slice(before).filter(m => m.role !== 'user' && !/What is your current role\?/.test(m.text) && m.text.length > 0);
          if (assistant.length && !(await page.evaluate(() => !!document.querySelector('[data-testid="minivic-loading"]')))) { reply = assistant[assistant.length - 1]; break; }
        }
        mv.replyToQuestion = reply ? reply.text : null;
        mv.replyRole = reply ? reply.role : null;
        mv.replyWaitMs = Date.now() - t0;
        mv.allMessagesAfter = await page.evaluate(() => [...document.querySelectorAll('[data-testid="minivic-panel"] [data-minivic-message]')].map(m => ({ role: m.getAttribute('data-minivic-message'), text: (m.textContent || '').trim().slice(0, 300) })));
        await shot(page, `${key}-minivic-reply.png`);
      }
      mv.apiChatCalled = chatCalled; mv.apiChatStatus = chatStatus;
      mv.replySource = chatCalled ? `network:/api/chat status ${chatStatus}` : 'no /api/chat request observed (client-side/local reply)';
      mv.consoleAfter = bucket.console.slice();
    }
    await ctx.close();
  }

  // reduced motion
  {
    const bucket = { console: [], pageerrors: [], failedRequests: [], sections: {} };
    report.reducedMotion = bucket;
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'reduce' });
    const page = await ctx.newPage(); attach(page, bucket);
    await page.goto(URL, { waitUntil: 'load', timeout: 60000 });
    await page.reload({ waitUntil: 'load', timeout: 60000 });
    await sleep(2500);
    bucket.matchMedia = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
    bucket.heroFound = await page.evaluate(() => !!document.getElementById('hero'));
    await shot(page, `1440x900-reduced-motion-hero.png`);
    await ctx.close();
  }
} catch (e) {
  report.fatal = String(e && e.stack || e);
} finally {
  await browser.close();
  report.finishedAt = new Date().toISOString();
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ screenshots: report.screenshots.length, fatal: report.fatal || null }));
}
