// Contact-sheet screenshots for looking at a page the way a reader sees it.
//
//   node scripts/screenshot.mjs <url> <outPrefix> <width> <height> <frames> [cols]
//
// Writes <outPrefix>-sheet.jpg: evenly spaced scroll positions, tiled with magenta gutters.
// Environment: THEME=light|dark, RM=1 for reduced motion, SEL='#id' to also write
// <outPrefix>-el.jpg with that element at full size. Prints page facts and console
// errors as JSON.
import { chromium } from 'playwright';
import sharp from 'sharp';

const [url, outPrefix, width, height, frames, columns = '4'] = process.argv.slice(2);
if (!url || !outPrefix || !width || !height || !frames) {
  console.error(
    'usage: node scripts/screenshot.mjs <url> <outPrefix> <width> <height> <frames> [cols]',
  );
  process.exit(2);
}

const W = Number(width);
const H = Number(height);
const FRAMES = Number(frames);
const COLUMNS = Number(columns);
const THEME = process.env.THEME ?? '';
const SELECTOR = process.env.SEL ?? '';

const browser = await chromium.launch({
  channel: 'chrome',
  args: [
    '--no-sandbox',
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});

try {
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    deviceScaleFactor: 1,
    isMobile: W < 600,
    hasTouch: W < 600,
    colorScheme: THEME === 'light' ? 'light' : 'dark',
    reducedMotion: process.env.RM ? 'reduce' : 'no-preference',
  });
  if (THEME) {
    await context.addInitScript((theme) => {
      try {
        localStorage.setItem('theme', theme);
      } catch {
        // Storage is blocked: the system colour scheme applies instead.
      }
    }, THEME);
  }

  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${String(error).slice(0, 200)}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text().slice(0, 200)}`);
  });
  await page
    .goto(url, { waitUntil: 'networkidle', timeout: 60_000 })
    .catch((error) => errors.push(`goto: ${error.message.slice(0, 120)}`));
  await page.waitForTimeout(2500);

  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const shots = [];
  for (let index = 0; index < FRAMES; index++) {
    const top = Math.round((total - H) * (FRAMES === 1 ? 0 : index / (FRAMES - 1)));
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top);
    await page.waitForTimeout(1400);
    shots.push(await page.screenshot({ type: 'png' }));
  }

  const tileWidth = W < 600 ? 300 : 640;
  const tileHeight = Math.round((tileWidth * H) / W);
  const gap = 8;
  const rows = Math.ceil(FRAMES / COLUMNS);
  const tiles = await Promise.all(
    shots.map(async (shot, index) => ({
      input: await sharp(shot).resize(tileWidth, tileHeight).png().toBuffer(),
      left: gap + (index % COLUMNS) * (tileWidth + gap),
      top: gap + Math.floor(index / COLUMNS) * (tileHeight + gap),
    })),
  );
  await sharp({
    create: {
      width: gap + COLUMNS * (tileWidth + gap),
      height: gap + rows * (tileHeight + gap),
      channels: 3,
      background: '#ff00ff',
    },
  })
    .composite(tiles)
    .jpeg({ quality: 82 })
    .toFile(`${outPrefix}-sheet.jpg`);

  if (SELECTOR) {
    const element = page.locator(SELECTOR).first();
    await element.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(1200);
    await element
      .screenshot({ type: 'jpeg', quality: 85, path: `${outPrefix}-el.jpg` })
      .catch((error) => errors.push(`sel: ${error.message.slice(0, 120)}`));
  }

  const facts = await page.evaluate(() => ({
    title: document.title,
    height: document.documentElement.scrollHeight,
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    sections: [...document.querySelectorAll('main section[id]')].map(
      (section) => `${section.id}@${Math.round(section.getBoundingClientRect().top + scrollY)}`,
    ),
    canvases: document.querySelectorAll('canvas').length,
    h1: document.querySelector('h1')?.textContent?.slice(0, 120),
    theme: document.documentElement.dataset.theme ?? 'system',
  }));
  console.log(JSON.stringify({ sheet: `${outPrefix}-sheet.jpg`, total, facts, errors }, null, 2));
} finally {
  await browser.close();
}
