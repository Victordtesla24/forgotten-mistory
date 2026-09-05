import { chromium } from '@playwright/test';

const BASE = 'http://127.0.0.1:5602';
const out = [];
const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };

const settle = async (page) => {
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1200);
};

const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });

// ── C-02 acceptance, at 1440 / 1920 / 1280 / 390 ─────────────────────────────
for (const [w, h] of [[1440, 900], [1920, 1080], [1280, 800], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.locator('#vitrine').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);

  const m = await page.evaluate(() => {
    const sec = document.querySelector('#vitrine');
    const heading = sec.querySelector('h2');
    const eyebrow = sec.querySelector('[class*="eyebrow"]');
    const rail = sec.querySelector('ol');
    const plates = [...rail.children];
    const cs = getComputedStyle(rail);
    const p0 = plates[0].getBoundingClientRect();
    const p0cs = getComputedStyle(plates[0]);
    const last = plates[plates.length - 1].getBoundingClientRect();
    const unlit = plates.find(p => !p.hasAttribute('data-lit'));
    return {
      headingLeft: heading.getBoundingClientRect().left,
      eyebrowLeft: eyebrow ? eyebrow.getBoundingClientRect().left : null,
      card01Left: p0.left,
      card01BorderLeftWidth: p0cs.borderLeftWidth,
      litIndexes: plates.map((p, i) => p.hasAttribute('data-lit') ? i : -1).filter(i => i >= 0),
      drawnIndexes: plates.map((p, i) => p.hasAttribute('data-drawn') ? i : -1).filter(i => i >= 0),
      maskImage: cs.maskImage || cs.webkitMaskImage,
      unlitOpacity: unlit ? parseFloat(getComputedStyle(unlit).opacity) : null,
      railScrollWidth: rail.scrollWidth,
      railClientWidth: rail.clientWidth,
      lastRight: last.right,
      docScrollWidth: document.documentElement.scrollWidth,
    };
  });
  log(`\n=== ${w}x${h} — C-02 ===`);
  log(`heading.left=${m.headingLeft}  card01.left=${m.card01Left}  |delta|=${Math.abs(m.headingLeft - m.card01Left).toFixed(2)}  borderLeftWidth=${m.card01BorderLeftWidth}`);
  log(`eyebrow.left=${m.eyebrowLeft}`);
  log(`mask-image=${(m.maskImage || 'none').slice(0, 120)}`);
  log(`lit at first paint=[${m.litIndexes}]  drawn=[${m.drawnIndexes}]  unlit opacity=${m.unlitOpacity}`);
  log(`rail scrollWidth=${m.railScrollWidth} clientWidth=${m.railClientWidth}  doc.scrollWidth=${m.docScrollWidth}`);

  // scrollBy 600 → exactly one [data-lit]
  const afterScroll = await page.evaluate(async () => {
    const rail = document.querySelector('#vitrine ol');
    rail.scrollBy({ left: 600, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 900));
    const plates = [...rail.children];
    return { lit: plates.map((p, i) => p.hasAttribute('data-lit') ? i : -1).filter(i => i >= 0) };
  });
  log(`after scrollBy(600): lit=[${afterScroll.lit}] (count ${afterScroll.lit.length})`);

  // lit plate svg paths reach stroke-dashoffset 0 by 900 ms
  const trace = await page.evaluate(async () => {
    const rail = document.querySelector('#vitrine ol');
    rail.scrollTo({ left: 0, behavior: 'instant' });
    await new Promise(r => setTimeout(r, 1200));
    const lit = [...rail.children].find(p => p.hasAttribute('data-lit'));
    const paths = [...lit.querySelectorAll('svg path, svg line, svg circle, svg rect, svg polyline')];
    const off = paths.map(p => getComputedStyle(p).strokeDashoffset);
    return { index: [...rail.children].indexOf(lit), count: paths.length, offsets: [...new Set(off)] };
  });
  log(`lit plate ${trace.index}: ${trace.count} svg shapes, distinct stroke-dashoffset after >900ms = ${JSON.stringify(trace.offsets)}`);

  await ctx.close();
}

