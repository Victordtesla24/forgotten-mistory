// Reviewer probe — G-MV1 on production (t_rev_mv1_v3, docs/prompt.md §5 3rd-party adversarial review).
// Runs against https://forgotten-mistory.web.app/ with system Chrome, one browser at a time.
// Usage (from the worktree root so node_modules resolves):
//   node docs/delivery/evidence/v10-20260905T0515Z/G-REV/c3cb77c5/08-probe-g-mv1.mjs
// (dispatched against 4fd8b98e; live had moved to c3cb77c5 before the probe, so it is filed there)
// Writes 08-probe-g-mv1.json and captures/ beside itself. Persistent-profile dir comes from
// PROBE_PROFILE_DIR (a scratch path outside the repo) and is the caller's to remove.
import { chromium } from 'playwright';
import pngjs from 'pngjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { PNG } = pngjs;
const HERE = path.dirname(fileURLToPath(import.meta.url));
const CAPTURES = path.join(HERE, 'captures');
fs.mkdirSync(CAPTURES, { recursive: true });

const TARGET = process.env.TARGET || 'https://forgotten-mistory.web.app/';
const PROFILE_DIR =
  process.env.PROBE_PROFILE_DIR || path.join(os.tmpdir(), 'g-mv1-persistent-profile');
const LAUNCH = {
  channel: 'chrome',
  headless: true,
  args: ['--no-sandbox', '--disable-lcd-text', '--disable-dev-shm-usage'],
};
const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 640, height: 900 },
  { width: 834, height: 1194 },
  { width: 1440, height: 900 },
];
const PHONE = new Set([390, 640]);
const AA = 4.5;
const GOLD = [201, 168, 76]; // --gold #c9a84c (app/globals.css)

// ── colour maths ─────────────────────────────────────────────────────────────
const srgb = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const contrast = (a, b) => {
  const l1 = lum(a);
  const l2 = lum(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
const parseRgb = (s) => {
  const m = String(s).match(
    /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.%]+))?\s*\)/,
  );
  if (!m) return null;
  const a =
    m[4] === undefined ? 1 : m[4].endsWith('%') ? Number(m[4].slice(0, -1)) / 100 : Number(m[4]);
  return { r: +m[1], g: +m[2], b: +m[3], a };
};
const isGoldish = (r, g, b) =>
  Math.abs(r - GOLD[0]) <= 24 && Math.abs(g - GOLD[1]) <= 24 && Math.abs(b - GOLD[2]) <= 24;
const isGrey = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b) <= 6;
const median = (arr) => {
  const s = [...arr].sort((x, y) => x - y);
  const n = s.length;
  if (!n) return null;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
};
const medianRgb = (px) =>
  px.length ? [median(px.map((p) => p[0])), median(px.map((p) => p[1])), median(px.map((p) => p[2]))] : null;
const round = (v) => (typeof v === 'number' ? Math.round(v * 100) / 100 : v);
const roundRect = (r) =>
  r ? Object.fromEntries(Object.entries(r).map(([k, v]) => [k, round(v)])) : r;
const intersects = (a, b) =>
  !!a && !!b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

// ── page readers ─────────────────────────────────────────────────────────────
async function waitHydrated(page) {
  await page.waitForFunction(
    () => {
      const btn = document.querySelector('[data-testid="minivic-toggle"]');
      return (
        !!btn &&
        Object.keys(btn).some((k) => k.startsWith('__reactFiber') || k.startsWith('__reactProps'))
      );
    },
    null,
    { timeout: 30000 },
  );
}

