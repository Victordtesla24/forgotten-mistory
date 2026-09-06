/**
 * rev-3657baa1-w2 — S-3 regression table on the live build, re-measured, not re-read.
 * One browser, contexts closed between checks.
 */
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const SPD = await import('/root/forgotten-mistory/scripts/validate/hero_plane_dominance.mjs');
const BASE = 'https://forgotten-mistory.web.app';
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v10-20260905T0515Z/G-REV/3657baa1';
mkdirSync(OUT, { recursive: true });
const out = {};
const maxChroma = (buf) => {
  const png = PNG.sync.read(buf);
  let m = 0;
  let n = 0;
  for (let i = 0; i < png.data.length; i += 4) {
    const c = Math.max(png.data[i], png.data[i + 1], png.data[i + 2]) - Math.min(png.data[i], png.data[i + 1], png.data[i + 2]);
    if (c > m) m = c;
    n += 1;
  }
  return { max: m, px: n };
};

const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: [...SPD.GL_ARGS] });

/* ------------------------------------------------------------------ 1440 desktop */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  const cons = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e)));
  page.on('console', (m) => { if (m.type() === 'error') cons.push(m.text().slice(0, 200)); });
  await SPD.preparePage(page, BASE, { id: 'gl', url: '/?gl=force', reducedMotion: false });

  out.build_commit = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content || null);

  // G-A3 — the ten dimensions and the about field
  out.G_A3 = await page.evaluate(async () => {
    const about = document.querySelector('#about');
    about?.scrollIntoView({ block: 'start' });
    await new Promise((r) => setTimeout(r, 2500));
    const canvases = about ? about.querySelectorAll('canvas').length : 0;
    const text = (about?.textContent || '').replace(/\s+/g, ' ');
    const numbered = [];
    for (let i = 1; i <= 10; i += 1) {
      const t = String(i).padStart(2, '0');
      if (text.includes(t)) numbered.push(t);
    }
    const heading = about?.querySelector('h2')?.textContent?.trim() || null;
    return { canvases, numbered, numbered_count: numbered.length, heading };
  });
  const aboutShot = await page.screenshot({ type: 'png' });
  writeFileSync(join(OUT, 'reg-1440-about.png'), aboutShot);
  out.G_A3.max_chroma_about_screen = maxChroma(aboutShot);

  // scene-7 — the career descent band
  out.scene7 = await page.evaluate(async () => {
    const el = document.querySelector('[data-scene="career-descent"]');
    if (!el) return { present: false };
    el.scrollIntoView({ block: 'center' });
    await new Promise((r) => setTimeout(r, 2500));
    const r = el.getBoundingClientRect();
    const band = el.closest('[class*="descent"], section') || el.parentElement;
    const br = band ? band.getBoundingClientRect() : null;
    return {
      present: true,
      canvases_in_scene: el.querySelectorAll('canvas').length,
      scene_rect: { w: Math.round(r.width), h: Math.round(r.height) },
      band_rect: br ? { w: Math.round(br.width), h: Math.round(br.height) } : null,
      band_vh: br ? Number((br.height / window.innerHeight).toFixed(2)) : null,
    };
  });
  const descentShot = await page.screenshot({ type: 'png' });
  writeFileSync(join(OUT, 'reg-1440-descent.png'), descentShot);
  out.scene7.max_chroma_descent_screen = maxChroma(descentShot);

  // vitrine + listen chroma, and the MiniVic disclosure
  out.vitrine = await page.evaluate(async () => {
    const v = document.querySelector('#vitrine');
    v?.scrollIntoView({ block: 'start' });
    await new Promise((r) => setTimeout(r, 1800));
    return { canvases: v ? v.querySelectorAll('canvas').length : 0, cards: v ? v.querySelectorAll('article, li').length : 0 };
  });
  const vitrineShot = await page.screenshot({ type: 'png' });
  out.vitrine.max_chroma_vitrine_screen = maxChroma(vitrineShot);
  writeFileSync(join(OUT, 'reg-1440-vitrine.png'), vitrineShot);

  // TC-BOT-14 — the open panel against the H1 glyph run, at the top of the page
  out.TC_BOT_14 = await page.evaluate(async () => {
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 600));
    const launcher = document.querySelector('.minivic-launcher, [class*="launcher"]');
    const before = launcher ? launcher.getBoundingClientRect() : null;
    if (launcher) launcher.click();
    await new Promise((r) => setTimeout(r, 1400));
    const panel = document.querySelector('[class*="minivic"][class*="panel"], .minivic-panel, [role="dialog"]');
    const h1 = document.querySelector('#hero h1');
    const hr = h1 ? h1.getBoundingClientRect() : null;
    // the glyph run, not the block: the union of the text node's client rects
    let run = null;
    if (h1) {
      const range = document.createRange();
      range.selectNodeContents(h1);
      const rects = Array.from(range.getClientRects());
      if (rects.length) {
        run = {
          x: Math.min(...rects.map((r) => r.left)),
          y: Math.min(...rects.map((r) => r.top)),
          right: Math.max(...rects.map((r) => r.right)),
          bottom: Math.max(...rects.map((r) => r.bottom)),
        };
      }
    }
    const pr = panel ? panel.getBoundingClientRect() : null;
    const gap = pr && run ? pr.left - run.right : null;
    const overlap = pr && run
      ? {
          x: Math.max(0, Math.min(pr.right, run.right) - Math.max(pr.left, run.x)),
          y: Math.max(0, Math.min(pr.bottom, run.bottom) - Math.max(pr.top, run.y)),
        }
      : null;
    // the disclosure line inside the panel
    const disclosure = panel ? Array.from(panel.querySelectorAll('*')).find((e) => /synthetic|live text|openai/i.test(e.textContent || '') && e.children.length === 0) : null;
    const dr = disclosure ? disclosure.getBoundingClientRect() : null;
    return {
      launcher_rect: before,
      panel_rect: pr ? { x: pr.left, y: pr.top, w: pr.width, h: pr.height } : null,
      h1_block: hr ? { x: hr.left, y: hr.top, w: hr.width, h: hr.height } : null,
      h1_glyph_run: run,
      min_horizontal_gap: gap === null ? null : Number(gap.toFixed(1)),
      overlap_px: overlap,
      disclosure_text: disclosure ? (disclosure.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) : null,
      disclosure_visible: dr ? dr.width > 0 && dr.height > 0 && dr.top < window.innerHeight : null,
      disclosure_clipped: disclosure ? disclosure.scrollWidth > disclosure.clientWidth + 1 || disclosure.scrollHeight > disclosure.clientHeight + 1 : null,
    };
  });
  writeFileSync(join(OUT, 'reg-1440-panel-open.png'), await page.screenshot({ type: 'png' }));

  out.desktop_errors = { pageerrors: errs, console_errors: cons };
  await ctx.close();
}

