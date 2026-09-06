/**
 * rev-3657baa1-w2 — independent adversarial probe of the live hero fold.
 *
 * Read-only. Points the shipped instrument (scripts/validate/hero_plane_dominance.mjs)
 * at the LIVE site, so SPD here is the same number the spec computes, and adds the
 * reader-truth H1 readability measure the brief's TC-HERO-A11Y-01 only approximates:
 *
 *   A  = the frame as shipped
 *   B  = the same frame with every #hero glyph's ink made transparent (layout, and
 *        therefore uCopyGuard, unchanged — the guard is only re-read on resize/fonts)
 *   α  = per-pixel glyph coverage recovered from A = α·C_ink + (1−α)·B
 *
 * From those three: the glyph ink box (bbox of α ≥ 0.5), the P95 background luminance
 * under it and under the full line box, and the per-pixel contrast every core-ink
 * pixel (α ≥ 0.9) actually has against the light directly beneath it.
 *
 * One browser, sequential, closed at the end (VPS has 4 cores and three build lanes).
 */
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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

const readFold = () => {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const describe = (el) => {
    const tag = el.tagName.toLowerCase();
    const testid = el.getAttribute('data-testid');
    if (el.id) return `${tag}#${el.id}`;
    if (testid) return `${tag}[data-testid=${testid}]`;
    const cls = typeof el.className === 'string' ? el.className.split(/\s+/).filter(Boolean)[0] : '';
    return cls ? `${tag}.${cls}` : tag;
  };
  const clip = (r) => {
    const x1 = Math.max(0, r.left);
    const y1 = Math.max(0, r.top);
    const x2 = Math.min(W, r.right);
    const y2 = Math.min(H, r.bottom);
    if (x2 <= x1 || y2 <= y1) return null;
    return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  };
  const painted = (el) => {
    const cs = getComputedStyle(el);
    return cs.visibility !== 'hidden' && cs.display !== 'none' && cs.opacity !== '0';
  };
  const raw = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  };

  const hero = document.querySelector('#hero');
  const h1El = document.querySelector('#hero h1');
  const textBlocks = [];
  const runs = [];
  const ctaGroups = [];
  const strayPressables = [];
  if (hero) {
    for (const el of Array.from(hero.querySelectorAll('*'))) {
      const tag = el.tagName.toLowerCase();
      if (['script', 'style', 'template', 'noscript'].includes(tag)) continue;
      if (!painted(el)) continue;
      const box = clip(el.getBoundingClientRect());
      if (!box) continue;
      const ownsText = Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || '').trim().length > 0,
      );
      if (ownsText) {
        const rects = [];
        for (const node of Array.from(el.childNodes)) {
          if (node.nodeType !== Node.TEXT_NODE || !(node.textContent || '').trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const r of Array.from(range.getClientRects())) {
            const line = clip(r);
            if (line) rects.push(line);
          }
        }
        const cs = getComputedStyle(el);
        const m = cs.color.match(/rgba?\(([^)]+)\)/);
        const parts = m ? m[1].split(',').map((v) => parseFloat(v)) : [246, 246, 246];
        const entry = {
          handle: describe(el),
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          colour: [parts[0], parts[1], parts[2]],
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          inH1: !!(h1El && (el === h1El || h1El.contains(el))),
          inActions: !!el.closest('[data-testid="hero-actions"]'),
          rects: rects.length ? rects : [box],
        };
        runs.push(entry);
        if (!el.closest('[data-testid="hero-actions"]')) {
          textBlocks.push({ handle: entry.handle, text: entry.text, rects: entry.rects });
        }
      }
      if (el.matches('a, button, [role="button"], input, select, textarea')) {
        const group = el.closest('[data-testid="hero-actions"]');
        if (group) {
          const handle = describe(group);
          if (!ctaGroups.includes(handle)) ctaGroups.push(handle);
        } else {
          strayPressables.push({
            handle: describe(el),
            text: (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
          });
        }
      }
    }
  }

  const proof = document.querySelector('[data-testid="hero-proof"]');
  const figureEl = document.querySelector('[data-testid="hero-portrait"]');
  const img = figureEl ? figureEl.querySelector('img') : null;
  const videos = Array.from(document.querySelectorAll('video')).map((v) => ({
    src: v.currentSrc || v.getAttribute('src') || '',
    preload: v.preload,
    paused: v.paused,
    currentTime: v.currentTime,
    readyState: v.readyState,
  }));
  const audios = Array.from(document.querySelectorAll('audio')).map((a) => ({
    src: a.currentSrc || a.getAttribute('src') || '',
    paused: a.paused,
    currentTime: a.currentTime,
  }));

  return {
    viewport: { w: W, h: H },
    buildCommit: (document.querySelector('meta[name="build-commit"]') || {}).content || null,
    textBlocks,
    runs,
    ctaGroups,
    strayPressables,
    proofTop: proof ? proof.getBoundingClientRect().top : null,
    plane: raw(document.querySelector('[data-plane="hero"]')),
    figure: raw(figureEl),
    figureNatural: img ? { width: img.naturalWidth, height: img.naturalHeight, currentSrc: img.currentSrc } : null,
    h1: raw(h1El),
    h1Text: h1El ? (h1El.textContent || '').replace(/\s+/g, ' ').trim() : null,
    guard: window.__heroCopyGuard || null,
    canvasesInHero: document.querySelectorAll('#hero canvas').length,
    canvasesInPlane: document.querySelectorAll('[data-plane="hero"] canvas').length,
    videos,
    audios,
  };
};

