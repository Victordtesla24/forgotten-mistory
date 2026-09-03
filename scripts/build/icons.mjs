/**
 * icons.mjs — draws the site's icons from the site's own mark.
 *
 * The previous favicon was a 512x512 photograph weighing 318 kB. Two problems:
 * a face is illegible at the 16 px a favicon is actually rendered at, and the
 * browser downloaded a third of a megabyte on every page load to show it —
 * measured on a throttled mobile profile, it was the single largest asset on
 * the page, larger than every script.
 *
 * The replacement is the caliper bracket closing onto a V: legible at 16 px,
 * distinctive in a tab strip, and the same mark the page teaches a reader in
 * its hero. It is drawn rather than photographed, so it costs a few kilobytes.
 *
 * Usage:  node scripts/build/icons.mjs
 * Writes: app/icon.png (512), app/apple-icon.png (180)
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();

/** Proportions are in percentages so one drawing serves every size. */
function markup(size) {
  const stroke = Math.max(1, Math.round(size * 0.014));
  return `<!doctype html>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; }
  body { width: ${size}px; height: ${size}px; background: #0a0b0d; }
  svg { display: block; }
</style>
<body>
<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <rect width="100" height="100" fill="#0a0b0d"/>
  <!-- The caliper's two jaws, in the accent. -->
  <g stroke="#c9a84c" stroke-width="${(stroke / size) * 100}" fill="none" stroke-linecap="square">
    <path d="M32 22 H22 V78 H32"/>
    <path d="M68 22 H78 V78 H68"/>
  </g>
  <!-- The V, in the display serif's weight and proportion, drawn as paths so the
       icon needs no font at build time. -->
  <path d="M39 34 L50 68 L61 34" stroke="#f4f6fa" stroke-width="${(stroke * 1.5 / size) * 100}"
        fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</body>`;
}

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });

for (const [size, file] of [[512, 'icon.png'], [180, 'apple-icon.png']]) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(markup(size), { waitUntil: 'load' });
  const buffer = await page.screenshot({ type: 'png' });
  const out = join(ROOT, 'app', file);
  writeFileSync(out, buffer);
  console.log(`[icons] ${file} — ${size}px, ${(buffer.length / 1024).toFixed(1)} kB`);
  await page.close();
}

await browser.close();
