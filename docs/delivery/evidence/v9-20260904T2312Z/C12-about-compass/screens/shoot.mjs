// Cycle 12 evidence: #about at 1440 (idle, item 6 centred, mid-sweep) and 390.
// Run from the worktree so the repo's Playwright resolves:
//   node docs/.../C12-about-compass/screens/shoot.mjs http://127.0.0.1:5609 <outDir>
import { chromium } from '@playwright/test';
import path from 'node:path';

const [base, outDir] = process.argv.slice(2);
if (!base || !outDir) throw new Error('usage: shoot.mjs <baseURL> <outDir>');

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });

async function open(viewport, reducedMotion = 'no-preference') {
  const context = await browser.newContext({ viewport, reducedMotion });
  const page = await context.newPage();
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await page
    .waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 })
    .catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
  await page.evaluate(() => document.fonts?.ready);
  await page.addStyleTag({ content: 'body > nav, #site-nav-overlay { visibility: hidden !important; }' });
  await page.mouse.move(2, 2);
  return page;
}

async function shoot(page, name) {
  const clip = await page.locator('#about').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      x: Math.round(r.left + window.scrollX),
      y: Math.round(r.top + window.scrollY),
      width: el.offsetWidth,
      height: el.offsetHeight,
    };
  });
  await page.screenshot({ path: path.join(outDir, name), fullPage: true, clip });
  console.log('wrote', name, JSON.stringify(clip));
}

async function waitForSweep(page) {
  await page.locator('#about[data-swept]').waitFor({ timeout: 10000 });
  await page.locator('#about svg [data-sweep]').evaluate(async (el) => {
    await Promise.all(el.getAnimations().map((a) => a.finished.catch(() => undefined)));
  });
}

async function centreItem(page, n) {
  await page.locator('#about ol li').nth(n - 1).evaluate((el) => {
    const r = el.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + r.top + r.height / 2 - window.innerHeight / 2);
  });
}

// 1 · idle at 1440 — the section as first met, sweep finished.
{
  const page = await open({ width: 1440, height: 900 });
  await page.locator('#about').scrollIntoViewIfNeeded();
  await waitForSweep(page);
  await page.waitForTimeout(800);
  await shoot(page, 'about-1440-idle.png');
  // 2 · item 6 centred, 900 ms later: 06 / FROM THE ROLE at twelve o'clock.
  await centreItem(page, 6);
  await page.waitForTimeout(900);
  const state = await page.evaluate(() => ({
    readout: document.querySelector('#about svg')?.textContent?.match(/\d\d|FROM THE ROLE|ANSWERED|NO SCORES/g),
    transform: getComputedStyle(document.querySelectorAll('#about svg g[class*="rose"]')[0]).transform,
  }));
  console.log('item 6 centred:', JSON.stringify(state));
  await shoot(page, 'about-1440-item6-centred.png');
  await page.context().close();
}

// 3 · mid-sweep at 1440 — the entry animation seeked to 500 ms and paused.
{
  const page = await open({ width: 1440, height: 900 });
  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.locator('#about[data-swept]').waitFor({ timeout: 10000 });
  const seek = await page.locator('#about svg [data-sweep]').evaluate((el) => {
    const [animation] = el.getAnimations();
    if (!animation) return 'no animation';
    animation.pause();
    animation.currentTime = 500;
    return `${animation.playState} @ ${animation.currentTime}ms of ${animation.effect?.getComputedTiming().duration}`;
  });
  console.log('mid-sweep:', seek);
  await page.waitForTimeout(150);
  await shoot(page, 'about-1440-mid-sweep-500ms.png');
  await page.context().close();
}

// 4 · 390 — the phone layout, instrument above the list.
{
  const page = await open({ width: 390, height: 844 });
  await page.locator('#about').scrollIntoViewIfNeeded();
  await waitForSweep(page);
  await page.waitForTimeout(800);
  await shoot(page, 'about-390.png');
  await page.context().close();
}

await browser.close();
