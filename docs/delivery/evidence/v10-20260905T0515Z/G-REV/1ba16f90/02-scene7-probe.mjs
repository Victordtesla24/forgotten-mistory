/**
 * rev-1ba16f90-w2 — scene 7 (`career-descent`) INTERIM, plus a settle-confirmation
 * re-run of the one About state that failed in phase A.
 *
 * Scene 7 is measured, not graded: band presence, my own vertical edge count and
 * rank correlation of band thickness against role duration, parallax between two
 * scroll positions inside the sticky band, text over the stage, pageerrors, and a
 * SwiftShader frame time carrying its renderer string (never called "fps").
 */
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SPD = await import('/root/forgotten-mistory/scripts/validate/hero_plane_dominance.mjs');
const BASE = 'https://forgotten-mistory.web.app';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/1ba16f90';
mkdirSync(OUT, { recursive: true });

const lum = (r, g, b) => {
  const ch = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
const mean = (xs) => xs.reduce((s, v) => s + v, 0) / Math.max(xs.length, 1);

/** Mean luminance per image row over the central 60% of the width. */
function rowProfile(png) {
  const x0 = Math.floor(png.width * 0.2), x1 = Math.ceil(png.width * 0.8);
  const p = new Array(png.height).fill(0);
  for (let y = 0; y < png.height; y += 1) {
    let s = 0;
    for (let x = x0; x < x1; x += 1) {
      const o = (y * png.width + x) * 4;
      s += lum(png.data[o], png.data[o + 1], png.data[o + 2]);
    }
    p[y] = s / (x1 - x0);
  }
  return p;
}
const smooth = (p, k) => p.map((_, i) => {
  let s = 0, n = 0;
  for (let j = Math.max(0, i - k); j <= Math.min(p.length - 1, i + k); j += 1) { s += p[j]; n += 1; }
  return s / n;
});
/** Local minima of the smoothed profile that sit a real step below their flanks: stratum edges. */
function edges(profile, k = 5, minDrop = 0.02) {
  const s = smooth(profile, k);
  const out = [];
  for (let i = k + 1; i < s.length - k - 1; i += 1) {
    let isMin = true;
    for (let j = i - k; j <= i + k; j += 1) if (s[j] < s[i]) { isMin = false; break; }
    if (!isMin) continue;
    const flank = Math.max(...s.slice(Math.max(0, i - 3 * k), Math.min(s.length, i + 3 * k)));
    if (flank - s[i] >= minDrop) {
      if (out.length === 0 || i - out[out.length - 1] > k) out.push(i);
    }
  }
  return out;
}
function spearman(a, b) {
  const rank = (xs) => {
    const idx = xs.map((v, i) => [v, i]).sort((p, q) => p[0] - q[0]);
    const r = new Array(xs.length);
    idx.forEach(([, i], k) => { r[i] = k + 1; });
    return r;
  };
  const ra = rank(a), rb = rank(b), n = a.length;
  const ma = mean(ra), mb = mean(rb);
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i += 1) { num += (ra[i] - ma) * (rb[i] - mb); da += (ra[i] - ma) ** 2; db += (rb[i] - mb) ** 2; }
  return num / Math.sqrt(Math.max(da * db, 1e-9));
}
/** Best vertical shift, in rows, aligning window b onto a (cross-correlation). */
function bestShift(a, b, y0, y1, maxShift = 40) {
  let best = 0, bestScore = -Infinity;
  for (let s = -maxShift; s <= maxShift; s += 1) {
    let num = 0, n = 0;
    const av = [], bv = [];
    for (let y = y0; y < y1; y += 1) {
      const yb = y + s;
      if (yb < 0 || yb >= b.length) continue;
      av.push(a[y]); bv.push(b[yb]); n += 1;
    }
    if (n < 20) continue;
    const ma = mean(av), mb = mean(bv);
    let da = 0, db = 0;
    for (let i = 0; i < av.length; i += 1) { num += (av[i] - ma) * (bv[i] - mb); da += (av[i] - ma) ** 2; db += (bv[i] - mb) ** 2; }
    const r = num / Math.sqrt(Math.max(da * db, 1e-9));
    if (r > bestScore) { bestScore = r; best = s; }
  }
  return { shift: best, r: Number(bestScore.toFixed(3)) };
}

