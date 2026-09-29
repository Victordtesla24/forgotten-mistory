/**
 * Finite adversarial matrix (HOURLY-EXECUTION-PLAN Step 4, C5 TestAuthor).
 *
 *   profiles (supported browsers) × 6 mechanisms × 12 scenarios
 *   mechanisms: Hero, About, Experience, Skills, Vitrine, Listen
 *   scenarios:  Cold/Warm reload, Deep anchors, Back/forward, Fast scroll, Remount,
 *               Hidden-tab/resume, Resize/orientation, Slow network, CPU/delayed hydration,
 *               Keyboard, Touch, Fallback/no-blank
 *   repeats:    1 for baseline scenarios, 3 (varied parameters) for timing/stress scenarios
 *
 * Every iteration attaches a `matrix-profile` JSON record (viewport, sequence, hidden
 * duration, network, CPU delay, result, measurements). `scripts/uiux/matrix_summary.mjs`
 * folds the Playwright JSON report into a per-cell table.
 *
 * Only Chromium is installed/configured in playwright.config.ts, so "supported browsers"
 * here are the Chromium desktop and Chromium mobile-emulation profiles. Firefox/WebKit
 * cells are reported PENDING by the summary script, never as passes.
 *
 * Targets production by default; override with PLAYWRIGHT_BASE_URL.
 */
import { expect, test, type Browser, type BrowserContext, type BrowserContextOptions, type Page, type TestInfo } from '@playwright/test';

const BASE = (process.env.PLAYWRIGHT_BASE_URL || 'https://forgotten-mistory.web.app').replace(/\/$/, '');

type Mechanism = { name: string; id: string; heading: string };
const MECHANISMS: Mechanism[] = [
  { name: 'Hero', id: 'hero', heading: '#hero-name' },
  { name: 'About', id: 'about', heading: '#about-title' },
  { name: 'Experience', id: 'experience', heading: '#experience-title' },
  { name: 'Skills', id: 'skills', heading: '#skills-title' },
  { name: 'Vitrine', id: 'vitrine', heading: '#vitrine-title' },
  { name: 'Listen', id: 'listen', heading: '#listen-title' },
];

type Profile = { name: string; options: BrowserContextOptions; mobile: boolean };
const PROFILES: Profile[] = [
  { name: 'chromium-desktop', mobile: false, options: { viewport: { width: 1280, height: 800 } } },
  {
    name: 'chromium-mobile',
    mobile: true,
    options: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true },
  },
];

type Scenario =
  | 'cold-warm-reload' | 'deep-anchor' | 'back-forward' | 'fast-scroll' | 'remount' | 'hidden-tab-resume'
  | 'resize-orientation' | 'slow-network' | 'cpu-delayed-hydration' | 'keyboard' | 'touch' | 'fallback-no-blank';

const STRESS: Scenario[] = ['back-forward', 'fast-scroll', 'remount', 'hidden-tab-resume', 'resize-orientation', 'slow-network', 'cpu-delayed-hydration'];
const BASELINE: Scenario[] = ['cold-warm-reload', 'deep-anchor', 'keyboard', 'touch', 'fallback-no-blank'];
const SCENARIOS: Scenario[] = [
  'cold-warm-reload', 'deep-anchor', 'back-forward', 'fast-scroll', 'remount', 'hidden-tab-resume',
  'resize-orientation', 'slow-network', 'cpu-delayed-hydration', 'keyboard', 'touch', 'fallback-no-blank',
];

type MatrixRecord = {
  profile: string; mechanism: string; scenario: Scenario; iteration: number; repeats: number;
  viewport: { width: number; height: number }; sequence: string[]; hiddenMs: number | null;
  network: string; cpuDelay: string; result: 'pass' | 'fail'; error?: string;
  measurements: { [k: string]: unknown }; pageErrors: string[]; consoleErrors: string[];
};

// ── helpers ────────────────────────────────────────────────────────────────

