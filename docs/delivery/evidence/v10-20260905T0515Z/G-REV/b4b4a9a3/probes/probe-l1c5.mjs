// rev-b4b4a9a3-c23 — independent live probe of G-L1 C5 (Listen caliper reading)
// Read-only. Measures https://forgotten-mistory.web.app/ after #listen is in view.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';

const URL = 'https://forgotten-mistory.web.app/';
const OUT = process.argv[2] || '/root/.claude/jobs/4e543924/tmp';

const browser = await chromium.launch({
  channel: 'chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

const results = { url: URL, probedAt: new Date().toISOString(), viewports: [] };

for (const vp of [
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'mobile-390', width: 390, height: 844 },
]) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 2,
    bypassCSP: false,
  });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });

  const buildCommit = await page
    .locator('meta[name="build-commit"]')
    .getAttribute('content')
    .catch(() => null);

  // Bring #listen fully into view and let IntersectionObserver / GL settle.
  await page.locator('#listen').scrollIntoViewIfNeeded({ timeout: 20000 });
  await page.waitForTimeout(2500);

  const inView = await page.locator('#listen').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });

  // ---- G-L1 C5: the reading between the caliper jaws ----
  const reading = await page.evaluate(() => {
    const node = document.querySelector('#listen [data-reading]');
    if (!node) return { found: false };
    const cs = getComputedStyle(node);
    const r = node.getBoundingClientRect();
    return {
      found: true,
      tag: node.tagName,
      text: node.textContent,
      dataReading: node.getAttribute('data-reading'),
      color: cs.color,
      fill: cs.fill,
      fontSize: cs.fontSize,
      fontFamily: cs.fontFamily,
      opacity: cs.opacity,
      visibility: cs.visibility,
      display: cs.display,
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    };
  });

  // The gold token, resolved live, so "not gold" is measured not asserted.
  const goldToken = await page.evaluate(() => {
    const rs = getComputedStyle(document.documentElement);
    return {
      gold: rs.getPropertyValue('--gold').trim(),
      goldRgb: (() => {
        const probe = document.createElement('span');
        probe.style.color = 'var(--gold)';
        document.body.appendChild(probe);
        const c = getComputedStyle(probe).color;
        probe.remove();
        return c;
      })(),
    };
  });

  // ---- G-NEW-1: Ask Mini Vic pill visible at this width ----
  const pill = await page.evaluate(() => {
    const cands = Array.from(document.querySelectorAll('button, a, [role="button"], [aria-label]'));
    const el = cands.find((n) => /ask mini vic/i.test(n.getAttribute('aria-label') || n.textContent || ''));
    if (!el) return { found: false };
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      found: true,
      tag: el.tagName,
      text: (el.textContent || '').trim().slice(0, 80),
      ariaLabel: el.getAttribute('aria-label'),
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      rect: { x: r.x, y: r.y, w: r.width, h: r.height },
      visible: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && r.height > 0,
    };
  });

  // ---- G-C1: Listen action plate labels (honest email vs calendar promise) ----
  const listenActions = await page.evaluate(() => {
    const sec = document.querySelector('#listen');
    if (!sec) return [];
    return Array.from(sec.querySelectorAll('a[href]')).map((a) => {
      const cs = getComputedStyle(a);
      return {
        text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
        href: a.getAttribute('href'),
        color: cs.color,
      };
    });
  });

  // ---- Listen canvases (instrument present, not a static block) ----
  const canvases = await page.evaluate(() => {
    const sec = document.querySelector('#listen');
    if (!sec) return { count: 0 };
    const cs = Array.from(sec.querySelectorAll('canvas'));
    return {
      count: cs.length,
      sizes: cs.map((c) => ({ w: c.width, h: c.height, cw: c.clientWidth, ch: c.clientHeight })),
    };
  });

  await page.screenshot({
    path: `${OUT}/listen-${vp.name}.png`,
    clip: await page.locator('#listen').boundingBox().then((b) =>
      b ? { x: Math.max(0, b.x), y: Math.max(0, b.y - 0), width: Math.min(b.width, vp.width), height: Math.min(b.height, vp.height * 2) } : undefined,
    ),
  }).catch(async () => {
    await page.screenshot({ path: `${OUT}/listen-${vp.name}.png` });
  });

  results.viewports.push({
    viewport: vp,
    buildCommit,
    inView,
    reading,
    goldToken,
    pill,
    listenActions,
    canvases,
    pageErrors,
    consoleErrors: consoleErrors.slice(0, 10),
  });

  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
