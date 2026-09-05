#!/usr/bin/env node
/**
 * G-REV independent probe — written by the reviewer, not reused from the
 * implementer's `scripts/testing/minivic_live_ttft.mjs`.
 *
 * Differences that matter (this is an adversarial re-measurement, not a re-run):
 *  - Every network request is attributed at REQUEST time and again at RESPONSE
 *    headers, and stamped with the phase it belongs to (load / open / send), so
 *    the warm-on-open requests are counted separately from the send's own.
 *  - The reply bubble text is sampled every 300 ms from the Enter keypress, so
 *    "streams progressively" is measured rather than assumed. A bubble that
 *    appears once, complete, produces a single sample and fails that check.
 *  - securitypolicyviolation is listened for inside the page from before any
 *    app code runs; page errors, console errors and WebSockets are recorded.
 *  - A blocked-origin context proves the /api/chat fallback answers for real,
 *    with the reply text kept so it can be checked for grounding.
 *
 * Usage: node reviewer-probe.mjs --mode latency|fallback [--width 1440] [--trials 6]
 */

import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : d;
};

const SITE = arg('url', 'https://forgotten-mistory.web.app');
const ORIGIN_HOST = 'minivicchat-hjdyjsrzvq-uc.a.run.app';
const MODE = arg('mode', 'latency');
const WIDTH = Number(arg('width', '1440'));
const HEIGHT = WIDTH === 390 ? 844 : 900;
const TRIALS = Number(arg('trials', '6'));
const OUT = arg('out', `probe-${MODE}-${WIDTH}.json`);
const QUESTION = 'What did Vikram do at the ATO?';

const pct = (v, p) => {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  return s[Math.max(0, Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1))];
};

const classify = (url) => {
  if (url.includes(ORIGIN_HOST)) return 'chat:origin';
  if (/\/api\/chat/.test(url)) return 'chat:hosting';
  if (/\/api\/realtime/.test(url)) return 'FORBIDDEN:realtime';
  if (/chat-with-vic/.test(url)) return 'FORBIDDEN:chat-with-vic';
  if (/\/api\/tts/.test(url)) return 'tts';
  return 'other';
};

