// Independent adversarial probe for c16 (#about GLSL field).
// Read-only: navigates the served static export on :5601 and reports DOM facts.
import { chromium } from '/root/forgotten-mistory/.claude/worktrees/wf_697f0e83-f46-1/node_modules/playwright/index.mjs';

const BASE = 'http://127.0.0.1:5601';
const GOLD = 'rgb(201, 168, 76)';

async function openPage(browser, { reduce = false, killGL = false } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: reduce ? 'reduce' : 'no-preference',
  });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  const requests = [];
  page.on('pageerror', (e) => pageErrors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') consoleErrors.push(m.text());
  });
  page.on('request', (r) => requests.push(r.url()));
  if (killGL) {
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(id, ...rest) {
        if (id === 'webgl' || id === 'webgl2' || id === 'experimental-webgl') return null;
        return original.call(this, id, ...rest);
      };
    });
  }
  return { ctx, page, pageErrors, consoleErrors, requests };
}

async function settle(page) {
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#about').scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(3000);
}

function auditGold() {
  return `(() => {
    const about = document.querySelector('#about');
    if (!about) return { sectionPresent: false, hits: [] };
    const hits = [];
    for (const el of about.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      for (const prop of ['color','backgroundColor','borderTopColor','borderRightColor','borderBottomColor','borderLeftColor','fill','stroke','outlineColor','textDecorationColor']) {
        const v = cs[prop];
        if (v === '${GOLD}') hits.push(el.tagName + '.' + (el.className.baseVal ?? el.className ?? '') + ' via ' + prop);
      }
    }
    return { sectionPresent: true, hits };
  })()`;
}

async function report(label, opts) {
  const browser = await chromium.launch({
    channel: 'chrome',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const { ctx, page, pageErrors, consoleErrors, requests } = await openPage(browser, opts);
  await settle(page);

  const dom = await page.evaluate(`(() => {
    const about = document.querySelector('#about');
    const title = document.querySelector('#about-title');
    const rose = document.querySelector('#about svg[class*="compass"]');
    const field = document.querySelector('#about [data-axis]');
    const canvases = about ? about.querySelectorAll('canvas').length : -1;
    const canvas = about ? about.querySelector('canvas') : null;
    let overHeading = 'no-title';
    if (title) {
      const r = title.getBoundingClientRect();
      overHeading = (document.elementFromPoint(r.left + 4, r.top + r.height / 2) || {}).tagName || 'none';
    }
    let overRose = 'no-rose';
    let roseSelfHit = null;
    if (rose) {
      const r = rose.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      overRose = hit ? hit.tagName : 'none';
      roseSelfHit = hit ? rose.contains(hit) : false;
    }
    return {
      bodyHasError: !!document.querySelector('[data-error-boundary], .error-shell'),
      sectionIds: [...document.querySelectorAll('section[id]')].map((s) => s.id),
      aboutPresent: !!about,
      aboutCanvases: canvases,
      canvasAriaHidden: canvas ? canvas.closest('[aria-hidden="true"]') !== null : null,
      canvasBox: canvas ? (() => { const b = canvas.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height) }; })() : null,
      allCanvases: document.querySelectorAll('canvas').length,
      fieldZ: field ? getComputedStyle(field).zIndex : 'missing',
      roseZ: rose ? getComputedStyle(rose).zIndex : 'missing',
      fieldDataAxis: field ? field.getAttribute('data-axis') : 'missing',
      roseVisible: rose ? rose.getBoundingClientRect().width > 0 : false,
      drawnSvgElements: about ? about.querySelectorAll('svg path, svg line, svg circle').length : -1,
      listItems: about ? about.querySelectorAll('ol li').length : -1,
      aboutText: about ? (about.textContent || '').includes('Ten axes · no scores') : false,
      overHeading, overRose, roseSelfHit,
      bodyText: (document.body.textContent || '').slice(0, 120),
    };
  })()`);

  const gold = await page.evaluate(auditGold());

  console.log(JSON.stringify({ label, dom, gold, pageErrors: pageErrors.slice(0, 3), consoleErrors: consoleErrors.slice(0, 3), requestCount: requests.length, requests: requests.map((u) => u.replace(BASE, '')) }, null, 2));
  await ctx.close();
  await browser.close();
}

const mode = process.argv[2];
await report(mode, {
  reduce: mode === 'reduced',
  killGL: mode === 'nogl',
});