async function readLabel(page) {
  return page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    };
    const chainOpacity = (el) => {
      let o = 1;
      let n = el;
      while (n && n !== document.documentElement) {
        o *= parseFloat(getComputedStyle(n).opacity) || 0;
        n = n.parentElement;
      }
      return o;
    };
    const button =
      document.querySelector('[data-testid="minivic-toggle"]') ||
      Array.from(document.querySelectorAll('button')).find((b) =>
        /mini ?vic/i.test(b.getAttribute('aria-label') || b.textContent || ''),
      );
    const label = document.querySelector('[data-testid="minivic-launcher-label"]');
    const disc = document.querySelector('.minivic-launcher__disc');
    const dock = document.querySelector('.minivic-dock');
    if (!button) return { present: false };
    const lcs = label ? getComputedStyle(label) : null;
    const lr = rect(label);
    const br = rect(button);
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const inViewport = (r) => !!r && r.left >= 0 && r.top >= 0 && r.right <= vw && r.bottom <= vh;
    const hit = (r) => {
      if (!r) return null;
      const el = document.elementFromPoint((r.left + r.right) / 2, (r.top + r.bottom) / 2);
      return el
        ? { tag: el.tagName.toLowerCase(), testid: el.getAttribute('data-testid'), cls: String(el.className || '').slice(0, 60), insideLauncher: button.contains(el) }
        : null;
    };
    return {
      present: true,
      accessibleName: button.getAttribute('aria-label'),
      ariaExpanded: button.getAttribute('aria-expanded'),
      dock: dock
        ? {
            opacity: parseFloat(getComputedStyle(dock).opacity),
            pointerEvents: getComputedStyle(dock).pointerEvents,
            pastHero: dock.getAttribute('data-past-hero'),
          }
        : null,
      button: { rect: br, effectiveOpacity: chainOpacity(button), hit: hit(br) },
      disc: { rect: rect(disc) },
      label: label
        ? {
            text: (label.textContent || '').replace(/\s+/g, ' ').trim(),
            display: lcs.display,
            visibility: lcs.visibility,
            ownOpacity: parseFloat(lcs.opacity),
            effectiveOpacity: chainOpacity(label),
            color: lcs.color,
            backgroundColor: lcs.backgroundColor,
            borderColor: lcs.borderTopColor,
            fontSize: lcs.fontSize,
            fontFamily: lcs.fontFamily.slice(0, 60),
            rect: lr,
            inViewport: inViewport(lr),
            hit: hit(lr),
            ariaHidden: label.getAttribute('aria-hidden'),
          }
        : null,
      scrollY: window.scrollY,
      viewport: { width: vw, height: vh },
    };
  });
}

async function foldGeometry(page) {
  return page.evaluate(() => {
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
    };
    const hero = document.getElementById('hero');
    const portraitEl =
      document.querySelector('[data-testid="hero-portrait"]') ||
      (hero && (hero.querySelector('figure') || hero.querySelector('img')));
    let actionsEl = document.querySelector('[data-testid="hero-actions"]');
    if (!actionsEl && hero) {
      const first = hero.querySelector('a, button');
      actionsEl = first ? first.parentElement : null;
    }
    const dock = document.querySelector('.minivic-dock');
    let painted = dock ? 1 : 0;
    let n = dock;
    while (n && n !== document.documentElement) {
      painted *= parseFloat(getComputedStyle(n).opacity) || 0;
      n = n.parentElement;
    }
    return {
      scrollY: window.scrollY,
      painted,
      dockPointerEvents: dock ? getComputedStyle(dock).pointerEvents : null,
      launcher: rect(document.querySelector('[data-testid="minivic-toggle"]')),
      portrait: rect(portraitEl),
      portraitSelector: portraitEl
        ? portraitEl.getAttribute('data-testid') === 'hero-portrait'
          ? '[data-testid="hero-portrait"]'
          : `#hero ${portraitEl.tagName.toLowerCase()} (fallback)`
        : null,
      actions: rect(actionsEl),
      actionsSelector: actionsEl
        ? actionsEl.getAttribute('data-testid') === 'hero-actions'
          ? '[data-testid="hero-actions"]'
          : '#hero first a/button parent (fallback)'
        : null,
    };
  });
}

