const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const OUT = '/root/forgotten-mistory/docs/delivery/evidence/v9-20260904T2312Z/R-c8';
const URL = 'https://forgotten-mistory.web.app/?gl=force';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  const log = { consoleErrors: [], pageErrors: [], sections: {}, notes: [] };
  const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') log.consoleErrors.push({ type: m.type(), text: m.text().slice(0, 300) }); });
    page.on('pageerror', e => log.pageErrors.push(String(e).slice(0, 300)));
    const t0 = Date.now();
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 60000 });
    log.loadMs = Date.now() - t0;
    await sleep(1500);
    // Hero pointer sweep
    for (let i = 0; i <= 8; i++) { await page.mouse.move(120 + i * 150, 300 + (i % 2) * 200, { steps: 6 }); await sleep(120); }
    await page.screenshot({ path: path.join(OUT, 'hero-pointer-sweep.png') });
    // canvas inventory
    log.canvases = await page.evaluate(() => Array.from(document.querySelectorAll('canvas')).map(c => { const r = c.getBoundingClientRect(); const sec = c.closest('section'); return { section: sec && sec.id, w: c.width, h: c.height, cssW: Math.round(r.width), cssH: Math.round(r.height), ctxWebGL: !!(c.getContext('webgl2') || c.getContext('webgl')) }; }));
    log.svgs = await page.evaluate(() => Array.from(document.querySelectorAll('section')).map(s => ({ id: s.id, svg: s.querySelectorAll('svg').length, animatedEls: Array.from(s.querySelectorAll('*')).filter(e => { const cs = getComputedStyle(e); return (cs.animationName && cs.animationName !== 'none') || (cs.transitionDuration && cs.transitionDuration !== '0s'); }).length, h: Math.round(s.getBoundingClientRect().height) })));
    const ids = ['hero', 'about', 'experience', 'skills', 'vitrine', 'listen'];
    for (const id of ids) {
      const el = await page.$('#' + id);
      if (!el) { log.sections[id] = 'MISSING'; continue; }
      // slow scroll to section
      const y = await page.evaluate((id) => document.getElementById(id).getBoundingClientRect().top + window.scrollY, id);
      const cur = await page.evaluate(() => window.scrollY);
      const steps = 12; for (let s = 1; s <= steps; s++) { await page.evaluate((v) => window.scrollTo(0, v), cur + (y - cur) * s / steps); await sleep(60); }
      const shots = [];
      for (let k = 0; k < 3; k++) { const p = path.join(OUT, `${id}-t${k}.png`); await page.screenshot({ path: p }); shots.push(p); await sleep(400); }
      log.sections[id] = { top: Math.round(y), shots };
    }
    // About hover
    await page.evaluate(() => document.getElementById('about').scrollIntoView()); await sleep(600);
    const aboutItems = await page.$$('#about li, #about [role="listitem"], #about button, #about [data-dimension]');
    log.aboutItemCount = aboutItems.length;
    if (aboutItems[2]) { await aboutItems[2].hover(); await sleep(450); await page.screenshot({ path: path.join(OUT, 'about-hover.png') }); }
    // Experience hover
    await page.evaluate(() => document.getElementById('experience').scrollIntoView()); await sleep(600);
    const bars = await page.$$('#experience li, #experience [data-role], #experience button, #experience [role="listitem"]');
    log.expItemCount = bars.length;
    if (bars[1]) { await bars[1].hover(); await sleep(450); await page.screenshot({ path: path.join(OUT, 'experience-hover.png') }); }
    // Vitrine rail scroll
    await page.evaluate(() => document.getElementById('vitrine').scrollIntoView()); await sleep(600);
    log.vitrineRail = await page.evaluate(() => { const v = document.getElementById('vitrine'); const cands = Array.from(v.querySelectorAll('*')).filter(e => { const cs = getComputedStyle(e); return (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && e.scrollWidth > e.clientWidth + 10; }); const r = cands[0]; if (!r) return null; r.scrollBy({ left: 600, behavior: 'smooth' }); return { tag: r.tagName, cls: r.className, scrollWidth: r.scrollWidth, clientWidth: r.clientWidth, snap: getComputedStyle(r).scrollSnapType }; });
    await sleep(900); await page.screenshot({ path: path.join(OUT, 'vitrine-rail-scrolled.png') });
    // MiniVic
    const toggle = await page.$('[data-testid="minivic-toggle"]');
    log.minivicToggle = !!toggle;
    if (toggle) { const b = await toggle.boundingBox(); log.minivicBox = b; await toggle.click(); await sleep(900); await page.screenshot({ path: path.join(OUT, 'minivic-open.png') }); log.minivicPanelText = (await page.evaluate(() => { const p = document.querySelector('[data-testid="minivic-panel"], [role="dialog"], [aria-label*="MiniVic" i]'); return p ? p.innerText.slice(0, 600) : null; })); }
    // reduced-motion + no-gl check
    const ctx2 = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', deviceScaleFactor: 2 });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', e => log.pageErrors.push('RM/noGL: ' + String(e).slice(0, 200)));
    await p2.addInitScript(() => { const orig = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...a) { if (/webgl/i.test(t)) return null; return orig.call(this, t, ...a); }; });
    await p2.goto('https://forgotten-mistory.web.app/', { waitUntil: 'networkidle', timeout: 60000 }); await sleep(1200);
    await p2.screenshot({ path: path.join(OUT, 'mobile-rm-nogl-hero.png') });
    log.noGlHero = await p2.evaluate(() => { const h = document.getElementById('hero'); return { canvases: h.querySelectorAll('canvas').length, text: h.innerText.slice(0, 200), fallbackEls: h.querySelectorAll('[data-gl-fallback], [data-fallback]').length }; });
    await p2.evaluate(() => document.getElementById('experience').scrollIntoView()); await sleep(800);
    await p2.screenshot({ path: path.join(OUT, 'mobile-rm-nogl-experience.png') });
    await p2.evaluate(() => document.getElementById('about').scrollIntoView()); await sleep(800);
    await p2.screenshot({ path: path.join(OUT, 'mobile-rm-nogl-about.png') });
    await ctx2.close(); await ctx.close();
  } catch (e) { log.fatal = String(e); }
  finally { await browser.close(); }
  fs.writeFileSync(path.join(OUT, 'motion-probe.json'), JSON.stringify(log, null, 2));
  console.log(JSON.stringify({ load: log.loadMs, canvases: log.canvases, svgs: log.svgs, errs: log.consoleErrors.length, pageErrs: log.pageErrors, about: log.aboutItemCount, exp: log.expItemCount, rail: log.vitrineRail, mv: log.minivicToggle, noGl: log.noGlHero, fatal: log.fatal }, null, 1));
})();
