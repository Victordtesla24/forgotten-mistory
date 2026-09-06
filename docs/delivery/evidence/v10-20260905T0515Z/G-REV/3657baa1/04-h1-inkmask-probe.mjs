/**
 * rev-3657baa1-w2 — the decisive H1 readability measure.
 *
 * Pass 1 recovered glyph coverage photometrically (A vs ink-hidden B), which is blind
 * exactly where it matters: over near-white ground the ink (#f6f6f6) and the ground
 * are 16/255 apart, so ink and ground cannot be told apart there. This pass takes a
 * third frame C with every #hero glyph forced to pure red on an otherwise greyscale
 * page (max chroma over the fold measured 0 on this build), so coverage comes from a
 * channel the ground cannot occupy:
 *
 *   C = α·(255,0,0) + (1−α)·(v,v,v)  ⇒  G_C = (1−α)·v  ⇒  α = 1 − G_C / G_B
 *
 * α is then exact over bright ground — the wash case — and the contrast each core-ink
 * pixel actually has is contrast(L(#f6f6f6), L(B at that pixel)).
 */
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SPD = await import('/root/forgotten-mistory/scripts/validate/hero_plane_dominance.mjs');
const BASE = 'https://forgotten-mistory.web.app';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/3657baa1';
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 834, height: 1194 },
  { width: 390, height: 844 },
];
const PATHS = [
  { id: 'gl', label: '/?gl=force (shader, settled)', url: '/?gl=force', reducedMotion: false },
  { id: 'still', label: 'prefers-reduced-motion still', url: '/', reducedMotion: true },
];
const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const MIN = 4.5;

const readH1 = () => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const h1 = document.querySelector('#hero h1');
  if (!h1) return null;
  const cs = getComputedStyle(h1);
  const m = cs.color.match(/rgba?\(([^)]+)\)/);
  const colour = m ? m[1].split(',').map((v) => parseFloat(v)) : [246, 246, 246];
  const rects = [];
  const walk = (el) => {
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && (node.textContent || '').trim()) {
        const range = document.createRange();
        range.selectNodeContents(node);
        for (const r of Array.from(range.getClientRects())) {
          const x1 = Math.max(0, r.left);
          const y1 = Math.max(0, r.top);
          const x2 = Math.min(W, r.right);
          const y2 = Math.min(H, r.bottom);
          if (x2 > x1 && y2 > y1) rects.push({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) walk(node);
    }
  };
  walk(h1);
  const box = h1.getBoundingClientRect();
  // the plate the name is set on, if any: nearest ancestor/self with an opaque bg
  const plate = (() => {
    let el = h1;
    while (el && el !== document.body) {
      const s = getComputedStyle(el);
      const mm = s.backgroundColor.match(/rgba?\(([^)]+)\)/);
      const a = mm ? (mm[1].split(',').length > 3 ? parseFloat(mm[1].split(',')[3]) : 1) : 0;
      if (a >= 0.5) {
        const r = el.getBoundingClientRect();
        return { handle: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? `.${el.className.split(/\s+/)[0]}` : ''), bg: s.backgroundColor, x: r.left, y: r.top, w: r.width, h: r.height };
      }
      el = el.parentElement;
    }
    return null;
  })();
  return { viewport: { w: W, h: H }, colour, fontSize: cs.fontSize, lineHeight: cs.lineHeight, rects, box: { x: box.left, y: box.top, w: box.width, h: box.height }, plate, text: (h1.textContent || '').trim() };
};

const results = [];
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: [...SPD.GL_ARGS] });

