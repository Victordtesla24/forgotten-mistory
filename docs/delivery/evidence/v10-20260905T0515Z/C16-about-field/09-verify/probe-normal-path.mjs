// Normal path (no ?gl=force): gold audit inside #about, canvas count, mobile overflow.
import { chromium } from '/root/forgotten-mistory/.claude/worktrees/wf_697f0e83-f46-1/node_modules/playwright/index.mjs';

const BASE = 'http://127.0.0.1:5601';
const GOLD = 'rgb(201, 168, 76)';
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const results = [];

for (const [w, h, reduce] of [[1440, 900, false], [390, 844, false], [390, 844, true]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message.split('\n')[0]));
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 }).catch(() => {});
  await page.locator('#about').scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(2500);
  const r = await page.evaluate(`(() => {
    const about = document.querySelector('#about');
    const hits = [];
    if (about) for (const el of about.querySelectorAll('*')) {
      const cs = getComputedStyle(el);
      for (const p of ['color','backgroundColor','borderTopColor','borderBottomColor','borderLeftColor','borderRightColor','fill','stroke','outlineColor']) {
        if (cs[p] === '${GOLD}') hits.push(el.tagName + '.' + (el.className.baseVal ?? el.className ?? '') + ' via ' + p);
      }
    }
    const field = about ? about.querySelector('[data-axis]') : null;
    const rose = document.querySelector('#about svg[class*="compass"]');
    const title = document.querySelector('#about-title');
    let overHeading = 'none';
    if (title) { const b = title.getBoundingClientRect(); overHeading = (document.elementFromPoint(b.left + 4, b.top + b.height/2)||{}).tagName || 'none'; }
    return {
      aboutPresent: !!about,
      aboutCanvases: about ? about.querySelectorAll('canvas').length : -1,
      fieldSlotPresent: !!field,
      fieldSlotAriaHidden: field ? field.querySelector('[aria-hidden="true"]') !== null : null,
      fieldZ: field ? getComputedStyle(field).zIndex : 'missing',
      roseZ: rose ? getComputedStyle(rose).zIndex : 'missing',
      fieldRect: field ? (() => { const b = field.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height), l: Math.round(b.left), r: Math.round(b.right) }; })() : null,
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      overHeading,
      goldHits: hits,
    };
  })()`);
  results.push({ viewport: w + 'x' + h, reducedMotion: reduce, ...r, pageErrors: errs });
  await ctx.close();
}
console.log(JSON.stringify(results, null, 2));
await browser.close();
