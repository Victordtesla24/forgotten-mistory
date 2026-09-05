#!/usr/bin/env node
/**
 * G-REV extras — the checks that are not a latency number.
 *
 *  (f) reduced-motion + mute: with prefers-reduced-motion: reduce the panel still
 *      opens, a send still answers from the origin, and no <audio> playback and no
 *      /api/tts request is made while muted.
 *  (g) returning visitor: a persistent profile loads the site twice; the second
 *      load must report the same (current) build-commit as a fresh context, i.e.
 *      the service worker must not be serving yesterday's shell.
 */

import { chromium } from '@playwright/test';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SITE = 'https://forgotten-mistory.web.app';
const ORIGIN_HOST = 'minivicchat-hjdyjsrzvq-uc.a.run.app';
const out = { site: SITE, reducedMotion: null, returningVisitor: null };

const currentBuild = async () => {
  const r = await fetch(`${SITE}/?rev=${Date.now()}`, { cache: 'no-store' });
  const html = await r.text();
  return (html.match(/name="build-commit" content="([^"]+)"/) || [])[1] || null;
};

(async () => {
  const freshBuild = await currentBuild();

  // ---- (f) reduced motion + mute -------------------------------------------
  const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  });
  const reqs = [];
  const errs = [];
  const csp = [];
  await ctx.addInitScript(() => {
    window.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  const page = await ctx.newPage();
  page.on('request', (r) => {
    const u = r.url();
    if (u.includes(ORIGIN_HOST) || /\/api\/(chat|tts|realtime)/.test(u)) reqs.push(`${r.method()} ${u}`);
  });
  page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await page.goto(SITE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const buildInPage = await page.evaluate(
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
  await page.locator('[data-testid="minivic-toggle"]').evaluate((el) => el.click());
  const panel = page.locator('[data-testid="minivic-panel"]');
  await panel.waitFor({ state: 'visible', timeout: 30000 });
  const muteBtn = panel.getByRole('button', { name: 'Mute voice' });
  const muteFound = (await muteBtn.count()) > 0;
  if (muteFound) await muteBtn.click();
  await page.evaluate(() => {
    window.__rm = { t0: 0, tFirst: 0, base: 0 };
    window.__rm.base = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]').length;
    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Enter' && !window.__rm.t0) window.__rm.t0 = performance.now();
      },
      { capture: true },
    );
    new MutationObserver(() => {
      const r = window.__rm;
      if (!r.t0 || r.tFirst) return;
      const bots = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]');
      if (bots.length <= r.base) return;
      if ((bots[bots.length - 1].textContent || '').trim().length > 0) r.tFirst = performance.now();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  const input = panel.locator('[data-testid="minivic-input"]');
  await input.fill('What did Vikram do at the ATO?');
  await input.press('Enter');
  await page.waitForFunction(() => window.__rm.tFirst > 0, { timeout: 40000 }).catch(() => {});
  const ttft = await page.evaluate(() =>
    window.__rm.tFirst ? Math.round(window.__rm.tFirst - window.__rm.t0) : null,
  );
  await page.waitForTimeout(2500);
  const audio = await page.evaluate(() => {
    const a = document.querySelector('[data-testid="minivic-audio"]');
    return a ? { paused: a.paused, currentTime: a.currentTime, src: a.currentSrc || '' } : null;
  });
  csp.push(...(await page.evaluate(() => window.__csp)));
  out.reducedMotion = {
    buildInPage,
    panelOpened: true,
    muteControlFound: muteFound,
    ttftMs: ttft,
    audioState: audio,
    ttsRequests: reqs.filter((r) => r.includes('/api/tts')),
    chatRequests: reqs.filter((r) => r.includes(ORIGIN_HOST) || r.includes('/api/chat')),
    pageErrors: errs,
    cspViolations: csp,
  };
  await ctx.close();

  // ---- (g) returning visitor ----------------------------------------------
  const profile = mkdtempSync(join(tmpdir(), 'grev-profile-'));
  const persistent = await chromium.launchPersistentContext(profile, {
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    viewport: { width: 1440, height: 900 },
  });
  const p1 = await persistent.newPage();
  await p1.goto(SITE, { waitUntil: 'load', timeout: 60000 });
  const first = await p1.evaluate(
    () => document.querySelector('meta[name="build-commit"]')?.getAttribute('content') || null,
  );
  const swAfterFirst = await p1.evaluate(async () => {
    const regs = (await navigator.serviceWorker?.getRegistrations?.()) || [];
    return regs.map((r) => r.active?.scriptURL || r.installing?.scriptURL || 'pending');
  });
  await p1.waitForTimeout(2500); // let any service worker install
  await p1.goto('about:blank');
  await p1.goto(SITE, { waitUntil: 'load', timeout: 60000 });
  const second = await p1.evaluate(
    () => document.querySelector('meta[name="build-commit"]')?.getAttribute('content') || null,
  );
  const third = await (async () => {
    await p1.reload({ waitUntil: 'load' });
    return p1.evaluate(
      () => document.querySelector('meta[name="build-commit"]')?.getAttribute('content') || null,
    );
  })();
  const liveNow = await currentBuild();
  out.returningVisitor = {
    freshBuildAtStart: freshBuild,
    firstLoad: first,
    secondLoad: second,
    reload: third,
    liveNow,
    serviceWorkers: swAfterFirst,
    stale: second !== third || (second !== liveNow && second !== freshBuild),
  };
  await persistent.close();
  await browser.close();

  writeFileSync('04-extras.json', `${JSON.stringify(out, null, 2)}\n`);
  console.log(JSON.stringify(out, null, 2));
})();
