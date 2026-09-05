// Clause 10 — G-H1 regression, re-measured with a visibility filter (the phase-2
// pass counted zero-size and hidden nodes, which put ledger tops at 0).
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.dirname(new URL(import.meta.url).pathname);
const b = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-lcd-text'],
});
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const p = await ctx.newPage();
await p.goto('https://forgotten-mistory.web.app/', { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(2500);
const r = await p.evaluate(() => {
  const hero = document.querySelector('#hero');
  const vis = (el) => {
    const bb = el.getBoundingClientRect();
    const s = getComputedStyle(el);
    return bb.width >= 2 && bb.height >= 2 && s.visibility !== 'hidden' && s.display !== 'none' && s.opacity !== '0';
  };
  const cls = (el) => (typeof el.className === 'string' ? el.className : '');
  const ledger = [...hero.querySelectorAll('*')].filter((el) => /ledger/i.test(cls(el)) && vis(el));
  const groups = [...hero.querySelectorAll('*')].filter(
    (el) => /action|cta/i.test(cls(el)) && vis(el) && el.querySelectorAll('a[href],button').length >= 2,
  );
  return {
    build: document.querySelector('meta[name="build-commit"]')?.content,
    viewportH: window.innerHeight,
    ctaGroups: groups.map((el) => ({
      cls: cls(el).slice(0, 34),
      top: Math.round(el.getBoundingClientRect().top),
      links: [...el.querySelectorAll('a[href],button')].map((a) => a.textContent.trim().slice(0, 26)),
    })),
    ledger: ledger.map((el) => ({ cls: cls(el).slice(0, 30), top: Math.round(el.getBoundingClientRect().top) })),
    ledgerMinTop: Math.round(Math.min(...ledger.map((el) => el.getBoundingClientRect().top))),
    heroMedia: [...hero.querySelectorAll('img,video')]
      .filter(vis)
      .map((e) => ({ tag: e.tagName, src: (e.currentSrc || e.src || '').split('/').pop().slice(0, 40), top: Math.round(e.getBoundingClientRect().top) })),
  };
});
fs.writeFileSync(path.join(OUT, 'gh1-ledger.json'), JSON.stringify(r, null, 2));
console.log(JSON.stringify(r, null, 1).slice(0, 1600));
await ctx.close();
await b.close();
