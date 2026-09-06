/**
 * rev-1ba16f90-w2 — hero F-1 re-measure (S3 has NOT landed) + the regression table,
 * on whatever SHA is live at the moment each block runs. Every block records the
 * build-commit it read.
 *
 * F-1 as the task states it: "descender ink off the plate — must be 0 px at 4
 * viewports x 2 paths". Coverage is recovered from a red-ink frame (C) against an
 * ink-transparent frame (B), so a glyph over near-white ground is still separable.
 */
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SPD = await import('/root/forgotten-mistory/scripts/validate/hero_plane_dominance.mjs');
const BASE = 'https://forgotten-mistory.web.app';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/1ba16f90';
mkdirSync(OUT, { recursive: true });
const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const VIEWPORTS = [
  { width: 1440, height: 900 }, { width: 1280, height: 800 },
  { width: 834, height: 1194 }, { width: 390, height: 844 },
];
const PATHS = [
  { id: 'gl', url: '/?gl=force', reducedMotion: false },
  { id: 'still', url: '/', reducedMotion: true },
];

const readHero = () => {
  const W = innerWidth, H = innerHeight;
  const h1 = document.querySelector('#hero h1');
  const cs = getComputedStyle(h1);
  const colour = (cs.color.match(/[\d.]+/g) || [246, 246, 246]).map(Number);
  const rects = [];
  const walk = (el) => {
    for (const n of Array.from(el.childNodes)) {
      if (n.nodeType === 3 && (n.textContent || '').trim()) {
        const r = document.createRange(); r.selectNodeContents(n);
        for (const q of Array.from(r.getClientRects())) {
          const x1 = Math.max(0, q.left), y1 = Math.max(0, q.top);
          const x2 = Math.min(W, q.right), y2 = Math.min(H, q.bottom);
          if (x2 > x1 && y2 > y1) rects.push({ x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
        }
      } else if (n.nodeType === 1) walk(n);
    }
  };
  walk(h1);
  const plate = (() => {
    let el = h1;
    while (el && el !== document.body) {
      const s = getComputedStyle(el);
      const m = s.backgroundColor.match(/[\d.]+/g);
      const a = m ? (m.length > 3 ? Number(m[3]) : 1) : 0;
      if (a >= 0.5) { const r = el.getBoundingClientRect(); return { handle: el.tagName.toLowerCase() + '.' + String(el.className).split(/\s+/)[0], bg: s.backgroundColor, x: r.left, y: r.top, w: r.width, h: r.height }; }
      el = el.parentElement;
    }
    return null;
  })();
  const brand = document.querySelector('.logo, header a[class*="logo"], nav [class*="logo"]');
  const brandPx = brand ? parseFloat(getComputedStyle(brand).fontSize) : null;
  // H1 line count: distinct rect tops of the glyph run
  const tops = [...new Set(rects.map((r) => Math.round(r.y)))].sort((a, b) => a - b);
  const lines = tops.filter((t, i) => i === 0 || t - tops[i - 1] > 8).length;
  const proof = document.querySelector('[data-testid="hero-proof"]');
  const cta = Array.from(document.querySelectorAll('[data-testid="hero-actions"] a, [data-testid="hero-actions"] button'))
    .map((el) => { const r = el.getBoundingClientRect(); return { label: (el.textContent || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), ok: r.width >= 48 && r.height >= 48 }; });
  return {
    viewport: { w: W, h: H }, colour, h1_font_px: parseFloat(cs.fontSize), brand_px: brandPx,
    h1_over_brand: brandPx ? Number((parseFloat(cs.fontSize) / brandPx).toFixed(2)) : null,
    h1_lines: lines, rects, plate,
    proof_top: proof ? Math.round(proof.getBoundingClientRect().top) : null,
    proof_below_fold: proof ? proof.getBoundingClientRect().top >= H : null,
    cta_targets: cta, cta_groups: document.querySelectorAll('[data-testid="hero-actions"]').length,
    build_commit: document.querySelector('meta[name="build-commit"]')?.content || null,
  };
};

const results = { reviewer: 'rev-1ba16f90-w2', probed: new Date().toISOString(), hero: [], regression: {} };
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: [...SPD.GL_ARGS] });