/** Role durations, newest first — app/data/portfolio/experience.ts SPANS, NOW = Sep 2026. */
const NOW = 2026 + 8 / 12;
const DURATIONS = [
  (NOW) - (2026 + 2 / 12),
  (2026 + 1 / 12) - (2025 + 5 / 12),
  (2025 + 5 / 12) - (2017 + 8 / 12),
  (2017 + 8 / 12) - (2016 + 10 / 12),
  (2016 + 9 / 12) - (2015 + 9 / 12),
  (2015 + 9 / 12) - (2014 + 10 / 12),
  (2014 + 10 / 12) - (2011 + 7 / 12),
  (2011 + 7 / 12) - (2010 + 4 / 12),
].map((v) => Number(v.toFixed(3)));

const out = { reviewer: 'rev-1ba16f90-w2', subject: BASE, probed: new Date().toISOString(), durations_newest_first: DURATIONS };
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: [...SPD.GL_ARGS] });

/* ── A. About 1440 at-rest, confirmation with a longer settle ── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 25000 }).catch(() => {});
  await page.locator('#about').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2500);
  await page.locator('#about').evaluate((el) => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top));
  await page.waitForTimeout(6000);
  await page.addStyleTag({ content: '#about header, #about ol, #about [class*="instrument"] { visibility: hidden !important; }' });
  await page.waitForTimeout(400);
  const g = await page.evaluate(() => {
    const c = document.querySelector('#about canvas').getBoundingClientRect();
    const s = document.querySelector('#about [class*="instrumentStage"]').getBoundingClientRect();
    return { centreX: s.left + s.width / 2 - c.left, centreY: s.top + s.height / 2 - c.top, roseRadius: s.width / 2, width: c.width, height: c.height, active: Number(document.querySelector('#about [data-axis]').dataset.axis) };
  });
  const shots = [];
  for (let k = 0; k < 2; k += 1) {
    const buf = await page.locator('#about canvas').screenshot();
    writeFileSync(join(OUT, `a3-1440-at-rest-confirm-${k}.png`), buf);
    shots.push(PNG.sync.read(buf));
    if (k === 0) await page.waitForTimeout(2000);
  }
  const TAU = Math.PI * 2, SECTORS = 10;
  const ANSWERED = [true, true, true, true, true, false, false, true, false, true];
  const measure = (png) => {
    const scale = png.width / g.width;
    const px = (x, y) => {
      const ix = Math.round(x * scale), iy = Math.round(y * scale);
      if (ix < 0 || iy < 0 || ix >= png.width || iy >= png.height) return null;
      const o = (iy * png.width + ix) * 4;
      return lum(png.data[o], png.data[o + 1], png.data[o + 2]);
    };
    const ang = (i, w) => (g.active < 0 ? 0 : (-g.active * TAU) / SECTORS) + ((i + w - 0.5) * TAU) / SECTORS;
    const along = (a) => { const v = []; for (let s = 0; s < 24; s += 1) { const r = (0.4 + (0.56 * s) / 23) * g.roseRadius; const p = px(g.centreX + r * Math.sin(a), g.centreY - r * Math.cos(a)); if (p !== null) v.push(p); } return v; };
    const sm = [], bm = [];
    for (let i = 0; i < SECTORS; i += 1) {
      const inside = [];
      for (let a = 0; a < 7; a += 1) inside.push(...along(ang(i, 0.25 + (0.5 * a) / 6)));
      sm.push(mean(inside)); bm.push(mean(along(ang(i, 0))));
    }
    const steps = sm.map((_, i) => { const f = (sm[(i + 9) % 10] + sm[i]) / 2; return f <= 0 ? 0 : 1 - bm[i] / f; });
    const ans = sm.filter((_, i) => ANSWERED[i]), opn = sm.filter((_, i) => !ANSWERED[i]);
    const roleMax = Math.max(sm[5], sm[6], sm[8]);
    return {
      sector_mean: sm.map((v) => Number(v.toFixed(4))),
      seam_steps: steps.map((v) => Number(v.toFixed(3))),
      seams_ge_12pct_of_ten: `${steps.filter((s) => s >= 0.12).length}/10`,
      answered_over_open: Number((mean(ans) / Math.max(mean(opn), 1e-9)).toFixed(3)),
      role_max_below_candidate_mean_pct: Number((100 * (1 - roleMax / mean(ans))).toFixed(1)),
    };
  };
  out.about_1440_at_rest_confirmation = { settle_ms: 6000, active: g.active, capture_0: measure(shots[0]), capture_1_after_2s: measure(shots[1]) };
  await ctx.close();
  console.log('[confirm] 1440 at rest ratio', out.about_1440_at_rest_confirmation.capture_0.answered_over_open, out.about_1440_at_rest_confirmation.capture_1_after_2s.answered_over_open);
}

/* ── B. scene 7 ── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [], cons = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e)));
  page.on('console', (m) => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 25000 }).catch(() => {});

  out.scene7 = await page.evaluate(async () => {
    const el = document.querySelector('[data-scene="career-descent"]');
    if (!el) return { present: false };
    el.scrollIntoView({ block: 'center' });
    await new Promise((r) => setTimeout(r, 2500));
    const band = document.querySelector('[data-descent-band]');
    const r = el.getBoundingClientRect();
    const br = band ? band.getBoundingClientRect() : null;
    return {
      present: true,
      canvases_in_scene: el.querySelectorAll('canvas').length,
      scene_rect: { w: Math.round(r.width), h: Math.round(r.height) },
      band_rect: br ? { w: Math.round(br.width), h: Math.round(br.height) } : null,
      band_vh: br ? Number((br.height / innerHeight).toFixed(2)) : null,
      band_selector_found: Boolean(band),
    };
  });

  // Two scroll positions inside the sticky band → uDescent ~0.25 and ~0.75.
  const bandBox = await page.evaluate(() => {
    const b = document.querySelector('[data-descent-band]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { top: r.top + scrollY, height: r.height, innerHeight: window.innerHeight };
  });
  out.scene7.band_page_box = bandBox;
  const caps = [];
  for (const t of [0.25, 0.75]) {
    if (bandBox) {
      const travel = Math.max(bandBox.height - bandBox.innerHeight, 1);
      await page.evaluate(([top, y]) => window.scrollTo(0, top + y), [bandBox.top, Math.round(travel * t)]);
    }
    await page.waitForTimeout(2600);
    const state = await page.evaluate(() => {
      const el = document.querySelector('[data-scene="career-descent"]');
      const c = el?.querySelector('canvas');
      const r = c ? c.getBoundingClientRect() : null;
      return { canvas_rect: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null, scrollY: Math.round(scrollY) };
    });
    const buf = await page.locator('[data-scene="career-descent"] canvas').first().screenshot();
    writeFileSync(join(OUT, `s7-1440-t${String(t).replace('.', '')}.png`), buf);
    caps.push({ t, state, png: PNG.sync.read(buf) });
  }
  const p0 = rowProfile(caps[0].png), p1 = rowProfile(caps[1].png);
  const e0 = edges(p0), e1 = edges(p1);
  const thickness = (es) => es.slice(1).map((v, i) => v - es[i]);
  const th0 = thickness(e0);
  const n = Math.min(th0.length, DURATIONS.length);
  out.scene7.spans = {
    capture_t025: { scrollY: caps[0].state.scrollY, canvas: caps[0].state.canvas_rect, png: `${caps[0].png.width}x${caps[0].png.height}` },
    capture_t075: { scrollY: caps[1].state.scrollY, canvas: caps[1].state.canvas_rect, png: `${caps[1].png.width}x${caps[1].png.height}` },
    edge_rows_t025: e0,
    edge_rows_t075: e1,
    edge_count_t025: e0.length,
    edge_count_t075: e1.length,
    edge_count_gate_ge_8: e0.length >= 8,
    band_thicknesses_t025: th0,
    spearman_thickness_vs_duration: n >= 3 ? Number(spearman(th0.slice(0, n), DURATIONS.slice(0, n)).toFixed(3)) : null,
    spearman_n: n,
    rank_gate_0_9: n >= 3 ? spearman(th0.slice(0, n), DURATIONS.slice(0, n)) >= 0.9 : false,
    profile_t025_every8: p0.filter((_, i) => i % 8 === 0).map((v) => Number(v.toFixed(4))),
    profile_t075_every8: p1.filter((_, i) => i % 8 === 0).map((v) => Number(v.toFixed(4))),
  };
  const H = p0.length;
  out.scene7.parallax = {
    method: 'best vertical cross-correlation shift of the row profile, per third of the canvas, between t=0.25 and t=0.75',
    top_third: bestShift(p0, p1, Math.floor(H * 0.05), Math.floor(H * 0.35)),
    mid_third: bestShift(p0, p1, Math.floor(H * 0.35), Math.floor(H * 0.65)),
    bottom_third: bestShift(p0, p1, Math.floor(H * 0.65), Math.floor(H * 0.95)),
  };
  const sh = [out.scene7.parallax.top_third.shift, out.scene7.parallax.mid_third.shift, out.scene7.parallax.bottom_third.shift];
  out.scene7.parallax.distinct_shifts = [...new Set(sh)].length;
  out.scene7.parallax.two_rates = [...new Set(sh)].length >= 2;

  // -02: no text node intersects the stage box
  out.scene7.text_over_stage = await page.evaluate(() => {
    const el = document.querySelector('[data-scene="career-descent"]');
    const c = el?.querySelector('canvas');
    if (!c) return null;
    const box = c.getBoundingClientRect();
    const hits = [];
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walk.nextNode())) {
      if (!node.nodeValue || !node.nodeValue.trim()) continue;
      const p = node.parentElement;
      if (!p) continue;
      const cs = getComputedStyle(p);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const r of range.getClientRects()) {
        if (r.width < 1 || r.height < 1) continue;
        if (r.right > box.left && r.left < box.right && r.bottom > box.top && r.top < box.bottom) {
          hits.push({ text: node.nodeValue.trim().slice(0, 60), cls: p.className?.toString?.().slice(0, 60) || '', rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } });
          break;
        }
      }
    }
    return { stage_box: { x: Math.round(box.x), y: Math.round(box.y), w: Math.round(box.width), h: Math.round(box.height) }, intersecting_text_nodes: hits.length, nodes: hits.slice(0, 12) };
  });

  // Frame time — SwiftShader tier A. Recorded, never called fps.
  out.scene7.frame_time_tierA = await page.evaluate(async () => {
    const canvas = document.querySelector('[data-scene="career-descent"] canvas');
    let renderer = 'unavailable';
    try {
      const gl = document.createElement('canvas').getContext('webgl2') || document.createElement('canvas').getContext('webgl');
      const ext = gl?.getExtension('WEBGL_debug_renderer_info');
      renderer = ext ? `${gl.getParameter(ext.UNMASKED_VENDOR_WEBGL)} / ${gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)}` : (gl ? gl.getParameter(gl.RENDERER) : 'no context');
    } catch (e) { renderer = `error: ${e.message}`; }
    const deltas = [];
    await new Promise((resolve) => {
      let last = performance.now(), n = 0;
      const tick = (now) => { deltas.push(now - last); last = now; n += 1; if (n < 150) requestAnimationFrame(tick); else resolve(); };
      requestAnimationFrame(tick);
    });
    const s = deltas.slice(5).sort((a, b) => a - b);
    return {
      canvas_present: Boolean(canvas),
      renderer_string: renderer,
      samples: s.length,
      median_raf_ms: Number(s[Math.floor(s.length / 2)].toFixed(2)),
      p95_raf_ms: Number(s[Math.floor(s.length * 0.95)].toFixed(2)),
      label: 'median rAF, software-rasteriser — NOT a frame rate claim',
    };
  });
  out.scene7.pageerrors = errs.length;
  out.scene7.console_errors = cons.slice(0, 5);
  await ctx.close();
}

await browser.close();
out.live_build_commit_at_finish = await (await fetch(`${BASE}/`)).text().then((t) => (t.match(/build-commit"\s+content="([^"]+)"/) || [])[1] || null);
writeFileSync(join(OUT, '03-scene7.json'), JSON.stringify(out, null, 2));
console.log('WROTE 03-scene7.json');
