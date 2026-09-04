import { chromium } from 'playwright';

const args = ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ headless: true, args });

function lum(r, g, b) {
  const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) { const l1 = lum(...a), l2 = lum(...b); const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1]; return (hi + 0.05) / (lo + 0.05); }

async function run(label, opts) {
  const ctx = await browser.newContext({ viewport: opts.viewport, deviceScaleFactor: 1, reducedMotion: opts.rm, javaScriptEnabled: opts.js !== false });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 120)); });
  await p.goto('https://forgotten-mistory.web.app/', { waitUntil: 'networkidle', timeout: 90000 });
  await p.evaluate(() => document.querySelector('#skills')?.scrollIntoView());
  await p.waitForTimeout(3500);
  const o = await p.evaluate(() => {
    const s = document.querySelector('#skills');
    if (!s) return { missing: true };
    const paths = [...s.querySelectorAll('svg path')];
    const cs = (el) => getComputedStyle(el);
    const svg = s.querySelector('svg');
    const bench = s.querySelector('figure');
    const focusables = [...s.querySelectorAll('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])')];
    return {
      sectionRect: s.getBoundingClientRect().toJSON(),
      svgCount: s.querySelectorAll('svg').length,
      svgDisplay: svg ? cs(svg).display : null,
      svgViewBox: svg ? svg.getAttribute('viewBox') : null,
      svgAriaHidden: svg ? svg.getAttribute('aria-hidden') : null,
      pathCount: paths.length,
      pathStrokes: paths.map((p) => ({ stroke: p.getAttribute('stroke'), cls: p.className.baseVal, w: cs(p).strokeWidth, so: cs(p).strokeOpacity, op: cs(p).opacity })),
      goldPaths: paths.filter((p) => (p.getAttribute('stroke') || '').includes('gold')).length,
      greyPaths: paths.filter((p) => (p.getAttribute('stroke') || '').includes('grey')).length,
      figureRole: bench ? { tag: bench.tagName, role: bench.getAttribute('role'), label: bench.getAttribute('aria-label'), labelledby: bench.getAttribute('aria-labelledby') } : null,
      figcaption: s.querySelector('figcaption')?.textContent?.trim().slice(0, 200) ?? null,
      focusCount: focusables.length,
      focusTags: focusables.map((e) => e.tagName + ':' + (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 44)),
      smallTargets: focusables.map((e) => { const r = e.getBoundingClientRect(); return { t: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height) }; }).filter((x) => x.h < 24),
      tableRows: s.querySelectorAll('table tbody tr').length,
      hiddenRows: s.querySelectorAll('table tbody tr[hidden]').length,
      liveRegions: [...s.querySelectorAll('[role="status"],[aria-live]')].map((e) => e.textContent.trim().slice(0, 60)),
      goldComputed: [...s.querySelectorAll('*')].map((e) => { const c = cs(e); return { color: c.color, bg: c.backgroundColor, bs: c.boxShadow, bc: c.borderColor, t: (e.textContent || '').trim().slice(0, 30), cls: (e.className.baseVal ?? e.className ?? '').toString().slice(0, 40) }; }).filter((x) => /201,\s*168,\s*76|c9a84c|212,\s*182,\s*92|232,\s*213,\s*163/i.test(x.color + x.bg + x.bs + x.bc)),
      sectionBg: (() => { let el = s; while (el) { const b = cs(el).backgroundColor; if (b && b !== 'rgba(0, 0, 0, 0)') return b; el = el.parentElement; } return null; })(),
      lede: s.querySelector('p')?.textContent?.slice(0, 40),
      hasProficiency: s.querySelectorAll('progress,meter,[role="progressbar"]').length,
      caliperStates: [...s.querySelectorAll('[data-state]')].map((e) => e.getAttribute('data-state')),
      dataAttrs: [...new Set([...s.querySelectorAll('*')].flatMap((e) => [...e.attributes].map((a) => a.name).filter((n) => n.startsWith('data-'))))],
      textLen: s.innerText.length,
      innerTextHead: s.innerText.slice(0, 380),
    };
  });
  o.__label = label;
  o.__console = errs.slice(0, 8);
  await ctx.close();
  return o;
}

const desktop = await run('desktop-1440-nopref', { viewport: { width: 1440, height: 900 }, rm: 'no-preference' });
console.log('=== DESKTOP 1440 no-preference GPU=angle/metal ===');
console.log(JSON.stringify(desktop, null, 1));

const reduced = await run('desktop-1440-reduce', { viewport: { width: 1440, height: 900 }, rm: 'reduce' });
console.log('=== DESKTOP 1440 prefers-reduced-motion:reduce ===');
console.log(JSON.stringify({ pathCount: reduced.pathCount, goldPaths: reduced.goldPaths, pathStrokes: reduced.pathStrokes.slice(0, 3), focusCount: reduced.focusCount, goldComputed: reduced.goldComputed }, null, 1));

const mobile = await run('mobile-390', { viewport: { width: 390, height: 844 }, rm: 'no-preference' });
console.log('=== MOBILE 390 no-preference ===');
console.log(JSON.stringify({ svgDisplay: mobile.svgDisplay, pathCount: mobile.pathCount, goldPaths: mobile.goldPaths, focusCount: mobile.focusCount, smallTargets: mobile.smallTargets, goldComputed: mobile.goldComputed, textLen: mobile.textLen, figcaption: mobile.figcaption }, null, 1));

const nojs = await run('desktop-nojs', { viewport: { width: 1440, height: 900 }, rm: 'no-preference', js: false });
console.log('=== DESKTOP 1440 JS DISABLED ===');
console.log(JSON.stringify({ svgViewBox: nojs.svgViewBox, pathCount: nojs.pathCount, focusCount: nojs.focusCount, figcaption: nojs.figcaption, tableRows: nojs.tableRows, textLen: nojs.textLen }, null, 1));

console.log('=== CONTRAST ===');
console.log('gold #c9a84c on #0A0B0D', ratio([201, 168, 76], [10, 11, 13]).toFixed(2));
console.log('gold wire (0.62 over ink900) #806C34 on #0A0B0D', ratio([128, 108, 52], [10, 11, 13]).toFixed(2));
console.log('grey wire (mist400 @0.5 over ink900) on #0A0B0D', ratio([74, 77, 84], [10, 11, 13]).toFixed(2));
console.log('gold dot @0.9 on #0A0B0D', ratio([182, 152, 70], [10, 11, 13]).toFixed(2));
console.log('mist-400 #8A8F9A on #0A0B0D', ratio([138, 143, 154], [10, 11, 13]).toFixed(2));
console.log('ink-300 #6E7178 on #0A0B0D', ratio([110, 113, 120], [10, 11, 13]).toFixed(2));
console.log('wire fade end (gold @0.06) on ink900', ratio([21, 20, 17], [10, 11, 13]).toFixed(2));

await browser.close();
