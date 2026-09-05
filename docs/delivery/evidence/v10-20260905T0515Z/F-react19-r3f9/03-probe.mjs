import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5603';
const ARGS = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

async function withPage(ctxOpts, fn) {
  const browser = await chromium.launch({ channel: 'chrome', args: ARGS });
  const ctx = await browser.newContext(ctxOpts);
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
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

async function glForce(width, height) {
  return withPage({ viewport: { width, height }, deviceScaleFactor: 1 }, async (page) => {
    await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
    await settle(page, 4000);
    const heroH1 = await page.locator('#hero h1').count();
    const heroH1Text = heroH1 ? (await page.locator('#hero h1').first().innerText()).trim() : null;
    const canvasesAtHero = await page.locator('canvas').count();
    await page.locator('#experience').scrollIntoViewIfNeeded();
    await settle(page, 5000);
    const canvasesAfterExperience = await page.locator('canvas').count();
    const errorShell = (await page.getByText('Something went wrong').count()) > 0;
    const sectionIds = await page.$$eval('section[id]', (ns) => ns.map((n) => n.id));
    return {
      viewport: `${width}x${height}`,
      heroH1,
      heroH1Text,
      canvasesAtHero,
      canvasesAfterExperience,
      errorShell,
      sectionIds,
    };
  });
}

async function reducedMotion() {
  return withPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, async (page) => {
    await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
    await settle(page, 3500);
    const runningAnimations = await page.evaluate(
      () => document.getAnimations().filter((a) => a.playState === 'running').length,
    );
    const canvases = await page.locator('canvas').count();
    const heroH1 = await page.locator('#hero h1').count();
    return { runningAnimations, canvases, heroH1 };
  });
}

async function noGL() {
  return withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
        return orig.call(this, type, ...rest);
      };
    });
    await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
    await settle(page, 3500);
    const canvases = await page.locator('canvas').count();
    const heroH1 = await page.locator('#hero h1').count();
    const sectionIds = await page.$$eval('section[id]', (ns) => ns.map((n) => n.id));
    const bodyChars = (await page.locator('body').innerText()).trim().length;
    return { canvases, heroH1, sectionIds, bodyChars };
  });
}

const report = {
  base: BASE,
  glForce1440: await glForce(1440, 900),
  glForce390: await glForce(390, 844),
  reducedMotion: await reducedMotion(),
  noGL: await noGL(),
};
console.log(JSON.stringify(report, null, 2));
