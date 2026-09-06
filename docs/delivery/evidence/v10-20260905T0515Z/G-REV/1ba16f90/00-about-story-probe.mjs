/**
 * rev-1ba16f90-w2 — G-A3 story clause, measured on the live origin.
 *
 * Independent re-implementation of the §5 story instrument (SIGNATURE-SCENES-v2
 * row 2 / TC-STORY-ABOUT-01 / -02) against my own captures. The geometry is the
 * contract's own (sector i centred at uRotation + i*TAU/10 measured clockwise
 * from up, uRotation = -active*TAU/10) because that is what the shader draws;
 * every number below is computed here, not read from a test log.
 */
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SPD = await import('/root/forgotten-mistory/scripts/validate/hero_plane_dominance.mjs');
const BASE = 'https://forgotten-mistory.web.app';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/1ba16f90';
mkdirSync(OUT, { recursive: true });

const SECTORS = 10;
const TAU = Math.PI * 2;
/** about.ts: side === 'candidate' is answered; role-side (1-based 6,7,9) is open. */
const ANSWERED = [true, true, true, true, true, false, false, true, false, true];
const ROLE_IDX = [5, 6, 8]; // 0-based

const lum = (r, g, b) => {
  const ch = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
};
const hueSat = (r, g, b) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d === 0 || mx === 0) return { hue: 0, saturation: 0 };
  let h;
  if (mx === r) h = 60 * (((g - b) / d + 6) % 6);
  else if (mx === g) h = 60 * ((b - r) / d + 2);
  else h = 60 * ((r - g) / d + 4);
  return { hue: h, saturation: d / mx };
};
const mean = (xs) => xs.reduce((s, v) => s + v, 0) / Math.max(xs.length, 1);

function pixelAt(shot, x, y) {
  const px = Math.round(x * shot.scale), py = Math.round(y * shot.scale);
  if (px < 0 || py < 0 || px >= shot.png.width || py >= shot.png.height) return null;
  const o = (py * shot.png.width + px) * 4;
  return [shot.png.data[o], shot.png.data[o + 1], shot.png.data[o + 2]];
}
const sectorAngle = (active, i, within) =>
  (active < 0 ? 0 : (-active * TAU) / SECTORS) + ((i + within - 0.5) * TAU) / SECTORS;

