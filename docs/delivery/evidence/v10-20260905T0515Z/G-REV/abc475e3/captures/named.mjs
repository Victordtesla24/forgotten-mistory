// Probe (b/c/e) — named-node AA ratios, #skills field, SW freshness.
// Sampling method is the repo gate's: glyph-masked composited screenshot,
// pixels read under each text node's own rects. tests/a11y/text-contrast.spec.ts
import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'https://forgotten-mistory.web.app';
const GL_ARGS = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-lcd-text'];

const TARGETS = [
  { key: 'infocentric', sel: '#role-infocentric .Experience_roleCompany, #role-infocentric [class*="roleCompany"]' },
  { key: 'bandLabels', sel: '[class*="Bench_bandLabel"]' },
  { key: 'openNote', sel: 'p[class*="Experience_openNote"]' },
];

const MASK = `*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important;transition:none!important}`;

const ch = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const lum = ([r, g, b]) => 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
const ratio = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };

async function warm(page) {
  for (const s of ['hero-atmosphere', 'about-field', 'career-strata', 'skills-bench']) {
    const el = page.locator(`[data-scene="${s}"]`);
    if ((await el.count()) === 0) continue;
    await el.first().evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' })).catch(() => {});
    await page.waitForTimeout(900);
  }
}

async function measure(page, sel) {
  // Collect each matching element's colour + sample points, in viewport space.
  const nodes = await page.evaluate((s) => {
    const out = [];
    for (const el of document.querySelectorAll(s)) {
      const cs = getComputedStyle(el);
      if (cs.visibility !== 'visible' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) continue;
      if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) continue;
      const pts = [];
      for (const fx of [0.15, 0.35, 0.5, 0.65, 0.85]) for (const fy of [0.3, 0.5, 0.7]) pts.push([r.left + r.width * fx, r.top + r.height * fy]);
      out.push({ text: (el.textContent || '').trim().slice(0, 40), color: cs.color, fontSize: cs.fontSize, fontWeight: cs.fontWeight, pts });
    }
    return out;
  }, sel);
  if (!nodes.length) return [];
  await page.evaluate((css) => { const st = document.createElement('style'); st.id = '__mask'; st.textContent = css; document.head.appendChild(st); }, MASK);
  const png = await page.screenshot({ fullPage: false, animations: 'disabled' });
  await page.evaluate(() => document.getElementById('__mask')?.remove());
  const all = nodes.flatMap((n) => n.pts);
  const px = await page.evaluate(async ([b64, pts]) => {
    const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
    const sc = img.naturalWidth / window.innerWidth;
    return pts.map(([px2, py]) => { const d = x.getImageData(Math.min(c.width - 1, Math.round(px2 * sc)), Math.min(c.height - 1, Math.round(py * sc)), 1, 1).data; return [d[0], d[1], d[2]]; });
  }, [png.toString('base64'), all]);
  let cur = 0; const res = [];
  for (const n of nodes) {
    const m = n.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    const fg = m ? [+m[1], +m[2], +m[3]] : [0, 0, 0];
    const mine = px.slice(cur, cur + n.pts.length); cur += n.pts.length;
    let worst = Infinity, wbg = null;
    for (const bg of mine) { const r = ratio(fg, bg); if (r < worst) { worst = r; wbg = bg; } }
    res.push({ text: n.text, fg: `rgb(${fg.join(',')})`, bg: `rgb(${wbg.join(',')})`, fontSize: n.fontSize, fontWeight: n.fontWeight, ratio: Math.round(worst * 1000) / 1000 });
  }
  return res;
}

