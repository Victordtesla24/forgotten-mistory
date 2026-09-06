/**
 * rev-3657baa1-w2 — crop the H1 band out of the captures the probe already took and
 * mark, in the ink-hidden frame, exactly which background pixels under the name are
 * bright enough to wash a glyph (contrast < 4.5:1 against #f6f6f6, L 0.9216).
 * No browser: pure pixel work on 01-hero-fold.json's own PNGs.
 */
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync } from 'node:fs';

const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/3657baa1';
const data = JSON.parse(readFileSync(`${OUT}/01-hero-fold.json`, 'utf8'));
const lum = (r, g, b) => {
  const ch = (v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
const GLYPH_L = 0.9216;
const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
// the background luminance at which #f6f6f6 type drops below 4.5:1
const WASH_L = (GLYPH_L + 0.05) / 4.5 - 0.05;

const summary = [];
for (const r of data.results) {
  const tag = `${r.viewport}-${r.path}`;
  const m = r.h1_contrast[0];
  if (!m) continue;
  const box = m.line_box;
  const pad = 24;
  const x0 = Math.max(0, Math.floor(box.x - pad));
  const y0 = Math.max(0, Math.floor(box.y - pad));
  const x1 = Math.ceil(box.x + box.w + pad);
  const y1 = Math.ceil(box.y + box.h + pad);

  const A = PNG.sync.read(readFileSync(`${OUT}/fold-${tag}-A-shipped.png`));
  const B = PNG.sync.read(readFileSync(`${OUT}/fold-${tag}-B-ink-hidden.png`));
  const w = Math.min(x1, A.width) - x0;
  const h = Math.min(y1, A.height) - y0;

  const crop = (src, mark) => {
    const out = new PNG({ width: w, height: h });
    for (let y = 0; y < h; y += 1) {
      for (let x = 0; x < w; x += 1) {
        const so = ((y + y0) * src.width + (x + x0)) * 4;
        const dogh = (y * w + x) * 4;
        let [rr, gg, bb] = [src.data[so], src.data[so + 1], src.data[so + 2]];
        if (mark) {
          const bo = ((y + y0) * B.width + (x + x0)) * 4;
          const bgL = lum(B.data[bo], B.data[bo + 1], B.data[bo + 2]);
          if (bgL > WASH_L) {
            // paint the wash zone red so the eye sees what the number says
            rr = 255;
            gg = Math.round(gg * 0.25);
            bb = Math.round(bb * 0.25);
          }
        }
        out.data[dogh] = rr;
        out.data[dogh + 1] = gg;
        out.data[dogh + 2] = bb;
        out.data[dogh + 3] = 255;
      }
    }
    return PNG.sync.write(out);
  };

  writeFileSync(`${OUT}/h1-${tag}-shipped.png`, crop(A, false));
  writeFileSync(`${OUT}/h1-${tag}-ground.png`, crop(B, false));
  writeFileSync(`${OUT}/h1-${tag}-washzone.png`, crop(A, true));

  // where the bright ground under the name is, and how much of the band it is
  let washPx = 0;
  let wx1 = Infinity;
  let wy1 = Infinity;
  let wx2 = -Infinity;
  let wy2 = -Infinity;
  const lx0 = Math.max(0, Math.floor(box.x));
  const ly0 = Math.max(0, Math.floor(box.y));
  const lx1 = Math.min(B.width, Math.ceil(box.x + box.w));
  const ly1 = Math.min(B.height, Math.ceil(box.y + box.h));
  for (let y = ly0; y < ly1; y += 1) {
    for (let x = lx0; x < lx1; x += 1) {
      const o = (y * B.width + x) * 4;
      const L = lum(B.data[o], B.data[o + 1], B.data[o + 2]);
      if (L > WASH_L) {
        washPx += 1;
        if (x < wx1) wx1 = x;
        if (y < wy1) wy1 = y;
        if (x + 1 > wx2) wx2 = x + 1;
        if (y + 1 > wy2) wy2 = y + 1;
      }
    }
  }
  const bandPx = (lx1 - lx0) * (ly1 - ly0);
  summary.push({
    viewport: r.viewport,
    path: r.path,
    wash_threshold_L: Number(WASH_L.toFixed(4)),
    line_box: box,
    wash_px_in_line_box: washPx,
    wash_share_of_line_box: Number((washPx / bandPx).toFixed(4)),
    wash_bbox: washPx ? { x: wx1, y: wy1, w: wx2 - wx1, h: wy2 - wy1 } : null,
    figure_rect: r.figure,
    wash_inside_figure:
      washPx && r.figure
        ? wx1 >= r.figure.x - 1 && wx2 <= r.figure.x + r.figure.w + 1 && wy1 >= r.figure.y - 1 && wy2 <= r.figure.y + r.figure.h + 1
        : null,
    ink_px_below_4_5: r.h1_contrast[0].per_pixel.below_4_5_px,
    ink_px_core: r.h1_contrast[0].per_pixel.core_px,
    worst_local_ratio: r.h1_contrast[0].per_pixel.worst_ratio,
  });
  console.log(
    `${tag}: wash ground px in line box ${washPx}/${bandPx} (${((100 * washPx) / bandPx).toFixed(2)}%), ` +
      `bbox ${JSON.stringify(summary[summary.length - 1].wash_bbox)} inside figure ${summary[summary.length - 1].wash_inside_figure}`,
  );
}
writeFileSync(`${OUT}/03-h1-washzone.json`, `${JSON.stringify({ glyph_L: GLYPH_L, wash_threshold_L: WASH_L, summary }, null, 2)}\n`);
console.log('written 03-h1-washzone.json');
