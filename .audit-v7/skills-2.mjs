import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });

async function open(vw, vh, rm = 'no-preference') {
  const ctx = await browser.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 1, reducedMotion: rm });
  const p = await ctx.newPage();
  await p.goto('https://forgotten-mistory.web.app/', { waitUntil: 'networkidle', timeout: 90000 });
  await p.evaluate(() => document.querySelector('#skills')?.scrollIntoView());
  await p.waitForTimeout(3500);
  return { ctx, p };
}

const GOLD = /rgb\(201,\s*168,\s*76\)|rgb\(212,\s*182,\s*92\)|rgb\(232,\s*213,\s*163\)|rgb\(176,\s*146,\s*63\)/;

const countGold = () => {
  const s = document.querySelector('#skills');
  const out = { wires: 0, dots: 0, glyphs: 0, other: [], total: 0 };
  const G = /rgb\(201,\s*168,\s*76\)|rgb\(212,\s*182,\s*92\)|rgb\(232,\s*213,\s*163\)|rgb\(176,\s*146,\s*63\)/;
  for (const p of s.querySelectorAll('svg path')) if ((p.getAttribute('stroke') || '').includes('gold')) out.wires++;
  for (const el of s.querySelectorAll('*')) {
    const c = getComputedStyle(el);
    const vis = el.getBoundingClientRect().width > 0 && c.visibility !== 'hidden' && c.display !== 'none';
    if (!vis) continue;
    if (G.test(c.backgroundColor)) { out.dots++; out.total++; }
    else if (G.test(c.color) && (el.textContent || '').trim().length && el.children.length === 0) { out.glyphs++; out.total++; }
    else if (G.test(c.boxShadow) || G.test(c.borderTopColor) || G.test(c.outlineColor)) { out.other.push(el.className.toString().slice(0, 40)); out.total++; }
  }
  out.total += out.wires;
  return out;
};

const probe = () => {
  const s = document.querySelector('#skills');
  return {
    anchors: s.querySelectorAll('a[href]').length,
    anchorHrefs: [...s.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
    svgRole: (() => { const v = s.querySelector('svg'); return v ? { ariaHidden: v.getAttribute('aria-hidden'), role: v.getAttribute('role'), display: getComputedStyle(v).display } : null; })(),
    figureHasAccName: (() => { const f = s.querySelector('figure'); return f ? { role: f.getAttribute('role'), label: f.getAttribute('aria-label'), tabindex: f.getAttribute('tabindex') } : null; })(),
    readoutText: s.querySelector('figure > p')?.textContent?.trim().slice(0, 140),
    // words that would indicate a recency / adjacency / date channel
    hasDateWords: /\b(20\d\d|days?|recency|pushed|updated|last)\b/i.test(s.innerText),
    dates: (s.innerText.match(/\b20\d\d\b/g) || []).slice(0, 10),
    railHeights: [...s.querySelectorAll('[class*="rail"]')].map((r) => Math.round(r.getBoundingClientRect().height)),
    benchHeight: Math.round(s.querySelector('figure')?.getBoundingClientRect().height ?? 0),
    sectionHeight: Math.round(s.getBoundingClientRect().height),
    nodeTargets: [...s.querySelectorAll('[class*="node"]')].map((n) => { const r = n.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width) }; }),
  };
};

for (const [w, h, tag] of [[1440, 900, 'desktop-1440'], [390, 844, 'mobile-390'], [900, 900, 'bp-900']]) {
  const { ctx, p } = await open(w, h);
  const g = await p.evaluate(countGold);
  const pr = await p.evaluate(probe);
  console.log(`\n=== ${tag} · reduced-motion: no-preference · GPU: angle/metal (headless Chromium 1x DPR) ===`);
  console.log('gold:', JSON.stringify(g));
  console.log('probe:', JSON.stringify(pr, null, 1));
  await ctx.close();
}

// interaction probes on desktop
{
  const { ctx, p } = await open(1440, 900);
  const anz = p.locator('#skills button[aria-label^="ANZ Banking Group"]');
  await anz.hover(); await p.waitForTimeout(500);
  const hov = await p.evaluate(() => {
    const s = document.querySelector('#skills');
    return {
      lit: s.querySelectorAll('svg path[data-lit]').length,
      dimmedWireOpacity: [...s.querySelectorAll('svg path:not([data-lit])')].map((x) => getComputedStyle(x).strokeOpacity)[0],
      dimmedNodeOpacity: [...s.querySelectorAll('[class*="node"]:not([data-lit])')].map((x) => getComputedStyle(x).opacity)[0],
      tracedRows: s.querySelectorAll('tr[data-traced]').length,
      readout: s.querySelector('figure > p')?.textContent?.trim().slice(0, 120),
    };
  });
  console.log('\n=== hover ANZ source node (desktop 1440, no-preference) ===');
  console.log(JSON.stringify(hov, null, 1));

  // keyboard: focus a capability node and check traced row + whether it scrolls
  await p.locator('#skills button[aria-label^="Real-time telemetry platforms"]').focus();
  await p.waitForTimeout(400);
  const kb = await p.evaluate(() => {
    const s = document.querySelector('#skills');
    const tr = s.querySelector('tr[data-traced]');
    return {
      tracedRows: s.querySelectorAll('tr[data-traced]').length,
      tracedRowInViewport: tr ? (() => { const r = tr.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; })() : null,
      tracedRowTop: tr ? Math.round(tr.getBoundingClientRect().top) : null,
      viewportH: innerHeight,
      tracedShadow: tr ? getComputedStyle(tr).boxShadow : null,
      lit: s.querySelectorAll('svg path[data-lit]').length,
    };
  });
  console.log('\n=== keyboard focus on "Real-time telemetry" capability node ===');
  console.log(JSON.stringify(kb, null, 1));

  // Escape / activation semantics
  const act = await p.evaluate(() => {
    const b = document.querySelector('#skills button[aria-label^="ANZ Banking Group"]');
    const before = document.querySelectorAll('#skills tr[data-traced]').length;
    b.click();
    return { hasOnClick: typeof b.onclick, ariaExpanded: b.getAttribute('aria-expanded'), ariaPressed: b.getAttribute('aria-pressed'), ariaControls: b.getAttribute('aria-controls'), before };
  });
  console.log('\n=== node button semantics ===');
  console.log(JSON.stringify(act, null, 1));

  // tab order through the section
  await p.locator('#skills').scrollIntoViewIfNeeded();
  await ctx.close();
}
await browser.close();
