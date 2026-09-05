const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c1';
const URL = 'https://forgotten-mistory.web.app/';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const log = { console: [], pageErrors: [], observations: {} };
  page.on('console', m => { if (['error','warning'].includes(m.type())) log.console.push({ type: m.type(), text: m.text().slice(0, 300) }); });
  page.on('pageerror', e => log.pageErrors.push(String(e).slice(0, 300)));
  const t0 = Date.now();
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
  log.observations.loadMs = Date.now() - t0;
  await sleep(1800);
  // canvases + GL
  log.observations.canvases = await page.evaluate(() => Array.from(document.querySelectorAll('canvas')).map(c => { const r = c.getBoundingClientRect(); const s = c.closest('section'); return { section: s && s.id, w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height), top: Math.round(r.top + scrollY) }; }));
  log.observations.sections = await page.evaluate(() => Array.from(document.querySelectorAll('section[id]')).map(s => ({ id: s.id, top: Math.round(s.getBoundingClientRect().top + scrollY), h: Math.round(s.getBoundingClientRect().height) })));
  // Hero pointer sweep: sample pixel luminance change of hero canvas via screenshots
  await page.mouse.move(100, 450); await sleep(700);
  await page.screenshot({ path: path.join(OUT, 'hero-pointer-left.png') });
  await page.mouse.move(1340, 450, { steps: 25 }); await sleep(900);
  await page.screenshot({ path: path.join(OUT, 'hero-pointer-right.png') });
  // hero triple
  for (let i = 0; i < 3; i++) { await page.screenshot({ path: path.join(OUT, `hero-${i}.png`) }); await sleep(400); }
  const ids = ['about', 'experience', 'skills', 'vitrine', 'listen'];
  for (const id of ids) {
    // slow scroll
    const top = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().top + scrollY, id);
    const cur = await page.evaluate(() => scrollY);
    const steps = 12;
    for (let s = 1; s <= steps; s++) { await page.evaluate((y) => scrollTo(0, y), cur + (top - 40 - cur) * s / steps); await sleep(60); }
    await sleep(500);
    for (let i = 0; i < 3; i++) { await page.screenshot({ path: path.join(OUT, `${id}-${i}.png`) }); await sleep(400); }
  }
  // About hover: compass rotation
  await page.evaluate(() => document.getElementById('about').scrollIntoView({ block: 'start' })); await sleep(600);
  const aboutItems = page.locator('#about ol li');
  log.observations.aboutItemCount = await aboutItems.count();
  const compassBefore = await page.evaluate(() => { const g = document.querySelector('#about svg g[class*="rose"]'); return g ? g.getAttribute('style') : null; });
  await aboutItems.nth(3).hover(); await sleep(400);
  const compassMid = await page.evaluate(() => { const g = document.querySelector('#about svg g[class*="rose"]'); return g ? getComputedStyle(g).transform : null; });
  await sleep(600);
  const compassAfter = await page.evaluate(() => { const g = document.querySelector('#about svg g[class*="rose"]'); const t = document.querySelectorAll('#about svg text'); return { style: g && g.getAttribute('style'), computed: g && getComputedStyle(g).transform, transition: g && getComputedStyle(g).transition, readout: Array.from(t).slice(-2).map(x => x.textContent) }; });
  log.observations.compass = { before: compassBefore, mid: compassMid, after: compassAfter };
  await page.screenshot({ path: path.join(OUT, 'about-hover-item4.png') });
  // Experience hover
  await page.evaluate(() => document.getElementById('experience').scrollIntoView({ block: 'start' })); await sleep(800);
  const tracks = page.locator('#experience ol li');
  log.observations.experienceTrackCount = await tracks.count();
  await tracks.nth(2).hover(); await sleep(500);
  log.observations.experienceHover = await page.evaluate(() => { const li = document.querySelectorAll('#experience ol li')[2]; const bar = li.querySelector('[class*="bar"], [class*="span"], [class*="fill"]') || li.firstElementChild; return { liClass: li.className, dataActive: li.getAttribute('data-active'), aria: li.getAttribute('aria-current'), barTransform: bar && getComputedStyle(bar).transform, barTransition: bar && getComputedStyle(bar).transition, barBg: bar && getComputedStyle(bar).backgroundColor }; });
  await page.screenshot({ path: path.join(OUT, 'experience-hover-track3.png') });
  // Skills bench
  await page.evaluate(() => document.getElementById('skills').scrollIntoView({ block: 'start' })); await sleep(1500);
  log.observations.bench = await page.evaluate(() => { const paths = document.querySelectorAll('#skills svg path'); const gold = Array.from(paths).filter(p => /gold|production/.test(p.getAttribute('class') || '')).length; const anim = Array.from(paths).slice(0, 3).map(p => getComputedStyle(p).animationName + ' ' + getComputedStyle(p).animationDuration); return { wires: paths.length, goldish: gold, anim }; });
  const srcBtn = page.locator('#skills button').first();
  await srcBtn.hover(); await sleep(400);
  await page.screenshot({ path: path.join(OUT, 'skills-hover-source1.png') });
  // Vitrine rail scroll
  await page.evaluate(() => document.getElementById('vitrine').scrollIntoView({ block: 'start' })); await sleep(800);
  log.observations.vitrine = await page.evaluate(async () => { const rail = Array.from(document.querySelectorAll('#vitrine *')).find(e => { const cs = getComputedStyle(e); return (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && e.scrollWidth > e.clientWidth + 10; }); if (!rail) return { rail: null }; const before = rail.scrollLeft; rail.scrollBy({ left: 700, behavior: 'smooth' }); await new Promise(r => setTimeout(r, 900)); const plates = rail.querySelectorAll('li, article'); return { rail: rail.className, scrollW: rail.scrollWidth, clientW: rail.clientWidth, before, after: rail.scrollLeft, plates: plates.length, snap: getComputedStyle(rail).scrollSnapType, plateLit: Array.from(plates).slice(0, 6).map(p => p.getAttribute('data-lit') || p.getAttribute('data-active') || p.getAttribute('style')) }; });
  await page.screenshot({ path: path.join(OUT, 'vitrine-scrolled.png') });
  // Listen
  await page.evaluate(() => document.getElementById('listen').scrollIntoView({ block: 'start' })); await sleep(1200);
  log.observations.listen = await page.evaluate(() => { const r = document.querySelector('#listen span[class*="rule"]'); return { canvas: !!document.querySelector('#listen canvas'), svg: !!document.querySelector('#listen svg'), ruleAnim: r && getComputedStyle(r).animationName, ruleW: r && r.getBoundingClientRect().width }; });
  // MiniVic
  const toggle = page.locator('[data-testid="minivic-toggle"]');
  log.observations.minivicToggle = await toggle.count();
  if (await toggle.count()) { const bb = await toggle.boundingBox(); log.observations.minivicBox = bb; await toggle.click(); await sleep(900); await page.screenshot({ path: path.join(OUT, 'minivic-open.png') }); log.observations.minivicPanel = await page.evaluate(() => { const p = document.querySelector('[role="dialog"], [data-testid*="minivic"][aria-modal], [class*="panel"]'); return p ? { w: Math.round(p.getBoundingClientRect().width), text: p.textContent.slice(0, 240) } : null; }); }
  // reduced motion + webgl-off pass
  await page.close();
  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p2 = await ctx2.newPage(); await p2.goto(URL, { waitUntil: 'networkidle' }); await sleep(1500);
  await p2.screenshot({ path: path.join(OUT, 'hero-reduced-motion.png') });
  log.observations.reducedMotion = await p2.evaluate(() => ({ canvases: document.querySelectorAll('canvas').length, heroRiseAnim: getComputedStyle(document.querySelector('#hero h1')).animationName }));
  await ctx2.close();
  const ctx3 = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const p3 = await ctx3.newPage(); await p3.goto(URL, { waitUntil: 'networkidle' }); await sleep(1500);
  await p3.screenshot({ path: path.join(OUT, 'hero-390.png') });
  log.observations.mobile = await p3.evaluate(() => Array.from(document.querySelectorAll('canvas')).map(c => ({ w: c.width, h: c.height })));
  await ctx3.close();
  await browser.close();
  fs.writeFileSync(path.join(OUT, 'motion-observe.json'), JSON.stringify(log, null, 2));
  console.log(JSON.stringify(log, null, 1));
})().catch(e => { console.error('FAIL', e); process.exit(1); });
