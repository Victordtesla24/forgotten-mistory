import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const rootDir = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const assetsDir = path.join(rootDir, "public", "assets");
const source = path.join(assetsDir, "my_avatar.png");
const webpOut = path.join(assetsDir, "my_avatar.webp");
const avifOut = path.join(assetsDir, "my_avatar.avif");

if (!fs.existsSync(source)) {
  throw new Error(`Source image not found: ${source}`);
}

const image = sharp(source);
const metadata = await image.metadata();
const width = metadata.width ?? 0;

await image.webp({ quality: 88, effort: 6 }).toFile(webpOut);
await sharp(source).avif({ quality: 70, effort: 6 }).toFile(avifOut);

console.log(JSON.stringify({ source, webpOut, avifOut, width }, null, 2));
