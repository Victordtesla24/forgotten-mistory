import sharp from 'sharp';
import fs from 'node:fs';
const files = process.argv.slice(2);
const out = [];
for (const f of files) {
  const img = sharp(f).removeAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  let max = 0, over2 = 0, over4 = 0, sum = 0;
  const hist = new Array(64).fill(0);
  let satOver025 = 0, satOver025NonGold = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const r = data[i], g = data[i+1], b = data[i+2];
    const c = Math.max(Math.abs(r-g), Math.abs(g-b), Math.abs(r-b));
    if (c > max) max = c;
    if (c > 2) over2++;
    if (c > 4) over4++;
    sum += c;
    hist[Math.min(63, c)]++;
    // HSV saturation
    const mx = Math.max(r,g,b), mn = Math.min(r,g,b);
    const s = mx === 0 ? 0 : (mx-mn)/mx;
    if (s > 0.25) {
      satOver025++;
      // hue in degrees
      const d = mx-mn;
      let h = 0;
      if (d !== 0) {
        if (mx === r) h = 60*(((g-b)/d)%6);
        else if (mx === g) h = 60*(((b-r)/d)+2);
        else h = 60*(((r-g)/d)+4);
      }
      if (h < 0) h += 360;
      if (!(h >= 35 && h <= 60)) satOver025NonGold++;
    }
  }
  out.push({
    file: f.split('/').pop(),
    w: info.width, h: info.height, pixels: n,
    maxChroma: max,
    meanChroma: +(sum/n).toFixed(3),
    pctChromaLE2: +(100*(n-over2)/n).toFixed(4),
    pctChromaLE4: +(100*(n-over4)/n).toFixed(4),
    pxChromaGT2: over2, pxChromaGT4: over4,
    satGT025: satOver025, satGT025NonGoldHue: satOver025NonGold,
    pctSatGT025: +(100*satOver025/n).toFixed(4)
  });
}
console.log(JSON.stringify(out, null, 2));
