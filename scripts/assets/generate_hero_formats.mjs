/**
 * generate_hero_formats.mjs — regenerate the hero portrait's three stills from
 * one master, in one reproducible pass.
 *
 * The portrait is MONOCHROME (G-H6, 2026-09-06). docs/prompt.md §0.3-2 / C-8
 * allow black, white and gold only, and the chromatic exception the photograph
 * used to hold is retired — see docs/architecture/PALETTE-EXCEPTIONS.md. The
 * grade lives in the shipped bytes, produced here by sharp's `.grayscale()`,
 * never in a CSS `filter` laid over a colour file: a filter would leave a
 * colour asset on the wire, and every palette gate on the site reads code, not
 * pixels, so nothing would catch it. tests/hero_assets_monochrome.test.mjs
 * decodes what this script writes and fails on any pixel with chroma > 2.
 *
 * The master is the 1480×826 WebP — the highest-fidelity still on this host at
 * the portrait's native resolution (the PNG is a quantised fallback, so it is
 * never the source). Nothing here scales: an upscale would invent detail the
 * capture never had.
 *
 * Usage:  node scripts/assets/generate_hero_formats.mjs [source]
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const assetsDir = path.join(rootDir, "public", "assets");
const source = path.resolve(process.argv[2] ?? path.join(assetsDir, "my_avatar.webp"));
const pngOut = path.join(assetsDir, "my_avatar.png");
const webpOut = path.join(assetsDir, "my_avatar.webp");
const avifOut = path.join(assetsDir, "my_avatar.avif");

/** The PNG is the no-modern-format fallback and the schema image; the static
 *  audit (TC-NFR-PERF) caps every image at 500 kB. */
const IMG_BUDGET = 500 * 1024;

if (!fs.existsSync(source)) {
  throw new Error(`Source image not found: ${source}`);
}

// Decode once, to raw greyscale pixels at the master's own resolution. Every
// output below is encoded from this same buffer, so the three formats cannot
// drift from one another or from the source.
const master = sharp(source).grayscale();
const { width, height } = await master.metadata();
const raw = await master.raw().toBuffer({ resolveWithObject: true });
const fromRaw = () =>
  sharp(raw.data, { raw: { width: raw.info.width, height: raw.info.height, channels: raw.info.channels } });

/** Encode the PNG at the smallest colour depth that stays inside the budget:
 *  full 8-bit grey first, then a greyscale palette, coarsening only as far as
 *  the cap demands. Every rung is still greyscale — quantisation never adds a
 *  hue. */
async function encodePng() {
  const attempts = [
    { label: "grey8", options: { compressionLevel: 9, effort: 10, palette: false } },
    { label: "palette-256", options: { compressionLevel: 9, effort: 10, palette: true, colours: 256 } },
    { label: "palette-192", options: { compressionLevel: 9, effort: 10, palette: true, colours: 192 } },
    { label: "palette-128", options: { compressionLevel: 9, effort: 10, palette: true, colours: 128 } },
    { label: "palette-96", options: { compressionLevel: 9, effort: 10, palette: true, colours: 96 } },
  ];
  for (const attempt of attempts) {
    const buffer = await fromRaw().png(attempt.options).toBuffer();
    if (buffer.byteLength <= IMG_BUDGET) return { buffer, ...attempt };
  }
  throw new Error(`no PNG encoding of ${source} fits the ${IMG_BUDGET} B image budget`);
}

const png = await encodePng();
fs.writeFileSync(pngOut, png.buffer);
const webp = await fromRaw().webp({ quality: 88, effort: 6 }).toBuffer();
fs.writeFileSync(webpOut, webp);
const avif = await fromRaw().avif({ quality: 70, effort: 6 }).toBuffer();
fs.writeFileSync(avifOut, avif);

console.log(
  JSON.stringify(
    {
      source,
      width,
      height,
      grayscale: true,
      png: { path: pngOut, bytes: png.buffer.byteLength, encoding: png.label, budget: IMG_BUDGET },
      webp: { path: webpOut, bytes: webp.byteLength },
      avif: { path: avifOut, bytes: avif.byteLength },
    },
    null,
    2,
  ),
);
