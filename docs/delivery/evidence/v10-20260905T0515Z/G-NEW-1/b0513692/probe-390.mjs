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

// Nudge scroll to trigger any IntersectionObserver-based reveal, then settle.
await page.evaluate(() => window.scrollTo(0, 700));
await page.waitForTimeout(1200);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1200);

const probe = await page.evaluate(() => {
  const pill = document.querySelector('.minivic-launcher__pill');
  const btn = document.querySelector('.minivic-launcher');
  const out = { innerWidth: window.innerWidth, found: !!pill };
  if (pill) {
    const cs = getComputedStyle(pill);
    const r = pill.getBoundingClientRect();
    out.display = cs.display;
    out.visibility = cs.visibility;
    out.opacity = cs.opacity;
    out.ariaHidden = pill.getAttribute('aria-hidden');
    out.text = (pill.textContent || '').trim();
    out.rect = { w: r.width, h: r.height, top: r.top, left: r.left };
  }
  if (btn) {
    out.btnAriaLabel = btn.getAttribute('aria-label');
    out.btnDisplay = getComputedStyle(btn).display;
  }
  return out;
});

await page.screenshot({ path: OUT + 'minivic-launcher-390-' + buildCommit + '.png' });

// Focused element screenshot of the launcher for close-up evidence.
const el = await page.$('.minivic-launcher');
if (el) await el.screenshot({ path: OUT + 'minivic-launcher-390-' + buildCommit + '-pill.png' });

console.log(JSON.stringify({ buildCommit, probe }, null, 2));
await browser.close();