// ── S-4 reduced motion: dashoffset 0 at 100 ms ───────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.locator('#vitrine').scrollIntoViewIfNeeded();
  const rm = await page.evaluate(async () => {
    await new Promise(r => setTimeout(r, 100));
    const rail = document.querySelector('#vitrine ol');
    const lit = [...rail.children].find(p => p.hasAttribute('data-lit'));
    const paths = [...lit.querySelectorAll('svg path, svg line, svg circle, svg rect, svg polyline')];
    return {
      matches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      index: [...rail.children].indexOf(lit),
      count: paths.length,
      offsets: [...new Set(paths.map(p => getComputedStyle(p).strokeDashoffset))],
      anim: [...new Set(paths.map(p => getComputedStyle(p).animationName))],
      transition: [...new Set(paths.map(p => getComputedStyle(p).transitionDuration))],
    };
  });
  log(`\n=== reduced-motion @1440, sampled at t=100ms ===`);
  log(`matchMedia reduce=${rm.matches}  lit plate=${rm.index}  shapes=${rm.count}`);
  log(`stroke-dashoffset=${JSON.stringify(rm.offsets)}  animation-name=${JSON.stringify(rm.anim)}  transition-duration=${JSON.stringify(rm.transition)}`);
  await ctx.close();
}

// ── C-06 acceptance @390 and @1440 ───────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => {
    const hero = document.querySelector('#hero');
    const h1 = hero.querySelector('h1');
    const r = (el) => { const b = el.getBoundingClientRect(); return { l: +b.left.toFixed(2), t: +(b.top + window.scrollY).toFixed(2), r: +b.right.toFixed(2), b: +(b.bottom + window.scrollY).toFixed(2), w: +b.width.toFixed(2), h: +b.height.toFixed(2) }; };
    const notes = [...hero.querySelectorAll('[class*="ledgerSource"], [class*="figureNote"]')];
    const portrait = hero.querySelector('[class*="portrait"]');
    const lede = hero.querySelector('[class*="lede"], [class*="statement"]');
    const actions = [...hero.querySelectorAll('[class*="actions"] a, [class*="actions"] button')];
    // H1 line count via Range client rects
    const range = document.createRange();
    range.selectNodeContents(h1);
    const lines = [...range.getClientRects()].filter(x => x.height > 4).length;
    return {
      docScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
      h1: r(h1), h1Text: h1.innerText, h1LineBoxes: lines,
      portrait: portrait ? r(portrait) : null,
      lede: lede ? r(lede) : null,
      captions: notes.map(n => ({ sel: n.className, ...r(n), text: n.innerText.slice(0, 40) })),
      actions: actions.map(a => ({ text: a.innerText.trim().slice(0, 30), ...r(a) })),
    };
  });
  log(`\n=== 390x844 — C-06 / TC-HERO-12 ===`);
  log(`document.documentElement.scrollWidth=${m.docScrollWidth} (innerWidth ${m.innerWidth})`);
  log(`h1 rect=${JSON.stringify(m.h1)}  text=${JSON.stringify(m.h1Text)}  line boxes=${m.h1LineBoxes}`);
  log(`portrait rect=${JSON.stringify(m.portrait)}`);
  log(`lede rect=${JSON.stringify(m.lede)}`);
  for (const c of m.captions) log(`caption right=${c.r} (limit 366) top=${c.t} "${c.text}"`);
  for (const a of m.actions) log(`action "${a.text}" page-bottom=${a.b} (fold 844)`);
  const worst = Math.max(...m.actions.map(a => a.b));
  log(`worst hero action bottom (page y) = ${worst} → clearance ${(844 - worst).toFixed(2)} px`);
  const capMax = Math.max(...m.captions.map(c => c.r));
  log(`max caption right = ${capMax}`);
  await ctx.close();
}
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => {
    const hero = document.querySelector('#hero');
    const notes = [...hero.querySelectorAll('[class*="figureNote"]')];
    const foot = hero.querySelector('[class*="footnote"], [class*="ledgerNote"], [class*="calibration"]');
    const b = (el) => { const x = el.getBoundingClientRect(); return { t: +x.top.toFixed(2), b: +x.bottom.toFixed(2), h: +x.height.toFixed(2) }; };
    return {
      notes: notes.map(n => ({ cls: n.className, ...b(n) })),
      foot: foot ? { cls: foot.className, ...b(foot) } : null,
    };
  });
  log(`\n=== 1440x900 — C-06 second half (.figureNote box heights) ===`);
  if (!m.notes.length) log('no .figureNote elements present in the rendered hero');
  for (const n of m.notes) log(`figureNote h=${n.h} top=${n.t} bottom=${n.b} (${n.cls})`);
  log(`footnote=${JSON.stringify(m.foot)}`);
  await ctx.close();
}