const lum = (r, g, b) => SPD.relativeLuminance(r, g, b);
const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

function decodeRGB(buf) {
  const png = PNG.sync.read(buf);
  return { data: png.data, width: png.width, height: png.height };
}

/** P95 of the luminance of `field` inside an integer box. */
function p95Box(field, box) {
  const x1 = Math.max(0, Math.floor(box.x));
  const y1 = Math.max(0, Math.floor(box.y));
  const x2 = Math.min(field.width, Math.ceil(box.x + box.w));
  const y2 = Math.min(field.height, Math.ceil(box.y + box.h));
  if (x2 <= x1 || y2 <= y1) return null;
  const vals = new Float64Array((x2 - x1) * (y2 - y1));
  let i = 0;
  for (let y = y1; y < y2; y += 1) {
    for (let x = x1; x < x2; x += 1) {
      vals[i] = field.values[y * field.width + x];
      i += 1;
    }
  }
  return { p95: SPD.percentile(vals, 0.95), p50: SPD.percentile(vals, 0.5), max: SPD.percentile(vals, 1), n: vals.length };
}

function maxChroma(rgb) {
  let max = 0;
  for (let i = 0; i < rgb.data.length; i += 4) {
    const r = rgb.data[i];
    const g = rgb.data[i + 1];
    const b = rgb.data[i + 2];
    const c = Math.max(r, g, b) - Math.min(r, g, b);
    if (c > max) max = c;
  }
  return max;
}

/**
 * Recover per-pixel glyph coverage α from the shipped frame A, the ink-hidden
 * frame B, and the run's computed ink colour, then measure what a reader sees.
 */
