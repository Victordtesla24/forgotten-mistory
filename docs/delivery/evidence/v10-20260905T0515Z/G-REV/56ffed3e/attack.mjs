// rev-56ffed3e-w1 — S-4 attack probe: try to make the portrait show colour.
import { chromium } from 'playwright';
import fs from 'node:fs'; import path from 'node:path'; import sharp from 'sharp';
const OUT = path.resolve('.'); const BASE = 'https://forgotten-mistory.web.app/';
const out = { generatedAt: new Date().toISOString(), steps: [] };

async function chromaOf(buf) {
  const { data, info } = await sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height; let max = 0, gt2 = 0, gt4 = 0, sat = 0, satNG = 0; const samples = [];
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const c = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
    if (c > max) max = c; if (c > 2) gt2++; if (c > 4) gt4++;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, s = mx === 0 ? 0 : d / mx;
    if (s > 0.25) { sat++; let h = 0; if (d) { if (mx === r) h = 60 * ((((g - b) / d) % 6 + 6) % 6); else if (mx === g) h = 60 * ((b - r) / d + 2); else h = 60 * ((r - g) / d + 4); } if (h < 0) h += 360; if (!(h >= 35 && h <= 60)) { satNG++; if (samples.length < 6) samples.push({ r, g, b, h: +h.toFixed(1) }); } }
  }
  return { w: info.width, h: info.height, pixels: n, maxChroma: max, pxChromaGT2: gt2, pxChromaGT4: gt4, pctChromaLE4: +(100 * (n - gt4) / n).toFixed(4), pxSatGT025: sat, pxSatGT025NonGoldHue: satNG, samples };
}

const browser = await chromium.launch({ headless: true, executablePath: '/usr/bin/google-chrome-stable', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(String(e.message))); page.on('console', m => { if (m.type() === 'error') errs.push('console:' + m.text()); });
await page.goto(BASE, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(2000);

// 1. rendered <img> in the hero picture (the real painted portrait)
const img = page.locator('[data-testid="hero-portrait"] picture img').first();
await img.scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
const imgBuf = await img.screenshot();
fs.writeFileSync(path.join(OUT, 'portrait-img-rendered-1440.png'), imgBuf);
out.steps.push({ step: 'rendered-picture-img', chroma: await chromaOf(imgBuf) });

// 2. whole portrait figure (includes glow, caption, control)
const fig = page.locator('[data-testid="hero-portrait"]').first();
const figBuf = await fig.screenshot();
fs.writeFileSync(path.join(OUT, 'portrait-figure-1440.png'), figBuf);
out.steps.push({ step: 'portrait-figure-rest', chroma: await chromaOf(figBuf) });

// 3. hover the figure
await fig.hover(); await page.waitForTimeout(1500);
const hovBuf = await fig.screenshot();
fs.writeFileSync(path.join(OUT, 'portrait-figure-hover-1440.png'), hovBuf);
out.steps.push({ step: 'portrait-figure-hover', chroma: await chromaOf(hovBuf) });

// 4. click the portrait control (toggle the loop) and force play
const ctrl = page.locator('[data-testid="portrait-control"]').first();
out.controlCount = await ctrl.count();
out.controlText = out.controlCount ? (await ctrl.first().innerText()).replace(/\s+/g, ' ').trim() : null;
if (out.controlCount) { await ctrl.first().click({ force: true }); await page.waitForTimeout(3000); }
out.videoAfterToggle = await page.evaluate(async () => {
  const v = document.querySelector('[data-testid="hero-portrait"] video') || document.querySelector('video');
  if (!v) return null;
  try { v.muted = true; await v.play().catch(() => {}); } catch {}
  await new Promise(r => setTimeout(r, 2500));
  const cs = getComputedStyle(v);
  return { currentSrc: v.currentSrc, readyState: v.readyState, videoWidth: v.videoWidth, videoHeight: v.videoHeight, paused: v.paused, currentTime: v.currentTime, opacity: cs.opacity, filter: cs.filter, mixBlendMode: cs.mixBlendMode, display: cs.display };
});
await page.waitForTimeout(2500);
const playBuf = await fig.screenshot();
fs.writeFileSync(path.join(OUT, 'portrait-figure-playing-1440.png'), playBuf);
out.steps.push({ step: 'portrait-figure-video-playing', chroma: await chromaOf(playBuf) });

// 5. draw the live video frame to a canvas and read the real decoded pixels
out.videoFramePixels = await page.evaluate(() => {
  const v = document.querySelector('[data-testid="hero-portrait"] video') || document.querySelector('video');
  if (!v || !v.videoWidth) return { note: 'video has no decoded frame', videoWidth: v ? v.videoWidth : null };
  const c = document.createElement('canvas'); c.width = v.videoWidth; c.height = v.videoHeight;
  const g = c.getContext('2d'); g.drawImage(v, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let max = 0, gt2 = 0, gt4 = 0;
  for (let i = 0; i < d.length; i += 4) { const ch = Math.max(Math.abs(d[i] - d[i + 1]), Math.abs(d[i + 1] - d[i + 2]), Math.abs(d[i] - d[i + 2])); if (ch > max) max = ch; if (ch > 2) gt2++; if (ch > 4) gt4++; }
  const n = c.width * c.height;
  return { w: c.width, h: c.height, pixels: n, maxChroma: max, pxChromaGT2: gt2, pxChromaGT4: gt4, pctChromaLE4: +(100 * (n - gt4) / n).toFixed(4), currentTime: v.currentTime };
});

// 6. MiniVic panel — open it, look for a talking-head / colour
await page.evaluate(() => window.scrollTo(0, 2000)); await page.waitForTimeout(1200);
await page.locator('[data-testid="minivic-toggle"]').click({ force: true });
await page.waitForTimeout(4000);
out.minivicPanel = await page.evaluate(() => {
  const panel = document.querySelector('.minivic-panel, [role=dialog], .minivic-dock [class*=panel]');
  const vids = Array.from(document.querySelectorAll('video')).map(v => ({ src: v.currentSrc, w: v.videoWidth, h: v.videoHeight, paused: v.paused, opacity: getComputedStyle(v).opacity, inMiniVic: !!v.closest('.minivic-dock') }));
  const badge = Array.from(document.querySelectorAll('*')).filter(e => e.children.length === 0 && /MINIVIC\s*LIVE|LIVE/i.test(e.textContent || '')).map(e => e.textContent.trim()).slice(0, 6);
  return { panelPresent: !!panel, panelClass: panel ? panel.className.toString().slice(0, 80) : null, videos: vids, liveBadgeTexts: badge };
});
const dockBuf = await page.locator('.minivic-dock').screenshot();
fs.writeFileSync(path.join(OUT, 'minivic-panel-open-1440.png'), dockBuf);
out.steps.push({ step: 'minivic-panel-open', chroma: await chromaOf(dockBuf) });

// 7. full-page monochrome sweep (whole document, all sections painted)
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
const fullBuf = await page.screenshot({ fullPage: true });
fs.writeFileSync(path.join(OUT, 'fullpage-1440.png'), fullBuf);
out.steps.push({ step: 'fullpage-sweep', chroma: await chromaOf(fullBuf) });

out.pageerrors = errs;
await browser.close();
fs.writeFileSync(path.join(OUT, 'attack-results.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