async function settle(page: Page, ms = 400) {
  await page.evaluate(() => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
  await page.waitForTimeout(ms);
}

function watch(page: Page, rec: MatrixRecord) {
  page.on('pageerror', (e) => rec.pageErrors.push(String(e.message).slice(0, 300)));
  page.on('console', (m) => { if (m.type() === 'error') rec.consoleErrors.push(m.text().slice(0, 300)); });
}

/** Section is rendered with content, not blank/transparent/collapsed. */
async function assertNonBlank(page: Page, m: Mechanism, rec: MatrixRecord, label: string) {
  const probe = await page.evaluate(({ id, heading }) => {
    const s = document.getElementById(id);
    const h = document.querySelector(heading) as HTMLElement | null;
    if (!s) return { exists: false } as const;
    const r = s.getBoundingClientRect();
    const hs = h ? getComputedStyle(h) : null;
    const hr = h ? h.getBoundingClientRect() : null;
    let op = 1;
    for (let el: HTMLElement | null = h; el; el = el.parentElement) op *= Number(getComputedStyle(el).opacity || 1);
    return {
      exists: true,
      height: Math.round(r.height), width: Math.round(r.width),
      textLen: (s.innerText || '').trim().length,
      sectionVisibility: getComputedStyle(s).visibility,
      headingVisible: !!hr && hr.width > 0 && hr.height > 0 && hs!.visibility !== 'hidden' && hs!.display !== 'none',
      headingEffectiveOpacity: Number(op.toFixed(2)),
    } as const;
  }, m);
  rec.measurements[`nonBlank:${label}`] = probe;
  expect(probe.exists, `${m.name} section exists (${label})`).toBe(true);
  if (!probe.exists) return;
  expect(probe.height, `${m.name} section has height (${label})`).toBeGreaterThan(100);
  expect(probe.textLen, `${m.name} section has text (${label})`).toBeGreaterThan(20);
  expect(probe.sectionVisibility, `${m.name} section visibility (${label})`).not.toBe('hidden');
  expect(probe.headingVisible, `${m.name} heading rendered (${label})`).toBe(true);
  expect(probe.headingEffectiveOpacity, `${m.name} heading effective opacity (${label})`).toBeGreaterThanOrEqual(0.5);
}

/** Anchor landed: section top sits near the top of the viewport (under the fixed header). */
async function assertAnchored(page: Page, m: Mechanism, rec: MatrixRecord, label: string) {
  const pos = await page.evaluate((id) => {
    const r = document.getElementById(id)!.getBoundingClientRect();
    return { top: Math.round(r.top), bottom: Math.round(r.bottom), vh: innerHeight, scrollY: Math.round(scrollY) };
  }, m.id);
  rec.measurements[`anchor:${label}`] = pos;
  expect(pos.top, `${m.name} top near viewport top (${label})`).toBeLessThanOrEqual(Math.round(pos.vh * 0.4));
  expect(pos.bottom, `${m.name} still intersects viewport (${label})`).toBeGreaterThan(0);
  if (m.id !== 'hero') expect(pos.top, `${m.name} not scrolled past (${label})`).toBeGreaterThanOrEqual(-40);
}

async function noHorizontalOverflow(page: Page, rec: MatrixRecord, label: string) {
  const o = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
  rec.measurements[`overflow:${label}`] = o;
  expect(o.sw, `document scrollWidth <= clientWidth (${label})`).toBeLessThanOrEqual(o.cw);
}

async function canvasCount(page: Page) {
  return page.evaluate(() => document.querySelectorAll('canvas').length);
}

async function rafAlive(page: Page) {
  return page.evaluate(() => new Promise<boolean>((r) => {
    const t = setTimeout(() => r(false), 1500);
    requestAnimationFrame(() => { clearTimeout(t); r(true); });
  }));
}

async function hashGo(page: Page, id: string) {
  await page.evaluate((h) => { location.hash = h; }, `#${id}`);
  await settle(page, 600);
}

async function newContext(browser: Browser, p: Profile, extra: BrowserContextOptions = {}) {
  return browser.newContext({ ...p.options, ...extra });
}

function newRecord(p: Profile, m: Mechanism, s: Scenario, iteration: number, repeats: number): MatrixRecord {
  return {
    profile: p.name, mechanism: m.name, scenario: s, iteration, repeats,
    viewport: { ...(p.options.viewport as { width: number; height: number }) },
    sequence: [], hiddenMs: null, network: 'unthrottled', cpuDelay: 'none', result: 'pass',
    measurements: {}, pageErrors: [], consoleErrors: [],
  };
}

async function runIteration(testInfo: TestInfo, rec: MatrixRecord, body: () => Promise<void>) {
  try {
    await body();
    expect(rec.pageErrors, 'no uncaught page errors').toEqual([]);
  } catch (e) {
    rec.result = 'fail';
    rec.error = String((e as Error).message || e).replace(/\u001b\[[0-9;]*m/g, '').slice(0, 600);
    throw e;
  } finally {
    await testInfo.attach('matrix-profile', { body: JSON.stringify(rec), contentType: 'application/json' });
  }
}

// ── scenario bodies ────────────────────────────────────────────────────────

type Ctx = { browser: Browser; p: Profile; m: Mechanism; rec: MatrixRecord; i: number };

const STRESS_PARAMS = {
  backForward: [{ other: 'listen', waitMs: 0 }, { other: 'about', waitMs: 250 }, { other: 'skills', waitMs: 1000 }],
  fastScroll: [10, 20, 40],
  remount: [1, 3, 5],
  hiddenMs: [500, 2000, 5000],
  network: [
    { name: 'fast-3g 150ms/1.6Mbps', latency: 150, down: 1.6e6 / 8, up: 750e3 / 8 },
    { name: 'regular-3g 300ms/750kbps', latency: 300, down: 750e3 / 8, up: 250e3 / 8 },
    { name: 'fast-3g 150ms/1.6Mbps +cache-disabled', latency: 150, down: 1.6e6 / 8, up: 750e3 / 8, noCache: true },
  ],
  cpu: [{ rate: 2, jsDelay: 1000 }, { rate: 4, jsDelay: 2000 }, { rate: 6, jsDelay: 3000 }],
};

function resizeSequence(p: Profile, i: number) {
  const d = [
    [{ width: 1280, height: 800 }, { width: 768, height: 1024 }, { width: 1280, height: 800 }],
    [{ width: 1280, height: 800 }, { width: 1024, height: 600 }, { width: 1440, height: 900 }, { width: 1280, height: 800 }],
    [{ width: 1280, height: 800 }, { width: 600, height: 800 }, { width: 1920, height: 1080 }, { width: 1280, height: 800 }],
  ];
  const mob = [
    [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 390, height: 844 }],
    [{ width: 390, height: 844 }, { width: 360, height: 740 }, { width: 740, height: 360 }, { width: 390, height: 844 }],
    [{ width: 390, height: 844 }, { width: 844, height: 390 }, { width: 414, height: 896 }, { width: 896, height: 414 }, { width: 390, height: 844 }],
  ];
  return (p.mobile ? mob : d)[i];
}

async function withPage(c: Ctx, fn: (page: Page, ctx: BrowserContext) => Promise<void>, extra: BrowserContextOptions = {}) {
  const ctx = await newContext(c.browser, c.p, extra);
  const page = await ctx.newPage();
  watch(page, c.rec);
  try { await fn(page, ctx); } finally { await ctx.close(); }
}

const BODIES: { [K in Scenario]: (c: Ctx) => Promise<void> } = {
  'cold-warm-reload': (c) => withPage(c, async (page) => {
    c.rec.sequence = [`cold goto /#${c.m.id}`, 'reload (warm cache)'];
    await page.goto(`${BASE}/#${c.m.id}`, { waitUntil: 'load' });
    await settle(page, 800);
    await assertAnchored(page, c.m, c.rec, 'cold');
    await assertNonBlank(page, c.m, c.rec, 'cold');
    await page.reload({ waitUntil: 'load' });
    await settle(page, 800);
    await assertNonBlank(page, c.m, c.rec, 'warm');
    await assertAnchored(page, c.m, c.rec, 'warm');
  }),

  'deep-anchor': (c) => withPage(c, async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await settle(page);
    // The nav links live in the overlay at every width; open it first.
    const link = page.locator(`#site-nav-overlay a[href="#${c.m.id}"]`);
    c.rec.sequence = ['goto /', 'open .menu-toggle', `click #site-nav-overlay a[href=#${c.m.id}]`];
    await page.locator('.menu-toggle').click();
    await settle(page, 400);
    const visible = link.filter({ visible: true }).first();
    await expect(visible, 'nav link for mechanism is visible').toBeVisible();
    await visible.click();
    await settle(page, 1200);
    await assertAnchored(page, c.m, c.rec, 'nav-link');
    await assertNonBlank(page, c.m, c.rec, 'nav-link');
    c.rec.measurements.hashAfterClick = await page.evaluate(() => location.hash);
    // Direct deep link from a fresh document as well.
    c.rec.sequence.push(`goto /#${c.m.id} (fresh document)`);
    await page.goto(`${BASE}/?deep=1#${c.m.id}`, { waitUntil: 'load' });
    await settle(page, 1000);
    await assertAnchored(page, c.m, c.rec, 'direct');
    await assertNonBlank(page, c.m, c.rec, 'direct');
  }),

  'back-forward': (c) => withPage(c, async (page) => {
    const { other, waitMs } = STRESS_PARAMS.backForward[c.i];
    const start = c.m.id === 'hero' ? 'about' : 'hero';
    const o = other === c.m.id ? 'hero' : other;
    c.rec.sequence = [`goto /#${start}`, `hash #${c.m.id}`, `hash #${o}`, `wait ${waitMs}`, 'back', 'forward', 'back'];
    c.rec.measurements.waitMs = waitMs;
    await page.goto(`${BASE}/#${start}`, { waitUntil: 'load' });
    await settle(page);
    await hashGo(page, c.m.id);
    await hashGo(page, o);
    await page.waitForTimeout(waitMs);
    await page.goBack();
    await settle(page, 800);
    expect(await page.evaluate(() => location.hash)).toBe(`#${c.m.id}`);
    await assertAnchored(page, c.m, c.rec, 'back');
    await assertNonBlank(page, c.m, c.rec, 'back');
    await page.goForward();
    await settle(page, 800);
    expect(await page.evaluate(() => location.hash)).toBe(`#${o}`);
    await page.goBack();
    await settle(page, 800);
    await assertAnchored(page, c.m, c.rec, 'back-2');
    await assertNonBlank(page, c.m, c.rec, 'back-2');
  }),

  'fast-scroll': (c) => withPage(c, async (page) => {
    const jumps = STRESS_PARAMS.fastScroll[c.i];
    c.rec.sequence = ['goto /', `${jumps} un-awaited scroll jumps top↔bottom`, `scrollIntoView #${c.m.id}`];
    await page.goto(`${BASE}/`, { waitUntil: 'load' });
    await settle(page);
    const baseCanvas = await canvasCount(page);
    await page.evaluate(async (n) => {
      const max = document.documentElement.scrollHeight;
      for (let k = 0; k < n; k++) {
        window.scrollTo(0, (k % 2 ? 0.1 : 0.9) * max * ((k % 5) + 1) / 5);
        await new Promise((r) => setTimeout(r, 16));
      }
    }, jumps);
    await page.evaluate((id) => document.getElementById(id)!.scrollIntoView({ block: 'start' }), c.m.id);
    await settle(page, 1000);
    await assertNonBlank(page, c.m, c.rec, 'after-fast-scroll');
    const cc = await canvasCount(page);
    c.rec.measurements.canvas = { before: baseCanvas, after: cc };
    expect(cc, 'canvas contexts bounded (≤1 per section)').toBeLessThanOrEqual(6);
    expect(await rafAlive(page), 'rAF alive after fast scroll').toBe(true);
  }),

  remount: (c) => withPage(c, async (page) => {
    const cycles = STRESS_PARAMS.remount[c.i];
    c.rec.sequence = [`goto /#${c.m.id}`, `${cycles}× (scroll far away → back into view)`];
    await page.goto(`${BASE}/#${c.m.id}`, { waitUntil: 'load' });
    await settle(page, 800);
    const counts: number[] = [await canvasCount(page)];
    for (let k = 0; k < cycles; k++) {
      await page.evaluate((id) => {
        const far = id === 'hero' || id === 'about' ? document.documentElement.scrollHeight : 0;
        window.scrollTo(0, far);
      }, c.m.id);
      await settle(page, 500);
      await page.evaluate((id) => document.getElementById(id)!.scrollIntoView({ block: 'start' }), c.m.id);
      await settle(page, 700);
      counts.push(await canvasCount(page));
      await assertNonBlank(page, c.m, c.rec, `remount-${k + 1}`);
    }
    c.rec.measurements.canvasCounts = counts;
    expect(Math.max(...counts), 'canvas count does not grow across remounts').toBeLessThanOrEqual(Math.max(counts[0], 1) + 1);
    expect(Math.max(...counts)).toBeLessThanOrEqual(6);
  }),

  'hidden-tab-resume': (c) => withPage(c, async (page) => {
    const hidden = STRESS_PARAMS.hiddenMs[c.i];
    c.rec.hiddenMs = hidden;
    c.rec.sequence = [`goto /#${c.m.id}`, 'visibilitychange→hidden + CDP lifecycle frozen', `wait ${hidden}ms`, 'lifecycle active + visibilitychange→visible'];
    await page.goto(`${BASE}/#${c.m.id}`, { waitUntil: 'load' });
    await settle(page, 800);
    const y0 = await page.evaluate(() => scrollY);
    const cdp = await page.context().newCDPSession(page);
    const setVis = (state: 'hidden' | 'visible') => page.evaluate((s) => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => s });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => s === 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    }, state);
    await setVis('hidden');
    await cdp.send('Page.setWebLifecycleState', { state: 'frozen' });
    await page.waitForTimeout(hidden);
    await cdp.send('Page.setWebLifecycleState', { state: 'active' });
    await setVis('visible');
    await settle(page, 800);
    const y1 = await page.evaluate(() => scrollY);
    c.rec.measurements.scrollDrift = Math.abs(y1 - y0);
    expect(await rafAlive(page), 'rAF resumes').toBe(true);
    expect(Math.abs(y1 - y0), 'scroll position preserved across hide/resume').toBeLessThanOrEqual(50);
    await assertNonBlank(page, c.m, c.rec, 'resumed');
  }),

  'resize-orientation': (c) => withPage(c, async (page) => {
    const seq = resizeSequence(c.p, c.i);
    c.rec.sequence = [`goto /#${c.m.id}`, ...seq.map((v) => `resize ${v.width}x${v.height}`), `scrollIntoView #${c.m.id}`];
    await page.goto(`${BASE}/#${c.m.id}`, { waitUntil: 'load' });
    await settle(page, 600);
    for (const vp of seq) {
      await page.setViewportSize(vp);
      await settle(page, 350);
      await noHorizontalOverflow(page, c.rec, `${vp.width}x${vp.height}`);
      await assertNonBlank(page, c.m, c.rec, `${vp.width}x${vp.height}`);
    }
    await page.evaluate((id) => document.getElementById(id)!.scrollIntoView({ block: 'start' }), c.m.id);
    await settle(page, 600);
    await assertAnchored(page, c.m, c.rec, 'after-resize');
  }),

  'slow-network': (c) => withPage(c, async (page) => {
    const n = STRESS_PARAMS.network[c.i];
    c.rec.network = n.name;
    c.rec.sequence = [`CDP Network.emulateNetworkConditions ${n.name}`, `goto /#${c.m.id} (domcontentloaded)`, 'check no-blank', 'wait load', 'check anchor + no-blank'];
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.enable');
    if ((n as { noCache?: boolean }).noCache) await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: n.latency, downloadThroughput: n.down, uploadThroughput: n.up });
    const t0 = Date.now();
    await page.goto(`${BASE}/#${c.m.id}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    c.rec.measurements.dclMs = Date.now() - t0;
    await assertNonBlank(page, c.m, c.rec, 'dcl');
    await page.waitForLoadState('load', { timeout: 120000 });
    c.rec.measurements.loadMs = Date.now() - t0;
    await settle(page, 1000);
    await assertAnchored(page, c.m, c.rec, 'load');
    await assertNonBlank(page, c.m, c.rec, 'load');
  }),

  'cpu-delayed-hydration': (c) => withPage(c, async (page) => {
    const { rate, jsDelay } = STRESS_PARAMS.cpu[c.i];
    c.rec.cpuDelay = `CPU ${rate}x throttle + ${jsDelay}ms delay on every script`;
    c.rec.sequence = [`CDP setCPUThrottlingRate ${rate}`, `route: delay scripts ${jsDelay}ms`, `goto /#${c.m.id}`, 'check pre-hydration no-blank', 'wait load', 'check anchor + no-blank + rAF'];
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate });
    await page.route('**/*', async (route) => {
      if (route.request().resourceType() === 'script') await new Promise((r) => setTimeout(r, jsDelay));
      await route.continue();
    });
    await page.goto(`${BASE}/#${c.m.id}`, { waitUntil: 'domcontentloaded', timeout: 90000 });
    await assertNonBlank(page, c.m, c.rec, 'pre-hydration');
    await page.waitForLoadState('load', { timeout: 120000 });
    await settle(page, 1500);
    await assertAnchored(page, c.m, c.rec, 'hydrated');
    await assertNonBlank(page, c.m, c.rec, 'hydrated');
    expect(await rafAlive(page), 'rAF alive after delayed hydration').toBe(true);
  }),

  keyboard: (c) => withPage(c, async (page) => {
    c.rec.sequence = [`goto /#${c.m.id}`, 'keyboard modality', 'focus first focusable in section', 'Tab ×≤6 inside section'];
    await page.goto(`${BASE}/#${c.m.id}`, { waitUntil: 'load' });
    await settle(page, 800);
    await page.keyboard.press('Shift');
    const ok = await page.evaluate((id) => {
      const f = document.querySelector<HTMLElement>(`#${id} a[href], #${id} button:not([disabled]), #${id} input, #${id} textarea, #${id} select, #${id} [tabindex]:not([tabindex="-1"])`);
      if (!f) return false;
      f.focus();
      return document.activeElement === f;
    }, c.m.id);
    expect(ok, 'section has a keyboard-focusable control').toBe(true);
    const stops: unknown[] = [];
    for (let k = 0; k < 6; k++) {
      const s = await page.evaluate((id) => {
        const el = document.activeElement as HTMLElement;
        const inSection = !!el.closest(`#${id}`);
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const indicator = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
        return {
          tag: el.tagName, label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 40),
          inSection, inViewport: r.bottom > 0 && r.top < innerHeight && r.width > 0, indicator,
          focusVisible: el.matches(':focus-visible'),
        };
      }, c.m.id);
      stops.push(s);
      if (!s.inSection) break;
      expect(s.inViewport, `focused ${s.tag} "${s.label}" scrolled into view`).toBe(true);
      expect(s.indicator, `focused ${s.tag} "${s.label}" shows a focus indicator`).toBe(true);
      await page.keyboard.press('Tab');
      await page.waitForTimeout(120);
    }
    c.rec.measurements.focusStops = stops;
    if (c.m.id === 'vitrine') {
      // Repair guard: ArrowRight on a nested stage button keeps focus (C4-NESTED-FOCUS).
      const stage = page.locator('#vitrine [data-testid="mechanism-diagram"] button').first();
      await stage.focus();
      await stage.press('ArrowRight');
      await expect(stage).toBeFocused();
      c.rec.sequence.push('Vitrine stage ArrowRight keeps focus');
    }
  }),

  touch: (c) => withPage(c, async (page) => {
    c.rec.sequence = [`goto /#${c.m.id}`, 'tap first visible <button> in section', 'Escape', 'check no-blank + target size'];
    await page.goto(`${BASE}/#${c.m.id}`, { waitUntil: 'load' });
    await settle(page, 800);
    const btn = page.locator(`#${c.m.id} button`).filter({ visible: true }).first();
    const hasBtn = (await btn.count()) > 0;
    let target = page.locator(`#${c.m.id} a[href^="#"], #${c.m.id} a[href^="mailto"]`).filter({ visible: true }).first();
    if (hasBtn) target = btn;
    await target.scrollIntoViewIfNeeded();
    const box = await target.boundingBox();
    c.rec.measurements.tapTarget = { kind: hasBtn ? 'button' : 'anchor', box };
    expect(box, 'tap target has a box').not.toBeNull();
    expect(Math.min(box!.width, box!.height), 'tap target ≥ 24 CSS px (WCAG 2.5.8)').toBeGreaterThanOrEqual(24);
    if (c.m.id === 'vitrine') {
      const stage = page.locator('#vitrine [data-testid="mechanism-diagram"] button').nth(1);
      await stage.scrollIntoViewIfNeeded();
      await stage.tap();
      await expect(stage, 'aria-pressed follows tap (C4-STAGE-STATE)').toHaveAttribute('aria-pressed', 'true');
    } else {
      await target.tap();
    }
    await settle(page, 600);
    await page.keyboard.press('Escape');
    await settle(page, 300);
    await assertNonBlank(page, c.m, c.rec, 'after-tap');
  }, { hasTouch: true }),

  'fallback-no-blank': (c) => withPage(c, async (page) => {
    c.rec.sequence = ['javaScriptEnabled=false', 'reducedMotion=reduce', `goto /#${c.m.id}`, 'check no-blank'];
    await page.goto(`${BASE}/#${c.m.id}`, { waitUntil: 'load' });
    // No settle(): with script execution disabled, an evaluate() awaiting rAF tears down the
    // utility context ("Execution context was destroyed") — a harness artifact, not a product defect.
    // Entry fades are CSS-only and still run without JS (reduced motion swaps rise→fade). A
    // blank *transient* is allowed; the section must reach visible within a 3 s budget.
    const t0 = Date.now();
    let op = 0;
    while (Date.now() - t0 < 3000) {
      op = await page.evaluate((sel) => {
        let o = 1;
        for (let e = document.querySelector(sel) as HTMLElement | null; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity || 1);
        return o;
      }, c.m.heading);
      if (op >= 0.99) break;
      await page.waitForTimeout(100);
    }
    c.rec.measurements.msToOpaqueAfterLoad = Date.now() - t0;
    c.rec.measurements.headingOpacityAtBudget = Number(op.toFixed(2));
    await assertNonBlank(page, c.m, c.rec, 'no-js');
    if (c.m.id === 'experience') {
      const scales = await page.locator('#experience [class*="trackBar"]').evaluateAll((ns) => ns.map((n) => {
        const t = getComputedStyle(n).transform;
        return t === 'none' ? 1 : new DOMMatrixReadOnly(t).a;
      }));
      c.rec.measurements.trackBarScaleX = scales;
      expect(scales.length, 'SSR bars present (C4-SSR-BARS)').toBe(8);
      for (const s of scales) expect(s, 'SSR bar not collapsed').toBeGreaterThanOrEqual(0.95);
    }
  }, { javaScriptEnabled: false, reducedMotion: 'reduce' }),
};

// ── matrix generation ──────────────────────────────────────────────────────

for (const p of PROFILES) {
  test.describe(`matrix ${p.name}`, () => {
    for (const s of SCENARIOS) {
      const repeats = STRESS.includes(s) ? 3 : 1;
      for (const m of MECHANISMS) {
        test(`[${p.name}] ${m.name} × ${s} ×${repeats}`, async ({ browser }, testInfo) => {
          test.setTimeout(s === 'slow-network' || s === 'cpu-delayed-hydration' ? 420000 : 180000);
          testInfo.annotations.push({ type: 'matrix', description: JSON.stringify({ profile: p.name, mechanism: m.name, scenario: s, repeats, kind: BASELINE.includes(s) ? 'baseline' : 'stress' }) });
          const failures: string[] = [];
          for (let i = 0; i < repeats; i++) {
            const rec = newRecord(p, m, s, i + 1, repeats);
            try {
              await runIteration(testInfo, rec, () => BODIES[s]({ browser, p, m, rec, i }));
            } catch {
              failures.push(`iter ${i + 1}: ${rec.error}`);
            }
          }
          expect(failures, `${failures.length}/${repeats} iterations failed`).toEqual([]);
        });
      }
    }
  });
}
