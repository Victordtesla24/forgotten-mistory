// G-REV phase 2 — adversarial re-probe of live https://forgotten-mistory.web.app/
// Read-only. Measures G-A1 (evidence-line gold + contrast against SAMPLED ground
// pixels) and G-A2 (key hatch chroma + visibility), plus a whole-page gold census
// and the pre-existing Compass numeral contrast. One context at a time.
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'https://forgotten-mistory.web.app/';
const OUT = path.dirname(new URL(import.meta.url).pathname);
const CHROME = process.env.CHROME_BIN || '/usr/bin/google-chrome';

const srgb = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = ([r, g, b]) => 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]; return (hi + 0.05) / (lo + 0.05); };
const parseRGB = (s) => { const m = String(s).match(/-?[\d.]+/g); return m ? m.slice(0, 3).map(Number) : null; };

/** Decode a PNG buffer and return every distinct pixel with a count. */
function pixels(buf) {
  const png = PNG.sync.read(buf);
  const map = new Map();
  for (let i = 0; i < png.data.length; i += 4) {
    const k = `${png.data[i]},${png.data[i + 1]},${png.data[i + 2]}`;
    map.set(k, (map.get(k) || 0) + 1);
  }
  return [...map.entries()].map(([k, n]) => ({ rgb: k.split(',').map(Number), n })).sort((a, b) => b.n - a.n);
}

const measure = () => {
  const tok = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const about = document.querySelector('#about');
  const ev = [...(about?.querySelectorAll('[class*="evidence"]') || [])];
  const sw = [...(about?.querySelectorAll('[class*="keySwatch"]') || [])];
  const goldRe = /rgba?\(\s*201\s*,\s*168\s*,\s*76|rgba?\(\s*212\s*,\s*182\s*,\s*92|#c9a84c|#d4b65c/i;

  // whole-page gold census
  const goldNodes = [];
  for (const el of document.querySelectorAll('*')) {
    const cs = getComputedStyle(el);
    const props = ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'fill', 'stroke', 'outlineColor', 'textDecorationColor', 'caretColor'];
    const hits = [];
    for (const p of props) { const v = cs[p]; if (v && goldRe.test(v)) hits.push(`${p}=${v}`); }
    if (goldRe.test(cs.backgroundImage || '')) hits.push('backgroundImage');
    if (goldRe.test(cs.boxShadow || '')) hits.push('boxShadow');
    if (!hits.length) continue;
    // only count nodes that actually paint (non-zero box, visible)
    const r = el.getBoundingClientRect();
    const sec = el.closest('section[id],div[id],footer,header,nav');
    goldNodes.push({
      tag: el.tagName.toLowerCase(),
      cls: (el.className && el.className.baseVal !== undefined ? el.className.baseVal : String(el.className || '')).slice(0, 80),
      section: sec ? (sec.id || sec.tagName.toLowerCase()) : '(none)',
      text: (el.textContent || '').trim().slice(0, 70),
      hits,
      box: { w: Math.round(r.width), h: Math.round(r.height) },
      visible: cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0 && r.width > 0 && r.height > 0,
    });
  }

  const numeral = document.querySelector('#about [class*="Compass_numeral"], #about text[class*="numeral"]');

  return {
    buildCommit: document.querySelector('meta[name="build-commit"]')?.content ?? null,
    tokens: { gold: tok('--gold'), goldLight: tok('--gold-light'), mist400: tok('--mist-400') },
    aboutPresent: !!about,
    evidence: ev.map((el, i) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        i,
        dataSourced: el.getAttribute('data-sourced'),
        color: cs.color,
        fontSize: cs.fontSize, fontWeight: cs.fontWeight,
        text: (el.textContent || '').trim(),
        dimension: (el.closest('li')?.querySelector('h3')?.textContent || '').trim(),
        box: { x: r.x, y: r.y, w: r.width, h: r.height },
      };
    }),
    swatches: sw.map((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        state: el.getAttribute('data-state'),
        backgroundImage: cs.backgroundImage,
        background: cs.background.slice(0, 200),
        borderStyle: cs.borderStyle, borderColor: cs.borderTopColor,
        display: cs.display, visibility: cs.visibility, opacity: cs.opacity,
        box: { w: r.width, h: r.height },
      };
    }),
    numeral: numeral ? { text: numeral.textContent.trim(), fill: getComputedStyle(numeral).fill, color: getComputedStyle(numeral).color, box: numeral.getBoundingClientRect().toJSON() } : null,
    goldNodes,
    canvases: [...document.querySelectorAll('canvas')].map((c) => ({ scene: c.dataset.scene || null, w: c.width, h: c.height, section: c.closest('section[id]')?.id || null })),
  };
};