function readAnnulus(shot, g, band = [0.4, 0.96]) {
  const rIn = band[0] * g.roseRadius, rOut = band[1] * g.roseRadius;
  const steps = 24, arc = 7;
  const sectorMean = [], boundaryMean = [], sectorSamples = [];
  let gold = null, goldPx = 0;
  const along = (angle) => {
    const vs = [];
    for (let s = 0; s < steps; s += 1) {
      const r = rIn + ((rOut - rIn) * s) / (steps - 1);
      const p = pixelAt(shot, g.centreX + r * Math.sin(angle), g.centreY - r * Math.cos(angle));
      if (!p) continue;
      const hs = hueSat(p[0], p[1], p[2]);
      if (hs.hue >= 35 && hs.hue <= 60 && hs.saturation > 0.25) { gold = hs; goldPx += 1; }
      vs.push(lum(p[0], p[1], p[2]));
    }
    return vs;
  };
  for (let i = 0; i < SECTORS; i += 1) {
    const inside = [];
    for (let a = 0; a < arc; a += 1) inside.push(...along(sectorAngle(g.active, i, 0.25 + (0.5 * a) / (arc - 1))));
    sectorMean.push(mean(inside));
    sectorSamples.push(inside.length);
    boundaryMean.push(mean(along(sectorAngle(g.active, i, 0))));
  }
  return { sectorMean, boundaryMean, sectorSamples, gold, goldPx, band };
}
function fanBand(g) {
  const reach = Math.max(g.centreX, g.centreY, g.width - g.centreX, g.height - g.centreY) / g.roseRadius;
  const outer = Math.min(1.6, reach);
  return outer > 1.2 ? [1.12, outer] : null;
}
function grade(reading, label) {
  const measured = reading.sectorSamples.map((c, i) => ({ c, i })).filter((x) => x.c >= 12).map((x) => x.i);
  const seams = measured.filter((i) => measured.includes((i + SECTORS - 1) % SECTORS));
  const steps = seams.map((i) => {
    const flank = (reading.sectorMean[(i + SECTORS - 1) % SECTORS] + reading.sectorMean[i]) / 2;
    return flank <= 0 ? 0 : 1 - reading.boundaryMean[i] / flank;
  });
  const legible = steps.filter((s) => s >= 0.12).length;
  const ans = measured.filter((i) => ANSWERED[i]).map((i) => reading.sectorMean[i]);
  const opn = measured.filter((i) => !ANSWERED[i]).map((i) => reading.sectorMean[i]);
  const candMean = mean(measured.filter((i) => ANSWERED[i]).map((i) => reading.sectorMean[i]));
  const roleMeasured = ROLE_IDX.filter((i) => measured.includes(i));
  const roleMax = roleMeasured.length ? Math.max(...roleMeasured.map((i) => reading.sectorMean[i])) : null;
  return {
    label,
    band: reading.band.map((v) => Number(v.toFixed(3))),
    sectors_measured: measured.length,
    sector_mean: reading.sectorMean.map((v) => Number(v.toFixed(4))),
    boundary_mean: reading.boundaryMean.map((v) => Number(v.toFixed(4))),
    seam_steps: steps.map((v) => Number(v.toFixed(3))),
    seams_ge_12pct: `${legible}/${steps.length}`,
    seams_ge_12pct_of_ten: `${legible}/10`,
    seam_gate_9_of_10: legible >= 9,
    answered_mean: Number(mean(ans).toFixed(4)),
    open_mean: Number(mean(opn).toFixed(4)),
    answered_over_open: Number((mean(ans) / Math.max(mean(opn), 1e-9)).toFixed(3)),
    ratio_gate_1_6: mean(ans) / Math.max(mean(opn), 1e-9) >= 1.6,
    // TC-STORY-ABOUT-02: max of the three role-side sectors vs mean of the seven candidate-side
    role_side_max: roleMax === null ? null : Number(roleMax.toFixed(4)),
    candidate_side_mean: Number(candMean.toFixed(4)),
    role_max_below_candidate_mean_pct:
      roleMax === null || candMean <= 0 ? null : Number((100 * (1 - roleMax / candMean)).toFixed(1)),
    story_02_gate_15pct: roleMax !== null && candMean > 0 && roleMax <= 0.85 * candMean,
    gold_px: reading.goldPx,
  };
}

const results = { reviewer: 'rev-1ba16f90-w2', subject: BASE, probed: new Date().toISOString(), states: [] };
const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: [...SPD.GL_ARGS] });

const VIEWPORTS = [
  { label: '1440x900', width: 1440, height: 900, indexed: { item: 4, axis: 3 } },
  { label: '390x844', width: 390, height: 844, indexed: { item: 1, axis: 0 } },
];

