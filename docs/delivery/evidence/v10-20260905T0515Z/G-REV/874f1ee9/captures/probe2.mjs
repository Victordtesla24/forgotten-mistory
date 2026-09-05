import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import fs from 'node:fs';

const OUT = process.env.OUT_DIR;
fs.mkdirSync(OUT, { recursive: true });
const BASE = 'https://forgotten-mistory.web.app';
const LAUNCH = {
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
};
const QUESTION = 'What did Vikram do at the ATO?';
const results = { startedAt: new Date().toISOString(), runs: {} };

function wire(page, bag) {
  bag.pageerrors = [];
  bag.consoleErrors = [];
  bag.allRequests = [];
  bag.websockets = [];
  page.on('pageerror', (e) => bag.pageerrors.push(String(e).slice(0, 400)));
  page.on('console', (m) => { if (m.type() === 'error') bag.consoleErrors.push(m.text().slice(0, 300)); });
  page.on('request', (r) => bag.allRequests.push({ phase: bag.phase, method: r.method(), url: r.url() }));
  page.on('websocket', (ws) => bag.websockets.push({ phase: bag.phase, url: ws.url() }));
  page.on('response', async (r) => {
    const u = new URL(r.url());
    if (u.pathname.startsWith('/api/')) {
      let body = '';
      try { body = (await r.text()).slice(0, 300); } catch { body = '<unreadable>'; }
      bag.apiResponses = bag.apiResponses || [];
      bag.apiResponses.push({ phase: bag.phase, status: r.status(), url: r.url(), body });
    }
  });
}

async function openMiniVic(page) {
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const btn = document.querySelector('[data-testid="minivic-toggle"]');
    if (!btn) return false;
    return Object.keys(btn).some((k) => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
  }, { timeout: 45000 });
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.waitForTimeout(500);
  await page.locator('[data-testid="minivic-toggle"]').evaluate((el) => el.click());
  const panel = page.locator('[data-testid="minivic-panel"]');
  await panel.waitFor({ state: 'visible', timeout: 15000 });
  const input = panel.locator('[data-testid="minivic-input"]');
  await input.waitFor({ state: 'visible', timeout: 15000 });
  return { panel, input };
}

async function armObserver(page) {
  await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="minivic-panel"]');
    window.__t0 = null; window.__firstBot = null;
    window.__baseline = panel.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]').length;
    if (window.__obs) window.__obs.disconnect();
    window.__obs = new MutationObserver(() => {
      if (window.__firstBot !== null || window.__t0 === null) return;
      const els = panel.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]');
      if (els.length > window.__baseline) {
        const last = els[els.length - 1];
        if ((last.innerText || '').trim().length > 0) window.__firstBot = performance.now();
      }
    });
    window.__obs.observe(panel, { childList: true, subtree: true, characterData: true });
  });
}

async function sendAndMeasure(page, panel, input, question) {
  await armObserver(page);
  await input.fill(question);
  await page.evaluate(() => { window.__t0 = performance.now(); });
  await input.press('Enter');
  await page.waitForFunction(() => window.__firstBot !== null, { timeout: 45000 }).catch(() => {});
  const timing = await page.evaluate(() => ({ t0: window.__t0, firstBot: window.__firstBot }));
  // wait for loading spinner to clear (full reply)
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="minivic-loading"]').length === 0, { timeout: 45000 }).catch(() => {});
  const reply = await page.evaluate(() => {
    const els = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]');
    const last = els[els.length - 1];
    return { count: els.length, text: last ? last.innerText.trim() : null };
  });
  return {
    ttft_ms: timing.firstBot !== null && timing.t0 !== null ? Math.round(timing.firstBot - timing.t0) : null,
    replyLength: reply.text ? reply.text.length : 0,
    replyText: reply.text,
    botMessageCount: reply.count,
  };
}

async function muteIfPossible(panel) {
  const mute = panel.getByRole('button', { name: 'Mute voice' });
  if (await mute.count()) { await mute.first().click(); return true; }
  return false;
}

async function runSend({ width, height, muted, label, trials = 1, watchAfterMs = 0 }) {
  const browser = await chromium.launch(LAUNCH);
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  const bag = { phase: 'load', label, viewport: `${width}x${height}`, muted };
  wire(page, bag);
  const { panel, input } = await openMiniVic(page);

  bag.buildCommit = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content || null);
  bag.greetingHash = await page.evaluate(() => window.__CLONED_VOICE_GREETING_HASH__ || null);
  bag.introText = await page.evaluate(() => {
    const els = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]');
    return els.length ? els[0].innerText.trim() : null;
  });
  bag.introTextContent = await page.evaluate(() => {
    const els = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]');
    return els.length ? els[0].textContent : null;
  });

  bag.mutedApplied = muted ? await muteIfPossible(panel) : false;
  await page.waitForTimeout(300);

  bag.phase = 'send';
  const sendStartIdx = bag.allRequests.length;
  bag.sends = [];
  for (let i = 0; i < trials; i++) {
    const m = await sendAndMeasure(page, panel, input, QUESTION);
    bag.sends.push(m);
    if (i < trials - 1) await page.waitForTimeout(1200);
  }
  bag.sendRequests = bag.allRequests.slice(sendStartIdx).map((r) => {
    const u = new URL(r.url);
    return { method: r.method, path: u.pathname + (u.search ? u.search : ''), host: u.host };
  });
  bag.sendApiPaths = bag.sendRequests.filter((r) => r.path.startsWith('/api/')).map((r) => r.path);

  if (watchAfterMs) {
    bag.phase = 'watch';
    const watchStart = bag.allRequests.length;
    await page.waitForTimeout(watchAfterMs);
    bag.watchRequests = bag.allRequests.slice(watchStart).map((r) => new URL(r.url).pathname);
  }

  bag.chunkUrls = [...new Set(bag.allRequests.filter((r) => r.url.includes('/_next/static/') && r.url.endsWith('.js')).map((r) => r.url))];
  await page.screenshot({ path: `${OUT}/minivic-${label}.png` });
  await ctx.close();
  await browser.close();
  delete bag.allRequests;
  return bag;
}

const target = process.argv[2];

if (target === 'a') results.runs.a_1440_muted = await runSend({ width: 1440, height: 900, muted: true, label: '1440-muted', watchAfterMs: 10000 });
if (target === 'b') results.runs.b_390_muted = await runSend({ width: 390, height: 844, muted: true, label: '390-muted', watchAfterMs: 10000 });
if (target === 'c') results.runs.c_1440_unmuted = await runSend({ width: 1440, height: 900, muted: false, label: '1440-unmuted', watchAfterMs: 3000 });
if (target === 'd') results.runs.d_ttft = await runSend({ width: 1440, height: 900, muted: true, label: 'ttft-trials', trials: 5 });

fs.writeFileSync(`${OUT}/probe2-${target}.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2).slice(0, 6000));
