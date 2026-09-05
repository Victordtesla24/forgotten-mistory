import pw from '/root/forgotten-mistory/node_modules/playwright/index.js';
import sharp from '/root/forgotten-mistory/node_modules/sharp/dist/index.cjs';
import fs from 'node:fs';
const { chromium } = pw;
const OUT = '/tmp/claude-0/-root-forgotten-mistory/46afcf46-5464-449d-9c0d-a9f0b25357cd/scratchpad/grev/captures';
const ARGS = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
  '--disable-lcd-text', '--disable-font-subpixel-positioning', '--font-render-hinting=none'];

function hueOf(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d === 0) return null;
  let h; if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
  h = Math.round(h * 60); return h < 0 ? h + 360 : h;
}
async function hist(png, boxes) {
  const im = sharp(png); const { width, height } = await im.metadata();
  const raw = await im.raw().toBuffer(); const ch = raw.length / (width * height);
  const b = { total: 0, chromatic: 0, gold: 0, nonGold: 0, excluded: 0 };
  const hues = new Map(); const regions = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    let skip = false;
    for (const bx of boxes) if (x >= bx.x && x <= bx.x + bx.w && y >= bx.y && y <= bx.y + bx.h) { skip = true; break; }
    if (skip) { b.excluded++; continue; }
    const i = (y * width + x) * ch, r = raw[i], g = raw[i + 1], bl = raw[i + 2];
    b.total++;
    const spread = Math.max(r, g, bl) - Math.min(r, g, bl);
    if (spread <= 8) continue;
    b.chromatic++;
    const h = hueOf(r, g, bl);
    if (h !== null && h >= 35 && h <= 50) b.gold++;
    else {
      b.nonGold++;
      const k = `${Math.floor(h / 30) * 30}-${Math.floor(h / 30) * 30 + 29}deg`;
      if (!hues.has(k)) { hues.set(k, { n: 0, sample: `rgb(${r},${g},${bl})`, spread, firstAt: `${x},${y}` }); }
      hues.get(k).n++;
      if (regions.length < 25 && hues.get(k).n % 2000 === 1) regions.push({ x, y, rgb: `rgb(${r},${g},${bl})`, hue: h, spread });
    }
  }
  return { width, height, b, hues: [...hues].sort((a, z) => z[1].n - a[1].n), regions };
}

const rep = {};
for (const gl of [false, true]) for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const label = `${vp.width}-${gl ? 'glforce' : 'still'}-nolcd`;
  const br = await chromium.launch({ channel: 'chrome', args: ARGS });
  const ctx = await br.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const pe = [], rf = [];
  p.on('pageerror', (e) => pe.push(String(e.message || e)));
  p.on('requestfailed', (r) => rf.push(`${r.url()} :: ${r.failure()?.errorText}`));
  await p.goto(`https://forgotten-mistory.web.app/${gl ? '?gl=force&' : '?'}cb=${Date.now()}`, { waitUntil: 'networkidle', timeout: 60000 });
  await p.waitForTimeout(gl ? 2000 : 600);
  const dh = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < dh; y += Math.round(vp.height * 0.8)) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(gl ? 400 : 160); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(gl ? 1500 : 400);
  const meta = await p.evaluate(() => {
    const boxes = [];
    const push = (el, tag) => { if (!el) return; const r = el.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return; boxes.push({ tag, x: Math.max(0, Math.round(r.x + window.scrollX) - 6), y: Math.max(0, Math.round(r.y + window.scrollY) - 6), w: Math.round(r.width) + 12, h: Math.round(r.height) + 12 }); };
    push(document.querySelector('#hero figure[class*="portrait"]'), 'hero-photograph (TC-HERO-18)');
    document.querySelectorAll('.minivic-launcher__disc, .minivic-launcher__portrait, [class*="minivic"] img').forEach((e) => push(e, 'minivic-launcher portrait (same photograph)'));
    document.querySelectorAll('img:not(#hero img)').forEach((e) => push(e, 'img ' + (e.getAttribute('src') || '').slice(0, 60)));
    const canv = document.querySelectorAll('canvas').length;
    return { boxes, canv };
  });
  const png = `${OUT}/${label}.png`;
  await p.screenshot({ path: png, fullPage: true });
  const h = await hist(png, meta.boxes);
  rep[label] = { pageerrors: pe, failed: rf, canvases: meta.canv, boxes: meta.boxes, hist: h };
  console.log(`[${label}] err=${pe.length} reqfail=${rf.length} canv=${meta.canv} boxes=${meta.boxes.length} px=${h.b.total} chromatic=${h.b.chromatic} gold=${h.b.gold} nonGold=${h.b.nonGold} (${(100 * h.b.nonGold / h.b.total).toFixed(4)}%) topHues=${JSON.stringify(h.hues.slice(0, 3))}`);
  await ctx.close(); await br.close();
}
fs.writeFileSync(`${OUT}/../probe2.json`, JSON.stringify(rep, null, 1));
console.log('done');
