// Same-plate lit-vs-resting ink comparison (G-V1: "the lit plate must be
// measurably heavier than a resting one"). One plate, one raster, two states.
import { chromium } from '/root/forgotten-mistory/node_modules/playwright/index.mjs';
import { PNG } from '/root/forgotten-mistory/node_modules/pngjs/lib/png.js';
import fs from 'node:fs';

const OUT = '/root/forgotten-mistory/.claude/worktrees/wf_93138609-6c3-1/docs/delivery/evidence/v10-20260905T0515Z/G-REV/843b679d/captures';

function ink(buf) {
  const p = PNG.sync.read(buf);
  const c = new Map();
  const k = (r, g, b) => (r >> 3) * 1024 + (g >> 3) * 32 + (b >> 3);
  for (let i = 0; i < p.data.length; i += 4) { const q = k(p.data[i], p.data[i + 1], p.data[i + 2]); c.set(q, (c.get(q) || 0) + 1); }
  let mk = 0, mn = -1; for (const [a, b] of c) if (b > mn) { mn = b; mk = a; }
  const mr = ((mk / 1024) | 0) << 3, mg = (((mk % 1024) / 32) | 0) << 3, mb = (mk % 32) << 3;
  let ic = 0, t = 0;
  for (let i = 0; i < p.data.length; i += 4) { t++; if (Math.max(Math.abs(p.data[i] - mr), Math.abs(p.data[i + 1] - mg), Math.abs(p.data[i + 2] - mb)) > 10) ic++; }
  return { w: p.width, h: p.height, ink: ic, total: t, frac: +(ic / t).toFixed(5) };
}

const state = sv => {
  const up = (e, a) => { let n = e; while (n && n !== document.body) { if (n.hasAttribute?.(a)) return true; n = n.parentElement; } return false; };
  const ks = [...sv.querySelectorAll('.stroke,path,line,circle,polyline,rect,polygon,ellipse')];
  const so = ks.map(k => parseFloat(getComputedStyle(k).strokeOpacity)).filter(Number.isFinite);
  const host = sv.closest('li') || sv.parentElement;
  return { lit: up(sv, 'data-lit'), drawn: up(sv, 'data-drawn'), sOpMin: so.length ? Math.min(...so) : null, sOpMax: so.length ? Math.max(...so) : null, hostOpacity: getComputedStyle(host).opacity };
};

(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const c = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const p = await c.newPage();
  await p.goto('https://forgotten-mistory.web.app/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const v = await p.$('#vitrine');
  await v.scrollIntoViewIfNeeded();
  await p.waitForTimeout(2500);
  const svgs = await p.$$('#vitrine svg');
  const rows = [];
  for (const idx of [1, 2]) {
    const sv = svgs[idx];
    await sv.scrollIntoViewIfNeeded();
    await p.waitForTimeout(900);
    const s1 = await sv.evaluate(state);
    const b1 = await sv.screenshot({ type: 'png' });
    fs.writeFileSync(`${OUT}/litcmp-p${idx}-A-resting.png`, b1);
    await sv.hover({ force: true }).catch(() => {});
    await p.waitForTimeout(1400);
    const s2 = await sv.evaluate(state);
    const b2 = await sv.screenshot({ type: 'png' });
    fs.writeFileSync(`${OUT}/litcmp-p${idx}-B-lit.png`, b2);
    rows.push({ plate: idx, A_resting: { ...s1, ...ink(b1) }, B_afterHover: { ...s2, ...ink(b2) } });
  }
  fs.writeFileSync(`${OUT}/lit-vs-resting.json`, JSON.stringify(rows, null, 2));
  console.log(JSON.stringify(rows, null, 1));
  await b.close();
})();