for (const vp of VIEWPORTS) {
  for (const route of PATHS) {
    const tag = `${vp.width}x${vp.height}-${route.id}`;
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: route.reducedMotion ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e.message || e)));
    await SPD.preparePage(page, BASE, route);
    const dom = await page.evaluate(readHero);
    const fold = await SPD.measureFold(page, { shotPath: join(OUT, `fold-${tag}.png`) });

    await page.addStyleTag({ content: '#hero h1, #hero h1 *{color:#ff0000 !important;-webkit-text-fill-color:#ff0000 !important;text-shadow:none !important}' });
    await page.waitForTimeout(220);
    const C = PNG.sync.read(await page.screenshot({ type: 'png' }));
    await page.addStyleTag({ content: '#hero h1, #hero h1 *{color:transparent !important;-webkit-text-fill-color:transparent !important;text-shadow:none !important}' });
    await page.waitForTimeout(220);
    const bBuf = await page.screenshot({ type: 'png' });
    const B = PNG.sync.read(bBuf);
    const fieldB = SPD.decodeLuma(bBuf);
    const inkL = SPD.relativeLuminance(dom.colour[0], dom.colour[1], dom.colour[2]);
    const W = C.width;

    let core = 0, offPlate = 0, offPlateBelow = 0, worst = Infinity, worstAt = null;
    let ox1 = Infinity, oy1 = Infinity, ox2 = -Infinity, oy2 = -Infinity;
    const plate = dom.plate;
    const offRatios = [];
    for (const r of dom.rects) {
      const x0 = Math.max(0, Math.floor(r.x) - 6), y0 = Math.max(0, Math.floor(r.y) - 6);
      const x1 = Math.min(W, Math.ceil(r.x + r.w) + 6), y1 = Math.min(C.height, Math.ceil(r.y + r.h) + 6);
      for (let y = y0; y < y1; y += 1) {
        for (let x = x0; x < x1; x += 1) {
          const o = (y * W + x) * 4;
          const gB = B.data[o + 1];
          const a = gB <= 4 ? (C.data[o] - B.data[o]) / Math.max(1, 255 - B.data[o]) : 1 - C.data[o + 1] / gB;
          if (!(a >= 0.9)) continue;
          core += 1;
          if (!plate) continue;
          const inside = x >= plate.x && x < plate.x + plate.w && y >= plate.y && y < plate.y + plate.h;
          if (inside) continue;
          offPlate += 1;
          if (y >= plate.y + plate.h) offPlateBelow += 1;
          const ratio = contrast(inkL, fieldB.values[y * W + x]);
          offRatios.push(ratio);
          if (ratio < worst) { worst = ratio; worstAt = { x, y, bgL: Number(fieldB.values[y * W + x].toFixed(4)) }; }
          if (x < ox1) ox1 = x; if (y < oy1) oy1 = y;
          if (x + 1 > ox2) ox2 = x + 1; if (y + 1 > oy2) oy2 = y + 1;
        }
      }
    }
    offRatios.sort((a, b) => a - b);
    results.hero.push({
      tag, build_commit: dom.build_commit, canvases: fold.canvases,
      h1_font_px: dom.h1_font_px, brand_px: dom.brand_px, h1_over_brand: dom.h1_over_brand,
      type_01_band_2_5_to_6: dom.h1_over_brand !== null && dom.h1_over_brand >= 2.5 && dom.h1_over_brand <= 6.0,
      h1_lines: dom.h1_lines,
      type_02_expected: vp.width >= 720 ? 1 : 2, type_02_ok: dom.h1_lines === (vp.width >= 720 ? 1 : 2),
      plate: plate ? { handle: plate.handle, bg: plate.bg, x: Math.round(plate.x), y: Math.round(plate.y), w: Math.round(plate.w), h: Math.round(plate.h) } : null,
      F1_core_ink_px: core,
      F1_ink_off_plate_px: plate ? offPlate : null,
      F1_ink_below_plate_px: plate ? offPlateBelow : null,
      F1_gate_zero_px: plate ? offPlate === 0 : null,
      F1_off_plate_box: offPlate ? { x: ox1, y: oy1, w: ox2 - ox1, h: oy2 - oy1 } : null,
      F1_off_plate_worst_contrast: offPlate ? Number(worst.toFixed(2)) : null,
      F1_off_plate_worst_at: worstAt,
      F1_off_plate_median_contrast: offRatios.length ? Number(offRatios[Math.floor(offRatios.length / 2)].toFixed(2)) : null,
      F1_off_plate_below_4_5_px: offRatios.filter((v) => v < 4.5).length,
      SPD: Number(fold.spd.toFixed(4)), SPD_gate_0_75: fold.spd >= 0.75, SPD_ship_0_78: fold.spd >= 0.78,
      lit_density: Number(fold.litDensity.toFixed(4)), ground_chain: fold.groundChain && fold.groundChain[0],
      SET_02_proof_top: dom.proof_top, SET_02_below_fold: dom.proof_below_fold,
      cta_groups: dom.cta_groups, cta_targets: dom.cta_targets,
      cta_all_ge_48: dom.cta_targets.every((c) => c.ok),
      pageerrors: errs.length,
    });
    await ctx.close();
    console.log(`[hero] ${tag} sha=${dom.build_commit} SPD=${fold.spd.toFixed(4)} offPlate=${offPlate} ratio=${dom.h1_over_brand} lines=${dom.h1_lines}`);
  }
}