async function scrollToPaint(page, step) {
  let steps = 0;
  let painted = 0;
  for (; steps < 12; steps += 1) {
    painted = await page.evaluate(() => {
      const dock = document.querySelector('.minivic-dock');
      let o = dock ? 1 : 0;
      let n = dock;
      while (n && n !== document.documentElement) {
        o *= parseFloat(getComputedStyle(n).opacity) || 0;
        n = n.parentElement;
      }
      return o;
    });
    if (painted > 0.9) break;
    await page.evaluate((h) => window.scrollBy(0, h), step);
    await page.waitForTimeout(400);
  }
  await page.waitForTimeout(500); // let the 300ms opacity transition settle
  const scrollY = await page.evaluate(() => window.scrollY);
  return { steps, scrollY, painted };
}

function clampClip(r, vw, vh, pad = 0) {
  const x = Math.max(0, Math.floor(r.left - pad));
  const y = Math.max(0, Math.floor(r.top - pad));
  const right = Math.min(vw, Math.ceil(r.right + pad));
  const bottom = Math.min(vh, Math.ceil(r.bottom + pad));
  return { x, y, width: Math.max(1, right - x), height: Math.max(1, bottom - y) };
}

// Composited-pixel sample of the label: ground = median of the darkest 30 %, text = median of
// the lightest 5 % (glyph cores), plus what the pill floats over (a ring 8 px outside it).
async function samplePixels(page, labelRect, vw, vh, file) {
  const pad = 8;
  const clip = clampClip(labelRect, vw, vh, pad);
  const buf = await page.screenshot({ clip, type: 'png', animations: 'disabled', caret: 'hide' });
  fs.writeFileSync(file, buf);
  const png = PNG.sync.read(buf);
  const inner = [];
  const ring = [];
  let goldish = 0;
  let nonGrey = 0;
  for (let y = 0; y < png.height; y += 1) {
    for (let x = 0; x < png.width; x += 1) {
      const i = (png.width * y + x) << 2;
      const p = [png.data[i], png.data[i + 1], png.data[i + 2]];
      const ax = clip.x + x + 0.5;
      const ay = clip.y + y + 0.5;
      const insidePill =
        ax >= labelRect.left && ax <= labelRect.right && ay >= labelRect.top && ay <= labelRect.bottom;
      if (insidePill) {
        inner.push(p);
        if (isGoldish(...p)) goldish += 1;
        if (!isGrey(...p)) nonGrey += 1;
      } else {
        ring.push(p);
      }
    }
  }
  const byLum = [...inner].sort((a, b) => lum(a) - lum(b));
  const darkest = byLum.slice(0, Math.max(1, Math.floor(byLum.length * 0.3)));
  const lightest = byLum.slice(Math.max(0, byLum.length - Math.max(1, Math.floor(byLum.length * 0.05))));
  const ground = medianRgb(darkest);
  const text = medianRgb(lightest);
  const peak = byLum[byLum.length - 1];
  const ringByLum = [...ring].sort((a, b) => lum(a) - lum(b));
  return {
    file: path.relative(HERE, file),
    clip,
    pixels: inner.length,
    ground: { median: ground, min: darkest[0], max: darkest[darkest.length - 1] },
    text: { median: text, peak },
    contrastSampled: round(contrast(ground, text)),
    contrastGroundVsPeak: round(contrast(ground, peak)),
    goldishPixels: goldish,
    nonGreyPixels: nonGrey,
    surroundings: ring.length
      ? {
          pixels: ring.length,
          median: medianRgb(ring),
          brightest: ringByLum[ringByLum.length - 1],
          darkest: ringByLum[0],
        }
      : null,
  };
}

