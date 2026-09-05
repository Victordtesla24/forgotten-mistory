/**
 * Independent adversarial probe for C22 (flagship visibility).
 *
 * Written by the reviewer, not the author. It re-derives every number the
 * author reported rather than reading their logs, and it adds the one
 * measurement the lane does not own: the composited text contrast on the
 * *WebGL* path (`?gl=force`), which tests/a11y/text-contrast.spec.ts never
 * photographs because it loads `/` with no query.
 *
 * Usage: node probe.mjs <baseURL> <outDir>
 */
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2];
const OUT = process.argv[3];
fs.mkdirSync(OUT, { recursive: true });

const GL_ARGS = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const SCENES = [
  { section: 'hero', scene: 'hero-atmosphere', label: 'hero atmosphere' },
  { section: 'about', scene: 'about-field', label: 'about compass field' },
  { section: 'experience', scene: 'career-strata', label: 'experience strata' },
];
const COVERAGE_DELTA = 0.06, COVERAGE_MIN = 0.15, PEAK_MIN = 0.35, MOTION_MIN = 0.004;
const FALLBACK_DELTA = 0.04;

const chan = (v) => { const c = v / 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = (r, g, b) => 0.2126 * chan(r) + 0.7152 * chan(g) + 0.0722 * chan(b);
const contrast = (a, b) => { const l1 = lum(...a), l2 = lum(...b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

function field(buf) {
  const png = PNG.sync.read(buf);
  const v = new Float64Array(png.width * png.height);
  for (let i = 0; i < v.length; i++) { const o = i * 4; v[i] = lum(png.data[o], png.data[o + 1], png.data[o + 2]); }
  return { v, w: png.width, h: png.height };
}
const coverage = (f, ground, d) => { let n = 0; for (let i = 0; i < f.v.length; i++) if (f.v[i] >= ground + d) n++; return n / f.v.length; };
const peak = (f) => { let m = 0; for (let i = 0; i < f.v.length; i++) if (f.v[i] > m) m = f.v[i]; return m; };
const meanDelta = (a, b) => { const n = Math.min(a.v.length, b.v.length); let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a.v[i] - b.v[i]); return n ? s / n : 0; };

async function settle(page) {
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /skip/i }).click({ timeout: 8000 }).catch(() => {});
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.waitForFunction(() => document.body.classList.contains('page-ready'), null, { timeout: 20000 }).catch(() => {});
  await page.locator('#hero').waitFor({ state: 'visible', timeout: 15000 });
}

async function ground(page, id) {
  const rgb = await page.evaluate((sid) => {
    let n = document.getElementById(sid);
    while (n) {
      const m = getComputedStyle(n).backgroundColor.match(/rgba?\(([^)]+)\)/);
      if (m) { const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); if ((p.length > 3 ? p[3] : 1) > 0.5) return [p[0], p[1], p[2]]; }
      n = n.parentElement;
    }
    const bm = getComputedStyle(document.body).backgroundColor.match(/rgba?\(([^)]+)\)/);
    return bm ? bm[1].split(/[,\s/]+/).filter(Boolean).map(Number).slice(0, 3) : [0, 0, 0];
  }, id);
  return lum(rgb[0], rgb[1], rgb[2]);
}

async function isolate(page, scene, on) {
  await page.evaluate(([id, enable]) => {
    document.getElementById('rev-isolate')?.remove();
    if (!enable) return;
    const s = document.createElement('style');
    s.id = 'rev-isolate';
    s.textContent = `body * { visibility: hidden !important; } [data-scene="${id}"], [data-scene="${id}"] * { visibility: visible !important; }`;
    document.head.appendChild(s);
  }, [scene, on]);
}

async function slotClip(page, scene, vw, vh) {
  const slot = page.locator(`[data-scene="${scene}"]`);
  await slot.waitFor({ state: 'attached', timeout: 15000 });
  await slot.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(300);
  const b = await slot.boundingBox();
  const x = Math.max(0, Math.min(b.x, vw - 4)), y = Math.max(0, Math.min(b.y, vh - 4));
  return { x, y, width: Math.max(4, Math.min(b.width, vw - x)), height: Math.max(4, Math.min(b.height, vh - y)) };
}

