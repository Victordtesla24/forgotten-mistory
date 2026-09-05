#!/usr/bin/env node
/**
 * S-4 "look at it": #hero, #vitrine, #about and #skills at the four review
 * widths, from the static export served on :5602. Raw captures land in
 * `08-screens/raw/`; `08-screens/` keeps the eight composites that are read by
 * eye (Read tool) and committed — the suite catches broken, only eyes catch
 * ugly. The montage step is in 08-montage.sh beside this file.
 *
 *   node docs/delivery/evidence/v10-20260905T0515Z/C11-vitrine-integration/08-screenshots.mjs
 */
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const raw = join(here, '08-screens', 'raw');
mkdirSync(raw, { recursive: true });

const base = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5602';
const viewports = [
  [1440, 900],
  [1280, 800],
  [834, 1194],
  [390, 844],
];

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
try {
  for (const [width, height] of viewports) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(`${base}/`, { waitUntil: 'load' });
    await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 15000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(2500); // the CSS entrance, and the compass sweep

    // Hero: the first viewport exactly as a reader meets it (one fold).
    await page.screenshot({ path: join(raw, `hero-${width}.png`), fullPage: false });

    // The chrome is hidden for the section shots so it does not sit over prose
    // in the composite; it is judged in the hero fold above, where it belongs.
    await page.addStyleTag({
      content: 'body > nav, #site-nav-overlay, .fixed.bottom-6 { visibility: hidden !important; }',
    });

    for (const id of ['about', 'skills', 'vitrine']) {
      const section = page.locator(`#${id}`);
      await section.scrollIntoViewIfNeeded();
      await page.waitForTimeout(id === 'vitrine' ? 1600 : 900);
      await section.screenshot({ path: join(raw, `${id}-${width}.png`) });
    }

    const lit = await page.locator('#vitrine ol > li[data-lit]').evaluateAll((nodes) =>
      nodes.map((n) => Array.from(n.parentElement.children).indexOf(n) + 1),
    );
    const drawn = await page.locator('#vitrine ol > li[data-drawn]').evaluateAll((nodes) =>
      nodes.map((n) => Array.from(n.parentElement.children).indexOf(n) + 1),
    );
    const spine = await page.evaluate(() => {
      const h = document.querySelector('#vitrine h2').getBoundingClientRect().left;
      const c = document.querySelector('#vitrine ol > li').getBoundingClientRect().left;
      return { heading: +h.toFixed(2), card01: +c.toFixed(2) };
    });
    const action = await page.locator('#hero a[href="#experience"]').evaluate((a) => {
      const r = a.getBoundingClientRect();
      return +(r.top + r.height + window.scrollY).toFixed(2);
    });
    console.log(
      `${width}x${height}: lit plate(s) ${JSON.stringify(lit)}; drawn ${JSON.stringify(drawn)}; ` +
        `heading.left ${spine.heading} card01.left ${spine.card01}; hero action bottom (page y) ${action}`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