// ── per-viewport probe (fresh context, no storage) ───────────────────────────
async function probeViewport(browser, vp) {
  const context = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const pageerrors = [];
  const consoleErrors = [];
  const failedRequests = [];
  page.on('pageerror', (e) => pageerrors.push(String(e?.message || e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
  });
  page.on('requestfailed', (r) => failedRequests.push(`${r.url()} ${r.failure()?.errorText || ''}`.slice(0, 200)));
  const t0 = Date.now();
  const resp = await page.goto(TARGET, { waitUntil: 'load', timeout: 60000 });
  await waitHydrated(page);
  await page.waitForTimeout(800);
  const buildCommit = await page.evaluate(
    () => document.querySelector('meta[name="build-commit"]')?.getAttribute('content') || null,
  );

  // Initial, docked, no interaction.
  const initialGeometry = await foldGeometry(page);
  const initialLabel = await readLabel(page);
  const foldFile = path.join(CAPTURES, `fold-${vp.width}-initial.jpg`);
  if (PHONE.has(vp.width)) {
    await page.screenshot({ path: foldFile, type: 'jpeg', quality: 60, animations: 'disabled' });
  }

  // Scroll until the dock paints (the pastHero gate), then read the painted launcher.
  const paint = await scrollToPaint(page, vp.height);
  const painted = await readLabel(page);
  const paintedGeometry = await foldGeometry(page);
  let sample = null;
  let launcherCapture = null;
  if (painted.present && painted.button.rect) {
    const clip = clampClip(painted.button.rect, vp.width, vp.height, 16);
    launcherCapture = path.join(CAPTURES, `launcher-${vp.width}-painted.png`);
    await page.screenshot({ path: launcherCapture, clip, type: 'png', animations: 'disabled' });
    if (painted.label && painted.label.rect && painted.label.rect.width > 0) {
      sample = await samplePixels(
        page,
        painted.label.rect,
        vp.width,
        vp.height,
        path.join(CAPTURES, `label-${vp.width}-clip.png`),
      );
    }
  }
  await context.close();

  const L = painted.label;
  const B = painted.button;
  const colour = L ? parseRgb(L.color) : null;
  const plate = L ? parseRgb(L.backgroundColor) : null;
  const border = L ? parseRgb(L.borderColor) : null;
  const computedContrast = colour && plate ? round(contrast([colour.r, colour.g, colour.b], [plate.r, plate.g, plate.b])) : null;

  const verdicts = {};
  if (PHONE.has(vp.width)) {
    verdicts.c1_visible_label = !!(
      L &&
      L.display !== 'none' &&
      L.visibility === 'visible' &&
      L.effectiveOpacity > 0.5 &&
      L.text.length > 0 &&
      L.rect.width > 0 &&
      L.rect.height > 0 &&
      L.inViewport
    );
    verdicts.c2_target_44 = !!(B && B.rect && B.rect.width >= 44 && B.rect.height >= 44);
    verdicts.c3_sampled_AA = !!(sample && sample.contrastSampled >= AA);
    const covering = initialGeometry.painted >= 0.05;
    verdicts.c4_initial_not_covering = !(
      covering &&
      (intersects(initialGeometry.launcher, initialGeometry.portrait) ||
        intersects(initialGeometry.launcher, initialGeometry.actions))
    );
    verdicts.c6_no_gold =
      !!colour &&
      !isGoldish(colour.r, colour.g, colour.b) &&
      isGrey(colour.r, colour.g, colour.b) &&
      (!border || isGrey(border.r, border.g, border.b)) &&
      (!plate || isGrey(plate.r, plate.g, plate.b)) &&
      !!sample &&
      sample.goldishPixels === 0;
  } else {
    verdicts.c5_no_errors = pageerrors.length === 0 && consoleErrors.length === 0;
    verdicts.c5_launcher_present = !!(painted.present && B && B.rect && B.rect.width > 0);
  }

  return {
    viewport: vp,
    http: resp ? resp.status() : null,
    loadMs: Date.now() - t0,
    buildCommit,
    pageerrors,
    consoleErrors,
    failedRequests,
    initial: {
      scrollY: initialGeometry.scrollY,
      dockPainted: initialGeometry.painted,
      dockPointerEvents: initialGeometry.dockPointerEvents,
      launcher: roundRect(initialGeometry.launcher),
      portrait: roundRect(initialGeometry.portrait),
      portraitSelector: initialGeometry.portraitSelector,
      actions: roundRect(initialGeometry.actions),
      actionsSelector: initialGeometry.actionsSelector,
      geometricIntersectPortrait: intersects(initialGeometry.launcher, initialGeometry.portrait),
      geometricIntersectActions: intersects(initialGeometry.launcher, initialGeometry.actions),
      labelEffectiveOpacity: initialLabel.label ? round(initialLabel.label.effectiveOpacity) : null,
      hitAtLauncherCentre: initialLabel.button ? initialLabel.button.hit : null,
      capture: PHONE.has(vp.width) ? path.relative(HERE, foldFile) : null,
    },
    paint,
    painted: {
      scrollY: painted.scrollY,
      accessibleName: painted.accessibleName,
      ariaExpanded: painted.ariaExpanded,
      dock: painted.dock,
      button: B ? { rect: roundRect(B.rect), effectiveOpacity: round(B.effectiveOpacity), hit: B.hit } : null,
      disc: painted.disc ? { rect: roundRect(painted.disc.rect) } : null,
      label: L
        ? {
            ...L,
            rect: roundRect(L.rect),
            ownOpacity: round(L.ownOpacity),
            effectiveOpacity: round(L.effectiveOpacity),
            computedContrast,
            colourParsed: colour,
            plateParsed: plate,
            borderParsed: border,
          }
        : null,
      launcherAfterScroll: roundRect(paintedGeometry.launcher),
      capture: launcherCapture ? path.relative(HERE, launcherCapture) : null,
    },
    pixelSample: sample,
    verdicts,
  };
}

// ── clause 7: persistent profile, first load → reload → second navigation ────
async function probePersistent() {
  fs.rmSync(PROFILE_DIR, { recursive: true, force: true });
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const vp = { width: 390, height: 844 };
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    ...LAUNCH,
    viewport: vp,
    deviceScaleFactor: 1,
  });
  const page = context.pages()[0] || (await context.newPage());
  const pageerrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageerrors.push(String(e?.message || e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text().slice(0, 300));
  });
  const swState = () =>
    page.evaluate(async () => {
      if (!('serviceWorker' in navigator)) return { supported: false };
      const regs = await navigator.serviceWorker.getRegistrations();
      return {
        supported: true,
        registrations: regs.map((r) => ({
          scope: r.scope,
          active: !!r.active,
          activeUrl: r.active ? r.active.scriptURL : null,
          state: r.active ? r.active.state : r.installing ? 'installing' : r.waiting ? 'waiting' : 'none',
        })),
        controller: navigator.serviceWorker.controller
          ? navigator.serviceWorker.controller.scriptURL
          : null,
      };
    });
  const build = () =>
    page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.getAttribute('content') || null);
  const visit = async (how) => {
    if (how === 'goto') await page.goto(TARGET, { waitUntil: 'load', timeout: 60000 });
    else await page.reload({ waitUntil: 'load', timeout: 60000 });
    await waitHydrated(page);
    await page.waitForTimeout(800);
    const buildCommit = await build();
    const paint = await scrollToPaint(page, vp.height);
    const read = await readLabel(page);
    const L = read.label;
    const labelVisible = !!(
      L &&
      L.display !== 'none' &&
      L.visibility === 'visible' &&
      L.effectiveOpacity > 0.5 &&
      L.text.length > 0 &&
      L.rect.width > 0 &&
      L.rect.height > 0 &&
      L.inViewport
    );
    return {
      how,
      buildCommit,
      sw: await swState(),
      paint,
      label: L
        ? { text: L.text, display: L.display, visibility: L.visibility, effectiveOpacity: round(L.effectiveOpacity), rect: roundRect(L.rect), inViewport: L.inViewport, color: L.color, backgroundColor: L.backgroundColor }
        : null,
      labelVisible,
    };
  };

  const first = await visit('goto');
  // Give the worker time to install and precache the shell before the second load.
  const ready = await Promise.race([
    page.evaluate(() =>
      'serviceWorker' in navigator
        ? navigator.serviceWorker.ready.then((r) => ({ ready: true, scope: r.scope }))
        : { ready: false, reason: 'unsupported' },
    ),
    new Promise((res) => setTimeout(() => res({ ready: false, reason: 'timeout 15s' }), 15000)),
  ]);
  await page.waitForTimeout(3000);
  const second = await visit('reload');
  const third = await visit('goto');
  await context.close();
  return {
    profileDir: PROFILE_DIR,
    viewport: vp,
    swReadyAfterFirstLoad: ready,
    loads: [first, second, third],
    pageerrors,
    consoleErrors,
    verdicts: {
      c7_label_visible_on_reload: second.labelVisible,
      c7_label_visible_on_second_navigation: third.labelVisible,
      c7_build_commit_stable:
        !!first.buildCommit && first.buildCommit === second.buildCommit && second.buildCommit === third.buildCommit,
    },
  };
}