/* ------------------------------------------------------------------ 390 G-MV1 */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: false });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e)));
  await SPD.preparePage(page, BASE, { id: 'gl', url: '/?gl=force', reducedMotion: false });
  out.G_MV1 = await page.evaluate(async () => {
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 500));
    const el = document.querySelector('.minivic-launcher, [class*="launcher"]');
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const hit = document.elementFromPoint(cx, cy);
    return {
      found: true,
      rect: { x: r.left, y: r.top, w: r.width, h: r.height },
      display: cs.display,
      visibility: cs.visibility,
      opacity: cs.opacity,
      in_first_fold: r.top >= 0 && r.bottom <= window.innerHeight,
      hit_tag: hit ? hit.tagName + '.' + (typeof hit.className === 'string' ? hit.className.split(/\s+/)[0] : '') : null,
      hit_is_self: !!(hit && (hit === el || el.contains(hit) || hit.contains(el))),
      label: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      target_ok: r.width >= 44 && r.height >= 44,
    };
  });
  writeFileSync(join(OUT, 'reg-390-firstfold.png'), await page.screenshot({ type: 'png' }));
  if (out.G_MV1.found) {
    const t0 = Date.now();
    await page.locator('.minivic-launcher, [class*="launcher"]').first().click({ timeout: 8000 }).catch((e) => { out.G_MV1.click_error = String(e).slice(0, 160); });
    await page.waitForTimeout(1500);
    out.G_MV1.click_ms = Date.now() - t0;
    out.G_MV1.panel = await page.evaluate(() => {
      const p = document.querySelector('[class*="minivic"][class*="panel"], .minivic-panel, [role="dialog"]');
      if (!p) return null;
      const r = p.getBoundingClientRect();
      const d = Array.from(p.querySelectorAll('*')).find((e) => /synthetic|live text|openai/i.test(e.textContent || '') && e.children.length === 0);
      const dr = d ? d.getBoundingClientRect() : null;
      return {
        rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
        disclosure: d ? (d.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) : null,
        disclosure_visible: dr ? dr.width > 0 && dr.height > 0 : null,
      };
    });
    writeFileSync(join(OUT, 'reg-390-panel-open.png'), await page.screenshot({ type: 'png' }));
  }
  out.mobile_errors = errs;
  await ctx.close();
}

/* ------------------------------------------------------------------ ?gl=off */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message || e)));
  await page.goto(`${BASE}/?gl=off`, { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await page.locator('button.preloader-skip').click({ timeout: 5000 }).catch(() => {});
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(2000);
  out.gl_off = await page.evaluate(async () => {
    const ids = ['#hero', '#about', '#experience', '#skills', '#vitrine', '#listen'];
    const perSection = {};
    for (const id of ids) {
      const el = document.querySelector(id);
      if (!el) { perSection[id] = 'missing'; continue; }
      el.scrollIntoView({ block: 'center' });
      await new Promise((r) => setTimeout(r, 900));
      perSection[id] = el.querySelectorAll('canvas').length;
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
    return { total_canvases: document.querySelectorAll('canvas').length, per_section: perSection, h1_visible: !!document.querySelector('#hero h1')?.getBoundingClientRect().height };
  });
  out.gl_off.pageerrors = errs;
  writeFileSync(join(OUT, 'reg-1440-gl-off.png'), await page.screenshot({ type: 'png' }));
  await ctx.close();
}

/* ------------------------------------------------------------------ vitals, default path */
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__lcp = 0;
    window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  const pre = page.locator('.preloader');
  if (await pre.isVisible().catch(() => false)) {
    await page.locator('button.preloader-skip').click({ timeout: 5000 }).catch(() => {});
    await pre.waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  }
  await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(4000);
  const v = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), cls: Number(window.__cls.toFixed(4)) }));
  out[`vitals_${vp.width}`] = v;
  await ctx.close();
}

await browser.close();
writeFileSync(join(OUT, '07-regression.json'), `${JSON.stringify({ base: BASE, probed_utc: new Date().toISOString(), ...out }, null, 2)}\n`);
console.log(JSON.stringify(out, null, 1).slice(0, 4000));
