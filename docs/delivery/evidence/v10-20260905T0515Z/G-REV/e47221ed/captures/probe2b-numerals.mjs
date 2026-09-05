// Focused follow-up: every Compass numeral's contrast against its SAMPLED ground
// at 1440, plus every caliper mark's paint in #about. Single context.
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';
const OUT = path.dirname(new URL(import.meta.url).pathname);
const srgb = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]; return (hi + 0.05) / (lo + 0.05); };
const parseRGB = (s) => { const m = String(s).match(/-?[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null; };
function pixels(buf) { const p = PNG.sync.read(buf); const m = new Map(); for (let i = 0; i < p.data.length; i += 4) { const k = `${p.data[i]},${p.data[i + 1]},${p.data[i + 2]}`; m.set(k, (m.get(k) || 0) + 1); } return [...m.entries()].map(([k, n]) => ({ rgb: k.split(',').map(Number), n })).sort((a, b) => b.n - a.n); }

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/', { waitUntil: 'networkidle', timeout: 60000 });
await page.locator('#about').scrollIntoViewIfNeeded();
await page.evaluate(() => new Promise((r) => setTimeout(r, 2000)));

const out = { buildCommit: await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content) };

// calipers in #about
out.calipers = await page.evaluate(() => [...document.querySelectorAll('#about [class*="Caliper"], #about [class*="caliper"]')].map((el) => {
  const cs = getComputedStyle(el); const r = el.getBoundingClientRect();
  return { tag: el.tagName.toLowerCase(), cls: (el.className.baseVal ?? String(el.className)).slice(0, 70), state: el.getAttribute('data-state') || el.dataset.state || null, color: cs.color, fill: cs.fill, stroke: cs.stroke, box: { w: Math.round(r.width), h: Math.round(r.height) } };
}));

// every numeral, sampled ground
const nums = page.locator('#about [class*="Compass_numeral"]');
const n = await nums.count();
out.numerals = [];
for (let i = 0; i < n; i++) {
  const el = nums.nth(i);
  const b = await el.boundingBox();
  const fill = parseRGB(await el.evaluate((e) => getComputedStyle(e).fill || getComputedStyle(e).color));
  if (!b || !fill) { out.numerals.push({ i, skipped: true }); continue; }
  const txt = (await el.textContent()).trim();
  await el.evaluate((e) => { e.style.fill = 'transparent'; e.style.color = 'transparent'; });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 100)));
  const buf = await page.screenshot({ clip: { x: Math.max(0, b.x), y: Math.max(0, b.y), width: Math.max(1, b.width), height: Math.max(1, b.height) } });
  await el.evaluate((e) => { e.style.fill = ''; e.style.color = ''; });
  const px = pixels(buf).map((p) => ({ ...p, c: contrast(fill, p.rgb) }));
  const worst = px.reduce((a, p) => (p.c < a.c ? p : a));
  out.numerals.push({ i, text: txt, fg: `rgb(${fill.join(',')})`, opacity: await el.evaluate((e) => getComputedStyle(e).opacity), fontSize: await el.evaluate((e) => getComputedStyle(e).fontSize), groundDominant: `rgb(${px[0].rgb.join(',')})`, contrastDominant: +px[0].c.toFixed(3), groundWorst: `rgb(${worst.rgb.join(',')})`, contrastWorst: +worst.c.toFixed(3), passAA_worst: worst.c >= 4.5 });
}
fs.writeFileSync(path.join(OUT, 'probe2b-numerals.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await ctx.close(); await browser.close();
