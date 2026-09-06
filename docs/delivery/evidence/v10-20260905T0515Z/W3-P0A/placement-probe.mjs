/**
 * ADV rev7 F-2/F-3/F-4 instrumentation: what placeMiniVicPanel is handed, what
 * it returns, and what the DOM actually applies. Read-only — it opens the panel
 * with a synthetic click (like tests/e2e/chatbot.spec.ts) and reports rects.
 *
 *   node docs/delivery/evidence/v10-20260905T0515Z/W3-P0A/placement-probe.mjs
 *
 * BASE defaults to the local static export on :5605.
 */
import { chromium } from '@playwright/test';

const BASE = process.env.PROBE_BASE_URL ?? 'http://127.0.0.1:5605';
const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1366, height: 768 },
  { width: 1280, height: 800 },
  { width: 834, height: 1194 },
  { width: 390, height: 844 },
];

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
const out = [];
for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: vp });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => {
    const btn = document.querySelector('[data-testid="minivic-toggle"]');
    return !!btn && Object.keys(btn).some((k) => k.startsWith('__reactFiber') || k.startsWith('__reactProps'));
  }, { timeout: 30000 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.evaluate(() => document.querySelector('[data-testid="minivic-toggle"]').click());
  await page.waitForSelector('[data-testid="minivic-panel"]', { timeout: 15000 });
  await page.waitForTimeout(2500);

  const measured = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="minivic-panel"]');
    const p = panel.getBoundingClientRect();
    const h1 = document.querySelector('#hero h1');
    const rects = [];
    if (h1) {
      const walk = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walk.nextNode())) {
        if (!(node.nodeValue || '').trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of Array.from(range.getClientRects())) {
          if (r.width < 0.5 || r.height < 0.5) continue;
          rects.push({ l: +r.left.toFixed(1), t: +r.top.toFixed(1), r: +r.right.toFixed(1), b: +r.bottom.toFixed(1) });
        }
      }
    }
    const run = rects.length
      ? {
          l: Math.min(...rects.map((r) => r.l)),
          t: Math.min(...rects.map((r) => r.t)),
          r: Math.max(...rects.map((r) => r.r)),
          b: Math.max(...rects.map((r) => r.b)),
        }
      : null;
    const nav = document.querySelector('nav');
    const composer = document.querySelector('[data-testid="minivic-input"]');
    const c = composer ? composer.getBoundingClientRect() : null;
    const cs = getComputedStyle(panel);
    return {
      panel: { l: +p.left.toFixed(1), t: +p.top.toFixed(1), r: +p.right.toFixed(1), b: +p.bottom.toFixed(1), w: +p.width.toFixed(1), h: +p.height.toFixed(1) },
      inlineStyle: panel.getAttribute('style'),
      computed: { width: cs.width, height: cs.height, maxHeight: cs.maxHeight, right: cs.right, bottom: cs.bottom, position: cs.position },
      rectCount: rects.length,
      rects,
      run,
      navBottom: nav ? +nav.getBoundingClientRect().bottom.toFixed(1) : null,
      composer: c ? { l: +c.left.toFixed(1), t: +c.top.toFixed(1), r: +c.right.toFixed(1), b: +c.bottom.toFixed(1), w: +c.width.toFixed(1), h: +c.height.toFixed(1) } : null,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
    };
  });

  const { panel, run, composer } = measured;
  const separation = run
    ? Math.max(run.l - panel.r, panel.l - run.r, panel.t - run.b, run.t - panel.b)
    : null;
  out.push({
    viewport: `${vp.width}x${vp.height}`,
    ...measured,
    separation: separation === null ? null : +separation.toFixed(1),
    margins: {
      left: +panel.l.toFixed(1),
      top: +panel.t.toFixed(1),
      right: +(measured.innerWidth - panel.r).toFixed(1),
      bottom: +(measured.innerHeight - panel.b).toFixed(1),
    },
    composerInsidePanel: composer
      ? composer.t >= panel.t - 0.5 && composer.b <= panel.b + 0.5 && composer.l >= panel.l - 0.5 && composer.r <= panel.r + 0.5
      : null,
  });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