if (process.env.HERO_ONLY) {
  await browser.close();
  results.live_build_commit_at_finish = await (await fetch(`${BASE}/`)).text().then((t) => (t.match(/build-commit"\s+content="([^"]+)"/) || [])[1] || null);
  writeFileSync(join(OUT, '06-hero-postS3.json'), JSON.stringify(results, null, 2));
  console.log('WROTE 06-hero-postS3.json');
  process.exit(0);
}

/* ── regression table ── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [], cons = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e)));
  page.on('console', (m) => { if (m.type() === 'error') cons.push(m.text().slice(0, 160)); });
  await SPD.preparePage(page, BASE, { id: 'gl', url: '/?gl=force', reducedMotion: false });
  const R = results.regression;
  R.build_commit = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content);

  // About re-measure on the current SHA — the x2f5 change was reverted mid-review.
  R.G_A3_current_sha = await page.evaluate(async () => {
    const a = document.querySelector('#about');
    window.scrollTo(0, window.scrollY + a.getBoundingClientRect().top);
    await new Promise((r) => setTimeout(r, 2600));
    const text = (a.textContent || '').replace(/\s+/g, ' ');
    let n = 0; for (let i = 1; i <= 10; i += 1) if (text.includes(String(i).padStart(2, '0'))) n += 1;
    return { canvases: a.querySelectorAll('canvas').length, numbered: n, heading: a.querySelector('h2')?.textContent?.trim(), axis: document.querySelector('#about [data-axis]')?.dataset.axis };
  });

  R.G_C1 = await page.evaluate(() => {
    const hrefs = Array.from(document.querySelectorAll('a[href^="mailto:"]'))
      .filter((a) => /20-minute call/i.test(a.href) || /20-minute/i.test(a.textContent || ''))
      .map((a) => a.getAttribute('href'));
    const uniq = [...new Set(hrefs)];
    return { count: hrefs.length, distinct: uniq.length, identical: uniq.length <= 1, length: hrefs[0]?.length || 0 };
  });

  R.minivic_disclosure = await page.evaluate(() => {
    const t = document.body.innerText.replace(/\s+/g, ' ');
    return { has_synthetic: /synthetic/i.test(t), has_ai_clone: /AI clone/i.test(t) };
  });

  R.TC_BOT_14 = await page.evaluate(async () => {
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 700));
    const l = document.querySelector('.minivic-launcher, [class*="launcher"]');
    if (l) l.click();
    await new Promise((r) => setTimeout(r, 1600));
    const panel = document.querySelector('.minivic-panel, [class*="minivic"][class*="panel"], [role="dialog"]');
    const h1 = document.querySelector('#hero h1');
    const range = document.createRange(); range.selectNodeContents(h1);
    const rs = Array.from(range.getClientRects());
    const run = rs.length ? { left: Math.min(...rs.map((r) => r.left)), right: Math.max(...rs.map((r) => r.right)), top: Math.min(...rs.map((r) => r.top)), bottom: Math.max(...rs.map((r) => r.bottom)) } : null;
    const p = panel ? panel.getBoundingClientRect() : null;
    return {
      panel: p ? { x: Math.round(p.x), y: Math.round(p.y), w: Math.round(p.width), h: Math.round(p.height) } : null,
      h1_run: run ? { left: Math.round(run.left), right: Math.round(run.right), top: Math.round(run.top), bottom: Math.round(run.bottom) } : null,
      horizontal_gap: p && run ? Math.round(p.left - run.right) : null,
      overlaps: p && run ? (p.left < run.right && p.right > run.left && p.top < run.bottom && p.bottom > run.top) : null,
      contract_min_gap_px: 16,
    };
  });
  R.pageerrors_1440 = errs.length; R.console_errors_1440 = cons.slice(0, 4);
  await ctx.close();
}

/* ── ?gl=off, LCP/CLS, G-MV1 at 390 ── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/?gl=off`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 25000 }).catch(() => {});
  await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(1500);
  results.regression.gl_off = await page.evaluate(async () => {
    for (const id of ['#about', '#experience', '#skills', '#vitrine', '#listen']) {
      document.querySelector(id)?.scrollIntoView({ block: 'center' });
      await new Promise((r) => setTimeout(r, 700));
    }
    window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 400));
    return { canvases_page: document.querySelectorAll('canvas').length, h1_visible: Boolean(document.querySelector('#hero h1')?.offsetHeight) };
  });
  results.regression.gl_off.pageerrors = errs.length;
  await ctx.close();
}
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(4500);
  const vitals = await page.evaluate(() => new Promise((resolve) => {
    let lcp = 0, cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = Math.max(lcp, e.startTime); }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
    setTimeout(() => resolve({ lcp_ms: Math.round(lcp), cls: Number(cls.toFixed(4)) }), 1200);
  }));
  results.regression[`vitals_${vp.w}`] = vitals;
  if (vp.w === 390) {
    results.regression.G_MV1_390 = await page.evaluate(async () => {
      window.scrollTo(0, 0); await new Promise((r) => setTimeout(r, 700));
      const l = document.querySelector('.minivic-launcher__pill, .minivic-launcher, [class*="launcher"]');
      if (!l) return { found: false };
      const r = l.getBoundingClientRect();
      const cx = r.x + r.width / 2, cy = r.y + r.height / 2;
      const hit = document.elementFromPoint(cx, cy);
      const cs = getComputedStyle(l);
      return {
        found: true, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        display: cs.display, visible: r.width > 0 && r.height > 0, in_first_fold: r.bottom <= innerHeight,
        element_from_point: hit ? hit.tagName + '.' + String(hit.className).split(/\s+/)[0] : null,
        hit_is_self: Boolean(hit && (hit === l || l.contains(hit) || hit.contains(l))),
      };
    });
    if (results.regression.G_MV1_390.hit_is_self) {
      const clicked = await page.locator('.minivic-launcher__pill, .minivic-launcher').first().click({ timeout: 6000 }).then(() => true).catch((e) => String(e.message).slice(0, 80));
      await page.waitForTimeout(3400);
      results.regression.G_MV1_390.click = clicked;
      results.regression.G_MV1_390.panel = await page.evaluate(() => {
        const p = document.querySelector('.minivic-panel, [class*="minivic"][class*="panel"], [role="dialog"]');
        if (!p) return null;
        const r = p.getBoundingClientRect();
        return { w: Math.round(r.width), h: Math.round(r.height) };
      });
      await page.screenshot({ path: join(OUT, 'reg-390-minivic-after-click.png') });
    }
  }
  await ctx.close();
}
await browser.close();

/* ── G-OG1 and the live SHA, over HTTP ── */
const og = await fetch(`${BASE}/assets/og-image.png`);
const ogBuf = Buffer.from(await og.arrayBuffer());
let ogMaxChroma = 0;
try { const p = PNG.sync.read(ogBuf); for (let i = 0; i < p.data.length; i += 4) { const c = Math.max(p.data[i], p.data[i + 1], p.data[i + 2]) - Math.min(p.data[i], p.data[i + 1], p.data[i + 2]); if (c > ogMaxChroma) ogMaxChroma = c; } results.regression.G_OG1 = { http: og.status, bytes: ogBuf.length, dims: `${p.width}x${p.height}`, max_chroma: ogMaxChroma }; }
catch (e) { results.regression.G_OG1 = { http: og.status, bytes: ogBuf.length, error: String(e.message) }; }
results.live_build_commit_at_finish = await (await fetch(`${BASE}/`)).text().then((t) => (t.match(/build-commit"\s+content="([^"]+)"/) || [])[1] || null);
writeFileSync(join(OUT, '05-hero-regression.json'), JSON.stringify(results, null, 2));
console.log('WROTE 05-hero-regression.json');