function readerContrast(A, B, fieldA, fieldB, run) {
  const W = fieldA.width;
  const inkL = lum(run.colour[0], run.colour[1], run.colour[2]);
  const perLine = [];
  let coreN = 0;
  let coreBelow = 0;
  let worst = Infinity;
  let worstAt = null;
  const coreRatios = [];
  let inkBoxX1 = Infinity;
  let inkBoxY1 = Infinity;
  let inkBoxX2 = -Infinity;
  let inkBoxY2 = -Infinity;

  for (const r of run.rects) {
    const x1 = Math.max(0, Math.floor(r.x));
    const y1 = Math.max(0, Math.floor(r.y));
    const x2 = Math.min(W, Math.ceil(r.x + r.w));
    const y2 = Math.min(fieldA.height, Math.ceil(r.y + r.h));
    if (x2 <= x1 || y2 <= y1) continue;
    let lx1 = Infinity;
    let ly1 = Infinity;
    let lx2 = -Infinity;
    let ly2 = -Infinity;
    let lineCore = 0;
    let lineBelow = 0;
    let lineWorst = Infinity;
    for (let y = y1; y < y2; y += 1) {
      for (let x = x1; x < x2; x += 1) {
        const o = (y * W + x) * 4;
        // coverage from the channel with the largest ink/background separation
        let alpha = 0;
        let sep = 0;
        for (let c = 0; c < 3; c += 1) {
          const bg = B.data[o + c];
          const d = run.colour[c] - bg;
          if (Math.abs(d) > Math.abs(sep)) {
            sep = d;
            alpha = (A.data[o + c] - bg) / d;
          }
        }
        if (!Number.isFinite(alpha) || Math.abs(sep) < 12) continue; // ink ≈ ground here: no signal
        if (alpha < 0.5) continue;
        if (x < lx1) lx1 = x;
        if (y < ly1) ly1 = y;
        if (x + 1 > lx2) lx2 = x + 1;
        if (y + 1 > ly2) ly2 = y + 1;
        if (alpha < 0.9) continue;
        const bgL = fieldB.values[y * W + x];
        const ratio = contrast(inkL, bgL);
        lineCore += 1;
        coreRatios.push(ratio);
        if (ratio < 4.5) lineBelow += 1;
        if (ratio < lineWorst) lineWorst = ratio;
        if (ratio < worst) {
          worst = ratio;
          worstAt = { x, y, bgL: Number(bgL.toFixed(4)) };
        }
      }
    }
    coreN += lineCore;
    coreBelow += lineBelow;
    const lineBox = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
    const inkBox = lx2 > lx1 ? { x: lx1, y: ly1, w: lx2 - lx1, h: ly2 - ly1 } : null;
    if (inkBox) {
      inkBoxX1 = Math.min(inkBoxX1, inkBox.x);
      inkBoxY1 = Math.min(inkBoxY1, inkBox.y);
      inkBoxX2 = Math.max(inkBoxX2, inkBox.x + inkBox.w);
      inkBoxY2 = Math.max(inkBoxY2, inkBox.y + inkBox.h);
    }
    const bgLine = p95Box(fieldB, lineBox);
    const bgInk = inkBox ? p95Box(fieldB, inkBox) : null;
    perLine.push({
      lineBox,
      inkBox,
      lineBox_p95_bg: bgLine ? Number(bgLine.p95.toFixed(4)) : null,
      lineBox_ratio: bgLine ? Number(contrast(inkL, bgLine.p95).toFixed(2)) : null,
      inkBox_p95_bg: bgInk ? Number(bgInk.p95.toFixed(4)) : null,
      inkBox_ratio: bgInk ? Number(contrast(inkL, bgInk.p95).toFixed(2)) : null,
      core_px: lineCore,
      core_below_4_5: lineBelow,
      worst_local_ratio: Number.isFinite(lineWorst) ? Number(lineWorst.toFixed(2)) : null,
    });
  }

  coreRatios.sort((a, b) => a - b);
  const q = (p) => (coreRatios.length ? Number(coreRatios[Math.floor(p * (coreRatios.length - 1))].toFixed(2)) : null);
  const wholeInkBox = inkBoxX2 > inkBoxX1 ? { x: inkBoxX1, y: inkBoxY1, w: inkBoxX2 - inkBoxX1, h: inkBoxY2 - inkBoxY1 } : null;
  const wholeLineBox = (() => {
    let x1 = Infinity;
    let y1 = Infinity;
    let x2 = -Infinity;
    let y2 = -Infinity;
    for (const r of run.rects) {
      x1 = Math.min(x1, r.x);
      y1 = Math.min(y1, r.y);
      x2 = Math.max(x2, r.x + r.w);
      y2 = Math.max(y2, r.y + r.h);
    }
    return x2 > x1 ? { x: x1, y: y1, w: x2 - x1, h: y2 - y1 } : null;
  })();
  const bgWholeInk = wholeInkBox ? p95Box(fieldB, wholeInkBox) : null;
  const bgWholeLine = wholeLineBox ? p95Box(fieldB, wholeLineBox) : null;

  return {
    handle: run.handle,
    text: run.text,
    colour: run.colour,
    fontSize: run.fontSize,
    glyph_L: Number(inkL.toFixed(4)),
    glyph_ink_box: wholeInkBox,
    line_box: wholeLineBox,
    glyph_box: {
      p95_bg_L: bgWholeInk ? Number(bgWholeInk.p95.toFixed(4)) : null,
      p50_bg_L: bgWholeInk ? Number(bgWholeInk.p50.toFixed(4)) : null,
      ratio: bgWholeInk ? Number(contrast(inkL, bgWholeInk.p95).toFixed(2)) : null,
      pass: bgWholeInk ? contrast(inkL, bgWholeInk.p95) >= 4.5 : null,
    },
    line_box_measure: {
      p95_bg_L: bgWholeLine ? Number(bgWholeLine.p95.toFixed(4)) : null,
      p50_bg_L: bgWholeLine ? Number(bgWholeLine.p50.toFixed(4)) : null,
      ratio: bgWholeLine ? Number(contrast(inkL, bgWholeLine.p95).toFixed(2)) : null,
      pass: bgWholeLine ? contrast(inkL, bgWholeLine.p95) >= 4.5 : null,
    },
    per_pixel: {
      core_px: coreN,
      below_4_5_px: coreBelow,
      below_4_5_share: coreN ? Number((coreBelow / coreN).toFixed(4)) : null,
      worst_ratio: Number.isFinite(worst) ? Number(worst.toFixed(2)) : null,
      worst_at: worstAt,
      p05_ratio: q(0.05),
      p50_ratio: q(0.5),
    },
    lines: perLine,
  };
}