// ── main ─────────────────────────────────────────────────────────────────────
const started = new Date().toISOString();
const browser = await chromium.launch(LAUNCH);
const chromeVersion = browser.version();
const results = [];
for (const vp of VIEWPORTS) {
  process.stderr.write(`probe ${vp.width}x${vp.height}\n`);
  results.push(await probeViewport(browser, vp));
}
await browser.close();
process.stderr.write('probe persistent profile @390\n');
const persistent = await probePersistent();

const builds = new Set([...results.map((r) => r.buildCommit), ...persistent.loads.map((l) => l.buildCommit)]);
const out = {
  task: 't_rev_mv1_v3',
  clause_scope: 'G-MV1 only (G-V3 not in build)',
  target: TARGET,
  started,
  finished: new Date().toISOString(),
  chrome: chromeVersion,
  launch: LAUNCH,
  buildCommitsSeen: [...builds],
  results,
  persistent,
  summary: {
    c1_visible_label: results.filter((r) => PHONE.has(r.viewport.width)).map((r) => ({ width: r.viewport.width, pass: r.verdicts.c1_visible_label })),
    c2_target_44: results.filter((r) => PHONE.has(r.viewport.width)).map((r) => ({ width: r.viewport.width, pass: r.verdicts.c2_target_44, rect: r.painted.button?.rect })),
    c3_sampled_AA: results.filter((r) => PHONE.has(r.viewport.width)).map((r) => ({ width: r.viewport.width, pass: r.verdicts.c3_sampled_AA, sampled: r.pixelSample?.contrastSampled, computed: r.painted.label?.computedContrast })),
    c4_initial_not_covering: results.filter((r) => PHONE.has(r.viewport.width)).map((r) => ({ width: r.viewport.width, pass: r.verdicts.c4_initial_not_covering, dockPainted: r.initial.dockPainted, geometricIntersectPortrait: r.initial.geometricIntersectPortrait, geometricIntersectActions: r.initial.geometricIntersectActions })),
    c5_desktop: results.filter((r) => !PHONE.has(r.viewport.width)).map((r) => ({ width: r.viewport.width, noErrors: r.verdicts.c5_no_errors, launcherPresent: r.verdicts.c5_launcher_present, pageerrors: r.pageerrors.length, consoleErrors: r.consoleErrors.length, label: r.painted.label ? { display: r.painted.label.display, effectiveOpacity: r.painted.label.effectiveOpacity, text: r.painted.label.text } : null })),
    c6_no_gold: results.filter((r) => PHONE.has(r.viewport.width)).map((r) => ({ width: r.viewport.width, pass: r.verdicts.c6_no_gold, color: r.painted.label?.color, goldishPixels: r.pixelSample?.goldishPixels, nonGreyPixels: r.pixelSample?.nonGreyPixels })),
    c7_persistent: persistent.verdicts,
    phoneErrors: results.filter((r) => PHONE.has(r.viewport.width)).map((r) => ({ width: r.viewport.width, pageerrors: r.pageerrors.length, consoleErrors: r.consoleErrors.length })),
  },
};
fs.writeFileSync(path.join(HERE, '08-probe-g-mv1.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.summary, null, 2));
console.log(`buildCommitsSeen: ${[...builds].join(', ')}`);
