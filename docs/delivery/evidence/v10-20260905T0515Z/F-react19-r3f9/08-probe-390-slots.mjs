// Why do #about and #experience report 0 canvases at 390x844 when 1440x900 reports 1?
// Scene.tsx mounts a canvas only while its slot is within half a viewport
// (IntersectionObserver rootMargin '50% 0px'). The earlier probes scrolled the
// SECTION into view; this one scrolls the SLOT itself, and records slot geometry,
// so "lazy, by design" and "never mounts" can be told apart.
import { chromium } from 'playwright';

const BASE = 'http://127.0.0.1:5603';
const ARGS = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
// The two scene slots, addressed by the CSS-module class prefix Next emits.
const SLOTS = { about: '#about div[class*="fieldSlot"]', experience: '#experience div[class*="chartScene"]' };

const browser = await chromium.launch({ channel: 'chrome', args: ARGS });
const out = {};
for (const [label, viewport] of [['1440x900', { width: 1440, height: 900 }], ['390x844', { width: 390, height: 844 }]]) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (e) => pageErrors.push(String(e?.message ?? e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.waitForTimeout(4000);

  const per = {};
  for (const [id, sel] of Object.entries(SLOTS)) {
    const slot = page.locator(sel).first();
    const exists = await slot.count();
    // 1. section-level scroll, as the earlier probes did
    await page.locator(`#${id}`).scrollIntoViewIfNeeded();
    await page.waitForTimeout(4000);
    const afterSectionScroll = await page.locator(`#${id} canvas`).count();
    // 2. slot-level scroll — put the slot itself on screen
    let afterSlotScroll = null;
    let box = null;
    let display = null;
    if (exists) {
      await slot.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(6000);
      afterSlotScroll = await page.locator(`#${id} canvas`).count();
      box = await slot.boundingBox();
      display = await slot.evaluate((n) => {
        const s = getComputedStyle(n);
        return { display: s.display, visibility: s.visibility, width: s.width, height: s.height };
      });
    }
    per[id] = { slotExists: exists, afterSectionScroll, afterSlotScroll, box, computed: display };
  }
  out[label] = { ...per, pageErrors, consoleErrors };
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