for (const vp of VIEWPORTS) {
  for (const state of [{ key: 'at rest', item: 0, axis: -1 }, { key: `dimension ${vp.indexed.item}`, ...vp.indexed }]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e.message || e)));
    await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 25000 }).catch(() => {});
    await page.locator('#about').scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    if (state.item > 0) {
      await page.mouse.move(2, 2);
      await page.locator('#about ol li').nth(state.item - 1).evaluate((el) => {
        const r = el.getBoundingClientRect();
        window.scrollTo({ top: window.scrollY + r.top - (window.innerHeight - r.height) / 2, behavior: 'instant' });
      });
      await page.waitForTimeout(1600);
    } else {
      await page.locator('#about').evaluate((el) => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top));
      await page.waitForTimeout(2400);
    }
    const canvases = await page.locator('#about canvas').count();
    const geom = canvases
      ? await page.evaluate(() => {
          const canvas = document.querySelector('#about canvas');
          const stage = document.querySelector('#about [class*="instrumentStage"]');
          const slot = document.querySelector('#about [data-axis]');
          if (!canvas || !stage || !slot) return null;
          const c = canvas.getBoundingClientRect(), s = stage.getBoundingClientRect();
          return {
            centreX: s.left + s.width / 2 - c.left, centreY: s.top + s.height / 2 - c.top,
            roseRadius: s.width / 2, width: c.width, height: c.height,
            active: Number(slot.dataset.axis ?? '-1'),
          };
        })
      : null;
    const row = { viewport: vp.label, state: state.key, expected_axis: state.axis, canvases, geometry: geom, pageerrors: errs.length };
    if (geom) {
      row.axis_matches = geom.active === state.axis;
      // dial + reading column + heading hidden; the light alone.
      await page.addStyleTag({ content: '#about header, #about ol, #about [class*="instrument"] { visibility: hidden !important; }' });
      await page.waitForTimeout(500);
      const buf = await page.locator('#about canvas').screenshot();
      const tag = `a3-${vp.label}-${state.key.replace(/\s+/g, '-')}`;
      writeFileSync(join(OUT, `${tag}-field-alone.png`), buf);
      const png = PNG.sync.read(buf);
      const shot = { png, scale: png.width / geom.width };
      row.capture = { file: `${tag}-field-alone.png`, px: `${png.width}x${png.height}`, scale: Number(shot.scale.toFixed(3)) };
      row.ring = grade(readAnnulus(shot, geom), 'ring under the engraving');
      const fb = fanBand(geom);
      row.fan = fb ? grade(readAnnulus(shot, geom, fb), 'fan outside the bezel') : null;
      // ten sectors countable at all: how many distinct sectors carry samples
      row.ten_sectors_countable = row.ring.sectors_measured;
    }
    results.states.push(row);
    await ctx.close();
    process.stdout.write(`[about] ${vp.label} ${state.key} axis=${geom?.active} canvases=${canvases}\n`);
  }
}