for (const vp of VIEWPORTS) {
  for (const route of PATHS) {
    const tag = `${vp.width}x${vp.height}-${route.id}`;
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: route.reducedMotion ? 'reduce' : 'no-preference',
    });
    const page = await ctx.newPage();
    await SPD.preparePage(page, BASE, route);
    const dom = await page.evaluate(readH1);

    const shotA = await page.screenshot({ type: 'png' });
    await page.addStyleTag({
      content: '#hero h1, #hero h1 *{color:#ff0000 !important;-webkit-text-fill-color:#ff0000 !important;text-shadow:none !important}',
    });
    await page.waitForTimeout(200);
    const shotC = await page.screenshot({ type: 'png' });
    await page.addStyleTag({
      content: '#hero h1, #hero h1 *{color:transparent !important;-webkit-text-fill-color:transparent !important;text-shadow:none !important}',
    });
    await page.waitForTimeout(200);
    const shotB = await page.screenshot({ type: 'png' });
    writeFileSync(join(OUT, `ink-${tag}-C-red.png`), shotC);
    writeFileSync(join(OUT, `ink-${tag}-B-ground.png`), shotB);

    const A = PNG.sync.read(shotA);
    const C = PNG.sync.read(shotC);
    const B = PNG.sync.read(shotB);
    const fieldB = SPD.decodeLuma(shotB);
    const inkL = SPD.relativeLuminance(dom.colour[0], dom.colour[1], dom.colour[2]);

    const W = A.width;
    const alpha = new Float32Array(W * A.height);
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    const searchBoxes = dom.rects.map((r) => ({
      x0: Math.max(0, Math.floor(r.x) - 4),
      y0: Math.max(0, Math.floor(r.y) - 4),
      x1: Math.min(W, Math.ceil(r.x + r.w) + 4),
      y1: Math.min(A.height, Math.ceil(r.y + r.h) + 4),
    }));
    const core = [];
    for (const sb of searchBoxes) {
      for (let y = sb.y0; y < sb.y1; y += 1) {
        for (let x = sb.x0; x < sb.x1; x += 1) {
          const o = (y * W + x) * 4;
          const gB = B.data[o + 1];
          if (gB <= 4) {
            // ground is black here; red ink cannot be separated, but contrast is
            // trivially high — record coverage from the red channel instead
            const a = (C.data[o] - B.data[o]) / Math.max(1, 255 - B.data[o]);
            alpha[y * W + x] = Math.max(0, Math.min(1, a));
          } else {
            const a = 1 - C.data[o + 1] / gB;
            alpha[y * W + x] = Math.max(0, Math.min(1, a));
          }
          const a = alpha[y * W + x];
          if (a >= 0.5) {
            if (x < x1) x1 = x;
            if (y < y1) y1 = y;
            if (x + 1 > x2) x2 = x + 1;
            if (y + 1 > y2) y2 = y + 1;
          }
          if (a >= 0.9) core.push([x, y]);
        }
      }
    }

    const ratios = [];
    let below = 0;
    let worst = Infinity;
    let worstAt = null;
    const belowSet = new Set();
    for (const [x, y] of core) {
      const bgL = fieldB.values[y * W + x];
      const ratio = contrast(inkL, bgL);
      ratios.push(ratio);
      if (ratio < MIN) {
        below += 1;
        belowSet.add(y * W + x);
      }
      if (ratio < worst) {
        worst = ratio;
        worstAt = { x, y, bgL: Number(bgL.toFixed(4)) };
      }
    }
    ratios.sort((a, b) => a - b);
    const q = (p) => (ratios.length ? Number(ratios[Math.floor(p * (ratios.length - 1))].toFixed(2)) : null);

    // largest connected run of washed ink — a scattered AA fringe is not a washed letter
    let largest = 0;
    let largestBox = null;
    const seen = new Set();
    for (const key of belowSet) {
      if (seen.has(key)) continue;
      const stack = [key];
      seen.add(key);
      let n = 0;
      let bx1 = Infinity;
      let by1 = Infinity;
      let bx2 = -Infinity;
      let by2 = -Infinity;
      while (stack.length) {
        const k = stack.pop();
        const x = k % W;
        const y = (k - x) / W;
        n += 1;
        if (x < bx1) bx1 = x;
        if (y < by1) by1 = y;
        if (x + 1 > bx2) bx2 = x + 1;
        if (y + 1 > by2) by2 = y + 1;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nk = (y + dy) * W + (x + dx);
          if (belowSet.has(nk) && !seen.has(nk)) {
            seen.add(nk);
            stack.push(nk);
          }
        }
      }
      if (n > largest) {
        largest = n;
        largestBox = { x: bx1, y: by1, w: bx2 - bx1, h: by2 - by1 };
      }
    }

    const p95Box = (field, box) => {
      const bx0 = Math.max(0, Math.floor(box.x));
      const by0 = Math.max(0, Math.floor(box.y));
      const bx1 = Math.min(field.width, Math.ceil(box.x + box.w));
      const by1 = Math.min(field.height, Math.ceil(box.y + box.h));
      if (bx1 <= bx0 || by1 <= by0) return null;
      const vals = new Float64Array((bx1 - bx0) * (by1 - by0));
      let i = 0;
      for (let y = by0; y < by1; y += 1) for (let x = bx0; x < bx1; x += 1) { vals[i] = field.values[y * field.width + x]; i += 1; }
      return { p95: SPD.percentile(vals, 0.95), p50: SPD.percentile(vals, 0.5) };
    };
    const inkBox = x2 > x1 ? { x: x1, y: y1, w: x2 - x1, h: y2 - y1 } : null;
    const lineUnion = dom.rects.reduce(
      (acc, r) => ({
        x: Math.min(acc.x, r.x),
        y: Math.min(acc.y, r.y),
        x2: Math.max(acc.x2, r.x + r.w),
        y2: Math.max(acc.y2, r.y + r.h),
      }),
      { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity },
    );
    const lineBox = { x: lineUnion.x, y: lineUnion.y, w: lineUnion.x2 - lineUnion.x, h: lineUnion.y2 - lineUnion.y };
    const bgInk = inkBox ? p95Box(fieldB, inkBox) : null;
    const bgLine = p95Box(fieldB, lineBox);

    const row = {
      viewport: `${vp.width}x${vp.height}`,
      path: route.id,
      glyph_colour: dom.colour,
      glyph_L: Number(inkL.toFixed(4)),
      font_size: dom.fontSize,
      line_height: dom.lineHeight,
      h1_box: dom.box,
      line_boxes: dom.rects,
      plate: dom.plate,
      glyph_ink_box: inkBox,
      glyph_ink_box_p95_bg_L: bgInk ? Number(bgInk.p95.toFixed(4)) : null,
      glyph_ink_box_ratio: bgInk ? Number(contrast(inkL, bgInk.p95).toFixed(2)) : null,
      glyph_ink_box_pass: bgInk ? contrast(inkL, bgInk.p95) >= MIN : null,
      line_box: lineBox,
      line_box_p95_bg_L: bgLine ? Number(bgLine.p95.toFixed(4)) : null,
      line_box_ratio: bgLine ? Number(contrast(inkL, bgLine.p95).toFixed(2)) : null,
      line_box_pass: bgLine ? contrast(inkL, bgLine.p95) >= MIN : null,
      per_pixel: {
        core_ink_px: core.length,
        below_4_5_px: below,
        below_4_5_share: core.length ? Number((below / core.length).toFixed(5)) : null,
        worst_ratio: Number.isFinite(worst) ? Number(worst.toFixed(2)) : null,
        worst_at: worstAt,
        p01_ratio: q(0.01),
        p05_ratio: q(0.05),
        p50_ratio: q(0.5),
        largest_washed_blob_px: largest,
        largest_washed_blob_box: largestBox,
      },
    };
    results.push(row);
    console.log(
      `${tag}: inkbox ${row.glyph_ink_box_ratio}:1 (p95 bg ${row.glyph_ink_box_p95_bg_L}) linebox ${row.line_box_ratio}:1 ` +
        `core ${core.length}px below4.5 ${below} (${((100 * below) / Math.max(1, core.length)).toFixed(2)}%) worst ${row.per_pixel.worst_ratio} ` +
        `median ${row.per_pixel.p50_ratio} blob ${largest}px plate ${dom.plate ? dom.plate.bg : 'none'}`,
    );
    await ctx.close();
  }
}
await browser.close();
writeFileSync(join(OUT, '05-h1-inkmask.json'), `${JSON.stringify({ base: BASE, probed_utc: new Date().toISOString(), min: MIN, results }, null, 2)}\n`);
console.log('written 05-h1-inkmask.json');
