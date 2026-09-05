// 09-probe-verify.mjs — independent reviewer probe for F-react19-r3f9.
// Written fresh (not a copy of 03-probe.mjs) to check three things the tester's
// testimony asserts: per-section canvases at 1440 and 390 under ?gl=force, a
// hardware-GPU spoof with NO query string (the real production path), and the
// identity of every layout shift that contributes to CLS.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5603';
const ARGS = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

// Make the capability probe in components/gl/useGLCapability.ts believe it is
// on a discrete GPU: it reads UNMASKED_RENDERER_WEBGL (0x9246) off the
// WEBGL_debug_renderer_info extension and refuses anything matching
// /swiftshader|llvmpipe|software|basic render/i.
const SPOOF_HARDWARE_GPU = () => {
  const UNMASKED_RENDERER = 0x9246;
  const UNMASKED_VENDOR = 0x9245;
  for (const Ctor of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    if (!Ctor) continue;
    const getParameter = Ctor.prototype.getParameter;
    Ctor.prototype.getParameter = function (pname) {
      if (pname === UNMASKED_RENDERER) return 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3080 Direct3D11 vs_5_0 ps_5_0, D3D11)';
      if (pname === UNMASKED_VENDOR) return 'Google Inc. (NVIDIA)';
      return getParameter.call(this, pname);
    };
  }
};

async function withPage(ctxOpts, initScripts, fn) {
  const browser = await chromium.launch({ channel: 'chrome', args: ARGS });
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  for (const s of initScripts) await page.addInitScript(s);
  let out;
  try {
    out = await fn(page);
  } finally {
    await browser.close();
  }
  return { ...out, pageErrors, consoleErrors };
}

const settle = async (page, ms) => {
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(ms);
};

// A canvas is counted per section by walking up from each <canvas> to its
// enclosing section[id] — the tester's count was page-wide, which cannot tell
// #about's canvas from #experience's.
const perSection = (page) =>
  page.$$eval('canvas', (cs) =>
    cs.map((c) => {
      const sec = c.closest('section[id]');
      const r = c.getBoundingClientRect();
      const cs2 = getComputedStyle(c);
      return {
        section: sec ? sec.id : '(none)',
        w: Math.round(r.width),
        h: Math.round(r.height),
        display: cs2.display,
        visibility: cs2.visibility,
      };
    }),
  );

async function glForce(width, height) {
  return withPage({ viewport: { width, height }, deviceScaleFactor: 1 }, [], async (page) => {
    await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
    await settle(page, 4000);
    const heroH1 = (await page.locator('#hero h1').count())
      ? (await page.locator('#hero h1').first().innerText()).trim()
      : null;
    const atHero = await perSection(page);
    // Scroll each GL slot into view in turn; Scene.tsx only mounts a canvas
    // while its slot is within rootMargin '50% 0px' of the viewport.
    const seen = {};
    for (const id of ['about', 'experience', 'vitrine', 'listen']) {
      const sel = `#${id}`;
      if (!(await page.locator(sel).count())) continue;
      await page.locator(sel).scrollIntoViewIfNeeded();
      await settle(page, 2500);
      // give a lazy slot deeper in the section a chance to enter the margin
      await page.mouse.wheel(0, Math.round(height * 0.6));
      await settle(page, 2500);
      seen[id] = await perSection(page);
    }
    const errorShell = (await page.getByText('Something went wrong').count()) > 0;
    const sectionIds = await page.$$eval('section[id]', (ns) => ns.map((n) => n.id));
    const canvasSections = new Set();
    for (const list of [atHero, ...Object.values(seen)])
      for (const c of list) canvasSections.add(c.section);
    return {
      viewport: `${width}x${height}`,
      heroH1,
      canvasesAtHero: atHero,
      canvasesWhileScrolling: seen,
      sectionsThatEverMountedACanvas: [...canvasSections].sort(),
      errorShell,
      sectionIds,
    };
  });
}

// The production path: no query string at all, GPU reported as hardware.
async function hardwareSpoofNoQuery(width, height) {
  return withPage({ viewport: { width, height }, deviceScaleFactor: 1 }, [SPOOF_HARDWARE_GPU], async (page) => {
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await settle(page, 4000);
    const rendererSeen = await page.evaluate(() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      const d = gl && gl.getExtension('WEBGL_debug_renderer_info');
      return d ? String(gl.getParameter(d.UNMASKED_RENDERER_WEBGL)) : '(no ext)';
    });
    const atHero = await perSection(page);
    await page.locator('#experience').scrollIntoViewIfNeeded();
    await settle(page, 3500);
    const afterExperience = await perSection(page);
    const errorShell = (await page.getByText('Something went wrong').count()) > 0;
    const errorBoundaryHeading = await page
      .locator('h1, h2')
      .allInnerTexts()
      .then((t) => t.map((s) => s.trim()).filter(Boolean));
    const heroH1 = (await page.locator('#hero h1').count())
      ? (await page.locator('#hero h1').first().innerText()).trim()
      : null;
    const sectionIds = await page.$$eval('section[id]', (ns) => ns.map((n) => n.id));
    return {
      viewport: `${width}x${height}`,
      rendererSeen,
      heroH1,
      canvasesAtHero: atHero,
      canvasesAfterExperience: afterExperience,
      errorShell,
      headings: errorBoundaryHeading.slice(0, 8),
      sectionIds,
    };
  });
}

// CLS with the identity of every shifting node, so a real structural shift can
// be told apart from a scheduling artefact under host contention.
async function clsWithSources(width, height) {
  return withPage({ viewport: { width, height }, deviceScaleFactor: 1 }, [], async (page) => {
    await page.addInitScript(() => {
      window.__shifts = [];
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) {
          if (e.hadRecentInput) continue;
          window.__shifts.push({
            value: e.value,
            time: Math.round(e.startTime),
            sources: (e.sources || []).map((s) => {
              const n = s.node;
              if (!n) return '(detached)';
              const tag = n.tagName ? n.tagName.toLowerCase() : n.nodeName;
              const id = n.id ? `#${n.id}` : '';
              const cls = n.className && typeof n.className === 'string'
                ? `.${n.className.trim().split(/\s+/).slice(0, 2).join('.')}`
                : '';
              return `${tag}${id}${cls}`;
            }),
          });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
    await settle(page, 6000);
    const shifts = await page.evaluate(() => window.__shifts);
    const cls = shifts.reduce((a, s) => a + s.value, 0);
    return {
      viewport: `${width}x${height}`,
      cls: Number(cls.toFixed(4)),
      shiftCount: shifts.length,
      shifts: shifts.slice(0, 12),
    };
  });
}

const report = {
  base: BASE,
  takenAt: new Date().toISOString(),
  loadavg: (await import('node:fs')).readFileSync('/proc/loadavg', 'utf8').trim(),
  glForce1440: await glForce(1440, 900),
  glForce390: await glForce(390, 844),
  hardwareSpoofNoQuery1440: await hardwareSpoofNoQuery(1440, 900),
  clsNoQuery1440: await clsWithSources(1440, 900),
};
console.log(JSON.stringify(report, null, 2));
