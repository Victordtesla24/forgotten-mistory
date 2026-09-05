/**
 * Flagship scene evidence shots: hero / about / experience at 1440 and 390,
 * on the shader path (`/?gl=force`, SwiftShader) and on the reduced-motion
 * still. Serve `out/` first, then:
 *
 *   FM_PORT=5610 FM_OUT_DIR=docs/delivery/evidence/<run>/<lane>/08-screens \
 *     node scripts/verify/flagship-shots.mjs
 */
import { chromium } from 'playwright-core';

const PORT = process.env.FM_PORT || '5610';
const OUT =
  process.env.FM_OUT_DIR ||
  'docs/delivery/evidence/v10-20260905T0515Z/C22c-flagship-correction/08-screens';
await (await import('node:fs/promises')).mkdir(OUT, { recursive: true });

const browser = await chromium.launch({
  channel: 'chrome',
  args: [
    '--no-sandbox',
    '--use-gl=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
  ],
});

async function shoot(width, height, path, name, section, reduced) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  await page.goto(`http://127.0.0.1:${PORT}${path}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  if (section !== 'hero') {
    await page.locator(`#${section}`).evaluate((el) =>
      el.scrollIntoView({ block: 'start', behavior: 'instant' }),
    );
    await page.waitForTimeout(3500);
  }
  await page.screenshot({
    path: `${OUT}/${name}.jpg`,
    type: 'jpeg',
    quality: 72,
    fullPage: false,
  });
  await page.close();
  console.log(name);
}

for (const [w, h] of [
  [1440, 900],
  [390, 844],
]) {
  for (const section of ['hero', 'about', 'experience']) {
    await shoot(w, h, '/?gl=force', `${section}-${w}-glforce`, section, false);
  }
}
await shoot(390, 844, '/', 'hero-390-still-reduced', 'hero', true);
await shoot(1440, 900, '/', 'hero-1440-still-reduced', 'hero', true);

await browser.close();
