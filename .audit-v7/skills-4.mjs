import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });

const SATURATED = [[201, 168, 76], [212, 182, 92]];

const perView = (golds) => {
  const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 }; };
  const isGold = (s) => { const c = parse(s); if (!c || c.a === 0) return false; return golds.some((g) => Math.abs(c.rgb[0] - g[0]) <= 2 && Math.abs(c.rgb[1] - g[1]) <= 2 && Math.abs(c.rgb[2] - g[2]) <= 2); };
  const props = ['color', 'backgroundColor', 'borderTopColor', 'borderLeftColor', 'fill', 'stroke', 'boxShadow', 'outlineColor'];
  const out = [];
  const s = document.querySelector('#skills');
  if (!s) return out;
  for (const el of s.querySelectorAll('*')) {
    const b = el.getBoundingClientRect();
    if (b.width < 0.5 || b.height < 0.5) continue;
    if (b.bottom <= 0 || b.top >= innerHeight) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) continue;
    // svg paths referencing the gold gradient
    if (el.tagName.toLowerCase() === 'path' && (el.getAttribute('stroke') || '').includes('gold')) { out.push({ tag: 'path', via: 'url(#bench-wire-gold)', t: '' }); continue; }
    for (const p of props) {
      const v = cs[p];
      if (typeof v !== 'string' || !isGold(v)) continue;
      if (p === 'color') { const owns = [...el.childNodes].some((n) => n.nodeType === 3 && (n.textContent || '').trim().length); if (!owns) continue; }
      out.push({ tag: el.tagName.toLowerCase(), via: `${p}: ${v}`, t: (el.textContent || '').trim().slice(0, 24), cls: (el.className.baseVal ?? el.className ?? '').toString().slice(0, 34) });
      break;
    }
  }
  return out;
};

for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  await p.goto('https://forgotten-mistory.web.app/', { waitUntil: 'networkidle', timeout: 90000 });
  await p.evaluate(() => document.querySelector('#skills').scrollIntoView());
  await p.waitForTimeout(3000);
  const top = await p.evaluate(() => Math.round(document.querySelector('#skills').getBoundingClientRect().top + scrollY));
  const secH = await p.evaluate(() => Math.round(document.querySelector('#skills').getBoundingClientRect().height));
  const steps = [0, 0.25, 0.5, 0.75].map((f) => Math.round(top + f * secH));
  console.log(`\n### ${w}x${h} · reduced-motion no-preference · GPU angle/metal · section top=${top} height=${secH}`);
  for (const y of steps) {
    await p.evaluate((yy) => scrollTo(0, yy), y);
    await p.waitForTimeout(500);
    const marks = await p.evaluate(perView, SATURATED);
    const byVia = {};
    for (const m of marks) { const k = m.via.split(':')[0] + (m.cls ? '|' + m.cls.replace(/__[\w-]+/g, '') : ''); byVia[k] = (byVia[k] || 0) + 1; }
    console.log(`  scrollY=${y}  saturated gold marks in viewport = ${marks.length}   ${JSON.stringify(byVia)}`);
  }
  await ctx.close();
}
await browser.close();