async function skillsField(page) {
  const sel = page.locator('[data-scene="skills-bench"]');
  if ((await sel.count()) === 0) return { present: false, reason: 'no [data-scene=skills-bench] slot' };
  await sel.first().evaluate((n) => n.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(2500);
  const canvases = await page.locator('[data-scene="skills-bench"] canvas').count();
  if (!canvases) return { present: false, canvases: 0 };
  const box = await sel.first().boundingBox();
  const grab = async () => {
    const b = await page.screenshot({ clip: { x: Math.max(0, box.x), y: Math.max(0, box.y), width: Math.min(box.width, 1400), height: Math.min(box.height, 700) }, animations: 'disabled' });
    return b;
  };
  // hide everything but the scene slot, as the flagship spec does
  await page.evaluate(() => {
    const slot = document.querySelector('[data-scene="skills-bench"]');
    document.querySelectorAll('body *').forEach((e) => { if (!e.contains(slot) && !slot.contains(e) && e !== slot) e.style.visibility = 'hidden'; });
  });
  await page.waitForTimeout(400);
  const a = await grab();
  await page.waitForTimeout(1600);
  const b = await grab();
  await page.evaluate(() => document.querySelectorAll('body *').forEach((e) => (e.style.visibility = '')));
  const stats = await page.evaluate(async ([A, B]) => {
    const load = async (s) => { const i = new Image(); i.src = `data:image/png;base64,${s}`; await i.decode(); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(i, 0, 0); return x.getImageData(0, 0, c.width, c.height); };
    const chf = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
    const L = (r, g, bl) => 0.2126 * chf(r) + 0.7152 * chf(g) + 0.0722 * chf(bl);
    const ia = await load(A), ib = await load(B);
    const n = ia.data.length / 4;
    const la = new Float64Array(n), lb = new Float64Array(n);
    for (let i = 0; i < n; i++) { la[i] = L(ia.data[i * 4], ia.data[i * 4 + 1], ia.data[i * 4 + 2]); lb[i] = L(ib.data[i * 4], ib.data[i * 4 + 1], ib.data[i * 4 + 2]); }
    const sorted = Float64Array.from(la).sort();
    const ground = sorted[Math.floor(n * 0.1)];
    let cov = 0, peak = 0, d = 0;
    for (let i = 0; i < n; i++) { if (la[i] >= ground + 0.06) cov++; if (la[i] > peak) peak = la[i]; d += Math.abs(la[i] - lb[i]); }
    return { ground: +ground.toFixed(4), coverage: +(cov / n).toFixed(4), peak: +peak.toFixed(4), motion: +(d / n).toFixed(5), pixels: n };
  }, [a.toString('base64'), b.toString('base64')]);
  return { present: true, canvases, ...stats };
}

const out = { probedAt: new Date().toISOString(), contexts: [] };

for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  for (const path of ['/', '/?gl=force']) {
    const browser = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: GL_ARGS });
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const pe = [], ce = [], rf = [];
    page.on('pageerror', (e) => pe.push(String(e.message || e)));
    page.on('console', (m) => { if (m.type() === 'error') ce.push(m.text().slice(0, 250)); });
    page.on('requestfailed', (r) => rf.push(`${r.url()} :: ${r.failure()?.errorText}`));
    page.on('response', (r) => { if (r.status() >= 400) rf.push(`${r.url()} :: HTTP ${r.status()}`); });
    await page.goto(`${BASE}${path}${path.includes('?') ? '&' : '?'}cb=${Date.now()}`, { waitUntil: 'domcontentloaded' });
    await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
    await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)); } scrollTo(0, 0); });
    await page.waitForTimeout(2500);
    const gl = path.includes('gl=force');
    if (gl) await warm(page);
    const build = await page.evaluate(() => document.querySelector('meta[name="build-commit"]')?.content || null);
    const rec = { viewport: `${vp.w}x${vp.h}`, path, build, nodes: {}, pageerrors: pe, consoleErrors: ce, failedRequests: rf };
    for (const t of TARGETS) {
      // bring the node's own section into view first
      await page.evaluate((s) => { const e = document.querySelector(s); if (e) e.scrollIntoView({ block: 'center', behavior: 'instant' }); }, t.sel);
      await page.waitForTimeout(gl ? 1500 : 400);
      rec.nodes[t.key] = await measure(page, t.sel);
    }
    if (gl) rec.skills = await skillsField(page);
    out.contexts.push(rec);
    console.log(`${vp.w} ${path} build=${build} pe=${pe.length} ce=${ce.length} rf=${rf.length}`);
    for (const [k, v] of Object.entries(rec.nodes)) console.log(`   ${k}: ${v.length ? v.map((x) => `${x.text.slice(0, 18)}=${x.ratio}`).join(' | ') : 'NOT FOUND/offscreen'}`);
    if (rec.skills) console.log(`   skills: ${JSON.stringify(rec.skills)}`);
    await ctx.close(); await browser.close();
  }
}

// (e) returning-visitor second load on a persistent profile
{
  const dir = '/tmp/fm-rev-profile-' + Date.now();
  const c1 = await chromium.launchPersistentContext(dir, { executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], viewport: { width: 1280, height: 720 }, serviceWorkers: 'allow' });
  const p1 = await c1.newPage();
  await p1.goto(BASE, { waitUntil: 'load' });
  await p1.waitForTimeout(5000);
  const first = await p1.evaluate(() => ({ build: document.querySelector('meta[name="build-commit"]')?.content, sw: navigator.serviceWorker?.controller ? 'controlled' : 'none' }));
  await c1.close();
  const c2 = await chromium.launchPersistentContext(dir, { executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'], viewport: { width: 1280, height: 720 }, serviceWorkers: 'allow' });
  const p2 = await c2.newPage();
  const pe2 = []; p2.on('pageerror', (e) => pe2.push(String(e.message || e)));
  await p2.goto(BASE, { waitUntil: 'load' });
  await p2.waitForTimeout(5000);
  const second = await p2.evaluate(() => ({ build: document.querySelector('meta[name="build-commit"]')?.content, sw: navigator.serviceWorker?.controller ? 'controlled' : 'none' }));
  await c2.close();
  const live = await (await fetch(BASE)).text();
  const liveBuild = (live.match(/build-commit"\s+content="([a-f0-9]+)"/) || [])[1];
  out.swFreshness = { first, second, liveBuild, pageerrorsSecond: pe2, match: second.build === liveBuild };
  console.log('SW', JSON.stringify(out.swFreshness));
}

fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 2));
console.log('WROTE', process.argv[2]);