async function runTrial(browser, index, blockOrigin) {
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const rec = {
    index,
    viewport: `${WIDTH}x${HEIGHT}`,
    phase: 'load',
    requests: [],
    pageerrors: [],
    consoleErrors: [],
    websockets: [],
  };
  let phase = () => rec.phase;

  await ctx.addInitScript(() => {
    window.__rev = { csp: [], samples: [], t0: 0, tFirst: 0, baseline: 0, sampling: false };
    document.addEventListener('securitypolicyviolation', (e) => {
      window.__rev.csp.push({
        directive: e.violatedDirective,
        blocked: e.blockedURI,
        source: e.sourceFile || '',
      });
    });
  });

  if (blockOrigin) {
    await ctx.route(`**://${ORIGIN_HOST}/**`, (route) => route.abort('connectionrefused'));
  }

  const page = await ctx.newPage();
  page.on('request', (r) => {
    const kind = classify(r.url());
    if (kind === 'other') return;
    rec.requests.push({
      phase: phase(),
      kind,
      method: r.method(),
      url: r.url(),
      resourceType: r.resourceType(),
      at: Date.now(),
      status: null,
      contentType: null,
      failure: null,
    });
  });
  page.on('response', async (r) => {
    const hit = rec.requests.find((q) => q.url === r.url() && q.status === null);
    if (!hit) return;
    hit.status = r.status();
    try {
      hit.contentType = (await r.allHeaders())['content-type'] || null;
    } catch {
      hit.contentType = null;
    }
  });
  page.on('requestfailed', (r) => {
    const hit = rec.requests.find((q) => q.url === r.url() && q.status === null && !q.failure);
    if (hit) hit.failure = r.failure()?.errorText || 'failed';
  });
  page.on('pageerror', (e) => rec.pageerrors.push(String(e).slice(0, 300)));
  page.on('console', (m) => {
    if (m.type() === 'error') rec.consoleErrors.push(m.text().slice(0, 300));
  });
  page.on('websocket', (ws) => rec.websockets.push(ws.url()));

  await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  rec.buildCommit = await page.evaluate(
    () => document.querySelector('meta[name="build-commit"]')?.getAttribute('content') || null,
  );
  await page.waitForFunction(
    () => {
      const b = document.querySelector('[data-testid="minivic-toggle"]');
      return Boolean(b) && Object.keys(b).some((k) => k.startsWith('__react'));
    },
    { timeout: 60000 },
  );
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.waitForTimeout(400);

  rec.phase = 'open';
  await page.locator('[data-testid="minivic-toggle"]').evaluate((el) => el.click());
  const panel = page.locator('[data-testid="minivic-panel"]');
  await panel.waitFor({ state: 'visible', timeout: 30000 });
  const mute = panel.getByRole('button', { name: 'Mute voice' });
  if (await mute.count()) await mute.click();
  await page.waitForTimeout(700); // let the warm-on-open request be observed

  // clock + 300 ms sampler, installed after the panel exists
  await page.evaluate(() => {
    const r = window.__rev;
    r.baseline = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]').length;
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Enter' && !r.t0) r.t0 = performance.now();
      },
      { capture: true },
    );
    new MutationObserver(() => {
      if (!r.t0 || r.tFirst) return;
      const bots = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]');
      if (bots.length <= r.baseline) return;
      if ((bots[bots.length - 1].textContent || '').trim().length > 0) r.tFirst = performance.now();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    setInterval(() => {
      if (!r.t0) return;
      const bots = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]');
      const text = bots.length > r.baseline ? (bots[bots.length - 1].textContent || '').trim() : '';
      r.samples.push({ t: Math.round(performance.now() - r.t0), len: text.length });
    }, 300);
  });

  rec.phase = 'send';
  const input = panel.locator('[data-testid="minivic-input"]');
  await input.fill(QUESTION);
  const sendWall = Date.now();
  rec.sendWall = sendWall;
  await input.press('Enter');
  try {
    await page.waitForFunction(() => window.__rev.tFirst > 0, { timeout: 40000 });
    rec.ttft = Math.round(await page.evaluate(() => window.__rev.tFirst - window.__rev.t0));
  } catch {
    rec.ttft = null;
    rec.timedOut = true;
  }
  // let the reply finish so the samples show the whole stream
  await page
    .waitForFunction(() => document.querySelectorAll('[data-testid="minivic-loading"]').length === 0, {
      timeout: 40000,
    })
    .catch(() => {});
  await page.waitForTimeout(600);

  const tail = await page.evaluate(() => {
    const r = window.__rev;
    const bots = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]');
    return {
      csp: r.csp,
      samples: r.samples,
      reply: bots.length > r.baseline ? (bots[bots.length - 1].textContent || '').trim() : '',
    };
  });
  rec.csp = tail.csp;
  rec.samples = tail.samples;
  rec.reply = tail.reply;
  rec.chatRequestsOnSend = rec.requests.filter(
    (q) => q.phase === 'send' && q.kind.startsWith('chat:'),
  );
  rec.chatRequestsOnOpen = rec.requests.filter(
    (q) => q.phase === 'open' && q.kind.startsWith('chat:'),
  );
  rec.forbidden = rec.requests.filter((q) => q.kind.startsWith('FORBIDDEN'));
  await ctx.close();
  return rec;
}

(async () => {
  const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const trials = [];
  const blockOrigin = MODE === 'fallback';
  for (let i = 0; i < TRIALS; i += 1) {
    /* eslint-disable no-await-in-loop */
    const t = await runTrial(browser, i, blockOrigin);
    trials.push(t);
    console.log(
      `[${MODE} ${WIDTH}] trial ${i} ttft=${t.ttft} chatOnSend=${t.chatRequestsOnSend
        .map((q) => `${q.kind}:${q.method}:${q.status ?? q.failure}`)
        .join(',')} samples=${t.samples.length} csp=${t.csp.length} err=${t.pageerrors.length}`,
    );
  }
  await browser.close();
  const warm = trials.slice(1).map((t) => t.ttft).filter((v) => typeof v === 'number');
  const out = {
    site: SITE,
    mode: MODE,
    viewport: `${WIDTH}x${HEIGHT}`,
    buildCommit: trials[0]?.buildCommit ?? null,
    cold: trials[0]?.ttft ?? null,
    warmTrials: warm,
    warmP50: pct(warm, 50),
    warmP95: pct(warm, 95),
    trials,
  };
  writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`cold=${out.cold} P50=${out.warmP50} P95=${out.warmP95} -> ${OUT}`);
})();