const results = [];
const browser = await chromium.launch({
  executablePath: '/usr/bin/google-chrome',
  args: [...SPD.GL_ARGS],
});

for (const vp of VIEWPORTS) {
  for (const route of PATHS) {
    const tag = `${vp.width}x${vp.height}-${route.id}`;
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: route.reducedMotion ? 'reduce' : 'no-preference',
    });
    const page = await ctx.newPage();
    const pageErrors = [];
    const consoleErrors = [];
    const mediaRequests = [];
    page.on('pageerror', (e) => pageErrors.push(String(e && e.message ? e.message : e)));
    page.on('console', (m) => {
      if (m.type() === 'error' || m.type() === 'warning') consoleErrors.push(`${m.type()}: ${m.text().slice(0, 200)}`);
    });
    page.on('request', (r) => {
      const u = r.url();
      if (/\.(mp4|webm|mp3|m4a|ogg|mov)(\?|$)/i.test(u)) mediaRequests.push(`${r.method()} ${u}`);
    });

    await SPD.preparePage(page, BASE, route);
    const dom = await page.evaluate(readFold);

    // A — the shipped frame, measured by the shipped instrument
    const shotA = join(OUT, `fold-${tag}-A-shipped.png`);
    const dominance = await SPD.measureFold(page, { shotPath: shotA });
    const bufA = readFileSync(shotA);
    const A = decodeRGB(bufA);
    const fieldA = SPD.decodeLuma(bufA);

    // B — the same frame with every #hero glyph's ink transparent
    await page.addStyleTag({
      content:
        '#hero, #hero *{color:transparent !important;' +
        '-webkit-text-fill-color:transparent !important;text-shadow:none !important}',
    });
    await page.waitForTimeout(250);
    const shotB = join(OUT, `fold-${tag}-B-ink-hidden.png`);
    const bufB = await page.screenshot({ type: 'png', fullPage: false, path: shotB });
    const B = decodeRGB(bufB);
    const fieldB = SPD.decodeLuma(bufB);
    const guardAfter = await page.evaluate(() => window.__heroCopyGuard || null);

    // drift control — restore the ink, re-shoot, compare A vs A2 away from type
    await page.evaluate(() => {
      for (const s of Array.from(document.querySelectorAll('style'))) {
        if (s.textContent && s.textContent.includes('-webkit-text-fill-color:transparent')) s.remove();
      }
    });
    await page.waitForTimeout(250);
    const bufA2 = await page.screenshot({ type: 'png', fullPage: false });
    const fieldA2 = SPD.decodeLuma(bufA2);
    let driftSum = 0;
    let driftMax = 0;
    for (let i = 0; i < fieldA.values.length; i += 1) {
      const d = Math.abs(fieldA.values[i] - fieldA2.values[i]);
      driftSum += d;
      if (d > driftMax) driftMax = d;
    }

    const h1Runs = dom.runs.filter((r) => r.inH1);
    const h1Measures = h1Runs.map((r) => readerContrast(A, B, fieldA, fieldB, r));
    const otherMeasures = dom.runs.filter((r) => !r.inH1).map((r) => readerContrast(A, B, fieldA, fieldB, r));

    const foldBlocks = dom.textBlocks.filter((b) => b.rects.some((r) => r.y < dom.viewport.h));
    const figureInPlane =
      dom.figure && dom.plane
        ? dom.figure.x >= dom.plane.x - 0.5 &&
          dom.figure.y >= dom.plane.y - 0.5 &&
          dom.figure.x + dom.figure.w <= dom.plane.x + dom.plane.w + 0.5 &&
          dom.figure.y + dom.figure.h <= dom.plane.y + dom.plane.h + 0.5
        : null;

    const row = {
      viewport: `${vp.width}x${vp.height}`,
      path: route.id,
      build_commit: dom.buildCommit,
      spd: Number(dominance.spd.toFixed(4)),
      spd_min_075: dominance.spd >= 0.75,
      spd_ship_078: dominance.spd >= 0.78,
      lit_density: Number(dominance.litDensity.toFixed(4)),
      lit_floor_0045: dominance.litDensity >= 0.045,
      ground_L: Number(dominance.ground.toFixed(4)),
      peak_L: Number(dominance.peak.toFixed(4)),
      canvases_hero: dom.canvasesInHero,
      canvases_plane: dom.canvasesInPlane,
      ground_chain: dominance.groundChain,
      max_chroma_fold: maxChroma(A),
      fold_text_blocks: foldBlocks.length,
      fold_text_block_handles: foldBlocks.map((b) => `${b.handle} "${b.text.slice(0, 32)}"`),
      cta_groups: dom.ctaGroups,
      stray_pressables: dom.strayPressables,
      proof_top: dom.proofTop === null ? null : Number(dom.proofTop.toFixed(1)),
      proof_below_fold: dom.proofTop === null ? null : dom.proofTop >= dom.viewport.h,
      plane: dom.plane,
      figure: dom.figure,
      figure_in_plane: figureInPlane,
      figure_width: dom.figure ? Number(dom.figure.w.toFixed(1)) : null,
      figure_width_le_846: dom.figure ? dom.figure.w <= 846 : null,
      figure_natural: dom.figureNatural,
      h1_rect: dom.h1,
      h1_text: dom.h1Text,
      copy_guard_before: dom.guard,
      copy_guard_after_hide: guardAfter,
      videos: dom.videos,
      audios: dom.audios,
      media_requests: mediaRequests,
      page_errors: pageErrors,
      console_errors: consoleErrors,
      frame_drift: { mean: Number((driftSum / fieldA.values.length).toFixed(5)), max: Number(driftMax.toFixed(4)) },
      h1_contrast: h1Measures,
      other_text_contrast: otherMeasures,
    };
    results.push(row);
    // eslint-disable-next-line no-console
    console.log(
      `${row.viewport} ${row.path}: SPD ${row.spd} lit ${row.lit_density} canvases ${row.canvases_hero} ` +
        `H1 glyphbox ${h1Measures.map((m) => m.glyph_box.ratio).join(',')} linebox ${h1Measures
          .map((m) => m.line_box_measure.ratio)
          .join(',')} worstpx ${h1Measures.map((m) => m.per_pixel.worst_ratio).join(',')} ` +
        `blocks ${row.fold_text_blocks} chroma ${row.max_chroma_fold} err ${pageErrors.length}`,
    );
    await ctx.close();
  }
}

await browser.close();
writeFileSync(join(OUT, '01-hero-fold.json'), `${JSON.stringify({ base: BASE, probed_utc: new Date().toISOString(), results }, null, 2)}\n`);
console.log('written 01-hero-fold.json');
