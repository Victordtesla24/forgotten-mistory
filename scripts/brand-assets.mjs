// Regenerates the site's three brand images from the design tokens and the copy it ships:
//
//   public/assets/og-image.png   1200 x 630   link-preview card (under 300 kB)
//   app/icon.png                  512 x 512   browser icon
//   app/apple-icon.png            180 x 180   home-screen icon
//
//   node scripts/brand-assets.mjs
//
// Colours come from the dark values on :root in app/globals.css; the name, headline and host
// come from content/. The card is rendered by the system Chrome (as in scripts/screenshot.mjs)
// and loads Geist, Instrument Serif and Geist Mono from Google Fonts, the families next/font
// self-hosts for the site, so it needs network access. The icons are plain geometry.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (path) => readFileSync(join(root, path), 'utf8');

/** The first capture group of `pattern` in `path`; fails loudly when the source changed shape. */
function pick(path, pattern) {
  const match = pattern.exec(read(path));
  if (!match) throw new Error(`${path}: nothing matches ${pattern}`);
  return match[1];
}

/** The dark-theme tokens: the first :root block of app/globals.css. */
function readTokens() {
  const block = pick('app/globals.css', /:root\s*{([^}]*)}/);
  return Object.fromEntries(
    [...block.matchAll(/--([a-z-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]),
  );
}

const tokens = readTokens();
for (const name of ['bg', 'line-strong', 'text', 'muted', 'accent', 'accent-soft']) {
  if (!tokens[name]) throw new Error(`app/globals.css has no --${name} on :root`);
}

const name = pick('content/site.ts', /\n\s*name: '([^']+)'/);
const host = new URL(pick('content/site.ts', /SITE_URL = '([^']+)'/)).host;
const headline = /lead: '([^']*)', emphasis: '([^']*)', tail: '([^']*)'/.exec(read('content/hero.ts'));
if (!headline) throw new Error('content/hero.ts: no headline');
const [, lead, emphasis, tail] = headline;

/** The hero's career scale: a tick a year, a numeral every few, the present in the accent. */
const SCALE = {
  from: Number(pick('content/experience.ts', /TIMELINE_START = (\d+)/)),
  to: Number(pick('content/experience.ts', /NOW = ym\((\d+),/)),
  labelEvery: Number(pick('components/sections/Hero/careerScale.ts', /NUMERAL_STEP = (\d+)/)),
};

function rulerSvg(width) {
  const { from, to, labelEvery } = SCALE;
  const x = (year) => ((year - from) / (to - from)) * (width - 1) + 0.5;
  const ticks = [];
  for (let year = from; year <= to; year += 1) {
    const major = (year - from) % labelEvery === 0;
    const now = year === to;
    ticks.push(
      `<line x1="${x(year)}" x2="${x(year)}" y1="0" y2="${major ? 18 : 9}" stroke="${
        now ? tokens.accent : major ? tokens.muted : tokens['line-strong']
      }" stroke-width="${now ? 2 : 1}"/>`,
    );
    if (major) {
      const anchor = year === from ? 'start' : year === to ? 'end' : 'middle';
      ticks.push(
        `<text x="${x(year)}" y="43" text-anchor="${anchor}" fill="${
          now ? tokens.accent : tokens.muted
        }" font-family="'Geist Mono'" font-size="17" style="font-variant-numeric:tabular-nums">${year}</text>`,
      );
    }
  }
  return `<svg width="${width}" height="48" viewBox="0 0 ${width} 48" overflow="visible">
    <line x1="0" x2="${width}" y1="0.5" y2="0.5" stroke="${tokens['line-strong']}"/>${ticks.join('')}</svg>`;
}

const cardHtml = `<!doctype html>
<meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@500;600&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@1&display=block">
<style>
  * { box-sizing: border-box; margin: 0; }
  body {
    position: relative; width: 1200px; height: 630px; overflow: hidden;
    display: flex; flex-direction: column; justify-content: space-between;
    padding: 76px 84px 68px;
    background: radial-gradient(70% 90% at 88% -10%, ${tokens['accent-soft']}, transparent 70%), ${tokens.bg};
    color: ${tokens.text}; font-family: 'Geist', sans-serif; -webkit-font-smoothing: antialiased;
  }
  .name { font-size: 30px; font-weight: 500; letter-spacing: -0.01em; }
  h1 {
    max-width: 1010px; font-size: 100px; font-weight: 600; line-height: 1;
    letter-spacing: -0.035em; text-wrap: balance;
  }
  h1 em {
    color: ${tokens.accent}; font-family: 'Instrument Serif', serif; font-style: italic;
    font-weight: 400; letter-spacing: -0.015em;
  }
  .foot { display: flex; align-items: flex-end; justify-content: space-between; }
  .host {
    color: ${tokens.muted}; font-family: 'Geist Mono', monospace;
    font-size: 23px; font-weight: 500; letter-spacing: 0.02em;
  }
</style>
<p class="name">${name}</p>
<h1>${lead}<em>${emphasis}</em>${tail}</h1>
<div class="foot">${rulerSvg(430)}<p class="host">${host}</p></div>`;

async function renderCard() {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
    await page.setContent(cardHtml, { waitUntil: 'networkidle' });
    const missing = await page.evaluate(async () => {
      const faces = ["600 100px Geist", "500 30px Geist", "italic 400 100px 'Instrument Serif'", "500 23px 'Geist Mono'"];
      await Promise.all(faces.map((face) => document.fonts.load(face)));
      await document.fonts.ready;
      return faces.filter((face) => !document.fonts.check(face));
    });
    if (missing.length > 0) throw new Error(`fonts did not load: ${missing.join(', ')}`);
    return await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 630 } });
  } finally {
    await browser.close();
  }
}

/**
 * The mark: a V on the page background, standing on one accent tick, the ruler's
 * smallest unit. Drawn as plain geometry so it stays sharp at 16 px.
 */
const MARK = (() => {
  const top = 72;
  const arm = 84;
  const half = 176;
  const rise = 300;
  const slope = rise / half;
  const outerTip = top + half * slope;
  const innerTip = top + (half - arm) * slope;
  const v = [
    [256 - half, top],
    [256 - half + arm, top],
    [256, innerTip],
    [256 + half - arm, top],
    [256 + half, top],
    [256, outerTip],
  ];
  const tick = { x: 256 - 64, y: outerTip + 34, width: 128, height: 34 };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <rect width="512" height="512" fill="${tokens.bg}"/>
    <polygon points="${v.map((point) => point.join(',')).join(' ')}" fill="${tokens.text}"/>
    <rect x="${tick.x}" y="${tick.y}" width="${tick.width}" height="${tick.height}" fill="${tokens.accent}"/>
  </svg>`;
})();

async function icon(size) {
  return sharp(Buffer.from(MARK), { density: (72 * size) / 512 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const OG_LIMIT = 300 * 1024;
const card = await sharp(await renderCard()).png({ compressionLevel: 9 }).toBuffer();
if (card.length >= OG_LIMIT) throw new Error(`og-image.png is ${card.length} bytes, over ${OG_LIMIT}`);

const outputs = [
  ['public/assets/og-image.png', card],
  ['app/icon.png', await icon(512)],
  ['app/apple-icon.png', await icon(180)],
];
for (const [path, bytes] of outputs) {
  writeFileSync(join(root, path), bytes);
  console.log(`${path}  ${(bytes.length / 1024).toFixed(1)} kB`);
}
