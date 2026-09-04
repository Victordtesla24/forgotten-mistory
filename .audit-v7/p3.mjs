import { chromium } from 'playwright';
const RM = process.argv[2] || 'no-preference';
const browser = await chromium.launch({ args:['--use-gl=angle','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport:{width:1440,height:900}, reducedMotion:RM });
const page = await ctx.newPage();
await page.goto('https://forgotten-mistory.web.app/?gl=force',{waitUntil:'load'});
await page.waitForTimeout(2500);
// full scroll to mount everything
const h = await page.evaluate(()=>document.documentElement.scrollHeight);
for (let y=0;y<h;y+=700){ await page.evaluate(v=>scrollTo(0,v),y); await page.waitForTimeout(90);}
await page.evaluate(()=>scrollTo(0,0)); await page.waitForTimeout(1200);

const inv = await page.evaluate(() => {
  const sel = 'a[href], button, input, textarea, select, summary, [tabindex]:not([tabindex="-1"]), [role="button"], [role="tab"], [role="link"]';
  const els = [...document.querySelectorAll(sel)];
  const section = (el) => { const s = el.closest('section[id]'); return s ? s.id : (el.closest('nav')?'nav':(el.closest('footer')?'footer':'other')); };
  const out = els.map(el => {
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName.toLowerCase(),
      sec: section(el),
      cls: (el.className && typeof el.className==='string' ? el.className : '').slice(0,60),
      label: (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g,' ').slice(0,50),
      cursor: cs.cursor,
      transition: cs.transitionProperty + ' / ' + cs.transitionDuration,
      disabled: el.disabled === true || el.getAttribute('aria-disabled')==='true',
      tabindex: el.getAttribute('tabindex'),
      w: Math.round(el.getBoundingClientRect().width), hgt: Math.round(el.getBoundingClientRect().height),
    };
  });
  return out;
});
console.log('RM=',RM,'interactive count:', inv.length);
const bySec = {}; inv.forEach(i=>{ (bySec[i.sec] ||= []).push(i); });
for (const [k,v] of Object.entries(bySec)) {
  console.log(`\n== ${k} (${v.length}) ==`);
  v.forEach(i=>console.log(`  ${i.tag}.${i.cls} [${i.label}] cursor=${i.cursor} trans=${i.transition} ${i.hgt}px`));
}
await browser.close();
