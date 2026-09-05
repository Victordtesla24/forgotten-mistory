import { chromium } from '@playwright/test';

const BASE = 'http://127.0.0.1:5602';
const browser = await chromium.launch({ channel: 'chrome', args: ['--no-sandbox'] });

// ── 1. Hero portrait vs lede at 390 (C-06 clause 3) ─────────────────────────
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => {
    const hero = document.querySelector('#hero');
    const r = (el) => { const b = el.getBoundingClientRect(); return { cls: String(el.className).slice(0, 48), tag: el.tagName, l: +b.left.toFixed(1), t: +b.top.toFixed(1), r: +b.right.toFixed(1), bo: +b.bottom.toFixed(1) }; };
    const all = [...hero.querySelectorAll('[class*="portrait"], [class*="Portrait"]')].map(r);
    const order = [...hero.querySelectorAll('*')].filter(e => /portrait|eyebrow|statement|lede|ledger|actions/i.test(String(e.className))).map(r);
    const h1 = hero.querySelector('h1');
    return { all, order: order.slice(0, 22), h1: r(h1) };
  });
  console.log('=== 390 hero: every element whose class mentions portrait ===');
  for (const x of m.all) console.log(' ', JSON.stringify(x));
  console.log('h1:', JSON.stringify(m.h1));
  console.log('=== 390 hero: DOM-order boxes of the named parts ===');
  for (const x of m.order) console.log(' ', JSON.stringify(x));
  await ctx.close();
}

// ── 2. ledgerSource / ledger boxes at 1440 (C-06 clause 4, .figureNote successor) ──
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  const m = await page.evaluate(() => {
    const hero = document.querySelector('#hero');
    const b = (el) => { const x = el.getBoundingClientRect(); return { cls: String(el.className).slice(0, 40), t: +x.top.toFixed(2), bo: +x.bottom.toFixed(2), h: +x.height.toFixed(2) }; };
    return {
      items: [...hero.querySelectorAll('[class*="ledgerItem"]')].map(b),
      text: [...hero.querySelectorAll('[class*="ledgerText"]')].map(b),
      source: [...hero.querySelectorAll('[class*="ledgerSource"]')].map(b),
      note: [...hero.querySelectorAll('[class*="ledgerNote"], [class*="note"], [class*="Note"]')].map(b),
      ledger: [...hero.querySelectorAll('[class*="ledger"]')].map(e => String(e.className)).filter((v, i, a) => a.indexOf(v) === i),
    };
  });
  console.log('\n=== 1440 hero ledger geometry ===');
  console.log('distinct ledger classes:', JSON.stringify(m.ledger, null, 1));
  console.log('ledgerItem boxes:', JSON.stringify(m.items));
  console.log('ledgerText boxes:', JSON.stringify(m.text));
  console.log('ledgerSource boxes:', JSON.stringify(m.source));
  console.log('note-ish boxes:', JSON.stringify(m.note));
  await ctx.close();
}

// ── 3. Replicate the contrast spec's scroll stepping to locate the failure ──
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await page.locator('#hero h1').waitFor({ state: 'visible', timeout: 15000 });
  const total = await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 500) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
    window.scrollTo(0, 0);
    return document.documentElement.scrollHeight;
  });
  await page.waitForTimeout(2500);
  console.log(`\n=== spec-replica stepping @390 (scrollHeight ${total}, step 844) ===`);
  for (let top = 0; top < total; top += 844) {
    await page.evaluate((y) => window.scrollTo(0, y), top);
    await page.waitForTimeout(350);
    const hit = await page.evaluate(() => {
      const li = document.querySelector('#role-body-ato ul[class*="bullets"] > li:nth-of-type(1)');
      if (!li) return null;
      const tn = [...li.childNodes].find(n => n.nodeType === 3 && (n.textContent || '').trim().length > 2);
      if (!tn) return null;
      const range = document.createRange();
      range.selectNodeContents(tn);
      const rects = [...range.getClientRects()].filter(r => r.width > 1 && r.height > 1);
      if (!rects.length) return null;
      const vw = innerWidth, vh = innerHeight;
      const pts = [];
      for (const r of rects.slice(0, 3)) {
        const y = r.top + r.height / 2;
        for (const f of [0.15, 0.5, 0.85]) {
          const x = r.left + r.width * f;
          if (x >= 0 && x < vw && y >= 0 && y < vh) pts.push([Math.round(x), Math.round(y)]);
        }
      }
      if (!pts.length) return null;
      const launcher = document.querySelector('[data-testid="minivic-toggle"]');
      const lb = launcher ? launcher.getBoundingClientRect() : null;
      return {
        scrollY: Math.round(scrollY),
        color: getComputedStyle(li.parentElement).color,
        pts,
        stacks: pts.map(([x, y]) => document.elementsFromPoint(x, y).slice(0, 3).map(e => `${e.tagName.toLowerCase()}${String(e.className).split(' ').filter(Boolean).slice(0, 2).map(c => '.' + c).join('')}`).join(' → ')),
        launcher: lb ? { l: +lb.left.toFixed(0), t: +lb.top.toFixed(0), r: +lb.right.toFixed(0), bo: +lb.bottom.toFixed(0) } : null,
      };
    });
    if (hit) {
      console.log(`scrollY=${hit.scrollY} li text colour=${hit.color}`);
      console.log(` launcher viewport box = ${JSON.stringify(hit.launcher)}`);
      hit.pts.forEach((p, i) => console.log(`  point ${JSON.stringify(p)} → ${hit.stacks[i]}`));
      // masked-screenshot pixel sample, exactly as the spec does it
      await page.evaluate(() => {
        const s = document.createElement('style');
        s.id = '__m__';
        s.textContent = '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important;transition:none!important}';
        document.head.appendChild(s);
      });
      const png = await page.screenshot({ fullPage: false, animations: 'disabled' });
      await page.evaluate(() => document.getElementById('__m__')?.remove());
      const px = await page.evaluate(async ([b64, pts]) => {
        const img = new Image(); img.src = `data:image/png;base64,${b64}`; await img.decode();
        const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
        const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
        const scale = img.naturalWidth / window.innerWidth;
        return pts.map(([x, y]) => { const d = g.getImageData(Math.round(x * scale), Math.round(y * scale), 1, 1).data; return [d[0], d[1], d[2]]; });
      }, [png.toString('base64'), hit.pts]);
      console.log('  sampled grounds:', JSON.stringify(px));
      const ch = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
      const L = ([r, g, b]) => 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
      const fg = [205, 205, 205];
      const ratios = px.map(bg => { const l1 = L(fg), l2 = L(bg); return +(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05))).toFixed(2); });
      console.log('  per-point ratios vs rgb(205,205,205):', JSON.stringify(ratios));
    }
  }
  await ctx.close();
}

await browser.close();
