// Does the baseline (no c16) crash at ?gl=force when an EXISTING scene is asked to mount?
import { chromium } from '/root/forgotten-mistory/.claude/worktrees/wf_697f0e83-f46-1/node_modules/playwright/index.mjs';

const BASE = 'http://127.0.0.1:5601';
const target = process.argv[2] || 'hero';

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const consoleErrors = [];
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text().split('\n')[0]); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message.split('\n')[0]));

await page.goto(`${BASE}/?gl=force`, { waitUntil: 'load' });
await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 }).catch(() => {});
if (target !== 'hero') await page.locator(`#${target}`).scrollIntoViewIfNeeded().catch(() => {});
await page.waitForTimeout(7000);

const out = await page.evaluate(`(() => {
  const per = {};
  for (const s of document.querySelectorAll('section[id]')) per[s.id] = s.querySelectorAll('canvas').length;
  return {
    sections: Object.keys(per), perSection: per,
    total: document.querySelectorAll('canvas').length,
    slots: [...document.querySelectorAll('[aria-hidden="true"]')].length,
    errorShell: (document.body.textContent||'').includes('Something went wrong'),
  };
})()`);

console.log(JSON.stringify({ target, ...out, consoleErrors: consoleErrors.slice(0, 4) }, null, 2));
await browser.close();