async function run(label, url, vp) {
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const pageerrors = [], console_ = [], failed = [];
  page.on('pageerror', (e) => pageerrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console_.push(`${m.type()}: ${m.text()}`.slice(0, 200)); });
  page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText}`));

  const resp = await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1200)));
  const about = page.locator('#about');
  await about.scrollIntoViewIfNeeded().catch(() => {});
  await page.evaluate(() => new Promise((r) => setTimeout(r, 1500)));

  const m = await page.evaluate(measure);
  m.status = resp.status();
  m.pageerrors = pageerrors; m.console = console_; m.failedRequests = failed;

  // --- ground-pixel contrast for every evidence node (normal contexts only) ---
  if (!url.includes('gl=force')) {
    const nodes = page.locator('#about [class*="evidence"]');
    const n = await nodes.count();
    m.contrast = [];
    for (let i = 0; i < n; i++) {
      const el = nodes.nth(i);
      await el.scrollIntoViewIfNeeded();
      await page.evaluate(() => new Promise((r) => setTimeout(r, 250)));
      const b = await el.boundingBox();
      if (!b) { m.contrast.push({ i, error: 'no box' }); continue; }
      const fg = parseRGB(await el.evaluate((e) => getComputedStyle(e).color));
      // hide only the glyphs; the box then shows the composited ground behind them
      await el.evaluate((e) => { e.dataset.probePrev = e.style.color; e.style.color = 'transparent'; });
      await page.evaluate(() => new Promise((r) => setTimeout(r, 120)));
      const clip = { x: Math.max(0, b.x), y: Math.max(0, b.y), width: Math.max(1, Math.min(b.width, vp.width - b.x)), height: Math.max(1, b.height) };
      const buf = await page.screenshot({ clip });
      await el.evaluate((e) => { e.style.color = e.dataset.probePrev || ''; delete e.dataset.probePrev; });
      const px = pixels(buf);
      const withC = px.map((p) => ({ ...p, c: contrast(fg, p.rgb) }));
      const worst = withC.reduce((a, p) => (p.c < a.c ? p : a));
      const dom = withC[0];
      const total = withC.reduce((s, p) => s + p.n, 0);
      m.contrast.push({
        i,
        dimension: m.evidence[i]?.dimension, dataSourced: m.evidence[i]?.dataSourced,
        fg: `rgb(${fg.join(',')})`,
        groundDominant: `rgb(${dom.rgb.join(',')})`, groundDominantShare: +(dom.n / total).toFixed(4),
        contrastDominant: +dom.c.toFixed(3),
        groundWorst: `rgb(${worst.rgb.join(',')})`, contrastWorst: +worst.c.toFixed(3),
        distinctGroundColors: px.length,
        passAA_dominant: dom.c >= 4.5, passAA_worst: worst.c >= 4.5,
      });
      fs.writeFileSync(path.join(OUT, `${label}-ground-${i}.png`), buf);
    }

    // Compass numeral '01' — pre-existing contrast check, same method
    const num = page.locator('#about [class*="Compass_numeral"]').first();
    if (await num.count()) {
      await num.scrollIntoViewIfNeeded().catch(() => {});
      const b = await num.boundingBox();
      const fill = parseRGB(await num.evaluate((e) => getComputedStyle(e).fill || getComputedStyle(e).color));
      if (b && fill) {
        await num.evaluate((e) => { e.style.fill = 'transparent'; e.style.color = 'transparent'; });
        await page.evaluate(() => new Promise((r) => setTimeout(r, 120)));
        const buf = await page.screenshot({ clip: { x: Math.max(0, b.x), y: Math.max(0, b.y), width: Math.max(1, b.width), height: Math.max(1, b.height) } });
        await num.evaluate((e) => { e.style.fill = ''; e.style.color = ''; });
        const px = pixels(buf).map((p) => ({ ...p, c: contrast(fill, p.rgb) }));
        const worst = px.reduce((a, p) => (p.c < a.c ? p : a));
        m.numeralContrast = { text: await num.textContent(), fg: `rgb(${fill.join(',')})`, groundDominant: `rgb(${px[0].rgb.join(',')})`, contrastDominant: +px[0].c.toFixed(3), groundWorst: `rgb(${worst.rgb.join(',')})`, contrastWorst: +worst.c.toFixed(3) };
        fs.writeFileSync(path.join(OUT, `${label}-numeral-ground.png`), buf);
      }
    }
  }

  // --- screenshots ---
  await about.scrollIntoViewIfNeeded().catch(() => {});
  await page.evaluate(() => new Promise((r) => setTimeout(r, 600)));
  await page.screenshot({ path: path.join(OUT, `${label}-about.png`), clip: { x: 0, y: 0, width: vp.width, height: Math.min(vp.height, 1400) } });
  const swatchEl = page.locator('#about [class*="keySwatch"][data-state="role"]').first();
  if (await swatchEl.count()) {
    await swatchEl.scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate(() => new Promise((r) => setTimeout(r, 300)));
    const b = await swatchEl.boundingBox();
    if (b) {
      const pad = 6;
      const buf = await page.screenshot({ clip: { x: Math.max(0, b.x - pad), y: Math.max(0, b.y - pad), width: b.width + pad * 2, height: b.height + pad * 2 } });
      fs.writeFileSync(path.join(OUT, `${label}-key-role-swatch.png`), buf);
      m.swatchPixels = pixels(buf).slice(0, 12).map((p) => ({ rgb: `rgb(${p.rgb.join(',')})`, n: p.n, spread: Math.max(...p.rgb) - Math.min(...p.rgb) }));
    }
  }

  await ctx.close(); await browser.close();
  return m;
}

const contexts = [
  ['1440-normal', BASE, { width: 1440, height: 900 }],
  ['390-normal', BASE, { width: 390, height: 844 }],
  ['1440-glforce', BASE + '?gl=force', { width: 1440, height: 900 }],
  ['390-glforce', BASE + '?gl=force', { width: 390, height: 844 }],
];

const all = {};
for (const [label, url, vp] of contexts) {
  process.stderr.write(`\n>>> ${label} ${url}\n`);
  try { all[label] = await run(label, url, vp); } catch (e) { all[label] = { error: String(e) }; }
  fs.writeFileSync(path.join(OUT, 'probe2.json'), JSON.stringify(all, null, 2));
}
process.stderr.write('\nDONE\n');
