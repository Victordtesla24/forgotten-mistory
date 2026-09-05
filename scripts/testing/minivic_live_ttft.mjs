#!/usr/bin/env node
/**
 * Enter → first visible token, measured in a real browser against the live site.
 *
 * ONE SEND PER PAGE. An earlier version reused one page for every trial and hung
 * on the second send; rather than measure through a harness whose own state was
 * in question, each trial now gets a fresh context and asks exactly one question.
 * Page load is not counted — the clock starts at the Enter keypress — and the
 * function stays warm across trials regardless, which is the property being
 * measured.
 *
 * G-M3 measured the wire (curl to Hosting and to the Cloud Run origin) and said
 * plainly that it had NOT measured what a visitor experiences. This does that:
 * a Chromium page, the MiniVic panel opened the way a visitor opens it, a real
 * Enter keypress, and the clock stopped by a MutationObserver the instant the
 * first character of the reply is in the DOM.
 *
 * Both timestamps are taken inside the page (`performance.now()` in a keydown
 * listener and in the observer), so no CDP round trip is counted as latency.
 *
 * The first send of the run is reported separately as the COLD send — the panel
 * warms the function on open, but a container that has been idle can still be
 * starting when the first question arrives, and averaging that into the warm
 * figure would flatter every number after it.
 *
 * Usage:
 *   node scripts/testing/minivic_live_ttft.mjs [--url https://…] [--trials 5]
 */

import { chromium } from '@playwright/test';

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const URL_UNDER_TEST = arg('url', 'https://forgotten-mistory.web.app');
const TRIALS = Number(arg('trials', '5'));
const VIEWPORTS = [
  { label: '1440', width: 1440, height: 900 },
  { label: '390', width: 390, height: 844 },
];
const QUESTIONS = [
  'What did Vikram do at the ATO?',
  'How do you lead a squad?',
  'What is your strongest technical skill?',
  'Tell me about your delivery experience.',
  'What are you looking for in a role?',
  'Which repositories should I look at?',
];

const percentile = (values, p) => {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
};

async function openPanel(page) {
  await page.goto(URL_UNDER_TEST, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="minivic-toggle"]');
      return Boolean(btn) && Object.keys(btn).some((k) => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
    },
    { timeout: 60000 },
  );
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5));
  await page.waitForTimeout(500);
  await page.locator('[data-testid="minivic-toggle"]').evaluate((el) => el.click());
  const panel = page.locator('[data-testid="minivic-panel"]');
  await panel.waitFor({ state: 'visible', timeout: 30000 });
  // Mute: an unmuted reply also calls /api/tts, which is not what is being timed.
  const mute = panel.getByRole('button', { name: 'Mute voice' });
  if (await mute.count()) await mute.click();
  return panel;
}

async function installClock(page) {
  await page.evaluate(() => {
    window.__mv = { t0: 0, tFirst: 0, baseline: 0 };
    // Both listeners live on `document`, in the capture phase: React re-renders
    // the panel between sends, and a listener bound to the input element itself
    // stops firing the moment that element is replaced — which is what made an
    // earlier version of this script time out on the second trial.
    document.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Enter' && !window.__mv.t0) window.__mv.t0 = performance.now();
      },
      { capture: true },
    );
    new MutationObserver(() => {
      if (!window.__mv.t0 || window.__mv.tFirst) return;
      const bots = document.querySelectorAll('[data-minivic-message][data-minivic-role="bot"]');
      if (bots.length <= window.__mv.baseline) return;
      const text = (bots[bots.length - 1].textContent || '').trim();
      if (text.length > 0) window.__mv.tFirst = performance.now();
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  });
}

async function measureSend(page, panel, question) {
  await page.evaluate(() => {
    window.__mv.t0 = 0;
    window.__mv.tFirst = 0;
    window.__mv.baseline = document.querySelectorAll(
      '[data-minivic-message][data-minivic-role="bot"]',
    ).length;
  });
  const input = panel.locator('[data-testid="minivic-input"]');
  await input.fill(question);
  await input.press('Enter');
  await page.waitForFunction(() => window.__mv.tFirst > 0, { timeout: 30000 });
  const ms = await page.evaluate(() => window.__mv.tFirst - window.__mv.t0);
  // Let the reply finish before the next send, so a trial never overlaps.
  await page
    .waitForFunction(
      () => document.querySelectorAll('[data-testid="minivic-loading"]').length === 0,
      { timeout: 30000 },
    )
    .catch(() => {});
  return Math.round(ms);
}

const results = {};
// Same browser the suite uses on this host: the system Chrome channel
// (playwright.config.ts), with --no-sandbox because this runs as root on the VPS.
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });

async function oneTrial(viewport, question) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
  });
  const page = await context.newPage();
  const cspViolations = [];
  const pageErrors = [];
  const sends = [];
  page.on('console', (msg) => {
    if (/Content Security Policy|Refused to connect/i.test(msg.text())) cspViolations.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(String(err)));
  const classify = (request) => {
    if (request.method() !== 'POST') return null;
    const url = new URL(request.url());
    if (url.searchParams.has('warm')) return null;
    return url.hostname.endsWith('.run.app') ? 'origin' : url.pathname === '/api/chat' ? 'hosting' : null;
  };
  // Attribution is taken at REQUEST time and at RESPONSE headers, never at
  // `requestfinished`: an SSE reply's request does not finish until the last
  // frame, and this harness has already stopped the clock and closed the page by
  // then — an earlier version recorded "none" for every successful streamed send
  // because of exactly that.
  page.on('request', (r) => {
    const kind = classify(r);
    if (kind) sends.push(`${kind}:sent`);
  });
  page.on('response', (r) => {
    const kind = classify(r.request());
    if (kind) sends.push(`${kind}:${r.status()}`);
  });
  page.on('requestfailed', (r) => {
    const kind = classify(r);
    if (kind) sends.push(`${kind}:FAILED(${r.failure()?.errorText ?? '?'})`);
  });

  try {
    const panel = await openPanel(page);
    await installClock(page);
    const ms = await measureSend(page, panel, question);
    return { ms, routes: sends, csp: cspViolations, errors: pageErrors };
  } finally {
    await context.close();
  }
}

for (const viewport of VIEWPORTS) {
  const trials = [];
  const routes = [];
  const csp = [];
  const errors = [];
  for (let i = 0; i < TRIALS + 1; i += 1) {
    const trial = await oneTrial(viewport, QUESTIONS[i % QUESTIONS.length]);
    trials.push(trial.ms);
    routes.push(trial.routes.join('>') || 'none');
    csp.push(...trial.csp);
    errors.push(...trial.errors);
  }
  const [cold, ...warm] = trials;
  results[viewport.label] = {
    viewport: `${viewport.width}x${viewport.height}`,
    cold_ms: cold,
    warm_ms: warm,
    p50_ms: percentile(warm, 50),
    p95_ms: percentile(warm, 95),
    routes,
    csp_violations: csp,
    page_errors: errors,
  };
}

await browser.close();
console.log(
  JSON.stringify(
    { url: URL_UNDER_TEST, measured_at: new Date().toISOString(), trials: TRIALS, results },
    null,
    2,
  ),
);
