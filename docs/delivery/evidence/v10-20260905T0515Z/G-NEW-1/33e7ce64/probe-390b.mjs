import { chromium } from 'playwright';

const LIVE_URL = 'https://forgotten-mistory.web.app/';
const OUT = new URL('.', import.meta.url).pathname;

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
await page.goto(LIVE_URL, { waitUntil: 'networkidle' });

const buildCommit = await page.evaluate(() =>
  document.querySelector('meta[name="build-commit"]')?.getAttribute('content') || null
);

const dump = (label) => page.evaluate((label) => {
  const btn = document.querySelector('.minivic-launcher');
  const pill = document.querySelector('.minivic-launcher__pill');
  const info = { label };
  if (btn) {
    const cs = getComputedStyle(btn);
    const r = btn.getBoundingClientRect();
    info.btn = {
      className: btn.className,
      dataState: btn.getAttribute('data-state'),
      position: cs.position, opacity: cs.opacity, transform: cs.transform,
      visibility: cs.visibility, display: cs.display, pointerEvents: cs.pointerEvents,
      bottom: cs.bottom, right: cs.right, left: cs.left, top: cs.top, zIndex: cs.zIndex,
      rect: { w: r.width, h: r.height, top: r.top, left: r.left },
    };
    // What is actually painted at the pill center?
    const pr = pill ? pill.getBoundingClientRect() : r;
    const cx = pr.left + pr.width / 2, cy = pr.top + pr.height / 2;
    const topEl = document.elementFromPoint(cx, cy);
    info.hitTest = { cx, cy, topEl: topEl ? (topEl.className || topEl.tagName) : null,
      isInsideLauncher: topEl ? !!topEl.closest('.minivic-launcher') : false };
  }
  if (pill) {
    const pcs = getComputedStyle(pill);
    info.pill = { display: pcs.display, opacity: pcs.opacity, visibility: pcs.visibility,
      color: pcs.color, fontSize: pcs.fontSize, text: (pill.textContent||'').trim(),
      ariaHidden: pill.getAttribute('aria-hidden') };
  }
  return info;
}, label);

const initial = await dump('initial@scroll0');
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1500);
const bottom = await dump('scrolledBottom');
await page.screenshot({ path: OUT + 'launcher-scrolled-bottom-' + buildCommit + '.png' });

console.log(JSON.stringify({ buildCommit, initial, bottom }, null, 2));
await browser.close();