/* ── plane dominance, dial luminance, gold, contrast, fallbacks (1440) ── */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/?gl=force`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 25000 }).catch(() => {});
  await page.locator('#about').evaluate((el) => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top));
  await page.waitForTimeout(2200);

  const clip = await page.locator('#about [data-axis]').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.max(r.left, 0), y: Math.max(r.top, 0), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(r.top, 0)) };
  });
  const withF = PNG.sync.read(await page.screenshot({ clip }));
  writeFileSync(join(OUT, 'a3-1440-with-field.png'), PNG.sync.write(withF));
  await page.addStyleTag({ content: '#about canvas { visibility: hidden !important; }' });
  await page.waitForTimeout(400);
  const woF = PNG.sync.read(await page.screenshot({ clip }));
  writeFileSync(join(OUT, 'a3-1440-without-field.png'), PNG.sync.write(woF));
  const ground = await page.evaluate(() => {
    const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink-900').trim();
    const p = document.createElement('span'); p.style.color = ink; document.body.appendChild(p);
    const rgb = getComputedStyle(p).color; p.remove();
    return rgb.match(/[\d.]+/g).map(Number);
  });
  const gL = lum(ground[0], ground[1], ground[2]);
  let massWith = 0, massWithout = 0;
  for (let i = 0; i < withF.data.length; i += 4) {
    const a = lum(withF.data[i], withF.data[i + 1], withF.data[i + 2]) - gL;
    const b = lum(woF.data[i], woF.data[i + 1], woF.data[i + 2]) - gL;
    if (a > 0) massWith += a;
    if (b > 0) massWithout += b;
  }
  results.plane_dominance = {
    method: 'light above --ink-900 ground, field visible vs field hidden, same clip',
    clip, ground_rgb: ground, ground_L: Number(gL.toFixed(4)),
    mass_with_field: Number(massWith.toFixed(1)), mass_without_field: Number(massWithout.toFixed(1)),
    plane_share: Number(((massWith - massWithout) / Math.max(massWith, 1e-9)).toFixed(4)),
    gate_0_75: (massWith - massWithout) / Math.max(massWith, 1e-9) >= 0.75,
  };

  // dial brightest stroke vs --mist-400, and gold anywhere in the canvas
  await page.addStyleTag({ content: '#about canvas { visibility: visible !important; }' });
  await page.waitForTimeout(300);
  const mist = await page.evaluate(() => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--mist-400').trim();
    const p = document.createElement('span'); p.style.color = v; document.body.appendChild(p);
    const rgb = getComputedStyle(p).color; p.remove();
    return rgb.match(/[\d.]+/g).map(Number);
  });
  const svgClip = await page.locator('#about [class*="instrumentStage"]').evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: Math.max(r.left, 0), y: Math.max(r.top, 0), width: Math.min(r.width, innerWidth), height: Math.min(r.height, innerHeight - Math.max(r.top, 0)) };
  });
  // The dial alone: canvas hidden so what is measured is the SVG's own strokes.
  await page.addStyleTag({ content: '#about canvas { visibility: hidden !important; }' });
  await page.waitForTimeout(300);
  const dialPng = PNG.sync.read(await page.screenshot({ clip: svgClip }));
  writeFileSync(join(OUT, 'a3-1440-dial-alone.png'), PNG.sync.write(dialPng));
  let dialMax = 0;
  for (let i = 0; i < dialPng.data.length; i += 4) {
    const L = lum(dialPng.data[i], dialPng.data[i + 1], dialPng.data[i + 2]);
    if (L > dialMax) dialMax = L;
  }
  results.dial = {
    mist_400_rgb: mist, mist_400_L: Number(lum(mist[0], mist[1], mist[2]).toFixed(4)),
    dial_brightest_L: Number(dialMax.toFixed(4)),
    within_mist_400: dialMax <= lum(mist[0], mist[1], mist[2]) + 1e-4,
  };

  results.about_contrast = await page.evaluate(() => {
    const lm = (r, g, b) => { const ch = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }; return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b); };
    const rgbOf = (s) => s.match(/[\d.]+/g).map(Number);
    const bg = rgbOf(getComputedStyle(document.querySelector('#about')).backgroundColor || 'rgb(10,10,10)');
    const bgL = lm(bg[0], bg[1], bg[2]);
    const out = {};
    for (const [k, sel] of Object.entries({
      lede: '#about p[class*="lede"]', name: '#about h3[class*="name"]', answer: '#about p[class*="answer"]',
      evidence: '#about p[class*="evidence"]', index: '#about span[class*="index"]', kicker: '#about p[class*="kicker"]',
    })) {
      const el = document.querySelector(sel);
      if (!el) { out[k] = null; continue; }
      const c = rgbOf(getComputedStyle(el).color);
      const fL = lm(c[0], c[1], c[2]);
      out[k] = Number(((Math.max(fL, bgL) + 0.05) / (Math.min(fL, bgL) + 0.05)).toFixed(2));
    }
    out.background_rgb = bg;
    return out;
  });
  results.pageerrors_gl_force_about = errs.length;
  await ctx.close();
}

/* ── the two fallback paths ── */
for (const path of [
  { key: 'reduced-motion', reducedMotion: 'reduce', url: '/' },
  { key: 'no-gl', reducedMotion: 'no-preference', url: '/?gl=off' },
]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: path.reducedMotion });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e)));
  await page.goto(`${BASE}${path.url}`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 25000 }).catch(() => {});
  await page.locator('#about').evaluate((el) => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top));
  await page.waitForTimeout(1600);
  const r = await page.evaluate(() => {
    const a = document.querySelector('#about');
    const items = a.querySelectorAll('ol li').length;
    const text = (a.textContent || '').replace(/\s+/g, ' ');
    const numbered = [];
    for (let i = 1; i <= 10; i += 1) if (text.includes(String(i).padStart(2, '0'))) numbered.push(i);
    return {
      canvases_about: a.querySelectorAll('canvas').length,
      canvases_page: document.querySelectorAll('canvas').length,
      list_items: items, numbered_count: numbered.length,
      heading: a.querySelector('h2')?.textContent?.trim() || null,
      svg_present: Boolean(a.querySelector('svg')),
    };
  });
  const shot = await page.screenshot({ type: 'png' });
  writeFileSync(join(OUT, `a3-${path.key}-1440.png`), shot);
  results[`fallback_${path.key.replace('-', '_')}`] = { ...r, pageerrors: errs.length };
  await ctx.close();
  process.stdout.write(`[about] ${path.key} canvases=${r.canvases_about} items=${r.list_items}\n`);
}

await browser.close();
results.live_build_commit_at_finish = await (await fetch(`${BASE}/`)).text().then((t) => (t.match(/build-commit"\s+content="([^"]+)"/) || [])[1] || null);
writeFileSync(join(OUT, '01-about-story.json'), JSON.stringify(results, null, 2));
console.log('WROTE 01-about-story.json');