// ---- composited-contrast probe, algorithm mirrored from tests/a11y/text-contrast.spec.ts
async function contrastFailures(page, sectionIds) {
  const total = await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); }
    window.scrollTo(0, 0); return h;
  });
  await page.waitForTimeout(2500);
  const vh = page.viewportSize().height;
  const seen = new Set(); const fails = [];
  for (let top = 0; top < total; top += vh) {
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await page.waitForTimeout(400);
    const nodes = await page.evaluate(() => {
      const out = [];
      const eff = (el) => { let o = 1, n = el; while (n && n !== document.documentElement) { o *= parseFloat(getComputedStyle(n).opacity) || 0; n = n.parentElement; } return o; };
      const p = (el) => { const parts = []; let n = el; while (n && n !== document.body && parts.length < 6) { let t = n.tagName.toLowerCase(); if (n.id) { parts.unshift(t + '#' + n.id); break; } const c = Array.from(n.classList).slice(0, 2).join('.'); if (c) t += '.' + c; parts.unshift(t); n = n.parentElement; } return parts.join(' > '); };
      const vw = innerWidth, vhh = innerHeight;
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let t;
      while ((t = w.nextNode())) {
        const text = (t.textContent || '').replace(/\s+/g, ' ').trim(); if (text.length < 2) continue;
        const el = t.parentElement; if (!el) continue;
        if (el.closest('script,style,noscript,template,[hidden],[aria-hidden="true"]')) continue;
        if (el.closest(':disabled,[aria-disabled="true"]')) continue;
        const cs = getComputedStyle(el); if (cs.visibility !== 'visible' || cs.display === 'none') continue;
        if (!el.checkVisibility?.({ opacityProperty: true, visibilityProperty: true })) continue;
        const op = eff(el); if (op < 0.05) continue;
        const r = document.createRange(); r.selectNodeContents(t);
        const rects = Array.from(r.getClientRects()).filter((q) => q.width > 1 && q.height > 1); if (!rects.length) continue;
        const pts = [];
        for (const q of rects.slice(0, 3)) { const y = q.top + q.height / 2; for (const f of [0.15, 0.5, 0.85]) { const x = q.left + q.width * f; if (x >= 0 && x < vw && y >= 0 && y < vhh) pts.push([Math.round(x), Math.round(y)]); } }
        if (!pts.length) continue;
        out.push({ path: p(el), text: text.slice(0, 48), color: cs.color, opacity: op, fontSize: parseFloat(cs.fontSize), fontWeight: parseInt(cs.fontWeight, 10) || 400, points: pts, section: (el.closest('section[id]') || {}).id || 'chrome' });
      }
      return out;
    });
    const fresh = nodes.filter((n) => !seen.has(n.path + '|' + n.text) && sectionIds.includes(n.section));
    nodes.forEach((n) => seen.add(n.path + '|' + n.text));
    if (!fresh.length) continue;
    await page.evaluate(() => { const s = document.createElement('style'); s.id = 'rev-mask'; s.textContent = '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;transition:none!important}'; document.head.appendChild(s); });
    const shot = await page.screenshot({ fullPage: false, animations: 'disabled' });
    await page.evaluate(() => document.getElementById('rev-mask')?.remove());
    const png = PNG.sync.read(shot);
    const scale = png.width / page.viewportSize().width;
    const px = ([x, y]) => { const i = (Math.min(png.height - 1, Math.round(y * scale)) * png.width + Math.min(png.width - 1, Math.round(x * scale))) * 4; return [png.data[i], png.data[i + 1], png.data[i + 2]]; };
    for (const n of fresh) {
      const m = n.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/); if (!m) continue;
      const fg = [+m[1], +m[2], +m[3]]; const a = (m[4] === undefined ? 1 : +m[4]) * n.opacity;
      let worst = Infinity, wbg = [0, 0, 0], wfg = fg;
      for (const pt of n.points) { const bg = px(pt); const painted = [0, 1, 2].map((i) => Math.round(bg[i] + (fg[i] - bg[i]) * a)); const c = contrast(painted, bg); if (c < worst) { worst = c; wbg = bg; wfg = painted; } }
      const large = n.fontSize >= 24 || (n.fontSize >= 18.66 && n.fontWeight >= 700);
      const need = large ? 3 : 4.5;
      if (worst < need) fails.push({ ratio: +worst.toFixed(2), need, section: n.section, selector: n.path, text: n.text, fg: `rgb(${wfg})`, bg: `rgb(${wbg})`, fontSize: n.fontSize });
    }
  }
  return fails.sort((a, b) => a.ratio - b.ratio);
}

