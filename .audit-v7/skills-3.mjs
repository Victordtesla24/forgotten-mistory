import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, reducedMotion: 'no-preference' });
const p = await ctx.newPage();
await p.goto('https://forgotten-mistory.web.app/', { waitUntil: 'networkidle', timeout: 90000 });
await p.evaluate(() => document.querySelector('#skills').scrollIntoView());
await p.waitForTimeout(3500);
const o = await p.evaluate(() => {
  const s = document.querySelector('#skills');
  const svg = s.querySelector('svg');
  const vb = svg.getAttribute('viewBox');
  const paths = [...svg.querySelectorAll('path')];
  const spans = paths.map((el) => {
    const a = el.getPointAtLength(0);
    const b = el.getPointAtLength(el.getTotalLength());
    return { x0: +a.x.toFixed(1), y0: +a.y.toFixed(1), x1: +b.x.toFixed(1), y1: +b.y.toFixed(1), len: +el.getTotalLength().toFixed(1) };
  });
  const w = svg.getBoundingClientRect().width;
  const grads = [...svg.querySelectorAll('linearGradient')].map((g) => ({ id: g.id, x1: g.getAttribute('x1'), x2: g.getAttribute('x2'), stops: [...g.querySelectorAll('stop')].map((st) => st.getAttribute('offset') + '@' + st.getAttribute('stop-opacity')) }));
  // pdf link on the page?
  const cvLinks = [...document.querySelectorAll('a[href*="Resume"],a[href*=".pdf"]')].map((a) => ({ href: a.getAttribute('href'), text: a.textContent.trim().slice(0, 30), inSkills: !!a.closest('#skills') }));
  // Does anything in the section state a date or recency?
  const railBoxes = [...s.querySelectorAll('[class*="rail"]')].map((r) => { const b = r.getBoundingClientRect(); return { side: r.dataset.side, x: Math.round(b.x), w: Math.round(b.width) }; });
  return { viewBox: vb, svgWidth: Math.round(w), grads, spans, xStarts: [...new Set(spans.map((x) => x.x0))], xEnds: [...new Set(spans.map((x) => x.x1))], cvLinks, railBoxes, minLen: Math.min(...spans.map((x) => x.len)), maxLen: Math.max(...spans.map((x) => x.len)) };
});
console.log(JSON.stringify(o, null, 1));

// Sample the actual painted pixel of a wire mid-span vs the ground, via screenshot
const shot = await p.locator('#skills figure').screenshot({ path: '/Users/vic/claude/forgotten-mistory/.audit-v7/shots/skills-bench-1440.png' });
console.log('shot bytes', shot.length);
await p.setViewportSize({ width: 390, height: 844 });
await p.evaluate(() => document.querySelector('#skills').scrollIntoView());
await p.waitForTimeout(1500);
await p.locator('#skills figure').screenshot({ path: '/Users/vic/claude/forgotten-mistory/.audit-v7/shots/skills-bench-390.png' });
await browser.close();
