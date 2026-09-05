import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://127.0.0.1:5616';
const VPS = [[1440, 900], [1280, 800], [834, 1194], [390, 844]];
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const out = {};
for (const [w, h] of VPS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1800);
  out[`${w}x${h}`] = await page.evaluate(() => {
    const hero = document.querySelector('#hero');
    const ih = window.innerHeight;
    const inFold = (el) => { const r = el.getBoundingClientRect(); return r.top < ih && r.bottom > 0 && r.width > 0 && r.height > 0; };
    const ctas = [...hero.querySelectorAll('a[href], button')].filter(inFold);
    const groups = new Map();
    for (const a of ctas) {
      const g = a.parentElement;
      const key = (g?.dataset?.testid) || (g?.className?.toString?.() || '') || 'ROOT';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push((a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 40));
    }
    const leaves = [...hero.querySelectorAll('*')].filter((el) => el.children.length === 0 && (el.innerText || '').trim().length > 1 && inFold(el));
    const r = (el) => { if (!el) return null; const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), w: Math.round(b.width) }; };
    const paras = [...hero.querySelectorAll('p, li')].filter(inFold).map((p) => ({ words: (p.innerText || '').trim().split(/\s+/).filter(Boolean).length }));
    const img = hero.querySelector('[data-testid="hero-portrait"] img');
    return {
      innerHeight: ih,
      fold: r(hero.querySelector('[data-testid="hero-fold"]')),
      proof: r(hero.querySelector('[data-testid="hero-proof"]')),
      actions: r(hero.querySelector('[data-testid="hero-actions"]')),
      ulTop: Math.round(hero.querySelector('ul').getBoundingClientRect().top),
      availTop: Math.round(hero.querySelector('[data-testid="hero-availability"]').getBoundingClientRect().top),
      ctaGroupCount: groups.size,
      ctaGroups: [...groups.entries()].map(([k, v]) => ({ group: k.slice(0, 60), items: v })),
      textLeaves: leaves.length,
      leafSample: leaves.map((l) => l.innerText.trim().slice(0, 32)),
      parasOver12: paras.filter((p) => p.words > 12).length,
      photo: img ? { ...r(img), src: (img.currentSrc || img.src).split('/').pop() } : null,
      portrait: r(hero.querySelector('[data-testid="hero-portrait"]')),
    };
  });
  await ctx.close();
}
console.log(JSON.stringify(out, null, 1));
await browser.close();