const report = { measured: [], still: [], contrastGlForce: {}, captures: [] };

const browser = await chromium.launch({ channel: 'chrome', args: GL_ARGS });

// --- 1. scene light, ?gl=force, 1440 and 390
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, baseURL: BASE });
  const page = await ctx.newPage();
  await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
  await settle(page);
  for (const s of SCENES) {
    const g = await ground(page, s.section);
    const clip = await slotClip(page, s.scene, vp.w, vp.h);
    const canvases = await page.locator(`[data-scene="${s.scene}"] canvas`).count();
    // full section frame, for the eye
    const full = path.join(OUT, `${s.section}-${vp.w}-glforce-rest.png`);
    fs.writeFileSync(full, await page.screenshot({ clip: { x: 0, y: 0, width: vp.w, height: vp.h } }));
    report.captures.push(full);
    await page.waitForTimeout(2000);
    await isolate(page, s.scene, true);
    const a = await page.screenshot({ clip });
    fs.writeFileSync(path.join(OUT, `${s.section}-${vp.w}-slot-t0.png`), a);
    await page.waitForTimeout(1500);
    const b = await page.screenshot({ clip });
    fs.writeFileSync(path.join(OUT, `${s.section}-${vp.w}-slot-t1500.png`), b);
    await isolate(page, s.scene, false);
    const fa = field(a), fb = field(b);
    const cov = coverage(fa, g, COVERAGE_DELTA), pk = peak(fa), mo = meanDelta(fa, fb);
    report.measured.push({
      section: s.section, viewport: vp.w, canvases, ground: +g.toFixed(4),
      box: `${Math.round(clip.width)}x${Math.round(clip.height)}`,
      coveragePct: +(cov * 100).toFixed(2), peak: +pk.toFixed(4), motion: +mo.toFixed(5),
      passCoverage: cov >= COVERAGE_MIN, passPeak: pk >= PEAK_MIN, passMotion: mo >= MOTION_MIN,
    });
  }
  await ctx.close();
}

// --- 2. reduced-motion still, 1440
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, baseURL: BASE, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
  await settle(page);
  for (const s of SCENES) {
    const g = await ground(page, s.section);
    const clip = await slotClip(page, s.scene, 1440, 900);
    const canvases = await page.locator(`#${s.section} canvas`).count();
    fs.writeFileSync(path.join(OUT, `${s.section}-1440-reduced-motion.png`), await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } }));
    await page.waitForTimeout(400);
    await isolate(page, s.scene, true);
    const still = field(await page.screenshot({ clip }));
    await isolate(page, s.scene, false);
    report.still.push({ section: s.section, canvases, ground: +g.toFixed(4), coveragePct: +(coverage(still, g, FALLBACK_DELTA) * 100).toFixed(2), peak: +peak(still).toFixed(4) });
  }
  await ctx.close();
}

// --- 3. no-GL frame, 1440 (default: this host has no GPU, so plain `/` is the no-GL path)
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, baseURL: BASE });
  const page = await ctx.newPage();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await settle(page);
  for (const s of SCENES) {
    await slotClip(page, s.scene, 1440, 900);
    fs.writeFileSync(path.join(OUT, `${s.section}-1440-no-gl.png`), await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 900 } }));
  }
  await ctx.close();
}

// --- 4. THE ADVERSARIAL ADD: composited contrast on the shader path
for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1, baseURL: BASE });
  const page = await ctx.newPage();
  await page.goto('/?gl=force', { waitUntil: 'domcontentloaded' });
  await settle(page);
  report.contrastGlForce[vp.w] = await contrastFailures(page, ['hero', 'about', 'experience']);
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'probe-report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