// ── gold scan inside #vitrine ────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.locator('#vitrine').scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  const gold = await page.evaluate(() => {
    const isGold = (c) => {
      const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!m) return false;
      const [r, g, b] = [+m[1], +m[2], +m[3]];
      return !(r === g && g === b);
    };
    const hits = [];
    for (const el of document.querySelectorAll('#vitrine *')) {
      const cs = getComputedStyle(el);
      for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor', 'fill', 'stroke', 'outlineColor']) {
        const v = cs[prop];
        if (!v || v === 'none') continue;
        if (v.startsWith('rgba') && v.endsWith(', 0)')) continue;
        if (isGold(v)) hits.push({ tag: el.tagName, cls: String(el.className).slice(0, 60), prop, v, href: el.getAttribute && el.getAttribute('href'), text: (el.innerText || '').slice(0, 40) });
      }
    }
    return hits;
  });
  log(`\n=== #vitrine non-achromatic (gold) computed colours @1440 ===`);
  log(`count=${gold.length}`);
  for (const g of gold) log(`  ${g.tag}.${g.cls} ${g.prop}=${g.v} href=${g.href} text="${g.text}"`);
  await ctx.close();
}

// ── occlusion probe for the TC-CONTRAST-01 @390 failure ─────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await settle(page);
  const probe = await page.evaluate(async () => {
    const li = document.querySelector('#role-body-ato ul[class*="bullets"] > li:nth-of-type(1)');
    if (!li) return { error: 'node not found' };
    li.scrollIntoView({ block: 'center' });
    await new Promise(r => setTimeout(r, 400));
    const b = li.getBoundingClientRect();
    const launcher = document.querySelector('[data-testid="minivic-toggle"]');
    const lb = launcher ? launcher.getBoundingClientRect() : null;
    const lz = launcher ? getComputedStyle(launcher.closest('div.fixed') || launcher).zIndex : null;
    const lpos = launcher ? getComputedStyle(launcher.closest('div.fixed') || launcher).position : null;
    // sample points the way the spec does: across the text box
    const pts = [];
    for (let i = 1; i <= 9; i++) {
      const x = Math.round(b.left + (b.width * i) / 10);
      const y = Math.round(b.top + b.height / 2);
      const stack = document.elementsFromPoint(x, y).slice(0, 3).map(e => `${e.tagName.toLowerCase()}${String(e.className).split(' ').filter(Boolean).slice(0, 2).map(c => '.' + c).join('')}`);
      pts.push({ x, y, stack });
    }
    return {
      liRect: { l: +b.left.toFixed(1), t: +b.top.toFixed(1), r: +b.right.toFixed(1), bo: +b.bottom.toFixed(1) },
      liColor: getComputedStyle(li).color,
      launcherRect: lb ? { l: +lb.left.toFixed(1), t: +lb.top.toFixed(1), r: +lb.right.toFixed(1), bo: +lb.bottom.toFixed(1) } : null,
      launcherZ: lz, launcherPos: lpos,
      pts,
    };
  });
  log(`\n=== occlusion probe @390 for #role-body-ato li:nth-of-type(1) ===`);
  log(JSON.stringify(probe, null, 1));
  await ctx.close();
}

await browser.close();
